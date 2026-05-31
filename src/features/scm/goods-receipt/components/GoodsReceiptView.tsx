'use client'

/**
 * @file GoodsReceiptView.tsx
 * @description Goods Receipt inspection page with full API integration.
 *
 * ─── Integrated APIs ─────────────────────────────────────────────────────────
 *
 *  ① POST   /scm/goods-receipts/{grId}/lock
 *       Acquire 60-min operator lock before starting inspection.
 *       Triggers on "Start Inspection" / "Continue Inspection" button click.
 *
 *  ② DELETE /scm/goods-receipts/{grId}/lock
 *       Release operator lock immediately.
 *       Triggers on "Release Lock" button click inside expanded panel.
 *
 *  ③ POST   /scm/goods-receipts/{grId}/process
 *       Submit blind-count data (received + defective per SKU).
 *       Triggers on "Complete Receipt" button click.
 *       Payload: { operator_id, counts: { [sku]: { received, defective } } }
 *
 * ─── Lock Flow ───────────────────────────────────────────────────────────────
 *
 *  1. User clicks "Start Inspection" → POST /lock  → row expands showing form
 *  2. User fills in received/defective counts (blind — no ordered qty shown first)
 *  3. User clicks "Complete Receipt"  → POST /process → GR: Complete, PO updated
 *  4. User can click "Release Lock"   → DELETE /lock  → lock cleared, row closes
 *
 * ─── Error Handling ──────────────────────────────────────────────────────────
 *
 *  409 Conflict   → toast.error "Already locked by another operator"
 *  4xx/5xx other  → toast.error with message from API envelope or fallback
 *  Network error  → toast.error "Network error"
 */

