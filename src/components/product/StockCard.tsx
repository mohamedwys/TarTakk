import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  stockQty: number;
  showShipping?: boolean;
};

export function StockCard({ stockQty, showShipping = false }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;

  const isOutOfStock = stockQty <= 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;

  const stockColor = isOutOfStock ? theme.error : isLowStock ? theme.warning : theme.success;
  const stockBg = isOutOfStock
    ? theme.error + '15'
    : isLowStock
    ? theme.accentSoft
    : '#D1FAE5';

  const stockLabel = isOutOfStock
    ? t('product.outOfStock')
    : isLowStock
    ? t('product.lowStock', { count: stockQty })
    : t('product.inStock', { count: stockQty });

  return (
    <View style={[styles.container, { backgroundColor: stockBg, borderColor: stockColor + '30' }]}>
      <View style={styles.row}>
        <Ionicons name="cube-outline" size={20} color={stockColor} />
        <Text style={[typography.body, styles.text, { color: stockColor, fontFamily: fontFamily.semibold }]}>
          {stockLabel}
        </Text>
      </View>
      {showShipping && (
        <View style={styles.row}>
          <Ionicons name="rocket-outline" size={20} color={theme.success} />
          <Text style={[typography.body, styles.text, { color: theme.success, fontFamily: fontFamily.medium }]}>
            {t('product.freeShipping')}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: 14,
  },
});
