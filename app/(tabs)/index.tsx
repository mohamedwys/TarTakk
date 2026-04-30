import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  favoritesAPI,
  notificationsAPI,
  productsAPI,
} from "@/lib/api";
import { CategoryPill } from "@/src/components/home/CategoryPill";
import { SearchBar } from "@/src/components/home/SearchBar";
import { SectionHeader } from "@/src/components/home/SectionHeader";
import { spacing } from "@/src/design/tokens";
import { fontFamily, typography } from "@/src/design/typography";
import { useEnv } from "@/src/env";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CATEGORIES = [
  {
    key: "electronics",
    emoji: "📱",
    icon: "phone-portrait-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1592286927505-1def25115481?w=200&q=80",
    bgColor: "#FFF4C4", // jaune doux
    badge: "new" as const,
  },
  {
    key: "fashion",
    emoji: "👗",
    icon: "shirt-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80",
    bgColor: "#D4F0E0", // mint
    badge: "sale" as const,
  },
  {
    key: "home",
    emoji: "🏠",
    icon: "home-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=80",
    bgColor: "#D4E8FF", // bleu ciel
    badge: null,
  },
  {
    key: "sports",
    emoji: "⚽",
    icon: "football-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=200&q=80",
    bgColor: "#FFD4D4", // rose pâle
    badge: null,
  },
  {
    key: "books",
    emoji: "📚",
    icon: "book-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&q=80",
    bgColor: "#E8DAFF", // lavande
    badge: null,
  },
  {
    key: "toys",
    emoji: "🎮",
    icon: "game-controller-outline" as const,
    imageUrl: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=200&q=80",
    bgColor: "#FFE0CC", // pêche
    badge: null,
  },
];

const CATEGORY_TO_SEARCH: Record<string, string> = {
  electronics: "Electronics",
  fashion: "Fashion",
  home: "Home",
  sports: "Sports",
  books: "Books",
  toys: "Toys",
};

export default function HomeScreen() {
  const router = useRouter();
  const { config } = useEnv();
  const { user } = useAuth();
  const { t } = useTranslation();
  const theme = config.theme;

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getProducts({
        limit: 6,
        sortBy: "createdAt",
        sortOrder: "desc",
        listingType: config.listingTypeFilter,
      });
      setFeaturedProducts(response.products || []);
    } catch (error) {
      console.error("[Home] fetchFeaturedProducts error:", error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const count = await notificationsAPI.getUnreadCount();
      setNotificationCount(count.count || 0);
    } catch {
      setNotificationCount(0);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await favoritesAPI.getFavorites();
      const favoriteIds = response.favorites.map((fav: any) => fav.id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error("[Home] fetchFavorites error:", error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    fetchFavorites();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchFeaturedProducts().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.listingTypeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchFeaturedProducts(),
      fetchNotificationCount(),
      fetchFavorites(),
    ]);
    setRefreshing(false);
  };

  const toggleFavorite = async (productId: string) => {
    try {
      const isCurrentlyFavorite = favorites.includes(productId);
      if (isCurrentlyFavorite) {
        await favoritesAPI.removeFavorite(productId);
        setFavorites((prev) => prev.filter((id) => id !== productId));
      } else {
        await favoritesAPI.addFavorite(productId);
        setFavorites((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error("[Home] toggleFavorite error:", error);
    }
  };

  const handleSearchPress = () => {
    router.push("/search");
  };

  const handleCategoryPress = (catKey: string) => {
    router.push({
      pathname: "/search",
      params: {
        type: "category",
        value: CATEGORY_TO_SEARCH[catKey] ?? catKey,
      },
    });
  };

  const handleSeeAll = (type: "all-categories" | "featured") => {
    router.push({
      pathname: "/search",
      params: { type, value: "all" },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                typography.bodySmall,
                {
                  color: theme.textSecondary,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              {t("home.greeting", { name: user?.name ?? "" })}
            </Text>
            <Text
              style={[
                typography.h2,
                {
                  color: theme.textPrimary,
                  fontFamily: fontFamily.extrabold,
                  marginTop: 2,
                },
              ]}
            >
              {t("home.tagline")}
            </Text>
          </View>
          <Pressable
            style={[styles.notifButton, { backgroundColor: theme.surface }]}
            onPress={() => router.push("/notifications")}
            hitSlop={8}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={theme.textPrimary}
            />
            {notificationCount > 0 && (
              <View
                style={[
                  styles.notifBadge,
                  { backgroundColor: theme.error },
                ]}
              >
                <Text style={styles.notifBadgeText}>
                  {notificationCount > 99 ? "99+" : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <SearchBar
            pressable
            placeholder={t("explore.searchPlaceholder")}
            onPress={handleSearchPress}
            onFilterPress={handleSearchPress}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <SectionHeader
            title={t("home.categories")}
            actionLabel={t("home.seeAll")}
            onActionPress={() => handleSeeAll("all-categories")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat.key}
                label={t(`categories.${cat.key}`, { defaultValue: cat.key })}
                icon={cat.icon}
                emoji={cat.emoji}
                imageUrl={cat.imageUrl}
                bgColor={cat.bgColor}
                badge={cat.badge}
                onPress={() => handleCategoryPress(cat.key)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <SectionHeader
            title={t("home.featuredProducts")}
            actionLabel={t("home.seeAll")}
            onActionPress={() => handleSeeAll("featured")}
          />
          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.primary} />
            </View>
          ) : featuredProducts.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="storefront-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text
                style={[
                  typography.body,
                  { color: theme.textSecondary, marginTop: spacing.xs },
                ]}
              >
                {t("home.noProducts")}
              </Text>
              <Text
                style={[
                  typography.caption,
                  { color: theme.textTertiary, marginTop: 4 },
                ]}
              >
                {t("home.checkBackLater")}
              </Text>
            </View>
          ) : (
            <FlatList
              data={featuredProducts}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              renderItem={({ item }) => (
                <ProductCard
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  currency={item.currency || "MAD"}
                  image={item.thumbnail ?? item.images?.[0] ?? ""}
                  location={item.location?.city ?? ""}
                  condition={item.condition}
                  isFavorite={favorites.includes(item.id)}
                  onFavoritePress={() => toggleFavorite(item.id)}
                  style={styles.gridCard}
                />
              )}
            />
          )}
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  notifButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  searchWrap: { marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  categoriesRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  loadingWrap: { padding: spacing.xl, alignItems: "center" },
  emptyWrap: { padding: spacing.xl, alignItems: "center" },
  gridRow: {
    gap: spacing.sm,
  },
  gridCard: { flex: 1 },
});
