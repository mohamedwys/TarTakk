import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useEnv } from '@/src/env';
import { spacing, shadow } from '@/src/design/tokens';

type Props = {
  children: React.ReactNode;
};

export function StickyCTA({ children }: Props) {
  const { config } = useEnv();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.theme.surface, borderTopColor: config.theme.border },
        shadow.lg,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : spacing.md,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
