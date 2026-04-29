import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';

type Props = {
  current: number;
  total: number;
  title?: string;
};

export function StepIndicator({ current, total, title }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const progress = Math.max(0, Math.min(1, current / total));

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: config.theme.textSecondary }]}>
          {t('proPortal.kyc.stepIndicator', { current, total })}
        </Text>
        {title ? (
          <Text style={[styles.title, { color: config.theme.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: config.theme.border }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: config.theme.primary, width: `${progress * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, marginBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
