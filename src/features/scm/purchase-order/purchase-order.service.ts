/**
 * @file purchase-order.service.ts
 * @description Service layer for the Zeus SCM Purchase Order API.
 *
 * ─── API Endpoints ────────────────────────────────────────────────────────────
 *  GET    /scm/purchase-orders                 – List purchase orders with pagination
 *  POST   /scm/purchase-orders                 – Create custom PO
 *  POST   /scm/purchase-orders/draft           – Create a new PO draft
 *  GET    /scm/purchase-orders/{poId}          – Get PO details including line items
 *  POST   /scm/purchase-orders/{poId}/approve  – Approve PO (Draft -> Approved)
 *  POST   /scm/purchase-orders/{poId}/line-items – Add a line item (eager locking)
 *  PUT    /scm/purchase-orders/{poId}/state    – Transition PO state
 */

import { apiGet, apiPost, apiPut } from '@/lib'
import type { ApiResponse, PaginatedResult } from '@/lib'
import type {
  PurchaseOrder,
  CreateCustomPORequest,
  CreatePODraftRequest,
  AddLineItemRequest,
  TransitionPOStateRequest,
  POListParams,
} from './purchase-order.types'

const BASE_PATH = '/scm/purchase-orders'

export const purchaseOrderService = {
  /**
   * GET /scm/purchase-orders
   * List purchase orders with pagination, keyword search, status filters, and sorting.
   */
  async listPurchaseOrders(
    params?: POListParams,
  ): Promise<ApiResponse<PaginatedResult<PurchaseOrder>>> {
    return apiGet<PaginatedResult<PurchaseOrder>>(BASE_PATH, { params })
  },

  /**
   * POST /scm/purchase-orders
   * Create a custom purchase order with line items and notes.
   */
  async createCustomPO(
    payload: CreateCustomPORequest,
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiPost<PurchaseOrder>(BASE_PATH, payload)
  },

  /**
   * POST /scm/purchase-orders/draft
   * Create a new PO draft for a supplier.
   */
  async createPODraft(
    payload: CreatePODraftRequest,
  ): Promise<ApiResponse<PurchaseOrder>> {
    return apiPost<PurchaseOrder>(`${BASE_PATH}/draft`, payload)
  },

  /**
   * GET /scm/purchase-orders/{poId}
   * Get detailed purchase order by ID including line items.
   */
  async getPurchaseOrder(poId: string): Promise<ApiResponse<PurchaseOrder>> {
    return apiGet<PurchaseOrder>(`${BASE_PATH}/${poId}`)
  },

  /**
   * POST /scm/purchase-orders/{poId}/approve
   * Approve PO (transition Draft -> Approved).
   */
  async approvePO(poId: string): Promise<ApiResponse<null>> {
    return apiPost<null>(`${BASE_PATH}/${poId}/approve`, {})
  },

  /**
   * POST /scm/purchase-orders/{poId}/line-items
   * Add a line item with eager slot-locking (30-min TTL).
   */
  async addLineItem(
    poId: string,
    payload: AddLineItemRequest,
  ): Promise<ApiResponse<null>> {
    return apiPost<null>(`${BASE_PATH}/${poId}/line-items`, payload)
  },

  /**
   * PUT /scm/purchase-orders/{poId}/state
   * Transition PO state (forward only).
   */
  async transitionPOState(
    poId: string,
    payload: TransitionPOStateRequest,
  ): Promise<ApiResponse<null>> {
    return apiPut<null>(`${BASE_PATH}/${poId}/state`, payload)
  },
}
