import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE ENV VARS MISSING");
}

// SecureStore on iOS / Android caps each value at ~2 KiB and only accepts
// keys matching [A-Za-z0-9._-]. Supabase derives keys like
// `sb-<projectref>-auth-token` and stores session JSON that exceeds 2 KiB,
// so this adapter both sanitizes the key and chunks long values across
// multiple SecureStore entries.
//
// The chunk count is stored under `<key>${CHUNK_MARKER_SUFFIX}` (separate
// from `<key>` itself) so the main key only ever holds either the full
// JSON or nothing — never a marker string that could leak back to
// auth-js as a value.
const CHUNK_SIZE = 1800;
const CHUNK_MARKER_SUFFIX = "_n";

const sanitizeKey = (key: string): string =>
  key.replace(/[^a-zA-Z0-9._-]/g, "_");

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const k = sanitizeKey(key);
      const count = await SecureStore.getItemAsync(`${k}${CHUNK_MARKER_SUFFIX}`);
      if (count) {
        let value = "";
        for (let i = 0; i < parseInt(count); i++) {
          const chunk = await SecureStore.getItemAsync(`${k}_${i}`);
          if (chunk == null) return null;
          value += chunk;
        }
        return value;
      }

      const single = await SecureStore.getItemAsync(k);
      // Defensive: a previous build wrote the bare chunk count (e.g. "2")
      // straight into the main key. Returning that to auth-js triggers
      // "Cannot create property 'user' on string '2'". Treat any value
      // starting with a digit as a stale bad marker and drop it.
      if (single != null && /^\d/.test(single)) {
        return null;
      }
      return single;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const k = sanitizeKey(key);
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(k, value);
        await SecureStore.deleteItemAsync(`${k}${CHUNK_MARKER_SUFFIX}`);
      } else {
        const chunks = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < chunks; i++) {
          await SecureStore.setItemAsync(
            `${k}_${i}`,
            value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          );
        }
        await SecureStore.setItemAsync(
          `${k}${CHUNK_MARKER_SUFFIX}`,
          String(chunks)
        );
      }
    } catch (e) {
      console.error("SecureStore setItem failed:", e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const k = sanitizeKey(key);
      const count = await SecureStore.getItemAsync(`${k}${CHUNK_MARKER_SUFFIX}`);
      if (count) {
        for (let i = 0; i < parseInt(count); i++) {
          await SecureStore.deleteItemAsync(`${k}_${i}`);
        }
        await SecureStore.deleteItemAsync(`${k}${CHUNK_MARKER_SUFFIX}`);
      }
      await SecureStore.deleteItemAsync(k);
    } catch {
      // ignore
    }
  },
};

// On web, expo-secure-store is a silent no-op: setItemAsync drops the value
// and getItemAsync returns null, so the session never persists and any
// getSession() round-trip after login (route nav, page reload, refresh tick,
// storage.upload signing) sees no JWT — RLS then rejects every authenticated
// request. Let supabase-js fall back to its default web localStorage adapter
// there; keep the chunked SecureStore adapter only on native.
const authStorage = Platform.OS === "web" ? undefined : SecureStoreAdapter;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
