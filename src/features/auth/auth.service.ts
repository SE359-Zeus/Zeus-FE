/**
 * @file auth.service.ts
 * @description API service layer for the Authentication endpoints.
 *
 * Endpoints covered:
 *  POST /auth/login    — Login with email + password
 *  POST /auth/logout   — Invalidate session (requires Bearer token)
 *  POST /auth/refresh  — Silent token rotation (uses httpOnly cookie)
 *
 * All functions go through the shared apiClient (Step 1) which automatically:
 *   - Attaches Authorization header
 *   - Handles silent refresh on 401
 *   - Sends httpOnly cookie via withCredentials: true
 */

import { apiClient, storeRefreshToken, clearRefreshToken } from "@/lib/axios.client";
import { setAccessToken, clearAuth } from "@/lib/stores/auth.store";
import type {
  Envelope,
  LoginRequest,
  TokenPair,
} from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
}

/**
 * Authenticates a user with email and password.
 * On success, stores both tokens (access token in Zustand, refresh in memory).
 *
 * @returns The full Envelope containing access_token and refresh_token.
 */
export async function login(
  credentials: LoginRequest,
): Promise<Envelope<LoginResponseData>> {
  const res = await apiClient.post<Envelope<LoginResponseData>>(
    "/system/auth/login",
    credentials,
  );

  const data = res.data.data;
  if (data) {
    // Store access token in memory (Zustand) — never localStorage
    setAccessToken(data.access_token);
    // Store refresh token in module-level memory for silent refresh body
    storeRefreshToken(data.refresh_token);
  }

  return res.data;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * Calls POST /auth/logout to invalidate the server-side session.
 * Clears all local auth state regardless of server response.
 */
export async function logout(): Promise<void> {
  try {
    // Best-effort: server invalidates the refresh token / cookie
    await apiClient.post<Envelope<null>>("/system/auth/logout");
  } finally {
    // Always clear local state, even if the server call fails
    clearAuth();
    clearRefreshToken();
  }
}

// ---------------------------------------------------------------------------
// Refresh (used by bootstrapping flow)
// ---------------------------------------------------------------------------

/**
 * Calls POST /auth/refresh directly from the service layer.
 * Used during the initial bootstrapping flow (F5 / cold start).
 * The actual implementation of silent refresh inside interceptors uses
 * refreshTokenSilently() from axios.client.ts.
 *
 * On success: stores new tokens.
 * On failure: throws so the caller (AuthProvider) can redirect to /login.
 */
export async function refreshSession(
  currentRefreshToken: string,
): Promise<TokenPair> {
  const res = await apiClient.post<Envelope<TokenPair>>("/system/auth/refresh", {
    refresh_token: currentRefreshToken,
  });

  const tokenPair = res.data.data;
  if (!tokenPair) {
    throw new Error("Refresh returned no token data");
  }

  // Persist new tokens
  setAccessToken(tokenPair.access_token);
  storeRefreshToken(tokenPair.refresh_token);

  return tokenPair;
}
