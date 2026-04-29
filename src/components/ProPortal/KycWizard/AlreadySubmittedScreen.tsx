import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import type { KycSubmission } from '@/lib/services/kycService';

type Props = {
  submission: KycSubmission | null;
};

export function AlreadySubmittedScreen({ submission }: Props) {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();

  const submittedAt = submission?.submitted_at
    ? formatDate(submission.submitted_at, i18n.language)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: config.theme.surface, borderColor: config.theme.border },
        ]}
      >
        <Ionicons name="hourglass-outline" size={56} color={config.theme.warning} />
        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('proPortal.kyc.alreadySubmittedTitle')}
        </Text>
        <Text style={[styles.message, { color: config.theme.textSecondary }]}>
          {t('proPortal.kyc.alreadySubmittedMessage')}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.theme.warning + '22' },
          ]}
        >
          <Text style={[styles.statusText, { color: config.theme.warning }]}>
            {submission?.status ?? 'pending'}
          </Text>
        </View>
        {submittedAt ? (
          <Text style={[styles.dateText, { color: config.theme.textSecondary }]}>
            {t('proPortal.kyc.alreadySubmittedDate', { date: submittedAt })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function formatDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale.startsWith('ar') ? 'ar-MA' : locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  statusText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  dateText: { fontSize: 12, marginTop: 4 },
});
