import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserKycStatus,
  submitKycApplication,
} from '@/lib/services/kycService';
import type { KycStatus, KycSubmission } from '@/lib/services/kycService';
import { StepIndicator } from '@/src/components/ProPortal/KycWizard/StepIndicator';
import { Step1Business } from '@/src/components/ProPortal/KycWizard/Step1Business';
import { Step2LegalRep } from '@/src/components/ProPortal/KycWizard/Step2LegalRep';
import { Step3Address } from '@/src/components/ProPortal/KycWizard/Step3Address';
import { Step4Documents } from '@/src/components/ProPortal/KycWizard/Step4Documents';
import { Step5Summary } from '@/src/components/ProPortal/KycWizard/Step5Summary';
import { AlreadySubmittedScreen } from '@/src/components/ProPortal/KycWizard/AlreadySubmittedScreen';
import { RejectedScreen } from '@/src/components/ProPortal/KycWizard/RejectedScreen';
import { validateStep, type KycFormData } from '@/src/components/ProPortal/KycWizard/types';

type ScreenStatus = 'loading' | KycStatus;

const TOTAL_STEPS = 5;

const STEP_TITLE_KEYS: Record<number, string> = {
  1: 'proPortal.kyc.step1Title',
  2: 'proPortal.kyc.step2Title',
  3: 'proPortal.kyc.step3Title',
  4: 'proPortal.kyc.step4Title',
  5: 'proPortal.kyc.step5Title',
};

function makeInitialFormData(repName: string): KycFormData {
  return {
    business_type: 'auto_entrepreneur',
    business_name: '',
    ice_number: '',
    rc_number: '',
    patente_number: '',
    cnss_number: '',
    legal_rep_name: repName,
    legal_rep_cin: '',
    legal_rep_phone: '',
    business_address: '',
    business_city: '',
    region_id: null,
    cin_front_url: null,
    cin_back_url: null,
    rc_document_url: null,
    patente_document_url: null,
    ice_document_url: null,
  };
}

