import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/src/cart/types';

/**
 * Récupère tous les items du cart de l'utilisateur courant
 * (avec join sur products)
 */
export async function fetchCartItems(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products (
        id,
        title,
        title_ar,
        price,
        currency,
        thumbnail_url,
        images,
        stock_qty,
        listing_type,
        seller_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[cartService] fetchCartItems error:', error);
    throw error;
  }

  return (data || []) as unknown as CartItem[];
}

/**
 * Ajoute un produit au cart (ou incrémente la qty si déjà présent)
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1
): Promise<CartItem> {
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CartItem;
  } else {
    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as CartItem;
  }
}

/**
 * Modifie la quantité d'un item (si qty <= 0, supprime l'item)
 */
export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  newQuantity: number
): Promise<void> {
  if (newQuantity <= 0) {
    return removeCartItem(userId, productId);
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity: newQuantity })
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) throw error;
}

/**
 * Supprime un item du cart
 */
export async function removeCartItem(userId: string, productId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) throw error;
}

/**
 * Vide complètement le cart de l'utilisateur
 */
export async function clearUserCart(userId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
