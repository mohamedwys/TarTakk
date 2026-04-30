import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderTimeline } from './OrderTimeline';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';
import { formatPrice } from '@/src/utils/currency';

type Status = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

type Props = {
  order: {
    id: string;
    status: Status;
    total_amount: number;
    currency: string;
    created_at: string;
    order_items?: Array<{ quantity: number }>;
    items_count?: number;
  };
  index?: number;
};

export function OrderListCard({ order, index = 0 }: Props) {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const theme = config.theme;

  const orderRef = order.id?.substring(0, 8).toUpperCase() ?? '';
  const itemsCount =
    order.items_count ??
    order.order_items?.reduce((sum, oi) => sum + (oi.quantity ?? 1), 0) ??
    0;
  const dateStr = new Date(order.created_at).toLocaleDateString(
    i18n.language === 'fr' ? 'fr-MA' : i18n.language === 'ar' ? 'ar-MA' : 'en-MA',
    { day: 'numeric', month: 'short', year: 'numeric' },
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ ...animationConfig.smooth, delay: index * 40 }}
    >
      <Card
        elevation="raised"
        padding="md"
        onPress={() =>
          router.push({ pathname: '/orders/[id]', params: { id: order.id } } as any)
        }
      >
        <View style={styles.header}>
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.semibold },
            ]}
          >
            #{orderRef}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>

        <View style={styles.timelineWrap}>
          <OrderTimeline status={order.status} variant="mini" />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="cube-outline" size={14} color={theme.textTertiary} />
            <Text style={[typography.caption, { color: theme.textTertiary }]}>
              {t('orders.itemsCount', { count: itemsCount })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={theme.textTertiary} />
            <Text
              style={[
                typography.caption,
                { color: theme.textPrimary, fontFamily: fontFamily.semibold },
              ]}
            >
              {formatPrice(order.total_amount, order.currency || 'MAD')}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.textTertiary} />
            <Text style={[typography.caption, { color: theme.textTertiary }]}>{dateStr}</Text>
          </View>
        </View>
      </Card>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  timelineWrap: {
    marginVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
