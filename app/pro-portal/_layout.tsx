import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useEnv } from '@/src/env';
import { BlockMobileWrapper } from '@/src/components/ProPortal/BlockMobile';
import { ProHeader } from '@/src/components/pro-portal';

export default function ProPortalLayout() {
  const { config } = useEnv();

  return (
    <BlockMobileWrapper>
      <View style={[styles.container, { backgroundColor: config.theme.background }]}>
        <ProHeader />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </View>
      </View>
    </BlockMobileWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
