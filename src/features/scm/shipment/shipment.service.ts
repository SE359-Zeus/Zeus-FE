/**
 * @file shipment.service.ts
 * @description API service functions for the SCM Shipment module.
 *
 * Base URL: /api/v1 (configured via NEXT_PUBLIC_API_BASE_URL)
 * Module prefix: /scm/shipments
 *
 * ─── Endpoints ────────────────────────────────────────────────────────────────
 *  GET    /scm/shipments                         — list with pagination + status filter
 *  GET    /scm/shipments/metrics                 — KPI dashboard metrics
 *  GET    /scm/shipments/carriers                — carrier dropdown list
 *  POST   /scm/shipments                         — create new shipment (validates PO exists)
 *  GET    /scm/shipments/{shipmentId}            — get details (items + supplier)
 *  POST   /scm/shipments/{shipmentId}/lock       — acquire 30-min dispatch lock
 *  POST   /scm/shipments/{shipmentId}/dispatch   — dispatch (Scheduled → In Transit, deducts inventory)
 *  POST   /scm/shipments/{shipmentId}/deliver    — mark delivered (auto-creates GoodsReceipt)
 *  PUT    /scm/shipments/{shipmentId}/state      — generic state transition
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/axios.client'
import type {
  ShipmentListParams,
  CreateShipmentRequest,
  AcquireDispatchLockRequest,
  DispatchShipmentRequest,
  MarkDeliveredRequest,
  TransitionShipmentStateRequest,
  Shipment,
  ShipmentMetrics,
  Carrier,
} from './shipment.types'
import type { ApiResponse, PaginatedResult } from '@/lib'

function buildQuery(params: ShipmentListParams): string {
  const q = new URLSearchParams()
  if (params.page)     q.set('page',     String(params.page))
  if (params.limit)    q.set('limit',    String(params.limit))
  if (params.sort_by)  q.set('sort_by',  params.sort_by)
  if (params.sort_dir) q.set('sort_dir', params.sort_dir)
  if (params.status)   q.set('status',   params.status)
  const qs = q.toString()
  return qs ? `?${qs}` : ''
}

export const shipmentService = {
  /** GET /scm/shipments — paginated list */
  listShipments(params: ShipmentListParams = {}): Promise<ApiResponse<PaginatedResult<Shipment> | Shipment[]>> {
    return apiGet(`/scm/shipments${buildQuery(params)}`)
  },

  /** GET /scm/shipments/metrics — KPI metrics */
  getMetrics(): Promise<ApiResponse<ShipmentMetrics>> {
    return apiGet('/scm/shipments/metrics')
  },

  /** GET /scm/shipments/carriers — carrier list for dropdown */
  getCarriers(): Promise<ApiResponse<Carrier[]>> {
    return apiGet('/scm/shipments/carriers')
  },

  /** POST /scm/shipments — create a new shipment */
  createShipment(payload: CreateShipmentRequest): Promise<ApiResponse<Shipment>> {
    return apiPost('/scm/shipments', payload)
  },

  /** GET /scm/shipments/{shipmentId} — detailed shipment with items */
  getShipment(shipmentId: string): Promise<ApiResponse<Shipment>> {
    return apiGet(`/scm/shipments/${encodeURIComponent(shipmentId)}`)
  },

  /** POST /scm/shipments/{shipmentId}/lock — acquire 30-min dispatch lock */
  acquireDispatchLock(shipmentId: string, payload: AcquireDispatchLockRequest): Promise<ApiResponse<unknown>> {
    return apiPost(`/scm/shipments/${encodeURIComponent(shipmentId)}/lock`, payload)
  },

  /** DELETE /scm/shipments/{shipmentId}/lock — release dispatch lock */
  releaseDispatchLock(shipmentId: string): Promise<ApiResponse<unknown>> {
    return apiDelete(`/scm/shipments/${encodeURIComponent(shipmentId)}/lock`)
  },

  /** POST /scm/shipments/{shipmentId}/dispatch — dispatch shipment (Scheduled → In Transit) */
  dispatchShipment(shipmentId: string, payload: DispatchShipmentRequest): Promise<ApiResponse<unknown>> {
    return apiPost(`/scm/shipments/${encodeURIComponent(shipmentId)}/dispatch`, payload)
  },

  /** POST /scm/shipments/{shipmentId}/deliver — mark delivered (auto-creates GoodsReceipt linked to PO) */
  markDelivered(shipmentId: string, payload: MarkDeliveredRequest): Promise<ApiResponse<unknown>> {
    return apiPost(`/scm/shipments/${encodeURIComponent(shipmentId)}/deliver`, payload)
  },

  /** PUT /scm/shipments/{shipmentId}/state — generic forward state transition */
  transitionState(shipmentId: string, payload: TransitionShipmentStateRequest): Promise<ApiResponse<unknown>> {
    return apiPut(`/scm/shipments/${encodeURIComponent(shipmentId)}/state`, payload)
  },
}
