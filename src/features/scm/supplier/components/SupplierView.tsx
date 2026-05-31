'use client'

/**
 * @file SupplierView.tsx
 * @description Supplier management page with real API integration.
 *
 * ─── Integrated APIs ──────────────────────────────────────────────────────────
 *
 *  ① GET  /scm/vendors/optimal?sku={sku}           [LIVE ✅]
 *       Find optimal supplier for a given SKU.
 *       Triggered via "Find Optimal" search in the toolbar.
 *
 *  ② POST /scm/vendors/{id}/recalc-metrics         [LIVE ✅]
 *       Recalculate quality_score & on_time_rate for a supplier.
 *       Triggered via the "Recalc Metrics" button on each supplier row.
 *
 *  ③ GET  /scm/vendors                             [LIVE ✅]
 *       List suppliers with filtering, search, and pagination.
 *
 *  ④ POST /scm/vendors                             [LIVE ✅]
 *       Create a new supplier record.
 *
 *  ⑤ GET  /scm/vendors/metrics                     [LIVE ✅]
 *       Aggregate SCM vendor metrics (total active, average on-time rate).
 *
 *  ⑥ GET  /scm/vendors/export                      [LIVE ✅]
 *       Export supplier list and SKU mappings as a CSV stream.
 *
 *  ⑦ POST /scm/vendors/{id}/sku-mappings           [LIVE ✅]
 *       Add a new component SKU mapping to an existing supplier.
 *
 * ─── Tier values ─────────────────────────────────────────────────────────────
 *  DB stores: "Tier 1" | "Tier 2" | "Tier 3"  (not Preferred/Qualified/etc.)
 */

import React, { useState } from 'react'
import {
  Search, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Pencil, Download, X, RefreshCw, Loader2, Zap, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'

import { useAuthStore, API_BASE_URL, apiClient } from '@/lib'
import { supplierService } from '../supplier.service'
import {
  useSuppliers,
  useSupplierMetrics,
  useCreateSupplier,
  useCreateSkuMapping,
} from '../hooks/useSuppliers'
import type {
  SupplierTier,
  Supplier,
  SkuMapping,
  CreateSupplierRequest,
  CreateSkuMappingRequest,
  OptimalSupplierResult,
} from '../supplier.types'

// ─────────────────────────────────────────────────────────────────────────────
// Local mock data — used as fallback until GET /vendors is live
// ─────────────────────────────────────────────────────────────────────────────

type FilterType = 'ALL' | SupplierTier

interface SupplierRow extends Supplier {
  skuMappings: (SkuMapping & { unitPriceDisplay: string })[]
}

const mockSuppliers: SupplierRow[] = []

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL',    label: 'All' },
  { key: 'Tier 1', label: 'Tier 1' },
  { key: 'Tier 2', label: 'Tier 2' },
  { key: 'Tier 3', label: 'Tier 3' },
]

