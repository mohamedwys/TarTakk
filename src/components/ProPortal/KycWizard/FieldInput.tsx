import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { useEnv } from '@/src/env';

type Props = TextInputProps & {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
};

export function FieldInput({ label, value, onChangeText, style, multiline, ...rest }: Props) {
  const { config } = useEnv();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: config.theme.textSecondary }]}>{label}</Text>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor={config.theme.textSecondary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: config.theme.background,
            color: config.theme.textPrimary,
            borderColor: config.theme.border,
          },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
