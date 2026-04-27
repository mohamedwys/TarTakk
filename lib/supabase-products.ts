import { supabase } from "./supabase";

// Drop-in replacement for productsAPI in lib/api.ts.
// Same function signatures and same response envelopes
// ({ product }, { products }, etc.) so existing screens — explore, index,
// search, profile, product/[id], product/edit/[id], user/[id] — keep
// working without code changes.

// ---------- shape mapping helpers ----------

// Existing UI sends legacy condition strings; our schema only allows the
// four FR values. Map both directions so legacy callers stay compatible.
const LEGACY_TO_SCHEMA_CONDITION: Record<string, string> = {
  new: "neuf",
  like_new: "très_bon",
  "very_good": "très_bon",
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

type AnyRow = Record<string, any>;

const deriveStatus = (row: AnyRow): "active" | "sold" | "expired" => {
  if ((row.stock_qty ?? 1) <= 0) return "sold";
  if (row.is_active === false) return "expired";
  if (row.expires_at && new Date(row.expires_at) < new Date()) return "expired";
  return "active";
};

// Map a Supabase row + joins to the legacy response shape used by the
// existing screens (camelCase keys, nested seller/location, derived status).
const fromRow = (row: AnyRow | null): AnyRow | null => {
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
    images: row.images ?? [],
    thumbnail: row.thumbnail_url ?? row.images?.[0] ?? null,
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
const toRow = (input: AnyRow): AnyRow => {
  const row: AnyRow = {
    title: input.title,
    title_ar: input.title_ar ?? input.titleAr,
    description: input.description,
    description_ar: input.description_ar ?? input.descriptionAr,
    price:
      typeof input.price === "string" ? parseFloat(input.price) : input.price,
    currency: "MAD",
    is_negotiable:
      input.is_negotiable ?? input.isNegotiable ?? false,
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

  // Legacy `location: { city, state }` → split into city + region lookup
  // (region_id resolution would need a separate query; just keep city here).
  if (input.city) row.city = input.city;
  else if (input.location?.city) row.city = input.location.city;

  // Strip undefined keys so we don't blow away defaults.
  Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
  return row;
};

const requireUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw new Error("Not authenticated");
  }
  return data.user.id;
};

// ---------- public API ----------

export const productsAPI = {
  /**
   * List products. Accepts the legacy URLSearchParams-style options
   * (search, category, region, type, minPrice, maxPrice, condition, page).
   * Uses the search_products RPC for filtering + ordering.
   * Returns `{ products: [...] }` to match the legacy shape.
   */
  getProducts: async (params?: AnyRow) => {
    console.log("📦 supabase getProducts", params);

    const { data, error } = await supabase.rpc("search_products", {
      search_term: params?.search ?? null,
      region_filter: params?.region ?? params?.region_id ?? null,
      category_filter: params?.category ?? params?.category_id ?? null,
      listing_type_filter: params?.type ?? params?.listing_type ?? null,
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

    const products = (data ?? []).map((row: AnyRow) => fromRow(row)!);
    return { products };
  },

  /**
   * Fetch one product with seller + category + region joined.
   * Returns `{ product }` to match the legacy shape.
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

    // Best-effort view counter; ignore failures so a permission gap
    // doesn't break the detail screen.
    supabase
      .rpc("increment_product_views", { p_id: id })
      .then(({ error: rpcError }) => {
        if (rpcError) console.warn("⚠️ increment views failed:", rpcError.message);
      });

    return { product: fromRow(data as AnyRow) };
  },

  /**
   * Alias kept for screens that import it under the old name.
   */
  getProductById: async (id: string) => productsAPI.getProduct(id),

  /**
   * Create a new product owned by the current user.
   * Currency is hardcoded to MAD per Morocco-only spec.
   * Returns `{ product }` matching the legacy shape.
   */
  createProduct: async (data: AnyRow) => {
    console.log("📦 supabase createProduct", data?.title);

    const sellerId = await requireUserId();

    const { data: row, error } = await supabase
      .from("products")
      .insert({
        ...toRow(data),
        seller_id: sellerId,
      })
      .select(PRODUCT_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ createProduct failed:", error.message);
      throw new Error(error.message);
    }

    return { product: fromRow(row as AnyRow) };
  },

  /**
   * Update fields on a product the current user owns. RLS enforces
   * ownership, so we don't repeat the seller_id check here.
   */
  updateProduct: async (id: string, data: AnyRow) => {
    console.log("📦 supabase updateProduct", id);

    const { data: row, error } = await supabase
      .from("products")
      .update(toRow(data))
      .eq("id", id)
      .select(PRODUCT_WITH_RELATIONS)
      .single();

    if (error) {
      console.error("❌ updateProduct failed:", error.message);
      throw new Error(error.message);
    }

    return { product: fromRow(row as AnyRow) };
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
   * Returns `{ products }` matching the legacy shape consumed by
   * profile.tsx (which then filters by `.status`).
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

    const products = (data ?? []).map((row: AnyRow) => fromRow(row)!);
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

    const products = (data ?? []).map((row: AnyRow) => fromRow(row)!);
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
      if (!cat) {
        return { products: [] };
      }
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

    const products = (data ?? []).map((row: AnyRow) => fromRow(row)!);
    return { products };
  },
};
