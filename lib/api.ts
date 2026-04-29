import { router } from "expo-router";
import { supabase } from "./supabase";

// Supabase-backed auth. Source of truth: lib/supabase-auth.ts.
// Same exported name and same per-method signatures as the legacy REST
// authAPI so login/register/forgot-password screens and AuthContext keep
// working without other code changes.
export const authAPI = {
  /**
   * Register a new user.
   *
   * On success the user is NOT auto-logged-in — Supabase's "Confirm
   * email" setting requires them to click the magic link first. We
   * navigate to the verify-email screen with the email as a route
   * param so the screen can show "we sent a link to ${email}" without
   * extra state plumbing. token/session are intentionally omitted from
   * the return so callers can't accidentally treat the user as
   * authenticated.
   */
  register: async (data: { name: string; email: string; password: string }) => {
    console.log("🔐 supabase.auth.signUp", data.email);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // Stored in raw_user_meta_data; the handle_new_user trigger reads
        // this when it auto-creates the profile row on signup.
        data: { name: data.name },
      },
    });

    if (error) {
      console.error("❌ signUp failed:", error.message);
      throw new Error(error.message);
    }

    const user = signUpData.user;
    if (!user) {
      throw new Error("Sign up failed: no user returned");
    }

    // Belt-and-suspenders: the trigger in 004_functions.sql normally creates
    // the profile, but if it isn't installed (or the user existed already)
    // upsert keeps the row in sync with the name supplied here.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          name: data.name,
          email: data.email,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("⚠️ profile upsert failed:", profileError.message);
    }

    // Send the user to the "check your email" screen. Email is passed
    // as a route param so the screen can render it without reading
    // AsyncStorage. Use replace so the back button doesn't drop the
    // user back into the registration form.
    router.replace({
      pathname: "/(auth)/verify-email",
      params: { email: data.email },
    });

    return {
      user,
      needsEmailConfirmation: true,
    };
  },

  /**
   * Log in with email + password.
   *
   * Returns `{ user, token }` to match the legacy REST response so existing
   * callers (login.tsx, AuthContext) keep working without changes.
   */
  login: async (data: { email: string; password: string }) => {
    console.log("🔐 supabase.auth.signInWithPassword", data.email);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error("❌ signIn failed:", error.message);
      throw new Error(error.message);
    }

    if (!signInData.session || !signInData.user) {
      throw new Error("Login failed: missing session");
    }

    return {
      user: signInData.user,
      token: signInData.session.access_token,
      session: signInData.session,
    };
  },

  /**
   * Sign the current user out and clear the persisted session.
   */
  logout: async () => {
    console.log("🔐 supabase.auth.signOut");

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ signOut failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Email a password-reset link. The link opens the app at
   * `tartakk://reset-password` where the reset-password screen finishes the
   * flow with `supabase.auth.updateUser({ password })`.
   */
  forgotPassword: async (data: { email: string }) => {
    console.log("🔐 supabase.auth.resetPasswordForEmail", data.email);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: "tartakk://reset-password",
    });

    if (error) {
      console.error("❌ resetPasswordForEmail failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

// ---------------------------------------------------------------
// Notifications — supabase.from("notifications")
// ---------------------------------------------------------------

// notifications/index.tsx reads `read` (legacy) on each row, not `is_read`.
// Map the column so the screen doesn't have to change.
const fromNotificationRow = (row: AnyRow): AnyRow => ({
  id: row.id,
  _id: row.id,
  type: row.type,
  title: row.title,
  message: row.message ?? "",
  read: row.is_read ?? false,
  is_read: row.is_read ?? false,
  isRead: row.is_read ?? false,
  actionId: row.action_id ?? null,
  action_id: row.action_id ?? null,
  userId: row.user_id,
  user_id: row.user_id,
  createdAt: row.created_at,
  created_at: row.created_at,
});

export const notificationsAPI = {
  /**
   * Paginated list of the current user's notifications. Returns
   * `{ notifications, pagination: { page, pages, total, limit } }` so the
   * existing infinite-scroll logic in notifications/index.tsx keeps working.
   */
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    filter?: "all" | "unread";
  }) => {
    console.log("🔔 supabase getNotifications", params);

    const userId = await requireUserId();

    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (params?.filter === "unread") {
      query = query.eq("is_read", false);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("❌ getNotifications failed:", error.message);
      throw new Error(error.message);
    }

    const total = count ?? 0;
    const pages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      notifications: (data ?? []).map(fromNotificationRow),
      pagination: { page, pages, total, limit },
    };
  },

  /**
   * Insert a notification for another user. Field names accept the legacy
   * camelCase shape and are translated to the schema's snake_case columns.
   */
  createNotification: async (data: {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    avatar?: string;
    productImage?: string;
    actionId?: string;
    relatedUserId?: string;
    relatedProductId?: string;
  }) => {
    console.log("🔔 supabase createNotification", data.type);

    const { data: row, error } = await supabase
      .from("notifications")
      .insert({
        user_id: data.recipientId,
        type: data.type,
        title: data.title,
        message: data.message,
        action_id:
          data.actionId ?? data.relatedProductId ?? data.relatedUserId ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ createNotification failed:", error.message);
      throw new Error(error.message);
    }

    return { notification: fromNotificationRow(row as AnyRow) };
  },

  /**
   * Mark all of the current user's notifications as read.
   */
  markAllAsRead: async () => {
    console.log("🔔 supabase markAllAsRead");

    const userId = await requireUserId();

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("❌ markAllAsRead failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Delete every notification for the current user.
   */
  clearAll: async () => {
    console.log("🔔 supabase clearAll");

    const userId = await requireUserId();

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("❌ clearAll failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (id: string) => {
    console.log("🔔 supabase markAsRead", id);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("❌ markAsRead failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Delete a single notification.
   */
  deleteNotification: async (id: string) => {
    console.log("🔔 supabase deleteNotification", id);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("❌ deleteNotification failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Count unread notifications for the current user.
   */
  getUnreadCount: async () => {
    console.log("🔔 supabase getUnreadCount");

    const userId = await requireUserId();

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("❌ getUnreadCount failed:", error.message);
      throw new Error(error.message);
    }

    return { count: count ?? 0, unreadCount: count ?? 0 };
  },
};


// ---------------------------------------------------------------
// Shared helpers (used by every Supabase-backed API below)
// ---------------------------------------------------------------

type AnyRow = Record<string, any>;

const requireUserId = async (): Promise<string> => {
  // getSession() reads from the SecureStore-backed local cache; no
  // network round-trip. getUser() hits Supabase to verify the JWT and
  // can hang on flaky networks, which used to wedge AuthContext's
  // hydrateFromSession behind a slow round-trip.
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.user) throw new Error("Not authenticated");
  return data.session.user.id;
};

// ---------------------------------------------------------------
// Products — source of truth: lib/supabase-products.ts
// ---------------------------------------------------------------

// Existing UI sends legacy condition strings; the schema only allows the four
// FR values. Map both directions so legacy callers stay compatible.
const LEGACY_TO_SCHEMA_CONDITION: Record<string, string> = {
  new: "neuf",
  like_new: "très_bon",
  very_good: "très_bon",
  good: "bon",
  fair: "acceptable",
  poor: "acceptable",
  neuf: "neuf",
  "très_bon": "très_bon",
  bon: "bon",
  acceptable: "acceptable",
};

const PRODUCT_WITH_RELATIONS = `
  *,
  seller:profiles!seller_id (
    id, name, avatar_url, phone_number, whatsapp,
    rating, review_count, is_verified, city,
    regions ( id, name_fr, name_ar )
  ),
  categories ( id, name_fr, name_ar, slug ),
  regions ( id, name_fr, name_ar )
`;

const deriveStatus = (row: AnyRow): "active" | "sold" | "expired" => {
  if ((row.stock_qty ?? 1) <= 0) return "sold";
  if (row.is_active === false) return "expired";
  if (row.expires_at && new Date(row.expires_at) < new Date()) return "expired";
  return "active";
};

// Map a Supabase row + joins to the legacy response shape used by the
// existing screens (camelCase keys, nested seller/location, derived status).
const fromProductRow = (row: AnyRow | null): AnyRow | null => {
  if (!row) return null;

  const sellerRow = row.seller ?? null;
  const categoryRow = row.categories ?? null;
  const regionRow = row.regions ?? null;

  const seller = sellerRow
    ? {
        _id: sellerRow.id,
        id: sellerRow.id,
        name: sellerRow.name,
        avatar: sellerRow.avatar_url,
        avatar_url: sellerRow.avatar_url,
        phoneNumber: sellerRow.phone_number,
        whatsapp: sellerRow.whatsapp,
        rating: Number(sellerRow.rating ?? 0),
        totalReviews: sellerRow.review_count ?? 0,
        review_count: sellerRow.review_count ?? 0,
        emailVerified: sellerRow.is_verified ?? false,
        is_verified: sellerRow.is_verified ?? false,
        city: sellerRow.city,
        region: sellerRow.regions?.name_fr,
      }
    : null;

  return {
    ...row,
    id: row.id,
    _id: row.id,
    sellerId: seller ? { _id: seller._id, ...seller } : row.seller_id,
    seller_id: row.seller_id,
    seller,
    category: categoryRow?.slug ?? categoryRow?.name_fr ?? row.category_id,
    categoryId: row.category_id,
    category_id: row.category_id,
    categoryDetails: categoryRow,
    region: regionRow?.name_fr ?? null,
    regionId: row.region_id,
    region_id: row.region_id,
    location: {
      city: row.city ?? null,
      state: regionRow?.name_fr ?? null,
      region: regionRow?.name_fr ?? null,
      country: "MAR",
    },
    images: (row.images ?? []).filter(
      (u: unknown) => typeof u === "string" && u.trim() !== ""
    ),
    thumbnail:
      row.thumbnail_url ??
      (row.images ?? []).find(
        (u: unknown) => typeof u === "string" && u.trim() !== ""
      ) ??
      null,
    isNegotiable: row.is_negotiable,
    listingType: row.listing_type,
    isFeatured: row.is_featured,
    isUrgent: row.is_urgent,
    viewCount: row.view_count,
    likeCount: row.like_count,
    stockQty: row.stock_qty,
    minOrderQty: row.min_order_qty,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    currency: row.currency ?? "MAD",
    status: deriveStatus(row),
  };
};

// Map legacy/UI input back to the snake_case columns Postgres expects.
// Unknown legacy fields (brand, modelNumber, shippingAvailable, tags...) are
// silently dropped — they aren't in the schema. Currency is always MAD.
const toProductRow = (input: AnyRow): AnyRow => {
  const row: AnyRow = {
    title: input.title,
    title_ar: input.title_ar ?? input.titleAr,
    description: input.description,
    description_ar: input.description_ar ?? input.descriptionAr,
    price:
      typeof input.price === "string" ? parseFloat(input.price) : input.price,
    currency: "MAD",
    is_negotiable: input.is_negotiable ?? input.isNegotiable ?? false,
    listing_type: input.listing_type ?? input.listingType ?? "C2C",
    min_order_qty: input.min_order_qty ?? input.minOrderQty ?? 1,
    stock_qty: input.stock_qty ?? input.stockQty ?? 1,
    images: input.images ?? [],
    thumbnail_url:
      input.thumbnail_url ?? input.thumbnailUrl ?? input.images?.[0] ?? null,
    is_featured: input.is_featured ?? input.isFeatured ?? false,
    is_urgent: input.is_urgent ?? input.isUrgent ?? false,
  };

  if (input.condition) {
    row.condition =
      LEGACY_TO_SCHEMA_CONDITION[input.condition] ?? input.condition;
  }
  if (input.category_id) row.category_id = input.category_id;
  else if (input.categoryId) row.category_id = input.categoryId;

  if (input.region_id) row.region_id = input.region_id;
  else if (input.regionId) row.region_id = input.regionId;

  if (input.city) row.city = input.city;
  else if (input.location?.city) row.city = input.location.city;

  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
};

// Legacy English category names → schema's French `name_fr`. The app
// still passes English labels (Books, Electronics, ...) so getProducts
// translates them to the matching French row in the categories table
// before calling search_products.
const CATEGORY_MAP: Record<string, string> = {
  Books: "Autres",
  Beauty: "Autres",
  Electronics: "Électronique",
  Home: "Maison & Jardin",
  Toys: "Loisirs & Sport",
  Vehicles: "Véhicules",
  Fashion: "Mode & Vêtements",
  Sports: "Loisirs & Sport",
  Furniture: "Maison & Jardin",
  Garden: "Maison & Jardin",
  Jobs: "Emploi & Services",
  Animals: "Animaux",
  Agriculture: "Agriculture",
  "Real Estate": "Immobilier",
  Other: "Autres",
};

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const productsAPI = {
  /**
   * List products. Accepts the legacy URLSearchParams-style options
   * (search, category, region, type, minPrice, maxPrice, condition, page).
   * Uses the search_products RPC for filtering + ordering.
   * Returns `{ products: [...] }`.
   */
  getProducts: async (params?: AnyRow) => {
    console.log("📦 supabase getProducts", params);

    // Resolve a category filter that arrived as a name (e.g. "Electronics")
    // into a UUID by translating through CATEGORY_MAP and looking up the
    // matching `name_fr` / `slug` in the categories table. UUIDs pass
    // through untouched. If the lookup yields no row we send null so the
    // RPC simply skips the category filter rather than returning nothing.
    let categoryId: string | null =
      params?.category ?? params?.category_id ?? null;
    if (categoryId && !isUUID(categoryId)) {
      const mapped = CATEGORY_MAP[categoryId] ?? categoryId;
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .or(`name_fr.ilike.${mapped},slug.ilike.${mapped}`)
        .maybeSingle();
      categoryId = cat?.id ?? null;
    }

    const { data, error } = await supabase.rpc("search_products", {
      search_term: params?.search ?? null,
      region_filter: params?.region ?? params?.region_id ?? null,
      category_filter: categoryId,
      listing_type_filter:
        params?.type ?? params?.listing_type ?? params?.listingType ?? null,
      min_price:
        params?.minPrice !== undefined ? Number(params.minPrice) : null,
      max_price:
        params?.maxPrice !== undefined ? Number(params.maxPrice) : null,
      condition_filter:
        params?.condition && LEGACY_TO_SCHEMA_CONDITION[params.condition]
          ? LEGACY_TO_SCHEMA_CONDITION[params.condition]
          : params?.condition ?? null,
      page_num: params?.page ? Number(params.page) : 0,
      page_size: params?.limit ? Number(params.limit) : 20,
    });

    if (error) {
      console.error("❌ getProducts failed:", error.message);
      throw new Error(error.message);
    }

    const products = (data ?? []).map((row: AnyRow) => fromProductRow(row)!);
    return { products };
  },

  /**
   * Fetch one product with seller + category + region joined.
   * Returns `{ product }`.
   */
  getProduct: async (id: string) => {
    console.log("📦 supabase getProduct", id);

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_WITH_RELATIONS)
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ getProduct failed:", error.message);
      throw new Error(error.message);
    }

    // Best-effort view counter.
    supabase
      .rpc("increment_product_views", { p_id: id })
      .then(({ error: rpcError }) => {
        if (rpcError)
          console.warn("⚠️ increment views failed:", rpcError.message);
      });

    return { product: fromProductRow(data as AnyRow) };
  },

  /**
   * Alias kept for screens that import it under the old name.
   */
  getProductById: async (id: string) => productsAPI.getProduct(id),

  /**
   * Create a new product owned by the current user. Currency hardcoded MAD.
   */
  createProduct: async (data: AnyRow) => {
    console.log("📦 supabase createProduct", data?.title);

    const sellerId = await requireUserId();

    const { data: row, error } = await supabase
      .from("products")
      .insert({ ...toProductRow(data), seller_id: sellerId })
      .select(PRODUCT_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ createProduct failed:", error.message);
      throw new Error(error.message);
    }

    return { product: fromProductRow(row as AnyRow) };
  },

  /**
   * Update fields on a product the current user owns. RLS enforces
   * ownership, so we don't repeat the seller_id check here.
   */
  updateProduct: async (id: string, data: AnyRow) => {
    console.log("📦 supabase updateProduct", id);

    const { data: row, error } = await supabase
      .from("products")
      .update(toProductRow(data))
      .eq("id", id)
      .select(PRODUCT_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ updateProduct failed:", error.message);
      throw new Error(error.message);
    }

    return { product: fromProductRow(row as AnyRow) };
  },

  /**
   * Soft-delete: flip is_active to false so the listing disappears from
   * public reads but stays referenced by conversations/favorites.
   */
  deleteProduct: async (id: string) => {
    console.log("📦 supabase deleteProduct", id);

    const { error } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("❌ deleteProduct failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Listings owned by the current authenticated user, newest first.
   */
  getMyListings: async (_params?: AnyRow) => {
    console.log("📦 supabase getMyListings");

    const sellerId = await requireUserId();

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_WITH_RELATIONS)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getMyListings failed:", error.message);
      throw new Error(error.message);
    }

    const products = (data ?? []).map((row: AnyRow) => fromProductRow(row)!);
    return { products };
  },

  /**
   * Public listings for any user (used on the seller profile screen).
   */
  getListingsByUser: async (userId: string) => {
    console.log("📦 supabase getListingsByUser", userId);

    const { data, error } = await supabase
      .from("products")
      .select(PRODUCT_WITH_RELATIONS)
      .eq("seller_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getListingsByUser failed:", error.message);
      throw new Error(error.message);
    }

    const products = (data ?? []).map((row: AnyRow) => fromProductRow(row)!);
    return { products };
  },

  /**
   * Similar/related products in the same category, optionally excluding
   * the current product. Accepts either a UUID category_id or a slug.
   */
  getProductsByCategory: async (category: string, excludeId?: string) => {
    console.log("📦 supabase getProductsByCategory", category);

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        category
      );

    let categoryId = category;
    if (!isUuid) {
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category)
        .maybeSingle();
      if (catErr) {
        console.error("❌ category lookup failed:", catErr.message);
        throw new Error(catErr.message);
      }
      if (!cat) return { products: [] };
      categoryId = cat.id;
    }

    let query = supabase
      .from("products")
      .select(PRODUCT_WITH_RELATIONS)
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (excludeId) query = query.neq("id", excludeId);

    const { data, error } = await query;

    if (error) {
      console.error("❌ getProductsByCategory failed:", error.message);
      throw new Error(error.message);
    }

    const products = (data ?? []).map((row: AnyRow) => fromProductRow(row)!);
    return { products };
  },
};

