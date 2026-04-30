import React, { useState, useEffect } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEnv } from '@/src/env';
import { Card } from '@/src/components/ui';
import { spacing, radius } from '@/src/design/tokens';
import { typography, fontFamily } from '@/src/design/typography';
import { getSignedDocumentUrl } from '@/lib/services/adminKycService';

type Props = {
  label: string;
  path: string | null;
  required?: boolean;
};

export function DocumentPreview({ label, path, required }: Props) {
  const { config } = useEnv();
  const theme = config.theme;
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isImage = !!path?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = !!path?.match(/\.pdf$/i);

  useEffect(() => {
    if (!path) return;
    setIsLoading(true);
    getSignedDocumentUrl(path)
      .then(setSignedUrl)
      .finally(() => setIsLoading(false));
  }, [path]);

  if (!path) {
    return (
      <Card elevation="flat" padding="md">
        <View style={styles.row}>
          <Ionicons name="document-outline" size={24} color={theme.textTertiary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: theme.textSecondary }]}>
              {label}
            </Text>
            <Text style={[typography.caption, { color: theme.textTertiary }]}>
              {required ? 'Manquant (requis)' : 'Non fourni'}
            </Text>
          </View>
        </View>
      </Card>
    );
  }

  return (
    <Card elevation="raised" padding="md">
      <View style={styles.row}>
        {isImage && signedUrl ? (
          <Image
            source={{ uri: signedUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.iconWrap, { backgroundColor: theme.surfaceMuted }]}>
            <Ionicons
              name={isPdf ? 'document-text' : 'image'}
              size={28}
              color={theme.primary}
            />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={[
              typography.body,
              { color: theme.textPrimary, fontFamily: fontFamily.semibold },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[typography.caption, { color: theme.textTertiary }]}
            numberOfLines={1}
          >
            {isLoading ? 'Chargement...' : path.split('/').pop()}
          </Text>
        </View>

        {signedUrl && (
          <Pressable
            onPress={() => Linking.openURL(signedUrl)}
            style={[styles.viewButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="eye-outline" size={18} color={theme.textInverse} />
            <Text
              style={[
                typography.bodySmall,
                { color: theme.textInverse, fontFamily: fontFamily.semibold },
              ]}
            >
              Voir
            </Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  thumbnail: { width: 60, height: 60, borderRadius: radius.sm },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
});
