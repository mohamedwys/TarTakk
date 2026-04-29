import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import type { KycSubmission } from '@/lib/services/kycService';

type Props = {
  submission: KycSubmission | null;
  onResubmit: () => void;
};

export function RejectedScreen({ submission, onResubmit }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: config.theme.surface, borderColor: config.theme.border },
        ]}
      >
        <Ionicons name="close-circle" size={56} color={config.theme.error} />
        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('proPortal.kyc.rejectedTitle')}
        </Text>

        {submission?.rejection_reason ? (
          <View
            style={[
              styles.reasonBox,
              {
                backgroundColor: config.theme.error + '11',
                borderColor: config.theme.error + '55',
              },
            ]}
          >
            <Text style={[styles.reasonLabel, { color: config.theme.error }]}>
              {t('proPortal.kyc.rejectedReason')}
            </Text>
            <Text style={[styles.reasonText, { color: config.theme.textPrimary }]}>
              {submission.rejection_reason}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onResubmit}
          style={[styles.button, { backgroundColor: config.theme.primary }]}
        >
          <Ionicons name="refresh" size={18} color={config.theme.textInverse} />
          <Text style={[styles.buttonText, { color: config.theme.textInverse }]}>
            {t('proPortal.kyc.submitNewApplication')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 14,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  reasonBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  reasonLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  reasonText: { fontSize: 14, lineHeight: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '700' },
});