// ---------------------------------------------------------------
// Users — supabase.from("profiles") with regions joined
// ---------------------------------------------------------------

const PROFILE_WITH_REGION = `*, regions ( id, name_fr, name_ar )`;

// Map a profiles row (with regions joined) to the legacy user shape the
// existing screens read (_id alias, totalReviews, location string, etc.).
const fromProfileRow = (row: AnyRow | null, authUser?: any): AnyRow | null => {
  if (!row) return null;

  const region = row.regions ?? null;
  const verified = !!(row.is_verified || authUser?.email_confirmed_at);
  const locationParts = [row.city, region?.name_fr].filter(Boolean);

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email ?? authUser?.email ?? null,
    emailVerified: authUser?.email_confirmed_at
      ? new Date(authUser.email_confirmed_at)
      : verified
      ? new Date(row.created_at ?? Date.now())
      : null,
    verified,
    is_verified: row.is_verified ?? false,
    isVerified: row.is_verified ?? false,
    avatar: row.avatar_url ?? null,
    avatar_url: row.avatar_url ?? null,
    phoneNumber: row.phone_number ?? null,
    phone_number: row.phone_number ?? null,
    bio: row.bio ?? null,
    whatsapp: row.whatsapp ?? null,
    role: row.role ?? "buyer",
    accountType: row.account_type ?? "C2C",
    account_type: row.account_type ?? "C2C",
    companyName: row.company_name ?? null,
    company_name: row.company_name ?? null,
    isBanned: row.is_banned ?? false,
    is_banned: row.is_banned ?? false,
    rating: Number(row.rating ?? 0),
    totalReviews: row.review_count ?? 0,
    review_count: row.review_count ?? 0,
    totalSales: 0, // not tracked yet
    region: region?.name_fr ?? null,
    region_id: row.region_id ?? null,
    regionId: row.region_id ?? null,
    city: row.city ?? null,
    location: locationParts.length ? locationParts.join(", ") : null,
    createdAt: row.created_at,
    created_at: row.created_at,
  };
};

