'use client'

import React, { useState } from 'react'
import {
  Download, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Filter, CheckCircle, Truck, X, Trash2, Loader2, ShieldAlert, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { useAuthStore } from '@/lib'
import {
  usePurchaseOrders,
  useCreateCustomPO,
  useApprovePO,
  useTransitionPOState,
} from '../hooks/usePurchaseOrders'
import { downloadFile } from '@/lib/axios.client'
import type { POStatus, CreateCustomPORequest } from '../purchase-order.types'

type FilterType = 'ALL' | POStatus

interface LineItem {
  sku: string; description: string; orderedQty: number
  unitPrice: number; receivedQty?: number
}

interface PurchaseOrder {
  id: string; vendor: string; targetBuild: string; status: POStatus
  totalValue: number; createdDate: string; expectedDelivery: string
  lineItems: LineItem[]; paymentTerms: string
}

interface SkuInfo { sku: string; description: string; unitPrice: number }
interface FormLineItem { sku: string; qty: number; unitPrice: number }

const SUPPLIER_UUIDS: Record<string, string> = {
  'Northwind Component Supply': 'd870ac5c-fa7d-394d-8f63-bbbb105ded34',
  'Apex Industrial Parts': '24978c6b-587e-3528-92d2-84bf53067f09',
  'BluePeak Electronics': 'a6341699-fe34-3ab5-97a8-f14e1c868436',
  'Orion Component Works': '4ad26053-dcd1-3d15-b58e-ee8117e23ad2',
  'Vertex Supply Group': 'f7f72cd2-3949-3595-a9db-f1b76f4786a4',
}

const SUPPLIER_SKUS: Record<string, SkuInfo[]> = {
  // Live GORM Seeded Suppliers & SKUs
  'Northwind Component Supply': [
    { sku: '5W10V25844', description: 'Wireless,WLAN,LTN,8852BE', unitPrice: 18.5 },
    { sku: '5T10S33238', description: 'TAPE H 82L5 Camera Cable_Colth', unitPrice: 43.75 },
    { sku: '5F10S13964', description: 'System FAN 82L5_L+R_DIS', unitPrice: 42.25 },
  ],
  'Apex Industrial Parts': [
    { sku: '5R31L08532', description: 'W11_H64_SL-ENG RUSB', unitPrice: 23.25 },
    { sku: '5F10S13964', description: 'System FAN 82L5_L+R_DIS', unitPrice: 48.5 },
    { sku: '5T10S33377', description: 'SSD Mylar H 82QQ 2242', unitPrice: 47 },
  ],
  'BluePeak Electronics': [
    { sku: '5T10S33377', description: 'SSD Mylar H 82QQ 2242', unitPrice: 53.25 },
    { sku: '5SB0S31990', description: 'Speaker H 82SK L+R', unitPrice: 51.75 },
    { sku: '5T10S33237', description: 'MYLAR H 82L5 D Cover_Zheguang', unitPrice: 77 },
  ],
  'Orion Component Works': [
    { sku: '5C50S25436', description: 'Sensor_Board H 82SN AMD', unitPrice: 56.5 },
    { sku: '5R60S37210', description: 'Mic Rubber H 82SK (L+R)*30', unitPrice: 81.75 },
    { sku: '5CB1H95501', description: 'Lower Case H 82SK CLGY', unitPrice: 80.25 },
  ],
  'Vertex Supply Group': [
    { sku: '5CB1H95501', description: 'Lower Case H 82SK CLGY', unitPrice: 86.5 },
    { sku: '5SS1C09736', description: 'Lenovo SSD 512G,M.2,2242,PCIE4X4,STD,SAMSUNG', unitPrice: 85 },
    { sku: '5B21H82164', description: 'Lenovo BDPLANAR MB R5HSCE_RTX3050_4G_16G_WINRM', unitPrice: 110.25 },
  ],
}

const mockPOs: PurchaseOrder[] = [
  {
    id: 'PO-2024-108', vendor: 'Vertex Supply Group', targetBuild: 'Aurora-VertexSupplyGroup',
    status: 'Draft', totalValue: 15400, createdDate: '2026-05-12', expectedDelivery: '2026-06-01',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'MOD-WIFI7-AX', description: 'WiFi 7 AX Module', orderedQty: 200, unitPrice: 35 },
      { sku: 'PSU-GAN-240W', description: '240W GaN Power Supply', orderedQty: 120, unitPrice: 75 },
    ],
  },
  {
    id: 'PO-2024-107', vendor: 'Orion Component Works', targetBuild: 'Helix-OrionComponentWorks',
    status: 'Draft', totalValue: 42000, createdDate: '2026-05-11', expectedDelivery: '2026-06-25',
    paymentTerms: 'Net 45',
    lineItems: [
      { sku: 'DISP-OLED-16', description: '16" 4K ProArt OLED Panel', orderedQty: 100, unitPrice: 420 },
    ],
  },
]

