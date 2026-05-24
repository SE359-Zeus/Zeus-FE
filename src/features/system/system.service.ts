/**
 * @file system.service.ts
 * @description API service for System endpoints.
 *
 * Endpoints:
 *  GET /health — Health check (no auth required)
 */

import { apiClient } from "@/lib/axios.client";
import type { Envelope } from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

/**
 * GET /health
 * Pings the backend to confirm it is reachable.
 * Used by monitoring, status pages, and optionally the bootstrapping flow.
 */
export async function getHealth(): Promise<boolean> {
  try {
    await apiClient.get<Envelope<null>>("/system/health");
    return true;
  } catch {
    return false;
  }
}
