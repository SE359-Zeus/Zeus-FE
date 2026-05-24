/**
 * @file AuthGuard.tsx
 * @description Route guard for protected pages (dashboard and sub-routes).
 *
 * How it works:
 *  - Reads `isAuthenticated` and `isReady` from the auth store.
 *  - If NOT authenticated after bootstrapping is done → redirect to /login.
 *  - If authenticated → render children.
 *
 * Placement: Wrap `{children}` inside the (dashboard) group layout.tsx.
 *
 * Note: AuthProvider (in root layout) has already resolved the bootstrapping
 * check before AuthGuard ever renders, so we only need to check isAuthenticated.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    // Only redirect after the bootstrapping check has settled.
    // `isReady` is set to true by initialLoad() in AuthProvider.
    if (isReady && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isReady, isAuthenticated, router]);

  // While still determining auth state, render nothing (AuthProvider
  // handles the loading screen above us in the tree).
  if (!isReady || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
