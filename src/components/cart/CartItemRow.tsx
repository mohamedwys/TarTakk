import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Card, IconButton } from '@/src/components/ui';
import { QtyStepper } from './QtyStepper';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { formatPrice } from '@/src/utils/currency';
import type { CartItem } from '@/src/cart';

type Props = {
  item: CartItem;
  onQuantityChange: (qty: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, onQuantityChange, onRemove }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const product: any = item.product ?? {};
  const imageUri = product.thumbnail_url ?? product.images?.[0] ?? null;
  const cityLabel = product.city ?? '';
  const stockQty = product.stock_qty ?? 99;
  const lineTotal = (product.price ?? 0) * item.quantity;
  const currency = product.currency || 'MAD';

  return (
    <Card elevation="raised" padding="md">
      <View style={styles.row}>
        <View style={[styles.imageWrap, { backgroundColor: theme.surfaceMuted }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <Ionicons name="cube-outline" size={32} color={theme.textTertiary} />
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.semibold },
            ]}
            numberOfLines={2}
          >
            {product.title ?? ''}
          </Text>

          {cityLabel ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={theme.textTertiary} />
              <Text style={[typography.caption, { color: theme.textTertiary }]}>
                {cityLabel}
              </Text>
            </View>
          ) : null}

          <Text
            style={[styles.price, { color: theme.primary, fontFamily: fontFamily.bold }]}
          >
            {formatPrice(lineTotal, currency)}
          </Text>

          <View style={styles.actionsRow}>
            <QtyStepper
              value={item.quantity}
              max={stockQty}
              onChange={onQuantityChange}
            />
            <View style={{ marginLeft: 'auto' }}>
              <IconButton
                icon="trash-outline"
                variant="ghost"
                size="sm"
                onPress={onRemove}
                accessibilityLabel="Remove item"
              />
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  price: { fontSize: 16, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
