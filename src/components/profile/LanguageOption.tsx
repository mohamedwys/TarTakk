import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  flag: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function LanguageOption({ flag, label, selected, onPress }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.flag}>{flag}</Text>
      <Text
        style={[
          typography.body,
          { color: theme.textPrimary, fontFamily: fontFamily.medium, flex: 1 },
        ]}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark" size={22} color={theme.primary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    minHeight: 56,
  },
  flag: {
    fontSize: 24,
  },
});
