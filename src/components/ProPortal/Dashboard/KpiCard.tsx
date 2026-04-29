import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  subtitle?: string;
  accentColor?: string;
  onPress?: () => void;
};

export function KpiCard({ icon, label, value, subtitle, accentColor, onPress }: Props) {
  const { config } = useEnv();
  const color = accentColor ?? config.theme.primary;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: config.theme.surface,
          borderColor: config.theme.border,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.label, { color: config.theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.value, { color: config.theme.textPrimary }]}>
        {value}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: config.theme.textSecondary }]}>
          {subtitle}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 200,
    padding: 20,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 12 },
});
