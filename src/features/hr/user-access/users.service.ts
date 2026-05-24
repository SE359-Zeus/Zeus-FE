/**
 * @file users.service.ts
 * @description API service for the Users domain.
 *
 * Endpoints covered (all require BearerAuth):
 *  GET    /users           — List users with pagination + search
 *  POST   /users           — Create a new user
 *  GET    /users/{id}      — Get user by UUID
 *  PUT    /users/{id}      — Update user's full_name and/or role
 *  PATCH  /users/{id}/status — Activate or deactivate a user
 *
 * Every call goes through the configured apiClient (Step 1) which:
 *  - Attaches Authorization: Bearer <token> automatically
 *  - Handles 401 → silent refresh → retry
 */

import { apiClient } from "@/lib/axios.client";
import type {
  Envelope,
  PaginatedResult,
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  SetStatusRequest,
  UserListParams,
} from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------

/**
 * Lists all users with server-side pagination and optional search.
 *
 * @param params.page   Page number (default: 1)
 * @param params.limit  Items per page, max 100 (default: 15)
 * @param params.q      Search keyword — matches email and full_name
 */
export async function listUsers(
  params: UserListParams = {},
): Promise<Envelope<PaginatedResult<UserResponse>>> {
  const res = await apiClient.get<Envelope<PaginatedResult<UserResponse>>>(
    "/system/users",
    { params },
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// POST /users
// ---------------------------------------------------------------------------

/**
 * Creates a new user account.
 * Returns 409 if the email already exists.
 *
 * @param payload  email, password (min 8 chars), full_name, role
 */
export async function createUser(
  payload: CreateUserRequest,
): Promise<Envelope<UserResponse>> {
  const res = await apiClient.post<Envelope<UserResponse>>("/system/users", payload);
  return res.data;
}

// ---------------------------------------------------------------------------
// GET /users/{id}
// ---------------------------------------------------------------------------

/**
 * Fetches a single user's profile by their UUID.
 * Returns 404 if not found.
 */
export async function getUserById(
  id: string,
): Promise<Envelope<UserResponse>> {
  const res = await apiClient.get<Envelope<UserResponse>>(`/system/users/${id}`);
  return res.data;
}

// ---------------------------------------------------------------------------
// PUT /users/{id}
// ---------------------------------------------------------------------------

/**
 * Updates a user's full_name and/or role.
 * All fields are optional — only provided fields are modified.
 */
export async function updateUser(
  id: string,
  payload: UpdateUserRequest,
): Promise<Envelope<UserResponse>> {
  const res = await apiClient.put<Envelope<UserResponse>>(
    `/system/users/${id}`,
    payload,
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// PATCH /users/{id}/status
// ---------------------------------------------------------------------------

/**
 * Activates or deactivates a user.
 *
 * @param id      User UUID
 * @param status  "ACTIVE" | "INACTIVE"
 */
export async function setUserStatus(
  id: string,
  status: SetStatusRequest["status"],
): Promise<Envelope<null>> {
  const res = await apiClient.patch<Envelope<null>>(`/system/users/${id}/status`, {
    status,
  } satisfies SetStatusRequest);
  return res.data;
}
