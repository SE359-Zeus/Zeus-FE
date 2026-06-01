'use client'

/**
 * @file ShipmentView.tsx
 * @description SCM Shipment page — full API integration.
 *
 * ─── Integrated APIs ─────────────────────────────────────────────────────────
 *  GET    /scm/shipments                         — list with pagination + filter
 *  GET    /scm/shipments/metrics                 — KPI cards
 *  GET    /scm/shipments/carriers                — carrier dropdown
 *  POST   /scm/shipments                         — create shipment
 *  POST   /scm/shipments/{id}/lock               — acquire dispatch lock
 *  POST   /scm/shipments/{id}/dispatch           — dispatch (Scheduled → In Transit)
 *  POST   /scm/shipments/{id}/deliver            — mark delivered (auto-creates GR!)
 *  PUT    /scm/shipments/{id}/state              — generic state transition
 *
 * ─── Key Business Flow ───────────────────────────────────────────────────────
 *  Create Shipment (po_ref required) → Dispatch → Mark Delivered
 *  ↳ "Mark Delivered" triggers backend to auto-create a GoodsReceipt linked to the PO
 *  ↳ After delivery, the GR appears in the Goods Receipt page for inspection
 */

import React, { useState } from 'react'
import {
  Download, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Filter, Truck, Package, X, Loader2, ShieldAlert, PackageCheck,
  Info, Lock, Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib'
import { downloadFile } from '@/lib/axios.client'
import {
  useShipments,
  useShipmentMetrics,
  useCarriers,
  useCreateShipment,
  useDispatchShipment,
  useMarkDelivered,
  useTransitionShipmentState,
  useAcquireDispatchLock,
  useReleaseDispatchLock,
} from '../useShipments'
import type { ShipmentStatus, CreateShipmentRequest } from '../shipment.types'

type FilterType = 'ALL' | ShipmentStatus

// ─── Supplier UUID map (mirrors PurchaseOrderView) ────────────────────────────
const SUPPLIER_UUIDS: Record<string, string> = {
  'Northwind Component Supply': 'd870ac5c-fa7d-394d-8f63-bbbb105ded34',
  'Apex Industrial Parts':      '24978c6b-587e-3528-92d2-84bf53067f09',
  'BluePeak Electronics':       'a6341699-fe34-3ab5-97a8-f14e1c868436',
  'Orion Component Works':      '4ad26053-dcd1-3d15-b58e-ee8117e23ad2',
  'Vertex Supply Group':        'f7f72cd2-3949-3595-a9db-f1b76f4786a4',
}

// ─── Status config ────────────────────────────────────────────────────────────
const statusConfig: Record<ShipmentStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Scheduled:    { bg: 'bg-mrp-warning/10',  border: 'border-mrp-warning/20',  text: 'text-mrp-warning',  dot: 'bg-mrp-warning',  pulse: false },
  'In Transit': { bg: 'bg-mrp-primary/10',  border: 'border-mrp-primary/20',  text: 'text-mrp-primary',  dot: 'bg-mrp-primary',  pulse: true  },
  Delivered:    { bg: 'bg-mrp-success/10',  border: 'border-mrp-success/20',  text: 'text-mrp-success',  dot: 'bg-mrp-success',  pulse: false },
  Delayed:      { bg: 'bg-mrp-danger/10',   border: 'border-mrp-danger/20',   text: 'text-mrp-danger',   dot: 'bg-mrp-danger',   pulse: true  },
}

const LIFECYCLE_STEPS: ShipmentStatus[] = ['Scheduled', 'In Transit', 'Delivered']

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL',         label: 'All'         },
  { key: 'Scheduled',   label: 'Scheduled'   },
  { key: 'In Transit',  label: 'In Transit'  },
  { key: 'Delivered',   label: 'Delivered'   },
  { key: 'Delayed',     label: 'Delayed'     },
]

