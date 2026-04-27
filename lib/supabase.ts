import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE ENV VARS MISSING");
}

// SecureStore values are capped at ~2 KiB, but Supabase sessions exceed that.
// Adapter splits long values across multiple SecureStore entries.
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const meta = await SecureStore.getItemAsync(key);
    if (!meta) return null;
    if (!meta.startsWith("__chunked__:")) return meta;

    const count = parseInt(meta.split(":")[1], 10);
    const parts: string[] = [];
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(`${key}::${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, `__chunked__:${chunks.length}`);
    await Promise.all(
      chunks.map((chunk, idx) =>
        SecureStore.setItemAsync(`${key}::${idx}`, chunk)
      )
    );
  },
  removeItem: async (key: string): Promise<void> => {
    const meta = await SecureStore.getItemAsync(key);
    if (meta?.startsWith("__chunked__:")) {
      const count = parseInt(meta.split(":")[1], 10);
      await Promise.all(
        Array.from({ length: count }).map((_, i) =>
          SecureStore.deleteItemAsync(`${key}::${i}`)
        )
      );
    }
    await SecureStore.deleteItemAsync(key);
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
