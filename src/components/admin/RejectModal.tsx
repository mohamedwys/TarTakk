import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { Button, Input, Card } from '@/src/components/ui';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
};

export function RejectModal({ visible, onClose, onConfirm }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const theme = config.theme;
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim(), notes.trim());
      setReason('');
      setNotes('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Card elevation="floating" padding="lg" style={styles.card}>
          <Text
            style={[
              typography.h3,
              { color: theme.textPrimary, fontFamily: fontFamily.bold },
            ]}
          >
            {t('proPortal.admin.rejectModal.title')}
          </Text>
          <Text
            style={[
              typography.bodySmall,
              {
                color: theme.textSecondary,
                marginTop: spacing.xs,
                marginBottom: spacing.lg,
              },
            ]}
          >
            {t('proPortal.admin.rejectModal.subtitle')}
          </Text>

          <Input
            label={t('proPortal.admin.rejectModal.reasonLabel')}
            value={reason}
            onChangeText={setReason}
            placeholder={t('proPortal.admin.rejectModal.reasonPlaceholder')}
            multiline
          />

          <Input
            label={t('proPortal.admin.rejectModal.notesLabel')}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('proPortal.admin.rejectModal.notesPlaceholder')}
            multiline
          />

          <View style={styles.buttons}>
            <Button variant="ghost" onPress={onClose} disabled={isSubmitting}>
              {t('proPortal.admin.rejectModal.cancel')}
            </Button>
            <Button
              variant="danger"
              loading={isSubmitting}
              disabled={!reason.trim()}
              onPress={handleConfirm}
            >
              {t('proPortal.admin.rejectModal.confirm')}
            </Button>
          </View>
        </Card>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: { maxWidth: 520, width: '100%' },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
