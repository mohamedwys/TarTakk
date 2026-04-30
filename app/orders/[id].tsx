import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { fetchOrderById, cancelOrder } from '@/lib/services/orderService';
import { formatPrice } from '@/src/utils/currency';
import { Button, Card, Divider } from '@/src/components/ui';
import { SectionLabel } from '@/src/components/profile';
import {
  OrderTimeline,
  OrderStatusBadge,
  OrderItemRow,
} from '@/src/components/orders';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import Toast from 'react-native-toast-message';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

function TotalsRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  const { config } = useEnv();
  const theme = config.theme;
  return (
    <View style={styles.totalsRow}>
      <Text
        style={[
          bold ? typography.body : typography.bodySmall,
          {
            color: bold ? theme.textPrimary : theme.textSecondary,
            fontFamily: bold ? fontFamily.bold : fontFamily.regular,
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          bold ? typography.h4 : typography.body,
          {
            color: bold ? theme.primary : theme.textPrimary,
            fontFamily: bold ? fontFamily.extrabold : fontFamily.semibold,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;

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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ title: t('orders.orderRef'), headerShown: true }} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  const orderRef = order.id.substring(0, 8).toUpperCase();
  const status = order.status as OrderStatus;
  const canCancel = status === 'pending' || status === 'paid';

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
  const items = order.order_items ?? [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: `#${orderRef}`, headerShown: true }} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status hero */}
        <Card elevation="raised" padding="lg">
          <View style={styles.heroInner}>
            <OrderStatusBadge status={status} size="md" />
            <OrderTimeline status={status} variant="full" />
            <Text
              style={[
                typography.caption,
                { color: theme.textTertiary, marginTop: spacing.xs },
              ]}
            >
              {formatDate(order.created_at)}
            </Text>
          </View>
        </Card>

        {/* Items */}
        <SectionLabel>{t('orders.detail.items')}</SectionLabel>
        <Card elevation="raised" padding="md">
          {items.map((item: any, idx: number) => (
            <View key={item.id}>
              <OrderItemRow item={item} currency={order.currency} />
              {idx < items.length - 1 && <Divider variant="subtle" spacing="sm" />}
            </View>
          ))}
        </Card>

        {/* Shipping address */}
        <SectionLabel>{t('orders.detail.shippingAddress')}</SectionLabel>
        <Card elevation="raised" padding="md">
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.semibold },
            ]}
          >
            {addr.name}
          </Text>
          {!!addr.phone && (
            <Text
              style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}
            >
              {addr.phone}
            </Text>
          )}
          {!!addr.address && (
            <Text
              style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}
            >
              {addr.address}
            </Text>
          )}
          {!!addr.city && (
            <Text
              style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}
            >
              {addr.city}
            </Text>
          )}
          {!!order.shipping_notes && (
            <Text
              style={[
                typography.bodySmall,
                {
                  color: theme.textTertiary,
                  fontStyle: 'italic',
                  marginTop: spacing.xs,
                },
              ]}
            >
              {order.shipping_notes}
            </Text>
          )}
        </Card>

        {/* Payment & totals */}
        <SectionLabel>{t('orders.detail.payment')}</SectionLabel>
        <Card elevation="raised" padding="md">
          <View style={styles.payRow}>
            <View style={styles.payMethodLeft}>
              <Ionicons name="card-outline" size={20} color={theme.primary} />
              <Text
                style={[
                  typography.bodySmall,
                  { color: theme.textSecondary, marginLeft: spacing.xs },
                ]}
              >
                {t('orders.detail.method')}
              </Text>
            </View>
            <Text
              style={[
                typography.body,
                { color: theme.textPrimary, fontFamily: fontFamily.semibold },
              ]}
            >
              {paymentLabel}
            </Text>
          </View>
          <Divider variant="subtle" spacing="sm" />
          <TotalsRow
            label={t('orders.detail.subtotal')}
            value={formatPrice(order.subtotal, order.currency)}
          />
          <TotalsRow
            label={t('orders.detail.shipping')}
            value={formatPrice(order.shipping_fee, order.currency)}
          />
          <Divider variant="strong" spacing="sm" />
          <TotalsRow
            label={t('orders.detail.total')}
            value={formatPrice(order.total_amount, order.currency)}
            bold
          />
        </Card>

        {canCancel && (
          <Button
            variant="danger"
            size="lg"
            fullWidth
            iconLeft="close-circle-outline"
            loading={isCancelling}
            onPress={handleCancel}
            style={{ marginTop: spacing.lg }}
          >
            {t('orders.detail.cancelOrder')}
          </Button>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.md },
  heroInner: {
    alignItems: 'center',
    gap: spacing.md,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  payMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
