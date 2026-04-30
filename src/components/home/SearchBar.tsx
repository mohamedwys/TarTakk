import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { typography } from '@/src/design/typography';

type Props = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onPress?: () => void;
  onFilterPress?: () => void;
  pressable?: boolean;
};

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onPress,
  onFilterPress,
  pressable = false,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  const content = (
    <>
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.textSecondary}
        style={styles.searchIcon}
      />
      {pressable ? (
        <Text
          style={[typography.body, { color: theme.textTertiary, flex: 1 }]}
          numberOfLines={1}
        >
          {placeholder ?? 'Rechercher...'}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          placeholder={placeholder ?? 'Rechercher...'}
          placeholderTextColor={theme.textTertiary}
          style={[typography.body, { color: theme.textPrimary, flex: 1, padding: 0 }]}
        />
      )}
      {onFilterPress && (
        <Pressable onPress={onFilterPress} hitSlop={8} style={styles.filterIcon}>
          <Ionicons name="options-outline" size={22} color={theme.textSecondary} />
        </Pressable>
      )}
    </>
  );

  if (pressable) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.container,
          { backgroundColor: theme.surface, borderColor: theme.border },
          shadow.sm,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow.sm,
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  searchIcon: { marginRight: spacing.sm },
  filterIcon: { marginLeft: spacing.sm },
});
