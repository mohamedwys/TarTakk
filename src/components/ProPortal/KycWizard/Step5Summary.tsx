import React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import type { KycFormData } from './types';

type Props = {
  formData: KycFormData;
  onSubmit: () => void;
  isSubmitting: boolean;
};

export function Step5Summary({ formData, onSubmit, isSubmitting }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();

  const businessTypeLabel = t(
    `proPortal.kyc.businessType${capitalize(formData.business_type)}`
  );

  const confirmAndSubmit = () => {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(t('proPortal.kyc.submitButton'))
          : true;
      if (ok) onSubmit();
      return;
    }
    Alert.alert(
      t('proPortal.kyc.submitButton'),
      t('proPortal.kyc.submitSuccessMessage'),
      [
        { text: t('proPortal.kyc.previousButton'), style: 'cancel' },
        { text: t('proPortal.kyc.submitButton'), onPress: onSubmit },
      ]
    );
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.kyc.step5Title')}
      </Text>

      <SummaryCard
        title={t('proPortal.kyc.step1Title')}
        rows={[
          [t('proPortal.kyc.businessType'), businessTypeLabel],
          [t('proPortal.kyc.businessName'), formData.business_name],
          [t('proPortal.kyc.iceNumber'), formData.ice_number],
          [t('proPortal.kyc.rcNumber'), formData.rc_number || '—'],
          [t('proPortal.kyc.patenteNumber'), formData.patente_number || '—'],
          [t('proPortal.kyc.cnssNumber'), formData.cnss_number || '—'],
        ]}
      />

      <SummaryCard
        title={t('proPortal.kyc.step2Title')}
        rows={[
          [t('proPortal.kyc.legalRepName'), formData.legal_rep_name],
          [t('proPortal.kyc.legalRepCin'), formData.legal_rep_cin],
          [t('proPortal.kyc.legalRepPhone'), formData.legal_rep_phone],
        ]}
      />

      <SummaryCard
        title={t('proPortal.kyc.step3Title')}
        rows={[
          [t('proPortal.kyc.businessAddress'), formData.business_address],
          [t('proPortal.kyc.businessCity'), formData.business_city],
        ]}
      />

      <SummaryCard
        title={t('proPortal.kyc.step4Title')}
        rows={[
          [t('proPortal.kyc.cinFront'), formData.cin_front_url ? '✓' : '—'],
          [t('proPortal.kyc.cinBack'), formData.cin_back_url ? '✓' : '—'],
          [t('proPortal.kyc.rcDocument'), formData.rc_document_url ? '✓' : '—'],
          [t('proPortal.kyc.patenteDocument'), formData.patente_document_url ? '✓' : '—'],
          [t('proPortal.kyc.iceDocument'), formData.ice_document_url ? '✓' : '—'],
        ]}
      />

      <Pressable
        onPress={confirmAndSubmit}
        disabled={isSubmitting}
        style={[
          styles.submitButton,
          {
            backgroundColor: config.theme.primary,
            opacity: isSubmitting ? 0.6 : 1,
          },
        ]}
      >
        {isSubmitting ? (
          <>
            <ActivityIndicator color={config.theme.textInverse} />
            <Text style={[styles.submitText, { color: config.theme.textInverse }]}>
              {t('proPortal.kyc.submitting')}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={18} color={config.theme.textInverse} />
            <Text style={[styles.submitText, { color: config.theme.textInverse }]}>
              {t('proPortal.kyc.submitButton')}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  const { config } = useEnv();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: config.theme.surface, borderColor: config.theme.border },
      ]}
    >
      <Text style={[styles.cardTitle, { color: config.theme.textPrimary }]}>{title}</Text>
      <View style={styles.cardRows}>
        {rows.map(([label, value], i) => (
          <View key={`${label}-${i}`} style={styles.row}>
            <Text style={[styles.rowLabel, { color: config.theme.textSecondary }]}>
              {label}
            </Text>
            <Text
              style={[styles.rowValue, { color: config.theme.textPrimary }]}
              numberOfLines={2}
            >
              {value || '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function capitalize(s: string): string {
  if (!s) return s;
  return s
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

const styles = StyleSheet.create({
  section: { gap: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardRows: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 13, flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});
