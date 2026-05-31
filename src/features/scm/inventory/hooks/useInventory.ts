import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { inventoryService } from '../inventory.service'
import type { ComponentStockListParams, CreateComponentStockRequest } from '../inventory.types'

export const inventoryKeys = {
  all: ['inventory-stocks'] as const,
  list: (params: ComponentStockListParams) => ['inventory-stocks', 'list', params] as const,
  detail: (sku: string) => ['inventory-stocks', 'detail', sku] as const,
  metrics: ['inventory-stocks', 'metrics'] as const,
}

export function useComponentStocks(params: ComponentStockListParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => inventoryService.listComponentStocks(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useInventoryMetrics() {
  return useQuery({
    queryKey: inventoryKeys.metrics,
    queryFn: () => inventoryService.getInventoryMetrics(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateComponentStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateComponentStockRequest) => inventoryService.createComponentStock(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all })
      toast.success('Component Added', {
        description: `SKU "${res.data?.sku}" has been registered successfully.`,
      })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to add component'
      toast.error('Add Failed', { description: msg })
    },
  })
}