import React, { useState, useCallback } from 'react'
import {
  RefreshCw, Download, Lock, Unlock, ChevronLeft, ChevronRight,
  AlertTriangle, PackageCheck, Loader2, ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { downloadFile } from '@/lib/axios.client'
import type { AxiosError } from 'axios'

import { useAuthStore } from '@/lib'
import { goodsReceiptService } from '../goods-receipt.service'
import {
  useGoodsReceipts,
  useGoodsReceiptMetrics,
  useAcquireLock,
  useReleaseLock,
  useProcessBlindReceipt,
} from '../hooks/useGoodsReceipts'
import type {
  GRStatus,
  LineItemFormState,
} from '../goods-receipt.types'

// ─────────────────────────────────────────────────────────────────────────────
// Local mock data (simulates a paginated list endpoint response)
// In a real integration these would come from GET /goods-receipts
// ─────────────────────────────────────────────────────────────────────────────

type FilterType = 'ALL' | GRStatus

interface LineItem {
  sku: string
  name: string
  orderedQty: number
  receivedQty?: number | null
  defectiveQty?: number | null
  productionDate?: string | null
  agingSensitive: boolean
  agingLabel?: string
}

interface GoodsReceiptRow {
  id: string
  poRef: string
  vendor: string
  status: GRStatus
  arrivalDate: string
  operator: string
  lockedBy: string | null   // null = unlocked, "self" = current user, other = name
  lockMinutes: number | null
  lineItems: LineItem[]
}

const mockGRs: GoodsReceiptRow[] = [
  {
    id: 'GR-2024-301', poRef: 'PO-2024-101', vendor: 'Intel Corporation', status: 'Inspected',
    arrivalDate: 'May 15, 2026', operator: 'A. Jensen', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'SOC-XM100-PRO', name: 'XM100 Processor', orderedQty: 100, agingSensitive: false },
      { sku: 'BATT-LIPO-99W', name: 'Li-Po Battery Pack', orderedQty: 50, agingSensitive: true, agingLabel: 'AGING SENSITIVE: Exceeds threshold if > 5 years.' },
    ],
  },
  {
    id: 'GR-2024-302', poRef: 'PO-2024-102', vendor: 'Samsung Electronics', status: 'Pending',
    arrivalDate: 'May 15, 2026', operator: 'L. Zhang', lockedBy: 'M. Park', lockMinutes: 42,
    lineItems: [
      { sku: 'RAM-64G-DDR5', name: '64GB DDR5 Memory Module', orderedQty: 200, agingSensitive: false },
      { sku: 'SSD-2T-NVME', name: '2TB NVMe Gen5 SSD', orderedQty: 100, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-303', poRef: 'PO-2024-103', vendor: 'SK Hynix', status: 'Discrepancy',
    arrivalDate: 'May 14, 2026', operator: 'K. Smith', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'RAM-32G-DDR5', name: '32GB DDR5-5600 SO-DIMM', orderedQty: 300, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-304', poRef: 'PO-2024-104', vendor: 'LG Display', status: 'Complete',
    arrivalDate: 'May 14, 2026', operator: 'M. Park', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'DISP-OLED-16', name: '16" 4K ProArt OLED Panel', orderedQty: 80, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-305', poRef: 'PO-2024-105', vendor: 'NVIDIA', status: 'Pending',
    arrivalDate: 'May 16, 2026', operator: 'J. Chen', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'GPU-RTX5080-M', name: 'NVIDIA RTX 5080 Mobile (16GB)', orderedQty: 150, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-306', poRef: 'PO-2024-106', vendor: 'Texas Instruments', status: 'Inspected',
    arrivalDate: 'May 13, 2026', operator: 'A. Jensen', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'PSU-GAN-240W', name: '240W GaN Power Supply', orderedQty: 120, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-307', poRef: 'PO-2024-107', vendor: 'Murata Manufacturing', status: 'Complete',
    arrivalDate: 'May 12, 2026', operator: 'L. Zhang', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'MOD-WIFI7-AX', name: 'WiFi 7 AX Module', orderedQty: 500, agingSensitive: false },
    ],
  },
  {
    id: 'GR-2024-308', poRef: 'PO-2024-108', vendor: 'Foxconn Technology', status: 'Discrepancy',
    arrivalDate: 'May 11, 2026', operator: 'K. Smith', lockedBy: null, lockMinutes: null,
    lineItems: [
      { sku: 'MB-ZEUS-X1', name: 'Zeus X1 Titanium Mainboard', orderedQty: 60, agingSensitive: false },
      { sku: 'MB-AERO-S', name: 'Aero S Mainboard', orderedQty: 40, agingSensitive: false },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig: Record<GRStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Pending:     { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  Inspected:   { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: false },
  Complete:    { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
  Discrepancy: { bg: 'bg-mrp-danger/10', border: 'border-mrp-danger/20', text: 'text-mrp-danger', dot: 'bg-mrp-danger', pulse: true },
}

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Inspected', label: 'Inspected' },
  { key: 'Complete', label: 'Complete' },
  { key: 'Discrepancy', label: 'Discrepancy' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Error extraction helper
// ─────────────────────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ error?: string; message?: string }>
  if (axiosErr?.response?.status === 409) {
    return 'Already locked by another operator. Try again later.'
  }
  const apiMsg =
    axiosErr?.response?.data?.error ??
    axiosErr?.response?.data?.message
  return apiMsg ?? fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Action button decision
// ─────────────────────────────────────────────────────────────────────────────

function getActionInfo(gr: GoodsReceiptRow): { label: string; primary: boolean; disabled: boolean } {
  if (gr.lockedBy === 'self') return { label: 'Continue Inspection', primary: true, disabled: false }
  if (gr.lockedBy)           return { label: 'Locked', primary: false, disabled: true }
  if (gr.status === 'Pending' || gr.status === 'Inspected')
    return { label: 'Start Inspection', primary: true, disabled: false }
  if (gr.status === 'Discrepancy') return { label: 'Review Diff', primary: false, disabled: false }
  return { label: 'View Details', primary: false, disabled: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function GoodsReceiptView() {
  // ── Local state ──────────────────────────────────────────────────────────

  const [filter, setFilter] = useState<FilterType>('ALL')

  /** Which row is currently expanded (showing inspection detail panel) */
  const [expandedId, setExpandedId] = useState<string | null>(null)

  /**
   * Per-GR loading flags to prevent double-submission and show spinners.
   * Keys: 'lock-<grId>' | 'unlock-<grId>' | 'process-<grId>'
   */
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())

  /**
   * Per-row form state: received / defective counts + production date per SKU.
   * Map<grId, Map<sku, LineItemFormState>>
   */
  const [formStateMap, setFormStateMap] = useState<
    Map<string, Map<string, LineItemFormState>>
  >(new Map())

  // ── Pagination State ──
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // ── Auth: current user for operator_id ───────────────────────────────────
  const currentUser = useAuthStore((s) => s.currentUser)
  /** The operator_id sent to the API — falls back to a demo value so it works without login */
  const operatorId = currentUser?.id ?? 'demo-operator'

  // ── React Query Hooks — Live SCM Goods Receipt APIs ─────────────────────
  const { data: metricsRes, refetch: refetchMetrics } = useGoodsReceiptMetrics()
  const metrics = metricsRes?.data

  const { data: grListRes, isLoading: isListLoading, refetch: refetchList } = useGoodsReceipts({
    page,
    limit,
    status: filter === 'ALL' ? undefined : filter,
  })


  const apiGRs = Array.isArray(grListRes?.data)
    ? grListRes.data
    : (grListRes?.data as any)?.items ?? []


  const pagination = grListRes?.data?.pagination ?? (grListRes as any)?.metadata?.pagination

  const acquireLockMutation = useAcquireLock()
  const releaseLockMutation = useReleaseLock()
  const processBlindReceiptMutation = useProcessBlindReceipt()

  // ── Computed & Robust Casing Mapping ─────────────────────────────────────
  const displayGRs = grListRes ? apiGRs : mockGRs

  const rows = displayGRs.map((g: any) => {
    // Support both mock camelCase and API PascalCase/snake_case keys!
    const id = g.id ?? g.ID
    const poRef = g.poRef ?? g.po_ref ?? g.PORef
    const vendorId = g.vendor_id ?? g.VendorID
    const status = (g.status ?? g.Status) as GRStatus
    const arrivalDate = g.arrivalDate ?? g.arrival_date ?? g.ArrivalDate
    const rawOperator = g.operator_name ?? g.OperatorName ?? g.operator ?? ''
    const rawOperatorId = g.operator_id ?? g.OperatorID ?? ''
    // If operator_name is blank, show a human label derived from the operator_id
    // Seeder creates GRs with operator_id but no operator_name — fallback gracefully
    const operator = rawOperator || (rawOperatorId ? 'SCM Operator' : '—')
    const rawLockedBy = g.lockedBy ?? g.locked_by ?? g.LockedBy
    const lockedBy = rawLockedBy === operatorId ? 'self' : (rawLockedBy || null)

    const rawExpires = g.lock_expires_at ?? g.LockExpiresAt
    let lockMinutes: number | null = g.lockMinutes ?? null
    if (rawExpires) {
      const diffMs = new Date(rawExpires).getTime() - Date.now()
      lockMinutes = diffMs > 0 ? Math.ceil(diffMs / 60000) : null
    }

    const rawLineItems = g.lineItems ?? g.line_items ?? g.LineItems ?? []
    const lineItems = rawLineItems.map((li: any) => ({
      sku: li.sku ?? li.SKU,
      name: li.name ?? li.Name,
      orderedQty: li.orderedQty ?? li.ordered_qty ?? li.OrderedQty ?? 0,
      receivedQty: li.receivedQty ?? li.received_qty ?? li.ReceivedQty ?? null,
      defectiveQty: li.defectiveQty ?? li.defective_qty ?? li.DefectiveQty ?? null,
      productionDate: li.productionDate ?? li.production_date ?? li.ProductionDate ?? null,
      agingSensitive: li.agingSensitive ?? li.aging_sensitive ?? li.AgingSensitive ?? false,
      agingLabel: li.agingLabel ?? li.aging_label ?? li.AgingLabel ?? 'AGING SENSITIVE',
    }))

    const VENDOR_NAMES: Record<string, string> = {
      'd870ac5c-fa7d-394d-8f63-bbbb105ded34': 'Northwind Component Supply',
      '24978c6b-587e-3528-92d2-84bf53067f09': 'Apex Industrial Parts',
      'a6341699-fe34-3ab5-97a8-f14e1c868436': 'BluePeak Electronics',
      '4ad26053-dcd1-3d15-b58e-ee8117e23ad2': 'Orion Component Works',
      'f7f72cd2-3949-3595-a9db-f1b76f4786a4': 'Vertex Supply Group',
    }
    const vendor = g.vendor_name ?? g.VendorName ?? g.vendor ?? VENDOR_NAMES[vendorId] ?? `Vendor ${vendorId ? vendorId.substring(0, 8) : 'Unknown'}`

    let formattedArrival = arrivalDate
    if (arrivalDate && typeof arrivalDate === 'string' && arrivalDate.includes('-')) {
      try {
        formattedArrival = new Date(arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } catch {
        formattedArrival = String(arrivalDate)
      }
    }

    return {
      id,
      poRef,
      vendor,
      status,
      arrivalDate: formattedArrival,
      operator,
      lockedBy,
      lockMinutes,
      lineItems,
    }
  })

  // Always apply status filter client-side (API server-side filter is also sent, but client filtering
  // ensures tab changes work instantly without extra round trips).
  const filtered = filter === 'ALL' ? rows : rows.filter((g) => g.status === filter)

  // Pagination totals
  const totalRows = pagination?.total_rows ?? filtered.length
  const totalPages = pagination?.total_pages ?? Math.ceil(totalRows / limit) ?? 1

  // ── Loading helpers ───────────────────────────────────────────────────────

  const setLoading = (key: string, val: boolean) =>
    setLoadingKeys((prev) => {
      const next = new Set(prev)
      val ? next.add(key) : next.delete(key)
      return next
    })

  const isLoading = (key: string) => loadingKeys.has(key)

  // ── Form state helpers ────────────────────────────────────────────────────

  /** Initialize form state for a GR's line items (blank inputs = blind receiving) */
  const initFormState = (gr: GoodsReceiptRow) => {
    const skuMap = new Map<string, LineItemFormState>()
    gr.lineItems.forEach((li) => {
      skuMap.set(li.sku, { received: '', defective: '', productionDate: '' })
    })
    setFormStateMap((prev) => new Map(prev).set(gr.id, skuMap))
  }

  const updateFormField = (
    grId: string,
    sku: string,
    field: keyof LineItemFormState,
    value: string,
  ) => {
    setFormStateMap((prev) => {
      const next = new Map(prev)
      const skuMap = new Map(next.get(grId) ?? [])
      const cur = skuMap.get(sku) ?? { received: '', defective: '', productionDate: '' }
      skuMap.set(sku, { ...cur, [field]: value })
      next.set(grId, skuMap)
      return next
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ① API: Acquire Lock  — POST /scm/goods-receipts/{grId}/lock
  // ─────────────────────────────────────────────────────────────────────────

  const handleAcquireLock = async (gr: GoodsReceiptRow) => {
    const key = `lock-${gr.id}`
    if (isLoading(key)) return

    setLoading(key, true)
    try {
      await acquireLockMutation.mutateAsync({ grId: gr.id, operatorId })
      initFormState(gr)
      setExpandedId(gr.id)

      toast.success(`Lock acquired for ${gr.id}`, {
        description: 'You have 60 minutes to complete inspection.',
      })
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to acquire lock. Please try again.')
      toast.error('Cannot Acquire Lock', { description: msg })
    } finally {
      setLoading(key, false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ② API: Release Lock  — DELETE /scm/goods-receipts/{grId}/lock
  // ─────────────────────────────────────────────────────────────────────────

  const handleReleaseLock = async (grId: string) => {
    const key = `unlock-${grId}`
    if (isLoading(key)) return

    setLoading(key, true)
    try {
      await releaseLockMutation.mutateAsync(grId)
      setExpandedId(null)

      toast.success(`Lock released for ${grId}`, {
        description: 'The Goods Receipt is now available for other operators.',
      })
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to release lock.')
      toast.error('Release Lock Failed', { description: msg })
    } finally {
      setLoading(key, false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ③ API: Process Blind Receipt  — POST /scm/goods-receipts/{grId}/process
  // ─────────────────────────────────────────────────────────────────────────

  const handleProcessReceipt = async (gr: GoodsReceiptRow) => {
    const key = `process-${gr.id}`
    if (isLoading(key)) return

    const skuMap = formStateMap.get(gr.id)

    // ── Client-side validation ─────────────────────────────────────────────
    for (const li of gr.lineItems) {
      const entry = skuMap?.get(li.sku)
      if (!entry || entry.received === '') {
        toast.error('Incomplete Form', {
          description: `Please enter received qty for SKU: ${li.sku}`,
        })
        return
      }
      if (entry.defective === '') {
        toast.error('Incomplete Form', {
          description: `Please enter defective qty for SKU: ${li.sku}`,
        })
        return
      }
      const received  = parseInt(entry.received,  10)
      const defective = parseInt(entry.defective, 10)
      if (isNaN(received)  || received  < 0) {
        toast.error('Invalid Input', { description: `Received qty for ${li.sku} must be ≥ 0` })
        return
      }
      if (isNaN(defective) || defective < 0) {
        toast.error('Invalid Input', { description: `Defective qty for ${li.sku} must be ≥ 0` })
        return
      }
      if (defective > received) {
        toast.error('Invalid Input', {
          description: `Defective qty (${defective}) cannot exceed received qty (${received}) for ${li.sku}`,
        })
        return
      }
    }

    // ── Build API payload ──────────────────────────────────────────────────
    const counts: Record<string, { received: number; defective: number }> = {}
    gr.lineItems.forEach((li) => {
      const entry = skuMap?.get(li.sku)
      if (entry) {
        counts[li.sku] = {
          received:  parseInt(entry.received,  10),
          defective: parseInt(entry.defective, 10),
        }
      }
    })

    setLoading(key, true)
    try {
      await processBlindReceiptMutation.mutateAsync({
        grId: gr.id,
        payload: {
          operator_id: operatorId,
          counts,
        }
      })

      setExpandedId(null)

      // Clear form state for this GR
      setFormStateMap((prev) => {
        const next = new Map(prev)
        next.delete(gr.id)
        return next
      })

      toast.success(`${gr.id} completed`, {
        description: `Inventory Ledger updated. ${gr.poRef} status updated.`,
      })
    } catch (err) {
      const msg = extractErrorMessage(err, 'Failed to process receipt. Check your lock status.')
      toast.error('Processing Failed', { description: msg })
    } finally {
      setLoading(key, false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Action button click handler (row level)
  // ─────────────────────────────────────────────────────────────────────────

  const handleRowAction = async (gr: GoodsReceiptRow) => {
    const action = getActionInfo(gr)
    if (action.disabled) return

    if (gr.lockedBy === 'self') {
      // Already have lock — just toggle expand
      setExpandedId((prev) => (prev === gr.id ? null : gr.id))
      return
    }

    if (gr.status === 'Pending' || gr.status === 'Inspected') {
      await handleAcquireLock(gr)
      return
    }

    // For other statuses (Discrepancy / Complete / View Details) — just expand
    setExpandedId((prev) => (prev === gr.id ? null : gr.id))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Computed summary for expanded panel sidebar
  // ─────────────────────────────────────────────────────────────────────────

  const getSummary = (gr: GoodsReceiptRow) => {
    const skuMap = formStateMap.get(gr.id)
    let totalReceived = 0
    let totalDefective = 0
    let totalOrdered = 0

    gr.lineItems.forEach((li) => {
      totalOrdered += li.orderedQty
      const entry = skuMap?.get(li.sku)
      if (entry) {
        totalReceived  += parseInt(entry.received,  10) || 0
        totalDefective += parseInt(entry.defective, 10) || 0
      } else {
        totalReceived  += (li.receivedQty !== undefined && li.receivedQty !== null) ? (li.receivedQty as number) : 0
        totalDefective += (li.defectiveQty !== undefined && li.defectiveQty !== null) ? (li.defectiveQty as number) : 0
      }
    })

    const discrepancy = totalOrdered - totalReceived
    return { totalOrdered, totalReceived, totalDefective, discrepancy }
  }

  // ── Export Report ─────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false)
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadFile('/scm/goods-receipts/export', 'goods_receipts_report.csv')
      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Goods Receipt</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Physically validate inbound shipments against purchase orders to ensure inventory accuracy.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { refetchList(); refetchMetrics(); toast.info('Data refreshed') }}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Receipts',    value: String(metrics?.pending_receipts ?? rows.filter(r => r.status === 'Pending').length),     color: 'text-mrp-warning', accent: 'border-l-mrp-warning', pulse: true  },
          { label: 'Completed Today',     value: String(metrics?.completed_today ?? rows.filter(r => r.status === 'Complete').length),    color: 'text-mrp-success', accent: 'border-l-mrp-success', pulse: false },
          { label: 'Active Discrepancies',value: String(metrics?.active_discrepancies ?? rows.filter(r => r.status === 'Discrepancy').length), color: 'text-mrp-danger',  accent: 'border-l-mrp-danger',  pulse: false },
          { label: 'Inspection Queue',    value: String(metrics?.inspection_queue ?? rows.filter(r => r.status === 'Inspected').length),   color: 'text-white',       accent: 'border-l-white',       pulse: false },
        ].map((k) => (
          <div key={k.label} className={`bg-mrp-panel border border-mrp-border p-4 rounded-sm border-l-4 ${k.accent}`}>
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">{k.label}</span>
            <div className="flex items-baseline gap-2 mt-3">
              <span className={`font-mono text-2xl font-bold ${k.color}`}>{k.value}</span>
              {k.pulse && <span className="w-2 h-2 rounded-full bg-mrp-warning animate-pulse" />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">

        {/* Filters */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center gap-2">
          {FILTER_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors cursor-pointer ${
                filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
              }`}>{label}</button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['GR ID', 'PO Reference', 'Vendor', 'Status', 'Arrival Date', 'Operator', 'Lock Status', 'Actions'].map((h) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((gr) => {
                const cfg    = statusConfig[gr.status]
                const action = getActionInfo(gr)
                const isExpanded      = expandedId === gr.id
                const isAcquiring     = isLoading(`lock-${gr.id}`)
                const isReleasing     = isLoading(`unlock-${gr.id}`)
                const isProcessing    = isLoading(`process-${gr.id}`)
                const summary         = getSummary(gr)

                return (
                  <React.Fragment key={gr.id}>
                    {/* ── Row ── */}
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary whitespace-nowrap">{gr.id}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white">{gr.poRef}</td>
                      <td className="py-3 px-4 text-[13px] text-white">{gr.vendor}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
                          {gr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">{gr.arrivalDate}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{gr.operator}</td>
                      <td className="py-3 px-4">
                        {gr.lockedBy === 'self' ? (
                          <div className="flex items-center gap-1.5 text-mrp-primary text-[12px]">
                            <Unlock size={14} /> You hold the lock ({gr.lockMinutes} min)
                          </div>
                        ) : gr.lockedBy ? (
                          <div className="flex items-center gap-1.5 text-mrp-text-muted text-[12px] opacity-60">
                            <Lock size={14} /> Locked by {gr.lockedBy} ({gr.lockMinutes} min)
                          </div>
                        ) : (
                          <span className="text-mrp-text-muted opacity-40">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          id={`gr-action-${gr.id}`}
                          disabled={action.disabled || isAcquiring}
                          onClick={() => handleRowAction(gr)}
                          className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ml-auto ${
                            action.disabled ? 'bg-mrp-panel text-mrp-text-muted border border-mrp-border cursor-not-allowed opacity-50'
                            : action.primary ? 'bg-mrp-primary hover:bg-mrp-primary-hover text-white cursor-pointer'
                            : 'border border-mrp-border text-white hover:bg-mrp-border cursor-pointer'
                          }`}
                        >
                          {isAcquiring && <Loader2 size={12} className="animate-spin" />}
                          {action.label}
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded Inspection Detail ── */}
                    {isExpanded && (
                      <tr className="bg-[#1a1c1e]">
                        <td colSpan={8} className="p-0 border-b border-mrp-border">

                          {/* Lock Banner */}
                          <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: '#F0AB0015', borderBottom: '1px solid #F0AB0030' }}>
                            <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
                              <PackageCheck size={18} className="text-mrp-warning" />
                              Inspection Detail: {gr.id}
                            </h2>
                            <div className="flex items-center gap-3">
                              {gr.lockedBy === 'self' && (
                                <span className="text-mrp-warning text-[12px] font-medium flex items-center gap-1.5">
                                  <Lock size={14} /> You hold the lock ({gr.lockMinutes} min remaining)
                                </span>
                              )}

                              {/* ② Release Lock Button */}
                              {gr.lockedBy === 'self' && (
                                <button
                                  id={`gr-release-lock-${gr.id}`}
                                  disabled={isReleasing}
                                  onClick={() => handleReleaseLock(gr.id)}
                                  className="px-3 py-1.5 border border-mrp-danger/40 text-mrp-danger hover:bg-mrp-danger/10 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  {isReleasing
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <ShieldAlert size={12} />
                                  }
                                  Release Lock
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-6">
                            <div className="grid grid-cols-12 gap-6">

                              {/* ── Line Items — Blind Receiving ── */}
                              <div className="col-span-12 lg:col-span-9 space-y-3">
                                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
                                  Line Item Validation
                                  {gr.lockedBy !== 'self' && (
                                    <span className="ml-2 text-mrp-text-muted/60 font-normal normal-case">(read-only)</span>
                                  )}
                                </h3>
                                <div className="bg-mrp-panel border border-mrp-border rounded-sm overflow-hidden">
                                  <table className="w-full text-left border-collapse">
                                    <thead className="bg-mrp-app border-b border-mrp-border">
                                      <tr>
                                        {['SKU', 'Item Name', 'Ordered', 'Received', 'Defective', 'Production Date'].map((h) => (
                                          <th key={h} className={`py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider ${h === 'Ordered' ? 'text-right' : ''}`}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-mrp-border">
                                      {gr.lineItems.map((li) => {
                                         const dbReceived = li.receivedQty !== undefined && li.receivedQty !== null ? String(li.receivedQty) : ''
                                         const dbDefective = li.defectiveQty !== undefined && li.defectiveQty !== null ? String(li.defectiveQty) : ''
                                         const dbProdDate = li.productionDate ? String(li.productionDate).split('T')[0] : ''
                                         
                                         const entry = formStateMap.get(gr.id)?.get(li.sku) ?? { 
                                           received: dbReceived, 
                                           defective: dbDefective, 
                                           productionDate: dbProdDate 
                                         }
                                         const isEditable = gr.lockedBy === 'self'

                                        return (
                                          <tr key={li.sku} className="bg-mrp-app">
                                            <td className="py-3 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                            <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{li.name}</td>
                                            <td className="py-3 px-4 font-mono text-[12px] text-white text-right">{li.orderedQty}</td>

                                            {/* BLIND RECEIVING: inputs start empty */}
                                            <td className="py-3 px-4 w-28">
                                              <input
                                                id={`gr-received-${gr.id}-${li.sku}`}
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                value={entry.received}
                                                disabled={!isEditable || isProcessing}
                                                onChange={(e) => updateFormField(gr.id, li.sku, 'received', e.target.value)}
                                                className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-right font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                              />
                                            </td>
                                            <td className="py-3 px-4 w-28">
                                              <input
                                                id={`gr-defective-${gr.id}-${li.sku}`}
                                                type="number"
                                                min={0}
                                                placeholder="0"
                                                value={entry.defective}
                                                disabled={!isEditable || isProcessing}
                                                onChange={(e) => updateFormField(gr.id, li.sku, 'defective', e.target.value)}
                                                className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-right font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted disabled:opacity-40 disabled:cursor-not-allowed"
                                              />
                                            </td>
                                            <td className="py-3 px-4">
                                              {li.agingSensitive ? (
                                                <div className="space-y-1">
                                                  <input
                                                    id={`gr-proddate-${gr.id}-${li.sku}`}
                                                    type="date"
                                                    value={entry.productionDate}
                                                    disabled={!isEditable || isProcessing}
                                                    onChange={(e) => updateFormField(gr.id, li.sku, 'productionDate', e.target.value)}
                                                    className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-[12px] text-white focus:border-mrp-primary focus:outline-none [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
                                                  />
                                                  <div className="flex items-center gap-1 text-mrp-warning text-[10px] font-bold uppercase tracking-wider">
                                                    <AlertTriangle size={12} /> {li.agingLabel}
                                                  </div>
                                                </div>
                                              ) : (
                                                <span className="text-mrp-text-muted text-[12px] italic">N/A</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* ── Batch Summary Sidebar ── */}
                              <div className="col-span-12 lg:col-span-3">
                                <div className="bg-mrp-app border border-mrp-border rounded-sm p-4 space-y-4">
                                  <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-2">Batch Summary</h3>

                                  <div className="space-y-3 text-[13px]">
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Ordered</span>
                                      <span className="font-mono text-white">{summary.totalOrdered}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Received</span>
                                      <span className={`font-mono ${summary.totalReceived > 0 ? 'text-mrp-primary' : 'text-mrp-text-muted'}`}>
                                        {summary.totalReceived > 0 ? summary.totalReceived : '--'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Defective</span>
                                      <span className={`font-mono ${summary.totalDefective > 0 ? 'text-mrp-danger' : 'text-mrp-text-muted'}`}>
                                        {summary.totalDefective > 0 ? summary.totalDefective : '--'}
                                      </span>
                                    </div>
                                    <div className={`flex justify-between border-t border-mrp-border pt-2 font-bold ${summary.discrepancy !== 0 && summary.totalReceived > 0 ? 'text-mrp-warning' : 'text-white'}`}>
                                      <span>Discrepancy</span>
                                      <span className="font-mono">
                                        {summary.totalReceived > 0
                                          ? (summary.discrepancy > 0 ? `-${summary.discrepancy}` : summary.discrepancy === 0 ? '✓ None' : `+${Math.abs(summary.discrepancy)}`)
                                          : '--'
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  {/* ③ Complete Receipt Button — triggers POST /process */}
                                  {gr.lockedBy === 'self' ? (
                                    <>
                                      <button
                                        id={`gr-process-${gr.id}`}
                                        onClick={() => handleProcessReceipt(gr)}
                                        disabled={isProcessing}
                                        className="w-full bg-mrp-primary hover:bg-mrp-primary-hover text-white py-2.5 font-bold rounded-sm flex items-center justify-center gap-2 transition-colors mt-4 text-[13px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {isProcessing
                                          ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
                                          : <>Complete Receipt <ChevronRight size={16} /></>
                                        }
                                      </button>
                                      <p className="text-[10px] text-mrp-text-muted text-center">
                                        This will write to Inventory Ledger and update PO status.
                                      </p>
                                    </>
                                  ) : (
                                    <div className="mt-4 text-center text-[11px] text-mrp-text-muted border border-dashed border-mrp-border rounded-sm p-3">
                                      {gr.lockedBy
                                        ? <>🔒 Locked by <strong className="text-white">{gr.lockedBy}</strong></>
                                        : 'Acquire a lock to begin inspection.'
                                      }
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mrp-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={36} className="opacity-40 text-mrp-text-muted" />
                      <span className="text-[14px] font-semibold text-white">No goods receipts found</span>
                      <span className="text-[11px] opacity-60">There are no records matching the selected status filter.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {filtered.length > 0 ? (page - 1) * limit + 1 : 0}-{(page - 1) * limit + filtered.length} of {totalRows} Goods Receipts
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
