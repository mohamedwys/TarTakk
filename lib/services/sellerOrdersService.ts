import { supabase } from '@/lib/supabase';

export type SellerOrderFilter =
  | 'all'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type SellerOrderRow = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  buyer_id: string;
  shipping_city: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  my_items_count: number;
  my_items_subtotal: number;
};

export type SellerOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  product_title: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type SellerOrderDetail = {
  id: string;
  status: string;
  payment_method: string | null;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  currency: string;
  buyer_id: string;
  shipping_address: Record<string, unknown> | null;
  shipping_city: string | null;
  shipping_phone: string | null;
  shipping_notes?: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export async function fetchMyOrders(
  sellerId: string,
  filter: SellerOrderFilter = 'all'
): Promise<SellerOrderRow[]> {
  let query = supabase
    .from('order_items')
    .select(
      `
        quantity,
        subtotal,
        orders!inner (
          id, status, total_amount, currency, buyer_id, shipping_city,
          created_at, shipped_at, delivered_at
        )
      `
    )
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false, foreignTable: 'orders' });

  if (filter === 'paid') {
    query = query.eq('orders.status', 'paid').is('orders.shipped_at', null);
  } else if (filter === 'shipped') {
    query = query
      .not('orders.shipped_at', 'is', null)
      .is('orders.delivered_at', null);
  } else if (filter === 'delivered') {
    query = query.not('orders.delivered_at', 'is', null);
  } else if (filter === 'cancelled') {
    query = query.eq('orders.status', 'cancelled');
  }

  const { data, error } = await query;
  if (error) throw error;

  const byOrder = new Map<string, SellerOrderRow>();
  for (const raw of data ?? []) {
    const item = raw as {
      quantity: number;
      subtotal: number;
      orders:
        | {
            id: string;
            status: string;
            total_amount: number;
            currency: string;
            buyer_id: string;
            shipping_city: string | null;
            created_at: string;
            shipped_at: string | null;
            delivered_at: string | null;
          }
        | null;
    };
    const order = item.orders;
    if (!order) continue;

    const existing = byOrder.get(order.id);
    if (existing) {
      existing.my_items_count += Number(item.quantity) || 0;
      existing.my_items_subtotal += Number(item.subtotal) || 0;
    } else {
      byOrder.set(order.id, {
        id: order.id,
        status: order.status,
        total_amount: Number(order.total_amount) || 0,
        currency: order.currency,
        buyer_id: order.buyer_id,
        shipping_city: order.shipping_city,
        created_at: order.created_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        my_items_count: Number(item.quantity) || 0,
        my_items_subtotal: Number(item.subtotal) || 0,
      });
    }
  }

  return Array.from(byOrder.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function fetchOrderDetail(
  orderId: string,
  sellerId: string
): Promise<{ order: SellerOrderDetail; items: SellerOrderItem[] }> {
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (orderErr) throw orderErr;
  if (!order) throw new Error('Order not found');

  const { data: items, error: itemsErr } = await supabase
    .from('order_items')
    .select(
      'id, order_id, product_id, seller_id, product_title, product_image, quantity, unit_price, subtotal'
    )
    .eq('order_id', orderId)
    .eq('seller_id', sellerId);
  if (itemsErr) throw itemsErr;

  return {
    order: order as SellerOrderDetail,
    items: (items ?? []) as SellerOrderItem[],
  };
}

export async function markAsShipped(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      shipped_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) throw error;
}

export async function markAsDelivered(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) throw error;
}

export async function fetchBuyerName(
  buyerId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, username, email')
    .eq('id', buyerId)
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  const row = data as {
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
  };
  return row.full_name || row.username || row.email || null;
}
