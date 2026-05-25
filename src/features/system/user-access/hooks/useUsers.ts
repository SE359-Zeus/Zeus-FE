/**
 * @file useUsers.ts
 * @description React Query hooks for the Users domain.
 *
 * All hooks use ApiResponse<T> as their query data type, which matches
 * the return type of the service functions (interceptor already unwrapped
 * the AxiosResponse shell).
 *
 * Access pattern in components:
 *   const { data } = useUsers()
 *   data?.data?.items   → User[]
 *   data?.data?.pagination → PaginationMeta
 *   data?.message       → string
 *   data?.statusCode    → number
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
} from "@/features/system/user-access/users.service";
import type {
  ApiResponse,
  PaginatedResult,
  User,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
} from "@/lib/types/api.types";

// ─────────────────────────────────────────────────────────────────────────────
// Query Key Factory
// ─────────────────────────────────────────────────────────────────────────────

export const userKeys = {
  all:     ["users"] as const,
  lists:   ()         => [...userKeys.all, "list"] as const,
  list:    (p: UserListParams) => [...userKeys.lists(), p] as const,
  details: ()         => [...userKeys.all, "detail"] as const,
  detail:  (id: string) => [...userKeys.details(), id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// useUsers — GET /system/users
// ─────────────────────────────────────────────────────────────────────────────

export function useUsers(
  params: UserListParams = {},
  options?: Omit<
    UseQueryOptions<ApiResponse<PaginatedResult<User>>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn:  () => listUsers(params),
    staleTime: 30_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUser — GET /system/users/{id}
// ─────────────────────────────────────────────────────────────────────────────

export function useUser(
  id: string | null | undefined,
  options?: Omit<
    UseQueryOptions<ApiResponse<User>>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn:  () => getUserById(id!),
    enabled:  !!id,
    staleTime: 60_000,
    ...options,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useCreateUser — POST /system/users
// ─────────────────────────────────────────────────────────────────────────────

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => createUser(payload),

    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User Created", {
        description: `${response.data?.full_name} has been added to the system.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: ApiResponse<null> } };
      const msg =
        axiosErr.response?.status === 409
          ? "A user with this email already exists."
          : axiosErr.response?.data?.message ?? "Failed to create user.";
      toast.error("Create Failed", { description: msg });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useUpdateUser — PUT /system/users/{id}
// ─────────────────────────────────────────────────────────────────────────────

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserRequest }) =>
      updateUser(id, payload),

    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("User Updated", {
        description: `${response.data?.full_name}'s profile has been saved.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } };
      toast.error("Update Failed", {
        description: axiosErr.response?.data?.message ?? "Failed to update user.",
      });
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// useSetUserStatus — PATCH /system/users/{id}/status
// ─────────────────────────────────────────────────────────────────────────────

export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) =>
      setUserStatus(id, status),

    onSuccess: (_response, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success("Status Updated", {
        description: `User account has been set to ${status}.`,
      });
    },

    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } };
      toast.error("Status Change Failed", {
        description: axiosErr.response?.data?.message ?? "Failed to update user status.",
      });
    },
  });
}
