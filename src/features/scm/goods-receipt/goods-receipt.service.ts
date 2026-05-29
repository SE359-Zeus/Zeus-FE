/**
 * @file goods-receipt.service.ts
 * @description Service layer for the Zeus SCM Goods Receipt API.
 *
 * ─── API Endpoints ────────────────────────────────────────────────────────────
 *
 *  POST   /scm/goods-receipts/{grId}/lock
 *    Acquire 60-min exclusive operator lock on a Goods Receipt.
 *    Body:    { operator_id: string }
 *    200:     Lock acquired successfully
 *    409:     Already locked by another operator
 *
 *  DELETE /scm/goods-receipts/{grId}/lock
 *    Release the current operator lock on a Goods Receipt.
 *    No body required.
 *    200:     Lock released successfully
 *
 *  POST   /scm/goods-receipts/{grId}/process
 *    Submit blind-count inspection data.  Writes to Inventory Ledger and
 *    transitions PO status (Received | Partial).
 *    Body:    { operator_id: string, counts: Record<sku, {received, defective}> }
 *    200:     Blind receipt processed
 *
 * ─── Usage ───────────────────────────────────────────────────────────────────
 *
 *   import { goodsReceiptService } from '@/features/scm/goods-receipt/goods-receipt.service'
 *
 *   // Acquire lock
 *   await goodsReceiptService.acquireLock('GR-2025-1', 'op-001')
 *
 *   // Release lock
 *   await goodsReceiptService.releaseLock('GR-2025-1')
 *
 *   // Process
 *   await goodsReceiptService.processBlindReceipt('GR-2025-1', {
 *     operator_id: 'op-001',
 *     counts: { 'SOC-XM100-PRO': { received: 98, defective: 2 } },
 *   })
 */

import { apiPost, apiDelete } from '@/lib'
import type { ApiResponse } from '@/lib'
import type {
  AcquireLockRequest,
  ProcessBlindReceiptRequest,
} from './goods-receipt.types'

// ─────────────────────────────────────────────────────────────────────────────
// Base path — all GR endpoints share this prefix
// ─────────────────────────────────────────────────────────────────────────────

const SCM_BASE = '/scm'

// ─────────────────────────────────────────────────────────────────────────────
// Service Object
// ─────────────────────────────────────────────────────────────────────────────

export const goodsReceiptService = {
  /**
   * POST /scm/goods-receipts/{grId}/lock
   *
   * Acquires a 60-minute exclusive operator lock on a Goods Receipt.
   * Only one operator may hold the lock at a time. If another operator
   * already holds a non-expired lock, the backend returns HTTP 409.
   *
   * @param grId        The Goods Receipt ID (e.g. "GR-2025-1")
   * @param operatorId  The ID of the operator requesting the lock
   * @returns           ApiResponse<null> — check `.message` for confirmation
   * @throws            AxiosError with status 409 if already locked
   */
  async acquireLock(
    grId: string,
    operatorId: string,
  ): Promise<ApiResponse<null>> {
    const body: AcquireLockRequest = { operator_id: operatorId }
    return apiPost<null>(`${SCM_BASE}/goods-receipts/${grId}/lock`, body)
  },

  /**
   * DELETE /scm/goods-receipts/{grId}/lock
   *
   * Releases the operator lock on a Goods Receipt immediately.
   * No request body is required. The server clears `locked_by` and
   * `lock_expires_at` unconditionally (any operator can release).
   *
   * @param grId  The Goods Receipt ID (e.g. "GR-2025-1")
   * @returns     ApiResponse<null>
   */
  async releaseLock(grId: string): Promise<ApiResponse<null>> {
    return apiDelete<null>(`${SCM_BASE}/goods-receipts/${grId}/lock`)
  },

  /**
   * POST /scm/goods-receipts/{grId}/process
   *
   * Submits blind-count data for all line items of a Goods Receipt.
   *
   * Business rules enforced by the backend:
   *  - The calling operator must currently hold the lock (`operator_id` === `locked_by`)
   *  - The lock must not have expired
   *  - After processing: GR status → "Complete", inventory ledger updated,
   *    PO status → "Received" (all qty matched) or "Partial" (under-delivery)
   *
   * @param grId     The Goods Receipt ID (e.g. "GR-2025-1")
   * @param payload  ProcessBlindReceiptRequest containing operator_id and per-SKU counts
   * @returns        ApiResponse<null>
   * @throws         AxiosError 403/409 if lock not held or expired
   */
  async processBlindReceipt(
    grId: string,
    payload: ProcessBlindReceiptRequest,
  ): Promise<ApiResponse<null>> {
    return apiPost<null>(`${SCM_BASE}/goods-receipts/${grId}/process`, payload)
  },
}
