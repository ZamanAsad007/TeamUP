import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'teamup_server_api_url';

export function getDefaultApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5001/api/v1';
    }
  }
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
}

export const DEFAULT_API_URL = getDefaultApiUrl();

// In-memory fallback
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
    await SecureStore.setItemAsync(key, value);
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
    return await SecureStore.getItemAsync(key);
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
    await SecureStore.deleteItemAsync(key);
  }
}

let cachedUrl: string = DEFAULT_API_URL;
let initialized = false;
const listeners = new Set<(url: string) => void>();

function notifyListeners(url: string) {
  listeners.forEach((listener) => {
    try {
      listener(url);
    } catch (err) {
      console.warn('Error in apiConfig listener:', err);
    }
  });
}

export function sanitizeApiUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  
  if (!cleaned) {
    return getDefaultApiUrl();
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  // Auto-append /api/v1 if not present
  if (!cleaned.endsWith('/api/v1')) {
    cleaned = `${cleaned}/api/v1`;
  }

  return cleaned;
}

export const apiConfig = {
  getApiUrl(): string {
    return cachedUrl;
  },

  async init(): Promise<string> {
    if (initialized) {
      return cachedUrl;
    }
    try {
      const stored = await getItem(STORAGE_KEY);
      if (stored) {
        // If on web localhost, and stored URL points to a stale LAN IP, fallback to localhost
        if (
          Platform.OS === 'web' &&
          typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          (/^http:\/\/192\.168\./i.test(stored) || /^http:\/\/10\./i.test(stored))
        ) {
          cachedUrl = 'http://localhost:5001/api/v1';
        } else {
          cachedUrl = sanitizeApiUrl(stored);
        }
      } else {
        cachedUrl = getDefaultApiUrl();
      }
    } catch {
      cachedUrl = getDefaultApiUrl();
    }
    initialized = true;
    return cachedUrl;
  },

  async setApiUrl(newUrl: string): Promise<string> {
    const sanitized = sanitizeApiUrl(newUrl);
    await setItem(STORAGE_KEY, sanitized);
    cachedUrl = sanitized;
    notifyListeners(sanitized);
    return sanitized;
  },

  async resetApiUrl(): Promise<string> {
    await deleteItem(STORAGE_KEY);
    const defUrl = getDefaultApiUrl();
    cachedUrl = defUrl;
    notifyListeners(defUrl);
    return defUrl;
  },

  subscribe(listener: (url: string) => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async testConnection(targetUrl?: string): Promise<{ success: boolean; message: string; latencyMs?: number }> {
    const url = sanitizeApiUrl(targetUrl || cachedUrl);
    const healthUrl = `${url}/health`;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true', // Needed for free ngrok tunnel preview page
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          message: `Connected successfully (${latencyMs}ms)`,
          latencyMs,
        };
      }

      return {
        success: false,
        message: `Server returned HTTP ${response.status}: ${response.statusText}`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: 'Connection timed out after 6 seconds. Check if tunnel is running.',
          latencyMs,
        };
      }
      return {
        success: false,
        message: err.message || 'Network request failed. Ensure PC server & tunnel are active.',
        latencyMs,
      };
    }
  },
};

// Automatically initiate initialization in the background
void apiConfig.init();
