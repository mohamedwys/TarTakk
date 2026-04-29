import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import { formatPrice } from '@/src/utils/currency';
import Toast from 'react-native-toast-message';

export default function CartScreen() {
  const { t } = useTranslation();
  const { config } = useEnv();
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

  const handleIncrement = async (item: CartItem) => {
    const stockQty = item.product?.stock_qty ?? 1;
    if (item.quantity >= stockQty) {
      Toast.show({
        type: 'info',
        text1: t('cart.outOfStockReached'),
      });
      return;
    }
    await updateQuantity(item.product_id, item.quantity + 1);
  };

  const handleDecrement = async (item: CartItem) => {
    await updateQuantity(item.product_id, item.quantity - 1);
  };

  const handleRemove = async (item: CartItem) => {
    Alert.alert(
      t('cart.removeItem'),
      item.product?.title ?? '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await removeItem(item.product_id);
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleClearCart = () => {
    Alert.alert(
      t('cart.clearCart'),
      t('cart.clearCartConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), style: 'destructive', onPress: () => clearCart() },
      ]
    );
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={config.theme.primary} />
        </View>
      </View>
    );
  }

  if (isEmpty) {
    return (
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={80} color={config.theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: config.theme.textPrimary }]}>
            {t('cart.emptyTitle')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: config.theme.textSecondary }]}>
            {t('cart.emptySubtitle')}
          </Text>
          <Pressable
            style={[styles.browseButton, { backgroundColor: config.theme.primary }]}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={[styles.browseButtonText, { color: config.theme.textInverse }]}>
              {t('cart.browseShopPro')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const currency = items[0]?.product?.currency ?? 'MAD';

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <View style={[styles.header, { borderBottomColor: config.theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: config.theme.textPrimary }]}>
            {t('cart.myCart')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: config.theme.textSecondary }]}>
            {t('cart.items', { count: totalItems })}
          </Text>
        </View>
        {items.length > 1 && (
          <Pressable onPress={handleClearCart}>
            <Text style={[styles.clearAllText, { color: config.theme.error }]}>
              {t('cart.clearCart')}
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={refresh}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <View
            style={[
              styles.itemRow,
              { backgroundColor: config.theme.surface, borderColor: config.theme.border },
            ]}
          >
            <Image
              source={{
                uri:
                  item.product?.thumbnail_url ??
                  item.product?.images?.[0] ??
                  '',
              }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            <View style={styles.itemInfo}>
              <Text
                style={[styles.itemTitle, { color: config.theme.textPrimary }]}
                numberOfLines={2}
              >
                {item.product?.title}
              </Text>
              <Text style={[styles.itemPrice, { color: config.theme.primary }]}>
                {formatPrice(item.product?.price ?? 0, item.product?.currency ?? 'MAD')}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={[
                    styles.qtyButton,
                    { backgroundColor: config.theme.background, borderColor: config.theme.border },
                  ]}
                  onPress={() => handleDecrement(item)}
                >
                  <Ionicons name="remove" size={18} color={config.theme.textPrimary} />
                </Pressable>
                <Text style={[styles.qtyText, { color: config.theme.textPrimary }]}>
                  {item.quantity}
                </Text>
                <Pressable
                  style={[
                    styles.qtyButton,
                    { backgroundColor: config.theme.background, borderColor: config.theme.border },
                  ]}
                  onPress={() => handleIncrement(item)}
                >
                  <Ionicons name="add" size={18} color={config.theme.textPrimary} />
                </Pressable>
                <Pressable style={styles.removeButton} onPress={() => handleRemove(item)}>
                  <Ionicons name="trash-outline" size={20} color={config.theme.error} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View
        style={[
          styles.footer,
          { backgroundColor: config.theme.surface, borderTopColor: config.theme.border },
        ]}
      >
        <View style={styles.totalsRow}>
          <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
            {t('cart.subtotal')}
          </Text>
          <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
            {formatPrice(totalAmount, currency)}
          </Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={[styles.totalLabel, { color: config.theme.textSecondary }]}>
            {t('cart.shippingFee')}
          </Text>
          <Text style={[styles.totalValue, { color: config.theme.textPrimary }]}>
            {formatPrice(SHIPPING_FEE, currency)}
          </Text>
        </View>
        <View style={[styles.totalsRow, styles.grandTotalRow, { borderTopColor: config.theme.border }]}>
          <Text style={[styles.grandTotalLabel, { color: config.theme.textPrimary }]}>
            {t('cart.total')}
          </Text>
          <Text style={[styles.grandTotalValue, { color: config.theme.primary }]}>
            {formatPrice(totalAmount + SHIPPING_FEE, currency)}
          </Text>
        </View>
        <Pressable
          style={[styles.checkoutButton, { backgroundColor: config.theme.primary }]}
          onPress={handleCheckout}
        >
          <Text style={[styles.checkoutButtonText, { color: config.theme.textInverse }]}>
            {t('cart.proceedToCheckout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginTop: 24 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  browseButton: { marginTop: 32, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  browseButtonText: { fontSize: 15, fontWeight: '600' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  headerSubtitle: { fontSize: 13 },
  clearAllText: { fontSize: 13, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  itemRow: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#F0F0F0' },
  itemInfo: { flex: 1, gap: 4 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  removeButton: { marginLeft: 'auto', padding: 4 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '600' },
  grandTotalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700' },
  grandTotalValue: { fontSize: 18, fontWeight: '800' },
  checkoutButton: { marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  checkoutButtonText: { fontSize: 16, fontWeight: '700' },
});
