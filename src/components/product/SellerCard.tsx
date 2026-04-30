import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';

type Props = {
  sellerId: string;
  name: string;
  avatarUrl?: string | null;
  rating?: number;
  salesCount?: number;
  isVerified?: boolean;
};

export function SellerCard({ sellerId, name, avatarUrl, rating, salesCount, isVerified }: Props) {
  const { t } = useTranslation();
  const { config } = useEnv();
  const router = useRouter();
  const theme = config.theme;

  const handlePress = () => {
    if (!sellerId) return;
    router.push(`/user/${sellerId}` as any);
  };

  return (
    <Card elevation="flat" padding="md">
      <Pressable onPress={handlePress} style={styles.row} hitSlop={4}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="person" size={24} color={theme.primary} />
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[typography.body, { color: theme.textPrimary, fontFamily: fontFamily.semibold }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isVerified && <Ionicons name="checkmark-circle" size={16} color={theme.success} />}
          </View>
          {(rating !== undefined || salesCount !== undefined) && (
            <View style={styles.metaRow}>
              {rating !== undefined && (
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={12} color={theme.accent} />
                  <Text style={[typography.caption, { color: theme.textSecondary }]}>
                    {rating.toFixed(1)}
                  </Text>
                </View>
              )}
              {salesCount !== undefined && (
                <Text style={[typography.caption, { color: theme.textTertiary }]}>
                  · {t('product.soldCount', { count: salesCount })}
                </Text>
              )}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: radius.full },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
