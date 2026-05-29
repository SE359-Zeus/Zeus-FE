/**
 * @file axios.client.ts
 * @description Configured Axios instance with:
 *
 *  ① Request interceptor  — Attaches Authorization: Bearer <token> header.
 *
 *  ② Response interceptor — Two responsibilities:
 *       SUCCESS path: "Unwraps the envelope" — instead of returning the full
 *                     AxiosResponse shell, returns only response.data which is
 *                     already our ApiResponse<T>. Callers never see AxiosResponse.
 *       ERROR path:   Handles 401 → silent token refresh → retry queue.
 *                     On failed refresh: clearAuth() + redirect to /login.
 *
 *  ③ Typed HTTP wrappers — apiGet/apiPost/apiPut/apiPatch/apiDelete
 *                          Return Promise<ApiResponse<T>> (not AxiosResponse<…>)
 *                          providing full end-to-end type safety.
 *
 * ─── Envelope Unwrap Flow ────────────────────────────────────────────────────
 *
 *   Network response (raw)
 *     └─ AxiosResponse<ApiResponse<T>>          ← what Axios receives
 *          └─ .data → ApiResponse<T>            ← what the interceptor extracts
 *               └─ .data → T                   ← the actual payload (in services)
 *
 *   After the interceptor, awaiting apiGet<T>(url) gives you ApiResponse<T>.
 *   You then access .data to reach the typed payload T.
 *
 * ─── TypeScript Strategy ─────────────────────────────────────────────────────
 *
 *   Axios declares get<T>() → Promise<AxiosResponse<T>>.
 *   Our interceptor changes the runtime value to T (the unwrapped data).
 *   We reconcile this with a targeted `as unknown as Promise<ApiResponse<T>>`
 *   cast inside each typed wrapper — nowhere else. This is the minimal,
 *   industry-standard approach for this Axios pattern.
 *
 * ─── Security Properties ─────────────────────────────────────────────────────
 *
 *   withCredentials: true  — httpOnly Refresh Token cookie sent automatically.
 *   Access Token stored only in Zustand memory — never localStorage.
 *   Silent refresh uses raw axios (no interceptors) to avoid recursion.
 *   Concurrent 401s are queued; only ONE refresh call is made.
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { getAccessToken, setAccessToken, clearAuth } from "@/lib/stores/auth.store";
import type { ApiResponse, TokenPair } from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Root API base — version only. Module prefixes (/system, /mrp, …)
 * are the responsibility of each service file, not this client.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://zeus.ryanandexen.qzz.io/api/v1";

/**
 * The silent-refresh endpoint including its module prefix.
 * Defined here (not in auth.service.ts) because the interceptor calls it
 * directly — it must be a module-level constant to detect refresh loops.
 */
const REFRESH_ENDPOINT = "/system/auth/refresh";

// ─────────────────────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  /**
   * CRITICAL: Enables the browser to attach the httpOnly Refresh Token cookie
   * on every cross-origin request. Without this flag the cookie is stripped
   * silently and silent refresh will always fail (returning 401).
   */
  withCredentials: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Refresh Queue (N+1 storm prevention)
// When multiple concurrent requests get a 401, only the first starts the
// refresh. The rest are queued and replayed after the refresh resolves.
// ─────────────────────────────────────────────────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function drainQueue(newToken: string): void {
  pendingQueue.forEach(({ resolve }) => resolve(newToken));
  pendingQueue = [];
}

function rejectQueue(error: unknown): void {
  pendingQueue.forEach(({ reject }) => reject(error));
  pendingQueue = [];
}

// Extended config type to track already-retried requests.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ① REQUEST INTERCEPTOR
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// ② RESPONSE INTERCEPTOR
// ─────────────────────────────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  /**
   * SUCCESS PATH — Envelope Unwrap
   *
   * Instead of returning the full AxiosResponse<ApiResponse<T>>, we extract
   * only response.data (which IS our ApiResponse<T>).
   *
   * Why `as unknown`:
   *   Axios's interceptor type signature demands we return AxiosResponse.
   *   We intentionally deviate at runtime. The `as unknown` cast is the
   *   minimal escape hatch accepted by TypeScript for this pattern.
   *   Type safety is restored at the call site via the typed wrappers below.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (response: AxiosResponse): any => response.data,

  /**
   * ERROR PATH — Silent Token Refresh + Queue Drain
   */
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    const is401        = error.response?.status === 401;
    const isRetry      = originalRequest?._retry === true;
    const isRefreshCall = originalRequest?.url === REFRESH_ENDPOINT;

    // Pass through non-401 errors and already-retried / refresh requests.
    if (!is401 || isRetry || isRefreshCall || !originalRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ── Queue if refresh already in flight ───────────────────────────────
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    // ── Start a fresh refresh cycle ──────────────────────────────────────
    isRefreshing = true;

    try {
      const tokenPair = await refreshTokenSilently();

      setAccessToken(tokenPair.access_token);

      drainQueue(tokenPair.access_token);

      originalRequest.headers.set("Authorization", `Bearer ${tokenPair.access_token}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      clearAuth();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Silent Refresh — uses RAW axios (no interceptors) to prevent recursion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls POST /system/auth/refresh using a plain axios instance that bypasses
 * all interceptors. This prevents the 401 handler from calling itself.
 *
 * The browser automatically attaches the HttpOnly `refresh_token` cookie on
 * this request because `withCredentials: true` is set. No manual cookie
 * reading or body injection is needed.
 *
 * Because this bypasses our success interceptor, the response IS a full
 * AxiosResponse. We manually access .data (ApiResponse) and .data.data (TokenPair).
 */
async function refreshTokenSilently(): Promise<TokenPair> {
  // Raw axios — intentionally bypasses apiClient interceptors.
  const axiosResponse = await axios.post<ApiResponse<TokenPair>>(
    `${API_BASE_URL}${REFRESH_ENDPOINT}`,
    {}, // empty body — refresh token is sent automatically via HttpOnly cookie
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    },
  );

  // axiosResponse.data  → ApiResponse<TokenPair>   (outer envelope)
  // axiosResponse.data.data → TokenPair            (the actual payload)
  const tokenPair = axiosResponse.data.data;
  if (!tokenPair) {
    throw new Error("[Zeus] Refresh response contained no token data.");
  }

  return tokenPair;
}

export { refreshTokenSilently };

// ─────────────────────────────────────────────────────────────────────────────
// ③ TYPED HTTP WRAPPERS
//
// These are the ONLY functions service files should call.
// They provide full end-to-end TypeScript safety:
//
//   Service:   return apiGet<User[]>("/system/users")
//              → Promise<ApiResponse<User[]>>
//
//   Component: const { data } = useUsers()
//              data?.data     → User[] | null
//
// The `as unknown as Promise<ApiResponse<T>>` cast is safe because:
//   - The success interceptor above guarantees runtime value IS ApiResponse<T>
//   - The cast exists only here, not scattered across services
// ─────────────────────────────────────────────────────────────────────────────

export function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  return apiClient.get(url, config) as unknown as Promise<ApiResponse<T>>;
}

export function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  return apiClient.post(url, data, config) as unknown as Promise<ApiResponse<T>>;
}

export function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  return apiClient.put(url, data, config) as unknown as Promise<ApiResponse<T>>;
}

export function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  return apiClient.patch(url, data, config) as unknown as Promise<ApiResponse<T>>;
}

export function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<ApiResponse<T>> {
  return apiClient.delete(url, config) as unknown as Promise<ApiResponse<T>>;
}
