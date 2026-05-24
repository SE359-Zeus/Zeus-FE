/**
 * @file index.ts
 * @description Barrel export for all shared library modules.
 */

// HTTP client & typed helpers
export {
  apiClient,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  storeRefreshToken,
  clearRefreshToken,
  API_BASE_URL,
} from "./axios.client";

// Auth store (Zustand)
export {
  useAuthStore,
  getAccessToken,
  setAccessToken,
  clearAuth,
} from "./stores/auth.store";

// Utility helpers
export { cn } from "./utils";

// Types
export type {
  Envelope,
  ErrorEnvelope,
  PaginationMeta,
  PaginatedResult,
  LoginRequest,
  RefreshRequest,
  TokenPair,
  UserRole,
  UserStatus,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  SetStatusRequest,
  AuditActionType,
  AuditLog,
  AuditMetrics,
  AuditFilter,
  IngestAuditRequest,
  UserListParams,
} from "./types/api.types";