function tierBadge(tier: SupplierTier) {
  switch (tier) {
    case 'Tier 1': return { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' }
    case 'Tier 2': return { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary' }
    case 'Tier 3': return { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning animate-pulse' }
  }
}

function scoreColor(score: number): string {
  if (score >= 95) return 'text-mrp-success'
  if (score >= 80) return 'text-mrp-primary'
  if (score >= 65) return 'text-mrp-warning'
  return 'text-mrp-danger'
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as AxiosError<{ error?: string; message?: string }>
  return e?.response?.data?.error ?? e?.response?.data?.message ?? fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function SupplierView() {
  // ── UI state ────────────────────────────────────────────────────────────
  const [filter, setFilter]               = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows]   = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery]     = useState('')

  // ── Pagination State ──
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // ── Loading / recalc state ───────────────────────────────────────────────
  /** Keys: 'recalc-{id}' | 'add-sku-{id}' */
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const setLoading = (k: string, v: boolean) =>
    setLoadingKeys((p) => { const n = new Set(p); v ? n.add(k) : n.delete(k); return n })
  const isLoading = (k: string) => loadingKeys.has(k)

  // ── Auth ─────────────────────────────────────────────────────────────────
  const accessToken = useAuthStore((s) => s.accessToken)

  // ── React Query Hooks — Live SCM Supplier APIs ───────────────────────────
  const { data: metricsRes, refetch: refetchMetrics } = useSupplierMetrics()
  const metrics = metricsRes?.data

  const { data: suppliersRes, isLoading: isSuppliersLoading, error: suppliersError, refetch: refetchSuppliers } = useSuppliers({
    page,
    limit,
    tier: filter === 'ALL' ? undefined : filter,
    q: searchQuery || undefined,
  })

  console.log("[Zeus-DEBUG] suppliersRes:", {
    hasRes: !!suppliersRes,
    statusCode: suppliersRes?.statusCode,
    message: suppliersRes?.message,
    dataType: typeof suppliersRes?.data,
    dataIsArray: Array.isArray(suppliersRes?.data),
    dataLength: Array.isArray(suppliersRes?.data) ? suppliersRes.data.length : null,
    accessTokenSet: !!accessToken
  });

  const createSupplierMutation = useCreateSupplier()
  const createSkuMappingMutation = useCreateSkuMapping()

  // ── Add Supplier modal ───────────────────────────────────────────────────
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [isSavingSupplier, setIsSavingSupplier] = useState(false)
  const [form, setForm] = useState<CreateSupplierRequest>({
    name: '', contact: '', tier: 'Tier 2', lead_time_days: 14,
  })

  // ── Add SKU mapping modal ────────────────────────────────────────────────
  const [showAddSku, setShowAddSku] = useState<string | null>(null) // supplierId
  const [skuForm, setSkuForm] = useState<CreateSkuMappingRequest>({
    sku: '', name: '', unit_price: 0, lead_time_days: 14, min_order_qty: 1,
  })
  const [isSavingSku, setIsSavingSku] = useState(false)

  // ── Optimal Supplier modal ───────────────────────────────────────────────
  const [showOptimal, setShowOptimal] = useState(false)
  const [optimalSku, setOptimalSku]   = useState('')
  const [isFindingOptimal, setIsFindingOptimal] = useState(false)
  const [optimalResult, setOptimalResult]       = useState<OptimalSupplierResult | null>(null)

  // ── Robust Data Parsing / Mock Fallback ──────────────────────────────────
  const apiSuppliers = (Array.isArray(suppliersRes?.data) ? suppliersRes.data : (suppliersRes?.data as any)?.items) ?? []
  const displaySuppliers = apiSuppliers.length > 0 ? apiSuppliers : mockSuppliers

  // Map backend's GORM camelCase/snake_case structure into the consistent UI shape
  const mappedSuppliers = displaySuppliers.map((s) => {
    const id = s.id ?? (s as any).ID
    const name = s.name ?? (s as any).Name
    const contact = s.contact ?? (s as any).Contact
    const tier = s.tier ?? (s as any).Tier
    const quality_score = s.quality_score ?? (s as any).QualityScore ?? 0
    const on_time_rate = s.on_time_rate ?? (s as any).OnTimeRate ?? 0
    const lead_time_days = s.lead_time_days ?? (s as any).LeadTimeDays ?? 0
    const rawSkuMappings = (s as any).skuMappings ?? (s as any).SkuMappings ?? []

    const skuMappings = rawSkuMappings.map((m: any) => {
      const price = m.unit_price ?? m.UnitPrice ?? 0
      return {
        id: m.id ?? m.ID,
        supplier_id: m.supplier_id ?? m.SupplierID,
        sku: m.sku ?? m.SKU,
        name: m.name ?? m.Name,
        unit_price: price,
        lead_time_days: m.lead_time_days ?? m.LeadTimeDays ?? 0,
        min_order_qty: m.min_order_qty ?? m.MinOrderQty ?? 1,
        unitPriceDisplay: `$${price.toFixed(2)}`,
      }
    })

    return {
      id,
      name,
      contact,
      tier,
      quality_score,
      on_time_rate,
      lead_time_days,
      skuMappings,
    }
  })

  // Filter based on UI search query / tabs (mainly relevant for mock data or secondary search)
  const filtered = mappedSuppliers.filter((v) => {
    const matchesTier   = filter === 'ALL' || v.tier === filter
    const matchesSearch = searchQuery === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skuMappings.some((s) => s.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTier && matchesSearch
  })

  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })

  // ── Computed KPIs (supports live API metrics with mock fallback) ─────────
  const totalActive = (metrics as any)?.total_active_suppliers ?? metrics?.total_active ?? mappedSuppliers.length
  const avgOnTime = ((metrics as any)?.on_time_delivery_rate ?? metrics?.avg_on_time_rate ?? (mappedSuppliers.reduce((sum, v) => sum + v.on_time_rate, 0) / mappedSuppliers.length)).toFixed(1)

  const pagination = suppliersRes?.data?.pagination ?? (suppliersRes as any)?.metadata?.pagination
  const totalRows = pagination?.total_rows ?? filtered.length
  const totalPages = pagination?.total_pages ?? Math.ceil(totalRows / limit) ?? 1

  // ─────────────────────────────────────────────────────────────────────────
  // ① LIVE API: GET /scm/vendors/optimal?sku={sku}
  // ─────────────────────────────────────────────────────────────────────────

  const handleFindOptimal = async () => {
    if (!optimalSku.trim()) {
      toast.error('SKU required', { description: 'Please enter a SKU to route.' })
      return
    }
    setIsFindingOptimal(true)
    setOptimalResult(null)
    try {
      const res = await supplierService.getOptimalSupplier(optimalSku.trim())
      if (res.data) {
        // Map optimal result to support GORM PascalCase casing perfectly
        const optimalSupplier = res.data.supplier ?? (res.data as any).Supplier
        const optimalMapping = res.data.mapping ?? (res.data as any).Mapping

        const formattedSupplier: Supplier = {
          id: optimalSupplier.id ?? (optimalSupplier as any).ID,
          name: optimalSupplier.name ?? (optimalSupplier as any).Name,
          contact: optimalSupplier.contact ?? (optimalSupplier as any).Contact,
          tier: optimalSupplier.tier ?? (optimalSupplier as any).Tier,
          lead_time_days: optimalSupplier.lead_time_days ?? (optimalSupplier as any).LeadTimeDays ?? 0,
          quality_score: optimalSupplier.quality_score ?? (optimalSupplier as any).QualityScore ?? 0,
          on_time_rate: optimalSupplier.on_time_rate ?? (optimalSupplier as any).OnTimeRate ?? 0,
        }

        const formattedMapping: SkuMapping = {
          id: optimalMapping.id ?? (optimalMapping as any).ID,
          supplier_id: optimalMapping.supplier_id ?? (optimalMapping as any).SupplierID,
          sku: optimalMapping.sku ?? (optimalMapping as any).SKU,
          name: optimalMapping.name ?? (optimalMapping as any).Name,
          unit_price: optimalMapping.unit_price ?? (optimalMapping as any).UnitPrice ?? 0,
          lead_time_days: optimalMapping.lead_time_days ?? (optimalMapping as any).LeadTimeDays ?? 0,
          min_order_qty: optimalMapping.min_order_qty ?? (optimalMapping as any).MinOrderQty ?? 1,
        }

        setOptimalResult({
          supplier: formattedSupplier,
          mapping: formattedMapping,
        })

        toast.success('Optimal supplier found', {
          description: `${formattedSupplier.name} — score based on quality & on-time rate`,
        })
      }
    } catch (err) {
      const e = err as AxiosError
      if (e?.response?.status === 404) {
        toast.error('No supplier found', { description: `No supplier stocks SKU: ${optimalSku}` })
      } else {
        toast.error('Routing failed', { description: extractErrorMessage(err, 'Could not find optimal supplier.') })
      }
    } finally {
      setIsFindingOptimal(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ② LIVE API: POST /scm/vendors/{id}/recalc-metrics
  // ─────────────────────────────────────────────────────────────────────────

  const handleRecalcMetrics = async (supplier: { id: string; name: string }) => {
    const key = `recalc-${supplier.id}`
    if (isLoading(key)) return
    setLoading(key, true)
    try {
      await supplierService.recalcMetrics(supplier.id)
      toast.success(`Metrics updated — ${supplier.name}`, {
        description: 'OnTimeRate and QualityScore have been recalculated.',
      })
      refetchSuppliers()
      refetchMetrics()
    } catch (err) {
      toast.error('Recalc failed', { description: extractErrorMessage(err, 'Could not recalculate metrics.') })
    } finally {
      setLoading(key, false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ③ LIVE API: POST /scm/vendors — Create supplier
  // ─────────────────────────────────────────────────────────────────────────

  const handleSaveSupplier = async () => {
    if (!form.name.trim())    { toast.error('Supplier name is required'); return }
    if (!form.contact.trim()) { toast.error('Contact is required'); return }

    setIsSavingSupplier(true)
    try {
      await createSupplierMutation.mutateAsync({
        name: form.name,
        contact: form.contact,
        tier: form.tier,
        lead_time_days: form.lead_time_days,
      })
      toast.success('Supplier added', { description: `"${form.name}" registered successfully.` })
      setShowAddSupplier(false)
      setForm({ name: '', contact: '', tier: 'Tier 2', lead_time_days: 14 })
      refetchSuppliers()
      refetchMetrics()
    } catch (err) {
      toast.error('Failed to create supplier', { description: extractErrorMessage(err, 'Unknown error.') })
    } finally {
      setIsSavingSupplier(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ④ LIVE API: GET /scm/vendors/export — CSV export
  // ─────────────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!accessToken) {
      toast.error('Not authenticated')
      return
    }

    setLoading('export', true)
    try {
      // Fetch the raw CSV stream as a Blob using apiClient to automatically include auth header
      const blob = await apiClient.get('/scm/vendors/export', {
        responseType: 'blob',
      }) as unknown as Blob

      // Create a local download link in browser
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'suppliers_report.csv')
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Export initiated', {
        description: 'The supplier list and SKU mappings CSV has been downloaded.',
      })
    } catch (err) {
      toast.error('Export failed', {
        description: extractErrorMessage(err, 'Could not retrieve CSV report from the server.'),
      })
    } finally {
      setLoading('export', false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ⑦ LIVE API: POST /scm/vendors/{id}/sku-mappings
  // ─────────────────────────────────────────────────────────────────────────

  const handleSaveSku = async () => {
    if (!showAddSku) return
    if (!skuForm.sku.trim()) { toast.error('SKU is required'); return }
    if (!skuForm.name.trim()) { toast.error('Component name is required'); return }
    if (skuForm.unit_price <= 0) { toast.error('Unit price must be > 0'); return }

    setIsSavingSku(true)
    try {
      await createSkuMappingMutation.mutateAsync({
        supplierId: showAddSku,
        payload: {
          sku: skuForm.sku,
          name: skuForm.name,
          unit_price: skuForm.unit_price,
          lead_time_days: skuForm.lead_time_days,
          min_order_qty: skuForm.min_order_qty,
        },
      })
      toast.success('SKU mapping added')
      setShowAddSku(null)
      setSkuForm({ sku: '', name: '', unit_price: 0, lead_time_days: 14, min_order_qty: 1 })
      refetchSuppliers()
    } catch (err) {
      toast.error('Failed to add SKU mapping', { description: extractErrorMessage(err, 'Unknown error.') })
    } finally {
      setIsSavingSku(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Supplier</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Manage supplier relationships, map SKU associations, and optimize procurement routing.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {/* ① Optimal Supplier Routing */}
          <button
            onClick={() => { setShowOptimal(true); setOptimalResult(null); setOptimalSku('') }}
            className="px-4 py-2 border border-mrp-primary/40 text-mrp-primary hover:bg-mrp-primary/10 text-sm font-medium rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Zap size={15} /> Find Optimal
          </button>

          {/* ③ Add Supplier */}
          <button
            onClick={() => setShowAddSupplier(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Supplier
          </button>
        </div>
      </div>

      {/* ── API Error Banner ── */}
      {suppliersError && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="text-red-400 shrink-0 mt-[2px]" size={16} />
          <div>
            <p className="text-sm font-bold text-red-400 font-mono">API INTEGRATION DIAGNOSTICS</p>
            <p className="text-xs text-red-400/80 leading-relaxed mt-0.5">
              Request failed: {suppliersError instanceof Error ? suppliersError.message : String(suppliersError)}
            </p>
            <p className="text-[10px] text-mrp-text-muted mt-1 italic leading-relaxed">
              Base URL: {API_BASE_URL} | Base Path: /scm/vendors | Access Token present in memory: {accessToken ? "YES" : "NO"}
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Cards (⑤ from computed mock, will be from /metrics when live) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Active Suppliers', value: String(totalActive),          color: 'text-white',       accent: '' },
          { label: 'Avg On-Time Rate',        value: `${avgOnTime}%`,              color: 'text-mrp-success', accent: 'border-l-4 border-l-mrp-success' },
          { label: 'Tier 1 Suppliers',        value: String(mappedSuppliers.filter(s => s.tier === 'Tier 1').length), color: 'text-mrp-primary', accent: 'border-l-4 border-l-mrp-primary' },
          { label: 'Under Review (Tier 3)',   value: String(mappedSuppliers.filter(s => s.tier === 'Tier 3').length), color: 'text-mrp-warning', accent: 'border-l-4 border-l-mrp-warning' },
        ].map((k) => (
          <div key={k.label} className={`bg-mrp-panel border border-mrp-border rounded-sm p-4 ${k.accent}`}>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">{k.label}</span>
            <span className={`font-mono text-2xl font-bold ${k.color}`}>{k.value}</span>
          </div>
        ))}
      </div>

      {/* ── Data Table ── */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors cursor-pointer ${
                  filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Search */}
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-mrp-panel border border-mrp-border text-white py-1.5 pl-9 pr-4 text-[13px] rounded-sm focus:border-mrp-primary focus:outline-none transition-colors placeholder:text-mrp-text-muted"
                placeholder="Search suppliers or SKUs..."
              />
            </div>

            {/* ⑥ Export */}
            <button
              onClick={handleExport}
              disabled={isLoading('export')}
              className="px-3 py-1.5 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading('export') ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <Download size={15} />
              )}
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['#', 'Supplier ID', 'Name', 'Contact', 'Tier', 'Quality', 'On-Time', 'Actions'].map((col) => (
                  <th key={col} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${
                    col === '#' ? 'w-10 text-center' : ['Quality', 'On-Time'].includes(col) ? 'text-right' : col === 'Actions' ? 'text-right' : ''
                  }`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((supplier, idx) => {
                const isExpanded = expandedRows.has(supplier.id)
                const tCfg       = tierBadge(supplier.tier)
                const isRecalcing = isLoading(`recalc-${supplier.id}`)

                return (
                  <React.Fragment key={supplier.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted text-center">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-mrp-text-muted whitespace-nowrap">{supplier.id.slice(0, 8)}…</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{supplier.name}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{supplier.contact}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${tCfg.bg} border ${tCfg.border} ${tCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tCfg.dot}`} />
                          {supplier.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono text-[13px] font-bold ${scoreColor(supplier.quality_score)}`}>
                          {supplier.quality_score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-mono text-[13px] font-bold ${scoreColor(supplier.on_time_rate)}`}>
                          {supplier.on_time_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* View SKUs */}
                          <button onClick={() => toggleRow(supplier.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border cursor-pointer"
                          >
                            {isExpanded ? 'Hide SKUs' : 'View SKUs'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>

                          {/* ② Recalc Metrics — LIVE API */}
                          <button
                            id={`supplier-recalc-${supplier.id}`}
                            onClick={() => handleRecalcMetrics(supplier)}
                            disabled={isRecalcing}
                            title="Recalculate OnTimeRate & QualityScore"
                            className="p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-primary/10 hover:border-mrp-primary/40 hover:text-mrp-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isRecalcing
                              ? <Loader2 size={14} className="animate-spin" />
                              : <RefreshCw size={14} />
                            }
                          </button>

                          {/* Edit (placeholder) */}
                          <button
                            onClick={() => toast.info('Edit Supplier', { description: `Editing ${supplier.name}` })}
                            className="p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-white cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded SKU Mapping Panel ── */}
                    {isExpanded && (
                      <tr key={`${supplier.id}-expanded`} className="bg-[#1a1c1e] border-b border-mrp-border">
                        <td />
                        <td className="py-4 px-4 pb-6" colSpan={7}>
                          <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
                            <div className="flex items-center justify-between mb-3 border-b border-mrp-border pb-2">
                              <h4 className="text-[11px] font-bold text-mrp-primary uppercase tracking-wider">
                                SKU Mapping — {supplier.name}
                              </h4>
                              {/* ⑦ Add SKU mapping */}
                              <button
                                onClick={() => {
                                  setShowAddSku(supplier.id)
                                  setSkuForm({ sku: '', name: '', unit_price: 0, lead_time_days: 14, min_order_qty: 1 })
                                }}
                                className="flex items-center gap-1 text-[11px] text-mrp-primary hover:text-white border border-mrp-primary/30 hover:bg-mrp-primary px-2 py-1 rounded-sm transition-colors cursor-pointer"
                              >
                                <Plus size={11} /> Add SKU
                              </button>
                            </div>
                            <div className="grid grid-cols-5 gap-4 text-[13px]">
                              {['SKU', 'Component Name', 'Unit Price', 'Lead Time', 'Min Qty'].map((h) => (
                                <div key={h} className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">{h}</div>
                              ))}
                              {supplier.skuMappings.map((sku) => (
                                <React.Fragment key={sku.sku}>
                                  <div className="col-span-1 font-mono text-white border-t border-mrp-border pt-2">{sku.sku}</div>
                                  <div className="text-mrp-text-secondary border-t border-mrp-border pt-2">{sku.name}</div>
                                  <div className="text-right font-mono text-white border-t border-mrp-border pt-2">{sku.unitPriceDisplay}</div>
                                  <div className="font-mono text-mrp-text-muted border-t border-mrp-border pt-2">{sku.lead_time_days}d</div>
                                  <div className="font-mono text-mrp-text-muted border-t border-mrp-border pt-2">MOQ {sku.min_order_qty}</div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {totalRows > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, totalRows)} of {totalRows} Suppliers
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
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
                disabled={page === 1}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ① Find Optimal Supplier — GET /scm/vendors/optimal [LIVE]
      ═══════════════════════════════════════════════════════════════════ */}
      {showOptimal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowOptimal(false)}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Zap size={18} className="text-mrp-primary" /> Find Optimal Supplier
              </h3>
              <button onClick={() => setShowOptimal(false)} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">
                  SKU to Route
                </label>
                <div className="flex gap-2">
                  <input
                    id="optimal-sku-input"
                    value={optimalSku}
                    onChange={(e) => setOptimalSku(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFindOptimal()}
                    placeholder="e.g. CPU-XM100PRO-14C-55W"
                    className="flex-1 bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                  />
                  <button
                    id="optimal-find-btn"
                    onClick={handleFindOptimal}
                    disabled={isFindingOptimal}
                    className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[13px] font-bold rounded-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isFindingOptimal ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Route
                  </button>
                </div>
                <p className="text-[11px] text-mrp-text-muted mt-1.5">
                  Scoring formula: (quality × 0.6 + on_time_rate × 0.4) − (unit_price / 10000)
                </p>
              </div>

              {/* Result */}
              {optimalResult && (
                <div className="bg-mrp-app border border-mrp-success/30 rounded-sm p-4 space-y-3">
                  <div className="flex items-center gap-2 text-mrp-success text-[12px] font-bold uppercase tracking-wider">
                    <Zap size={14} /> Optimal Supplier
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                    <span className="text-mrp-text-muted">Supplier</span>
                    <span className="text-white font-medium">{optimalResult.supplier.name}</span>
                    <span className="text-mrp-text-muted">Tier</span>
                    <span className="text-white">{optimalResult.supplier.tier}</span>
                    <span className="text-mrp-text-muted">Quality Score</span>
                    <span className={`font-mono font-bold ${scoreColor(optimalResult.supplier.quality_score)}`}>
                      {optimalResult.supplier.quality_score.toFixed(1)}%
                    </span>
                    <span className="text-mrp-text-muted">On-Time Rate</span>
                    <span className={`font-mono font-bold ${scoreColor(optimalResult.supplier.on_time_rate)}`}>
                      {optimalResult.supplier.on_time_rate.toFixed(1)}%
                    </span>
                    <span className="text-mrp-text-muted border-t border-mrp-border pt-2">SKU</span>
                    <span className="text-white font-mono border-t border-mrp-border pt-2">{optimalResult.mapping.sku}</span>
                    <span className="text-mrp-text-muted">Unit Price</span>
                    <span className="text-white font-mono">${optimalResult.mapping.unit_price.toFixed(2)}</span>
                    <span className="text-mrp-text-muted">Lead Time</span>
                    <span className="text-white font-mono">{optimalResult.mapping.lead_time_days} days</span>
                    <span className="text-mrp-text-muted">Min Order Qty</span>
                    <span className="text-white font-mono">{optimalResult.mapping.min_order_qty}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end">
              <button onClick={() => setShowOptimal(false)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ③ Add Supplier — POST /scm/vendors [PLANNED]
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSupplier(false)}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Supplier</h3>
              <button onClick={() => setShowAddSupplier(false)} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>



            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier Name</label>
                <input
                  id="add-supplier-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Samsung Electronics"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Contact</label>
                <input
                  id="add-supplier-contact"
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="e.g. procurement@supplier.com"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Tier</label>
                  <select
                    id="add-supplier-tier"
                    value={form.tier}
                    onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as SupplierTier }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                  >
                    <option value="Tier 1">Tier 1</option>
                    <option value="Tier 2">Tier 2</option>
                    <option value="Tier 3">Tier 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Lead Time (days)</label>
                  <input
                    id="add-supplier-lead-time"
                    type="number"
                    min={1}
                    value={form.lead_time_days}
                    onChange={(e) => setForm((f) => ({ ...f, lead_time_days: Number(e.target.value) }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button onClick={() => setShowAddSupplier(false)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
              <button
                id="add-supplier-submit"
                onClick={handleSaveSupplier}
                disabled={isSavingSupplier}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingSupplier && <Loader2 size={12} className="animate-spin" />}
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL: ⑦ Add SKU Mapping — POST /scm/vendors/{id}/sku-mappings [PLANNED]
      ═══════════════════════════════════════════════════════════════════ */}
      {showAddSku && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSku(null)}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add SKU Mapping</h3>
              <button onClick={() => setShowAddSku(null)} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>



            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">SKU</label>
                  <input
                    id="add-sku-sku"
                    value={skuForm.sku}
                    onChange={(e) => setSkuForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. CPU-XM100PRO-14C-55W"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Unit Price (USD)</label>
                  <input
                    id="add-sku-price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={skuForm.unit_price || ''}
                    onChange={(e) => setSkuForm((f) => ({ ...f, unit_price: Number(e.target.value) }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Component Name</label>
                <input
                  id="add-sku-name"
                  value={skuForm.name}
                  onChange={(e) => setSkuForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Zeus SOC XM100 Pro (14-Core)"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Lead Time (days)</label>
                  <input
                    id="add-sku-lead-time"
                    type="number"
                    min={1}
                    value={skuForm.lead_time_days}
                    onChange={(e) => setSkuForm((f) => ({ ...f, lead_time_days: Number(e.target.value) }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Min Order Qty</label>
                  <input
                    id="add-sku-moq"
                    type="number"
                    min={1}
                    value={skuForm.min_order_qty}
                    onChange={(e) => setSkuForm((f) => ({ ...f, min_order_qty: Number(e.target.value) }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button onClick={() => setShowAddSku(null)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
              <button
                id="add-sku-submit"
                onClick={handleSaveSku}
                disabled={isSavingSku}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSavingSku && <Loader2 size={12} className="animate-spin" />}
                Save SKU Mapping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
