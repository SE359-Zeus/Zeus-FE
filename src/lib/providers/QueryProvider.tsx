/**
 * @file QueryProvider.tsx
 * @description React Query (TanStack Query) client provider.
 *
 * Wraps the application to provide query caching for all useQuery/useMutation
 * hooks used across the Users, Audit, and System features.
 *
 * Configuration:
 *  - staleTime: 0 (server-state is fresh by default — each hook controls its own)
 *  - retry: 1 (retry once on network errors, not on 4xx)
 *  - refetchOnWindowFocus: true (keeps data fresh when user returns to tab)
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { AxiosError } from "axios";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create the client inside useState so it's scoped per render tree
  // and not shared between SSR requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: (failureCount, error) => {
              // Never retry on 4xx errors (auth, not found, validation)
              const status = (error as AxiosError)?.response?.status;
              if (status && status >= 400 && status < 500) return false;
              return failureCount < 1;
            },
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
