import { authAPI, userAPI } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  emailVerified?: Date;
  avatar?: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  checkAuthState: () => Promise<void>;
  reloadAuth: () => Promise<void>; // ✅ ADD THIS
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const isAuthenticated = !!token && !!user;
  const isVerified = user?.emailVerified ? true : false;

  /**
   * Mirror a Supabase Session into local state. If a session exists we
   * fetch the full profile via userAPI.getProfile() so the rest of the
   * app reads the same legacy `_id`/`location`/`emailVerified` shape it
   * already expects. If the profile row hasn't been created yet, we fall
   * back to the fields available on `session.user` directly — no JWT
   * decoding needed.
   */
  const hydrateFromSession = async (session: Session | null) => {
    if (!session) {
      setToken(null);
      setUser(null);
      return;
    }

    setToken(session.access_token);

    try {
      const profileData = await userAPI.getProfile();
      const fullUser = profileData.user as User | null;
      if (fullUser && fullUser._id) {
        setUser(fullUser);
        return;
      }
    } catch (err) {
      console.error("🚨 Failed to load profile, using session.user:", err);
    }

    // Fallback: use the typed Supabase auth user. No atob, no manual decode.
    const authUser = session.user;
    setUser({
      _id: authUser.id,
      name:
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email ??
        "",
      email: authUser.email ?? "",
      emailVerified: authUser.email_confirmed_at
        ? new Date(authUser.email_confirmed_at)
        : undefined,
    });
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authAPI.login({ email, password });
      // Supabase auto-persists the session via the SecureStore adapter
      // configured in lib/supabase.ts — nothing to write to AsyncStorage.
      const profileData = await userAPI.getProfile();
      const fullUser = profileData.user as User;
      setUser(fullUser);
      setToken(data.token);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    // supabase.auth.signOut() (wrapped by authAPI.logout) clears the
    // persisted session; the onAuthStateChange listener below also sees
    // SIGNED_OUT and resets state. No AsyncStorage cleanup needed.
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("🚨 Sign-out failed:", err);
    }
    hasCheckedAuth.current = false;
    router.replace("/(auth)/login");
  };

  const updateUser = async (updatedUser: User) => {
    setUser(updatedUser);
    // userAPI.getProfile() is the source of truth — no local mirror.
  };

  const checkAuthState = async () => {
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("🚨 getSession failed:", error.message);
        return;
      }

      if (!data.session) {
        console.log("❌ No active Supabase session");
        return;
      }

      await hydrateFromSession(data.session);
    } catch (error) {
      console.error("🚨 Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const reloadAuth = async () => {
    hasCheckedAuth.current = false;
    setIsLoading(true);

    // Use session.user directly — no manual JWT decode anymore.
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ getSession failed:", error.message);
    } else if (data.session) {
      console.log("📋 Session user:", {
        userId: data.session.user.id,
        email: data.session.user.email,
        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null,
      });
    }

    await checkAuthState();
  };

  useEffect(() => {
    void checkAuthState();

    // React to sign-in / token-refresh / sign-out events from anywhere in
    // the app (e.g. login.tsx still calls authAPI.login directly). The
    // listener owns the post-bootstrap state transitions so AuthContext
    // stays in sync without any AsyncStorage poll loop.
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 onAuthStateChange:", event);

        if (event === "SIGNED_OUT") {
          setToken(null);
          setUser(null);
          return;
        }

        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
        await hydrateFromSession(session);
      }
    );

    return () => {
      authSubscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    isVerified,
    login,
    logout,
    updateUser,
    checkAuthState,
    reloadAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
