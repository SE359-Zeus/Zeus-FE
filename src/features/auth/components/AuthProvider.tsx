/**
 * @file AuthProvider.tsx
 * @description Global authentication bootstrapping provider.
 *
 * ─── Hydration-safe Design ───────────────────────────────────────────────────
 *
 *  Problem (was causing HTTP 500):
 *    Zustand's `isBootstrapping` was initialized to `true`.
 *    During SSR, Next.js renders the component tree and produces HTML.
 *    On the client, React hydrates by re-rendering the same tree.
 *    If the initial client render differs from SSR HTML (because useEffect
 *    immediately sets isBootstrapping = false on mount), React throws a
 *    hydration error, which Next.js surfaces as HTTP 500.
 *
 *  Fix:
 *    1. Store initial `isBootstrapping = false` (SSR and first client render agree).
 *    2. This provider uses `useEffect` to set `isBootstrapping = true` on mount,
 *       then immediately calls `initialLoad()` which sets it back to `false`
 *       when done. This sequence is invisible to SSR.
 *    3. Result: SSR renders children normally (no loading screen flash),
 *       and the client briefly shows the loading screen only while the
 *       silent refresh resolves (~100–300ms typical).
 *
 * ─── Render Flow ─────────────────────────────────────────────────────────────
 *
 *  SSR:     isBootstrapping=false → renders children
 *  Mount:   useEffect → isBootstrapping=true → shows BootstrappingScreen
 *  Resolve: isBootstrapping=false, isReady=true → AuthGuard decides
 *             ├─ has token → dashboard renders
 *             └─ no token  → redirect to /login
 */

"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAuthStore } from "@/lib/stores/auth.store";
import { refreshTokenSilently } from "@/lib/axios.client";

// ─────────────────────────────────────────────────────────────────────────────
// Loading Screen (shown while silent refresh is in progress)
// ─────────────────────────────────────────────────────────────────────────────

function BootstrappingScreen() {
  return (
    <div className="min-h-screen w-full bg-mrp-app flex flex-col items-center justify-center gap-4">
      {/* Animated logo mark */}
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 border-2 border-mrp-primary/20 rounded-full animate-ping" />
        <div className="w-12 h-12 border-2 border-t-mrp-primary border-mrp-primary/10 rounded-full animate-spin" />
        <div className="absolute w-3 h-3 bg-mrp-primary rounded-full" />
      </div>

      <div className="flex flex-col items-center gap-1 mt-4">
        <p className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-[0.3em] font-mono">
          Initializing Session
        </p>
        <p className="text-[10px] text-mrp-text-muted/50 uppercase tracking-widest font-mono">
          Zeus System Core v2.4.0
        </p>
      </div>

      <div className="w-48 h-[2px] bg-mrp-border rounded-full overflow-hidden mt-2">
        <div className="h-full w-1/3 bg-mrp-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialLoad } = useAuth();
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const isAuthenticated = useAuthStore((s) => s.accessToken !== null);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // 1. Initial Load (runs once on mount)
  useEffect(() => {
    /**
     * useEffect only runs in the browser — never during SSR.
     * This guarantees the SSR output and initial client render are identical
     * (both use isBootstrapping=false from initial store state).
     *
     * The sequence here:
     *  1. initialLoad() internally calls setBootstrapping(true) first
     *  2. Runs the silent refresh network request
     *  3. Calls setBootstrapping(false) + setReady(true) in finally block
     */
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Periodic Token Refresh (every 12 minutes while authenticated)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAuthenticated) {
      const REFRESH_INTERVAL = 12 * 60 * 1000; // 12 minutes
      
      intervalId = setInterval(async () => {
        try {
          const tokenPair = await refreshTokenSilently();
          setAccessToken(tokenPair.access_token);
        } catch (error) {
          console.error("[Zeus] Periodic token refresh failed.", error);
          clearAuth(); // AuthGuard will redirect to login
        }
      }, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAuthenticated, setAccessToken, clearAuth]);

  if (isBootstrapping) {
    return <BootstrappingScreen />;
  }

  return <>{children}</>;
}
