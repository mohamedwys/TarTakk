import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useEnv } from '@/src/env';

export default function PaymentFailureScreen() {
  const { orderId, reason } = useLocalSearchParams<{
    orderId: string;
    reason?: string;
  }>();
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
      () => {}
    );
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: config.theme.error + '15' },
          ]}
        >
          <Ionicons name="close-circle" size={80} color={config.theme.error} />
        </View>

        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('payment.failureTitle')}
        </Text>

        <Text style={[styles.message, { color: config.theme.textSecondary }]}>
          {t('payment.failureMessage')}
        </Text>

        {reason && (
          <View
            style={[
              styles.reasonBox,
              {
                backgroundColor: config.theme.surface,
                borderColor: config.theme.border,
              },
            ]}
          >
            <Text
              style={[styles.reasonLabel, { color: config.theme.textSecondary }]}
            >
              {t('payment.errorReason')}
            </Text>
            <Text
              style={[styles.reasonText, { color: config.theme.textPrimary }]}
            >
              {reason}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.primaryButton, { backgroundColor: config.theme.primary }]}
          onPress={() => router.replace({ pathname: '/payment/[orderId]', params: { orderId } })}
        >
          <Ionicons name="refresh" size={20} color={config.theme.textInverse} />
          <Text
            style={[styles.primaryButtonText, { color: config.theme.textInverse }]}
          >
            {t('payment.tryAgain')}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace({ pathname: '/orders/[id]', params: { id: orderId } })}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: config.theme.textSecondary },
            ]}
          >
            {t('payment.backToOrder')}
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
  reasonBox: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  reasonLabel: { fontSize: 11, marginBottom: 4 },
  reasonText: { fontSize: 13, fontFamily: 'monospace' },
  footer: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },
  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700' },
  secondaryButton: { paddingVertical: 12, alignItems: 'center' },
  secondaryButtonText: { fontSize: 14 },
});
