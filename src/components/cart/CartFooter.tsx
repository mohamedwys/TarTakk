import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { Button, Divider } from '@/src/components/ui';
import { spacing, shadow } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { formatPrice } from '@/src/utils/currency';

type Props = {
  subtotal: number;
  shippingFee: number;
  currency: string;
  onCheckout: () => void;
  isLoading?: boolean;
};

export function CartFooter({
  subtotal,
  shippingFee,
  currency,
  onCheckout,
  isLoading,
}: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;

  const total = subtotal + shippingFee;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        shadow.lg,
      ]}
    >
      <View style={styles.summary}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="card-outline" size={16} color={theme.textTertiary} />
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              {t('cart.subtotal')}
            </Text>
          </View>
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.medium },
            ]}
          >
            {formatPrice(subtotal, currency)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="rocket-outline" size={16} color={theme.textTertiary} />
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              {t('cart.shippingFee')}
            </Text>
          </View>
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.medium },
            ]}
          >
            {formatPrice(shippingFee, currency)}
          </Text>
        </View>

        <Divider variant="subtle" spacing="sm" />

        <View style={styles.row}>
          <Text
            style={[
              typography.h4,
              { color: theme.textPrimary, fontFamily: fontFamily.bold },
            ]}
          >
            {t('cart.total')}
          </Text>
          <Text
            style={[
              typography.h3,
              { color: theme.primary, fontFamily: fontFamily.extrabold },
            ]}
          >
            {formatPrice(total, currency)}
          </Text>
        </View>
      </View>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        iconRight="arrow-forward"
        onPress={onCheckout}
      >
        {t('cart.proceedToCheckout')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
  },
  summary: { gap: spacing.xs, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
