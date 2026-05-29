/**
 * @file supplier.types.ts
 * @description TypeScript types for the Zeus SCM Supplier (Vendor) module.
 *
 * Sources:
 *  - openapi.yaml  #/components/schemas/Supplier, SkuMapping
 *  - BE models/supplier.go  — canonical field names and tier enum values
 *
 * ─── IMPORTANT: Tier values in DB ────────────────────────────────────────────
 *  The backend stores tier as:  "Tier 1" | "Tier 2" | "Tier 3"
 *  NOT "Preferred" | "Qualified" | "Under Review"
 *  The old FE code used the latter — this file uses the correct DB values.
 *
 * ─── API Endpoints ────────────────────────────────────────────────────────────
 *
 *  LIVE (registered in BE main.go):
 *    GET  /scm/vendors/optimal              – Route component shortage to optimal supplier
 *    POST /scm/vendors/{id}/recalc-metrics  – Recalculate OnTimeRate & QualityScore
 *
 *  NOT YET IN BE (spec only / planned):
 *    GET  /scm/vendors                      – List suppliers with filtering & pagination
 *    POST /scm/vendors                      – Create a new supplier
 *    GET  /scm/vendors/export               – Export CSV stream
 *    GET  /scm/vendors/metrics              – Aggregate metrics (total active, avg on-time)
 *    POST /scm/vendors/{id}/sku-mappings    – Add SKU mapping to supplier
 */

// ─────────────────────────────────────────────────────────────────────────────
// § 1. Enum / Union Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supplier classification tier.
 * Values match the backend DB enum exactly (models/supplier.go).
 *
 * @schema Supplier.tier
 */
export type SupplierTier = 'Tier 1' | 'Tier 2' | 'Tier 3'

// ─────────────────────────────────────────────────────────────────────────────
// § 2. Domain Models  (mirrors OpenAPI schema 1-to-1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A supplier / vendor record as returned by the API.
 * @schema Supplier
 */
export interface Supplier {
  /** UUID v4 */
  id: string
  /** Company name */
  name: string
  /** Contact email or phone */
  contact: string
  /** Classification tier */
  tier: SupplierTier
  /** Average lead time in calendar days */
  lead_time_days: number
  /** Quality score 0–100 (computed from defective GR ratio) */
  quality_score: number
  /** On-time delivery rate 0–100 (computed from completed GRs) */
  on_time_rate: number
}

/**
 * An SKU → Supplier price/availability mapping.
 * @schema SkuMapping
 */
export interface SkuMapping {
  /** UUID v4 */
  id: string
  /** Parent supplier UUID */
  supplier_id: string
  /** Stock-Keeping Unit identifier */
  sku: string
  /** Human-readable component name */
  name: string
  /** Unit price in USD */
  unit_price: number
  /** Lead time in days for this specific SKU */
  lead_time_days: number
  /** Minimum order quantity */
  min_order_qty: number
}

/**
 * Response shape for GET /vendors/optimal
 * @schema  data: { supplier: Supplier, mapping: SkuMapping }
 */
export interface OptimalSupplierResult {
  supplier: Supplier
  mapping: SkuMapping
}

/**
 * Aggregate metrics returned by GET /vendors/metrics  (planned endpoint).
 * Currently not exposed by BE — used by FE mock until BE implements it.
 */
export interface SupplierMetrics {
  /** Number of active (non-deleted) suppliers */
  total_active: number
  /** Average on-time delivery rate across all suppliers (0–100) */
  avg_on_time_rate: number
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. Request Bodies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request body for POST /vendors  (planned endpoint — not yet in BE).
 */
export interface CreateSupplierRequest {
  name: string
  contact: string
  tier: SupplierTier
  lead_time_days?: number
}

/**
 * Request body for POST /vendors/{id}/sku-mappings  (planned endpoint).
 */
export interface CreateSkuMappingRequest {
  sku: string
  name: string
  unit_price: number
  lead_time_days: number
  min_order_qty: number
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. Query Params
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Query parameters for GET /vendors  (planned endpoint).
 */
export interface SupplierListParams {
  /** Filter by tier */
  tier?: SupplierTier
  /** Search keyword (name, contact) */
  q?: string
  /** Page number (1-based) */
  page?: number
  /** Items per page */
  limit?: number
}
