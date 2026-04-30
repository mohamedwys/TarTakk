import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  description?: string;
  badge?: string | number;
  variant?: 'default' | 'danger';
  onPress?: () => void;
  showChevron?: boolean;
};

export function MenuItem({
  icon,
  iconColor,
  label,
  description,
  badge,
  variant = 'default',
  onPress,
  showChevron = true,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = React.useState(false);

  const isDanger = variant === 'danger';
  const finalIconColor = iconColor ?? (isDanger ? theme.error : theme.textPrimary);
  const labelColor = isDanger ? theme.error : theme.textPrimary;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <MotiView
      animate={{ opacity: pressed ? 0.7 : 1 }}
      transition={animationConfig.smooth}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.container,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: finalIconColor + '15' }]}>
          <Ionicons name={icon} size={20} color={finalIconColor} />
        </View>

        <View style={styles.content}>
          <Text
            style={[typography.body, { color: labelColor, fontFamily: fontFamily.medium }]}
          >
            {label}
          </Text>
          {description && (
            <Text
              style={[typography.caption, { color: theme.textTertiary, marginTop: 2 }]}
            >
              {description}
            </Text>
          )}
        </View>

        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.badgeText, { color: theme.textInverse }]}>
              {badge}
            </Text>
          </View>
        )}

        {showChevron && badge === undefined && (
          <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
        )}
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
