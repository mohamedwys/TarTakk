import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';

type Props = {
  children: React.ReactNode;
  maxWidth?: number;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function ProLayout({
  children,
  maxWidth = 1200,
  scrollable = true,
  style,
  contentStyle,
}: Props) {
  const { config } = useEnv();
  const theme = config.theme;

  if (scrollable) {
    return (
      <View style={[styles.outer, { backgroundColor: theme.background }, style]}>
        <ScrollView
          style={styles.scrollOuter}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.innerWrap, { maxWidth }]}>
            <View style={[styles.content, contentStyle]}>{children}</View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outer, { backgroundColor: theme.background }, style]}>
      <View style={[styles.staticInner, { maxWidth }]}>
        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  scrollOuter: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    flexGrow: 1,
  },
  innerWrap: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  staticInner: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  content: {
    width: '100%',
  },
});
