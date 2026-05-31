/**
 * @file usePurchaseOrders.ts
 * @description TanStack React Query hooks for SCM Purchase Orders.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "../purchase-order.service";
import type {
  POListParams,
  CreateCustomPORequest,
  CreatePODraftRequest,
  AddLineItemRequest,
  TransitionPOStateRequest,
} from "../purchase-order.types";

export const purchaseOrderKeys = {
  all: ["purchaseOrders"] as const,
  lists: () => [...purchaseOrderKeys.all, "list"] as const,
  list: (p: POListParams) => [...purchaseOrderKeys.lists(), p] as const,
  details: (id: string) => [...purchaseOrderKeys.all, "detail", id] as const,
};

/**
 * Hook to query list of Purchase Orders with pagination, keyword search, status, and sorting filters.
 */
export function usePurchaseOrders(params: POListParams = {}) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(params),
    queryFn: () => purchaseOrderService.listPurchaseOrders(params),
  });
}

/**
 * Hook to query full details of a single Purchase Order by ID, including its preloaded line items.
 */
export function usePurchaseOrderDetails(poId: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.details(poId),
    queryFn: () => purchaseOrderService.getPurchaseOrder(poId),
    enabled: !!poId,
  });
}

/**
 * Hook to mutationally create a custom Purchase Order.
 */
export function useCreateCustomPO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomPORequest) => purchaseOrderService.createCustomPO(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/**
 * Hook to mutationally create a new Purchase Order Draft.
 */
export function useCreatePODraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePODraftRequest) => purchaseOrderService.createPODraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

/**
 * Hook to mutationally approve a Purchase Order Draft (transitioning it to Approved).
 */
export function useApprovePO() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (poId: string) => purchaseOrderService.approvePO(poId),
    onSuccess: (_, poId) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.details(poId) });
    },
  });
}

/**
 * Hook to mutationally append a line item to a Purchase Order, locking component slots eagerly.
 */
export function useAddLineItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, payload }: { poId: string; payload: AddLineItemRequest }) =>
      purchaseOrderService.addLineItem(poId, payload),
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.details(poId) });
    },
  });
}

/**
 * Hook to transition a Purchase Order state forward (Approved -> In Transit -> Received/Partial).
 */
export function useTransitionPOState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ poId, payload }: { poId: string; payload: TransitionPOStateRequest }) =>
      purchaseOrderService.transitionPOState(poId, payload),
    onSuccess: (_, { poId }) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.details(poId) });
    },
  });
}
