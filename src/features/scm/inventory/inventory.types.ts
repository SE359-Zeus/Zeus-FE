export type ComponentStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued'

export interface ComponentStock {
  sku: string
  name: string
  category: string
  stock_qty: number
  reorder_point: number
  unit_cost: number
  status: ComponentStatus
  primary_supplier?: string
  lead_time_days: number
  location: string
  created_at: string
  updated_at: string
}

export interface CreateComponentStockRequest {
  sku: string
  name: string
  category: string
  stock_qty?: number
  reorder_point?: number
  unit_cost: number
  location?: string
  primary_supplier_id?: string
}

export interface ComponentStockListParams {
  status?: string
  q?: string
  page?: number
  limit?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
}

export interface InventoryMetrics {
  total_skus: number
  low_stock: number
  out_of_stock: number
  stock_value: number
}
