/**
 * @file purchase-order.types.ts
 * @description TypeScript types for the Zeus SCM Purchase Order module.
 *
 * Sources:
 *  - OpenAPI 3.0.3 spec: /scm/docs/openapi.yaml
 *  - API tag: [Purchase Orders]
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Domain Models
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a Purchase Order.
 */
export type POStatus = 'Draft' | 'Approved' | 'In Transit' | 'Received' | 'Partial' | 'Void';

/**
 * A single line item within a Purchase Order.
 * @schema POLineItem
 */
export interface POLineItem {
  id: string; // uuid
  po_id: string;
  sku: string;
  description: string;
  ordered_qty: number;
  received_qty: number;
  unit_price: number;
}

/**
 * A Purchase Order record as returned by GORM.
 * @schema PurchaseOrder
 */
export interface PurchaseOrder {
  id: string; // e.g. "PO-2025-1"
  vendor_id: string; // uuid
  target_build: string;
  status: POStatus;
  total_value: number;
  payment_terms: string;
  expected_delivery: string; // ISO date-time
  notes: string;
  created_at: string;
  updated_at: string;
  line_items: POLineItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Request Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request body for POST /purchase-orders
 */
export interface CreateCustomPORequest {
  id: string;
  expected_delivery: string;
  vendor_id: string;
  notes?: string;
  target_build?: string;
  items: Array<{
    sku: string;
    qty: number;
  }>;
}

/**
 * Request body for POST /purchase-orders/draft
 */
export interface CreatePODraftRequest {
  vendor_id: string;
  target_build?: string;
}

/**
 * Request body for POST /purchase-orders/{poId}/line-items
 */
export interface AddLineItemRequest {
  sku: string;
  qty: number; // min 1
}

/**
 * Request body for PUT /purchase-orders/{poId}/state
 */
export interface TransitionPOStateRequest {
  new_state: POStatus | 'Void';
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Query Parameter Interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Query parameters for listing Purchase Orders.
 */
export interface POListParams {
  q?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  status?: POStatus;
}
