/**
 * @file useSuppliers.ts
 * @description React Query hooks for the SCM Supplier (Vendor) module.
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierService } from "../supplier.service";
import type { ApiResponse, PaginatedResult } from "@/lib";
import type {
  Supplier,
  SupplierMetrics,
  CreateSupplierRequest,
  CreateSkuMappingRequest,
  SupplierListParams,
} from "../supplier.types";

export const supplierKeys = {
  all: ["suppliers"] as const,
  lists: () => [...supplierKeys.all, "list"] as const,
  list: (p: SupplierListParams) => [...supplierKeys.lists(), p] as const,
  metrics: () => [...supplierKeys.all, "metrics"] as const,
};

export function useSuppliers(params: SupplierListParams = {}) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => supplierService.listSuppliers(params),
  });
}

export function useSupplierMetrics() {
  return useQuery({
    queryKey: supplierKeys.metrics(),
    queryFn: () => supplierService.getMetrics(),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierRequest) => supplierService.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.metrics() });
    },
  });
}

export function useCreateSkuMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, payload }: { supplierId: string; payload: CreateSkuMappingRequest }) =>
      supplierService.createSkuMapping(supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
}
