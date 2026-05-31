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
import { setAccessToken, clearAuth, useAuthStore } from "@/lib/stores/auth.store";
import type {
  ApiResponse,
  LoginRequest,
  LoginData,
  TokenPair,
  User,
  UserRole,
  UserStatus,
  ChangePasswordRequest,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// JWT Payload Decoder
// Decodes the payload portion of a JWT token WITHOUT verifying the signature.
// Signature verification is the responsibility of the backend.
// This is used only to extract user claims (id, email, role, etc.) so that
// currentUser can be populated in the Zustand store after login/refresh.
// ─────────────────────────────────────────────────────────────────────────────

interface JwtPayload {
  user_id: string;
  email:    string;
  full_name: string;
  role:     string;
  status:   string;
  exp:      number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded.padEnd(padded.length + (4 - padded.length % 4) % 4, '='));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Builds a minimal User object from JWT claims for use in currentUser store.
 * Only fields embedded in the JWT are populated; timestamps are left empty.
 */
export function buildUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.user_id) return null;
  return {
    id:            payload.user_id,
    email:         payload.email         ?? '',
    full_name:     payload.full_name     ?? '',
    role:          (payload.role         ?? '')  as UserRole,
    status:        (payload.status       ?? 'ACTIVE') as UserStatus,
    created_at:    '',
    updated_at:    '',
    last_login_at: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * Side effects on success:
 *  - Stores access_token in Zustand (in-memory only, never localStorage)
 *  - Backend sets the refresh_token as an HttpOnly cookie automatically
 *    via the Set-Cookie response header. JavaScript has zero read access to it.
 *
 * @returns ApiResponse<LoginData> containing { access_token }
 */
export async function login(
  credentials: LoginRequest,
): Promise<ApiResponse<LoginData>> {
  const response = await apiPost<LoginData>(
    "/system/auth/login",
    credentials,
    { withCredentials: true },
  );

  if (response.data) {
    const token = response.data.access_token;
    setAccessToken(token);

    // Populate currentUser from the JWT claims so that audit log ingestion
    // always has a valid user_id without a separate /me API call.
    const user = buildUserFromToken(token);
    if (user) {
      useAuthStore.getState().setCurrentUser(user);
    }
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
    await apiPost<null>("/system/auth/logout", {}, { withCredentials: true });
  } finally {
    // Always clear regardless of server response
    clearAuth();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Exchanges the HttpOnly refresh_token cookie for a new token pair.
 * Called by the bootstrapping flow (AuthProvider) on cold start / F5.
 *
 * The browser automatically attaches the HttpOnly cookie — no body token needed.
 * The Axios 401 interceptor has its own separate refresh path that uses
 * raw axios to avoid recursion. This function is for explicit service-layer calls.
 *
 * @returns Full TokenPair with new access_token (refresh_token rotated via cookie).
 */
export async function refreshSession(): Promise<ApiResponse<TokenPair>> {
  const response = await apiPost<TokenPair>("/system/auth/refresh", {}, { withCredentials: true });

  if (response.data) {
    setAccessToken(response.data.access_token);
  }

  return response;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/auth/change-password
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Changes the current user's password.
 * Requires a valid access token (BearerAuth).
 *
 * @param payload  { old_password, new_password }
 * @returns ApiResponse<User> with the updated user profile
 */
export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<ApiResponse<User>> {
  return apiPost<User>("/system/auth/change-password", payload);
}
