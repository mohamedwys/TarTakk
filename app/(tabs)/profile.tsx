import AnimatedButton from "@/components/AnimatedButton";
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
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function ProfileScreen() {
  const router = useRouter();
  const { config } = useEnv();
  const theme = config.theme;
  const [activeTab, setActiveTab] = useState<"listings" | "sold" | "reviews">(
    "listings"
  );

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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    // Name kept for backwards compatibility; uploads now go to the
    // Supabase Storage `avatars` bucket. RLS limits writes to the
    // current authenticated user.
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
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("authToken");
            router.replace("/(auth)/login");
          } catch (error) {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Failed to logout. Please try again.",
            });
          }
        },
      },
    ]);
  };

  const renderListingCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.listingCard, { backgroundColor: theme.surface }]}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Image
        source={safeUri(item.images?.[0])}
        style={[styles.listingImage, { backgroundColor: theme.border }]}
      />
      <View style={styles.listingInfo}>
        <Text style={[styles.listingTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.listingPrice, { color: theme.textPrimary }]}>₦{item.price.toLocaleString()}</Text>
        <View style={styles.listingMeta}>
          <Ionicons name="eye-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.listingViews, { color: theme.textSecondary }]}>{item.views || 0} views</Text>
        </View>
      </View>
      {item.status === "sold" && (
        <View style={[styles.soldBadge, { backgroundColor: theme.accent }]}>
          <Text style={[styles.soldText, { color: theme.textInverse }]}>SOLD</Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.surface }]}
        onPress={() => router.push(`/product/edit/${item.id}`)}
      >
        <Ionicons name="pencil" size={16} color={theme.textPrimary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (userLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading profile...</Text>
      </View>
    );
  }

  if (userError) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{userError}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.primary }]} onPress={fetchUserProfile}>
          <Text style={[styles.retryText, { color: theme.textInverse }]}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Profile</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.background }]}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        {!user ? (
          <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity
                  onPress={handleAvatarChange}
                  disabled={updatingAvatar}
                >
                  <Image
                    source={safeUri(user.avatar)}
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.background },
                      !user.avatar && styles.avatarPlaceholder,
                    ]}
                  />
                  {!user.avatar && (
                    <View style={styles.avatarPlaceholderContent}>
                      <Ionicons name="person" size={40} color={theme.textSecondary} />
                    </View>
                  )}
                  <View style={[styles.editAvatarButton, { backgroundColor: theme.primary, borderColor: theme.surface }]}>
                    <Ionicons name="camera" size={16} color={theme.textInverse} />
                  </View>
                </TouchableOpacity>
                {user.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: theme.surface }]}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                )}
                {updatingAvatar && (
                  <View style={styles.avatarLoading}>
                    <Ionicons name="refresh" size={24} color={theme.primary} />
                  </View>
                )}
              </View>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{user.name}</Text>
              <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>

              {user.bio && <Text style={[styles.userBio, { color: theme.textSecondary }]}>{user.bio}</Text>}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{user.rating || 0}</Text>
                  <View style={styles.statLabelRow}>
                    <Ionicons name="star" size={14} color="#FFB84D" />
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</Text>
                  </View>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{user.totalReviews || 0}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reviews</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{user.totalSales || 0}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Sales</Text>
                </View>
              </View>

              <AnimatedButton
                title="Edit Profile"
                icon="create-outline"
                variant="secondary"
                onPress={() => router.push("/profile/edit")}
              />
            </View>

            {/* Quick Info */}
            <View style={[styles.infoSection, { backgroundColor: theme.surface }]}>
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: theme.background }]}>
                  <Ionicons name="location-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Location</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                    {user.location || "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: theme.background }]}>
                  <Ionicons name="call-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                    {user.phoneNumber || "Not set"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: theme.background }]}>
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Member Since</Text>
                  <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "Unknown"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.listingsSection, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>My Listings</Text>

              {/* Tabs */}
              <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "listings" && { borderBottomWidth: 2, borderBottomColor: theme.primary },
                  ]}
                  onPress={() => setActiveTab("listings")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.textSecondary },
                      activeTab === "listings" && { color: theme.primary },
                    ]}
                  >
                    Active ({activeListings.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "sold" && { borderBottomWidth: 2, borderBottomColor: theme.primary },
                  ]}
                  onPress={() => setActiveTab("sold")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.textSecondary },
                      activeTab === "sold" && { color: theme.primary },
                    ]}
                  >
                    Sold ({soldListings.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "reviews" && { borderBottomWidth: 2, borderBottomColor: theme.primary },
                  ]}
                  onPress={() => setActiveTab("reviews")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: theme.textSecondary },
                      activeTab === "reviews" && { color: theme.primary },
                    ]}
                  >
                    Reviews ({reviews.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Listings Grid */}
              {activeTab === "reviews" ? (
                reviewsLoading ? (
                  <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading reviews...</Text>
                  </View>
                ) : reviewsError ? (
                  <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                    <Ionicons
                      name="cloud-offline-outline"
                      size={48}
                      color={theme.textSecondary}
                    />
                    <Text style={[styles.errorText, { color: theme.textSecondary }]}>{reviewsError}</Text>
                    <TouchableOpacity
                      style={[styles.retryButton, { backgroundColor: theme.primary }]}
                      onPress={fetchUserReviews}
                    >
                      <Text style={[styles.retryText, { color: theme.textInverse }]}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : reviews.length > 0 ? (
                  <View style={styles.reviewsList}>
                    {reviews.map((review) => (
                      <View key={review.id} style={[styles.reviewCard, { backgroundColor: theme.background }]}>
                        <View style={styles.reviewHeader}>
                          <Image
                            source={safeUri(review.reviewer?.avatar)}
                            style={styles.reviewerAvatar}
                          />
                          <View style={styles.reviewInfo}>
                            <Text style={[styles.reviewerName, { color: theme.textPrimary }]}>
                              {review.reviewer.name}
                            </Text>
                            <View style={styles.ratingContainer}>
                              {[...Array(5)].map((_, i) => (
                                <Ionicons
                                  key={i}
                                  name={
                                    i < review.rating ? "star" : "star-outline"
                                  }
                                  size={14}
                                  color="#FFD700"
                                />
                              ))}
                            </View>
                          </View>
                          <Text style={[styles.reviewDate, { color: theme.textSecondary }]}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>
                          {review.comment}
                        </Text>
                        <TouchableOpacity
                          style={styles.productLink}
                          onPress={() =>
                            router.push(`/product/${review.product.id}`)
                          }
                        >
                          <Text style={[styles.productLinkText, { color: theme.primary }]}>
                            About: {review.product.title}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={64}
                      color={theme.textSecondary}
                    />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No reviews yet</Text>
                    <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                      Reviews from buyers will appear here
                    </Text>
                  </View>
                )
              ) : listingsLoading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading listings...</Text>
                </View>
              ) : listingsError ? (
                <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.errorText, { color: theme.textSecondary }]}>{listingsError}</Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.primary }]}
                    onPress={fetchUserListings}
                  >
                    <Text style={[styles.retryText, { color: theme.textInverse }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listingsGrid}>
                  {activeTab === "listings"
                    ? activeListings.map(renderListingCard)
                    : soldListings.map(renderListingCard)}
                </View>
              )}

              {!listingsLoading &&
                !listingsError &&
                activeTab !== "reviews" &&
                ((activeTab === "listings" && activeListings.length === 0) ||
                  (activeTab === "sold" && soldListings.length === 0)) && (
                  <View style={styles.emptyState}>
                    <Ionicons name="cube-outline" size={64} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {activeTab === "listings"
                        ? "No active listings yet"
                        : "No sold items yet"}
                    </Text>
                    {activeTab === "listings" && (
                      <AnimatedButton
                        title="Create Listing"
                        icon="add-circle"
                        onPress={() => router.push("/(tabs)/create")}
                        size="large"
                      />
                    )}
                  </View>
                )}
            </View>

            {/* Actions Section */}
            <View style={[styles.actionsSection, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push("/favorites")}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="heart-outline" size={24} color={theme.accent} />
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>Favorites</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push("/settings")}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="settings-outline" size={24} color={theme.textSecondary} />
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push("/help")}
              >
                <View style={styles.actionLeft}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.actionText, { color: theme.textPrimary }]}>Help & Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionItem}
                onPress={handleLogout}
              >
                <View style={styles.actionLeft}>
                  <Ionicons name="log-out-outline" size={24} color={theme.error} />
                  <Text style={[styles.actionText, { color: theme.error }]}>
                    Logout
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 12,
  },
  userBio: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  infoSection: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "600",
  },
  listingsSection: {
    paddingTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  listingsGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listingCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: "relative",
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listingInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  listingTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  listingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listingViews: {
    fontSize: 13,
  },
  soldBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldText: {
    fontSize: 11,
    fontWeight: "700",
  },
  editButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  actionsSection: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  avatarPlaceholder: {},
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
  },
  avatarLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  reviewsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  productLink: {
    alignSelf: "flex-start",
  },
  productLinkText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});
