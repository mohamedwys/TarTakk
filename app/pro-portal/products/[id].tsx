import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProductForm,
  EMPTY_PRODUCT_FORM,
  type ProductFormValues,
} from '@/src/components/ProPortal/Products/ProductForm';
import {
  deleteProduct,
  fetchProduct,
  toggleProductActive,
  updateProduct,
  type SellerProductRow,
} from '@/lib/services/sellerProductsService';
import { ProLayout } from '@/src/components/pro-portal';

function rowToFormValues(row: SellerProductRow): ProductFormValues {
  return {
    title: row.title ?? '',
    title_ar: row.title_ar ?? '',
    description: row.description ?? '',
    description_ar: row.description_ar ?? '',
    price: row.price != null ? String(row.price) : '',
    currency: row.currency ?? 'MAD',
    is_negotiable: !!row.is_negotiable,
    condition: row.condition ?? 'neuf',
    listing_type: row.listing_type ?? 'C2C',
    min_order_qty: row.min_order_qty != null ? String(row.min_order_qty) : '1',
    stock_qty: row.stock_qty != null ? String(row.stock_qty) : '1',
    category_id: row.category_id ?? null,
    region_id: row.region_id ?? null,
    city: row.city ?? '',
    images: Array.isArray(row.images) ? row.images : [],
  };
}

export default function ProPortalProductEdit() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const productId = typeof params.id === 'string' ? params.id : '';

  const [product, setProduct] = useState<SellerProductRow | null>(null);
  const [values, setValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user?._id || !productId) return;
    setIsLoading(true);
    try {
      const row = await fetchProduct(productId, user._id);
      if (!row) {
        Toast.show({ type: 'error', text1: t('proPortal.products.notFound') });
        router.replace({ pathname: '/pro-portal/products' } as any);
        return;
      }
      setProduct(row);
      setValues(rowToFormValues(row));
    } catch (err) {
      console.error('[ProductEdit] load error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.products.loadFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, productId, t, router]);

  useEffect(() => {
    load();
  }, [load]);

  const validate = (): string | null => {
    if (!values.title.trim()) return t('proPortal.products.errorTitleRequired');
    const price = parseFloat(values.price);
    if (!Number.isFinite(price) || price <= 0)
      return t('proPortal.products.errorPriceRequired');
    return null;
  };

  const handleSave = async () => {
    if (!user?._id || !product) return;
    const err = validate();
    if (err) {
      Toast.show({ type: 'error', text1: err });
      return;
    }
    setSaving(true);
    try {
      const next = await updateProduct(product.id, user._id, {
        title: values.title.trim(),
        title_ar: values.title_ar.trim() || null,
        description: values.description.trim() || null,
        description_ar: values.description_ar.trim() || null,
        price: parseFloat(values.price),
        currency: values.currency || 'MAD',
        is_negotiable: values.is_negotiable,
        condition: values.condition,
        listing_type: values.listing_type,
        min_order_qty: parseInt(values.min_order_qty, 10) || 1,
        stock_qty: parseInt(values.stock_qty, 10) || 1,
        category_id: values.category_id,
        region_id: values.region_id,
        city: values.city.trim() || null,
        images: values.images,
        thumbnail_url: values.images[0] ?? null,
      });
      setProduct(next);
      setValues(rowToFormValues(next));
      Toast.show({ type: 'success', text1: t('proPortal.products.saved') });
    } catch (error) {
      console.error('[ProductEdit] save error:', error);
      Toast.show({ type: 'error', text1: t('proPortal.products.saveFailed') });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!user?._id || !product) return;
    setToggling(true);
    try {
      const next = await toggleProductActive(product.id, user._id, !product.is_active);
      setProduct(next);
      Toast.show({
        type: 'success',
        text1: next.is_active
          ? t('proPortal.products.activated')
          : t('proPortal.products.deactivated'),
      });
    } catch {
      Toast.show({ type: 'error', text1: t('proPortal.products.toggleFailed') });
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!user?._id || !product) return;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm(
        t('proPortal.products.confirmDelete', { title: product.title })
      );
      if (!ok) return;
    }
    setDeleting(true);
    try {
      await deleteProduct(product.id, user._id);
      Toast.show({ type: 'success', text1: t('proPortal.products.deleted') });
      router.replace({ pathname: '/pro-portal/products' } as any);
    } catch {
      Toast.show({ type: 'error', text1: t('proPortal.products.deleteFailed') });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading || !product) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <ActivityIndicator size="large" color={config.theme.primary} />
      </View>
    );
  }

  return (
    <ProLayout maxWidth={1100} scrollable contentStyle={styles.scrollContent}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: config.theme.border }]}
        >
          <Ionicons name="arrow-back" size={18} color={config.theme.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: config.theme.textPrimary }]}>
            {t('proPortal.products.editPageTitle')}
          </Text>
          <Text style={[styles.pageSubtitle, { color: config.theme.textSecondary }]}>
            {product.title}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
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
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {product.is_active
              ? t('proPortal.products.active')
              : t('proPortal.products.inactive')}
          </Text>
        </View>
      </View>

      <ProductForm sellerId={user!._id} values={values} onChange={setValues} />

      <View style={styles.footerRow}>
        <Pressable
          style={[
            styles.toggleBtn,
            {
              borderColor: config.theme.border,
              backgroundColor: config.theme.surface,
            },
          ]}
          disabled={toggling}
          onPress={handleToggle}
        >
          {toggling ? (
            <ActivityIndicator color={config.theme.textPrimary} size="small" />
          ) : (
            <>
              <Ionicons
                name={product.is_active ? 'pause-outline' : 'play-outline'}
                size={16}
                color={config.theme.textPrimary}
              />
              <Text
                style={[styles.toggleText, { color: config.theme.textPrimary }]}
              >
                {product.is_active
                  ? t('proPortal.products.deactivate')
                  : t('proPortal.products.activate')}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.deleteBtn,
            { borderColor: config.theme.error },
          ]}
          disabled={deleting}
          onPress={handleDelete}
        >
          {deleting ? (
            <ActivityIndicator color={config.theme.error} size="small" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={16} color={config.theme.error} />
              <Text style={[styles.deleteText, { color: config.theme.error }]}>
                {t('proPortal.products.delete')}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor: saving ? config.theme.border : config.theme.primary,
            },
          ]}
          disabled={saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color={config.theme.textInverse} />
          ) : (
            <>
              <Ionicons
                name="checkmark"
                size={18}
                color={config.theme.textInverse}
              />
              <Text style={[styles.saveText, { color: config.theme.textInverse }]}>
                {t('proPortal.products.save')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </ProLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { gap: 18 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: { fontSize: 24, fontWeight: '800' },
  pageSubtitle: { fontSize: 14 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  deleteText: { fontSize: 14, fontWeight: '600' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveText: { fontSize: 14, fontWeight: '700' },
});
