import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useCart } from '@/src/cart';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/src/utils/currency';
import { createOrder } from '@/lib/services/orderService';
import Toast from 'react-native-toast-message';

type PaymentMethod = 'cod' | 'bank_transfer' | 'cmi';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
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
        // Cart is cleared in payment/success.tsx after payment confirmation,
        // so the user can retry without re-filling the cart.
        router.replace(`/payment/${orderId}`);
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
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ title: t('checkout.title'), headerShown: true }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.section,
              { backgroundColor: config.theme.surface, borderColor: config.theme.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
              {t('checkout.items')} ({items.length})
            </Text>
            {items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image
                  source={{ uri: item.product?.thumbnail_url ?? '' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text
                    style={[styles.itemTitle, { color: config.theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.product?.title}
                  </Text>
                  <Text style={[styles.itemMeta, { color: config.theme.textSecondary }]}>
                    x{item.quantity}  ·  {formatPrice(item.product?.price ?? 0, currency)}
                  </Text>
                </View>
                <Text style={[styles.itemSubtotal, { color: config.theme.primary }]}>
                  {formatPrice((item.product?.price ?? 0) * item.quantity, currency)}
                </Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: config.theme.surface, borderColor: config.theme.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
              {t('checkout.shippingAddress')}
            </Text>

            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('checkout.fullName')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('checkout.fullNamePlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('checkout.phone')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('checkout.phonePlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('checkout.address')}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('checkout.addressPlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('checkout.city')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('checkout.cityPlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={city}
              onChangeText={setCity}
            />

            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('checkout.shippingNotes')}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('checkout.shippingNotesPlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: config.theme.surface, borderColor: config.theme.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
              {t('checkout.paymentMethod')}
            </Text>

            <PaymentOption
              method="cod"
              selected={paymentMethod === 'cod'}
              onSelect={() => setPaymentMethod('cod')}
              label={t('checkout.cod')}
              description={t('checkout.codDescription')}
              theme={config.theme}
            />
            <PaymentOption
              method="bank_transfer"
              selected={paymentMethod === 'bank_transfer'}
              onSelect={() => setPaymentMethod('bank_transfer')}
              label={t('checkout.bankTransfer')}
              description={t('checkout.bankTransferDescription')}
              theme={config.theme}
            />
            <PaymentOption
              method="cmi"
              selected={paymentMethod === 'cmi'}
              onSelect={() => setPaymentMethod('cmi')}
              label={t('checkout.cmi')}
              description={t('checkout.cmiDescription')}
              theme={config.theme}
            />
          </View>

          <View
            style={[
              styles.section,
              { backgroundColor: config.theme.surface, borderColor: config.theme.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
              {t('checkout.summary')}
            </Text>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
                {t('checkout.subtotal')}
              </Text>
              <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
                {formatPrice(totalAmount, currency)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
                {t('checkout.shippingFee')}
              </Text>
              <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
                {formatPrice(SHIPPING_FEE, currency)}
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
                {t('checkout.total')}
              </Text>
              <Text style={[styles.grandTotalValue, { color: config.theme.primary }]}>
                {formatPrice(grandTotal, currency)}
              </Text>
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: config.theme.surface, borderTopColor: config.theme.border },
          ]}
        >
          <Pressable
            style={[
              styles.confirmButton,
              { backgroundColor: config.theme.primary },
              isProcessing && styles.disabledButton,
            ]}
            onPress={handleConfirmOrder}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={config.theme.textInverse} />
            ) : (
              <Text style={[styles.confirmButtonText, { color: config.theme.textInverse }]}>
                {t('checkout.confirmOrder')}  ·  {formatPrice(grandTotal, currency)}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function PaymentOption({
  selected,
  onSelect,
  label,
  description,
  theme,
  disabled,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
  theme: any;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.paymentRow,
        selected && { borderColor: theme.primary, backgroundColor: theme.primary + '10' },
        !selected && { borderColor: theme.border },
        disabled && { opacity: 0.5 },
      ]}
      onPress={onSelect}
      disabled={disabled}
    >
      <View style={[styles.radio, selected && { borderColor: theme.primary }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.paymentLabel, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[styles.paymentDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  itemImage: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F0F0F0' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 8, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  paymentLabel: { fontSize: 14, fontWeight: '600' },
  paymentDescription: { fontSize: 12, marginTop: 2 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 13 },
  totalValue: { fontSize: 14, fontWeight: '500' },
  grandTotalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' },
  grandTotalValue: { fontSize: 18, fontWeight: '800' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmButtonText: { fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
});
