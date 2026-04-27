import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

// const API_CONFIG = {
//   BASE_URL: "http://localhost:3000",
//   TIMEOUT: 10000,
// };

const API_CONFIG = {
  BASE_URL: "https://marketplace-backend-blush.vercel.app/",
  TIMEOUT: 10000,
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    VERIFY_EMAIL: "/api/auth/verify-email",
    RESEND_VERIFICATION: "/api/auth/resend-verification",
    COMPLETE_PROFILE: "/api/auth/complete-profile",
  },

  NOTIFICATIONS: "/api/notifications",
  NOTIFICATIONS_MARK_ALL_READ: "/api/notifications/mark-all-read",
  NOTIFICATIONS_CLEAR_ALL: "/api/notifications/clear-all",
  // Users
  USERS: {
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
    UPLOAD_AVATAR: "/api/users/avatar",
  },

  // Products
  PRODUCTS: {
    LIST: "/api/products",
    CREATE: "/api/products",
    DETAIL: (id: string) => `/api/products/${id}`,
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    SEARCH: "/api/products/search",
    CATEGORIES: "/api/products/categories",
  },
  PRODUCTS_MY_LISTINGS: "/api/products/my-listings",
  CONVERSATIONS: {
    LIST: "/api/conversations",
    DETAIL: (id: string) => `/api/conversations/${id}`,
    MESSAGES: (id: string) => `/api/conversations/${id}/messages`,
    CREATE: "/api/conversations",
    MARK_READ: (id: string) => `/api/conversations/${id}/read`,
  },
} as const;

export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const getHeaders = (
  includeAuth: boolean = false,
  token?: string | null
) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (includeAuth && token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = await AsyncStorage.getItem("token");

  // ✅ UNCOMMENT ALL THESE
  // console.log("🔍 API Request:", {
  //   endpoint,
  //   hasToken: !!token,
  //   tokenPreview: token ? `${token.substring(0, 20)}...` : "no token",
  // });

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
  const url = buildUrl(endpoint);

  // console.log("🔗 Request URL:", url);
  // console.log("📋 Request Headers:", headers);

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // console.log("📤 Making request to:", url);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // console.log("📡 Response Status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ API Error:", errorData);
      console.error("❌ Response headers:", response.headers);
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    // console.log("✅ API Success:", endpoint);
    return data;
  } catch (error) {
    console.error("🚨 API Request Failed:", {
      endpoint,
      url,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
    throw new Error("Network error");
  }
};

// Supabase-backed auth. Source of truth: lib/supabase-auth.ts.
// Same exported name and same per-method signatures as the legacy REST
// authAPI so login/register/forgot-password screens and AuthContext keep
// working without other code changes.
export const authAPI = {
  /**
   * Register a new user.
   *
   * Mirrors the legacy REST shape: `{ user }`. When email confirmation is
   * enabled (Supabase default) `session` is null until the user clicks the
   * verification link, so callers should treat the user as unauthenticated
   * and route to the verify-email screen — same flow as before.
   */
  register: async (data: { name: string; email: string; password: string }) => {
    console.log("🔐 supabase.auth.signUp", data.email);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        // Stored in raw_user_meta_data; the handle_new_user trigger reads
        // this when it auto-creates the profile row on signup.
        data: { name: data.name },
      },
    });

    if (error) {
      console.error("❌ signUp failed:", error.message);
      throw new Error(error.message);
    }

    const user = signUpData.user;
    if (!user) {
      throw new Error("Sign up failed: no user returned");
    }

    // Belt-and-suspenders: the trigger in 004_functions.sql normally creates
    // the profile, but if it isn't installed (or the user existed already)
    // upsert keeps the row in sync with the name supplied here.
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          name: data.name,
          email: data.email,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("⚠️ profile upsert failed:", profileError.message);
    }

    return {
      user,
      token: signUpData.session?.access_token ?? null,
      session: signUpData.session,
    };
  },

  /**
   * Log in with email + password.
   *
   * Returns `{ user, token }` to match the legacy REST response so existing
   * callers (login.tsx, AuthContext) keep working without changes.
   */
  login: async (data: { email: string; password: string }) => {
    console.log("🔐 supabase.auth.signInWithPassword", data.email);

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error("❌ signIn failed:", error.message);
      throw new Error(error.message);
    }

    if (!signInData.session || !signInData.user) {
      throw new Error("Login failed: missing session");
    }

    return {
      user: signInData.user,
      token: signInData.session.access_token,
      session: signInData.session,
    };
  },

  /**
   * Sign the current user out and clear the persisted session.
   */
  logout: async () => {
    console.log("🔐 supabase.auth.signOut");

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ signOut failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },

  /**
   * Email a password-reset link. The link opens the app at
   * `tartakk://reset-password` where the reset-password screen finishes the
   * flow with `supabase.auth.updateUser({ password })`.
   */
  forgotPassword: async (data: { email: string }) => {
    console.log("🔐 supabase.auth.resetPasswordForEmail", data.email);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: "tartakk://reset-password",
    });

    if (error) {
      console.error("❌ resetPasswordForEmail failed:", error.message);
      throw new Error(error.message);
    }

    return { success: true };
  },
};

