import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { KycStatusBadge } from './KycStatusBadge';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import type { AdminKycRow } from '@/lib/services/adminKycService';

type Props = {
  submission: AdminKycRow;
};

export function AdminKycListCard({ submission }: Props) {
  const { i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const theme = config.theme;

  const locale =
    i18n.language === 'fr' ? 'fr-MA' : i18n.language === 'ar' ? 'ar-MA' : 'en-MA';

  const dateStr = new Date(submission.submitted_at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      elevation="raised"
      padding="md"
      onPress={() =>
        router.push({
          pathname: '/pro-portal/admin/kyc/[id]',
          params: { id: submission.id },
        } as any)
      }
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.h4,
              { color: theme.textPrimary, fontFamily: fontFamily.bold },
            ]}
          >
            {submission.business_name}
          </Text>
          <Text
            style={[typography.caption, { color: theme.textTertiary, marginTop: 2 }]}
          >
            {submission.user_email ?? '—'}
            {submission.user_name ? ` · ${submission.user_name}` : ''}
          </Text>
        </View>
        <KycStatusBadge status={submission.status} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="business-outline" size={14} color={theme.textTertiary} />
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            ICE: {submission.ice_number}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={theme.textTertiary} />
          <Text style={[typography.caption, { color: theme.textSecondary }]}>
            {submission.business_city}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={theme.textTertiary} />
          <Text style={[typography.caption, { color: theme.textTertiary }]}>
            {dateStr}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
