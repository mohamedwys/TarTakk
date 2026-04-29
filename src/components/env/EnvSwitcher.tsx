import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import type { EnvConfig } from '@/src/env';

type Props = {
  language?: 'en' | 'fr' | 'ar';
};

export function EnvSwitcher({ language = 'en' }: Props) {
  const { current, allEnvs, setEnv } = useEnv();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const label =
    language === 'fr'
      ? env.fallbackLabelFr
      : language === 'ar'
      ? env.fallbackLabelAr
      : env.fallbackLabelEn;

  const bg = active ? env.theme.primary : '#F5F7FA';
  const fg = active ? env.theme.textInverse : '#5C6B7A';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tile, { backgroundColor: bg, transform: [{ scale }] }]}>
        <Ionicons name={env.iconName as any} size={20} color={fg} />
        <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    width: 110,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