function getStepState(currentStatus: ShipmentStatus, step: ShipmentStatus): 'done' | 'current' | 'future' {
  const resolved = currentStatus === 'Delayed' ? 'In Transit' : currentStatus
  const ci = LIFECYCLE_STEPS.indexOf(resolved)
  const si = LIFECYCLE_STEPS.indexOf(step)
  if (si < ci) return 'done'
  if (si === ci) return 'current'
  return 'future'
}

function fmtDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return raw
  }
}

export function ShipmentView() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const operatorId = currentUser?.id ?? 'demo-operator'

  const [filter,       setFilter]       = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [page,  setPage]  = useState(1)
  const [limit, setLimit] = useState(15)

  // ── React Query ─────────────────────────────────────────────────────────────
  const { data: listRes,    isLoading: isListLoading  } = useShipments({ page, limit })
  const { data: metricsRes                            } = useShipmentMetrics()
  const { data: carriersRes                           } = useCarriers()

  const createMutation   = useCreateShipment()
  const dispatchMutation = useDispatchShipment()
  const deliverMutation  = useMarkDelivered()
  const transitionMutation = useTransitionShipmentState()
  const acquireLockMutation = useAcquireDispatchLock()
  const releaseLockMutation = useReleaseDispatchLock()

  // ── Normalize API response ───────────────────────────────────────────────────
  const rawData = listRes?.data
  const apiShipments = Array.isArray(rawData)
    ? rawData as any[]
    : ((rawData as any)?.items ?? (rawData as any)?.data ?? [])

  const pagination = (rawData as any)?.pagination ?? listRes?.metadata?.pagination
  const totalRows  = pagination?.total_rows  ?? apiShipments.length
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(totalRows / limit))

  const startIndex = (page - 1) * limit
  const baseShipments = apiShipments.length > limit ? apiShipments.slice(startIndex, startIndex + limit) : apiShipments

  const metrics = metricsRes?.data ?? null
  const carriers: string[] = (carriersRes?.data as any[] ?? []).map((c: any) => c.name ?? c)

  // ── Map API rows to uniform shape ────────────────────────────────────────────
  const rows = baseShipments.map((s: any) => ({
    id:          s.id ?? s.ID,
    poRef:       s.po_ref ?? s.PORef ?? '—',
    supplier:    s.supplier_name ?? s.SupplierName ?? '—',
    status:      (s.status ?? s.Status) as ShipmentStatus,
    carrier:     s.carrier ?? s.Carrier ?? '—',
    trackingNo:  s.tracking_no ?? s.TrackingNo ?? '—',
    origin:      s.origin ?? s.Origin ?? '—',
    shipDate:    fmtDate(s.ship_date ?? s.ShipDate),
    eta:         fmtDate(s.eta ?? s.ETA),
    lockedBy:    s.locked_by ?? s.LockedBy ?? null,
    lockExpiresAt: s.lock_expires_at ?? s.LockExpiresAt ?? null,
    items:       (s.items ?? s.Items ?? []).map((li: any) => ({
      id:          li.id ?? li.ID,
      sku:         li.sku ?? li.SKU,
      description: li.description ?? li.Description ?? '—',
      qty:         li.qty ?? li.Qty ?? 0,
    })),
  }))

  const filtered = filter === 'ALL' ? rows : rows.filter(s => s.status === filter)

  const toggleRow = (id: string) => {
    setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── KPI Cards ────────────────────────────────────────────────────────────────
  const kpiCards = [
    {
      label: 'Total Shipments',
      value: metrics ? String(metrics.total_shipments) : String(rows.length),
      color: 'text-white', accent: null, badge: null,
    },
    {
      label: 'In Transit',
      value: metrics ? String(metrics.in_transit) : String(rows.filter(r => r.status === 'In Transit').length),
      color: 'text-mrp-primary', accent: 'border-l-4 border-l-mrp-primary',
      badge: <span className="animate-pulse flex h-2 w-2 rounded-full bg-mrp-primary" />,
    },
    {
      label: 'Delayed',
      value: metrics ? String(metrics.delayed) : String(rows.filter(r => r.status === 'Delayed').length),
      color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
      badge: <span className="text-[10px] text-mrp-danger">Requires attention</span>,
    },
    {
      label: 'On-Time Rate',
      value: metrics ? `${metrics.on_time_rate.toFixed(1)}%` : '—',
      color: 'text-mrp-success', accent: null, badge: null,
    },
  ]

  // ── Create Shipment Modal ────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    poRef: '', supplier: '', carrier: '', trackingNo: '', origin: '', shipDate: '',
  })

  const resetForm = () => setForm({ poRef: '', supplier: '', carrier: '', trackingNo: '', origin: '', shipDate: '' })

  const handleCreate = () => {
    if (!form.poRef.trim())    { toast.error('PO Reference is required'); return }
    if (!form.supplier.trim()) { toast.error('Supplier is required'); return }
    if (!form.carrier.trim())  { toast.error('Carrier is required'); return }

    const supplierId = SUPPLIER_UUIDS[form.supplier]
    if (!supplierId) { toast.error('Supplier not found in system'); return }

    const payload: CreateShipmentRequest = {
      po_ref:      form.poRef.trim(),
      supplier_id: supplierId,
      carrier:     form.carrier.trim(),
      tracking_no: form.trackingNo.trim() || undefined,
      origin:      form.origin.trim()     || undefined,
      ship_date:   form.shipDate ? new Date(form.shipDate).toISOString() : undefined,
    }

    createMutation.mutate(payload, {
      onSuccess: (res) => {
        const id = (res as any)?.data?.id ?? 'new'
        toast.success('Shipment Created', { description: `${id} linked to ${form.poRef}` })
        setShowCreate(false)
        resetForm()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err.message
        toast.error('Failed to create shipment', { description: msg })
      },
    })
  }

  // ── Dispatch / Deliver actions ────────────────────────────────────────────────
  const handleAcquireLock = (shipmentId: string) => {
    acquireLockMutation.mutate({ shipmentId, payload: { operator_id: operatorId } }, {
      onSuccess: () => toast.success('Lock Acquired', { description: `You now have exclusive rights to dispatch ${shipmentId}` }),
      onError:   (err: any) => toast.error('Failed to acquire lock', { description: err?.response?.data?.message || err.message }),
    })
  }

  const handleReleaseLock = (shipmentId: string) => {
    releaseLockMutation.mutate(shipmentId, {
      onSuccess: () => toast.success('Lock Released', { description: `Lock on ${shipmentId} released` }),
      onError:   (err: any) => toast.error('Failed to release lock', { description: err?.response?.data?.message || err.message }),
    })
  }

  const handleDispatch = (shipmentId: string) => {
    dispatchMutation.mutate({ shipmentId, payload: { operator_id: operatorId } }, {
      onSuccess: () => toast.success('Shipment Dispatched', { description: `${shipmentId} is now In Transit` }),
      onError:   (err: any) => toast.error('Failed to dispatch', { description: err?.response?.data?.message || err.message }),
    })
  }

  const handleMarkDelivered = (shipmentId: string) => {
    deliverMutation.mutate({ shipmentId, payload: { operator_id: operatorId } }, {
      onSuccess: () => toast.success('Shipment Delivered', {
        description: `${shipmentId} marked as Delivered. A Goods Receipt has been automatically created on the GR page.`,
        duration: 6000,
      }),
      onError: (err: any) => toast.error('Failed to mark delivered', { description: err?.response?.data?.message || err.message }),
    })
  }

  const handleMarkDelayed = (shipmentId: string) => {
    transitionMutation.mutate({ shipmentId, payload: { new_state: 'Delayed' } }, {
      onSuccess: () => toast.warning('Shipment Marked Delayed', { description: `${shipmentId} flagged as Delayed` }),
      onError:   (err: any) => toast.error('Failed to update state', { description: err?.response?.data?.message || err.message }),
    })
  }

  const handleResumeFromDelay = (shipmentId: string) => {
    transitionMutation.mutate({ shipmentId, payload: { new_state: 'In Transit' } }, {
      onSuccess: () => toast.success('Shipment Resumed', { description: `${shipmentId} is back In Transit` }),
      onError:   (err: any) => toast.error('Failed to resume', { description: err?.response?.data?.message || err.message }),
    })
  }

  // ── Export Report ─────────────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false)
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await downloadFile('/scm/shipments/export', 'shipments_report.csv')
      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  // ── Is any action pending for a specific row ──────────────────────────────────
  const isBusy = dispatchMutation.isPending || deliverMutation.isPending || transitionMutation.isPending || acquireLockMutation.isPending || releaseLockMutation.isPending

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Shipment</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Track inbound shipments from suppliers — from scheduled dispatch to warehouse delivery.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Create Shipment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <div key={card.label} className={`bg-mrp-panel border border-mrp-border p-4 flex flex-col justify-between rounded-sm ${card.accent ?? ''}`}>
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">{card.label}</span>
            <div className="flex items-baseline justify-between mt-3">
              <span className={`font-mono font-bold text-2xl ${card.color}`}>{card.value}</span>
              {card.badge}
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
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
          <div className="flex items-center gap-2">
            <button className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
              <Filter size={16} />
            </button>
            <button className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['Shipment ID', 'PO Reference', 'Supplier', 'Items', 'Status', 'Carrier', 'Ship Date', ''].map((col) => (
                  <th key={col} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${col === '' ? 'text-right' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {isListLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 size={24} className="animate-spin text-mrp-primary mx-auto mb-2" />
                    <span className="text-mrp-text-muted text-[13px]">Loading shipments…</span>
                  </td>
                </tr>
              )}
              {!isListLoading && filtered.map((shp) => {
                const isExpanded = expandedRows.has(shp.id)
                const cfg = statusConfig[shp.status] ?? statusConfig['Scheduled']

                return (
                  <React.Fragment key={shp.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary whitespace-nowrap">{shp.id}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white">{shp.poRef}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{shp.supplier}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted">{shp.items.length}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
                          {shp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{shp.carrier}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{shp.shipDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => toggleRow(shp.id)} className="p-1 text-mrp-text-muted hover:text-white transition-colors cursor-pointer">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <tr key={`${shp.id}-exp`} className="bg-[#1a1c1e]">
                        <td colSpan={8} className="p-0 border-b border-mrp-border">
                          <div className="p-6 space-y-6">
                            {/* Lifecycle Stepper */}
                            <div className="relative flex justify-between max-w-2xl mx-auto py-2">
                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-mrp-border -translate-y-1/2 -z-0" />
                              {LIFECYCLE_STEPS.map((step) => {
                                const state = getStepState(shp.status, step)
                                return (
                                  <div key={step} className="flex flex-col items-center gap-2 z-10 bg-[#1a1c1e] px-3">
                                    {state === 'done' ? (
                                      <div className="w-7 h-7 rounded-full bg-mrp-primary flex items-center justify-center">
                                        <Check size={14} className="text-white" />
                                      </div>
                                    ) : state === 'current' ? (
                                      <div className="w-7 h-7 rounded-full border-2 border-mrp-primary bg-[#1a1c1e] flex items-center justify-center">
                                        <span className="w-2 h-2 rounded-full bg-mrp-primary animate-pulse" />
                                      </div>
                                    ) : (
                                      <div className="w-7 h-7 rounded-full border-2 border-mrp-border bg-[#1a1c1e]" />
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                      state === 'current' ? 'text-mrp-primary' : state === 'done' ? 'text-white' : 'text-mrp-text-muted opacity-50'
                                    }`}>{step}</span>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Shipment Info + Line Items */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Line Items */}
                              <div className="lg:col-span-2 bg-mrp-panel border border-mrp-border rounded-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                  <thead className="bg-mrp-app border-b border-mrp-border">
                                    <tr>
                                      {['SKU', 'Description', 'Qty'].map((h) => (
                                        <th key={h} className={`py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider ${h === 'Qty' ? 'text-right' : ''}`}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-mrp-border">
                                    {shp.items.length === 0 ? (
                                      <tr>
                                        <td colSpan={3} className="py-4 px-4 text-center text-mrp-text-muted text-[12px]">No line items on record</td>
                                      </tr>
                                    ) : shp.items.map((li: any) => (
                                      <tr key={li.sku ?? li.id}>
                                        <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-mrp-text-secondary">{li.description}</td>
                                        <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{li.qty}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Shipment Metadata + Actions */}
                              <div className="bg-mrp-app border border-mrp-border rounded-sm p-4 space-y-3">
                                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-2">Shipment Details</h3>
                                {[
                                  { label: 'Tracking No.', value: shp.trackingNo },
                                  { label: 'Origin',       value: shp.origin    },
                                  { label: 'Carrier',      value: shp.carrier   },
                                  { label: 'Ship Date',    value: shp.shipDate  },
                                  { label: 'ETA',          value: shp.eta       },
                                ].map((row) => (
                                  <div key={row.label} className="flex justify-between text-[13px]">
                                    <span className="text-mrp-text-muted">{row.label}</span>
                                    <span className="font-mono text-white text-right max-w-[60%] truncate">{row.value}</span>
                                  </div>
                                ))}

                                {/* Status-specific alerts */}
                                {shp.status === 'Delayed' && (
                                  <div className="mt-3 pt-2 border-t border-mrp-border">
                                    <span className="text-mrp-danger text-[11px] font-bold uppercase tracking-wider">⚠ Shipment Delayed</span>
                                    <p className="text-mrp-text-muted text-[11px] mt-1">Contact supplier to confirm revised ETA.</p>
                                  </div>
                                )}

                                {shp.status === 'Delivered' && (
                                  <div className="mt-3 pt-2 border-t border-mrp-border flex items-start gap-2 text-[11px] text-mrp-text-secondary">
                                    <Info size={13} className="text-mrp-success mt-0.5 flex-shrink-0" />
                                    <span>
                                      GR <span className="font-mono text-mrp-primary">{shp.poRef}-GR-001</span> has been created on the{' '}
                                      <a href="/scm/goods-receipt" className="text-mrp-primary underline hover:text-white transition-colors">Goods Receipt page</a>.
                                    </span>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="pt-3 border-t border-mrp-border space-y-2">
                                  {/* Scheduled → Dispatch */}
                                  {shp.status === 'Scheduled' && (
                                    <>
                                      {(!shp.lockedBy || (shp.lockExpiresAt && new Date(shp.lockExpiresAt) < new Date())) ? (
                                        <button
                                          onClick={() => handleAcquireLock(shp.id)}
                                          disabled={isBusy}
                                          className="w-full px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                          {acquireLockMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
                                          Acquire Lock to Dispatch
                                        </button>
                                      ) : shp.lockedBy === operatorId ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleReleaseLock(shp.id)}
                                            disabled={isBusy}
                                            className="w-1/3 px-2 py-2 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            {releaseLockMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Unlock size={13} />}
                                            Release
                                          </button>
                                          <button
                                            onClick={() => handleDispatch(shp.id)}
                                            disabled={isBusy}
                                            className="w-2/3 px-4 py-2 bg-mrp-success/80 hover:bg-mrp-success text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                          >
                                            {dispatchMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                                            Dispatch Shipment
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          disabled
                                          className="w-full px-4 py-2 border border-mrp-border bg-mrp-panel text-mrp-text-muted text-[11px] font-bold uppercase tracking-wider rounded-sm opacity-60 cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                          <Lock size={13} />
                                          Locked by {shp.lockedBy}
                                        </button>
                                      )}
                                    </>
                                  )}

                                  {/* In Transit → Mark Delivered */}
                                  {shp.status === 'In Transit' && (
                                    <>
                                      <button
                                        onClick={() => handleMarkDelivered(shp.id)}
                                        disabled={isBusy}
                                        className="w-full px-4 py-2 bg-mrp-success/80 hover:bg-mrp-success text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        {deliverMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={13} />}
                                        Mark as Delivered
                                      </button>
                                      <button
                                        onClick={() => handleMarkDelayed(shp.id)}
                                        disabled={isBusy}
                                        className="w-full px-4 py-2 border border-mrp-danger/50 text-mrp-danger hover:bg-mrp-danger/10 text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                      >
                                        Mark as Delayed
                                      </button>
                                    </>
                                  )}

                                  {/* Delayed → Resume In Transit */}
                                  {shp.status === 'Delayed' && (
                                    <button
                                      onClick={() => handleResumeFromDelay(shp.id)}
                                      disabled={isBusy}
                                      className="w-full px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                      {transitionMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Truck size={13} />}
                                      Resume In Transit
                                    </button>
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
              {!isListLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-mrp-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={36} className="opacity-40 text-mrp-text-muted" />
                      <span className="text-[14px] font-semibold text-white">No shipments found</span>
                      <span className="text-[11px] opacity-60">No records match the selected filter.</span>
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
            Showing {filtered.length > 0 ? (page - 1) * limit + 1 : 0}–{(page - 1) * limit + filtered.length} of {totalRows} Shipments
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
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page <= 1}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page >= totalPages}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!createMutation.isPending) { setShowCreate(false); resetForm() } }}
        >
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-mrp-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Create Shipment</h3>
              <button
                onClick={() => { if (!createMutation.isPending) { setShowCreate(false); resetForm() } }}
                disabled={createMutation.isPending}
                className="text-mrp-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Info banner */}
              <div className="flex items-start gap-2 px-3 py-2 border border-mrp-primary/30 bg-mrp-primary/5 rounded-sm text-[11px] text-mrp-text-secondary">
                <Info size={13} className="text-mrp-primary mt-0.5 flex-shrink-0" />
                <span>
                  When you <strong className="text-white">Mark as Delivered</strong>, a Goods Receipt is automatically created on the{' '}
                  <a href="/scm/goods-receipt" className="text-mrp-primary underline">GR page</a> for inspection.
                </span>
              </div>

              {/* PO Reference + Ship Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">PO Reference *</label>
                  <input
                    value={form.poRef}
                    onChange={e => setForm(f => ({ ...f, poRef: e.target.value }))}
                    disabled={createMutation.isPending}
                    placeholder="e.g. PO-2026-006"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Ship Date</label>
                  <input
                    value={form.shipDate}
                    onChange={e => setForm(f => ({ ...f, shipDate: e.target.value }))}
                    disabled={createMutation.isPending}
                    type="date"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Supplier + Carrier */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier *</label>
                  <select
                    value={form.supplier}
                    onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    disabled={createMutation.isPending}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select supplier…</option>
                    {Object.keys(SUPPLIER_UUIDS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Carrier *</label>
                  <select
                    value={form.carrier}
                    onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))}
                    disabled={createMutation.isPending}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select carrier…</option>
                    {/* Live carriers from API, fallback to common ones */}
                    {(carriers.length > 0 ? carriers : ['DHL Express', 'FedEx International', 'UPS Freight', 'Maersk Shipping']).map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tracking No + Origin */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Tracking No.</label>
                  <input
                    value={form.trackingNo}
                    onChange={e => setForm(f => ({ ...f, trackingNo: e.target.value }))}
                    disabled={createMutation.isPending}
                    placeholder="e.g. DHL-1234567890"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Origin</label>
                  <input
                    value={form.origin}
                    onChange={e => setForm(f => ({ ...f, origin: e.target.value }))}
                    disabled={createMutation.isPending}
                    placeholder="e.g. Hillsboro, OR (US)"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => { if (!createMutation.isPending) { setShowCreate(false); resetForm() } }}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {createMutation.isPending ? 'Creating…' : 'Create Shipment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
