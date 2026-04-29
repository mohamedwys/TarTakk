import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';

export default function ProPortalOnboarding() {
  const { t } = useTranslation();
  const { config } = useEnv();

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Ionicons name="construct-outline" size={64} color={config.theme.warning} />
      <Text style={[styles.title, { color: config.theme.textPrimary }]}>KYC Onboarding</Text>
      <Text style={[styles.message, { color: config.theme.textSecondary }]}>
        {t('proPortal.onboarding.comingSoon')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 24, fontWeight: '700' },
  message: { fontSize: 14, textAlign: 'center' },
});
