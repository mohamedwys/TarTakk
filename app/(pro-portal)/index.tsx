import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEnv } from '@/src/env';
import { useAuth } from '@/contexts/AuthContext';

export default function ProPortalIndex() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { config } = useEnv();

  useEffect(() => {
    if (isLoading) return;

    const isLoggedIn = !!user?._id;
    const isProAccount = user?.accountType === 'B2C' || user?.accountType === 'B2B';

    if (!isLoggedIn) {
      router.replace('/(pro-portal)/login' as never);
    } else if (!isProAccount) {
      router.replace('/(pro-portal)/onboarding' as never);
    } else {
      router.replace('/(pro-portal)/dashboard' as never);
    }
  }, [user, isLoading, router]);

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
