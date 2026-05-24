/**
 * @file audit.service.ts
 * @description API service for the Audit Logs domain.
 *
 * Endpoints covered:
 *  GET  /logs         — Query audit logs with pagination and filters
 *  POST /logs/ingest  — Ingest an audit log entry (internal use)
 *  GET  /logs/metrics — Get aggregate audit metrics (logins today, etc.)
 *
 * All calls go through the configured apiClient (Step 1).
 */

import { apiClient } from "@/lib/axios.client";
import type {
  Envelope,
  PaginatedResult,
  AuditLog,
  AuditMetrics,
  AuditFilter,
  IngestAuditRequest,
} from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// GET /logs
// ---------------------------------------------------------------------------

/**
 * Queries audit logs with server-side pagination and optional filters.
 *
 * @param filter.action_type  Filter by action type enum
 * @param filter.user_id      Filter by user UUID
 * @param filter.start_date   RFC3339 datetime string
 * @param filter.end_date     RFC3339 datetime string
 * @param filter.page         Page number (default: 1)
 * @param filter.limit        Items per page, max 100 (default: 15)
 */
export async function queryAuditLogs(
  filter: AuditFilter = {},
): Promise<Envelope<PaginatedResult<AuditLog>>> {
  const res = await apiClient.get<Envelope<PaginatedResult<AuditLog>>>(
    "/system/logs",
    { params: filter },
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// POST /logs/ingest
// ---------------------------------------------------------------------------

/**
 * Ingests a new audit log entry into the system.
 * This is an internal endpoint — typically called by other services,
 * but exposed here for use by the frontend when a significant client-side
 * action occurs (e.g., to record a SECURITY event).
 *
 * Required fields: user_id, user_email, action_type, target_resource
 */
export async function ingestAuditLog(
  payload: IngestAuditRequest,
): Promise<Envelope<null>> {
  const res = await apiClient.post<Envelope<null>>("/system/logs/ingest", payload);
  return res.data;
}

// ---------------------------------------------------------------------------
// GET /logs/metrics
// ---------------------------------------------------------------------------

/**
 * Fetches aggregate audit metrics for dashboard widgets:
 *  - logins_today
 *  - modification_velocity
 *  - security_events
 */
export async function getAuditMetrics(): Promise<Envelope<AuditMetrics>> {
  const res = await apiClient.get<Envelope<AuditMetrics>>("/system/logs/metrics");
  return res.data;
}
