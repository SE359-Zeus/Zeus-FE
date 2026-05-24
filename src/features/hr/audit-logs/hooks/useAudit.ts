/**
 * @file useAudit.ts
 * @description React Query hooks for the Audit Logs domain.
 *
 * Hooks:
 *  useAuditLogs(filter)   — Paginated audit log query with filters
 *  useAuditMetrics()      — Aggregate metrics for dashboard widgets
 *  useIngestAudit()       — Mutation: POST /logs/ingest
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
} from "@/features/hr/audit-logs/audit.service";
import type {
  AuditFilter,
  AuditLog,
  AuditMetrics,
  Envelope,
  PaginatedResult,
  IngestAuditRequest,
} from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Query Key Factory
// ---------------------------------------------------------------------------

export const auditKeys = {
  all: ["audit"] as const,
  logs: () => [...auditKeys.all, "logs"] as const,
  log: (filter: AuditFilter) => [...auditKeys.logs(), filter] as const,
  metrics: () => [...auditKeys.all, "metrics"] as const,
};

// ---------------------------------------------------------------------------
// useAuditLogs — GET /logs
// ---------------------------------------------------------------------------

/**
 * Fetches paginated audit logs with optional filters.
 * Refetches automatically when `filter` changes.
 *
 * @param filter  action_type, user_id, start_date, end_date, page, limit
 */
export function useAuditLogs(
  filter: AuditFilter = {},
  options?: Omit<
    UseQueryOptions<Envelope<PaginatedResult<AuditLog>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: auditKeys.log(filter),
    queryFn: () => queryAuditLogs(filter),
    staleTime: 15_000, // Logs change frequently — shorter stale window
    refetchInterval: filter ? undefined : 30_000, // Auto-refresh when no filter active
    ...options,
  });
}

// ---------------------------------------------------------------------------
// useAuditMetrics — GET /logs/metrics
// ---------------------------------------------------------------------------

/**
 * Fetches aggregate audit metrics:
 *  - logins_today
 *  - modification_velocity
 *  - security_events
 *
 * Refetches every 60 seconds for live dashboard widgets.
 */
export function useAuditMetrics(
  options?: Omit<
    UseQueryOptions<Envelope<AuditMetrics>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: auditKeys.metrics(),
    queryFn: getAuditMetrics,
    staleTime: 60_000,
    refetchInterval: 60_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// useIngestAudit — POST /logs/ingest
// ---------------------------------------------------------------------------

/**
 * Mutation to ingest a new audit log entry.
 * Invalidates the logs cache on success so the new entry appears.
 */
export function useIngestAudit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IngestAuditRequest) => ingestAuditLog(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: auditKeys.logs() });
      queryClient.invalidateQueries({ queryKey: auditKeys.metrics() });
    },

    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      toast.error("Audit Log Failed", {
        description:
          axiosErr.response?.data?.message ?? "Failed to record audit event.",
      });
    },
  });
}