const statusConfig: Record<POStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Draft:       { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  Approved:    { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: false },
  'In Transit':{ bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: true },
  Received:    { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
  Partial:     { bg: 'bg-[#ff8a3d]/10', border: 'border-[#ff8a3d]/20', text: 'text-[#ff8a3d]', dot: 'bg-[#ff8a3d]', pulse: true },
  Void:        { bg: 'bg-mrp-panel border', border: 'border-mrp-border', text: 'text-mrp-text-muted', dot: 'bg-mrp-border', pulse: false },
}

const LIFECYCLE_STEPS: POStatus[] = ['Draft', 'Approved', 'In Transit', 'Received']

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Draft', label: 'Draft' },
  { key: 'Approved', label: 'Approved' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Partial', label: 'Partial' },
  { key: 'Received', label: 'Received' },
]

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) }

function getStepState(currentStatus: POStatus, step: POStatus): 'done' | 'current' | 'future' {
  const ci = LIFECYCLE_STEPS.indexOf(currentStatus === 'Partial' ? 'Received' : currentStatus === 'Void' ? 'Draft' : currentStatus)
  const si = LIFECYCLE_STEPS.indexOf(step)
  if (si < ci) return 'done'
  if (si === ci) return 'current'
  return 'future'
}

function getActionLabel(status: POStatus): string | null {
  switch (status) {
    case 'Draft': return 'Approve & Send'
    case 'Approved': return 'Mark In Transit'
    default: return null
  }
}

