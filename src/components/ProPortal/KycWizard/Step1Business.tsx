import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import type { BusinessType } from '@/lib/services/kycService';
import { FieldInput } from './FieldInput';
import type { StepProps } from './types';

const BUSINESS_TYPES: { value: BusinessType; labelKey: string }[] = [
  { value: 'auto_entrepreneur', labelKey: 'proPortal.kyc.businessTypeAutoEntrepreneur' },
  { value: 'individual', labelKey: 'proPortal.kyc.businessTypeIndividual' },
  { value: 'sarl', labelKey: 'proPortal.kyc.businessTypeSarl' },
  { value: 'sa', labelKey: 'proPortal.kyc.businessTypeSa' },
  { value: 'other', labelKey: 'proPortal.kyc.businessTypeOther' },
];

export function Step1Business({ formData, setFormData }: StepProps) {
  const { t } = useTranslation();
  const { config } = useEnv();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.kyc.step1Title')}
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: config.theme.textSecondary }]}>
          {t('proPortal.kyc.businessType')}
        </Text>
        <View style={styles.radioGroup}>
          {BUSINESS_TYPES.map((bt) => {
            const selected = formData.business_type === bt.value;
            return (
              <Pressable
                key={bt.value}
                onPress={() => setFormData((f) => ({ ...f, business_type: bt.value }))}
                style={[
                  styles.radioOption,
                  {
                    borderColor: selected ? config.theme.primary : config.theme.border,
                    backgroundColor: selected
                      ? config.theme.primary + '15'
                      : config.theme.surface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioDot,
                    {
                      borderColor: selected ? config.theme.primary : config.theme.border,
                    },
                  ]}
                >
                  {selected ? (
                    <View
                      style={[styles.radioInner, { backgroundColor: config.theme.primary }]}
                    />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.radioLabel,
                    {
                      color: selected ? config.theme.primary : config.theme.textPrimary,
                    },
                  ]}
                >
                  {t(bt.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FieldInput
        label={t('proPortal.kyc.businessName')}
        placeholder={t('proPortal.kyc.businessNamePlaceholder')}
        value={formData.business_name}
        onChangeText={(v) => setFormData((f) => ({ ...f, business_name: v }))}
      />

      <FieldInput
        label={t('proPortal.kyc.iceNumber')}
        placeholder={t('proPortal.kyc.iceNumberPlaceholder')}
        value={formData.ice_number}
        onChangeText={(v) =>
          setFormData((f) => ({ ...f, ice_number: v.replace(/\D/g, '').slice(0, 15) }))
        }
        keyboardType="number-pad"
        maxLength={15}
      />

      <FieldInput
        label={t('proPortal.kyc.rcNumber')}
        value={formData.rc_number}
        onChangeText={(v) => setFormData((f) => ({ ...f, rc_number: v }))}
      />

      <FieldInput
        label={t('proPortal.kyc.patenteNumber')}
        value={formData.patente_number}
        onChangeText={(v) => setFormData((f) => ({ ...f, patente_number: v }))}
      />

      <FieldInput
        label={t('proPortal.kyc.cnssNumber')}
        value={formData.cnss_number}
        onChangeText={(v) => setFormData((f) => ({ ...f, cnss_number: v }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '500' },
  radioGroup: { gap: 8 },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  radioLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
});
