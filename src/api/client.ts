import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Set this in app.json -> expo.extra.apiBaseUrl, or override here for local dev.
// Example: 'https://attendance.yourcompany.com' or 'http://192.168.1.50:8000' (LAN IP for a physical phone).
const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) || 'http://localhost:8000';

const TOKEN_KEY = 'attendance_auth_token';

export const tokenStorage = {
  async get(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Every request automatically carries the mobile auth token, exactly the way
// the website's app.js automatically attaches the CSRF token to every call.
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Token ${token}`;
  }
  return config;
});

// Normalizes Django's {"error": "..."} responses into a plain Error, same
// shape the website's app.js expects from its api() helper.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Something went wrong. Please check your connection and try again.';
    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
