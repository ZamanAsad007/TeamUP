import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'teamup_access_token';
const REFRESH_TOKEN_KEY = 'teamup_refresh_token';

// In-memory fallback for environments without SecureStore/localStorage
const memoryStore: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStore[key] = value;
      }
    } catch {
      memoryStore[key] = value;
    }
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Ignore SecureStore error and rely on memoryStore
    }
    memoryStore[key] = value;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore[key] || null;
    } catch {
      return memoryStore[key] || null;
    }
  } else {
    try {
      const res = await SecureStore.getItemAsync(key);
      if (res !== null && res !== undefined) {
        return res;
      }
    } catch {
      // Ignore SecureStore error and fallback
    }
    return memoryStore[key] || null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      delete memoryStore[key];
    } catch {
      delete memoryStore[key];
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Key may not exist or secure store unavailable, suppress error
    }
    delete memoryStore[key];
  }
}

export const tokenStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => setItem(ACCESS_TOKEN_KEY, token),
  removeAccessToken: () => deleteItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => setItem(REFRESH_TOKEN_KEY, token),
  removeRefreshToken: () => deleteItem(REFRESH_TOKEN_KEY),

  clearAll: async () => {
    try {
      await deleteItem(ACCESS_TOKEN_KEY);
    } catch {
      // Ignore
    }
    try {
      await deleteItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore
    }
    for (const key of Object.keys(memoryStore)) {
      delete memoryStore[key];
    }
  },
};