export const notificationsAPI = {
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    filter?: "all" | "unread";
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.filter) query.append("filter", params.filter);

    return apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}?${query}`);
  },

  createNotification: (data: {
    type: string;
    title: string;
    message: string;
    recipientId: string;
    avatar?: string;
    productImage?: string;
    actionId?: string;
    relatedUserId?: string;
    relatedProductId?: string;
  }) =>
    apiRequest(API_ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  markAllAsRead: () =>
    apiRequest(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ, {
      method: "PUT",
    }),

  clearAll: () =>
    apiRequest(API_ENDPOINTS.NOTIFICATIONS_CLEAR_ALL, {
      method: "DELETE",
    }),
  
  // ❌ WRONG - Using string literal instead of variable
  // markAsRead: (id: string) =>
  //   apiRequest(`API_ENDPOINTS.NOTIFICATIONS/${id}/read`, {
  //     method: "PUT",
  //   }),

  // ✅ CORRECT - Use template literal properly
  markAsRead: (id: string) =>
    apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}/${id}/read`, {
      method: "PUT",
    }),

  // ❌ WRONG
  // deleteNotification: (id: string) =>
  //   apiRequest(`API_ENDPOINTS.NOTIFICATIONS/${id}`, {
  //     method: "DELETE",
  //   }),

  // ✅ CORRECT
  deleteNotification: (id: string) =>
    apiRequest(`${API_ENDPOINTS.NOTIFICATIONS}/${id}`, {
      method: "DELETE",
    }),
    
  getUnreadCount: () => apiRequest("/api/notifications/unread-count"),
};


export const productsAPI = {
  getProducts: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : "";
    return apiRequest(`${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}`);
  },

  getProduct: (id: string) => apiRequest(API_ENDPOINTS.PRODUCTS.DETAIL(id)),

  createProduct: (data: any) =>
    apiRequest(API_ENDPOINTS.PRODUCTS.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProductById: (id: string) => apiRequest(`/api/products/${id}`),

  updateProduct: (id: string, data: any) =>
    apiRequest(API_ENDPOINTS.PRODUCTS.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    apiRequest(API_ENDPOINTS.PRODUCTS.DELETE(id), {
      method: "DELETE",
    }),

  getMyListings: (params?: any) => {
    const queryString = params ? new URLSearchParams(params).toString() : "";
    return apiRequest(`${API_ENDPOINTS.PRODUCTS_MY_LISTINGS}?${queryString}`);
  },
  getListingsByUser: (userId: string) =>
    apiRequest(`/api/products?userId=${userId}`),
  getProductsByCategory: (category: string, excludeId?: string) =>
    apiRequest(
      `/api/products?category=${encodeURIComponent(category)}${
        excludeId ? `&excludeId=${excludeId}` : ""
      }`
    ),
};

export const userAPI = {
  getProfile: () => apiRequest("/api/users/profile"),
  getUserProfile: (id: string) => apiRequest(`/api/users/${id}`),
  updateProfile: (data: any) =>
    apiRequest(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// lib/api.ts
export const reviewsAPI = {
  getReviews: (sellerId: string) => apiRequest(`/api/reviews?sellerId=${sellerId}`),
  
  getReviewsByUser: (userId: string) => apiRequest(`/api/reviews?userId=${userId}`),
  
  getProductReviews: (productId: string) => apiRequest(`/api/reviews?productId=${productId}`),
  
  createReview: (reviewData: {
    sellerId: string; 
    rating: number;
    comment: string;
    orderId?: string;
  }) =>
    apiRequest("/api/reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    }),
  
  createProductReview: (reviewData: {
    productId: string;
    rating: number;
    comment: string;
    orderId?: string;
  }) =>
    apiRequest("/api/product-reviews", {
      method: "POST",
      body: JSON.stringify(reviewData),
    }),
  
  deleteReview: (reviewId: string) =>
    apiRequest(`/api/reviews/${reviewId}`, {
      method: "DELETE",
    }),
};

export const favoritesAPI = {
  getFavorites: () => apiRequest("/api/favorites"),
  addFavorite: (productId: string) =>
    apiRequest("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ productId }),
    }),
  removeFavorite: (productId: string) =>
    apiRequest(`/api/favorites?productId=${productId}`, {
      method: "DELETE",
    }),
};

export const contactAPI = {
  submitContact: (subject: string, message: string) =>
    apiRequest("/api/contact", {
      method: "POST",
      body: JSON.stringify({ subject, message }),
    }),
};

export const conversationsAPI = {
  getConversations: () => apiRequest(API_ENDPOINTS.CONVERSATIONS.LIST),
  
  getConversation: (id: string) => 
    apiRequest(API_ENDPOINTS.CONVERSATIONS.DETAIL(id)),
  
  getMessages: (id: string) => 
    apiRequest(API_ENDPOINTS.CONVERSATIONS.MESSAGES(id)),
  
  createConversation: (data: { productId: string; sellerId: string }) =>
    apiRequest(API_ENDPOINTS.CONVERSATIONS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  markAsRead: (conversationId: string) =>
    apiRequest(API_ENDPOINTS.CONVERSATIONS.MARK_READ(conversationId), {
      method: 'POST',
    }),
};

export const messagesAPI = {
  sendMessage: (data: { conversationId: string; content: string }) =>
    apiRequest(`/api/conversations/${data.conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: data.content }),
    }),
};