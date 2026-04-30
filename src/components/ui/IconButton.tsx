import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { radius } from '@/src/design/tokens';
import { animationConfig } from '@/src/design/animations';

type Variant = 'default' | 'primary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  onPress?: () => void;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string;
};

export function IconButton({
  icon,
  variant = 'default',
  size = 'md',
  disabled = false,
  onPress,
  hapticFeedback = true,
  style,
  accessibilityLabel,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = React.useState(false);

  const handlePress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const sizes = { sm: { btn: 36, icon: 18 }, md: { btn: 44, icon: 22 }, lg: { btn: 52, icon: 26 } };
  const sz = sizes[size];

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: pressed ? theme.primaryHover : theme.primary, icon: theme.textInverse };
      case 'ghost':
        return { bg: pressed ? theme.primarySoft : 'transparent', icon: theme.primary };
      case 'default':
      default:
        return { bg: pressed ? theme.surfaceMuted : theme.surface, icon: theme.textPrimary };
    }
  };
  const colors = getColors();

  return (
    <MotiView
      animate={{ scale: pressed && !disabled ? 0.92 : 1 }}
      transition={animationConfig.press}
      style={style}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{
          width: sz.btn,
          height: sz.btn,
          borderRadius: radius.full,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Ionicons name={icon} size={sz.icon} color={colors.icon} />
      </Pressable>
    </MotiView>
  );
}