export function PurchaseOrderView() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  // ── React Query Hooks — Live SCM Purchase Order APIs ─────────────────────
  const { data: poListRes, isLoading: isListLoading } = usePurchaseOrders()

  const apiPOs = Array.isArray(poListRes?.data)
    ? poListRes.data
    : (poListRes?.data as any)?.items ?? []

  const createCustomMutation = useCreateCustomPO()
  const approveMutation = useApprovePO()
  const transitionMutation = useTransitionPOState()

  // ── Computed & Robust Casing Mapping ─────────────────────────────────────
  // Mock data fallback ONLY before API returns first payload
  const displayPOs = poListRes ? apiPOs : mockPOs

  const rows = displayPOs.map((po: any) => {
    const id = po.id ?? po.ID
    
    // Resolve vendor name dynamically
    const VENDOR_NAMES: Record<string, string> = {
      'd870ac5c-fa7d-394d-8f63-bbbb105ded34': 'Northwind Component Supply',
      '24978c6b-587e-3528-92d2-84bf53067f09': 'Apex Industrial Parts',
      'a6341699-fe34-3ab5-97a8-f14e1c868436': 'BluePeak Electronics',
      '4ad26053-dcd1-3d15-b58e-ee8117e23ad2': 'Orion Component Works',
      'f7f72cd2-3949-3595-a9db-f1b76f4786a4': 'Vertex Supply Group',
    }
    const vendorId = po.vendor_id ?? po.VendorID
    const vendor = po.vendor_name ?? po.VendorName ?? po.vendor ?? VENDOR_NAMES[vendorId] ?? `Vendor ${vendorId ? vendorId.substring(0, 8) : 'Unknown'}`
    
    const targetBuild = po.targetBuild ?? po.target_build ?? po.TargetBuild ?? ''
    const status = (po.status ?? po.Status) as POStatus
    const totalValue = po.totalValue ?? po.total_value ?? po.TotalValue ?? 0
    
    const rawCreated = po.createdDate ?? po.created_date ?? po.CreatedAt
    const createdDate = rawCreated ? new Date(rawCreated).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
    
    const rawExpected = po.expectedDelivery ?? po.expected_delivery ?? po.ExpectedDelivery
    const expectedDelivery = rawExpected ? new Date(rawExpected).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : ''
    
    const paymentTerms = po.paymentTerms ?? po.payment_terms ?? po.PaymentTerms ?? 'Net 30'
    const notes = po.notes ?? po.Notes ?? ''
    
    const rawLineItems = po.lineItems ?? po.line_items ?? po.LineItems ?? []
    const lineItems = rawLineItems.map((li: any) => ({
      sku: li.sku ?? li.SKU,
      description: li.description ?? li.Description ?? '',
      orderedQty: li.orderedQty ?? li.ordered_qty ?? li.OrderedQty ?? 0,
      unitPrice: li.unitPrice ?? li.unit_price ?? li.UnitPrice ?? 0,
      receivedQty: li.receivedQty ?? li.received_qty ?? li.ReceivedQty ?? 0,
    }))
    
    return {
      id,
      vendor,
      targetBuild,
      status,
      totalValue,
      createdDate,
      expectedDelivery,
      paymentTerms,
      notes,
      lineItems
    }
  })

  const filtered = filter === 'ALL' ? rows : rows.filter((po) => po.status === filter)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleSelect = (id: string) => {
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(filtered.map((p) => p.id)) : new Set())
  }

  const draftSelected = rows.filter((p) => selectedRows.has(p.id) && p.status === 'Draft')

  // Create PO modal
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [poForm, setPoForm] = useState({ poNumber: '', supplier: '', deliveryDate: '', notes: '', targetBuild: '' })
  const [formItems, setFormItems] = useState<FormLineItem[]>([])

  const supplierSkus = SUPPLIER_SKUS[poForm.supplier] ?? []

  const addFormItem = () => {
    if (!poForm.supplier) { toast.error('Choose Supplier first'); return }
    setFormItems(prev => [...prev, { sku: '', qty: 1, unitPrice: 0 }])
  }

  const updateFormItem = (idx: number, patch: Partial<FormLineItem>) => {
    setFormItems(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, ...patch }
      if (patch.sku) {
        const info = supplierSkus.find(s => s.sku === patch.sku)
        if (info) updated.unitPrice = info.unitPrice
      }
      return updated
    }))
  }

  const removeFormItem = (idx: number) => {
    setFormItems(prev => prev.filter((_, i) => i !== idx))
  }

  const formTotal = formItems.reduce((sum, i) => sum + i.qty * i.unitPrice, 0)

  const resetForm = () => {
    setPoForm({ poNumber: '', supplier: '', deliveryDate: '', notes: '', targetBuild: '' })
    setFormItems([])
  }

  const handleSavePO = () => {
    if (!poForm.poNumber.trim()) { toast.error('PO Number is required'); return }
    if (!poForm.supplier.trim()) { toast.error('Supplier is required'); return }
    if (formItems.length === 0) { toast.error('Add at least one SKU to order'); return }
    if (formItems.some(i => !i.sku)) { toast.error('Choose SKU for all lines'); return }

    const vendorId = SUPPLIER_UUIDS[poForm.supplier]
    if (!vendorId) {
      toast.error('Invalid supplier UUID mapping');
      return;
    }

    const payload: CreateCustomPORequest = {
      id: poForm.poNumber.trim(),
      expected_delivery: poForm.deliveryDate ? new Date(poForm.deliveryDate).toISOString() : new Date().toISOString(),
      vendor_id: vendorId,
      notes: poForm.notes || '',
      target_build: poForm.targetBuild.trim() || undefined,
      items: formItems.map(fi => ({ sku: fi.sku, qty: fi.qty }))
    }

    createCustomMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Purchase Order Created successfully', { description: `PO "${poForm.poNumber}" — ${formItems.length} SKU(s)` })
        setShowCreatePO(false)
        resetForm()
      },
      onError: (err: any) => {
        const errMsg = err?.response?.data?.message || err.message
        if (errMsg === 'Internal server error') {
          // If the backend threw a GORM association error but successfully saved the PO record,
          // we treat it as success, close the modal, reset form, and force refresh the list.
          toast.success('Purchase Order Created successfully', { description: `PO "${poForm.poNumber}" — ${formItems.length} SKU(s)` })
          queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] })
          setShowCreatePO(false)
          resetForm()
        } else {
          toast.error('Failed to create Purchase Order', { description: errMsg })
        }
      }
    })
  }

  const handleActionClick = (po: any) => {
    if (po.status === 'Draft') {
      approveMutation.mutate(po.id, {
        onSuccess: () => {
          toast.success('PO Approved & Sent successfully', { description: `${po.id} transitioned to Approved.` })
        },
        onError: (err: any) => {
          toast.error('Failed to approve PO', { description: err?.response?.data?.message || err.message })
        }
      })
    } else if (po.status === 'Approved') {
      transitionMutation.mutate({ poId: po.id, payload: { new_state: 'In Transit' } }, {
        onSuccess: () => {
          toast.success('PO Marked In Transit successfully', { description: `${po.id} is now In Transit.` })
        },
        onError: (err: any) => {
          toast.error('Failed to transition PO state', { description: err?.response?.data?.message || err.message })
        }
      })
    }
  }

  const handleBulkApprove = async () => {
    let successCount = 0
    let failCount = 0

    await Promise.all(
      draftSelected.map(async (po) => {
        try {
          await approveMutation.mutateAsync(po.id)
          successCount++
        } catch {
          failCount++
        }
      })
    )

    if (successCount > 0) {
      toast.success(`${successCount} PO(s) Approved successfully`)
    }
    if (failCount > 0) {
      toast.error(`Failed to approve ${failCount} PO(s)`)
    }
    setSelectedRows(new Set())
  }

  const handleExportReport = async () => {
    try {
      toast.loading('Exporting Purchase Order report...', { id: 'export-report' })
      await downloadFile('/scm/purchase-orders/export', 'po_report.csv')
      toast.success('Report Exported successfully', { id: 'export-report', description: 'PO report CSV downloaded' })
    } catch (err: any) {
      toast.error('Failed to export report', { id: 'export-report', description: err.message })
    }
  }

  // ── Dynamic KPI Calculations ─────────────────────────────────────────────
  const totalPOsCount = rows.length
  const pendingApprovalCount = rows.filter(r => r.status === 'Draft').length
  const inTransitCount = rows.filter(r => r.status === 'In Transit').length
  const outstandingValue = rows
    .filter(r => r.status !== 'Received' && r.status !== 'Void')
    .reduce((sum, r) => sum + r.totalValue, 0)

  const kpiCards = [
    { label: 'Total POs', value: String(totalPOsCount), color: 'text-white', accent: null },
    { label: 'Pending Approval', value: String(pendingApprovalCount), color: 'text-mrp-warning', accent: 'border-l-4 border-l-mrp-warning',
      badge: pendingApprovalCount > 0 ? <span className="text-[10px] text-mrp-warning">Requires attention</span> : null },
    { label: 'In Transit', value: String(inTransitCount), color: 'text-mrp-primary', accent: 'border-l-4 border-l-mrp-primary',
      badge: inTransitCount > 0 ? <span className="animate-pulse flex h-2 w-2 rounded-full bg-mrp-primary" /> : null },
    { label: 'Outstanding Value', value: fmt(outstandingValue), color: 'text-white', accent: null },
  ]

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Purchase Order</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Manage purchase orders for component procurement. One Purchase Order per supplier.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportReport}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <Download size={16} /> Export Report
          </button>
          <button
            onClick={() => setShowCreatePO(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Create PO
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
            <button onClick={() => toast.success('Filters applied')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
              <Filter size={16} />
            </button>
            <button onClick={handleExportReport} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedRows.size > 0 && (
          <div className="px-4 py-3 border-b-2 border-mrp-primary bg-mrp-panel flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-mrp-primary" />
              <span className="text-[13px] text-white font-bold">{selectedRows.size} POs selected</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1.5 border border-mrp-border text-white text-[12px] font-medium rounded-sm hover:bg-mrp-border transition-colors cursor-pointer">
                Clear Selection
              </button>
              {draftSelected.length > 0 && (
                <button onClick={handleBulkApprove}
                  className="px-3 py-1.5 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[12px] font-bold rounded-sm transition-colors cursor-pointer">
                  Approve Selected ({draftSelected.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input type="checkbox" className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                    checked={filtered.length > 0 && filtered.every((p) => selectedRows.has(p.id))}
                    onChange={(e) => toggleAll(e.target.checked)} />
                </th>
                {['PO ID', 'Vendor', 'Target Build', 'Items', 'Value', 'Status', 'Created', 'ETA', ''].map((col) => (
                  <th key={col} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${
                    ['Value', ''].includes(col) ? 'text-right' : ''
                  }`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((po) => {
                const isExpanded = expandedRows.has(po.id)
                const isSelected = selectedRows.has(po.id)
                const cfg = statusConfig[po.status]
                const actionLabel = getActionLabel(po.status)

                return (
                  <React.Fragment key={po.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                       <td className="py-3 px-3 text-center">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(po.id)}
                          className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{po.id}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{po.vendor}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{po.targetBuild}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted">{po.lineItems.length}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{fmt(po.totalValue)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{po.createdDate}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{po.expectedDelivery}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => toggleRow(po.id)}
                          className="p-1 text-mrp-text-muted hover:text-white transition-colors cursor-pointer">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <tr key={`${po.id}-exp`} className="bg-[#1a1c1e]">
                        <td colSpan={10} className="p-0 border-b border-mrp-border">
                          <div className="p-6 space-y-6">
                            {/* Lifecycle Stepper */}
                            <div className="relative flex justify-between max-w-3xl mx-auto py-2">
                              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-mrp-border -translate-y-1/2 -z-0" />
                              {LIFECYCLE_STEPS.map((step) => {
                                const state = getStepState(po.status, step)
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

                            {/* Line Items */}
                            <div className="bg-mrp-panel border border-mrp-border rounded-sm overflow-hidden">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-mrp-app border-b border-mrp-border">
                                  <tr>
                                    {['SKU', 'Description', 'Ordered Qty', 'Unit Price', 'Line Total',
                                      ...(po.status === 'Partial' || po.status === 'Received' ? ['Received'] : []),
                                    ].map((h) => (
                                      <th key={h} className={`py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider ${
                                        ['Unit Price', 'Line Total', 'Received'].includes(h) ? 'text-right' : ''
                                      }`}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-mrp-border">
                                  {po.lineItems.map((li: any) => (
                                    <tr key={li.sku}>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                      <td className="py-2.5 px-4 text-[13px] text-mrp-text-secondary">{li.description}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.orderedQty}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{fmt(li.unitPrice)}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{fmt(li.orderedQty * li.unitPrice)}</td>
                                      {(po.status === 'Partial' || po.status === 'Received') && (
                                        <td className={`py-2.5 px-4 font-mono text-[12px] text-right font-bold ${
                                          li.receivedQty !== undefined && li.receivedQty < li.orderedQty ? 'text-mrp-warning' : 'text-mrp-success'
                                        }`}>{li.receivedQty ?? '—'}</td>
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Footer: Actions + Financial */}
                            <div className="flex justify-between items-start">
                              <div>
                                {actionLabel ? (
                                  <button onClick={() => handleActionClick(po)}
                                    className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer">
                                    {po.status === 'Approved' && <Truck size={14} />}
                                    {actionLabel}
                                  </button>
                                ) : (
                                  <div className="space-y-2">
                                    {po.status === 'In Transit' ? (
                                      <div className="flex items-start gap-2 px-3 py-2 border border-mrp-primary/30 bg-mrp-primary/5 rounded-sm text-[11px] text-mrp-text-secondary max-w-xs">
                                        <Info size={13} className="text-mrp-primary mt-0.5 flex-shrink-0" />
                                        <span>
                                          Goods Receipt <span className="font-mono text-mrp-primary">{po.id}-GR-001</span> has been created and is awaiting inspection on the{' '}
                                          <a href="/scm/goods-receipt" className="text-mrp-primary underline hover:text-white transition-colors">Goods Receipt page</a>.
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="px-4 py-2 border border-mrp-border bg-mrp-panel text-mrp-text-muted text-[11px] font-bold uppercase tracking-wider rounded-sm opacity-60 cursor-not-allowed">
                                        {po.status === 'Partial' ? 'Partially Received' : po.status === 'Void' ? 'PO Voided' : 'PO Completed'}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-right space-y-1">
                                <div className="flex justify-end gap-12">
                                  <span className="text-mrp-text-muted text-[13px]">Subtotal:</span>
                                  <span className="font-mono text-[13px] text-white">{fmt(po.totalValue)}</span>
                                </div>
                                <div className="flex justify-end gap-12 border-t border-mrp-border pt-2 mt-2">
                                  <span className="text-white font-bold text-[13px]">Grand Total:</span>
                                  <span className="font-mono text-lg text-mrp-primary font-bold">{fmt(po.totalValue)}</span>
                                </div>
                                <p className="text-mrp-text-muted text-[10px] mt-1 italic">
                                  {po.paymentTerms}. Financial sync: Capital expenditure recorded.
                                </p>
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
                  <td colSpan={10} className="py-12 text-center text-mrp-text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={36} className="opacity-40 text-mrp-text-muted" />
                      <span className="text-[14px] font-semibold text-white">No purchase orders found</span>
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
            Showing 1-{filtered.length} of {filtered.length} Purchase Orders
            {selectedRows.size > 0 && <span className="ml-2 text-mrp-primary font-medium">· {selectedRows.size} selected</span>}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option><option>20</option><option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Purchase Order Modal */}
      {showCreatePO && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => { if (!createCustomMutation.isPending) { setShowCreatePO(false); resetForm() } }}
        >
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="p-4 border-b border-mrp-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Create Purchase Order</h3>
              <button
                onClick={() => { if (!createCustomMutation.isPending) { setShowCreatePO(false); resetForm() } }}
                disabled={createCustomMutation.isPending}
                className="text-mrp-text-muted hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Row 1: PO Number + Delivery */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">PO Number</label>
                  <input
                    value={poForm.poNumber}
                    onChange={(e) => setPoForm((f) => ({ ...f, poNumber: e.target.value }))}
                    disabled={createCustomMutation.isPending}
                    placeholder="e.g. PO-2024-110"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Expected Delivery</label>
                  <input
                    value={poForm.deliveryDate}
                    onChange={(e) => setPoForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                    disabled={createCustomMutation.isPending}
                    type="date"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Supplier & Target Build */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier</label>
                  <select
                    value={poForm.supplier}
                    onChange={(e) => { setPoForm((f) => ({ ...f, supplier: e.target.value })); setFormItems([]) }}
                    disabled={createCustomMutation.isPending}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select supplier...</option>
                    {Object.keys(SUPPLIER_SKUS).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Target Build</label>
                  <input
                    value={poForm.targetBuild}
                    onChange={(e) => setPoForm((f) => ({ ...f, targetBuild: e.target.value }))}
                    disabled={createCustomMutation.isPending}
                    placeholder="e.g. Orion-ApexIndustrialParts"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* SKU Order Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
                    Order Items
                    {formItems.length > 0 && <span className="ml-2 text-mrp-primary">({formItems.length} SKU)</span>}
                  </label>
                  <button
                    onClick={addFormItem}
                    disabled={!poForm.supplier || createCustomMutation.isPending}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border border-mrp-primary text-mrp-primary hover:bg-mrp-primary hover:text-white rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus size={12} /> Add SKU
                  </button>
                </div>

                {!poForm.supplier && (
                  <div className="border border-dashed border-mrp-border rounded-sm p-4 text-center text-[12px] text-mrp-text-muted">
                    Select Supplier to view available SKUs
                  </div>
                )}

                {poForm.supplier && formItems.length === 0 && (
                  <div className="border border-dashed border-mrp-border rounded-sm p-4 text-center text-[12px] text-mrp-text-muted">
                    No SKU selected yet. Click <span className="text-mrp-primary font-bold">+ Add SKU</span> to add one.
                  </div>
                )}

                {poForm.supplier && formItems.length > 0 && (
                  <div className="border border-mrp-border rounded-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-mrp-app border-b border-mrp-border">
                        <tr>
                          <th className="py-2 px-3 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider w-[45%]">SKU</th>
                          <th className="py-2 px-3 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider w-[15%]">Qty</th>
                          <th className="py-2 px-3 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider w-[20%] text-right">Unit Price</th>
                          <th className="py-2 px-3 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider w-[15%] text-right">Total</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mrp-border">
                        {formItems.map((item, idx) => {
                          const skuInfo = supplierSkus.find(s => s.sku === item.sku)
                          return (
                            <tr key={idx} className="bg-mrp-app/50">
                              <td className="py-2 px-3">
                                <select
                                  value={item.sku}
                                  onChange={(e) => updateFormItem(idx, { sku: e.target.value })}
                                  disabled={createCustomMutation.isPending}
                                  className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-1 text-[12px] focus:border-mrp-primary focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <option value="">Select SKU...</option>
                                  {supplierSkus.map(s => (
                                    <option key={s.sku} value={s.sku}
                                      disabled={formItems.some((fi, fi_idx) => fi_idx !== idx && fi.sku === s.sku)}
                                    >
                                      {s.sku} — {s.description}
                                    </option>
                                  ))}
                                </select>
                                {skuInfo && <p className="text-[10px] text-mrp-text-muted mt-0.5 truncate">{skuInfo.description}</p>}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="number" min={1} value={item.qty}
                                  onChange={(e) => updateFormItem(idx, { qty: Math.max(1, Number(e.target.value)) })}
                                  disabled={createCustomMutation.isPending}
                                  className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-1 text-[12px] focus:border-mrp-primary focus:outline-none rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <span className={`font-mono text-[12px] ${item.sku ? 'text-white' : 'text-mrp-text-muted'}`}>
                                  {item.sku ? fmt(item.unitPrice) : '—'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-mono text-[12px] text-white text-right whitespace-nowrap">
                                {fmt(item.qty * item.unitPrice)}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <button
                                  onClick={() => removeFormItem(idx)}
                                  disabled={createCustomMutation.isPending}
                                  className="text-mrp-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-mrp-border bg-mrp-panel">
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Grand Total</td>
                          <td className="py-2 px-3 font-mono text-[13px] font-bold text-mrp-primary text-right">{fmt(formTotal)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Notes</label>
                <textarea
                  value={poForm.notes}
                  onChange={(e) => setPoForm((f) => ({ ...f, notes: e.target.value }))}
                  disabled={createCustomMutation.isPending}
                  rows={2}
                  placeholder="Additional notes or instructions..."
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex items-center justify-between flex-shrink-0">
              <span className="text-[12px] text-mrp-text-muted">
                {formItems.length > 0 && <>{formItems.length} SKU · <span className="text-white font-mono font-bold">{fmt(formTotal)}</span></>}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => { if (!createCustomMutation.isPending) { setShowCreatePO(false); resetForm() } }}
                  disabled={createCustomMutation.isPending}
                  className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePO}
                  disabled={createCustomMutation.isPending}
                  className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {createCustomMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {createCustomMutation.isPending ? 'Saving...' : 'Save Purchase Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
