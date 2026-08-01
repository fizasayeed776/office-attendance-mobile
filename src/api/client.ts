import axios, { type AxiosRequestHeaders } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Set this in app.json -> expo.extra.apiBaseUrl, or override here for local dev.
// Example: 'https://attendance.yourcompany.com' or 'http://192.168.1.50:8000' (LAN IP for a physical phone).
const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) || 'http://localhost:8000';

const TOKEN_KEY = 'attendance_auth_token';

console.log('[API] ===== API CLIENT INITIALIZATION =====');
console.log('[API] Constants.expoConfig:', JSON.stringify(Constants.expoConfig, null, 2));
console.log('[API] Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra, null, 2));
console.log('[API] API_BASE_URL configured as:', API_BASE_URL);
console.log('[API] Using hostname:', new URL(API_BASE_URL).hostname);
console.log('[API] Using protocol:', new URL(API_BASE_URL).protocol);
console.log('[API] Is HTTPS:', new URL(API_BASE_URL).protocol === 'https:');
console.log('[API] ===== END INITIALIZATION =====');

export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        console.log('[TOKEN] tokenStorage.get: Token retrieved (length=' + token.length + ')');
      } else {
        console.log('[TOKEN] tokenStorage.get: No token found');
      }
      return token;
    } catch (err) {
      console.error('[TOKEN] tokenStorage.get ERROR:', err);
      return null;
    }
  },
  async set(token: string): Promise<void> {
    try {
      console.log('[TOKEN] tokenStorage.set: Storing token (length=' + token.length + ')');
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      console.log('[TOKEN] tokenStorage.set: Token stored successfully');
    } catch (err) {
      console.error('[TOKEN] tokenStorage.set ERROR:', err);
      throw new Error('Failed to save authentication token. Please try again.');
    }
  },
  async clear(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      console.log('[TOKEN] tokenStorage.clear: Token cleared');
    } catch (err) {
      console.error('[TOKEN] tokenStorage.clear ERROR:', err);
    }
  },
};

// ─── Global 401 force-logout handler ────────────────────────────────────────
// AuthContext registers a callback here after it mounts. When the interceptor
// sees a 401 on a request that carried a Token header (i.e. an authenticated
// request, not a login attempt), it calls this to clear state and redirect to
// the Login screen — without a circular import between client.ts ↔ AuthContext.
//
// We guard with a flag so repeated rapid 401s (e.g. several inflight requests
// all failing at once) only trigger the logout sequence once.
let _unauthorizedHandler: (() => void) | null = null;
let _handlerFiring = false;

export function setUnauthorizedHandler(handler: () => void): void {
  _unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler(): void {
  _unauthorizedHandler = null;
}
// ────────────────────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Every request automatically carries the mobile auth token, exactly the way
// the website's app.js automatically attaches the CSRF token to every call.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.get();
      if (token) {
        config.headers = (config.headers ?? {}) as AxiosRequestHeaders;
        config.headers.Authorization = `Token ${token}`;
        console.log('[API] Request interceptor: Authorization header added for', config.url);
      }
    } catch (err) {
      console.error('[API] Request interceptor ERROR:', err);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error', error);
    return Promise.reject(error);
  }
);

// Normalizes Django's {"error": "..."} responses into a plain Error, same
// shape the website's app.js expects from its api() helper.
// Also handles network errors, CORS errors, and other HTTP errors.
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response interceptor SUCCESS: ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`);
    return response;
  },
  (error) => {
    console.error('[API] Response interceptor ERROR:', {
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      isNetworkError: !error?.response,
      hasResponse: !!error?.response,
      timestamp: new Date().toISOString(),
      originalError: error?.toString(),
    });

    // Network error (no response from server)
    if (!error?.response) {
      console.error('[API] NETWORK ERROR (no response from server):', {
        code: error?.code,
        message: error?.message,
        apiBaseUrl: API_BASE_URL,
        isTimeout: error?.code === 'ECONNABORTED',
        isNetworkError: error?.code === 'ERR_NETWORK',
        isCORS: error?.message?.includes('CORS'),
      });

      if (error?.code === 'ECONNABORTED') {
        const message = 'Request timed out. Please check your internet connection and the server address in your settings.';
        console.error('[API] TIMEOUT ERROR:', { apiBaseUrl: API_BASE_URL });
        return Promise.reject(new Error(message));
      }

      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
        const message = `Network error: Unable to reach ${API_BASE_URL}. Please check your internet connection and ensure the server is accessible.`;
        console.error('[API] NETWORK ERROR:', { apiBaseUrl: API_BASE_URL, errorCode: error?.code });
        return Promise.reject(new Error(message));
      }

      if (error?.message?.includes('CORS')) {
        const message = 'CORS error: The server rejected the request. Please ensure the server configuration is correct.';
        console.error('[API] CORS ERROR');
        return Promise.reject(new Error(message));
      }

      const message = `Connection error: ${error?.message || 'Unable to reach the server'}. Please check your internet connection and try again.`;
      console.error('[API] UNKNOWN NETWORK ERROR:', { message, apiBaseUrl: API_BASE_URL });
      return Promise.reject(new Error(message));
    }

    // Server responded with error status
    const status = error?.response?.status;
    const data = error?.response?.data;

    // ── Global force-logout on 401 for authenticated requests ──────────────
    // A 401 from a request that carried a Token header means the token is no
    // longer valid (employee deleted, token revoked, etc.). We fire the
    // registered handler ONCE to clear state and navigate to Login.
    //
    // We deliberately do NOT fire this for requests that had no Authorization
    // header (i.e. POST /api/mobile/login/ — wrong credentials should just
    // surface the "Invalid username or password" error on the login screen).
    if (
      status === 401 &&
      error?.config?.headers?.Authorization?.startsWith('Token ') &&
      _unauthorizedHandler &&
      !_handlerFiring
    ) {
      _handlerFiring = true;
      console.warn('[API] 401 on authenticated request — triggering force-logout');
      // Fire async but don't await — the interceptor must return synchronously.
      // The handler clears storage and sets React state; React re-renders to
      // Login on the next frame.
      Promise.resolve().then(() => {
        _unauthorizedHandler?.();
        // Reset the flag after a short delay so a fresh login can work normally.
        setTimeout(() => { _handlerFiring = false; }, 2000);
      });
    }
    // ───────────────────────────────────────────────────────────────────────

    // Try to extract error message from response
    let message = data?.error || data?.message || error?.message || 'Something went wrong.';

    // Handle specific HTTP status codes
    if (status === 400) {
      message = message || 'Invalid request. Please check your input and try again.';
      console.error('[API] BAD REQUEST (400):', { message, data });
    } else if (status === 401) {
      message = message || 'Invalid username or password.';
      console.error('[API] UNAUTHORIZED (401):', { message });
    } else if (status === 403) {
      message = message || 'Access denied. You do not have permission to perform this action.';
      console.error('[API] FORBIDDEN (403):', { message });
    } else if (status === 404) {
      message = message || 'Server endpoint not found. Please check the server configuration.';
      console.error('[API] NOT FOUND (404):', { url: error?.config?.url });
    } else if (status === 500) {
      message = 'Server error. Please try again later or contact support.';
      console.error('[API] SERVER ERROR (500):', { message, data });
    } else if (status === 503) {
      message = 'Server is temporarily unavailable. Please try again later.';
      console.error('[API] SERVICE UNAVAILABLE (503)');
    } else {
      console.error(`[API] HTTP ERROR ${status}:`, { message, data });
    }

    console.error('[API] FINAL ERROR MESSAGE:', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
export { API_BASE_URL };
