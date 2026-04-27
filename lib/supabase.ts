import { createClient } from "@supabase/supabase-js";
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
const CHUNK_SIZE = 1800;

const sanitizeKey = (key: string): string =>
  key.replace(/[^a-zA-Z0-9._-]/g, "_");

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const k = sanitizeKey(key);
      const count = await SecureStore.getItemAsync(`${k}_chunks`);
      if (count) {
        let value = "";
        for (let i = 0; i < parseInt(count); i++) {
          const chunk = await SecureStore.getItemAsync(`${k}_${i}`);
          if (chunk == null) return null;
          value += chunk;
        }
        return value;
      }
      return await SecureStore.getItemAsync(k);
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      const k = sanitizeKey(key);
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(k, value);
        await SecureStore.deleteItemAsync(`${k}_chunks`);
      } else {
        const chunks = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < chunks; i++) {
          await SecureStore.setItemAsync(
            `${k}_${i}`,
            value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
          );
        }
        await SecureStore.setItemAsync(`${k}_chunks`, String(chunks));
      }
    } catch (e) {
      console.error("SecureStore setItem failed:", e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const k = sanitizeKey(key);
      const count = await SecureStore.getItemAsync(`${k}_chunks`);
      if (count) {
        for (let i = 0; i < parseInt(count); i++) {
          await SecureStore.deleteItemAsync(`${k}_${i}`);
        }
        await SecureStore.deleteItemAsync(`${k}_chunks`);
      }
      await SecureStore.deleteItemAsync(k);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
