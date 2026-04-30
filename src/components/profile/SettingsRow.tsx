import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  description?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  rightContent?: React.ReactNode;
};

export function SettingsRow({
  icon,
  iconColor,
  label,
  description,
  value,
  onValueChange,
  onPress,
  showChevron,
  rightContent,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const finalIconColor = iconColor ?? theme.textPrimary;

  const isSwitch = value !== undefined;

  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: finalIconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={finalIconColor} />
      </View>

      <View style={styles.content}>
        <Text style={[typography.body, { color: theme.textPrimary, fontFamily: fontFamily.medium }]}>
          {label}
        </Text>
        {description && (
          <Text style={[typography.caption, { color: theme.textTertiary, marginTop: 2 }]}>
            {description}
          </Text>
        )}
      </View>

      {isSwitch && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.surfaceMuted, true: theme.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={theme.surfaceMuted}
        />
      )}

      {rightContent}

      {showChevron && !isSwitch && !rightContent && (
        <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.container}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.container}>{content}</View>;
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
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
});
