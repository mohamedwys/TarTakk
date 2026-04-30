import { safeUri } from "@/lib/utils/image";
import { Badge } from "@/src/components/ui";
import { animationConfig } from "@/src/design/animations";
import { radius, shadow, spacing } from "@/src/design/tokens";
import { fontFamily, typography } from "@/src/design/typography";
import { useEnv } from "@/src/env";
import { formatPrice } from "@/src/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  currency?: string;
  image: string;
  location: string;
  condition?: string;
  isFavorite?: boolean;
  onFavoritePress?: () => void;
  index?: number;
  style?: ViewStyle;
}

const CONDITION_VARIANT: Record<
  string,
  "success" | "warning" | "default" | "info"
> = {
  neuf: "success",
  new: "success",
  "très_bon": "warning",
  "like new": "warning",
  bon: "default",
  good: "default",
  acceptable: "default",
  used: "default",
  fair: "default",
};

function cleanLocation(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p !== "null" && p !== "undefined")
    .join(", ");
}

export default function ProductCard({
  id,
  title,
  price,
  currency = "MAD",
  image,
  location,
  condition,
  isFavorite = false,
  onFavoritePress,
  style,
}: ProductCardProps) {
  const router = useRouter();
  const { config } = useEnv();
  const theme = config.theme;
  const [pressed, setPressed] = useState(false);

  const handlePress = () => {
    router.push(`/product/${id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation?.();
    onFavoritePress?.();
  };

  const cityLabel = cleanLocation(location);
  const conditionKey = condition?.toLowerCase() ?? "";
  const conditionVariant = CONDITION_VARIANT[conditionKey] ?? "default";
  const conditionLabel = condition ? condition.toUpperCase() : "";

  return (
    <MotiView
      animate={{ scale: pressed ? 0.97 : 1 }}
      transition={animationConfig.press}
      style={style}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.card,
          { backgroundColor: theme.surface },
          shadow.sm,
        ]}
      >
        {/* Image */}
        <View style={[styles.imageWrap, { backgroundColor: theme.surfaceMuted }]}>
          {image ? (
            <Image source={safeUri(image)} style={styles.image} />
          ) : null}

          <Pressable
            onPress={handleFavoritePress}
            hitSlop={6}
            style={[
              styles.heartButton,
              { backgroundColor: "rgba(255,255,255,0.92)" },
            ]}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? theme.error : theme.textPrimary}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: theme.textPrimary,
                fontFamily: fontFamily.semibold,
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {cityLabel ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={12}
                color={theme.textTertiary}
              />
              <Text
                style={[
                  styles.location,
                  typography.caption,
                  { color: theme.textTertiary },
                ]}
                numberOfLines={1}
              >
                {cityLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.bottomRow}>
            <Text
              style={[
                styles.price,
                { color: theme.primary, fontFamily: fontFamily.bold },
              ]}
              numberOfLines={1}
            >
              {formatPrice(price, currency)}
            </Text>
            {conditionLabel ? (
              <Badge variant={conditionVariant} size="sm">
                {conditionLabel}
              </Badge>
            ) : null}
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 14,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: spacing.xxs,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: 2,
  },
  location: {
    fontSize: 11,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  price: {
    fontSize: 16,
    flexShrink: 1,
  },
});
