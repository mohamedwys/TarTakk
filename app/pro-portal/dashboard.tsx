import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchSellerKpis,
  fetchRecentOrders,
  type SellerKpis,
  type RecentOrderRow,
} from '@/lib/services/sellerStatsService';
import { formatPrice } from '@/src/utils/currency';
import { KpiCard } from '@/src/components/ProPortal/Dashboard/KpiCard';
import { RecentOrdersTable } from '@/src/components/ProPortal/Dashboard/RecentOrdersTable';
import { ProLayout } from '@/src/components/pro-portal';

export default function ProPortalDashboard() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [kpis, setKpis] = useState<SellerKpis | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const [kpisData, ordersData] = await Promise.all([
        fetchSellerKpis(user._id),
        fetchRecentOrders(user._id, 5),
      ]);
      setKpis(kpisData);
      setRecentOrders(ordersData);
    } catch (err) {
      console.error('[Dashboard] loadData error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !kpis) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <ActivityIndicator size="large" color={config.theme.primary} />
      </View>
    );
  }

  return (
    <ProLayout maxWidth={1200} scrollable contentStyle={styles.scrollContent}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerSection}>
        <Text style={[styles.welcomeTitle, { color: config.theme.textPrimary }]}>
          {t('proPortal.dashboard.welcomeTitle', { name: user?.name ?? '' })}
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: config.theme.textSecondary }]}>
          {user?.companyName
            ? t('proPortal.dashboard.myStore', { name: user.companyName })
            : t('proPortal.dashboard.welcomeSubtitle')}
        </Text>
      </View>

      <View style={styles.kpiGrid}>
        <KpiCard
          icon="cart-outline"
          label={t('proPortal.dashboard.kpi.salesThisMonth')}
          value={String(kpis.salesThisMonth)}
          subtitle={t('proPortal.dashboard.kpiSubtitle.salesThisMonth', {
            count: kpis.salesThisMonth,
          })}
          accentColor="#3B82F6"
        />
        <KpiCard
          icon="time-outline"
          label={t('proPortal.dashboard.kpi.pendingOrders')}
          value={String(kpis.pendingOrders)}
          subtitle={t('proPortal.dashboard.kpiSubtitle.pendingOrders')}
          accentColor="#F59E0B"
        />
        <KpiCard
          icon="cube-outline"
          label={t('proPortal.dashboard.kpi.activeProducts')}
          value={String(kpis.activeProducts)}
          subtitle={t('proPortal.dashboard.kpiSubtitle.activeProducts')}
          accentColor="#10B981"
        />
        <KpiCard
          icon="trending-up-outline"
          label={t('proPortal.dashboard.kpi.revenueThisMonth')}
          value={formatPrice(kpis.revenueThisMonth, kpis.currency)}
          subtitle={t('proPortal.dashboard.kpiSubtitle.revenueThisMonth')}
          accentColor="#8B5CF6"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.dashboard.recentOrders')}
          </Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/pro-portal/orders' } as any)
            }
          >
            <Text style={[styles.viewAllLink, { color: config.theme.primary }]}>
              {t('proPortal.dashboard.viewAllOrders')} →
            </Text>
          </Pressable>
        </View>
        <RecentOrdersTable
          orders={recentOrders}
          onOrderPress={(orderId) =>
            router.push({
              pathname: '/pro-portal/orders/[id]',
              params: { id: orderId },
            } as any)
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
          {t('proPortal.dashboard.quickActions')}
        </Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.actionCard, { backgroundColor: config.theme.primary }]}
            onPress={() =>
              router.push({ pathname: '/pro-portal/products/new' } as any)
            }
          >
            <Ionicons
              name="add-circle-outline"
              size={32}
              color={config.theme.textInverse}
            />
            <Text
              style={[styles.actionLabel, { color: config.theme.textInverse }]}
            >
              {t('proPortal.dashboard.createProduct')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionCard,
              {
                backgroundColor: config.theme.surface,
                borderColor: config.theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={() =>
              router.push({ pathname: '/pro-portal/products' } as any)
            }
          >
            <Ionicons name="cube-outline" size={32} color={config.theme.primary} />
            <Text
              style={[styles.actionLabel, { color: config.theme.textPrimary }]}
            >
              {t('proPortal.dashboard.viewProducts')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionCard,
              {
                backgroundColor: config.theme.surface,
                borderColor: config.theme.border,
                borderWidth: 1,
              },
            ]}
            onPress={() =>
              router.push({ pathname: '/pro-portal/orders' } as any)
            }
          >
            <Ionicons name="receipt-outline" size={32} color={config.theme.primary} />
            <Text
              style={[styles.actionLabel, { color: config.theme.textPrimary }]}
            >
              {t('proPortal.dashboard.viewOrders')}
            </Text>
          </Pressable>
        </View>
      </View>
    </ProLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 24,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerSection: { gap: 4 },
  welcomeTitle: { fontSize: 28, fontWeight: '800' },
  welcomeSubtitle: { fontSize: 15 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  viewAllLink: { fontSize: 14, fontWeight: '600' },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: 200,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },
});
