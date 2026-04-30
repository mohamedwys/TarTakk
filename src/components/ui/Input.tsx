import React from 'react';
import { Animated, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { useEnv } from '@/src/env';
import { spacing, radius, fontSize as fs } from '@/src/design/tokens';
import { typography } from '@/src/design/typography';

type Props = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

export function Input({ label, helperText, error, containerStyle, value, onFocus, onBlur, style, ...rest }: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [focused, setFocused] = React.useState(false);
  const labelAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    if (focused || value) {
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [focused, value, labelAnim]);

  const labelStyle = {
    position: 'absolute' as const,
    left: spacing.md,
    top: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 6],
    }),
    fontSize: labelAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [fs.base, fs.xs],
    }) as any,
    color: error ? theme.error : focused ? theme.primary : theme.textTertiary,
    fontWeight: '500' as const,
    fontFamily: 'Manrope_500Medium',
    backgroundColor: 'transparent',
    pointerEvents: 'none' as const,
  };

  const borderColor = error ? theme.error : focused ? theme.primary : theme.border;

  return (
    <View style={[{ marginBottom: spacing.md }, containerStyle]}>
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: theme.surface,
          },
        ]}
      >
        {label && <Animated.Text style={labelStyle}>{label}</Animated.Text>}
        <TextInput
          {...rest}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            typography.body,
            {
              color: theme.textPrimary,
              paddingTop: label ? 22 : spacing.sm,
              paddingBottom: spacing.sm,
            },
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
        />
      </View>
      {(error || helperText) && (
        <Text
          style={[
            typography.caption,
            {
              color: error ? theme.error : theme.textTertiary,
              marginTop: spacing.xxs,
              marginLeft: spacing.sm,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
  },
});
