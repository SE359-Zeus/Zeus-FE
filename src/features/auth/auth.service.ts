/**
 * @file auth.service.ts
 * @description API service for Authentication endpoints.
 *
 * Endpoints:
 *  POST /system/auth/login    — Authenticate with email + password
 *  POST /system/auth/logout   — Invalidate current session
 *  POST /system/auth/refresh  — Silent token rotation (called by service layer;
 *                               the Axios interceptor has its own copy for 401 retry)
 *
 * Note on return types:
 *  Because the Axios success interceptor unwraps the envelope, every apiPost()
 *  call already returns ApiResponse<T> directly. Services simply return that
 *  value — no more `.data` unwrapping needed here.
 */

import { apiPost } from "@/lib/axios.client";
import { storeRefreshToken, clearRefreshToken } from "@/lib/axios.client";
import { setAccessToken, clearAuth } from "@/lib/stores/auth.store";
import type {
  ApiResponse,
  LoginRequest,
  LoginData,
  TokenPair,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * Side effects on success:
 *  - Stores access_token in Zustand (in-memory only, never localStorage)
 *  - Stores refresh_token in module-level memory via storeRefreshToken()
 *
 * @returns ApiResponse<LoginData> containing { access_token, refresh_token }
 */
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginData>> {
  const response = await apiPost<LoginData>(
    "/system/auth/login",
    credentials,
  );

  if (response.data) {
    setAccessToken(response.data.access_token);
    storeRefreshToken(response.data.refresh_token);
  }

  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Terminates the current session server-side and clears all local auth state.
 *
 * The server call is best-effort: local state is always cleared even if
 * the network request fails (e.g. already-expired token).
 */
export async function logout(): Promise<void> {
  try {
    await apiPost<null>("/system/auth/logout");
  } finally {
    // Always clear regardless of server response
    clearAuth();
    clearRefreshToken();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exchanges a refresh token for a new token pair.
 * Called by the bootstrapping flow (AuthProvider) on cold start / F5.
 *
 * The Axios 401 interceptor has its own separate refresh path that uses
 * raw axios to avoid recursion. This function is for explicit service-layer calls.
 *
 * @param currentRefreshToken  The refresh token stored in module memory.
 * @returns Full TokenPair with new access_token and refresh_token.
 */
export async function refreshSession(
  currentRefreshToken: string,
): Promise<ApiResponse<TokenPair>> {
  const response = await apiPost<TokenPair>("/system/auth/refresh", {
    refresh_token: currentRefreshToken,
  });

  if (response.data) {
    setAccessToken(response.data.access_token);
    storeRefreshToken(response.data.refresh_token);
  }

  return response;
}
