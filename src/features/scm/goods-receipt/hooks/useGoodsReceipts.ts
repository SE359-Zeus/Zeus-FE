/**
 * @file useGoodsReceipts.ts
 * @description React Query hooks for the SCM Goods Receipt module.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goodsReceiptService } from "../goods-receipt.service";
import type {
  GoodsReceipt,
  GoodsReceiptMetrics,
  GoodsReceiptListParams,
  ProcessBlindReceiptRequest,
} from "../goods-receipt.types";

// PO query key prefix — mirrors purchaseOrderKeys.all from usePurchaseOrders.ts
const PO_QUERY_KEY = ["purchaseOrders"] as const;

export const goodsReceiptKeys = {
  all: ["goodsReceipts"] as const,
  lists: () => [...goodsReceiptKeys.all, "list"] as const,
  list: (p: GoodsReceiptListParams) => [...goodsReceiptKeys.lists(), p] as const,
  details: (id: string) => [...goodsReceiptKeys.all, "detail", id] as const,
  metrics: () => [...goodsReceiptKeys.all, "metrics"] as const,
};

export function useGoodsReceipts(params: GoodsReceiptListParams = {}) {
  return useQuery({
    queryKey: goodsReceiptKeys.list(params),
    queryFn: () => goodsReceiptService.listGoodsReceipts(params),
  });
}

export function useGoodsReceiptDetails(grId: string) {
  return useQuery({
    queryKey: goodsReceiptKeys.details(grId),
    queryFn: () => goodsReceiptService.getGoodsReceipt(grId),
    enabled: !!grId,
  });
}

export function useGoodsReceiptMetrics() {
  return useQuery({
    queryKey: goodsReceiptKeys.metrics(),
    queryFn: () => goodsReceiptService.getMetrics(),
  });
}

export function useAcquireLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grId, operatorId }: { grId: string; operatorId: string }) =>
      goodsReceiptService.acquireLock(grId, operatorId),
    onSuccess: (_, { grId }) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.details(grId) });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.metrics() });
    },
  });
}

export function useReleaseLock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (grId: string) => goodsReceiptService.releaseLock(grId),
    onSuccess: (_, grId) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.details(grId) });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.metrics() });
    },
  });
}

export function useProcessBlindReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ grId, payload }: { grId: string; payload: ProcessBlindReceiptRequest }) =>
      goodsReceiptService.processBlindReceipt(grId, payload),
    onSuccess: (_, { grId }) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.details(grId) });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.metrics() });
      // Processing a GR transitions the linked PO status (In Transit → Received/Partial)
      // Invalidate PO queries so the Purchase Order page reflects the change immediately.
      queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY });
    },
  });
}

