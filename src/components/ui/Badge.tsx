import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography } from '@/src/design/typography';

type Variant = 'default' | 'success' | 'warning' | 'error' | 'info';
type Size = 'sm' | 'md';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
};

export function Badge({ children, variant = 'default', size = 'sm', style }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
      case 'warning':
        return { bg: theme.accentSoft, text: theme.accentDark, border: theme.accent };
      case 'error':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
      case 'info':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
      case 'default':
      default:
        return { bg: theme.surfaceMuted, text: theme.textSecondary, border: theme.border };
    }
  };

  const colors = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
          paddingVertical: isSm ? 2 : spacing.xxs,
          paddingHorizontal: isSm ? spacing.xs : spacing.sm,
          borderRadius: radius.sm,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text
        style={[
          isSm ? typography.caption : typography.label,
          { color: colors.text, letterSpacing: 0.5 },
        ]}
      >
        {typeof children === 'string' ? children.toUpperCase() : children}
      </Text>
    </View>
  );
}
