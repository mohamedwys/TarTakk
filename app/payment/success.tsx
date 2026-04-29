import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useEnv } from '@/src/env';
import { useCart } from '@/src/cart';

export default function PaymentSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    clearCart().catch(() => {});
  }, [clearCart]);

  const orderRef = orderId?.substring(0, 8).toUpperCase() ?? '';

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: config.theme.success + '15' },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={config.theme.success}
          />
        </View>

        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('payment.successTitle')}
        </Text>

        <Text style={[styles.message, { color: config.theme.textSecondary }]}>
          {t('payment.successMessage', { orderRef })}
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: config.theme.primary }]}
          onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: orderId } })}
        >
          <Text
            style={[styles.primaryButtonText, { color: config.theme.textInverse }]}
          >
            {t('payment.viewOrder')}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: config.theme.textSecondary },
            ]}
          >
            {t('payment.continueShopping')}
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
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },
  primaryButton: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontSize: 14 },
});
