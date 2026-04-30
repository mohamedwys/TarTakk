import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEnv } from '@/src/env';
import { spacing } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  text: string;
  maxLines?: number;
};

export function CollapsibleSection({ text, maxLines = 4 }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const [expanded, setExpanded] = React.useState(false);
  const theme = config.theme;

  if (!text) {
    return (
      <Text style={[typography.body, { color: theme.textTertiary, fontStyle: 'italic' }]}>
        {t('product.noDescription')}
      </Text>
    );
  }

  return (
    <View>
      <Text
        style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}
        numberOfLines={expanded ? undefined : maxLines}
      >
        {text}
      </Text>
      {text.length > 200 && (
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.toggle} hitSlop={8}>
          <Text style={[typography.bodySmall, { color: theme.primary, fontFamily: fontFamily.semibold }]}>
            {expanded ? t('product.readLess') : t('product.readMore')}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.primary}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
});
