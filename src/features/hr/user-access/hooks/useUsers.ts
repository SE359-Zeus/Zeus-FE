/**
 * @file useUsers.ts
 * @description React Query hooks for the Users domain.
 *
 * Hooks:
 *  useUsers(params)            — Paginated list with search
 *  useUser(id)                 — Single user by UUID
 *  useCreateUser()             — Mutation: POST /users
 *  useUpdateUser()             — Mutation: PUT /users/{id}
 *  useSetUserStatus()          — Mutation: PATCH /users/{id}/status
 *
 * All mutations automatically invalidate the users list cache on success.
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
  listUsers,
  createUser,
  getUserById,
  updateUser,
  setUserStatus,
} from "@/features/hr/user-access/users.service";
import type {
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
  Envelope,
  PaginatedResult,
} from "@/lib/types/api.types";

// ---------------------------------------------------------------------------
// Query Key Factory
// Centralised key factory prevents typos and enables granular invalidation.
// ---------------------------------------------------------------------------

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: UserListParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// useUsers — GET /users
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated + searchable list of users.
 * Updates automatically when `params` change (page, limit, q).
 */
export function useUsers(
  params: UserListParams = {},
  options?: Omit<
    UseQueryOptions<Envelope<PaginatedResult<UserResponse>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    staleTime: 30_000, // 30 seconds
    ...options,
  });
}

// ---------------------------------------------------------------------------
// useUser — GET /users/{id}
// ---------------------------------------------------------------------------

/**
 * Fetches a single user's profile by UUID.
 * Disabled automatically when `id` is falsy.
 */
export function useUser(
  id: string | null | undefined,
  options?: Omit<
    UseQueryOptions<Envelope<UserResponse>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => getUserById(id!),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });
}

// ---------------------------------------------------------------------------
// useCreateUser — POST /users
// ---------------------------------------------------------------------------

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),

    onSuccess: (data) => {
      // Invalidate the whole list so the new user appears immediately
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User Created", {
        description: `${data.data?.full_name} has been added to the system.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string } };
      };
      const msg =
        axiosErr.response?.status === 409
          ? "A user with this email already exists."
          : axiosErr.response?.data?.message ?? "Failed to create user.";
      toast.error("Create Failed", { description: msg });
    },
  });
}

// ---------------------------------------------------------------------------
// useUpdateUser — PUT /users/{id}
// ---------------------------------------------------------------------------

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      updateUser(id, payload),

    onSuccess: (data, { id }) => {
      // Update the individual user cache entry
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      // Also refresh the list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User Updated", {
        description: `${data.data?.full_name}'s profile has been saved.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      toast.error("Update Failed", {
        description:
          axiosErr.response?.data?.message ?? "Failed to update user.",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// useSetUserStatus — PATCH /users/{id}/status
// ---------------------------------------------------------------------------

export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "ACTIVE" | "INACTIVE";
    }) => setUserStatus(id, status),

    onSuccess: (_data, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Status Updated", {
        description: `User has been set to ${status}.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
      };
      toast.error("Status Change Failed", {
        description:
          axiosErr.response?.data?.message ?? "Failed to update user status.",
      });
    },
  });
}
