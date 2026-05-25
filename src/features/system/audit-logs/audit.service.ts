/**
 * @file audit.service.ts
 * @description API service for the Audit Logs domain.
 *
 * Endpoints:
 *  GET  /system/logs          — Query logs with pagination and filters
 *  POST /system/logs/ingest   — Ingest a new audit log entry (internal)
 *  GET  /system/logs/metrics  — Aggregate metrics for dashboard widgets
 */

import { apiGet, apiPost } from "@/lib/axios.client";
import type {
  ApiResponse,
  PaginatedResult,
  AuditLog,
  AuditMetrics,
  AuditFilter,
  IngestAuditRequest,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// GET /system/logs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Queries audit logs with server-side pagination and optional filters.
 *
 * @param filter.action_type  Filter by action category enum
 * @param filter.user_id      Filter by the acting user's UUID
 * @param filter.start_date   RFC 3339 lower-bound timestamp
 * @param filter.end_date     RFC 3339 upper-bound timestamp
 * @param filter.page         Page number (default: 1)
 * @param filter.limit        Items per page, max 100 (default: 15)
 */
export function queryAuditLogs(
  filter: AuditFilter = {},
): Promise<ApiResponse<PaginatedResult<AuditLog>>> {
  return apiGet<PaginatedResult<AuditLog>>("/system/logs", { params: filter });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/logs/ingest
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ingests a new audit log entry into the immutable audit trail.
 *
 * Intended for internal / frontend-initiated events (e.g. recording a
 * client-side SECURITY event). Required fields: user_id, user_email,
 * action_type, target_resource.
 *
 * @param payload  IngestAuditRequest — see type definition for required fields
 */
export function ingestAuditLog(
  payload: IngestAuditRequest,
): Promise<ApiResponse<null>> {
  return apiPost<null>("/system/logs/ingest", payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /system/logs/metrics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches aggregate audit metrics for dashboard summary widgets:
 *  - logins_today          — login events recorded today
 *  - modification_velocity — rate of create/update/delete events
 *  - security_events       — count of is_security_event = true entries
 */
export function getAuditMetrics(): Promise<ApiResponse<AuditMetrics>> {
  return apiGet<AuditMetrics>("/system/logs/metrics");
}
