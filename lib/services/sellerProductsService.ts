import { supabase } from '@/lib/supabase';

export type ProductCondition = 'neuf' | 'très_bon' | 'bon' | 'acceptable';
export type ListingType = 'B2B' | 'B2C' | 'C2C';

export type SellerProductRow = {
  id: string;
  seller_id: string;
  category_id: string | null;
  region_id: string | null;
  city: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  currency: string;
  is_negotiable: boolean;
  condition: ProductCondition;
  listing_type: ListingType;
  min_order_qty: number;
  stock_qty: number;
  images: string[];
  thumbnail_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  category?: { id: string; name_fr: string; name_ar: string | null; slug: string } | null;
  region?: { id: string; name_fr: string; name_ar: string | null } | null;
};

export type ProductCategory = {
  id: string;
  name_fr: string;
  name_ar: string | null;
  slug: string;
  icon: string | null;
};

export type ProductRegion = {
  id: string;
  name_fr: string;
  name_ar: string | null;
};

export type CreateProductInput = {
  seller_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  price: number;
  currency?: string;
  is_negotiable?: boolean;
  condition: ProductCondition;
  listing_type: ListingType;
  min_order_qty?: number;
  stock_qty?: number;
  category_id?: string | null;
  region_id?: string | null;
  city?: string | null;
  images?: string[];
  thumbnail_url?: string | null;
  is_active?: boolean;
};

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'seller_id'>>;

const PRODUCT_IMAGES_BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp'];

const SELECT_WITH_RELATIONS = `
  *,
  category:categories ( id, name_fr, name_ar, slug ),
  region:regions ( id, name_fr, name_ar )
`;

function normalizeRow(row: any): SellerProductRow {
  return {
    ...row,
    images: Array.isArray(row.images) ? row.images : [],
  } as SellerProductRow;
}

export async function fetchMyProducts(sellerId: string): Promise<SellerProductRow[]> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_WITH_RELATIONS)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[sellerProductsService] fetchMyProducts error:', error);
    throw error;
  }

  return ((data ?? []) as any[]).map(normalizeRow);
}

export async function fetchProduct(
  productId: string,
  sellerId: string
): Promise<SellerProductRow | null> {
  const { data, error } = await supabase
    .from('products')
    .select(SELECT_WITH_RELATIONS)
    .eq('id', productId)
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (error) {
    console.error('[sellerProductsService] fetchProduct error:', error);
    throw error;
  }

  return data ? normalizeRow(data) : null;
}

export async function createProduct(
  input: CreateProductInput
): Promise<SellerProductRow> {
  const payload = {
    seller_id: input.seller_id,
    title: input.title,
    title_ar: input.title_ar ?? null,
    description: input.description ?? null,
    description_ar: input.description_ar ?? null,
    price: input.price,
    currency: input.currency ?? 'MAD',
    is_negotiable: input.is_negotiable ?? false,
    condition: input.condition,
    listing_type: input.listing_type,
    min_order_qty: input.min_order_qty ?? 1,
    stock_qty: input.stock_qty ?? 1,
    category_id: input.category_id ?? null,
    region_id: input.region_id ?? null,
    city: input.city ?? null,
    images: input.images ?? [],
    thumbnail_url:
      input.thumbnail_url ?? (input.images && input.images[0]) ?? null,
    is_active: input.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(SELECT_WITH_RELATIONS)
    .single();

  if (error) {
    console.error('[sellerProductsService] createProduct error:', error);
    throw error;
  }

  return normalizeRow(data);
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  patch: UpdateProductInput
): Promise<SellerProductRow> {
  const payload: Record<string, unknown> = {};
  const map: Array<[keyof UpdateProductInput, string]> = [
    ['title', 'title'],
    ['title_ar', 'title_ar'],
    ['description', 'description'],
    ['description_ar', 'description_ar'],
    ['price', 'price'],
    ['currency', 'currency'],
    ['is_negotiable', 'is_negotiable'],
    ['condition', 'condition'],
    ['listing_type', 'listing_type'],
    ['min_order_qty', 'min_order_qty'],
    ['stock_qty', 'stock_qty'],
    ['category_id', 'category_id'],
    ['region_id', 'region_id'],
    ['city', 'city'],
    ['images', 'images'],
    ['thumbnail_url', 'thumbnail_url'],
    ['is_active', 'is_active'],
  ];
  for (const [from, to] of map) {
    if (patch[from] !== undefined) {
      payload[to] = patch[from];
    }
  }

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .eq('seller_id', sellerId)
    .select(SELECT_WITH_RELATIONS)
    .single();

  if (error) {
    console.error('[sellerProductsService] updateProduct error:', error);
    throw error;
  }

  return normalizeRow(data);
}

export async function deleteProduct(
  productId: string,
  sellerId: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('seller_id', sellerId);

  if (error) {
    console.error('[sellerProductsService] deleteProduct error:', error);
    throw error;
  }
}

export async function toggleProductActive(
  productId: string,
  sellerId: string,
  nextActive: boolean
): Promise<SellerProductRow> {
  return updateProduct(productId, sellerId, { is_active: nextActive });
}

export async function uploadProductImage(
  sellerId: string,
  file: { uri: string; name?: string | null; type?: string | null; size?: number | null }
): Promise<string> {
  if (file.size != null && file.size > MAX_IMAGE_SIZE) {
    throw new Error('FILE_TOO_LARGE');
  }

  const rawName = file.name ?? 'image.jpg';
  const ext = (rawName.split('.').pop() ?? 'jpg').toLowerCase();
  if (!ALLOWED_IMAGE_EXT.includes(ext)) {
    throw new Error('INVALID_FILE_TYPE');
  }

  let blob: Blob;
  try {
    const response = await fetch(file.uri);
    blob = await response.blob();
  } catch (err) {
    console.error('[sellerProductsService] uploadProductImage fetch failed:', err);
    throw new Error('FETCH_FAILED');
  }

  const path = `${sellerId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, blob, {
      contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
      upsert: false,
    });

  if (error) {
    console.error('[sellerProductsService] uploadProductImage error:', error);
    throw error;
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name_fr, name_ar, slug, icon')
    .order('name_fr');

  if (error) {
    console.error('[sellerProductsService] fetchProductCategories error:', error);
    return [];
  }

  return (data as ProductCategory[]) ?? [];
}

export async function fetchProductRegions(): Promise<ProductRegion[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('id, name_fr, name_ar')
    .order('name_fr');

  if (error) {
    console.error('[sellerProductsService] fetchProductRegions error:', error);
    return [];
  }

  return (data as ProductRegion[]) ?? [];
}