// Map legacy/UI input keys to the snake_case profiles columns.
const toProfileRow = (input: AnyRow): AnyRow => {
  const row: AnyRow = {
    name: input.name,
    bio: input.bio,
    avatar_url: input.avatar_url ?? input.avatar,
    phone_number: input.phone_number ?? input.phoneNumber,
    whatsapp: input.whatsapp,
    company_name: input.company_name ?? input.companyName,
    account_type: input.account_type ?? input.accountType,
    role: input.role,
    region_id: input.region_id ?? input.regionId,
    city: input.city ?? input.location?.city,
  };
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
};

export const userAPI = {
  /**
   * Fetch the current authenticated user's profile.
   * Returns `{ user }` matching the legacy shape (includes _id alias,
   * totalReviews, location string, etc.).
   */
  getProfile: async () => {
    console.log("👤 supabase getProfile");

    // Read from the local session cache — getUser() would force a
    // remote JWT verification round-trip that was wedging the auth
    // bootstrap on slow networks.
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user) {
      throw new Error("Not authenticated");
    }
    const authUser = sessionData.session.user;

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_WITH_REGION)
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("❌ getProfile failed:", error.message);
      throw new Error(error.message);
    }

    return { user: fromProfileRow(data as AnyRow, authUser) };
  },

  /**
   * Fetch any user's public profile by id. Used on user/[id].tsx.
   */
  getUserProfile: async (id: string) => {
    console.log("👤 supabase getUserProfile", id);

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_WITH_REGION)
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ getUserProfile failed:", error.message);
      throw new Error(error.message);
    }

    return { user: fromProfileRow(data as AnyRow) };
  },

  /**
   * Update the current authenticated user's profile.
   * RLS limits updates to the row whose id matches auth.uid().
   */
  updateProfile: async (data: AnyRow) => {
    console.log("👤 supabase updateProfile");

    const userId = await requireUserId();

    const { data: row, error } = await supabase
      .from("profiles")
      .update(toProfileRow(data))
      .eq("id", userId)
      .select(PROFILE_WITH_REGION)
      .single();

    if (error) {
      console.error("❌ updateProfile failed:", error.message);
      throw new Error(error.message);
    }

    return { user: fromProfileRow(row as AnyRow) };
  },
};

