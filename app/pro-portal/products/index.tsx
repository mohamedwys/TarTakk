import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/src/utils/currency';
import {
  deleteProduct,
  fetchMyProducts,
  fetchProductCategories,
  toggleProductActive,
  type ProductCategory,
  type SellerProductRow,
} from '@/lib/services/sellerProductsService';
import { ProLayout } from '@/src/components/pro-portal';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function ProPortalProductsList() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<SellerProductRow[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    try {
      const [list, cats] = await Promise.all([
        fetchMyProducts(user._id),
        fetchProductCategories(),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      console.error('[ProductsList] loadData error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.products.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, t]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      return true;
    });
  }, [products, statusFilter, categoryFilter]);

  const handleToggle = async (product: SellerProductRow) => {
    if (!user?._id) return;
    try {
      const next = await toggleProductActive(product.id, user._id, !product.is_active);
      setProducts((list) => list.map((p) => (p.id === next.id ? next : p)));
      Toast.show({
        type: 'success',
        text1: next.is_active
          ? t('proPortal.products.activated')
          : t('proPortal.products.deactivated'),
      });
    } catch {
      Toast.show({ type: 'error', text1: t('proPortal.products.toggleFailed') });
    }
  };

  const handleDelete = async (product: SellerProductRow) => {
    if (!user?._id) return;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(
        t('proPortal.products.confirmDelete', { title: product.title })
      );
      if (!ok) return;
    }
    try {
      await deleteProduct(product.id, user._id);
      setProducts((list) => list.filter((p) => p.id !== product.id));
      Toast.show({ type: 'success', text1: t('proPortal.products.deleted') });
    } catch {
      Toast.show({ type: 'error', text1: t('proPortal.products.deleteFailed') });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <ActivityIndicator size="large" color={config.theme.primary} />
      </View>
    );
  }

  return (
    <ProLayout maxWidth={1100} scrollable={false} contentStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.products.pageTitle')}
          </Text>
          <Text style={[styles.pageSubtitle, { color: config.theme.textSecondary }]}>
            {t('proPortal.products.pageSubtitle', { count: products.length })}
          </Text>
        </View>
        <Pressable
          style={[styles.createButton, { backgroundColor: config.theme.primary }]}
          onPress={() => router.push({ pathname: '/pro-portal/products/new' } as any)}
        >
          <Ionicons name="add" size={20} color={config.theme.textInverse} />
          <Text style={[styles.createButtonText, { color: config.theme.textInverse }]}>
            {t('proPortal.products.createNew')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.filtersBar}>
        <View style={styles.filterGroup}>
          {(['all', 'active', 'inactive'] as StatusFilter[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    statusFilter === s ? config.theme.primary : config.theme.surface,
                  borderColor:
                    statusFilter === s ? config.theme.primary : config.theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    statusFilter === s
                      ? config.theme.textInverse
                      : config.theme.textPrimary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t(`proPortal.products.statusFilter.${s}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.filterGroup, { flex: 1, justifyContent: 'flex-end' }]}>
          <Pressable
            onPress={() => setCategoryFilter(null)}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  categoryFilter === null ? config.theme.primary : config.theme.surface,
                borderColor:
                  categoryFilter === null ? config.theme.primary : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  categoryFilter === null
                    ? config.theme.textInverse
                    : config.theme.textPrimary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {t('proPortal.products.allCategories')}
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryFilter(cat.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    categoryFilter === cat.id
                      ? config.theme.primary
                      : config.theme.surface,
                  borderColor:
                    categoryFilter === cat.id
                      ? config.theme.primary
                      : config.theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    categoryFilter === cat.id
                      ? config.theme.textInverse
                      : config.theme.textPrimary,
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {cat.name_fr}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: config.theme.border }]}>
          <Ionicons
            name="cube-outline"
            size={48}
            color={config.theme.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.products.emptyTitle')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: config.theme.textSecondary }]}>
            {t('proPortal.products.emptySubtitle')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onEdit={() =>
                router.push({
                  pathname: '/pro-portal/products/[id]',
                  params: { id: item.id },
                } as any)
              }
              onToggle={() => handleToggle(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}
    </ProLayout>
  );
}

function ProductCard({
  product,
  onEdit,
  onToggle,
  onDelete,
}: {
  product: SellerProductRow;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const thumb = product.thumbnail_url ?? product.images?.[0];

  return (
    <View
      style={[
        cardStyles.card,
        {
          backgroundColor: config.theme.surface,
          borderColor: config.theme.border,
        },
      ]}
    >
      <View style={cardStyles.thumbWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={cardStyles.thumb} />
        ) : (
          <View
            style={[
              cardStyles.thumbPlaceholder,
              { backgroundColor: config.theme.background },
            ]}
          >
            <Ionicons
              name="image-outline"
              size={28}
              color={config.theme.textSecondary}
            />
          </View>
        )}
      </View>

      <View style={cardStyles.body}>
        <View style={cardStyles.titleRow}>
          <Text
            style={[cardStyles.title, { color: config.theme.textPrimary }]}
            numberOfLines={1}
          >
            {product.title}
          </Text>
          <View
            style={[
              cardStyles.statusBadge,
              {
                backgroundColor: product.is_active
                  ? config.theme.success + '22'
                  : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color: product.is_active
                  ? config.theme.success
                  : config.theme.textSecondary,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {product.is_active
                ? t('proPortal.products.active')
                : t('proPortal.products.inactive')}
            </Text>
          </View>
        </View>

        <Text style={[cardStyles.price, { color: config.theme.primary }]}>
          {formatPrice(Number(product.price), product.currency || 'MAD')}
        </Text>

        <View style={cardStyles.metaRow}>
          <Text style={[cardStyles.meta, { color: config.theme.textSecondary }]}>
            {t('proPortal.products.stock')}: {product.stock_qty}
          </Text>
          {product.category?.name_fr ? (
            <Text style={[cardStyles.meta, { color: config.theme.textSecondary }]}>
              · {product.category.name_fr}
            </Text>
          ) : null}
          <Text style={[cardStyles.meta, { color: config.theme.textSecondary }]}>
            · {product.listing_type}
          </Text>
        </View>

        <View style={cardStyles.actionsRow}>
          <Pressable
            style={[
              cardStyles.actionBtn,
              { backgroundColor: config.theme.primary },
            ]}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={14} color={config.theme.textInverse} />
            <Text
              style={[cardStyles.actionText, { color: config.theme.textInverse }]}
            >
              {t('proPortal.products.edit')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              cardStyles.actionBtn,
              { borderColor: config.theme.border, borderWidth: 1 },
            ]}
            onPress={onToggle}
          >
            <Ionicons
              name={product.is_active ? 'pause-outline' : 'play-outline'}
              size={14}
              color={config.theme.textPrimary}
            />
            <Text
              style={[cardStyles.actionText, { color: config.theme.textPrimary }]}
            >
              {product.is_active
                ? t('proPortal.products.deactivate')
                : t('proPortal.products.activate')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              cardStyles.actionBtn,
              { borderColor: config.theme.error, borderWidth: 1 },
            ]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={14} color={config.theme.error} />
            <Text style={[cardStyles.actionText, { color: config.theme.error }]}>
              {t('proPortal.products.delete')}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  pageSubtitle: { fontSize: 14, marginTop: 2 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createButtonText: { fontSize: 14, fontWeight: '700' },
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
  },
  filterGroup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  list: { gap: 12, paddingBottom: 24 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbWrap: { width: 140, height: 140 },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, padding: 14, gap: 6 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontSize: 16, fontWeight: '700', flex: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  price: { fontSize: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  meta: { fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600' },
});
