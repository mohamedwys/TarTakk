import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Stack } from 'expo-router';
import { useEnv } from '@/src/env';
import { ProLayout } from '@/src/components/pro-portal';
import { AdminKycListCard, AdminStatsCard } from '@/src/components/admin';
import { FilterPills } from '@/src/components/orders';
import {
  fetchAllKycSubmissions,
  fetchKycStats,
  isCurrentUserAdmin,
  type AdminKycRow,
  type AdminKycStats,
} from '@/lib/services/adminKycService';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type FilterType = 'all' | 'pending' | 'under_review' | 'approved' | 'rejected';

export default function AdminKycListScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [submissions, setSubmissions] = useState<AdminKycRow[]>([]);
  const [stats, setStats] = useState<AdminKycStats | null>(null);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    isCurrentUserAdmin().then(setIsAdmin);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        fetchAllKycSubmissions(filter),
        fetchKycStats(),
      ]);
      setSubmissions(list);
      setStats(statsData);
    } catch (err) {
      console.error('[Admin] loadData error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  if (isAdmin === false) {
    return (
      <ProLayout maxWidth={520}>
        <View style={styles.deniedWrap}>
          <Text
            style={[
              typography.h2,
              { color: theme.error, fontFamily: fontFamily.bold },
            ]}
          >
            {t('proPortal.admin.accessDenied')}
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: theme.textSecondary,
                textAlign: 'center',
                marginTop: spacing.sm,
              },
            ]}
          >
            {t('proPortal.admin.accessDeniedMessage')}
          </Text>
        </View>
      </ProLayout>
    );
  }

  if (isAdmin === null) {
    return (
      <ProLayout maxWidth={520}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ProLayout>
    );
  }

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('proPortal.admin.filter.all') },
    { key: 'pending', label: t('proPortal.admin.filter.pending') },
    { key: 'under_review', label: t('proPortal.admin.filter.under_review') },
    { key: 'approved', label: t('proPortal.admin.filter.approved') },
    { key: 'rejected', label: t('proPortal.admin.filter.rejected') },
  ];

  return (
    <ProLayout maxWidth={1200}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.h1,
            { color: theme.textPrimary, fontFamily: fontFamily.extrabold },
          ]}
        >
          {t('proPortal.admin.title')}
        </Text>
        <Text
          style={[
            typography.body,
            { color: theme.textSecondary, marginTop: 4 },
          ]}
        >
          {t('proPortal.admin.subtitle')}
        </Text>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <AdminStatsCard
            icon="documents-outline"
            label={t('proPortal.admin.stats.total')}
            value={stats.total}
          />
          <AdminStatsCard
            icon="time-outline"
            label={t('proPortal.admin.stats.pending')}
            value={stats.pending}
            accentColor="#F59E0B"
          />
          <AdminStatsCard
            icon="checkmark-circle-outline"
            label={t('proPortal.admin.stats.approvedMonth')}
            value={stats.approved_this_month}
            accentColor="#10B981"
          />
          <AdminStatsCard
            icon="close-circle-outline"
            label={t('proPortal.admin.stats.rejected')}
            value={stats.rejected}
            accentColor="#DC2626"
          />
        </View>
      )}

      <View style={{ marginBottom: spacing.md }}>
        <FilterPills
          filters={FILTERS}
          selected={filter}
          onSelect={setFilter}
        />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : submissions.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[typography.body, { color: theme.textTertiary }]}>
            {t('proPortal.admin.noSubmissions')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {submissions.map((sub) => (
            <AdminKycListCard key={sub.id} submission={sub} />
          ))}
        </View>
      )}
    </ProLayout>
  );
}

const styles = StyleSheet.create({
  deniedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  centered: { padding: spacing.xl, alignItems: 'center' },
});
