/**
 * @file goods-receipt.types.ts
 * @description TypeScript types for the Zeus SCM Goods Receipt module.
 *
 * Sources:
 *  - OpenAPI 3.0.3 spec: /scm/docs/openapi.yaml  (#/components/schemas/GoodsReceipt, GRLineItem)
 *  - API tag: [goods-receipts]
 *
 * ─── API Endpoints covered ───────────────────────────────────────────────────
 *  POST   /goods-receipts/{grId}/lock     – Acquire 60-min operator lock
 *  DELETE /goods-receipts/{grId}/lock     – Release 60-min operator lock
 *  POST   /goods-receipts/{grId}/process  – Process blind receipt with manual counts
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Domain Models (mirrors OpenAPI schema 1-to-1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lifecycle status of a Goods Receipt.
 * @schema GoodsReceipt.status
 */
export type GRStatus = 'Pending' | 'Inspected' | 'Complete' | 'Discrepancy';

/**
 * A Goods Receipt record as returned by the backend.
 * @schema GoodsReceipt
 */
export interface GoodsReceipt {
  /** Identifier, e.g. "GR-2025-1" */
  id: string;
  /** Reference to the linked Purchase Order ID */
  po_ref: string;
  /** UUID of the vendor */
  vendor_id: string;
  /** Current lifecycle status */
  status: GRStatus;
  /** ISO 8601 timestamp when shipment arrived */
  arrival_date: string;
  /** ID of the operator assigned to this receipt */
  operator_id: string;
  /**
   * ID of the operator who currently holds the inspection lock.
   * `null` if no lock is held.
   */
  locked_by: string | null;
  /**
   * ISO 8601 timestamp when the current lock expires.
   * `null` if no lock is held.
   */
  lock_expires_at: string | null;
}

/**
 * A single line item within a Goods Receipt.
 * @schema GRLineItem
 */
export interface GRLineItem {
  /** UUID of this line item */
  id: string;
  /** ID of the parent Goods Receipt */
  gr_id: string;
  /** Stock-Keeping Unit identifier */
  sku: string;
  /** Human-readable item name */
  name: string;
  /** Quantity that was ordered on the linked PO */
  ordered_qty: number;
  /**
   * Quantity physically counted as received during blind inspection.
   * `null` until the receipt has been processed.
   */
  received_qty: number | null;
  /**
   * Quantity found defective during inspection.
   * `null` until the receipt has been processed.
   */
  defective_qty: number | null;
  /** Whether this item has an age-sensitive threshold */
  aging_sensitive: boolean;
  /**
   * ISO 8601 date (YYYY-MM-DD) the item was manufactured.
   * Present only when `aging_sensitive` is true.
   */
  production_date: string | null;
  /** Human-readable aging label, e.g. "Over-Age" */
  aging_label: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Request Bodies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request body for POST /goods-receipts/{grId}/lock
 * Acquires a 60-minute exclusive operator lock on the Goods Receipt.
 *
 * @field operator_id  ID of the operator requesting the lock (required)
 */
export interface AcquireLockRequest {
  operator_id: string;
}

/**
 * Per-SKU count entry used in ProcessBlindReceiptRequest.counts.
 *
 * @field received   Number of units physically counted as received  (min: 0)
 * @field defective  Number of units found defective                 (min: 0)
 */
export interface LineItemCount {
  received: number;
  defective: number;
}

/**
 * Request body for POST /goods-receipts/{grId}/process
 * Submits blind-count data for all line items, triggering inventory ledger update.
 *
 * @field operator_id  ID of the operator who holds the lock (required)
 * @field counts       Map of SKU → { received, defective } (required)
 *
 * @example
 * {
 *   "operator_id": "op-001",
 *   "counts": {
 *     "SOC-XM100-PRO": { "received": 98, "defective": 2 },
 *     "BATT-LIPO-99W": { "received": 50, "defective": 0 }
 *   }
 * }
 */
export interface ProcessBlindReceiptRequest {
  operator_id: string;
  counts: Record<string, LineItemCount>;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. UI-only helpers (not sent to/from API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Local state per line item in the inspection form.
 * Separate from GRLineItem to avoid mutating API data directly.
 */
export interface LineItemFormState {
  received: string;   // string so empty input ("") is valid while typing
  defective: string;
  productionDate: string;
}
