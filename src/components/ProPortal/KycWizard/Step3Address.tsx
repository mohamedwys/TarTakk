import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { fetchRegions } from '@/lib/services/kycService';
import type { Region } from '@/lib/services/kycService';
import { FieldInput } from './FieldInput';
import type { StepProps } from './types';

export function Step3Address({ formData, setFormData }: StepProps) {
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchRegions()
      .then((rows) => {
        if (active) setRegions(rows);
      })
      .finally(() => {
        if (active) setLoadingRegions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isArabic = i18n.language?.startsWith('ar');
  const selectedRegion = regions.find((r) => r.id === formData.region_id);
  const selectedLabel = selectedRegion
    ? isArabic
      ? selectedRegion.name_ar
      : selectedRegion.name_fr
    : t('proPortal.kyc.selectRegion');

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.kyc.step3Title')}
      </Text>

      <FieldInput
        label={t('proPortal.kyc.businessAddress')}
        placeholder={t('proPortal.kyc.businessAddressPlaceholder')}
        value={formData.business_address}
        onChangeText={(v) => setFormData((f) => ({ ...f, business_address: v }))}
        multiline
      />

      <FieldInput
        label={t('proPortal.kyc.businessCity')}
        placeholder={t('proPortal.kyc.businessCityPlaceholder')}
        value={formData.business_city}
        onChangeText={(v) => setFormData((f) => ({ ...f, business_city: v }))}
        autoCapitalize="words"
      />

      <View style={styles.field}>
        <Text style={[styles.label, { color: config.theme.textSecondary }]}>
          {t('proPortal.kyc.region')}
        </Text>

        {loadingRegions ? (
          <View
            style={[
              styles.regionTrigger,
              { borderColor: config.theme.border, backgroundColor: config.theme.background },
            ]}
          >
            <ActivityIndicator color={config.theme.primary} />
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setPickerOpen((o) => !o)}
              style={[
                styles.regionTrigger,
                { borderColor: config.theme.border, backgroundColor: config.theme.background },
              ]}
            >
              <Text
                style={[
                  styles.regionTriggerText,
                  {
                    color: selectedRegion
                      ? config.theme.textPrimary
                      : config.theme.textSecondary,
                  },
                ]}
                numberOfLines={1}
              >
                {selectedLabel}
              </Text>
              <Ionicons
                name={pickerOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={config.theme.textSecondary}
              />
            </Pressable>

            {pickerOpen ? (
              <View
                style={[
                  styles.regionList,
                  {
                    borderColor: config.theme.border,
                    backgroundColor: config.theme.surface,
                  },
                ]}
              >
                {regions.map((r) => {
                  const selected = r.id === formData.region_id;
                  const label = isArabic ? r.name_ar : r.name_fr;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => {
                        setFormData((f) => ({ ...f, region_id: r.id }));
                        setPickerOpen(false);
                      }}
                      style={[
                        styles.regionItem,
                        selected && { backgroundColor: config.theme.primary + '15' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.regionItemText,
                          {
                            color: selected ? config.theme.primary : config.theme.textPrimary,
                          },
                        ]}
                      >
                        {label}
                      </Text>
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={config.theme.primary}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  regionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  regionTriggerText: { fontSize: 14, flex: 1 },
  regionList: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: 240,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  regionItemText: { fontSize: 14 },
});
