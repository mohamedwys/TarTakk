import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useEnv } from '@/src/env';
import { Badge } from '@/src/components/ui';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

type Props = {
  selected: boolean;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  badge?: string;
  onSelect: () => void;
};

export function PaymentMethodCard({
  selected,
  disabled,
  icon,
  title,
  description,
  badge,
  onSelect,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect();
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <MotiView
        animate={{ scale: selected ? 1.01 : 1 }}
        transition={animationConfig.smooth}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: selected ? theme.primarySoft : theme.surface,
              borderColor: selected ? theme.primary : theme.border,
              borderWidth: selected ? 2 : 1,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.radio,
              { borderColor: selected ? theme.primary : theme.border },
            ]}
          >
            {selected && (
              <View style={[styles.radioInner, { backgroundColor: theme.primary }]} />
            )}
          </View>

          <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons name={icon} size={20} color={theme.textPrimary} />
          </View>

          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  typography.body,
                  { color: theme.textPrimary, fontFamily: fontFamily.semibold },
                ]}
              >
                {title}
              </Text>
              {badge ? (
                <Badge variant="info" size="sm">
                  {badge}
                </Badge>
              ) : null}
            </View>
            <Text style={[typography.caption, { color: theme.textTertiary }]}>
              {description}
            </Text>
          </View>
        </View>
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
