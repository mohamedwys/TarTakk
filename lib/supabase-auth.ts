import { supabase } from "./supabase";

// Drop-in replacement for the four core authAPI functions, backed by Supabase.
// Same signatures as lib/api.ts so callers (login/register/forgot-password
// screens, AuthContext) keep working unchanged.

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
      // Don't fail the whole signup — the auth user exists; the profile can
      // be repaired later. Surface it so it's visible in logs.
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
