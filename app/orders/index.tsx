import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserOrders } from '@/lib/services/orderService';
import { formatPrice } from '@/src/utils/currency';
import Toast from 'react-native-toast-message';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

type OrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  created_at: string;
  payment_method: string | null;
  order_items: Array<{
    id: string;
    product_title: string;
    quantity: number;
  }>;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
  refunded: '#6B7280',
};

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
  pending: 'time-outline',
  paid: 'card-outline',
  shipped: 'cube-outline',
  delivered: 'checkmark-circle-outline',
  cancelled: 'close-circle-outline',
  refunded: 'arrow-undo-outline',
};

export default function OrdersListScreen() {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user?._id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    try {
      const data = await fetchUserOrders(user._id);
      setOrders(data as OrderRow[]);
    } catch (err: any) {
      console.error('[orders] loadOrders error:', err);
      Toast.show({ type: 'error', text1: t('orders.loadFailed') });
      setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?._id, t]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const formatDate = (iso: string) => {
    const locale =
      i18n.language === 'fr' ? 'fr-MA' : i18n.language === 'ar' ? 'ar-MA' : 'en-MA';
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <Stack.Screen options={{ title: t('orders.title'), headerShown: true }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={config.theme.primary} />
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <Stack.Screen options={{ title: t('orders.title'), headerShown: true }} />
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={80} color={config.theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: config.theme.textPrimary }]}>
            {t('orders.noOrders')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: config.theme.textSecondary }]}>
            {t('orders.noOrdersSubtitle')}
          </Text>
          <Pressable
            style={[styles.startButton, { backgroundColor: config.theme.primary }]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={[styles.startButtonText, { color: config.theme.textInverse }]}>
              {t('orders.startShopping')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ title: t('orders.title'), headerShown: true }} />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={config.theme.primary}
          />
        }
        renderItem={({ item }) => {
          const totalQty = item.order_items.reduce((sum, oi) => sum + oi.quantity, 0);
          const orderRef = item.id.substring(0, 8).toUpperCase();
          const statusColor = STATUS_COLORS[item.status];

          return (
            <Pressable
              style={[
                styles.orderCard,
                { backgroundColor: config.theme.surface, borderColor: config.theme.border },
              ]}
              onPress={() => router.push(`/orders/${item.id}`)}
            >
              <View style={styles.orderHeader}>
                <Text style={[styles.orderRef, { color: config.theme.textPrimary }]}>
                  #{orderRef}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                  <Ionicons name={STATUS_ICONS[item.status]} size={14} color={statusColor} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {t(`orders.status.${item.status}`)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.orderItems, { color: config.theme.textSecondary }]}>
                {t('orders.items', { count: totalQty })}  ·  {formatPrice(item.total_amount, item.currency)}
              </Text>

              <Text style={[styles.orderDate, { color: config.theme.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>

              <View style={[styles.orderFooter, { borderTopColor: config.theme.border }]}>
                <Text style={[styles.viewDetailsText, { color: config.theme.primary }]}>
                  {t('orders.viewDetails')} →
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginTop: 24 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  startButton: { marginTop: 32, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  startButtonText: { fontSize: 15, fontWeight: '600' },
  listContent: { padding: 16, gap: 12 },
  orderCard: { padding: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderRef: { fontSize: 16, fontWeight: '700' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderItems: { fontSize: 14, marginBottom: 4 },
  orderDate: { fontSize: 12, marginBottom: 8 },
  orderFooter: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  viewDetailsText: { fontSize: 13, fontWeight: '600' },
});
