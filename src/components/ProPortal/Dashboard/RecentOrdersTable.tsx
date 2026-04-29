import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import type { RecentOrderRow } from '@/lib/services/sellerStatsService';
import { formatPrice } from '@/src/utils/currency';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

type Props = {
  orders: RecentOrderRow[];
  onOrderPress?: (orderId: string) => void;
};

export function RecentOrdersTable({ orders, onOrderPress }: Props) {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();

  if (orders.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor: config.theme.surface,
            borderColor: config.theme.border,
          },
        ]}
      >
        <Text style={[styles.emptyText, { color: config.theme.textSecondary }]}>
          {t('proPortal.dashboard.noRecentOrders')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.theme.surface,
          borderColor: config.theme.border,
        },
      ]}
    >
      {orders.map((order) => {
        const statusColor =
          STATUS_COLORS[order.status] ?? config.theme.textSecondary;
        const orderRef = order.id.substring(0, 8).toUpperCase();
        const dateLocale =
          i18n.language === 'fr'
            ? 'fr-MA'
            : i18n.language === 'ar'
            ? 'ar-MA'
            : 'en-MA';
        const dateStr = new Date(order.created_at).toLocaleDateString(
          dateLocale,
          { day: 'numeric', month: 'short', year: 'numeric' }
        );

        return (
          <Pressable
            key={order.id}
            style={[styles.row, { borderBottomColor: config.theme.border }]}
            onPress={() => onOrderPress?.(order.id)}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.orderRef, { color: config.theme.textPrimary }]}>
                #{orderRef}
              </Text>
              <Text
                style={[styles.products, { color: config.theme.textSecondary }]}
                numberOfLines={1}
              >
                {order.product_titles}
              </Text>
              <Text style={[styles.date, { color: config.theme.textSecondary }]}>
                {dateStr}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + '20' },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {t(`proPortal.dashboard.orderStatusBadge.${order.status}`)}
                </Text>
              </View>
              <Text style={[styles.amount, { color: config.theme.primary }]}>
                {formatPrice(order.total_amount, order.currency)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  empty: {
    padding: 32,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: { flex: 1, gap: 4 },
  orderRef: { fontSize: 14, fontWeight: '700' },
  products: { fontSize: 13 },
  date: { fontSize: 11 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 14, fontWeight: '700' },
});
