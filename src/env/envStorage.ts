import * as SecureStore from 'expo-secure-store';
import type { EnvId } from './envTypes';

const STORAGE_KEY = 'app.current_env.v1';

export async function loadStoredEnv(): Promise<EnvId | null> {
  try {
    const value = await SecureStore.getItemAsync(STORAGE_KEY);
    if (value === 'b2c_pro' || value === 'marketplace_c2c') {
      return value;
    }
    return null;
  } catch (err) {
    console.warn('[envStorage] loadStoredEnv failed:', err);
    return null;
  }
}

export async function saveStoredEnv(id: EnvId): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, id);
  } catch (err) {
    console.warn('[envStorage] saveStoredEnv failed:', err);
  }
}

export async function clearStoredEnv(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch (err) {
    console.warn('[envStorage] clearStoredEnv failed:', err);
  }
}
