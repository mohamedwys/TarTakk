import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { FieldInput } from './FieldInput';
import type { StepProps } from './types';

export function Step2LegalRep({ formData, setFormData }: StepProps) {
  const { t } = useTranslation();
  const { config } = useEnv();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.kyc.step2Title')}
      </Text>

      <FieldInput
        label={t('proPortal.kyc.legalRepName')}
        value={formData.legal_rep_name}
        onChangeText={(v) => setFormData((f) => ({ ...f, legal_rep_name: v }))}
        autoCapitalize="words"
      />

      <FieldInput
        label={t('proPortal.kyc.legalRepCin')}
        value={formData.legal_rep_cin}
        onChangeText={(v) => setFormData((f) => ({ ...f, legal_rep_cin: v.toUpperCase() }))}
        autoCapitalize="characters"
      />

      <FieldInput
        label={t('proPortal.kyc.legalRepPhone')}
        value={formData.legal_rep_phone}
        onChangeText={(v) => setFormData((f) => ({ ...f, legal_rep_phone: v }))}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
});
