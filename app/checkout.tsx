import React, { useState, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { useCart } from '@/src/cart';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/src/utils/currency';
import { createOrder } from '@/lib/services/orderService';
import { Button, Input, Divider } from '@/src/components/ui';
import { SectionCard, PaymentMethodCard } from '@/src/components/checkout';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import Toast from 'react-native-toast-message';

type PaymentMethod = 'cod' | 'bank_transfer' | 'cmi';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalAmount, clearCart, isEmpty } = useCart();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);

  const SHIPPING_FEE = 30;
  const currency = items[0]?.product?.currency ?? 'MAD';
  const grandTotal = totalAmount + SHIPPING_FEE;

  useEffect(() => {
    if (isEmpty && !isProcessing) {
      router.replace('/(tabs)');
    }
  }, [isEmpty, isProcessing, router]);

  if (isEmpty) {
    return null;
  }

  const validateForm = (): boolean => {
    if (!name.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      Toast.show({ type: 'error', text1: t('checkout.fillAllFields') });
      return false;
    }
    return true;
  };

  const handleConfirmOrder = async () => {
    if (!validateForm()) return;
    if (!user?._id) return;

    setIsProcessing(true);
    try {
      const { orderId } = await createOrder({
        buyerId: user._id,
        items,
        shippingFee: SHIPPING_FEE,
        currency,
        paymentMethod,
        shippingAddress: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
        },
        shippingNotes: notes.trim() || undefined,
      });

      if (paymentMethod === 'cmi') {
        router.replace({ pathname: '/payment/[orderId]', params: { orderId } });
      } else {
        await clearCart();
        const orderRef = orderId.substring(0, 8).toUpperCase();
        Toast.show({
          type: 'success',
          text1: t('checkout.orderSuccess'),
          text2: t('checkout.orderSuccessMessage', { orderRef }),
          visibilityTime: 4000,
        });
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('[checkout] failed:', err);
      Toast.show({
        type: 'error',
        text1: t('checkout.orderFailed'),
        text2: err?.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: t('checkout.title'), headerShown: true }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionCard
            icon="bag-outline"
            title={`${t('checkout.items')} (${items.length})`}
          >
            {items.map((item) => {
              const product: any = item.product ?? {};
              const lineTotal = (product.price ?? 0) * item.quantity;
              return (
                <View key={item.id} style={styles.itemRow}>
                  <View
                    style={[
                      styles.itemImageWrap,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    {product.thumbnail_url ? (
                      <Image
                        source={{ uri: product.thumbnail_url }}
                        style={styles.itemImage}
                      />
                    ) : (
                      <Ionicons
                        name="cube-outline"
                        size={20}
                        color={theme.textTertiary}
                      />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text
                      style={[
                        typography.bodySmall,
                        { color: theme.textPrimary, fontFamily: fontFamily.semibold },
                      ]}
                      numberOfLines={1}
                    >
                      {product.title}
                    </Text>
                    <Text
                      style={[typography.caption, { color: theme.textTertiary }]}
                    >
                      x{item.quantity} · {formatPrice(product.price ?? 0, currency)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.body,
                      { color: theme.primary, fontFamily: fontFamily.bold },
                    ]}
                  >
                    {formatPrice(lineTotal, currency)}
                  </Text>
                </View>
              );
            })}
          </SectionCard>

          <SectionCard
            icon="location-outline"
            title={t('checkout.shippingAddress')}
          >
            <Input
              label={t('checkout.fullName')}
              value={name}
              onChangeText={setName}
            />
            <Input
              label={t('checkout.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              label={t('checkout.address')}
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <Input
              label={t('checkout.city')}
              value={city}
              onChangeText={setCity}
            />
            <Input
              label={t('checkout.shippingNotes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              helperText={t('checkout.shippingNotesPlaceholder')}
            />
          </SectionCard>

          <SectionCard icon="card-outline" title={t('checkout.paymentMethod')}>
            <PaymentMethodCard
              selected={paymentMethod === 'cod'}
              onSelect={() => setPaymentMethod('cod')}
              icon="cash-outline"
              title={t('checkout.cod')}
              description={t('checkout.codDescription')}
            />
            <PaymentMethodCard
              selected={paymentMethod === 'bank_transfer'}
              onSelect={() => setPaymentMethod('bank_transfer')}
              icon="business-outline"
              title={t('checkout.bankTransfer')}
              description={t('checkout.bankTransferDescription')}
            />
            <PaymentMethodCard
              selected={paymentMethod === 'cmi'}
              onSelect={() => setPaymentMethod('cmi')}
              icon="card"
              title={t('checkout.cmi')}
              description={t('checkout.cmiDescription')}
              badge="Test"
            />
          </SectionCard>

          <SectionCard icon="receipt-outline" title={t('checkout.summary')}>
            <View style={styles.summaryRow}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>
                {t('checkout.subtotal')}
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: theme.textPrimary, fontFamily: fontFamily.medium },
                ]}
              >
                {formatPrice(totalAmount, currency)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>
                {t('checkout.shippingFee')}
              </Text>
              <Text
                style={[
                  typography.body,
                  { color: theme.textPrimary, fontFamily: fontFamily.medium },
                ]}
              >
                {formatPrice(SHIPPING_FEE, currency)}
              </Text>
            </View>
            <Divider variant="subtle" spacing="sm" />
            <View style={styles.summaryRow}>
              <Text
                style={[
                  typography.h4,
                  { color: theme.textPrimary, fontFamily: fontFamily.bold },
                ]}
              >
                {t('checkout.total')}
              </Text>
              <Text
                style={[
                  typography.h3,
                  { color: theme.primary, fontFamily: fontFamily.extrabold },
                ]}
              >
                {formatPrice(grandTotal, currency)}
              </Text>
            </View>
          </SectionCard>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
            },
            shadow.lg,
          ]}
        >
          <View style={styles.footerTotals}>
            <Text style={[typography.caption, { color: theme.textTertiary }]}>
              {t('checkout.total')}
            </Text>
            <Text
              style={[
                typography.h3,
                { color: theme.primary, fontFamily: fontFamily.extrabold },
              ]}
            >
              {formatPrice(grandTotal, currency)}
            </Text>
          </View>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isProcessing}
            iconRight="checkmark-circle"
            onPress={handleConfirmOrder}
          >
            {t('checkout.confirmOrder')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  itemImageWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, gap: 2 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
  },
  footerTotals: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
