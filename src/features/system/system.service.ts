/**
 * @file system.service.ts
 * @description API service for System-level endpoints.
 *
 * Endpoint:
 *  GET /system/health — Liveness check (no auth required)
 */

import { apiGet } from "@/lib/axios.client";
import type { ApiResponse } from "@/lib/types/api.types";

/**
 * Pings the backend to confirm it is reachable and healthy.
 * Used by monitoring utilities and optionally the bootstrapping flow.
 *
 * @returns `true` if the server responds with 2xx, `false` otherwise.
 */
export async function getHealth(): Promise<boolean> {
  try {
    await apiGet<null>("/system/health");
    return true;
  } catch {
    return false;
  }
}

/**
 * Raw health check that exposes the full ApiResponse envelope.
 * Use this when you need the server's message or metadata fields.
 */
export function getHealthRaw(): Promise<ApiResponse<null>> {
  return apiGet<null>("/system/health");
}
