import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/src/utils/currency';
import {
  fetchMyOrders,
  type SellerOrderFilter,
  type SellerOrderRow,
} from '@/lib/services/sellerOrdersService';

const FILTERS: { key: SellerOrderFilter; tKey: string }[] = [
  { key: 'all', tKey: 'all' },
  { key: 'paid', tKey: 'toShip' },
  { key: 'shipped', tKey: 'shipped' },
  { key: 'delivered', tKey: 'delivered' },
  { key: 'cancelled', tKey: 'cancelled' },
];

export default function ProPortalSellerOrdersList() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [filter, setFilter] = useState<SellerOrderFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const list = await fetchMyOrders(user._id, filter);
      setOrders(list);
    } catch (err) {
      console.error('[SellerOrdersList] loadData error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.sellerOrders.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, filter, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.sellerOrders.title')}
          </Text>
          <Text style={[styles.pageSubtitle, { color: config.theme.textSecondary }]}>
            {t('proPortal.sellerOrders.subtitle', { count: orders.length })}
          </Text>
        </View>
      </View>

      <View style={styles.filtersBar}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active
                    ? config.theme.primary
                    : config.theme.surface,
                  borderColor: active
                    ? config.theme.primary
                    : config.theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active
                    ? config.theme.textInverse
                    : config.theme.textPrimary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t(`proPortal.sellerOrders.filter.${f.tKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={config.theme.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: config.theme.border }]}>
          <Ionicons
            name="receipt-outline"
            size={48}
            color={config.theme.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.sellerOrders.noOrders')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: config.theme.textSecondary }]}>
            {t('proPortal.sellerOrders.noOrdersSubtitle')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                router.push({
                  pathname: '/pro-portal/orders/[id]',
                  params: { id: item.id },
                } as any)
              }
            />
          )}
        />
      )}
    </View>
  );
}

function OrderCard({
  order,
  onPress,
}: {
  order: SellerOrderRow;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();

  const effectiveStatus =
    order.status === 'cancelled'
      ? 'cancelled'
      : order.delivered_at
        ? 'delivered'
        : order.shipped_at
          ? 'shipped'
          : order.status;

  const statusColor =
    effectiveStatus === 'delivered'
      ? config.theme.success
      : effectiveStatus === 'shipped'
        ? config.theme.primary
        : effectiveStatus === 'cancelled'
          ? config.theme.error
          : config.theme.textSecondary;

  const refShort = order.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(order.created_at).toLocaleDateString(
    i18n.language || 'fr'
  );

  return (
    <Pressable
      style={[
        cardStyles.card,
        {
          backgroundColor: config.theme.surface,
          borderColor: config.theme.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={cardStyles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.ref, { color: config.theme.textPrimary }]}>
            {t('proPortal.sellerOrders.orderRef', { ref: refShort })}
          </Text>
          <Text style={[cardStyles.date, { color: config.theme.textSecondary }]}>
            {dateStr}
          </Text>
        </View>
        <View
          style={[
            cardStyles.statusBadge,
            { backgroundColor: statusColor + '22' },
          ]}
        >
          <Text style={[cardStyles.statusText, { color: statusColor }]}>
            {t(`proPortal.sellerOrders.status.${effectiveStatus}`)}
          </Text>
        </View>
      </View>

      <View style={cardStyles.bodyRow}>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.itemsLabel, { color: config.theme.textSecondary }]}>
            {t('proPortal.sellerOrders.items', { count: order.my_items_count })}
          </Text>
          {order.shipping_city ? (
            <Text style={[cardStyles.city, { color: config.theme.textSecondary }]}>
              <Ionicons
                name="location-outline"
                size={12}
                color={config.theme.textSecondary}
              />{' '}
              {order.shipping_city}
            </Text>
          ) : null}
        </View>
        <Text style={[cardStyles.amount, { color: config.theme.primary }]}>
          {formatPrice(order.my_items_subtotal, order.currency || 'MAD')}
        </Text>
      </View>

      <View style={cardStyles.footerRow}>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={config.theme.textSecondary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  pageSubtitle: { fontSize: 14, marginTop: 2 },
  filtersBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  list: { gap: 12, paddingBottom: 24 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ref: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemsLabel: { fontSize: 13, fontWeight: '600' },
  city: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800' },
  footerRow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
});
