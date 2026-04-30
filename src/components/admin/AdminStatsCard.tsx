import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  accentColor?: string;
};

export function AdminStatsCard({ icon, label, value, accentColor }: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const color = accentColor ?? theme.primary;

  return (
    <Card elevation="raised" padding="md" style={{ flex: 1, minWidth: 160 }}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: theme.textTertiary }]}>
            {label}
          </Text>
          <Text
            style={[
              typography.h2,
              { color: theme.textPrimary, fontFamily: fontFamily.extrabold },
            ]}
          >
            {value}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
