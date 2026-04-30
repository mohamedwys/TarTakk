import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Badge } from '@/src/components/ui';
import { spacing, radius, shadow } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { animationConfig } from '@/src/design/animations';

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  imageUrl?: string;
  badge?: 'sale' | 'new' | null;
  onPress?: () => void;
};

const BADGE_CONFIG = {
  sale: { label: 'SALE', variant: 'warning' as const },
  new: { label: 'NEW', variant: 'info' as const },
};

// Beige Noon-style background palette (lighter, softer)
const BG_COLORS = ['#FFF8E7', '#FFF2EB', '#FFF6DE', '#FCF1E5', '#FFEFE3'];

export function CategoryPill({ label, icon, emoji, imageUrl, badge, onPress }: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = React.useState(false);

  const bgIndex = label.length % BG_COLORS.length;
  const bgColor = BG_COLORS[bgIndex];

  return (
    <MotiView
      animate={{ scale: pressed ? 0.96 : 1 }}
      transition={animationConfig.press}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.container, { backgroundColor: bgColor }, shadow.sm]}
      >
        {badge && (
          <View style={styles.badgeWrap}>
            <Badge variant={BADGE_CONFIG[badge].variant} size="sm">
              {BADGE_CONFIG[badge].label}
            </Badge>
          </View>
        )}
        <View style={styles.iconWrap}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : emoji ? (
            <Text style={styles.emoji}>{emoji}</Text>
          ) : (
            <Ionicons name={icon} size={32} color={theme.textPrimary} />
          )}
        </View>
        <Text
          style={[
            styles.label,
            typography.label,
            { color: theme.textPrimary, fontFamily: fontFamily.semibold },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 110,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 1,
  },
  iconWrap: {
    marginBottom: spacing.xxs,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
  },
});
