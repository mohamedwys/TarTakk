import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { formatPrice } from '@/src/utils/currency';

type Props = {
  item: any;
  currency?: string;
};

export function OrderItemRow({ item, currency = 'MAD' }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const imageUri =
    item.product_image ??
    item.product?.thumbnail_url ??
    item.product?.images?.[0] ??
    null;
  const title = item.product_title ?? item.product?.title ?? 'Article';
  const quantity = item.quantity ?? 1;
  const unitPrice = item.unit_price ?? item.product?.price ?? 0;
  const lineTotal = item.subtotal ?? unitPrice * quantity;

  return (
    <View style={styles.row}>
      <View style={[styles.imageWrap, { backgroundColor: theme.surfaceMuted }]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={24} color={theme.textTertiary} />
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[
            typography.body,
            { color: theme.textPrimary, fontFamily: fontFamily.medium },
          ]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text style={[typography.caption, { color: theme.textTertiary, marginTop: 2 }]}>
          x{quantity} · {formatPrice(unitPrice, currency)}
        </Text>
      </View>
      <Text
        style={[
          typography.body,
          { color: theme.textPrimary, fontFamily: fontFamily.semibold },
        ]}
      >
        {formatPrice(lineTotal, currency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  imageWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 2 },
});
