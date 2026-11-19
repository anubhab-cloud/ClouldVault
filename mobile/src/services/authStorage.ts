import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'cv_access_token';
const REFRESH_TOKEN_KEY = 'cv_refresh_token';
const USER_KEY = 'cv_user_data';

// Web fallback memory cache when SecureStore is unavailable
const memoryStorage: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    memoryStorage[key] = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore web storage quota or private mode issues
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return memoryStorage[key] || (typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
  }
  return await SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    delete memoryStorage[key];
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const authStorage = {
  getAccessToken: () => getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (token: string) => setItem(ACCESS_TOKEN_KEY, token),
  clearAccessToken: () => deleteItem(ACCESS_TOKEN_KEY),

  getRefreshToken: () => getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => setItem(REFRESH_TOKEN_KEY, token),
  clearRefreshToken: () => deleteItem(REFRESH_TOKEN_KEY),

  getUser: async () => {
    const data = await getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setUser: (user: unknown) => setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => deleteItem(USER_KEY),

  clearAll: async () => {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
      deleteItem(USER_KEY),
    ]);
  },
};
