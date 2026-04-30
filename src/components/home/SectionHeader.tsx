import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  return (
    <View style={styles.container}>
      <Text
        style={[
          typography.h3,
          { color: theme.textPrimary, fontFamily: fontFamily.bold },
        ]}
      >
        {title}
      </Text>
      {actionLabel && onActionPress && (
        <Pressable onPress={onActionPress} hitSlop={8} style={styles.action}>
          <Text
            style={[
              typography.bodySmall,
              { color: theme.primary, fontFamily: fontFamily.semibold },
            ]}
          >
            {actionLabel}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
