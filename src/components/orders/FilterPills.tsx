import { radius, spacing } from '@/src/design/tokens';
import { fontFamily, typography } from '@/src/design/typography';
import { useEnv } from '@/src/env';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type Filter<T extends string = string> = {
  key: T;
  label: string;
};

type Props<T extends string = string> = {
  filters: Filter<T>[];
  selected: T;
  onSelect: (key: T) => void;
};

export function FilterPills<T extends string = string>({
  filters,
  selected,
  onSelect,
}: Props<T>) {
  const { config } = useEnv();
  const theme = config.theme;

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isActive = filter.key === selected;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onSelect(filter.key)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? theme.primary : theme.surface,
                borderColor: isActive ? theme.primary : theme.border,
              },
            ]}
          >
            <Text 
              numberOfLines={1}
              style={[
                typography.bodySmall,
                {
                  color: isActive ? theme.textInverse : theme.textSecondary,
                  fontFamily: fontFamily.semibold,
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 36,                  // ← Hauteur fixe pour éviter étirement
    alignItems: 'center',        // ← Centre verticalement le texte
    justifyContent: 'center',    // ← Centre horizontalement
  },
});
