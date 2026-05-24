/**
 * @file api.types.ts
 * @description Centralised TypeScript types generated from the Zeus System API
 * OpenAPI 3.0.3 specification (https://zeus.ryanandexen.qzz.io/system/docs/).
 * All shapes here are 1-to-1 with the backend schema definitions.
 */

// ---------------------------------------------------------------------------
// Shared / Envelope
// ---------------------------------------------------------------------------

/** Standard API response wrapper used by every endpoint. */
export interface Envelope<T = unknown> {
  statusCode: number;
  message: string;
  metadata: Record<string, unknown>;
  data: T | null;
}

export interface ErrorEnvelope extends Envelope<null> {}

/** Pagination metadata returned by list endpoints. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total_rows: number;
  total_pages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string; // format: email
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

/** Returned by /auth/login and /auth/refresh */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string; // e.g. "Bearer"
  expires_in: number; // seconds
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type UserRole = "Admin" | "Editor" | "Viewer";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface UserResponse {
  id: string; // uuid
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string; // date-time
  updated_at: string; // date-time
  last_login_at: string | null; // date-time, nullable
}

export interface CreateUserRequest {
  email: string; // format: email
  password: string; // minLength: 8
  full_name: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  full_name?: string;
  role?: UserRole;
}

export interface SetStatusRequest {
  status: UserStatus;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export type AuditActionType =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SECURITY";

export interface AuditLog {
  id: string; // uuid
  user_id: string; // uuid
  user_email: string;
  action_type: AuditActionType;
  target_resource: string;
  details: string;
  ip_address: string;
  is_security_event: boolean;
  timestamp: string; // date-time
}

export interface AuditMetrics {
  logins_today: number;
  modification_velocity: number;
  security_events: number;
}

export interface AuditFilter {
  action_type?: AuditActionType;
  user_id?: string; // uuid
  start_date?: string; // date-time (RFC3339)
  end_date?: string; // date-time (RFC3339)
  page?: number;
  limit?: number;
}

export interface IngestAuditRequest {
  user_id: string; // uuid, required
  user_email: string; // required
  action_type: AuditActionType; // required
  target_resource: string; // required
  details?: string;
  ip_address?: string;
  is_security_event?: boolean;
}

// ---------------------------------------------------------------------------
// User list query params
// ---------------------------------------------------------------------------

export interface UserListParams {
  page?: number;
  limit?: number;
  q?: string;
}
