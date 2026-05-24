/**
 * @file users.service.ts
 * @description API service for the Users domain.
 *
 * All endpoints require BearerAuth (handled automatically by the request
 * interceptor in axios.client.ts).
 *
 * Endpoints:
 *  GET    /system/users           — List users (paginated + search)
 *  POST   /system/users           — Create a new user
 *  GET    /system/users/{id}      — Get a single user by UUID
 *  PUT    /system/users/{id}      — Update user's full_name and/or role
 *  PATCH  /system/users/{id}/status — Activate or deactivate a user
 *
 * Return types use ApiResponse<T> directly because the Axios success
 * interceptor unwraps the AxiosResponse envelope automatically.
 */

import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/axios.client";
import type {
  ApiResponse,
  PaginatedResult,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  SetStatusRequest,
  UserListParams,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// GET /system/users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a paginated, searchable list of users.
 *
 * @param params.page   Page number (default: 1)
 * @param params.limit  Items per page, max 100 (default: 15)
 * @param params.q      Search keyword — matched against email and full_name
 */
export function listUsers(
  params: UserListParams = {},
): Promise<ApiResponse<PaginatedResult<User>>> {
  return apiGet<PaginatedResult<User>>("/system/users", { params });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /system/users
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new user account.
 * Returns 409 Conflict if the email is already registered.
 *
 * @param payload  email, password (min 8 chars), full_name, role
 */
export function createUser(
  payload: CreateUserRequest,
): Promise<ApiResponse<User>> {
  return apiPost<User>("/system/users", payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /system/users/{id}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a single user's full profile by UUID.
 * Returns 404 if the user does not exist.
 */
export function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiGet<User>(`/system/users/${id}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /system/users/{id}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a user's mutable fields.
 * All payload fields are optional — only provided fields are changed.
 *
 * @param id       UUID of the target user
 * @param payload  Partial update: full_name and/or role
 */
export function updateUser(
  id: string,
  payload: UpdateUserRequest,
): Promise<ApiResponse<User>> {
  return apiPut<User>(`/system/users/${id}`, payload);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /system/users/{id}/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Activates or deactivates a user account.
 *
 * @param id      UUID of the target user
 * @param status  "ACTIVE" | "INACTIVE"
 */
export function setUserStatus(
  id: string,
  status: SetStatusRequest["status"],
): Promise<ApiResponse<null>> {
  return apiPatch<null>(`/system/users/${id}/status`, {
    status,
  } satisfies SetStatusRequest);
}
