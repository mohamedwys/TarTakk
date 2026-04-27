import { supabase } from "./supabase";

// Drop-in replacement for the three chat/messaging functions in lib/api.ts.
// Same function signatures and response shapes so messages.tsx and
// chat/[id].tsx keep rendering with no other code changes.
//
// Adds `subscribeToMessages` for realtime — the bit that replaces the
// socket.io polling/event stream the chat screen used before.

type AnyRow = Record<string, any>;

// --- shape mappers ---------------------------------------------------------

const formatTimeOfDay = (iso: string | null | undefined): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// Supabase messages row → the legacy `Message` shape the chat screen reads
// ({ id, text, senderId, timestamp, isRead, conversationId }).
const messageFromRow = (row: AnyRow): AnyRow => ({
  id: row.id,
  text: row.content,
  content: row.content,
  senderId: row.sender_id,
  conversationId: row.conversation_id,
  isRead: row.is_read ?? false,
  timestamp: formatTimeOfDay(row.created_at),
  createdAt: row.created_at,
  sender: row.sender ?? null,
});

// Conversations row + joined buyer/seller/product → the legacy
// `Conversation` shape consumed by messages.tsx, with the OTHER party's
// fields (name/avatar) and the per-side unread count.
const conversationFromRow = (row: AnyRow, currentUserId: string): AnyRow => {
  const isBuyer = row.buyer_id === currentUserId;
  const other = isBuyer ? row.seller : row.buyer;
  const product = row.products ?? null;
  const unread = isBuyer ? row.buyer_unread : row.seller_unread;

  return {
    id: row.id,
    userId: other?.id ?? null,
    userName: other?.name ?? "",
    userAvatar: other?.avatar_url ?? "",
    user: other
      ? {
          _id: other.id,
          id: other.id,
          name: other.name,
          avatar: other.avatar_url,
        }
      : null,
    productId: product?.id ?? row.product_id ?? null,
    productTitle: product?.title ?? "",
    productImage: product?.thumbnail_url ?? product?.images?.[0] ?? "",
    product: product
      ? {
          id: product.id,
          title: product.title,
          image: product.thumbnail_url ?? product.images?.[0] ?? "",
          price: Number(product.price ?? 0),
          currency: product.currency ?? "MAD",
        }
      : null,
    lastMessage: row.last_message ?? "",
    lastMessageTime: row.last_message_at ?? row.created_at,
    unreadCount: unread ?? 0,
    isOnline: false, // presence is not tracked yet — keep field for UI parity
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    createdAt: row.created_at,
  };
};

const requireUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("Not authenticated");
  return data.user.id;
};

// --- public API ------------------------------------------------------------

export const conversationsAPI = {
  /**
   * List conversations the current user participates in (as buyer or seller).
   * Returns `{ conversations }` matching the legacy REST shape consumed by
   * app/(tabs)/messages.tsx.
   */
  getConversations: async () => {
    console.log("💬 supabase getConversations");

    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        products ( id, title, thumbnail_url, images, price, currency ),
        buyer:profiles!buyer_id ( id, name, avatar_url ),
        seller:profiles!seller_id ( id, name, avatar_url )
      `
      )
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("❌ getConversations failed:", error.message);
      throw new Error(error.message);
    }

    const conversations = (data ?? []).map((row: AnyRow) =>
      conversationFromRow(row, userId)
    );
    return { conversations };
  },

  /**
   * Fetch all messages for one conversation, oldest first (matches the
   * FlatList scroll order in chat/[id].tsx).
   * Returns `{ messages }` matching the legacy REST shape.
   */
  getMessages: async (id: string) => {
    console.log("💬 supabase getMessages", id);

    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        sender:profiles!sender_id ( id, name, avatar_url )
      `
      )
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ getMessages failed:", error.message);
      throw new Error(error.message);
    }

    const messages = (data ?? []).map(messageFromRow);
    return { messages };
  },
};

export const messagesAPI = {
  /**
   * Send a message in an existing conversation. The
   * `update_conversation_on_message` trigger maintains last_message and
   * the unread counters server-side.
   * Returns `{ message }` shaped like a row from getMessages so callers can
   * use the result interchangeably (e.g. replace an optimistic stub).
   */
  sendMessage: async (data: { conversationId: string; content: string }) => {
    console.log("💬 supabase sendMessage", data.conversationId);

    const senderId = await requireUserId();
    const trimmed = data.content.trim();
    if (!trimmed) {
      throw new Error("Message content is empty");
    }

    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversationId,
        sender_id: senderId,
        content: trimmed,
      })
      .select(
        `
        *,
        sender:profiles!sender_id ( id, name, avatar_url )
      `
      )
      .single();

    if (error) {
      console.error("❌ sendMessage failed:", error.message);
      throw new Error(error.message);
    }

    return { message: messageFromRow(row as AnyRow) };
  },
};

// --- realtime --------------------------------------------------------------

/**
 * Subscribe to new messages in a conversation. Returns an unsubscribe
 * function — call it from the cleanup of the consuming useEffect.
 *
 * Drop-in replacement for the socket.io listener that previously powered
 * chat/[id].tsx. Inserts emit the same shape as getMessages() rows so the
 * existing FlatList renderer handles them without changes.
 *
 *   const off = subscribeToMessages(id, (msg) => setMessages(p => [...p, msg]));
 *   return () => off();
 */
export const subscribeToMessages = (
  conversationId: string,
  onMessage: (msg: AnyRow) => void
): (() => void) => {
  console.log("📡 subscribeToMessages", conversationId);

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const shaped = messageFromRow(payload.new as AnyRow);
        onMessage(shaped);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("📡 messages channel subscribed:", conversationId);
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("📡 messages channel error:", status, conversationId);
      }
    });

  return () => {
    console.log("📡 unsubscribe messages", conversationId);
    supabase.removeChannel(channel);
  };
};
