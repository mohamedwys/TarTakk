import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useEnv } from '@/src/env';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { animationConfig } from '@/src/design/animations';

type Elevation = 'flat' | 'raised' | 'floating';
type Padding = 'none' | 'sm' | 'md' | 'lg';

type Props = {
  children: React.ReactNode;
  elevation?: Elevation;
  padding?: Padding;
  onPress?: () => void;
  hapticFeedback?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

export function Card({
  children,
  elevation = 'raised',
  padding = 'md',
  onPress,
  hapticFeedback = true,
  style,
  accessibilityLabel,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = React.useState(false);

  const isPressable = !!onPress;

  const handlePress = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const paddingMap = { none: 0, sm: spacing.sm, md: spacing.md, lg: spacing.lg };
  const elevationStyle = {
    flat: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
    raised: shadow.sm,
    floating: shadow.md,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.surface,
    borderRadius: radius.lg,
    padding: paddingMap[padding],
    ...elevationStyle[elevation],
  };

  if (!isPressable) {
    return (
      <View style={[cardStyle, style]} accessibilityLabel={accessibilityLabel}>
        {children}
      </View>
    );
  }

  return (
    <MotiView
      animate={{ scale: pressed ? 0.98 : 1 }}
      transition={animationConfig.press}
      style={style}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={cardStyle}
      >
        {children}
      </Pressable>
    </MotiView>
  );
}
