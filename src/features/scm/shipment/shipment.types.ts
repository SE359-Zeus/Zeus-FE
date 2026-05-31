/**
 * @file shipment.types.ts
 * @description TypeScript types for the SCM Shipment module.
 * Matches the backend OpenAPI spec and GORM Shipment model.
 */

import type { ApiResponse, PaginatedResult } from '@/lib'

// ─── Status enums ─────────────────────────────────────────────────────────────

export type ShipmentStatus = 'Scheduled' | 'In Transit' | 'Delivered' | 'Delayed'

// ─── Domain models ────────────────────────────────────────────────────────────

export interface ShipmentItem {
  id: string
  shipment_id: string
  sku: string
  description: string
  qty: number
}

export interface Carrier {
  id: number
  name: string
  code: string
}

export interface Shipment {
  id: string
  po_ref: string
  supplier_name?: string
  status: ShipmentStatus
  carrier: string
  tracking_no?: string
  origin?: string
  ship_date: string
  eta?: string
  created_at: string
  updated_at: string
  items?: ShipmentItem[]
}

export interface ShipmentMetrics {
  total_shipments: number
  in_transit: number
  delayed: number
  on_time_rate: number
}

// ─── Request / Response types ─────────────────────────────────────────────────

export interface ShipmentListParams {
  page?: number
  limit?: number
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
  status?: string
}

export interface CreateShipmentRequest {
  po_ref: string
  supplier_id: string       // UUID of the supplier
  carrier: string
  tracking_no?: string
  origin?: string
  ship_date?: string        // ISO datetime string
}

export interface AcquireDispatchLockRequest {
  operator_id: string
}

export interface DispatchShipmentRequest {
  operator_id: string
  carrier?: string
  tracking_no?: string
}

export interface MarkDeliveredRequest {
  operator_id: string
}

export interface TransitionShipmentStateRequest {
  new_state: ShipmentStatus
}

// ─── Convenience aliases ──────────────────────────────────────────────────────

export type ShipmentListResponse = ApiResponse<PaginatedResult<Shipment> | Shipment[]>
export type ShipmentDetailResponse = ApiResponse<Shipment>
export type ShipmentMetricsResponse = ApiResponse<ShipmentMetrics>
export type CarrierListResponse = ApiResponse<Carrier[]>
