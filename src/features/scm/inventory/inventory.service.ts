import { apiGet, apiPost } from '@/lib/axios.client'
import type { ApiResponse, PaginatedResult } from '@/lib/types/api.types'
import type {
  ComponentStock,
  CreateComponentStockRequest,
  ComponentStockListParams,
} from './inventory.types'

const SCM_BASE = '/scm'

export const inventoryService = {
  async listComponentStocks(
    params?: ComponentStockListParams,
  ): Promise<ApiResponse<PaginatedResult<ComponentStock>>> {
    return apiGet<PaginatedResult<ComponentStock>>(`${SCM_BASE}/inventory/stocks`, { params })
  },

  async createComponentStock(
    data: CreateComponentStockRequest,
  ): Promise<ApiResponse<ComponentStock>> {
    return apiPost<ComponentStock>(`${SCM_BASE}/inventory/stocks`, data)
  },

  async getStockBySKU(sku: string): Promise<ApiResponse<ComponentStock>> {
    return apiGet<ComponentStock>(`${SCM_BASE}/inventory/stocks/${sku}`)
  },

  async getInventoryMetrics(): Promise<ApiResponse<import('./inventory.types').InventoryMetrics>> {
    return apiGet<import('./inventory.types').InventoryMetrics>(`${SCM_BASE}/inventory/metrics`)
  },
}

