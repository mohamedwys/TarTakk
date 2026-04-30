import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = { children: string };

export function SectionLabel({ children }: Props) {
  const { config } = useEnv();
  return (
    <Text
      style={[
        styles.text,
        typography.overline,
        { color: config.theme.textTertiary, fontFamily: fontFamily.bold },
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1.2,
  },
});
