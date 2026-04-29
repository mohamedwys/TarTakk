import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { fetchOrderById, cancelOrder } from '@/lib/services/orderService';
import { formatPrice } from '@/src/utils/currency';
import Toast from 'react-native-toast-message';

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
  refunded: '#6B7280',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      const data = await fetchOrderById(id);
      setOrder(data);
    } catch (err: any) {
      console.error('[orderDetail] error:', err);
      Toast.show({ type: 'error', text1: t('orders.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleCancel = () => {
    Alert.alert(t('orders.cancelOrder'), t('orders.cancelConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await cancelOrder(id, 'Cancelled by user');
            Toast.show({ type: 'success', text1: t('orders.cancelSuccess') });
            loadOrder();
          } catch (err: any) {
            Toast.show({ type: 'error', text1: t('orders.cancelFailed') });
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  if (isLoading || !order) {
    return (
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <Stack.Screen options={{ title: t('orders.orderRef'), headerShown: true }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={config.theme.primary} />
        </View>
      </View>
    );
  }

  const orderRef = order.id.substring(0, 8).toUpperCase();
  const statusColor = STATUS_COLORS[order.status] ?? config.theme.textSecondary;
  const canCancel = order.status === 'pending' || order.status === 'paid';

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const locale =
      i18n.language === 'fr' ? 'fr-MA' : i18n.language === 'ar' ? 'ar-MA' : 'en-MA';
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const paymentLabel =
    order.payment_method === 'cod'
      ? t('orders.paymentCod')
      : order.payment_method === 'bank_transfer'
        ? t('orders.paymentBank')
        : order.payment_method === 'cmi'
          ? t('orders.paymentCmi')
          : '—';

  const addr = order.shipping_address ?? {};

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ title: `#${orderRef}`, headerShown: true }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status */}
        <View
          style={[
            styles.section,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <View style={[styles.statusBig, { backgroundColor: statusColor + '20' }]}>
            <Ionicons name="receipt-outline" size={24} color={statusColor} />
            <Text style={[styles.statusBigText, { color: statusColor }]}>
              {t(`orders.status.${order.status}`)}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: config.theme.textSecondary }]}>
            {formatDate(order.created_at)}
          </Text>
        </View>

        {/* Items */}
        <View
          style={[
            styles.section,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
            {t('checkout.items')} ({order.order_items.length})
          </Text>
          {order.order_items.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              {item.product_image ? (
                <Image source={{ uri: item.product_image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, { backgroundColor: config.theme.border }]} />
              )}
              <View style={styles.itemInfo}>
                <Text
                  style={[styles.itemTitle, { color: config.theme.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.product_title}
                </Text>
                <Text style={[styles.itemMeta, { color: config.theme.textSecondary }]}>
                  x{item.quantity} · {formatPrice(item.unit_price, order.currency)}
                </Text>
              </View>
              <Text style={[styles.itemSubtotal, { color: config.theme.primary }]}>
                {formatPrice(item.subtotal, order.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Address */}
        <View
          style={[
            styles.section,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
            {t('orders.shippingTo')}
          </Text>
          <Text style={[styles.addrLine, { color: config.theme.textPrimary }]}>{addr.name}</Text>
          <Text style={[styles.addrLine, { color: config.theme.textSecondary }]}>
            {addr.phone}
          </Text>
          <Text style={[styles.addrLine, { color: config.theme.textSecondary }]}>
            {addr.address}
          </Text>
          <Text style={[styles.addrLine, { color: config.theme.textSecondary }]}>{addr.city}</Text>
          {order.shipping_notes && (
            <Text
              style={[
                styles.addrLine,
                { color: config.theme.textSecondary, fontStyle: 'italic', marginTop: 8 },
              ]}
            >
              {order.shipping_notes}
            </Text>
          )}
        </View>

        {/* Payment */}
        <View
          style={[
            styles.section,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
            {t('orders.paymentMethod')}
          </Text>
          <View style={styles.payRow}>
            <Ionicons name="card-outline" size={20} color={config.theme.primary} />
            <Text style={[styles.payText, { color: config.theme.textPrimary }]}>
              {paymentLabel}
            </Text>
          </View>
        </View>

        {/* Totals */}
        <View
          style={[
            styles.section,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <View style={styles.totalsRow}>
            <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
              {t('orders.subtotal')}
            </Text>
            <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
              {formatPrice(order.subtotal, order.currency)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
              {t('orders.shipping')}
            </Text>
            <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
              {formatPrice(order.shipping_fee, order.currency)}
            </Text>
          </View>
          <View
            style={[
              styles.totalsRow,
              styles.grandTotalRow,
              { borderTopColor: config.theme.border },
            ]}
          >
            <Text style={[styles.grandTotalLabel, { color: config.theme.textPrimary }]}>
              {t('orders.total')}
            </Text>
            <Text style={[styles.grandTotalValue, { color: config.theme.primary }]}>
              {formatPrice(order.total_amount, order.currency)}
            </Text>
          </View>
        </View>

        {/* Cancel button */}
        {canCancel && (
          <Pressable
            style={[
              styles.cancelButton,
              { backgroundColor: config.theme.error + '15', borderColor: config.theme.error },
              isCancelling && { opacity: 0.6 },
            ]}
            onPress={handleCancel}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color={config.theme.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={config.theme.error} />
                <Text style={[styles.cancelButtonText, { color: config.theme.error }]}>
                  {t('orders.cancelOrder')}
                </Text>
              </>
            )}
          </Pressable>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, gap: 12 },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  statusBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusBigText: { fontSize: 14, fontWeight: '700' },
  dateText: { fontSize: 12, marginTop: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  itemImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#F0F0F0' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '700' },
  addrLine: { fontSize: 13, lineHeight: 20 },
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  payText: { fontSize: 14 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 14, fontWeight: '500' },
  grandTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' },
  grandTotalValue: { fontSize: 18, fontWeight: '800' },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelButtonText: { fontSize: 15, fontWeight: '600' },
});
