import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { uploadKycDocument } from '@/lib/services/kycService';
import type { KycDocumentType } from '@/lib/services/kycService';
import type { KycFormData, StepProps } from './types';

type DocSlotKey =
  | 'cin_front_url'
  | 'cin_back_url'
  | 'rc_document_url'
  | 'patente_document_url'
  | 'ice_document_url';

type DocSlot = {
  key: DocSlotKey;
  documentType: KycDocumentType;
  labelKey: string;
  required: boolean;
};

const SLOTS: DocSlot[] = [
  { key: 'cin_front_url', documentType: 'cin_front', labelKey: 'proPortal.kyc.cinFront', required: true },
  { key: 'cin_back_url', documentType: 'cin_back', labelKey: 'proPortal.kyc.cinBack', required: true },
  { key: 'rc_document_url', documentType: 'rc', labelKey: 'proPortal.kyc.rcDocument', required: false },
  { key: 'patente_document_url', documentType: 'patente', labelKey: 'proPortal.kyc.patenteDocument', required: false },
  { key: 'ice_document_url', documentType: 'ice', labelKey: 'proPortal.kyc.iceDocument', required: false },
];

type Props = StepProps & {
  userId: string;
};

export function Step4Documents({ formData, setFormData, userId }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const [uploadingKey, setUploadingKey] = useState<DocSlotKey | null>(null);

  const handlePick = async (slot: DocSlot) => {
    if (!userId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setUploadingKey(slot.key);
      try {
        const path = await uploadKycDocument(userId, slot.documentType, {
          uri: asset.uri,
          name: asset.name ?? `${slot.documentType}.jpg`,
          type: asset.mimeType ?? 'application/octet-stream',
          size: asset.size ?? undefined,
        });
        setFormData((f: KycFormData) => ({ ...f, [slot.key]: path }));
        Toast.show({ type: 'success', text1: t('proPortal.kyc.uploaded') });
      } catch (err: unknown) {
        const code = err instanceof Error ? err.message : '';
        let text = t('proPortal.kyc.uploadFailed');
        if (code === 'FILE_TOO_LARGE') text = t('proPortal.kyc.fileTooLarge');
        else if (code === 'INVALID_FILE_TYPE') text = t('proPortal.kyc.invalidFileType');
        Toast.show({ type: 'error', text1: text });
      } finally {
        setUploadingKey(null);
      }
    } catch (err) {
      console.error('[Step4Documents] picker error:', err);
      Toast.show({ type: 'error', text1: t('proPortal.kyc.uploadFailed') });
    }
  };

  const handleRemove = (slot: DocSlot) => {
    setFormData((f: KycFormData) => ({ ...f, [slot.key]: null }));
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: config.theme.textPrimary }]}>
        {t('proPortal.kyc.step4Title')}
      </Text>

      {SLOTS.map((slot) => {
        const value = formData[slot.key];
        const isUploading = uploadingKey === slot.key;
        const fileName = value ? value.split('/').pop() : null;

        return (
          <View
            key={slot.key}
            style={[
              styles.docCard,
              {
                backgroundColor: config.theme.surface,
                borderColor: value ? config.theme.success : config.theme.border,
              },
            ]}
          >
            <View style={styles.docHeader}>
              <Ionicons
                name={value ? 'checkmark-circle' : 'document-outline'}
                size={22}
                color={value ? config.theme.success : config.theme.textSecondary}
              />
              <Text style={[styles.docLabel, { color: config.theme.textPrimary }]}>
                {t(slot.labelKey)}
              </Text>
            </View>

            {value ? (
              <View style={styles.docMeta}>
                <Text
                  style={[styles.fileName, { color: config.theme.textSecondary }]}
                  numberOfLines={1}
                >
                  {fileName}
                </Text>
                <Pressable
                  onPress={() => handleRemove(slot)}
                  style={[styles.removeButton, { borderColor: config.theme.error }]}
                >
                  <Ionicons name="trash-outline" size={14} color={config.theme.error} />
                  <Text style={[styles.removeText, { color: config.theme.error }]}>
                    {t('proPortal.kyc.removeDocument')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => handlePick(slot)}
                disabled={isUploading}
                style={[
                  styles.uploadButton,
                  {
                    backgroundColor: isUploading
                      ? config.theme.border
                      : config.theme.primary,
                  },
                ]}
              >
                {isUploading ? (
                  <>
                    <ActivityIndicator color={config.theme.textInverse} size="small" />
                    <Text style={[styles.uploadText, { color: config.theme.textInverse }]}>
                      {t('proPortal.kyc.uploading')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={16}
                      color={config.theme.textInverse}
                    />
                    <Text style={[styles.uploadText, { color: config.theme.textInverse }]}>
                      {t('proPortal.kyc.uploadButton')}
                    </Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  docCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  docHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  docLabel: { fontSize: 14, fontWeight: '600', flex: 1 },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fileName: { fontSize: 12, flex: 1 },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  removeText: { fontSize: 12, fontWeight: '600' },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadText: { fontSize: 14, fontWeight: '600' },
});
