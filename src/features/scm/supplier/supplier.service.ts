/**
 * @file supplier.service.ts
 * @description Service layer for the Zeus SCM Supplier (Vendor) API.
 *
 * ─── LIVE Endpoints (registered in BE main.go) ────────────────────────────────
 *
 *  GET  /scm/vendors/optimal
 *    Route component shortage to the optimal supplier for a given SKU.
 *    Query: { sku: string }  (required)
 *    200:  { data: { supplier: Supplier, mapping: SkuMapping } }
 *    404:  No optimal supplier found
 *
 *  POST /scm/vendors/{id}/recalc-metrics
 *    Trigger server-side recalculation of OnTimeRate & QualityScore for
 *    a specific supplier, based on their completed Goods Receipts.
 *    Path:  id (UUID, required)
 *    Body:  none
 *    200:  { message: "metrics updated" }
 *
 * ─── PLANNED Endpoints (in openapi.yaml but NOT yet in BE main.go) ───────────
 *
 *  GET  /scm/vendors               – List suppliers (filtering, search, pagination)
 *  POST /scm/vendors               – Create new supplier
 *  GET  /scm/vendors/export        – Export supplier + SKU report as CSV stream
 *  GET  /scm/vendors/metrics       – Aggregate metrics (total active, avg on-time rate)
 *  POST /scm/vendors/{id}/sku-mappings – Add a new SKU mapping to a supplier
 *
 *  These stubs are implemented here so the FE hooks compile correctly.
 *  They will return API errors (404 / 501) until the BE implements them.
 *  When the BE is ready, no changes are needed in this file — the routes
 *  already point to the correct paths.
 *
 * ─── URL Convention ───────────────────────────────────────────────────────────
 *  The user requested that all /vendors paths remain as /vendors (not /suppliers)
 *  since the BE router uses /vendors. The UI text uses "Supplier" everywhere.
 */

import { apiGet, apiPost, API_BASE_URL } from '@/lib'
import type { ApiResponse, PaginatedResult } from '@/lib'
import type {
  Supplier,
  OptimalSupplierResult,
  SupplierMetrics,
  CreateSupplierRequest,
  CreateSkuMappingRequest,
  SupplierListParams,
} from './supplier.types'

const BASE = '/scm/vendors'

export const supplierService = {
  // ──────────────────────────────────────────────────────────────────────────
  // PLANNED: GET /scm/vendors
  // List suppliers with optional tier filtering, search, and pagination.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /scm/vendors
   *
   * List suppliers. Supports optional tier filter, keyword search, and pagination.
   *
   * **Status:** Planned — BE does not yet expose this route.
   * Returns HTTP 404 until implemented.
   *
   * @param params  Optional filter/search/pagination params
   */
  async listSuppliers(
    params?: SupplierListParams,
  ): Promise<ApiResponse<PaginatedResult<Supplier>>> {
    return apiGet<PaginatedResult<Supplier>>(BASE, { params })
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PLANNED: POST /scm/vendors
  // Create a new supplier record.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /scm/vendors
   *
   * Create a new supplier.
   *
   * **Status:** Planned — BE does not yet expose this route.
   *
   * @param body  Supplier creation payload (name, contact, tier, lead_time_days)
   */
  async createSupplier(
    body: CreateSupplierRequest,
  ): Promise<ApiResponse<Supplier>> {
    return apiPost<Supplier>(BASE, body)
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PLANNED: GET /scm/vendors/metrics
  // Retrieve aggregate supplier metrics.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /scm/vendors/metrics
   *
   * Returns aggregate stats: total active suppliers, average on-time rate.
   *
   * **Status:** Planned — BE does not yet expose this route.
   */
  async getMetrics(): Promise<ApiResponse<SupplierMetrics>> {
    return apiGet<SupplierMetrics>(`${BASE}/metrics`)
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PLANNED: GET /scm/vendors/export
  // Export supplier list + SKU mappings as a CSV stream.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /scm/vendors/export
   *
   * Streams a CSV file containing all suppliers and their SKU mappings.
   * Uses a direct URL trigger (window.open) rather than Axios, because the
   * response is a raw binary stream — not a JSON ApiResponse envelope.
   *
   * **Status:** Planned — BE does not yet expose this route.
   *
   * @param accessToken  JWT access token to attach as query param (since
   *                     browser window.open cannot set Authorization headers)
   */
  getExportUrl(accessToken: string): string {
    return `${API_BASE_URL}${BASE}/export?token=${accessToken}`
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LIVE: GET /scm/vendors/optimal
  // Route a component shortage to the optimal supplier for a given SKU.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * GET /scm/vendors/optimal?sku={sku}
   *
   * Finds the best supplier for the requested SKU based on:
   *   score = (quality_score × 0.6 + on_time_rate × 0.4) − (unit_price / 10000)
   *
   * Returns the winning Supplier and their SkuMapping for that SKU.
   *
   * **Status:** LIVE ✅
   *
   * @param sku  The SKU to route (required)
   * @throws    AxiosError 404 if no supplier stocks this SKU
   */
  async getOptimalSupplier(
    sku: string,
  ): Promise<ApiResponse<OptimalSupplierResult>> {
    return apiGet<OptimalSupplierResult>(`${BASE}/optimal`, {
      params: { sku },
    })
  },

  // ──────────────────────────────────────────────────────────────────────────
  // LIVE: POST /scm/vendors/{id}/recalc-metrics
  // Trigger server-side recalculation of quality & on-time metrics.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /scm/vendors/{id}/recalc-metrics
   *
   * Instructs the backend to recalculate `on_time_rate` and `quality_score`
   * for the given supplier by scanning their linked Goods Receipts.
   *
   * No request body required.
   *
   * **Status:** LIVE ✅
   *
   * @param id  UUID of the supplier to recalculate
   */
  async recalcMetrics(id: string): Promise<ApiResponse<null>> {
    return apiPost<null>(`${BASE}/${id}/recalc-metrics`)
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PLANNED: POST /scm/vendors/{id}/sku-mappings
  // Add a new SKU mapping for an existing supplier.
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * POST /scm/vendors/{id}/sku-mappings
   *
   * Adds a new SKU → price/availability mapping under an existing supplier.
   *
   * **Status:** Planned — BE does not yet expose this route.
   *
   * @param supplierId  UUID of the supplier
   * @param body        SKU mapping payload (sku, name, unit_price, lead_time_days, min_order_qty)
   */
  async createSkuMapping(
    supplierId: string,
    body: CreateSkuMappingRequest,
  ): Promise<ApiResponse<null>> {
    return apiPost<null>(`${BASE}/${supplierId}/sku-mappings`, body)
  },
}
