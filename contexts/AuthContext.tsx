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
  accountType: "B2B" | "B2C" | "C2C" | null;
  companyName: string | null;
  isVerified: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const isAuthenticated = !!token && !!user;
  // Source of truth for "is this account verified" is the Supabase
  // session — confirmed accounts have email_confirmed_at set on the
  // auth user. No OTP/code state involved.
  const isVerified = !!session?.user?.email_confirmed_at;

  /**
   * Build a baseline User from the Supabase auth user. Avatar / phone /
   * bio are unknown at this point — the full profile fills those in.
   */
  const userFromAuth = (authUser: Session["user"]): User => ({
    _id: authUser.id,
    name:
      (authUser.user_metadata?.name as string | undefined) ??
      authUser.email ??
      "",
    email: authUser.email ?? "",
    emailVerified: authUser.email_confirmed_at
      ? new Date(authUser.email_confirmed_at)
      : undefined,
    accountType: null,
    companyName: null,
    isVerified: !!authUser.email_confirmed_at,
  });

  /**
   * Fetch the full profile and replace the baseline user with it. Runs
   * fire-and-forget so a slow or failing /profiles request never blocks
   * the loading state. If it fails the baseline user from `session.user`
   * is what stays in state — the user is still effectively logged in.
   */
  const enrichUserFromProfile = async () => {
    try {
      const profileData = await userAPI.getProfile();
      const fullUser = profileData.user as User | null;
      if (fullUser && fullUser._id) {
        setUser(fullUser);
      }
    } catch (err) {
      console.error("🚨 Failed to enrich profile, keeping session.user:", err);
    }
  };

  /**
   * Mirror a Supabase Session into local state. We populate user/token
   * synchronously from session.user so the UI can render right away,
   * then trigger profile enrichment in the background. Returning quickly
   * means a stalled `getProfile()` call never holds isLoading=true.
   */
  const hydrateFromSession = (session: Session | null) => {
    setSession(session);
    if (!session) {
      setToken(null);
      setUser(null);
      return;
    }

    setToken(session.access_token);

    // Replace the baseline user only if it's a different user (or
    // there isn't one yet). Avoids overwriting an enriched profile
    // when a token-refresh event comes through later.
    setUser((prev) =>
      prev && prev._id === session.user.id ? prev : userFromAuth(session.user)
    );

    void enrichUserFromProfile();
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authAPI.login({ email, password });
      // Supabase auto-persists the session via the SecureStore adapter
      // configured in lib/supabase.ts — nothing to write to AsyncStorage.
      // Hydrate from the freshly-returned session synchronously and let
      // the profile fetch happen in the background.
      hydrateFromSession(data.session);
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
    // ⚡ Skip on SSR (no window/localStorage)
    if (typeof window === 'undefined') {
      return;
    }
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

      hydrateFromSession(data.session);
    } catch (error) {
      console.error("🚨 Auth check failed:", error);
    } finally {
      // Always release the loader, even if the early-return branches
      // skipped the await above. This guarantees the login screen
      // becomes reachable as soon as we know the session state.
      setIsLoading(false);
    }
  };

  const reloadAuth = async () => {
    // ⚡ Skip on SSR (no window/localStorage)
    if (typeof window === 'undefined') {
      return;
    }
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
    // ⚡ Skip on SSR (no window/localStorage — Supabase session lives in SecureStore)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    void checkAuthState();

    // React to sign-in / token-refresh / sign-out events from anywhere in
    // the app (e.g. login.tsx still calls authAPI.login directly). The
    // listener owns the post-bootstrap state transitions so AuthContext
    // stays in sync without any AsyncStorage poll loop.
    const { data: authSubscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 onAuthStateChange:", event);

        if (event === "SIGNED_OUT") {
          setSession(null);
          setToken(null);
          setUser(null);
          return;
        }

        // SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION
        hydrateFromSession(session);
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
