/**
 * @file useAuth.ts
 * @description Custom hook encapsulating all authentication logic:
 *
 *  1. initialLoad() — Bootstrapping flow that runs ONCE on cold start / F5.
 *     Silently checks if the user has a valid session by calling /auth/refresh.
 *     The httpOnly Refresh Token cookie is sent automatically by the browser.
 *
 *  2. handleLogin() — Calls /auth/login, stores tokens, navigates to dashboard.
 *
 *  3. handleLogout() — Calls /auth/logout, clears state, navigates to /login.
 *
 * State diagram:
 *
 *  [Cold Start / F5]
 *       │
 *       ▼
 *  isBootstrapping = true
 *       │
 *       ├─ POST /auth/refresh ──► SUCCESS ──► store tokens ──► isReady = true ──► /dashboard
 *       │
 *       └─ POST /auth/refresh ──► FAILURE ──► clearAuth() ──► isReady = true ──► /login
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/auth.store";
import {
  storeRefreshToken,
  clearRefreshToken,
  refreshTokenSilently,
} from "@/lib/axios.client";
import { login, logout } from "@/features/auth/auth.service";
import type { LoginRequest } from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const router = useRouter();

  const {
    accessToken,
    currentUser,
    isBootstrapping,
    isReady,
    setAccessToken,
    setCurrentUser,
    clearAuth,
    setBootstrapping,
    setReady,
  } = useAuthStore();

  // ─────────────────────────────────────────────────────────────────────────
  // ① BOOTSTRAPPING FLOW
  // Called once by AuthProvider on mount.
  // Attempts a silent refresh; if the browser has a valid httpOnly cookie,
  // the server returns new tokens and the user is auto-logged in.
  // ─────────────────────────────────────────────────────────────────────────

  const initialLoad = useCallback(async () => {
    setBootstrapping(true);

    try {
      // refreshTokenSilently() uses raw axios (no interceptor loop).
      // The httpOnly cookie is sent automatically via withCredentials: true.
      // We still need to have a refresh token in memory — on cold start it's
      // empty, so we pass an empty string and let the server validate the
      // cookie only. The backend MUST support cookie-based validation.
      //
      // If the backend strictly requires the body token, this call will fail
      // and the user is redirected to login (correct behaviour for expired sessions).
      const tokenPair = await refreshTokenSilently();

      // ── Success: session restored ─────────────────────────────────────
      setAccessToken(tokenPair.access_token);
      storeRefreshToken(tokenPair.refresh_token);

      // TODO (Step 3): fetch /users/me or decode JWT to populate currentUser
      // setCurrentUser(me);

      // Mark bootstrapping done — AuthGuard will allow access to dashboard
      setBootstrapping(false);
      setReady(true);
    } catch {
      // ── Failure: no valid session — redirect to login ─────────────────
      clearAuth();
      clearRefreshToken();
      setBootstrapping(false);
      setReady(true);
      // Navigation is handled by AuthGuard, not here, to avoid race conditions.
    }
  }, [setAccessToken, clearAuth, setBootstrapping, setReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // ② LOGIN
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
      // login() in auth.service.ts stores tokens automatically on success
      await login(credentials);

      toast.success("Login Successful", {
        description: "Session initialized. Redirecting...",
      });

      router.push("/mrp/dashboard");
    },
    [router],
  );

  // ─────────────────────────────────────────────────────────────────────────
  // ③ LOGOUT
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success("Session terminated", {
        description: "You have been securely logged out.",
      });
    } catch {
      // Even if the server call fails, we clear local state
      clearAuth();
      clearRefreshToken();
    } finally {
      router.push("/login");
    }
  }, [router, clearAuth]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** True if the user is currently authenticated (has a valid access token). */
  const isAuthenticated = !!accessToken;

  return {
    // State
    isAuthenticated,
    isBootstrapping,
    isReady,
    currentUser,
    accessToken,

    // Actions
    initialLoad,
    handleLogin,
    handleLogout,
  };
}
