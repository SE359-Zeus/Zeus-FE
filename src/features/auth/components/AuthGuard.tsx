/**
 * @file AuthGuard.tsx
 * @description Route guard for all protected pages inside (dashboard).
 *
 * ─── SSR Safety ──────────────────────────────────────────────────────────────
 *
 *  Problem:
 *    The old guard returned `null` when `!isReady || !isAuthenticated`.
 *    During SSR: isReady=false, isAuthenticated=false → renders null.
 *    During SSR of the login page: renders null.
 *    Then on hydration the client renders null too → no mismatch here,
 *    BUT the redirect (router.replace) inside useEffect had a timing issue
 *    where the dashboard layout would flash before the redirect fired.
 *
 *  Fix:
 *    - While NOT ready: render `null` (correct — AuthProvider shows loading).
 *    - While ready but NOT authenticated: render `null` + useEffect redirects.
 *    - While ready AND authenticated: render children.
 *
 *    The SSR-safe contract is maintained because:
 *      AuthProvider (parent) shows BootstrappingScreen while isBootstrapping=true.
 *      AuthGuard's children are never rendered until AuthProvider clears the screen.
 *      So this guard's `null` return is always hidden behind AuthProvider's loading UI.
 *
 * ─── Placement ───────────────────────────────────────────────────────────────
 *
 *  Wrap {children} inside src/app/(dashboard)/layout.tsx.
 *  AuthProvider must be an ancestor (root layout).
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  /**
   * Read directly from the Zustand store instead of going through useAuth().
   * This avoids pulling in useRouter() twice and keeps this component minimal.
   */
  const isReady = useAuthStore((s) => s.isReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = !!accessToken;

  useEffect(() => {
    /**
     * ONLY redirect after bootstrapping has finished (isReady = true).
     * If we redirect before isReady, we'd send the user to /login even
     * when they have a valid session that just hasn't been restored yet.
     *
     * router.replace (not push) so the dashboard URL is removed from history —
     * pressing Back from /login won't return to a 401 dashboard page.
     */
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  /**
   * While bootstrapping is in progress: AuthProvider renders BootstrappingScreen
   * above us in the tree, so returning null here is safe — it's hidden.
   *
   * While ready but not authenticated: null + the useEffect above fires redirect.
   *
   * While authenticated: render children.
   */
  if (!isReady || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
