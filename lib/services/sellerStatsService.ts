import { supabase } from '@/lib/supabase';

export type SellerKpis = {
  salesThisMonth: number;
  pendingOrders: number;
  activeProducts: number;
  revenueThisMonth: number;
  currency: string;
};

export type RecentOrderRow = {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  buyer_name?: string;
  product_titles: string;
  created_at: string;
};

export async function fetchSellerKpis(sellerId: string): Promise<SellerKpis> {
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  const { data: paidOrders, error: paidErr } = await supabase
    .from('order_items')
    .select(`
      subtotal,
      orders!inner (
        id, status, paid_at
      )
    `)
    .eq('seller_id', sellerId)
    .gte('orders.paid_at', startOfMonth)
    .eq('orders.status', 'paid');

  let salesCount = 0;
  let revenue = 0;
  if (!paidErr && paidOrders) {
    const uniqueOrderIds = new Set<string>();
    for (const item of paidOrders) {
      revenue += Number((item as any).subtotal || 0);
      const orderId = (item as any).orders?.id;
      if (orderId) uniqueOrderIds.add(orderId);
    }
    salesCount = uniqueOrderIds.size;
  }

  const { data: pending, error: pendingErr } = await supabase
    .from('order_items')
    .select(`
      orders!inner ( id, status, shipped_at )
    `)
    .eq('seller_id', sellerId)
    .in('orders.status', ['pending', 'paid'])
    .is('orders.shipped_at', null);

  const uniquePending = new Set<string>();
  if (!pendingErr && pending) {
    for (const item of pending) {
      const orderId = (item as any).orders?.id;
      if (orderId) uniquePending.add(orderId);
    }
  }

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .eq('is_active', true);

  return {
    salesThisMonth: salesCount,
    pendingOrders: uniquePending.size,
    activeProducts: productsCount || 0,
    revenueThisMonth: revenue,
    currency: 'MAD',
  };
}

export async function fetchRecentOrders(
  sellerId: string,
  limit: number = 5
): Promise<RecentOrderRow[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      product_title,
      orders!inner (
        id, status, total_amount, currency, buyer_id, created_at
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit * 3);

  if (error || !data) {
    console.error('[sellerStatsService] fetchRecentOrders error:', error);
    return [];
  }

  const byOrder = new Map<string, RecentOrderRow>();
  for (const item of data) {
    const order = (item as any).orders;
    if (!order) continue;

    if (!byOrder.has(order.id)) {
      byOrder.set(order.id, {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount,
        currency: order.currency,
        product_titles: (item as any).product_title || '',
        created_at: order.created_at,
      });
    } else {
      const existing = byOrder.get(order.id)!;
      existing.product_titles += ' + ' + ((item as any).product_title || '');
    }
  }

  return Array.from(byOrder.values()).slice(0, limit);
}
