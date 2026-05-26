/**
 * @file index.ts
 * @description Barrel export for all shared library modules.
 */

// HTTP client & typed wrappers
export {
  apiClient,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  refreshTokenSilently,
  API_BASE_URL,
} from "./axios.client";

// Auth store (Zustand — in-memory only)
export {
  useAuthStore,
  getAccessToken,
  setAccessToken,
  clearAuth,
} from "./stores/auth.store";

// Utility helpers
export { cn } from "./utils";

// ── Types ────────────────────────────────────────────────────────────────────
// § Envelope
export type { ApiResponse, PaginationMeta, PaginatedResult } from "./types/api.types";

// § Authentication
export type { LoginRequest, RefreshRequest, TokenPair, LoginData } from "./types/api.types";

// § Users
export type {
  UserRole,
  UserStatus,
  User,
  UserResponse,         // backward-compat alias
  CreateUserRequest,
  UpdateUserRequest,
  SetStatusRequest,
  UserListParams,
} from "./types/api.types";

// § Audit
export type {
  AuditActionType,
  AuditLog,
  AuditMetrics,
  AuditFilter,
  IngestAuditRequest,
} from "./types/api.types";
