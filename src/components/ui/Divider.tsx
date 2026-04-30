import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useEnv } from '@/src/env';

type Props = {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'subtle' | 'strong';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
};

export function Divider({
  orientation = 'horizontal',
  variant = 'subtle',
  spacing: spc = 'md',
  style,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const color = variant === 'strong' ? theme.borderStrong : theme.border;
  const margin = { none: 0, sm: 8, md: 16, lg: 24 }[spc];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          {
            width: StyleSheet.hairlineWidth,
            backgroundColor: color,
            marginHorizontal: margin,
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: color,
          marginVertical: margin,
        },
        style,
      ]}
    />
  );
}
