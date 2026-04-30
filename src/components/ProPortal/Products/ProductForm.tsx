import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { FieldInput } from '@/src/components/ProPortal/KycWizard/FieldInput';
import {
  fetchProductCategories,
  fetchProductRegions,
  uploadProductImage,
  type ListingType,
  type ProductCategory,
  type ProductCondition,
  type ProductRegion,
} from '@/lib/services/sellerProductsService';

export type ProductFormValues = {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  price: string;
  currency: string;
  is_negotiable: boolean;
  condition: ProductCondition;
  listing_type: ListingType;
  min_order_qty: string;
  stock_qty: string;
  category_id: string | null;
  region_id: string | null;
  city: string;
  images: string[];
};

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  price: '',
  currency: 'MAD',
  is_negotiable: false,
  condition: 'neuf',
  listing_type: 'C2C',
  min_order_qty: '1',
  stock_qty: '1',
  category_id: null,
  region_id: null,
  city: '',
  images: [],
};

const CONDITIONS: ProductCondition[] = ['neuf', 'très_bon', 'bon', 'acceptable'];
const LISTING_TYPES: ListingType[] = ['B2C', 'B2B', 'C2C'];

type Props = {
  sellerId: string;
  values: ProductFormValues;
  onChange: (next: ProductFormValues) => void;
};

