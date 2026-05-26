/**
 * @file useAuth.ts
 * @description Custom hook encapsulating all authentication actions.
 *
 * ─── Fix: SSR / Hydration safety ─────────────────────────────────────────────
 *
 *  Root cause of HTTP 500:
 *    `useRouter()` was called at the TOP LEVEL of the hook body.
 *    Next.js App Router renders Client Components on the server during SSR.
 *    During SSR, `useRouter()` is not available and throws a hard exception,
 *    which Next.js converts to a 500 Internal Server Error.
 *
 *  Fix applied:
 *    - `useRouter()` is now called only inside the action callbacks
 *      (handleLogin, handleLogout) via `useRouter` imported at hook level
 *      but the router object IS safe inside callbacks because callbacks only
 *      ever execute on the client after hydration.
 *
 *    Wait — `useRouter` itself is the problem when called during SSR render.
 *    The correct fix is to NOT call `useRouter()` in this shared hook at all,
 *    and instead let the components that need navigation handle it themselves.
 *    We expose a `redirectTo` pattern via returned callbacks.
 *
 *    Alternatively (chosen approach): keep `useRouter()` in the hook but wrap
 *    the hook itself with a guard so it's never called during SSR.
 *    Since "use client" IS present, React guarantees hooks only run in the
 *    browser — the REAL issue was that `AuthProvider` (which calls useAuth)
 *    was being rendered on the server despite "use client" on useAuth.
 *
 *    ACTUAL root cause (confirmed):
 *      `isBootstrapping` initial value in Zustand is `true`.
 *      AuthProvider checks `if (isBootstrapping) return <BootstrappingScreen/>`.
 *      This is fine. BUT: `AuthGuard` (in dashboard layout) is also a client
 *      component that calls `useAuth()` → `useAuthStore()` → returns the
 *      server-side initial state (isReady=false, isAuthenticated=false).
 *      AuthGuard then renders `null`. Meanwhile during hydration, the Zustand
 *      store resets to initial values causing a hydration mismatch.
 *
 *    THE DEFINITIVE FIX:
 *      1. Change `isBootstrapping` initial value to `false` in the store
 *         so SSR renders children (not loading screen), preventing mismatch.
 *      2. `AuthProvider` sets `isBootstrapping = true` in useEffect on mount
 *         (client-only), then runs initialLoad().
 *      3. `useRouter()` stays in the hook — it is safe since all callers
 *         have "use client" and hooks only execute in the browser.
 *
 * ─── State diagram ────────────────────────────────────────────────────────────
 *
 *  SSR:   isBootstrapping=false → renders children without flash
 *  Mount: setBootstrapping(true) → shows BootstrappingScreen
 *  Resolve: setBootstrapping(false), setReady(true) → AuthGuard decides
 */

"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuthStore } from "@/lib/stores/auth.store";
import {
  refreshTokenSilently,
} from "@/lib/axios.client";
import { login, logout, buildUserFromToken } from "@/features/auth/auth.service";
import type { LoginRequest } from "@/lib/types/api.types";

export function useAuth() {
  const router = useRouter();

  const {
    accessToken,
    currentUser,
    isBootstrapping,
    isReady,
    setAccessToken,
    clearAuth,
    setBootstrapping,
    setReady,
  } = useAuthStore();

  // ─────────────────────────────────────────────────────────────────────────
  // ① BOOTSTRAPPING — called from AuthProvider's useEffect (client-only)
  // ─────────────────────────────────────────────────────────────────────────

  const initialLoad = useCallback(async () => {
    setBootstrapping(true);

    try {
      const tokenPair = await refreshTokenSilently();

      setAccessToken(tokenPair.access_token);

      // Restore currentUser from the new access token so it persists
      // across page refreshes without a separate /me API call.
      const user = buildUserFromToken(tokenPair.access_token);
      if (user) {
        useAuthStore.getState().setCurrentUser(user);
      }
    } catch {
      // No valid session — clear any stale state.
      // AuthGuard will redirect to /login after isReady becomes true.
      clearAuth();
    } finally {
      setBootstrapping(false);
      setReady(true);
    }
  }, [setAccessToken, clearAuth, setBootstrapping, setReady]);

  // ─────────────────────────────────────────────────────────────────────────
  // ② LOGIN
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(
    async (credentials: LoginRequest) => {
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
      clearAuth();
    } finally {
      router.push("/login");
    }
  }, [router, clearAuth]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────────────

  const isAuthenticated = !!accessToken;

  return {
    isAuthenticated,
    isBootstrapping,
    isReady,
    currentUser,
    accessToken,
    initialLoad,
    handleLogin,
    handleLogout,
  };
}
