import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { ProLayout } from '@/src/components/pro-portal';
import { Button, Card } from '@/src/components/ui';
import { SectionLabel } from '@/src/components/profile';
import {
  DocumentPreview,
  RejectModal,
  KycStatusBadge,
} from '@/src/components/admin';
import {
  fetchKycDetail,
  approveKyc,
  rejectKyc,
  isCurrentUserAdmin,
  type AdminKycDetail,
} from '@/lib/services/adminKycService';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  individual: 'Particulier',
  sarl: 'SARL',
  sa: 'SA',
  auto_entrepreneur: 'Auto-Entrepreneur',
  other: 'Autre',
};

export default function AdminKycDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const theme = config.theme;

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [detail, setDetail] = useState<AdminKycDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    isCurrentUserAdmin().then(setIsAdmin);
  }, []);

  useEffect(() => {
    if (!id || !isAdmin) return;
    setIsLoading(true);
    fetchKycDetail(id)
      .then(setDetail)
      .finally(() => setIsLoading(false));
  }, [id, isAdmin]);

  if (isAdmin === false) {
    return (
      <ProLayout maxWidth={520}>
        <View style={styles.centered}>
          <Text style={[typography.h2, { color: theme.error }]}>
            {t('proPortal.admin.accessDenied')}
          </Text>
        </View>
      </ProLayout>
    );
  }

  if (isLoading || !detail) {
    return (
      <ProLayout maxWidth={1200}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ProLayout>
    );
  }

  const handleApprove = async () => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      !window.confirm(t('proPortal.admin.actions.approveConfirm'))
    ) {
      return;
    }
    setIsProcessing(true);
    try {
      await approveKyc(detail.id);
      Toast.show({
        type: 'success',
        text1: t('proPortal.admin.actions.approveSuccess'),
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('proPortal.admin.actions.actionFailed'),
        text2: err?.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string, notes: string) => {
    setIsProcessing(true);
    try {
      await rejectKyc(detail.id, reason, notes);
      Toast.show({
        type: 'success',
        text1: t('proPortal.admin.actions.rejectSuccess'),
      });
      router.back();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: t('proPortal.admin.actions.actionFailed'),
        text2: err?.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    const locale =
      i18n.language === 'fr' ? 'fr-MA' : i18n.language === 'ar' ? 'ar-MA' : 'en-MA';
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ProLayout maxWidth={1200}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.h1,
              { color: theme.textPrimary, fontFamily: fontFamily.extrabold },
            ]}
          >
            {detail.business_name}
          </Text>
          <Text
            style={[
              typography.body,
              { color: theme.textSecondary, marginTop: 4 },
            ]}
          >
            {detail.user_email ?? '—'}
            {detail.user_name ? ` · ${detail.user_name}` : ''}
          </Text>
        </View>
        <KycStatusBadge status={detail.status} size="md" />
      </View>

      <SectionLabel>{t('proPortal.admin.detail.businessInfo')}</SectionLabel>
      <Card elevation="raised" padding="md" style={{ marginBottom: spacing.md }}>
        <Field
          label="Type d'entreprise"
          value={
            BUSINESS_TYPE_LABELS[detail.business_type] ?? detail.business_type
          }
          theme={theme}
        />
        <Field label="ICE" value={detail.ice_number} theme={theme} />
        {detail.rc_number && (
          <Field label="RC" value={detail.rc_number} theme={theme} />
        )}
        {detail.patente_number && (
          <Field label="Patente" value={detail.patente_number} theme={theme} />
        )}
        {detail.cnss_number && (
          <Field label="CNSS" value={detail.cnss_number} theme={theme} />
        )}
      </Card>

      <SectionLabel>{t('proPortal.admin.detail.legalRep')}</SectionLabel>
      <Card elevation="raised" padding="md" style={{ marginBottom: spacing.md }}>
        <Field label="Nom" value={detail.legal_rep_name} theme={theme} />
        <Field label="CIN" value={detail.legal_rep_cin} theme={theme} />
        <Field label="Téléphone" value={detail.legal_rep_phone} theme={theme} />
      </Card>

      <SectionLabel>{t('proPortal.admin.detail.address')}</SectionLabel>
      <Card elevation="raised" padding="md" style={{ marginBottom: spacing.md }}>
        <Field label="Adresse" value={detail.business_address} theme={theme} />
        <Field label="Ville" value={detail.business_city} theme={theme} />
        <Field label="Région" value={detail.region_name ?? '-'} theme={theme} />
      </Card>

      <SectionLabel>{t('proPortal.admin.detail.documents')}</SectionLabel>
      <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
        <DocumentPreview
          label="CIN recto"
          path={detail.cin_front_url}
          required
        />
        <DocumentPreview
          label="CIN verso"
          path={detail.cin_back_url}
          required
        />
        {detail.rc_document_url && (
          <DocumentPreview label="Document RC" path={detail.rc_document_url} />
        )}
        {detail.patente_document_url && (
          <DocumentPreview
            label="Document Patente"
            path={detail.patente_document_url}
          />
        )}
        {detail.ice_document_url && (
          <DocumentPreview label="Document ICE" path={detail.ice_document_url} />
        )}
      </View>

      <SectionLabel>{t('proPortal.admin.detail.history')}</SectionLabel>
      <Card elevation="raised" padding="md" style={{ marginBottom: spacing.md }}>
        <Field
          label="Soumise le"
          value={formatDate(detail.submitted_at)}
          theme={theme}
        />
        {detail.reviewed_at && (
          <Field
            label="Examinée le"
            value={formatDate(detail.reviewed_at)}
            theme={theme}
          />
        )}
        {detail.rejection_reason && (
          <Field
            label={t('proPortal.admin.detail.rejectionReason')}
            value={detail.rejection_reason}
            theme={theme}
          />
        )}
        {detail.review_notes && (
          <Field
            label={t('proPortal.admin.detail.reviewNotes')}
            value={detail.review_notes}
            theme={theme}
          />
        )}
      </Card>

      {(detail.status === 'pending' || detail.status === 'under_review') && (
        <View style={styles.actions}>
          <Button
            variant="danger"
            size="lg"
            iconLeft="close-circle-outline"
            onPress={() => setShowRejectModal(true)}
            disabled={isProcessing}
            style={{ flex: 1 }}
          >
            {t('proPortal.admin.actions.reject')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            iconLeft="checkmark-circle-outline"
            onPress={handleApprove}
            loading={isProcessing}
            style={{ flex: 1 }}
          >
            {t('proPortal.admin.actions.approve')}
          </Button>
        </View>
      )}

      <RejectModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
      />
    </ProLayout>
  );
}

function Field({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={[typography.caption, { color: theme.textTertiary }]}>
        {label}
      </Text>
      <Text
        style={[
          typography.body,
          {
            color: theme.textPrimary,
            fontFamily: fontFamily.medium,
            marginTop: 2,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    padding: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
