import { productsAPI, reviewsAPI, userAPI } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useEnv } from "@/src/env";
import { safeUri } from "@/lib/utils/image";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";
import { Button, Card, Divider } from "@/src/components/ui";
import { StatCard, MenuItem } from "@/src/components/profile";
import { spacing, radius } from "@/src/design/tokens";
import { typography, fontFamily } from "@/src/design/typography";
import { animationConfig } from "@/src/design/animations";

type TabKey = "listings" | "sold" | "reviews";

export default function ProfileScreen() {
  const router = useRouter();
  const { config } = useEnv();
  const { t } = useTranslation();
  const theme = config.theme;
  const [activeTab, setActiveTab] = useState<TabKey>("listings");

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);
  const [isRefreshing] = useState(false);

  const fetchUserReviews = async () => {
    if (!user?.id) return;
    try {
      setReviewsError(null);
      setReviewsLoading(true);
      const response = await reviewsAPI.getReviews(user.id);
      setReviews(response.reviews);
    } catch (error: any) {
      setReviewsError("Failed to load reviews");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load reviews",
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setUserError(null);
      const userData = await userAPI.getProfile();
      setUser(userData.user);
    } catch (error: any) {
      setUserError("Failed to load profile");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load profile",
      });
    } finally {
      setUserLoading(false);
    }
  };

  const fetchUserListings = async () => {
    try {
      setListingsError(null);
      const response = await productsAPI.getMyListings();
      setListings(response.products || []);
    } catch (error: any) {
      setListingsError("Failed to load listings");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to load listings",
      });
    } finally {
      setListingsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!isRefreshing) {
        fetchUserProfile();
        fetchUserListings();
        fetchUserReviews();
      }
    }, [isRefreshing])
  );

  const activeListings = listings.filter((item) => item.status === "active");
  const soldListings = listings.filter((item) => item.status === "sold");

  const uploadAvatarToCloudinary = async (uri: string): Promise<string> => {
    const fileExtension = (uri.split(".").pop() || "jpg").toLowerCase();
    const contentType = `image/${fileExtension === "jpg" ? "jpeg" : fileExtension}`;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    const fileResponse = await fetch(uri);
    const fileBytes = await fileResponse.arrayBuffer();

    const path = `${user.id}/${Date.now()}_avatar.jpg`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(path, fileBytes, {
        contentType,
        upsert: true,
      });

    if (error || !data) {
      console.error("❌ avatar upload failed:", error?.message);
      throw new Error(error?.message ?? "Upload failed");
    }

    const url = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path).data.publicUrl;
    return url;
  };

  const handleAvatarChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Permission to access media library is required!",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUpdatingAvatar(true);
        const imageUri = result.assets[0].uri;
        const avatarUrl = await uploadAvatarToCloudinary(imageUri);
        await userAPI.updateProfile({ avatar: avatarUrl });
        setUser((prev: any) => ({ ...prev, avatar: avatarUrl }));
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Avatar updated successfully!",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to update avatar. Please try again.",
      });
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("profile.logoutConfirmTitle"), t("profile.logoutConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("authToken");
            router.replace("/(auth)/login");
          } catch (error) {
            Toast.show({
              type: "error",
              text1: t("common.error"),
              text2: t("profile.logoutFailed"),
            });
          }
        },
      },
    ]);
  };

  const renderListingCard = (item: any) => (
    <Card
      key={item.id}
      elevation="raised"
      padding="sm"
      onPress={() => router.push(`/product/${item.id}`)}
      style={styles.listingCard}
    >
      <Image
        source={safeUri(item.images?.[0])}
        style={[styles.listingImage, { backgroundColor: theme.border }]}
      />
      <View style={styles.listingInfo}>
        <Text
          style={[typography.body, { color: theme.textPrimary, fontFamily: fontFamily.semibold }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[typography.h4, { color: theme.textPrimary, fontFamily: fontFamily.extrabold }]}
        >
          ₦{item.price.toLocaleString()}
        </Text>
        <View style={styles.listingMeta}>
          <Ionicons name="eye-outline" size={14} color={theme.textTertiary} />
          <Text style={[typography.caption, { color: theme.textTertiary }]}>
            {item.views || 0} {t("profile.views")}
          </Text>
        </View>
      </View>
      {item.status === "sold" && (
        <View style={[styles.soldBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.soldText, { color: theme.textInverse }]}>
            {t("profile.soldBadge")}
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.surface }]}
        onPress={() => router.push(`/product/edit/${item.id}`)}
      >
        <Ionicons name="pencil" size={16} color={theme.textPrimary} />
      </TouchableOpacity>
    </Card>
  );

  const renderTab = (key: TabKey, label: string, count: number) => {
    const active = activeTab === key;
    return (
      <Pressable
        key={key}
        onPress={() => setActiveTab(key)}
        style={[
          styles.tabPill,
          {
            backgroundColor: active ? theme.primary : theme.surfaceMuted,
          },
        ]}
      >
        <Text
          style={[
            typography.buttonSmall,
            {
              color: active ? theme.textInverse : theme.textSecondary,
              fontFamily: fontFamily.semibold,
            },
          ]}
        >
          {label} ({count})
        </Text>
      </Pressable>
    );
  };

  if (userLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          {t("profile.loading")}
        </Text>
      </View>
    );
  }

  if (userError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{userError}</Text>
        <Button onPress={fetchUserProfile}>{t("common.retry")}</Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[typography.h2, { color: theme.textPrimary, fontFamily: fontFamily.extrabold }]}>
          {t("profile.title")}
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.surfaceMuted }]}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!user ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {t("profile.loading")}
            </Text>
          </View>
        ) : (
          <>
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={animationConfig.enter}
              style={styles.heroSection}
            >
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handleAvatarChange} disabled={updatingAvatar}>
                  <Image
                    source={safeUri(user.avatar)}
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.surfaceMuted, borderColor: theme.surface },
                    ]}
                  />
                  {!user.avatar && (
                    <View style={styles.avatarPlaceholderContent}>
                      <Ionicons name="person" size={42} color={theme.textTertiary} />
                    </View>
                  )}
                  <View
                    style={[
                      styles.editAvatarButton,
                      { backgroundColor: theme.primary, borderColor: theme.surface },
                    ]}
                  >
                    <Ionicons name="camera" size={14} color={theme.textInverse} />
                  </View>
                </TouchableOpacity>
                {user.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                  </View>
                )}
                {updatingAvatar && (
                  <View style={styles.avatarLoading}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                )}
              </View>

              <Text
                style={[
                  typography.h2,
                  { color: theme.textPrimary, fontFamily: fontFamily.extrabold, marginTop: spacing.md },
                ]}
              >
                {user.name}
              </Text>
              <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: 2 }]}>
                {user.email}
              </Text>
              {user.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={theme.textTertiary} />
                  <Text style={[typography.caption, { color: theme.textTertiary }]}>
                    {user.location}
                  </Text>
                </View>
              )}

              {user.bio && (
                <Text
                  style={[
                    typography.body,
                    {
                      color: theme.textSecondary,
                      textAlign: "center",
                      marginTop: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                >
                  {user.bio}
                </Text>
              )}
            </MotiView>

            <View style={styles.statsRow}>
              <StatCard
                icon="star"
                value={user.rating ?? 0}
                label={t("profile.rating")}
                iconColor="#FFB84D"
              />
              <StatCard
                icon="chatbubble-ellipses"
                value={user.totalReviews ?? 0}
                label={t("profile.reviews")}
              />
              <StatCard
                icon="cube"
                value={user.totalSales ?? 0}
                label={t("profile.sales")}
              />
            </View>

            <View style={styles.editButtonRow}>
              <Button
                variant="secondary"
                fullWidth
                iconLeft="create-outline"
                onPress={() => router.push("/profile/edit")}
              >
                {t("profile.editProfile")}
              </Button>
            </View>

            <View style={styles.listingsBlock}>
              <Text
                style={[
                  typography.h3,
                  { color: theme.textPrimary, fontFamily: fontFamily.bold, paddingHorizontal: spacing.md },
                ]}
              >
                {t("profile.myListings")}
              </Text>

              <View style={styles.tabsRow}>
                {renderTab("listings", t("profile.active"), activeListings.length)}
                {renderTab("sold", t("profile.sold"), soldListings.length)}
                {renderTab("reviews", t("profile.reviews"), reviews.length)}
              </View>

              {activeTab === "reviews" ? (
                reviewsLoading ? (
                  <View style={styles.inlineLoading}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                      {t("profile.loadingReviews")}
                    </Text>
                  </View>
                ) : reviewsError ? (
                  <View style={styles.inlineError}>
                    <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
                    <Text style={[typography.body, { color: theme.textSecondary, marginVertical: spacing.sm }]}>
                      {reviewsError}
                    </Text>
                    <Button onPress={fetchUserReviews}>{t("common.retry")}</Button>
                  </View>
                ) : reviews.length > 0 ? (
                  <View style={styles.reviewsList}>
                    {reviews.map((review) => (
                      <Card
                        key={review.id}
                        elevation="flat"
                        padding="md"
                        style={{ marginBottom: spacing.sm }}
                      >
                        <View style={styles.reviewHeader}>
                          <Image
                            source={safeUri(review.reviewer?.avatar)}
                            style={styles.reviewerAvatar}
                          />
                          <View style={styles.reviewInfo}>
                            <Text
                              style={[
                                typography.bodySmall,
                                { color: theme.textPrimary, fontFamily: fontFamily.semibold },
                              ]}
                            >
                              {review.reviewer.name}
                            </Text>
                            <View style={styles.ratingContainer}>
                              {[...Array(5)].map((_, i) => (
                                <Ionicons
                                  key={i}
                                  name={i < review.rating ? "star" : "star-outline"}
                                  size={13}
                                  color="#FFB84D"
                                />
                              ))}
                            </View>
                          </View>
                          <Text style={[typography.caption, { color: theme.textTertiary }]}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text
                          style={[
                            typography.bodySmall,
                            { color: theme.textSecondary, marginTop: spacing.xs },
                          ]}
                        >
                          {review.comment}
                        </Text>
                        <TouchableOpacity
                          style={{ marginTop: spacing.xs }}
                          onPress={() => router.push(`/product/${review.product.id}`)}
                        >
                          <Text
                            style={[
                              typography.caption,
                              { color: theme.primary, fontFamily: fontFamily.semibold },
                            ]}
                          >
                            {t("profile.aboutProduct", { title: review.product.title })}
                          </Text>
                        </TouchableOpacity>
                      </Card>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubble-outline" size={56} color={theme.textTertiary} />
                    <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                      {t("profile.noReviews")}
                    </Text>
                    <Text style={[typography.caption, { color: theme.textTertiary, marginTop: 4 }]}>
                      {t("profile.reviewsWillAppear")}
                    </Text>
                  </View>
                )
              ) : listingsLoading ? (
                <View style={styles.inlineLoading}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[typography.bodySmall, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                    {t("profile.loadingListings")}
                  </Text>
                </View>
              ) : listingsError ? (
                <View style={styles.inlineError}>
                  <Ionicons name="cloud-offline-outline" size={48} color={theme.textTertiary} />
                  <Text style={[typography.body, { color: theme.textSecondary, marginVertical: spacing.sm }]}>
                    {listingsError}
                  </Text>
                  <Button onPress={fetchUserListings}>{t("common.retry")}</Button>
                </View>
              ) : (
                <View style={styles.listingsList}>
                  {(activeTab === "listings" ? activeListings : soldListings).map(renderListingCard)}
                </View>
              )}

              {!listingsLoading &&
                !listingsError &&
                activeTab !== "reviews" &&
                ((activeTab === "listings" && activeListings.length === 0) ||
                  (activeTab === "sold" && soldListings.length === 0)) && (
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={56} color={theme.textTertiary} />
                    <Text
                      style={[
                        typography.body,
                        { color: theme.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md },
                      ]}
                    >
                      {activeTab === "listings"
                        ? t("profile.noActiveListings")
                        : t("profile.noSoldItems")}
                    </Text>
                    {activeTab === "listings" && (
                      <Button
                        iconLeft="add-circle"
                        size="lg"
                        onPress={() => router.push("/(tabs)/create")}
                      >
                        {t("profile.createListing")}
                      </Button>
                    )}
                  </View>
                )}
            </View>

            <Divider />

            <View style={styles.menuSection}>
              <MenuItem
                icon="receipt-outline"
                iconColor={theme.primary}
                label={t("orders.myOrders")}
                onPress={() => router.push("/orders")}
              />
              <MenuItem
                icon="heart-outline"
                iconColor={theme.accent}
                label={t("profile.favorites")}
                onPress={() => router.push("/favorites")}
              />
              <MenuItem
                icon="settings-outline"
                iconColor={theme.textSecondary}
                label={t("profile.settings")}
                onPress={() => router.push("/settings")}
              />
              <MenuItem
                icon="help-circle-outline"
                iconColor={theme.textSecondary}
                label={t("profile.helpSupport")}
                onPress={() => router.push("/help")}
              />
            </View>

            <View style={styles.logoutSection}>
              <MenuItem
                icon="log-out-outline"
                label={t("profile.logout")}
                variant="danger"
                showChevron={false}
                onPress={handleLogout}
              />
            </View>

            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1 },
  heroSection: {
    alignItems: "center",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatarContainer: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  avatarPlaceholderContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    borderRadius: 12,
  },
  avatarLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 48,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  editButtonRow: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  listingsBlock: {
    marginTop: spacing.xl,
  },
  tabsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  listingsList: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  listingCard: {
    flexDirection: "row",
    position: "relative",
    gap: spacing.sm,
  },
  listingImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  listingInfo: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 40,
  },
  listingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  soldBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  soldText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  editButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reviewsList: {
    paddingHorizontal: spacing.md,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewInfo: { flex: 1 },
  ratingContainer: {
    flexDirection: "row",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  inlineLoading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  inlineError: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  menuSection: {
    marginTop: spacing.sm,
  },
  logoutSection: {
    marginTop: spacing.md,
  },
  bottomSpacing: { height: 60 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    fontSize: 15,
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
  },
});
