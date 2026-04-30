import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
};

export function SectionCard({ icon, title, children }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  return (
    <Card elevation="raised" padding="md" style={{ marginBottom: spacing.sm }}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text
          style={[
            typography.h4,
            { color: theme.textPrimary, fontFamily: fontFamily.bold },
          ]}
        >
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
