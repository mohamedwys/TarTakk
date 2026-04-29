import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';

export default function ProPortalDashboard() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Text style={[styles.title, { color: config.theme.textPrimary }]}>
        {t('proPortal.dashboard.welcomeTitle', { name: user?.name ?? '' })}
      </Text>
      <Text style={[styles.subtitle, { color: config.theme.textSecondary }]}>
        {t('proPortal.dashboard.welcomeSubtitle')}
      </Text>
      <Text style={[styles.comingSoon, { color: config.theme.warning }]}>
        {t('proPortal.dashboard.comingSoon')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 32, paddingVertical: 32 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 8 },
  comingSoon: { fontSize: 13, fontStyle: 'italic', marginTop: 32 },
});
