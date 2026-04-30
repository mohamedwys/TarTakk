import React, { useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { Button } from '@/src/components/ui';
import { FilterPills, OrderListCard } from '@/src/components/orders';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import Toast from 'react-native-toast-message';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

type FilterKey = 'all' | OrderStatus;

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

export default function OrdersListScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterKey>('all');

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
    }, [loadOrders]),
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders();
  };

  const filters = useMemo(
    () =>
      [
        { key: 'all' as FilterKey, label: t('orders.filter.all') },
        { key: 'pending' as FilterKey, label: t('orders.filter.pending') },
        { key: 'paid' as FilterKey, label: t('orders.filter.paid') },
        { key: 'shipped' as FilterKey, label: t('orders.filter.shipped') },
        { key: 'delivered' as FilterKey, label: t('orders.filter.delivered') },
        { key: 'cancelled' as FilterKey, label: t('orders.filter.cancelled') },
      ],
    [t],
  );

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ title: t('orders.title'), headerShown: true }} />

      <FilterPills filters={filters} selected={statusFilter} onSelect={setStatusFilter} />

      {isLoading && orders.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={config.theme.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="receipt-outline" size={80} color={config.theme.textSecondary} />
          <Text
            style={[
              typography.h4,
              {
                color: config.theme.textPrimary,
                marginTop: spacing.lg,
                fontFamily: fontFamily.bold,
              },
            ]}
          >
            {t('orders.noOrders')}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: config.theme.textSecondary, marginTop: spacing.xs, textAlign: 'center' },
            ]}
          >
            {t('orders.noOrdersSubtitle')}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: spacing.xl }}
          >
            {t('orders.startShopping')}
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={config.theme.primary}
            />
          }
          renderItem={({ item, index }) => <OrderListCard order={item} index={index} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
