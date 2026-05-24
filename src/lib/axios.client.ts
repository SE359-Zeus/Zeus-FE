/**
 * @file axios.client.ts
 * @description Configured Axios instance with request + response interceptors
 * implementing the full silent-refresh token-rotation flow.
 *
 * Architecture:
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  Every outgoing request                                     │
 *  │    → Request interceptor adds "Authorization: Bearer ..."   │
 *  │                                                             │
 *  │  On 401 response                                            │
 *  │    → Call /auth/refresh (sends httpOnly cookie silently)    │
 *  │    → Success → store new access_token → retry original req  │
 *  │    → Failure → clearAuth() + redirect to /login            │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * Key security properties:
 *  - withCredentials: true  → httpOnly Refresh Token cookie is attached
 *  - Access Token is read from / stored to Zustand (in-memory only)
 *  - Concurrent 401 requests are queued and retried after a single refresh
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, setAccessToken, clearAuth } from "@/lib/stores/auth.store";
import type { Envelope, TokenPair } from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Root of all API versions. Module-specific prefixes (/system, /mrp, etc.)
 * are appended inside each individual service file — NOT here.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://zeus.ryanandexen.qzz.io/api/v1";

/**
 * The silent-refresh endpoint. Must carry the /system prefix because
 * this is the only endpoint the HTTP client calls directly (it lives
 * in the interceptor, not in auth.service.ts).
 */
const REFRESH_ENDPOINT = "/system/auth/refresh";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  /**
   * REQUIRED: Ensures the browser sends the httpOnly Refresh Token cookie
   * on every cross-origin request automatically. Without this, the cookie
   * is silently stripped and silent refresh will always fail.
   */
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Token refresh queue
// Prevents multiple concurrent requests from each triggering their own
// refresh call (N+1 refresh storm). Instead, they queue up and wait for
// the single ongoing refresh to settle.
// ---------------------------------------------------------------------------

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function drainQueue(token: string): void {
  pendingQueue.forEach(({ resolve }) => resolve(token));
  pendingQueue = [];
}

function rejectQueue(error: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

// ---------------------------------------------------------------------------
// Extended config interface – used to mark a request as "already retried"
// so we don't get into an infinite refresh loop.
// ---------------------------------------------------------------------------

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ---------------------------------------------------------------------------
// ① REQUEST INTERCEPTOR
// Automatically attaches the in-memory Access Token to every request.
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// ② RESPONSE INTERCEPTOR
// Handles 401 Unauthorized by attempting a silent token refresh.
// ---------------------------------------------------------------------------

apiClient.interceptors.response.use(
  // Pass-through for successful responses
  (response: AxiosResponse) => response,

  // Error handler
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Only handle 401 errors that haven't already been retried.
    // Also skip if the failing request IS the refresh endpoint itself
    // (prevents infinite retry loop).
    const is401 = error.response?.status === 401;
    const isRetry = originalRequest?._retry === true;
    const isRefreshCall = originalRequest?.url === REFRESH_ENDPOINT;

    if (!is401 || isRetry || isRefreshCall || !originalRequest) {
      return Promise.reject(error);
    }

    // Mark as retried to prevent duplicate retries
    originalRequest._retry = true;

    // ── If a refresh is already in progress, queue this request ────────────
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    // ── Start a new refresh cycle ───────────────────────────────────────────
    isRefreshing = true;

    try {
      // The backend reads the Refresh Token from the httpOnly cookie
      // (automatically attached because withCredentials: true).
      // We send an empty body or the cookie-based flow depending on backend.
      // Per API spec: POST /auth/refresh with { refresh_token: string } in body.
      // Because the token is httpOnly we must use a dedicated public client
      // that does NOT go through this interceptor (to avoid recursive 401 handling).
      const refreshResponse = await refreshTokenSilently();

      const newAccessToken = refreshResponse.access_token;
      const newRefreshToken = refreshResponse.refresh_token;

      // Store the new access token in memory
      setAccessToken(newAccessToken);

      // Persist the new refresh token if the server rotates it
      // (server also sets it as httpOnly cookie, but we also store in memory
      //  for the RefreshRequest body on the next call)
      if (typeof window !== "undefined") {
        // We store only the refresh token string temporarily in memory
        // via a module-level variable so the next refresh call can use it.
        // This is NOT localStorage – it lives only as long as the JS module.
        _inMemoryRefreshToken = newRefreshToken;
      }

      // Flush the queue with the new token
      drainQueue(newAccessToken);

      // Retry the original failed request with the new token
      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed → session is dead
      rejectQueue(refreshError);
      clearAuth();

      // Force redirect to login (works in Next.js App Router)
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ---------------------------------------------------------------------------
// In-memory Refresh Token holder
// The httpOnly cookie is the authoritative source, but after the first login
// we also keep the refresh_token string in a module-level variable so we can
// send it in the request body as required by the API spec.
// This variable is reset on clearAuth / page reload.
// ---------------------------------------------------------------------------

/** @internal Module-level in-memory refresh token. Not accessible outside. */
let _inMemoryRefreshToken: string | null = null;

/**
 * Sets the refresh token in the module-level in-memory variable.
 * Called by the bootstrapping flow and by the login handler.
 */
export function storeRefreshToken(token: string): void {
  _inMemoryRefreshToken = token;
}

/**
 * Clears the in-memory refresh token (called on logout).
 */
export function clearRefreshToken(): void {
  _inMemoryRefreshToken = null;
}

// ---------------------------------------------------------------------------
// Silent refresh helper
// Uses a PLAIN axios (not apiClient) to avoid going through our interceptors.
// ---------------------------------------------------------------------------

/**
 * Calls POST /auth/refresh with the in-memory refresh token in the body.
 * The httpOnly cookie is also attached automatically via withCredentials.
 * This uses a raw axios instance (no interceptors) to prevent recursion.
 */
async function refreshTokenSilently(): Promise<TokenPair> {
  if (!_inMemoryRefreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<Envelope<TokenPair>>(
    `${API_BASE_URL}${REFRESH_ENDPOINT}`,
    { refresh_token: _inMemoryRefreshToken } satisfies { refresh_token: string },
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const tokenPair = response.data.data;
  if (!tokenPair) {
    throw new Error("Refresh response contained no token data");
  }

  return tokenPair;
}

// ---------------------------------------------------------------------------
// Export the raw refresh function for use by the bootstrapping flow.
// ---------------------------------------------------------------------------
export { refreshTokenSilently };

// ---------------------------------------------------------------------------
// Typed convenience wrappers (thin wrappers over apiClient)
// ---------------------------------------------------------------------------

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Envelope<T>> {
  const res = await apiClient.get<Envelope<T>>(url, config);
  return res.data;
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<Envelope<T>> {
  const res = await apiClient.post<Envelope<T>>(url, data, config);
  return res.data;
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<Envelope<T>> {
  const res = await apiClient.put<Envelope<T>>(url, data, config);
  return res.data;
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<Envelope<T>> {
  const res = await apiClient.patch<Envelope<T>>(url, data, config);
  return res.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<Envelope<T>> {
  const res = await apiClient.delete<Envelope<T>>(url, config);
  return res.data;
}