export function ProductForm({ sellerId, values, onChange }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [regions, setRegions] = useState<ProductRegion[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchProductCategories(), fetchProductRegions()]).then(
      ([cats, regs]) => {
        if (!mounted) return;
        setCategories(cats);
        setRegions(regs);
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const setField = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) => {
    onChange({ ...values, [key]: value });
  };

  const handlePickImages = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Toast.show({ type: 'error', text1: t('proPortal.products.permissionDenied') });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: 8,
      });

      if (result.canceled) return;

      setUploading(true);
      const newUrls: string[] = [];
      for (const asset of result.assets) {
        try {
          const url = await uploadProductImage(sellerId, {
            uri: asset.uri,
            name: asset.fileName ?? `image_${Date.now()}.jpg`,
            type: asset.mimeType ?? 'image/jpeg',
            size: asset.fileSize ?? null,
          });
          newUrls.push(url);
        } catch (err) {
          const code = err instanceof Error ? err.message : '';
          let text = t('proPortal.products.uploadFailed');
          if (code === 'FILE_TOO_LARGE') text = t('proPortal.products.fileTooLarge');
          else if (code === 'INVALID_FILE_TYPE') text = t('proPortal.products.invalidFileType');
          Toast.show({ type: 'error', text1: text });
        }
      }
      if (newUrls.length > 0) {
        onChange({ ...values, images: [...values.images, ...newUrls] });
        Toast.show({
          type: 'success',
          text1: t('proPortal.products.imagesUploaded', { count: newUrls.length }),
        });
      }
    } catch (err) {
      console.error('[ProductForm] picker error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.products.uploadFailed') });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (url: string) => {
    onChange({ ...values, images: values.images.filter((u) => u !== url) });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.products.sectionGeneral')}
      </Text>

      <FieldInput
        label={t('proPortal.products.titleFr')}
        value={values.title}
        onChangeText={(v) => setField('title', v)}
        placeholder={t('proPortal.products.titlePlaceholder')}
      />
      <FieldInput
        label={t('proPortal.products.titleAr')}
        value={values.title_ar}
        onChangeText={(v) => setField('title_ar', v)}
        placeholder={t('proPortal.products.titlePlaceholder')}
      />
      <FieldInput
        label={t('proPortal.products.descriptionFr')}
        value={values.description}
        onChangeText={(v) => setField('description', v)}
        multiline
      />
      <FieldInput
        label={t('proPortal.products.descriptionAr')}
        value={values.description_ar}
        onChangeText={(v) => setField('description_ar', v)}
        multiline
      />

      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.products.sectionPricing')}
      </Text>

      <View style={styles.row}>
        <View style={{ flex: 2 }}>
          <FieldInput
            label={t('proPortal.products.price')}
            value={values.price}
            onChangeText={(v) => setField('price', v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldInput
            label={t('proPortal.products.currency')}
            value={values.currency}
            onChangeText={(v) => setField('currency', v.toUpperCase().slice(0, 3))}
            placeholder="MAD"
          />
        </View>
      </View>

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setField('is_negotiable', !values.is_negotiable)}
      >
        <Ionicons
          name={values.is_negotiable ? 'checkbox' : 'square-outline'}
          size={22}
          color={
            values.is_negotiable ? config.theme.primary : config.theme.textSecondary
          }
        />
        <Text style={[styles.checkboxLabel, { color: config.theme.textPrimary }]}>
          {t('proPortal.products.isNegotiable')}
        </Text>
      </Pressable>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <FieldInput
            label={t('proPortal.products.stockQty')}
            value={values.stock_qty}
            onChangeText={(v) => setField('stock_qty', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>
        <View style={{ flex: 1 }}>
          <FieldInput
            label={t('proPortal.products.minOrderQty')}
            value={values.min_order_qty}
            onChangeText={(v) => setField('min_order_qty', v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="1"
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.products.sectionCondition')}
      </Text>

      <Text style={[styles.fieldLabel, { color: config.theme.textSecondary }]}>
        {t('proPortal.products.condition')}
      </Text>
      <View style={styles.chipsRow}>
        {CONDITIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setField('condition', c)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  values.condition === c ? config.theme.primary : config.theme.surface,
                borderColor:
                  values.condition === c ? config.theme.primary : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  values.condition === c
                    ? config.theme.textInverse
                    : config.theme.textPrimary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {t(`proPortal.products.conditionValues.${c}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.fieldLabel, { color: config.theme.textSecondary }]}>
        {t('proPortal.products.listingType')}
      </Text>
      <View style={styles.chipsRow}>
        {LISTING_TYPES.map((lt) => (
          <Pressable
            key={lt}
            onPress={() => setField('listing_type', lt)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  values.listing_type === lt
                    ? config.theme.primary
                    : config.theme.surface,
                borderColor:
                  values.listing_type === lt
                    ? config.theme.primary
                    : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  values.listing_type === lt
                    ? config.theme.textInverse
                    : config.theme.textPrimary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {lt}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.products.sectionLocation')}
      </Text>

      <Text style={[styles.fieldLabel, { color: config.theme.textSecondary }]}>
        {t('proPortal.products.category')}
      </Text>
      <View style={styles.chipsRow}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setField('category_id', cat.id)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  values.category_id === cat.id
                    ? config.theme.primary
                    : config.theme.surface,
                borderColor:
                  values.category_id === cat.id
                    ? config.theme.primary
                    : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  values.category_id === cat.id
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

      <Text style={[styles.fieldLabel, { color: config.theme.textSecondary }]}>
        {t('proPortal.products.region')}
      </Text>
      <View style={styles.chipsRow}>
        {regions.map((reg) => (
          <Pressable
            key={reg.id}
            onPress={() => setField('region_id', reg.id)}
            style={[
              styles.chip,
              {
                backgroundColor:
                  values.region_id === reg.id
                    ? config.theme.primary
                    : config.theme.surface,
                borderColor:
                  values.region_id === reg.id
                    ? config.theme.primary
                    : config.theme.border,
              },
            ]}
          >
            <Text
              style={{
                color:
                  values.region_id === reg.id
                    ? config.theme.textInverse
                    : config.theme.textPrimary,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {reg.name_fr}
            </Text>
          </Pressable>
        ))}
      </View>

      <FieldInput
        label={t('proPortal.products.city')}
        value={values.city}
        onChangeText={(v) => setField('city', v)}
        placeholder="Casablanca"
      />

      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.products.sectionImages')}
      </Text>

      <View style={styles.imagesGrid}>
        {values.images.map((url) => (
          <View key={url} style={styles.imageWrapper}>
            <Image source={{ uri: url }} style={styles.image} />
            <Pressable
              style={[styles.removeImg, { backgroundColor: config.theme.error }]}
              onPress={() => handleRemoveImage(url)}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={handlePickImages}
          disabled={uploading}
          style={[
            styles.addImage,
            {
              borderColor: config.theme.border,
              backgroundColor: config.theme.surface,
            },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color={config.theme.primary} />
          ) : (
            <>
              <Ionicons
                name="add"
                size={28}
                color={config.theme.primary}
              />
              <Text
                style={[
                  styles.addImageText,
                  { color: config.theme.textSecondary },
                ]}
              >
                {t('proPortal.products.addImages')}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkboxLabel: { fontSize: 14, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  imagesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  imageWrapper: {
    width: 110,
    height: 110,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  removeImg: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addImageText: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
