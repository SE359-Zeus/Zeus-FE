/**
 * @file AuthProvider.tsx
 * @description Global authentication provider.
 *
 * Responsibilities:
 *  1. Runs `initialLoad()` exactly ONCE when the app mounts (cold start / F5).
 *  2. Shows a full-screen loading state while bootstrapping is in progress,
 *     preventing any flash of unauthenticated content (FOUC).
 *  3. Wraps the entire application so all children have access to auth state.
 *
 * Placement: Wrap `{children}` inside the root layout.tsx.
 *
 * Flow:
 *   Mount → initialLoad() → [isReady = true] → render children
 *                                            ↓
 *                               AuthGuard decides: dashboard or /login
 */

"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";

// ---------------------------------------------------------------------------
// Full-screen loading skeleton shown during bootstrapping
// ---------------------------------------------------------------------------

function BootstrappingScreen() {
  return (
    <div className="min-h-screen w-full bg-mrp-app flex flex-col items-center justify-center gap-4">
      {/* Animated logo mark */}
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className="absolute w-16 h-16 border-2 border-mrp-primary/20 rounded-full animate-ping" />
        <div className="w-12 h-12 border-2 border-t-mrp-primary border-mrp-primary/10 rounded-full animate-spin" />
        {/* Inner static dot */}
        <div className="absolute w-3 h-3 bg-mrp-primary rounded-full" />
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-1 mt-4">
        <p className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-[0.3em] font-mono">
          Initializing Session
        </p>
        <p className="text-[10px] text-mrp-text-muted/50 uppercase tracking-widest font-mono">
          Zeus System Core v2.4.0
        </p>
      </div>

      {/* Animated progress bar */}
      <div className="w-48 h-[2px] bg-mrp-border rounded-full overflow-hidden mt-2">
        <div className="h-full w-1/3 bg-mrp-primary rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { initialLoad, isBootstrapping } = useAuth();

  // Run exactly once on mount — never on re-renders
  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Block rendering until the bootstrapping check resolves.
  // This prevents:
  //   1. Flash of dashboard content before auth check completes
  //   2. Flash of login page for already-authenticated users
  if (isBootstrapping) {
    return <BootstrappingScreen />;
  }

  return <>{children}</>;
}
