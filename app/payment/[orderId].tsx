import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import {
  initiateCmiPayment,
  mockSimulatePaymentResult,
  markOrderAsPaid,
  markOrderAsFailed,
  isMockMode,
} from '@/lib/services/paymentService';
import { fetchOrderById } from '@/lib/services/orderService';
import { useAuth } from '@/contexts/AuthContext';

type Step = 'loading_order' | 'connecting' | 'processing' | 'verifying';

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('loading_order');

  useEffect(() => {
    let cancelled = false;

    const runPaymentFlow = async () => {
      if (!orderId) return;

      try {
        setStep('loading_order');
        const orderData = await fetchOrderById(orderId);
        if (cancelled) return;

        setStep('connecting');
        await new Promise((r) => setTimeout(r, 1000));
        if (cancelled) return;

        const { isMock } = await initiateCmiPayment({
          orderId,
          amount: orderData.total_amount,
          currency: orderData.currency,
          customerEmail: user?.email ?? '',
          customerPhone: orderData.shipping_phone ?? '',
        });

        if (cancelled) return;

        if (isMock) {
          setStep('processing');
          await new Promise((r) => setTimeout(r, 2000));
          if (cancelled) return;

          setStep('verifying');
          await new Promise((r) => setTimeout(r, 1000));
          if (cancelled) return;

          const result = mockSimulatePaymentResult();

          if (result.success) {
            await markOrderAsPaid(orderId, result.transactionId!);
            router.replace(`/payment/success?orderId=${orderId}`);
          } else {
            await markOrderAsFailed(orderId, result.errorMessage!);
            router.replace(
              `/payment/failure?orderId=${orderId}&reason=${encodeURIComponent(
                result.errorMessage!
              )}`
            );
          }
        } else {
          // Real CMI integration: render a WebView pointing at paymentUrl,
          // intercept return/failure URLs, then call markOrderAsPaid /
          // markOrderAsFailed accordingly. See docs/CMI_INTEGRATION.md.
          throw new Error('Real CMI integration not yet implemented');
        }
      } catch (err: any) {
        console.error('[payment] flow error:', err);
        if (cancelled) return;
        router.replace(
          `/payment/failure?orderId=${orderId}&reason=${encodeURIComponent(
            err?.message ?? 'Unknown error'
          )}`
        );
      }
    };

    runPaymentFlow();

    return () => {
      cancelled = true;
    };
  }, [orderId, user?.email, router]);

  const handleCancel = () => {
    Alert.alert(t('payment.cancel'), t('payment.cancelConfirm'), [
      { text: t('common.no'), style: 'cancel' },
      {
        text: t('common.yes'),
        style: 'destructive',
        onPress: () => router.replace(`/orders/${orderId}`),
      },
    ]);
  };

  const stepText =
    step === 'loading_order'
      ? t('payment.loading')
      : step === 'connecting'
        ? t('payment.connecting')
        : step === 'processing'
          ? t('payment.processingPayment')
          : t('payment.verifyingTransaction');

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen
        options={{
          title: t('payment.title'),
          headerShown: true,
          headerLeft: () => null,
        }}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: config.theme.primary + '15' },
          ]}
        >
          <Ionicons name="lock-closed" size={48} color={config.theme.primary} />
        </View>

        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('payment.title')}
        </Text>

        <ActivityIndicator
          size="large"
          color={config.theme.primary}
          style={{ marginTop: 24 }}
        />

        <Text style={[styles.stepText, { color: config.theme.textSecondary }]}>
          {stepText}
        </Text>

        <View
          style={[
            styles.notice,
            {
              backgroundColor: config.theme.surface,
              borderColor: config.theme.border,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={config.theme.success}
          />
          <Text style={[styles.noticeText, { color: config.theme.textSecondary }]}>
            {t('payment.secureNotice')}
          </Text>
        </View>

        <Text style={[styles.warningText, { color: config.theme.warning }]}>
          {t('payment.doNotClose')}
        </Text>

        {isMockMode && (
          <View
            style={[
              styles.mockBadge,
              { backgroundColor: config.theme.warning + '20' },
            ]}
          >
            <Ionicons name="flask" size={16} color={config.theme.warning} />
            <Text
              style={[styles.mockBadgeText, { color: config.theme.warning }]}
            >
              {t('payment.mockMode')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={handleCancel}>
          <Text style={[styles.cancelText, { color: config.theme.error }]}>
            {t('payment.cancel')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700' },
  stepText: { fontSize: 14, marginTop: 16, textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 32,
  },
  noticeText: { fontSize: 12, flex: 1 },
  warningText: { fontSize: 12, marginTop: 16, textAlign: 'center' },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 16,
  },
  mockBadgeText: { fontSize: 11, fontWeight: '600' },
  footer: { paddingBottom: 32, alignItems: 'center' },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
