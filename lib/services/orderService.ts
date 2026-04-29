import { supabase } from '@/lib/supabase';
import type { CartItem } from '@/src/cart';

export type CreateOrderPayload = {
  buyerId: string;
  items: CartItem[];
  shippingFee: number;
  currency: string;
  paymentMethod: 'cmi' | 'cod' | 'bank_transfer';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    region_id?: string | null;
  };
  shippingNotes?: string;
};

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ orderId: string }> {
  const subtotal = payload.items.reduce((sum, item) => {
    const price = item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: payload.buyerId,
      subtotal,
      shipping_fee: payload.shippingFee,
      tax_amount: 0,
      total_amount: subtotal + payload.shippingFee,
      currency: payload.currency,
      status: 'pending',
      payment_method: payload.paymentMethod,
      shipping_address: payload.shippingAddress,
      shipping_city: payload.shippingAddress.city,
      shipping_phone: payload.shippingAddress.phone,
      shipping_notes: payload.shippingNotes ?? null,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error('[orderService] createOrder header error:', orderError);
    throw new Error(orderError?.message ?? 'Failed to create order');
  }

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.product?.seller_id ?? '',
    product_title: item.product?.title ?? '',
    product_image: item.product?.thumbnail_url ?? null,
    quantity: item.quantity,
    unit_price: item.product?.price ?? 0,
    subtotal: (item.product?.price ?? 0) * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    console.error('[orderService] createOrder items error:', itemsError);
    throw new Error(itemsError.message);
  }

  return { orderId: order.id };
}

export async function fetchUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        id, product_id, product_title, product_image, quantity, unit_price, subtotal
      )
    `
    )
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        id, product_id, seller_id, product_title, product_image, quantity, unit_price, subtotal
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return data;
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_reason: reason ?? null,
    })
    .eq('id', orderId);

  if (error) throw error;
}
