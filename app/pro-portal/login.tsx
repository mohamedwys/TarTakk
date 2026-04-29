import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';

export default function ProPortalLogin() {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (!result.success) {
        Toast.show({
          type: 'error',
          text1: t('proPortal.login.wrongCredentials'),
          text2: typeof result.error === 'string' ? result.error : undefined,
        });
        setIsLoading(false);
        return;
      }

      // Wait for AuthContext.user to be hydrated with the real accountType
      // (enrichUserFromProfile runs async after hydrateFromSession), then
      // route via /pro-portal index which decides dashboard vs onboarding.
      await new Promise((resolve) => setTimeout(resolve, 250));

      router.replace({ pathname: '/pro-portal' } as any);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('proPortal.login.loginFailed'),
        text2: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: config.theme.background }]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: config.theme.surface, borderColor: config.theme.border },
        ]}
      >
        <Text style={[styles.title, { color: config.theme.textPrimary }]}>
          {t('proPortal.login.title')}
        </Text>
        <Text style={[styles.subtitle, { color: config.theme.textSecondary }]}>
          {t('proPortal.login.subtitle')}
        </Text>

        <View style={{ marginTop: 32, gap: 16 }}>
          <View>
            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('proPortal.login.email')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('proPortal.login.emailPlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View>
            <Text style={[styles.label, { color: config.theme.textSecondary }]}>
              {t('proPortal.login.password')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: config.theme.background,
                  color: config.theme.textPrimary,
                  borderColor: config.theme.border,
                },
              ]}
              placeholder={t('proPortal.login.passwordPlaceholder')}
              placeholderTextColor={config.theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
            />
          </View>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: config.theme.primary },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={config.theme.textInverse} />
            ) : (
              <Text style={[styles.submitButtonText, { color: config.theme.textInverse }]}>
                {t('proPortal.login.submitButton')}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: config.theme.border }]} />

        <View style={styles.signupRow}>
          <Text style={[styles.signupText, { color: config.theme.textSecondary }]}>
            {t('proPortal.login.noAccount')}
          </Text>
          <Pressable onPress={() => router.push({ pathname: '/pro-portal/onboarding' } as any)}>
            <Text style={[styles.signupLink, { color: config.theme.primary }]}>
              {t('proPortal.login.becomeProLink')}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 40,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  submitButton: { marginTop: 8, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitButtonText: { fontSize: 15, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 24 },
  signupRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap' },
  signupText: { fontSize: 13 },
  signupLink: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
});