// ---------------------------------------------------------------
// Reviews — supabase.from("reviews")
// ---------------------------------------------------------------

const REVIEW_WITH_RELATIONS = `
  *,
  reviewer:profiles!reviewer_id ( id, name, avatar_url ),
  seller:profiles!seller_id ( id, name, avatar_url ),
  product:products!product_id ( id, title, thumbnail_url, images, price, currency )
`;

const fromReviewRow = (row: AnyRow): AnyRow => {
  const reviewerRow = row.reviewer ?? null;
  const sellerRow = row.seller ?? null;
  const productRow = row.product ?? null;
  const productImage =
    productRow?.thumbnail_url ?? productRow?.images?.[0] ?? null;

  return {
    id: row.id,
    _id: row.id,
    rating: Number(row.rating ?? 0),
    comment: row.comment ?? "",
    createdAt: row.created_at,
    created_at: row.created_at,
    sellerId: row.seller_id,
    seller_id: row.seller_id,
    productId: row.product_id ?? null,
    product_id: row.product_id ?? null,
    reviewer: reviewerRow
      ? {
          _id: reviewerRow.id,
          id: reviewerRow.id,
          name: reviewerRow.name,
          avatar: reviewerRow.avatar_url,
          avatar_url: reviewerRow.avatar_url,
        }
      : null,
    seller: sellerRow
      ? {
          _id: sellerRow.id,
          id: sellerRow.id,
          name: sellerRow.name,
          avatar: sellerRow.avatar_url,
        }
      : null,
    product: productRow
      ? {
          id: productRow.id,
          _id: productRow.id,
          title: productRow.title,
          image: productImage,
          thumbnail: productImage,
          price: Number(productRow.price ?? 0),
          currency: productRow.currency ?? "MAD",
        }
      : null,
  };
};

