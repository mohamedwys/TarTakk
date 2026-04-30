import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import {
  ProductForm,
  EMPTY_PRODUCT_FORM,
  type ProductFormValues,
} from '@/src/components/ProPortal/Products/ProductForm';
import { createProduct } from '@/lib/services/sellerProductsService';
import { ProLayout } from '@/src/components/pro-portal';

export default function ProPortalProductNew() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { user } = useAuth();

  const [values, setValues] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): string | null => {
    if (!values.title.trim()) return t('proPortal.products.errorTitleRequired');
    const price = parseFloat(values.price);
    if (!Number.isFinite(price) || price <= 0)
      return t('proPortal.products.errorPriceRequired');
    if (!values.condition) return t('proPortal.products.errorConditionRequired');
    if (!values.listing_type) return t('proPortal.products.errorListingTypeRequired');
    return null;
  };

  const handleSubmit = async () => {
    if (!user?._id) return;
    const err = validate();
    if (err) {
      Toast.show({ type: 'error', text1: err });
      return;
    }
    setSubmitting(true);
    try {
      const created = await createProduct({
        seller_id: user._id,
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
        is_active: true,
      });
      Toast.show({ type: 'success', text1: t('proPortal.products.created') });
      router.replace({
        pathname: '/pro-portal/products/[id]',
        params: { id: created.id },
      } as any);
    } catch (error) {
      console.error('[ProductNew] submit error:', error);
      Toast.show({ type: 'error', text1: t('proPortal.products.createFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user?._id) {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <ActivityIndicator color={config.theme.primary} />
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
            {t('proPortal.products.newPageTitle')}
          </Text>
          <Text style={[styles.pageSubtitle, { color: config.theme.textSecondary }]}>
            {t('proPortal.products.newPageSubtitle')}
          </Text>
        </View>
      </View>

      <ProductForm sellerId={user._id} values={values} onChange={setValues} />

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.submitBtn,
            {
              backgroundColor: submitting
                ? config.theme.border
                : config.theme.primary,
            },
          ]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={config.theme.textInverse} />
          ) : (
            <>
              <Ionicons
                name="checkmark"
                size={18}
                color={config.theme.textInverse}
              />
              <Text style={[styles.submitText, { color: config.theme.textInverse }]}>
                {t('proPortal.products.createSubmit')}
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
  footer: { marginTop: 16 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
  },
  submitText: { fontSize: 15, fontWeight: '700' },
});
