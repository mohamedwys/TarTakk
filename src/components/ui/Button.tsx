import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { typography } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  hapticFeedback?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  iconLeft,
  iconRight,
  hapticFeedback = true,
  onPress,
  style,
  accessibilityLabel,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = React.useState(false);

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: pressed ? theme.primaryHover : theme.primary,
          text: theme.textInverse,
          border: 'transparent',
        };
      case 'secondary':
        return {
          bg: 'transparent',
          text: theme.primary,
          border: theme.primary,
        };
      case 'ghost':
        return {
          bg: pressed ? theme.primarySoft : 'transparent',
          text: theme.primary,
          border: 'transparent',
        };
      case 'danger':
        return {
          bg: pressed ? '#B91C1C' : theme.error,
          text: theme.textInverse,
          border: 'transparent',
        };
    }
  };

  const colors = getColors();

  const sizes = {
    sm: { paddingV: spacing.xs, paddingH: spacing.md, fontSize: 13, iconSize: 16, height: 36 },
    md: { paddingV: spacing.sm, paddingH: spacing.lg, fontSize: 15, iconSize: 18, height: 44 },
    lg: { paddingV: spacing.md, paddingH: spacing.xl, fontSize: 17, iconSize: 20, height: 52 },
  };
  const sz = sizes[size];

  return (
    <MotiView
      animate={{ scale: pressed && !disabled ? 0.97 : 1 }}
      transition={animationConfig.press}
      style={[fullWidth && { width: '100%' }, style]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.button,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: variant === 'secondary' ? 1.5 : 0,
            paddingVertical: sz.paddingV,
            paddingHorizontal: sz.paddingH,
            minHeight: sz.height,
            opacity: disabled ? 0.5 : 1,
          },
          variant === 'primary' && !disabled && shadow.sm,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <View style={styles.content}>
            {iconLeft && (
              <Ionicons name={iconLeft} size={sz.iconSize} color={colors.text} style={styles.iconLeft} />
            )}
            <Text
              style={[
                styles.text,
                typography.button,
                { color: colors.text, fontSize: sz.fontSize },
              ]}
            >
              {children}
            </Text>
            {iconRight && (
              <Ionicons name={iconRight} size={sz.iconSize} color={colors.text} style={styles.iconRight} />
            )}
          </View>
        )}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  iconLeft: { marginRight: spacing.xs },
  iconRight: { marginLeft: spacing.xs },
});
