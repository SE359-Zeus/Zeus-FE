/**
 * @file api.types.ts
 * @description Canonical TypeScript types for the Zeus System API.
 *
 * Sources:
 *  - OpenAPI 3.0.3 spec: https://zeus.ryanandexen.qzz.io/system/docs/openapi.json
 *  - All schemas parsed 1-to-1 from #/components/schemas
 *
 * ─── Envelope Pattern ────────────────────────────────────────────────────────
 *
 *  Every response from the backend is wrapped in a standard envelope:
 *
 *    {
 *      "statusCode": 200,
 *      "message":    "success",
 *      "data":       <T>,           ← the actual payload (generic)
 *      "metadata":   { ... }        ← pagination, trace IDs, etc.
 *    }
 *
 *  The generic interface `ApiResponse<T>` models this envelope.
 *  The Axios response interceptor "unwraps" the raw AxiosResponse so that
 *  every awaited call already returns `ApiResponse<T>` directly —
 *  callers never handle the outer AxiosResponse shell.
 *
 * ─── Naming Conventions ──────────────────────────────────────────────────────
 *
 *  ApiResponse<T>           — The envelope wrapper (4-field structure)
 *  PaginatedResult<T>       — data payload for paginated list endpoints:
 *                             { items: T[], pagination: PaginationMeta }
 *  Model interfaces         — Named after the OpenAPI schema (User, AuditLog…)
 *  Request interfaces       — Suffixed with "Request"  (LoginRequest, etc.)
 *  Params interfaces        — Suffixed with "Params"   (UserListParams, etc.)
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Envelope / ApiResponse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The universal response envelope returned by every Zeus API endpoint.
 *
 * @template T  The shape of the `data` field (the actual payload).
 *              Use `null` for endpoints that return no payload.
 *
 * @example
 *   // Single-resource endpoint
 *   ApiResponse<User>
 *
 *   // Paginated list endpoint
 *   ApiResponse<PaginatedResult<User>>
 *
 *   // Action endpoint with no payload
 *   ApiResponse<null>
 */
export interface ApiResponse<T = unknown> {
  /** HTTP status code mirrored in the body (e.g. 200, 201, 401). */
  statusCode: number;

  /** Human-readable status message (e.g. "success", "user not found"). */
  message: string;

  /**
   * The actual response payload.
   * `null` when the endpoint performs an action and returns no entity.
   */
  data: T | null;