export default function ProPortalOnboarding() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const { user } = useAuth();
  const router = useRouter();

  const [screenStatus, setScreenStatus] = useState<ScreenStatus>('loading');
  const [existingSubmission, setExistingSubmission] = useState<KycSubmission | null>(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<KycFormData>(() =>
    makeInitialFormData(user?.name ?? '')
  );

  useEffect(() => {
    if (!user?._id) return;
    let active = true;

    fetchUserKycStatus(user._id).then(({ status, submission }) => {
      if (!active) return;
      setExistingSubmission(submission);
      setScreenStatus(status);
      if (status === 'approved') {
        router.replace('/pro-portal/dashboard' as never);
      }
    });

    return () => {
      active = false;
    };
  }, [user?._id, router]);

  if (!user?._id || screenStatus === 'loading') {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <Stack.Screen options={{ title: t('proPortal.kyc.title') }} />
        <ActivityIndicator size="large" color={config.theme.primary} />
        <Text style={[styles.loadingText, { color: config.theme.textSecondary }]}>
          {t('proPortal.kyc.loading')}
        </Text>
      </View>
    );
  }

  if (screenStatus === 'pending' || screenStatus === 'under_review') {
    return (
      <>
        <Stack.Screen options={{ title: t('proPortal.kyc.title') }} />
        <AlreadySubmittedScreen submission={existingSubmission} />
      </>
    );
  }

  if (screenStatus === 'rejected') {
    return (
      <>
        <Stack.Screen options={{ title: t('proPortal.kyc.title') }} />
        <RejectedScreen
          submission={existingSubmission}
          onResubmit={() => {
            setFormData(makeInitialFormData(user?.name ?? ''));
            setStep(1);
            setScreenStatus('none');
          }}
        />
      </>
    );
  }

  if (screenStatus === 'approved') {
    return (
      <View style={[styles.centered, { backgroundColor: config.theme.background }]}>
        <Stack.Screen options={{ title: t('proPortal.kyc.title') }} />
        <ActivityIndicator size="large" color={config.theme.primary} />
      </View>
    );
  }

  const handleNext = () => {
    if (!validateStep(step, formData)) {
      let errKey = 'proPortal.kyc.fillRequired';
      if (step === 1 && !/^\d{15}$/.test(formData.ice_number.trim())) {
        errKey = 'proPortal.kyc.iceInvalid';
      }
      Toast.show({ type: 'error', text1: t(errKey) });
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handlePrevious = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user?._id) return;
    if (!validateStep(4, formData)) {
      Toast.show({ type: 'error', text1: t('proPortal.kyc.documentRequired') });
      return;
    }

    setIsSubmitting(true);
    try {
      const { id } = await submitKycApplication({
        user_id: user._id,
        business_name: formData.business_name.trim(),
        business_type: formData.business_type,
        ice_number: formData.ice_number.trim(),
        rc_number: formData.rc_number.trim() || null,
        patente_number: formData.patente_number.trim() || null,
        cnss_number: formData.cnss_number.trim() || null,
        legal_rep_name: formData.legal_rep_name.trim(),
        legal_rep_cin: formData.legal_rep_cin.trim(),
        legal_rep_phone: formData.legal_rep_phone.trim(),
        business_address: formData.business_address.trim(),
        business_city: formData.business_city.trim(),
        region_id: formData.region_id,
        cin_front_url: formData.cin_front_url,
        cin_back_url: formData.cin_back_url,
        rc_document_url: formData.rc_document_url,
        patente_document_url: formData.patente_document_url,
        ice_document_url: formData.ice_document_url,
      });

      Toast.show({
        type: 'success',
        text1: t('proPortal.kyc.submitSuccess'),
        text2: t('proPortal.kyc.submitSuccessMessage'),
      });

      setExistingSubmission({
        id,
        user_id: user._id,
        business_name: formData.business_name,
        business_type: formData.business_type,
        ice_number: formData.ice_number,
        legal_rep_name: formData.legal_rep_name,
        legal_rep_cin: formData.legal_rep_cin,
        legal_rep_phone: formData.legal_rep_phone,
        business_address: formData.business_address,
        business_city: formData.business_city,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });
      setScreenStatus('pending');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('proPortal.kyc.submitFailed'),
        text2: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: config.theme.background }]}>
      <Stack.Screen options={{ title: t('proPortal.kyc.title') }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: config.theme.surface, borderColor: config.theme.border },
          ]}
        >
          <Text style={[styles.title, { color: config.theme.textPrimary }]}>
            {t('proPortal.kyc.title')}
          </Text>

          <StepIndicator
            current={step}
            total={TOTAL_STEPS}
            title={t(STEP_TITLE_KEYS[step] ?? '')}
          />

          {step === 1 ? <Step1Business formData={formData} setFormData={setFormData} /> : null}
          {step === 2 ? <Step2LegalRep formData={formData} setFormData={setFormData} /> : null}
          {step === 3 ? <Step3Address formData={formData} setFormData={setFormData} /> : null}
          {step === 4 ? (
            <Step4Documents
              formData={formData}
              setFormData={setFormData}
              userId={user._id}
            />
          ) : null}
          {step === 5 ? (
            <Step5Summary
              formData={formData}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : null}

          <View style={styles.footer}>
            <Pressable
              onPress={handlePrevious}
              disabled={step === 1}
              style={[
                styles.navButton,
                styles.prevButton,
                {
                  borderColor: config.theme.border,
                  opacity: step === 1 ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[styles.prevText, { color: config.theme.textPrimary }]}>
                {t('proPortal.kyc.previousButton')}
              </Text>
            </Pressable>

            {step < TOTAL_STEPS ? (
              <Pressable
                onPress={handleNext}
                style={[
                  styles.navButton,
                  styles.nextButton,
                  { backgroundColor: config.theme.primary },
                ]}
              >
                <Text style={[styles.nextText, { color: config.theme.textInverse }]}>
                  {t('proPortal.kyc.nextButton')}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.navButton} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 720,
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    gap: 20,
  },
  title: { fontSize: 24, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButton: { borderWidth: 1 },
  nextButton: {},
  prevText: { fontSize: 14, fontWeight: '600' },
  nextText: { fontSize: 14, fontWeight: '700' },
});
