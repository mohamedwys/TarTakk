import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  iconColor?: string;
};

export function StatCard({ icon, value, label, iconColor }: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const color = iconColor ?? theme.primary;

  return (
    <Card elevation="raised" padding="md" style={{ flex: 1, alignItems: 'center' }}>
      <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text
        style={[
          typography.h3,
          { color: theme.textPrimary, fontFamily: fontFamily.extrabold, marginTop: spacing.xs },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          typography.caption,
          { color: theme.textTertiary, marginTop: 2 },
        ]}
      >
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
