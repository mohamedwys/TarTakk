import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function QtyStepper({ value, min = 1, max = 99, onChange }: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const handleDecrement = () => {
    if (value > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onChange(value + 1);
    }
  };

  const isMinDisabled = value <= min;
  const isMaxDisabled = value >= max;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
    >
      <Pressable
        onPress={handleDecrement}
        disabled={isMinDisabled}
        style={[styles.button, isMinDisabled && { opacity: 0.4 }]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={18} color={theme.textPrimary} />
      </Pressable>

      <View style={styles.valueWrap}>
        <Text
          style={[
            typography.body,
            { color: theme.textPrimary, fontFamily: fontFamily.semibold },
          ]}
        >
          {value}
        </Text>
      </View>

      <Pressable
        onPress={handleIncrement}
        disabled={isMaxDisabled}
        style={[styles.button, isMaxDisabled && { opacity: 0.4 }]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={18} color={theme.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    overflow: 'hidden',
    height: 36,
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueWrap: {
    minWidth: 32,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
});
