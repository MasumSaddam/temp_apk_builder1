import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'bracprint_access_token';
const REFRESH_TOKEN_KEY = 'bracprint_refresh_token';
const USER_KEY = 'bracprint_user';

/**
 * Thin wrapper around expo-secure-store. Tokens never touch AsyncStorage
 * (which is unencrypted on-disk) - SecureStore backs onto the Android
 * Keystore / iOS Keychain.
 */
export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async setUser(user: unknown): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },
  async clearUser(): Promise<void> {
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
