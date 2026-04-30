import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { useCart } from '@/src/cart';
import type { CartItem } from '@/src/cart';
import { Button } from '@/src/components/ui';
import { CartItemRow, CartFooter } from '@/src/components/cart';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import Toast from 'react-native-toast-message';

export default function CartScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;
  const router = useRouter();
  const {
    items,
    isLoading,
    totalItems,
    totalAmount,
    isEmpty,
    updateQuantity,
    removeItem,
    clearCart,
    refresh,
  } = useCart();

  const SHIPPING_FEE = items.length > 0 ? 30 : 0;
  const currency = items[0]?.product?.currency ?? 'MAD';

  const handleQuantityChange = async (item: CartItem, qty: number) => {
    const stockQty = item.product?.stock_qty ?? 1;
    if (qty > stockQty) {
      Toast.show({ type: 'info', text1: t('cart.outOfStockReached') });
      return;
    }
    if (qty < 1) return;
    await updateQuantity(item.product_id, qty);
  };

  const handleRemove = (item: CartItem) => {
    Alert.alert(t('cart.removeItem'), item.product?.title ?? '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeItem(item.product_id);
        },
      },
    ]);
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleClearCart = () => {
    Alert.alert(t('cart.clearCart'), t('cart.clearCartConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: () => clearCart(),
      },
    ]);
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name="cart-outline" size={56} color={theme.textTertiary} />
          </View>
          <Text
            style={[
              typography.h2,
              {
                color: theme.textPrimary,
                fontFamily: fontFamily.extrabold,
                marginTop: spacing.lg,
                textAlign: 'center',
              },
            ]}
          >
            {t('cart.emptyTitle')}
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: theme.textSecondary,
                marginTop: spacing.xs,
                textAlign: 'center',
              },
            ]}
          >
            {t('cart.emptySubtitle')}
          </Text>
          <View style={{ marginTop: spacing.xl, width: '100%' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              iconLeft="storefront-outline"
              onPress={() => router.push('/(tabs)')}
            >
              {t('cart.browseShopPro')}
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text
              style={[
                typography.h2,
                { color: theme.textPrimary, fontFamily: fontFamily.extrabold },
              ]}
            >
              {t('cart.myCart')}
            </Text>
            <Text style={[typography.bodySmall, { color: theme.textSecondary }]}>
              {t('cart.items', { count: totalItems })}
            </Text>
          </View>
          {items.length > 1 && (
            <Pressable onPress={handleClearCart} hitSlop={8}>
              <Text
                style={[
                  typography.bodySmall,
                  {
                    color: theme.error,
                    fontFamily: fontFamily.semibold,
                  },
                ]}
              >
                {t('cart.clearCart')}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refresh}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onQuantityChange={(qty) => handleQuantityChange(item, qty)}
            onRemove={() => handleRemove(item)}
          />
        )}
      />

      <CartFooter
        subtotal={totalAmount}
        shippingFee={SHIPPING_FEE}
        currency={currency}
        onCheckout={handleCheckout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: 240,
    gap: spacing.sm,
  },
});
