/**
 * @file useAudit.ts
 * @description React Query hooks for the Audit Logs domain.
 *
 * API response for list endpoints:
 *   data: { items: AuditLog[] }
 *   metadata: { pagination: PaginationMeta }
 *
 * Access pattern in components:
 *   const { data: res } = useAuditLogs(filter)
 *   const items      = res?.data?.items ?? []
 *   const pagination = res?.metadata?.pagination
 *
 *   const { data: res } = useAuditMetrics()
 *   const metrics = res?.data
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  queryAuditLogs,
  getAuditMetrics,
  ingestAuditLog,
} from "@/features/system/audit-logs/audit.service";
import type {
  ApiResponse,
  PaginatedResult,
  AuditLog,
  AuditMetrics,
  AuditFilter,
  IngestAuditRequest,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const auditKeys = {
  all:     ["audit"] as const,
  logs:    ()               => [...auditKeys.all, "logs"] as const,
  log:     (f: AuditFilter) => [...auditKeys.logs(), f] as const,
  metrics: ()               => [...auditKeys.all, "metrics"] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// useAuditLogs — GET /system/logs
// ─────────────────────────────────────────────────────────────────────────────

export function useAuditLogs(
  filter: AuditFilter = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResult<AuditLog>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: auditKeys.log(filter),
    queryFn:  () => queryAuditLogs(filter),
    staleTime: 15_000,
    refetchInterval: 30_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useAuditMetrics — GET /system/logs/metrics
// ─────────────────────────────────────────────────────────────────────────────

export function useAuditMetrics(
  options?: Omit<
    UseQueryOptions<ApiResponse<AuditMetrics>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: auditKeys.metrics(),
    queryFn:  getAuditMetrics,
    staleTime: 60_000,
    refetchInterval: 60_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useIngestAudit — POST /system/logs/ingest
// ─────────────────────────────────────────────────────────────────────────────

export function useIngestAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IngestAuditRequest) => ingestAuditLog(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.logs() });
      queryClient.invalidateQueries({ queryKey: auditKeys.metrics() });
    },

    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } };
      toast.error("Audit Log Failed", {
        description: axiosErr.response?.data?.message ?? "Failed to record audit event.",
      });
    },
  });
}