  /**
   * Freeform server-side metadata.
   * Pagination info appears inside `data` for list endpoints.
   * This field is reserved for trace IDs, feature flags, etc.
   */
  metadata: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Pagination
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pagination metadata attached to every list response.
 * Comes inside the `data` field as `{ items, pagination }`.
 *
 * @schema PaginationMeta
 */
export interface PaginationMeta {
  /** Current page number (1-based). */
  page: number;
  /** Number of items requested per page. */
  limit: number;
  /** Total number of matching rows across all pages. */
  total_rows: number;
  /** Total number of pages (`ceil(total_rows / limit)`). */
  total_pages: number;
}

/**
 * Shape of `data` for paginated list endpoints.
 * Paired with `ApiResponse<PaginatedResult<T>>`.
 *
 * @template T  The item model (e.g. User, AuditLog).
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Authentication Models
// Source: #/components/schemas/{LoginRequest, RefreshRequest, TokenPair}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request body for POST /system/auth/login.
 * @schema LoginRequest
 */
export interface LoginRequest {
  /** Must be a valid email address (format: email). */
  email: string;
  /** Plain-text password. */
  password: string;
}

/**
 * Request body for POST /system/auth/refresh.
 * @schema RefreshRequest
 */
export interface RefreshRequest {
  /** The refresh token previously issued by /auth/login or /auth/refresh. */
  refresh_token: string;
}

/**
 * Token pair returned by /auth/login and /auth/refresh.
 * @schema TokenPair
 */
export interface TokenPair {
  /** Short-lived JWT for API authorization. */
  access_token: string;
  /** Long-lived token used to obtain new access tokens. */
  refresh_token: string;
  /** Token type, always "Bearer". */
  token_type: string;
  /** Seconds until the access_token expires. */
  expires_in: number;
}

/**
 * Minimal response payload from POST /auth/login.
 * The login endpoint only returns tokens, not the full TokenPair schema.
 */
export interface LoginData {
  access_token: string;
  refresh_token: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. User Models
// Source: #/components/schemas/{UserResponse, CreateUserRequest,
//          UpdateUserRequest, SetStatusRequest}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Possible roles for a system user.
 * Controls permission levels throughout the application.
 */
export type UserRole = "Admin" | "Editor" | "Viewer";

/**
 * Lifecycle status of a user account.
 */
export type UserStatus = "ACTIVE" | "INACTIVE";

/**
 * Full user profile as returned by the API.
 * @schema UserResponse
 */
export interface User {
  /** UUID v4 identifier. */
  id: string;
  /** Email address (unique, immutable after creation). */
  email: string;
  /** Display name. */
  full_name: string;
  /** Access control role. */
  role: UserRole;
  /** Account lifecycle status. */
  status: UserStatus;
  /** ISO 8601 creation timestamp. */
  created_at: string;
  /** ISO 8601 last-update timestamp. */
  updated_at: string;
  /**
   * ISO 8601 timestamp of the user's most recent successful login.
   * `null` if the user has never logged in.
   */
  last_login_at: string | null;
}

/**
 * @deprecated Use `User` instead.
 * Kept as an alias for backward compatibility with existing view components.
 */
export type UserResponse = User;

/**
 * Request body for POST /system/users.
 * @schema CreateUserRequest
 */
export interface CreateUserRequest {
  /** Must be a valid email address. Returns 409 if already taken. */
  email: string;
  /** Plain-text initial password — minimum 8 characters. */
  password: string;
  /** User's display name. */
  full_name: string;
  /** Initial access control role. */
  role: UserRole;
}

/**
 * Request body for PUT /system/users/{id}.
 * All fields optional — only provided fields are modified.
 * @schema UpdateUserRequest
 */
export interface UpdateUserRequest {
  full_name?: string;
  role?: UserRole;
}

/**
 * Request body for PATCH /system/users/{id}/status.
 * @schema SetStatusRequest
 */
export interface SetStatusRequest {
  status: UserStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. Audit Log Models
// Source: #/components/schemas/{AuditLog, AuditMetrics,
//          AuditFilter, IngestAuditRequest}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Enumeration of auditable action types.
 * Maps to the `action_type` field of AuditLog.
 */
export type AuditActionType =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SECURITY";

/**
 * A single immutable audit log entry.
 * @schema AuditLog
 */
export interface AuditLog {
  /** UUID v4 identifier of this log entry. */
  id: string;
  /** UUID of the user who performed the action. */
  user_id: string;
  /** Email of the user at the time of the action. */
  user_email: string;
  /** Categorised action that was performed. */
  action_type: AuditActionType;
  /** The resource that was acted upon (e.g. "User", "Purchase Order"). */
  target_resource: string;
  /** Human-readable description of what happened. */
  details: string;
  /** IPv4 or IPv6 address of the client. */
  ip_address: string;
  /** Whether this entry should be treated as a security-relevant event. */
  is_security_event: boolean;
  /** ISO 8601 timestamp when the action occurred. */
  timestamp: string;
}

/**
 * Aggregate metrics returned by GET /system/logs/metrics.
 * Used to power dashboard summary widgets.
 * @schema AuditMetrics
 */
export interface AuditMetrics {
  /** Number of successful login events recorded today. */
  logins_today: number;
  /**
   * Rate of create/update/delete events (server-defined window).
   * Useful for anomaly detection dashboards.
   */
  modification_velocity: number;
  /** Total number of entries with `is_security_event = true`. */
  security_events: number;
}

/**
 * Query parameters for GET /system/logs.
 * All fields are optional — omit to fetch all logs.
 * @schema AuditFilter
 */
export interface AuditFilter {
  /** Filter by action category. */
  action_type?: AuditActionType;
  /** Filter by the acting user's UUID. */
  user_id?: string;
  /** Return only entries at or after this timestamp (RFC 3339). */
  start_date?: string;
  /** Return only entries at or before this timestamp (RFC 3339). */
  end_date?: string;
  /** Page number (default: 1). */
  page?: number;
  /** Items per page, max 100 (default: 15). */
  limit?: number;
}

/**
 * Request body for POST /system/logs/ingest.
 * Used to record a significant frontend action into the audit trail.
 * @schema IngestAuditRequest
 */
export interface IngestAuditRequest {
  /** UUID of the acting user. Required. */
  user_id: string;
  /** Email of the acting user. Required. */
  user_email: string;
  /** Action category. Required. */
  action_type: AuditActionType;
  /** Resource that was acted upon. Required. */
  target_resource: string;
  /** Optional human-readable description. */
  details?: string;
  /** Optional client IP address. */
  ip_address?: string;
  /** Flag this entry as a security event. */
  is_security_event?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6. Query / List Params
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Query parameters for GET /system/users.
 */
export interface UserListParams {
  /** Page number (default: 1). */
  page?: number;
  /** Items per page, max 100 (default: 15). */
  limit?: number;
  /** Search keyword — matched against email and full_name. */
  q?: string;
}
