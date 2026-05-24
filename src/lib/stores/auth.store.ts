/**
 * @file auth.store.ts
 * @description In-memory Zustand store for authentication state.
 *
 * ⚠️  SECURITY RULE: The Access Token is stored ONLY in memory (Zustand state).
 *     It is NEVER written to localStorage, sessionStorage, or any persistent
 *     browser storage. This prevents XSS token-theft attacks.
 *
 *     The Refresh Token is stored exclusively as an httpOnly cookie managed
 *     by the server. JavaScript has zero read access to it.
 */

import { create } from "zustand";
import type { UserResponse } from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Shape
// ---------------------------------------------------------------------------

interface AuthState {
  /** JWT Access Token held purely in JS heap memory. Never persisted. */
  accessToken: string | null;

  /** Decoded user profile fetched after successful authentication. */
  currentUser: UserResponse | null;

  /** True while the initial bootstrapping check is running (F5 / cold start). */
  isBootstrapping: boolean;

  /** True once bootstrapping has finished (success or failure). */
  isReady: boolean;
}

interface AuthActions {
  /** Store a fresh access token (called after login or silent refresh). */
  setAccessToken: (token: string) => void;

  /** Persist the authenticated user's profile. */
  setCurrentUser: (user: UserResponse) => void;

  /** Wipe all auth state (called on logout or failed token refresh). */
  clearAuth: () => void;

  /** Signal that the bootstrapping phase has started. */
  setBootstrapping: (value: boolean) => void;

  /** Signal that the app is ready to render protected routes. */
  setReady: (value: boolean) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  // --- initial state -------------------------------------------------------
  accessToken: null,
  currentUser: null,
  isBootstrapping: true,
  isReady: false,

  // --- actions -------------------------------------------------------------
  setAccessToken: (token) => set({ accessToken: token }),

  setCurrentUser: (user) => set({ currentUser: user }),

  clearAuth: () =>
    set({
      accessToken: null,
      currentUser: null,
    }),

  setBootstrapping: (value) => set({ isBootstrapping: value }),

  setReady: (value) => set({ isReady: value }),
}));

// ---------------------------------------------------------------------------
// Vanilla (non-hook) accessors
// Used inside Axios interceptors which run outside React component tree.
// ---------------------------------------------------------------------------

/**
 * Returns the current access token without subscribing to the store.
 * Safe to call anywhere (interceptors, services, utils).
 */
export const getAccessToken = (): string | null =>
  useAuthStore.getState().accessToken;

/**
 * Stores a new access token. Safe to call anywhere.
 */
export const setAccessToken = (token: string): void =>
  useAuthStore.getState().setAccessToken(token);

/**
 * Wipes all auth state. Safe to call anywhere.
 */
export const clearAuth = (): void => useAuthStore.getState().clearAuth();
