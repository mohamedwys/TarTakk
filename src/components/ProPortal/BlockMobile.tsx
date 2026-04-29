import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';

export function BlockMobileWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return <>{children}</>;
  }
  return <BlockMobileScreen />;
}

function BlockMobileScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: config.theme.primary + '15' }]}>
        <Ionicons name="desktop-outline" size={64} color={config.theme.primary} />
      </View>
      <Text style={[styles.title, { color: config.theme.textPrimary }]}>
        {t('proPortal.blockMobileTitle')}
      </Text>
      <Text style={[styles.message, { color: config.theme.textSecondary }]}>
        {t('proPortal.blockMobileMessage')}
      </Text>
      <View
        style={[
          styles.urlBox,
          { backgroundColor: config.theme.surface, borderColor: config.theme.border },
        ]}
      >
        <Text style={[styles.urlLabel, { color: config.theme.textSecondary }]}>
          {t('proPortal.blockMobileUrl')}
        </Text>
        <Text style={[styles.urlText, { color: config.theme.primary }]}>
          tartakk.com/pro-portal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  message: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  urlBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 4,
  },
  urlLabel: { fontSize: 12 },
  urlText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Platform.select({ web: 'monospace', default: undefined }),
  },
});
