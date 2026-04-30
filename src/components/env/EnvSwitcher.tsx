import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import type { EnvConfig } from '@/src/env';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

type Props = {
  language?: 'en' | 'fr' | 'ar';
};

export function EnvSwitcher({ language = 'en' }: Props) {
  const { current, allEnvs, setEnv, config } = useEnv();
  const containerBg = config.theme.background;

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="tablist"
      >
        {allEnvs.map((env) => (
          <EnvTile
            key={env.id}
            env={env}
            active={env.id === current}
            language={language}
            onPress={() => setEnv(env.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function EnvTile({
  env,
  active,
  language,
  onPress,
}: {
  env: EnvConfig;
  active: boolean;
  language: 'en' | 'fr' | 'ar';
  onPress: () => void;
}) {
  const [pressed, setPressed] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const label =
    language === 'fr'
      ? env.fallbackLabelFr
      : language === 'ar'
      ? env.fallbackLabelAr
      : env.fallbackLabelEn;

  const tileBg = env.theme.surface;
  const borderColor = active ? env.theme.primary : env.theme.border;
  const borderWidth = active ? 2 : StyleSheet.hairlineWidth;
  const iconColor = active ? env.theme.primary : env.theme.textSecondary;
  const labelColor = active ? env.theme.textPrimary : env.theme.textSecondary;

  return (
    <MotiView
      animate={{ scale: pressed ? 0.95 : active ? 1.02 : 1 }}
      transition={animationConfig.press}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
        style={[
          styles.tile,
          {
            backgroundColor: tileBg,
            borderColor,
            borderWidth,
          },
          active ? shadow.md : shadow.sm,
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name={env.iconName as any} size={32} color={iconColor} />
        </View>
        <Text
          style={[
            styles.label,
            { color: labelColor, fontFamily: fontFamily.semibold },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  tile: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    marginBottom: spacing.xxs,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
});
