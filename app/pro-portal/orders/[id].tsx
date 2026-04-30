import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/src/utils/currency';
import {
  fetchBuyerName,
  fetchOrderDetail,
  markAsDelivered,
  markAsShipped,
  type SellerOrderDetail,
  type SellerOrderItem,
} from '@/lib/services/sellerOrdersService';
import { ProLayout } from '@/src/components/pro-portal';

export default function ProPortalSellerOrderDetail() {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<SellerOrderDetail | null>(null);
  const [items, setItems] = useState<SellerOrderItem[]>([]);
  const [buyerName, setBuyerName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!user?._id || !id) return;
    setIsLoading(true);
    try {
      const { order: o, items: its } = await fetchOrderDetail(id, user._id);
      setOrder(o);
      setItems(its);
      const name = await fetchBuyerName(o.buyer_id);
      setBuyerName(name);
    } catch (err) {
      console.error('[SellerOrderDetail] load error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.sellerOrders.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = (msg: string) => {
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      return window.confirm(msg);
    }
    return true;
  };

  const handleShip = async () => {
    if (!order) return;
    if (!confirm(t('proPortal.sellerOrders.confirmShip'))) return;
    setIsUpdating(true);
    try {
      await markAsShipped(order.id);
      Toast.show({
        type: 'success',
        text1: t('proPortal.sellerOrders.shippedSuccess'),
      });
      await load();
    } catch (err) {
      console.error('[SellerOrderDetail] ship error:', err);
      Toast.show({
        type: 'error',
        text1: t('proPortal.sellerOrders.actionFailed'),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    if (!confirm(t('proPortal.sellerOrders.confirmDeliver'))) return;
    setIsUpdating(true);
    try {
      await markAsDelivered(order.id);
      Toast.show({
        type: 'success',
        text1: t('proPortal.sellerOrders.deliveredSuccess'),
      });
      await load();
    } catch (err) {
      console.error('[SellerOrderDetail] deliver error:', err);
      Toast.show({
        type: 'error',
        text1: t('proPortal.sellerOrders.actionFailed'),
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <ActivityIndicator size="large" color={config.theme.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <Text style={{ color: config.theme.textPrimary, fontWeight: '600' }}>
          {t('proPortal.sellerOrders.notFound')}
        </Text>
      </View>
    );
  }

  const refShort = order.id.slice(0, 8).toUpperCase();
  const dateStr = new Date(order.created_at).toLocaleDateString(
    i18n.language || 'fr'
  );
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

  const mySubtotal = items.reduce(
    (sum, it) => sum + (Number(it.subtotal) || 0),
    0
  );

  const canShip =
    order.status === 'paid' && !order.shipped_at && !order.delivered_at;
  const canDeliver = !!order.shipped_at && !order.delivered_at;

  const shippingAddr = (order.shipping_address ?? {}) as {
    name?: string;
    address?: string;
    city?: string;
    phone?: string;
  };

  return (
    <ProLayout maxWidth={1100} scrollable contentStyle={styles.scroll}>
      <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          style={styles.backBtn}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace({ pathname: '/pro-portal/orders' } as any)
          }
        >
          <Ionicons name="arrow-back" size={20} color={config.theme.textPrimary} />
          <Text style={[styles.backText, { color: config.theme.textPrimary }]}>
            {t('proPortal.sellerOrders.back')}
          </Text>
        </Pressable>

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: config.theme.textPrimary }]}>
              {t('proPortal.sellerOrders.orderRef', { ref: refShort })}
            </Text>
            <Text style={[styles.pageSubtitle, { color: config.theme.textSecondary }]}>
              {dateStr}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '22' },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`proPortal.sellerOrders.status.${effectiveStatus}`)}
            </Text>
          </View>
        </View>

        <Section
          title={t('proPortal.sellerOrders.myItems')}
          theme={config.theme}
        >
          {items.map((item) => (
            <View
              key={item.id}
              style={[styles.itemRow, { borderBottomColor: config.theme.border }]}
            >
              {item.product_image ? (
                <Image
                  source={{ uri: item.product_image }}
                  style={styles.itemThumb}
                />
              ) : (
                <View
                  style={[
                    styles.itemThumb,
                    {
                      backgroundColor: config.theme.background,
                      alignItems: 'center',
                      justifyContent: 'center',
                    },
                  ]}
                >
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color={config.theme.textSecondary}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.itemTitle, { color: config.theme.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.product_title}
                </Text>
                <Text style={[styles.itemMeta, { color: config.theme.textSecondary }]}>
                  {formatPrice(Number(item.unit_price), order.currency)} ×{' '}
                  {item.quantity}
                </Text>
              </View>
              <Text style={[styles.itemSubtotal, { color: config.theme.textPrimary }]}>
                {formatPrice(Number(item.subtotal), order.currency)}
              </Text>
            </View>
          ))}
        </Section>

        <Section
          title={t('proPortal.sellerOrders.buyerInfo')}
          theme={config.theme}
        >
          <Text style={[styles.bodyText, { color: config.theme.textPrimary }]}>
            {buyerName || shippingAddr.name || '—'}
          </Text>
          {shippingAddr.phone ? (
            <Text style={[styles.bodyText, { color: config.theme.textSecondary }]}>
              {shippingAddr.phone}
            </Text>
          ) : null}
        </Section>

        <Section
          title={t('proPortal.sellerOrders.shippingInfo')}
          theme={config.theme}
        >
          {shippingAddr.address ? (
            <Text style={[styles.bodyText, { color: config.theme.textPrimary }]}>
              {shippingAddr.address}
            </Text>
          ) : null}
          {(shippingAddr.city || order.shipping_city) ? (
            <Text style={[styles.bodyText, { color: config.theme.textSecondary }]}>
              {shippingAddr.city || order.shipping_city}
            </Text>
          ) : null}
        </Section>

        <Section
          title={t('proPortal.sellerOrders.paymentInfo')}
          theme={config.theme}
        >
          <Text style={[styles.bodyText, { color: config.theme.textPrimary }]}>
            {order.payment_method
              ? t(`proPortal.sellerOrders.paymentMethod.${order.payment_method}`, {
                  defaultValue: order.payment_method,
                })
              : '—'}
          </Text>
        </Section>

        <Section
          title={t('proPortal.sellerOrders.totals')}
          theme={config.theme}
        >
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: config.theme.textSecondary }]}>
              {t('proPortal.sellerOrders.myRevenue')}
            </Text>
            <Text style={[styles.totalsValue, { color: config.theme.primary }]}>
              {formatPrice(mySubtotal, order.currency)}
            </Text>
          </View>
        </Section>

        <Section
          title={t('proPortal.sellerOrders.actions')}
          theme={config.theme}
        >
          <View style={styles.actionsCol}>
            {canShip ? (
              <Pressable
                disabled={isUpdating}
                onPress={handleShip}
                style={[
                  styles.actionBtn,
                  { backgroundColor: config.theme.primary, opacity: isUpdating ? 0.6 : 1 },
                ]}
              >
                <Ionicons
                  name="cube-outline"
                  size={16}
                  color={config.theme.textInverse}
                />
                <Text style={[styles.actionText, { color: config.theme.textInverse }]}>
                  {t('proPortal.sellerOrders.markAsShipped')}
                </Text>
              </Pressable>
            ) : null}

            {canDeliver ? (
              <Pressable
                disabled={isUpdating}
                onPress={handleDeliver}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: config.theme.success,
                    opacity: isUpdating ? 0.6 : 1,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={config.theme.textInverse}
                />
                <Text style={[styles.actionText, { color: config.theme.textInverse }]}>
                  {t('proPortal.sellerOrders.markAsDelivered')}
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/chat/[id]',
                  params: { id: order.buyer_id },
                } as any)
              }
              style={[
                styles.actionBtn,
                {
                  backgroundColor: config.theme.surface,
                  borderColor: config.theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={config.theme.textPrimary}
              />
              <Text style={[styles.actionText, { color: config.theme.textPrimary }]}>
                {t('proPortal.sellerOrders.contactBuyer')}
              </Text>
            </Pressable>
          </View>
        </Section>
    </ProLayout>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: { surface: string; border: string; textPrimary: string };
}) {
  return (
    <View
      style={[
        sectionStyles.section,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      <Text style={[sectionStyles.title, { color: theme.textPrimary }]}>
        {title}
      </Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { gap: 16 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: { fontSize: 14, fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  pageSubtitle: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemThumb: { width: 56, height: 56, borderRadius: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '700' },
  bodyText: { fontSize: 14, lineHeight: 20 },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalsLabel: { fontSize: 14, fontWeight: '600' },
  totalsValue: { fontSize: 18, fontWeight: '800' },
  actionsCol: { gap: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionText: { fontSize: 14, fontWeight: '700' },
});

const sectionStyles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { gap: 4 },
});
