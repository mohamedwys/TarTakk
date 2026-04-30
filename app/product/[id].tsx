// app/product/[id].tsx
import ProductDetailSkeleton from "@/components/ProductDetailSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { productsAPI } from "@/lib/api";
import { filterImages } from "@/lib/utils/image";
import { useCart } from "@/src/cart";
import { useEnv } from "@/src/env";
import { Badge, Button, Divider, IconButton } from "@/src/components/ui";
import {
  CollapsibleSection,
  ImageCarousel,
  SellerCard,
  StickyCTA,
  StockCard,
} from "@/src/components/product";
import { spacing } from "@/src/design/tokens";
import { fontFamily, typography } from "@/src/design/typography";
import { formatPrice } from "@/src/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const CONDITION_VARIANT: Record<string, "success" | "warning" | "default"> = {
  neuf: "success",
  new: "success",
  "très_bon": "warning",
  "like new": "warning",
  bon: "default",
  good: "default",
  acceptable: "default",
};

function cleanLocation(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p !== "null" && p !== "undefined")
    .join(", ");
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { addItem } = useCart();
  const { config } = useEnv();
  const { t } = useTranslation();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const theme = config.theme;

  const fetchProduct = async () => {
    try {
      setProductError(null);
      setIsLoading(true);
      const response = await productsAPI.getProductById(id as string);
      setProduct(response.product);
    } catch (error: any) {
      setProductError("Failed to load product. Please try again.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load product. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchProduct();
  }, [id]);

  const isC2C = product?.listing_type === "C2C";
  const sellerId =
    product?.seller_id || product?.seller?.id || product?.seller?._id;
  const isOwnProduct = !!currentUser?.id && currentUser.id === sellerId;
  const stockQty = product?.stock_qty ?? 1;
  const isOutOfStock = stockQty <= 0;

  const handleMessageSeller = () => {
    if (!currentUser) {
      Alert.alert(t("product.loginRequired"));
      return;
    }
    if (isOwnProduct) {
      Alert.alert(t("product.ownProduct"));
      return;
    }
    if (!sellerId) return;
    router.push(`/chat/${sellerId}` as any);
  };

  const handleAddToCart = async () => {
    if (!currentUser) {
      Alert.alert(t("product.loginRequired"));
      return;
    }
    if (isOutOfStock) {
      Toast.show({ type: "error", text1: t("product.outOfStock") });
      return;
    }
    const result = await addItem(product.id, 1);
    if (result.success) {
      Toast.show({
        type: "success",
        text1: t("cart.addedToCart"),
        text2: product.title,
      });
    } else {
      Toast.show({
        type: "error",
        text1: t("cart.addToCartFailed"),
        text2: result.error,
      });
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      Alert.alert(t("product.loginRequired"));
      return;
    }
    if (isOwnProduct) {
      Alert.alert(t("product.ownProduct"));
      return;
    }
    if (isOutOfStock) {
      Toast.show({ type: "error", text1: t("product.outOfStock") });
      return;
    }
    const result = await addItem(product.id, 1);
    if (result.success) {
      router.push("/checkout" as any);
    } else {
      Toast.show({
        type: "error",
        text1: t("cart.addToCartFailed"),
        text2: result.error,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ProductDetailSkeleton />
      </View>
    );
  }

  if (productError || !product) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
        <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md }]}>
          {productError || t("product.notFound")}
        </Text>
        <Button variant="primary" size="md" onPress={fetchProduct}>
          {t("common.retry", { defaultValue: "Retry" })}
        </Button>
      </View>
    );
  }

  const images = filterImages(product.images);
  const cityLabel = cleanLocation(
    product.location?.city
      ? `${product.location.city}${product.location.state ? ", " + product.location.state : ""}`
      : product.city ?? null
  );
  const conditionKey = product.condition?.toLowerCase?.() ?? "";
  const conditionVariant = CONDITION_VARIANT[conditionKey] ?? "default";
  const conditionLabel = product.condition ? String(product.condition).toUpperCase() : "";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageCarousel images={images as string[]} aspectRatio={4 / 3} />

        <View style={styles.content}>
          <Text
            style={[
              typography.h2,
              { color: theme.textPrimary, fontFamily: fontFamily.extrabold },
            ]}
          >
            {product.title}
          </Text>

          {cityLabel ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textTertiary} />
              <Text style={[typography.caption, { color: theme.textTertiary }]}>
                {cityLabel}
              </Text>
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                { color: theme.primary, fontFamily: fontFamily.extrabold },
              ]}
            >
              {formatPrice(product.price, product.currency || "MAD")}
            </Text>
            {conditionLabel ? (
              <Badge variant={conditionVariant} size="md">
                {conditionLabel}
              </Badge>
            ) : null}
          </View>

          <View style={{ marginTop: spacing.md }}>
            <StockCard stockQty={stockQty} showShipping={!isC2C} />
          </View>

          <Divider variant="subtle" spacing="lg" />

          <Text
            style={[
              typography.h4,
              {
                color: theme.textPrimary,
                fontFamily: fontFamily.bold,
                marginBottom: spacing.sm,
              },
            ]}
          >
            {t("product.description")}
          </Text>
          <CollapsibleSection text={product.description || ""} />

          {!isC2C && product.seller && (
            <>
              <Divider variant="subtle" spacing="lg" />
              <Text
                style={[
                  typography.h4,
                  {
                    color: theme.textPrimary,
                    fontFamily: fontFamily.bold,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                {t("product.seller")}
              </Text>
              <SellerCard
                sellerId={sellerId}
                name={
                  product.seller.name ||
                  product.seller.company_name ||
                  t("product.seller")
                }
                avatarUrl={product.seller.avatar_url ?? product.seller.avatar}
                rating={product.seller.rating}
                salesCount={product.seller.sales_count ?? product.seller.totalReviews}
                isVerified={
                  product.seller.is_verified ?? product.seller.emailVerified
                }
              />
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.floatingHeader} pointerEvents="box-none">
        <IconButton
          icon="chevron-back"
          variant="default"
          size="md"
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
        />
        <IconButton
          icon={isFavorite ? "heart" : "heart-outline"}
          variant="default"
          size="md"
          onPress={() => setIsFavorite(!isFavorite)}
          accessibilityLabel="Favorite"
          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
        />
      </View>

      <StickyCTA>
        {isC2C ? (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            iconLeft="chatbubble-outline"
            onPress={handleMessageSeller}
          >
            {t("product.messageSeller")}
          </Button>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                iconLeft="cart-outline"
                onPress={handleAddToCart}
                disabled={isOutOfStock}
              >
                {t("product.addToCart")}
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleBuyNow}
                disabled={isOutOfStock}
              >
                {t("product.buyNow")}
              </Button>
            </View>
          </>
        )}
      </StickyCTA>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  price: { fontSize: 28 },
  floatingHeader: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
});
