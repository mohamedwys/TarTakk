import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';

export default function ProPortalIndex() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { config } = useEnv();

  useFocusEffect(
    useCallback(() => {
      if (typeof window === 'undefined') return;
      if (isLoading) return;

      const isLoggedIn = !!user?._id;
      const accountType = user?.accountType;
      const isProAccount = accountType === 'B2C' || accountType === 'B2B';

      const timer = setTimeout(() => {
        if (!isLoggedIn) {
          router.replace({ pathname: '/pro-portal/login' } as any);
        } else if (isProAccount) {
          router.replace({ pathname: '/pro-portal/dashboard' } as any);
        } else {
          router.replace({ pathname: '/pro-portal/onboarding' } as any);
        }
      }, 50);

      return () => clearTimeout(timer);
    }, [user, isLoading, router])
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: config.theme.background,
      }}
    >
      <ActivityIndicator size="large" color={config.theme.primary} />
    </View>
  );
}