export const reviewsAPI = {
  /**
   * Reviews left for a seller. Returns `{ reviews }`, newest first.
   */
  getReviews: async (sellerId: string) => {
    console.log("⭐ supabase getReviews", sellerId);

    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_WITH_RELATIONS)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getReviews failed:", error.message);
      throw new Error(error.message);
    }

    return { reviews: (data ?? []).map(fromReviewRow) };
  },

  /**
   * Alias used by user/[id].tsx — returns the reviews left ABOUT a user
   * (seller_id match), which is the same query as getReviews.
   */
  getReviewsByUser: async (userId: string) => {
    console.log("⭐ supabase getReviewsByUser", userId);

    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_WITH_RELATIONS)
      .eq("seller_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getReviewsByUser failed:", error.message);
      throw new Error(error.message);
    }

    return { reviews: (data ?? []).map(fromReviewRow) };
  },

  /**
   * Reviews about a specific product.
   */
  getProductReviews: async (productId: string) => {
    console.log("⭐ supabase getProductReviews", productId);

    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_WITH_RELATIONS)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getProductReviews failed:", error.message);
      throw new Error(error.message);
    }

    return { reviews: (data ?? []).map(fromReviewRow) };
  },

  /**
   * Create a seller review (no product reference).
   */
  createReview: async (reviewData: {
    sellerId: string;
    rating: number;
    comment: string;
    orderId?: string;
  }) => {
    console.log("⭐ supabase createReview", reviewData.sellerId);

    const reviewerId = await requireUserId();

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: reviewerId,
        seller_id: reviewData.sellerId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      })
      .select(REVIEW_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ createReview failed:", error.message);
      throw new Error(error.message);
    }

    return { review: fromReviewRow(data as AnyRow) };
  },

  /**
   * Create a product review. Looks up the product's seller so the row
   * still satisfies the schema's NOT NULL seller_id and so that seller
   * ratings stay in sync with the recompute_seller_rating trigger.
   */
  createProductReview: async (reviewData: {
    productId: string;
    rating: number;
    comment: string;
    orderId?: string;
  }) => {
    console.log("⭐ supabase createProductReview", reviewData.productId);

    const reviewerId = await requireUserId();

    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("seller_id")
      .eq("id", reviewData.productId)
      .single();

    if (prodErr) {
      console.error("❌ product lookup failed:", prodErr.message);
      throw new Error(prodErr.message);
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: reviewerId,
        seller_id: product.seller_id,
        product_id: reviewData.productId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      })
      .select(REVIEW_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ createProductReview failed:", error.message);
      throw new Error(error.message);
    }

    return { review: fromReviewRow(data as AnyRow) };
  },

  /**
   * Delete a review the current user authored. RLS enforces ownership.
   */
  deleteReview: async (reviewId: string) => {
    console.log("⭐ supabase deleteReview", reviewId);

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("❌ deleteReview failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

// ---------------------------------------------------------------
// Favorites — supabase.from("favorites") joined to products
// ---------------------------------------------------------------

// favorites/index.tsx indexes items by `.id` and passes that value to
// removeFavorite() — so each returned item must use the PRODUCT id, not
// the favorites-row id. Likewise the screen reads `.title`, `.price`,
// `.image`, and `.location` (as a string).
const fromFavoriteRow = (row: AnyRow): AnyRow => {
  const product = row.products ?? {};
  const region = product.regions ?? null;
  const locationParts = [product.city, region?.name_fr].filter(Boolean);
  const image =
    product.thumbnail_url ?? (product.images && product.images[0]) ?? null;

  return {
    // Top-level shape the favorites screen reads:
    id: product.id ?? row.product_id,
    _id: product.id ?? row.product_id,
    title: product.title ?? "",
    price: Number(product.price ?? 0),
    currency: product.currency ?? "MAD",
    image,
    images: (product.images ?? (image ? [image] : [])).filter(
      (u: unknown) => typeof u === "string" && u.trim() !== ""
    ),
    thumbnail: image,
    location: locationParts.length ? locationParts.join(", ") : "",
    city: product.city ?? null,
    region: region?.name_fr ?? null,
    condition: product.condition ?? null,
    isNegotiable: product.is_negotiable ?? false,
    isFeatured: product.is_featured ?? false,
    isUrgent: product.is_urgent ?? false,
    listingType: product.listing_type ?? "C2C",
    sellerId: product.seller_id ?? null,
    seller_id: product.seller_id ?? null,
    createdAt: product.created_at ?? row.created_at,
    favoritedAt: row.created_at,
    favoriteId: row.id, // available for callers that need the join-row id
    product, // raw product row in case a screen wants more fields
  };
};

export const favoritesAPI = {
  /**
   * List the current user's favorite products with full product details.
   * Returns `{ favorites: [...] }`. Each item is a flattened
   * product-shaped object so favorites/index.tsx can keep rendering as-is.
   */
  getFavorites: async () => {
    console.log("❤️ supabase getFavorites");

    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
        *,
        products (
          *,
          categories ( id, name_fr, name_ar, slug ),
          regions ( id, name_fr, name_ar )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getFavorites failed:", error.message);
      throw new Error(error.message);
    }

    // Drop rows where the underlying product was hard-deleted (products
    // is null because of the FK ON DELETE CASCADE — but defensive anyway).
    const favorites = (data ?? [])
      .filter((row: AnyRow) => row.products)
      .map(fromFavoriteRow);

    return { favorites };
  },

  /**
   * Mark a product as a favorite for the current user. Idempotent thanks
   * to the (user_id, product_id) unique index.
   */
  addFavorite: async (productId: string) => {
    console.log("❤️ supabase addFavorite", productId);

    const userId = await requireUserId();

    const { data, error } = await supabase
      .from("favorites")
      .upsert(
        { user_id: userId, product_id: productId },
        { onConflict: "user_id,product_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ addFavorite failed:", error.message);
      throw new Error(error.message);
    }

    return { favorite: data, success: true };
  },

  /**
   * Remove a product from the current user's favorites.
   */
  removeFavorite: async (productId: string) => {
    console.log("❤️ supabase removeFavorite", productId);

    const userId = await requireUserId();

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (error) {
      console.error("❌ removeFavorite failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

// ---------------------------------------------------------------
// Contact — schema has no contact_messages table yet, so this is a
// best-effort stub that resolves successfully and logs a warning so
// the contact-us screen keeps working without surfacing an error.
// Add a real table + insert here once the schema is extended.
// ---------------------------------------------------------------

export const contactAPI = {
  submitContact: async (subject: string, message: string) => {
    console.warn(
      "✉️ contactAPI.submitContact: no contact_messages table yet; nothing persisted",
      { subject, messageLength: message?.length ?? 0 }
    );
    return { success: true };
  },
};

// ---------------------------------------------------------------
// Conversations + Messages — source of truth: lib/supabase-chat.ts
// ---------------------------------------------------------------

const formatTimeOfDay = (iso: string | null | undefined): string => {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
};

// Supabase messages row → the legacy `Message` shape
// ({ id, text, senderId, timestamp, isRead, conversationId }).
const fromMessageRow = (row: AnyRow): AnyRow => ({
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

// Conversations row + joined buyer/seller/product → legacy `Conversation`
// shape with the OTHER party's name/avatar and per-side unread count.
const fromConversationRow = (row: AnyRow, currentUserId: string): AnyRow => {
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
    isOnline: false, // presence not tracked yet
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    createdAt: row.created_at,
  };
};

export const conversationsAPI = {
  /**
   * List conversations the current user participates in (as buyer or seller).
   * Returns `{ conversations }`.
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
      fromConversationRow(row, userId)
    );
    return { conversations };
  },

  /**
   * Fetch one conversation with the OTHER participant + product details.
   * Returns `{ conversation: { user, product, ... } }` matching the shape
   * chat/[id].tsx already reads.
   */
  getConversation: async (id: string) => {
    console.log("💬 supabase getConversation", id);

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
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ getConversation failed:", error.message);
      throw new Error(error.message);
    }

    return { conversation: fromConversationRow(data as AnyRow, userId) };
  },

  /**
   * Fetch all messages for one conversation, oldest first.
   * Returns `{ messages }`.
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

    const messages = (data ?? []).map(fromMessageRow);
    return { messages };
  },

  /**
   * Start (or re-open) a conversation between the current user (buyer)
   * and the seller about a product. Idempotent thanks to the
   * (buyer_id, seller_id, product_id) unique index — upsert returns the
   * existing row if one is already there.
   */
  createConversation: async (data: { productId: string; sellerId: string }) => {
    console.log("💬 supabase createConversation", data.productId);

    const buyerId = await requireUserId();

    const { data: row, error } = await supabase
      .from("conversations")
      .upsert(
        {
          buyer_id: buyerId,
          seller_id: data.sellerId,
          product_id: data.productId,
        },
        { onConflict: "buyer_id,seller_id,product_id" }
      )
      .select(
        `
        *,
        products ( id, title, thumbnail_url, images, price, currency ),
        buyer:profiles!buyer_id ( id, name, avatar_url ),
        seller:profiles!seller_id ( id, name, avatar_url )
      `
      )
      .single();

    if (error) {
      console.error("❌ createConversation failed:", error.message);
      throw new Error(error.message);
    }

    return { conversation: fromConversationRow(row as AnyRow, buyerId) };
  },

  /**
   * Reset the unread counter for the current user's side of the conversation.
   */
  markAsRead: async (conversationId: string) => {
    console.log("💬 supabase markAsRead", conversationId);

    const userId = await requireUserId();

    const { data: conv, error: convErr } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .single();

    if (convErr) {
      console.error("❌ markAsRead lookup failed:", convErr.message);
      throw new Error(convErr.message);
    }

    const patch: AnyRow =
      conv.buyer_id === userId
        ? { buyer_unread: 0 }
        : conv.seller_id === userId
        ? { seller_unread: 0 }
        : null;

    if (!patch) {
      console.warn("⚠️ markAsRead: user is not a participant");
      return { success: false };
    }

    const { error } = await supabase
      .from("conversations")
      .update(patch)
      .eq("id", conversationId);

    if (error) {
      console.error("❌ markAsRead failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

export const messagesAPI = {
  /**
   * Send a message in an existing conversation. The
   * `update_conversation_on_message` trigger maintains last_message and the
   * unread counters server-side, so no follow-up update is needed.
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

    return { message: fromMessageRow(row as AnyRow) };
  },
};

/**
 * Subscribe to new messages in a conversation. Returns an unsubscribe
 * function — call it from the cleanup of the consuming useEffect.
 *
 * Drop-in replacement for the socket.io listener that previously powered
 * chat/[id].tsx. Inserts emit the same shape as getMessages() rows so the
 * existing FlatList renderer handles them without changes.
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
        onMessage(fromMessageRow(payload.new as AnyRow));
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