'use client'

import React, { useState } from 'react'
import {
  Download, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Filter, CheckCircle, Truck, X, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

type POStatus = 'Draft' | 'Approved' | 'In Transit' | 'Received' | 'Partial'
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

const SUPPLIER_SKUS: Record<string, SkuInfo[]> = {
  'Intel Corporation': [
    { sku: 'CPU-XM100PRO-14C-55W',  description: 'Zeus SOC XM100 Pro (14-Core, 5nm)',   unitPrice: 580 },
    { sku: 'CPU-XM100ULT-24C-65W', description: 'Zeus SOC XM100 Ultra (24-Core, 5nm)',  unitPrice: 920 },
    { sku: 'CPU-XM100LT-8C-28W',   description: 'Zeus SOC XM100 LT (8-Core, 7nm)',      unitPrice: 340 },
  ],
  'Samsung Electronics': [
    { sku: 'SSD-NVME5-2TB-7GBs',  description: '2TB NVMe Gen5 SSD (M.2 2280, 7GB/s)',  unitPrice: 185 },
    { sku: 'SSD-NVME5-1TB-7GBs',  description: '1TB NVMe Gen5 SSD (M.2 2280, 7GB/s)',  unitPrice: 110 },
    { sku: 'RAM-DDR5SO-64G-6400', description: '64GB DDR5-6400 ECC SO-DIMM (262-pin)',  unitPrice: 210 },
  ],
  'NVIDIA': [
    { sku: 'GPU-RTX5080M-16G-150W', description: 'RTX 5080 Mobile 16GB GDDR7 (150W TDP)', unitPrice: 890 },
    { sku: 'GPU-RTX5070M-12G-120W', description: 'RTX 5070 Mobile 12GB GDDR7 (120W TDP)', unitPrice: 620 },
  ],
  'SK Hynix': [
    { sku: 'RAM-DDR5SO-32G-5600', description: '32GB DDR5-5600 SO-DIMM (262-pin)',       unitPrice: 95 },
    { sku: 'RAM-DDR5SO-16G-5600', description: '16GB DDR5-5600 SO-DIMM (262-pin)',       unitPrice: 48 },
    { sku: 'RAM-DDR5SO-8G-5600',  description: '8GB DDR5-5600 SO-DIMM (262-pin)',        unitPrice: 25 },
  ],
  'LG Display': [
    { sku: 'DSP-OLED4K-16IN-120Hz', description: '16" 4K OLED 120Hz (eDP 1.4, HDR)',   unitPrice: 420 },
    { sku: 'DSP-OLED4K-15IN-120Hz', description: '15" 4K OLED 120Hz (eDP 1.4, HDR)',   unitPrice: 380 },
    { sku: 'DSP-IPSFHD-13IN-60Hz',  description: '13" FHD IPS 60Hz (eDP 1.3)',         unitPrice: 120 },
  ],
  'Murata Manufacturing': [
    { sku: 'MOD-WIFI7AX-6GHz-2W',    description: 'WiFi 7 AX 6GHz Module (M.2, 2W)',   unitPrice: 35 },
    { sku: 'MOD-BT53LE-2.4GHz-0.5W', description: 'Bluetooth 5.3 LE Module (2.4GHz)',  unitPrice: 12 },
  ],
  'Texas Instruments': [
    { sku: 'PSU-GaN-240W-95E',  description: '240W GaN PSU 95% Eff. (USB-C PD 3.1)',   unitPrice: 75 },
    { sku: 'IC-BUCK-5A-3.3V',   description: '5A Sync Buck Converter (3.3V out)',       unitPrice: 4  },
  ],
  'Foxconn Technology': [
    { sku: 'MB-EATX-ZX1Ti-DDR5',  description: 'Zeus X1 Titanium Mainboard (E-ATX)',   unitPrice: 650 },
    { sku: 'MB-MATX-AeroS-DDR5',  description: 'Aero S Mainboard (M-ATX, DDR5)',       unitPrice: 290 },
  ],
}

const mockPOs: PurchaseOrder[] = [
  {
    id: 'PO-2024-108', vendor: 'Murata Manufacturing', targetBuild: 'Aero Ultrabook S',
    status: 'Draft', totalValue: 15400, createdDate: '2026-05-12', expectedDelivery: '2026-06-01',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'MOD-WIFI7-AX', description: 'WiFi 7 AX Module', orderedQty: 200, unitPrice: 35 },
      { sku: 'PSU-GAN-240W', description: '240W GaN Power Supply', orderedQty: 120, unitPrice: 75 },
    ],
  },
  {
    id: 'PO-2024-107', vendor: 'LG Display', targetBuild: 'Zeus Workstation X1',
    status: 'Draft', totalValue: 42000, createdDate: '2026-05-11', expectedDelivery: '2026-06-25',
    paymentTerms: 'Net 45',
    lineItems: [
      { sku: 'DISP-OLED-16', description: '16" 4K ProArt OLED Panel', orderedQty: 100, unitPrice: 420 },
    ],
  },
  {
    id: 'PO-2024-106', vendor: 'Intel Corporation', targetBuild: 'Zeus Workstation X1',
    status: 'Approved', totalValue: 120000, createdDate: '2026-05-11', expectedDelivery: '2026-05-20',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'SOC-XM100-PRO', description: 'Zeus SOC XM100 Pro (14-Core)', orderedQty: 150, unitPrice: 580 },
      { sku: 'SOC-XM100-LT', description: 'Zeus SOC XM100 LT (8-Core)', orderedQty: 100, unitPrice: 340 },
    ],
  },
  {
    id: 'PO-2024-105', vendor: 'Samsung Electronics', targetBuild: 'Titan Gaming Pro',
    status: 'In Transit', totalValue: 85000, createdDate: '2026-05-10', expectedDelivery: '2026-05-25',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'RAM-64G-DDR5', description: '64GB DDR5 Memory Module', orderedQty: 200, unitPrice: 150 },
      { sku: 'SSD-2T-NVME', description: '2TB NVMe Gen5 Enterprise SSD', orderedQty: 100, unitPrice: 550 },
    ],
  },
  {
    id: 'PO-2024-103', vendor: 'NVIDIA', targetBuild: 'Titan Gaming Pro',
    status: 'In Transit', totalValue: 178000, createdDate: '2026-05-08', expectedDelivery: '2026-06-07',
    paymentTerms: 'Net 60',
    lineItems: [
      { sku: 'GPU-RTX5080-M', description: 'NVIDIA RTX 5080 Mobile (16GB)', orderedQty: 200, unitPrice: 890 },
    ],
  },
  {
    id: 'PO-2024-101', vendor: 'SK Hynix', targetBuild: 'Titan Gaming Pro',
    status: 'Received', totalValue: 45000, createdDate: '2026-05-01', expectedDelivery: '2026-05-15',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'RAM-32G-DDR5', description: '32GB DDR5-5600 SO-DIMM', orderedQty: 300, unitPrice: 95 },
      { sku: 'RAM-16G-DDR5', description: '16GB DDR5-5600 SO-DIMM', orderedQty: 250, unitPrice: 48 },
    ],
  },
  {
    id: 'PO-2024-099', vendor: 'Texas Instruments', targetBuild: 'Aero Ultrabook S',
    status: 'Partial', totalValue: 18750, createdDate: '2026-04-28', expectedDelivery: '2026-05-10',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'PSU-GAN-240W', description: '240W GaN Power Supply', orderedQty: 250, unitPrice: 75, receivedQty: 200 },
    ],
  },
  {
    id: 'PO-2024-098', vendor: 'Intel Corporation', targetBuild: 'Aero Ultrabook S',
    status: 'Received', totalValue: 34000, createdDate: '2026-04-25', expectedDelivery: '2026-05-08',
    paymentTerms: 'Net 30',
    lineItems: [
      { sku: 'SOC-XM100-LT', description: 'Zeus SOC XM100 LT (8-Core)', orderedQty: 100, unitPrice: 340, receivedQty: 100 },
    ],
  },
]

const statusConfig: Record<POStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Draft:       { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  Approved:    { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: false },
  'In Transit':{ bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: true },
  Received:    { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
  Partial:     { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
}

const LIFECYCLE_STEPS: POStatus[] = ['Draft', 'Approved', 'In Transit', 'Received']

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Draft', label: 'Draft' },
  { key: 'Approved', label: 'Approved' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Received', label: 'Received' },
]

function fmt(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) }

function getStepState(currentStatus: POStatus, step: POStatus): 'done' | 'current' | 'future' {
  const ci = LIFECYCLE_STEPS.indexOf(currentStatus === 'Partial' ? 'Received' : currentStatus)
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

const kpiCards = [
  { label: 'Total POs', value: '142', color: 'text-white', accent: null },
  { label: 'Pending Approval', value: '12', color: 'text-mrp-warning', accent: 'border-l-4 border-l-mrp-warning',
    badge: <span className="text-[10px] text-mrp-warning">Requires attention</span> },
  { label: 'In Transit', value: '24', color: 'text-mrp-primary', accent: 'border-l-4 border-l-mrp-primary',
    badge: <span className="animate-pulse flex h-2 w-2 rounded-full bg-mrp-primary" /> },
  { label: 'Outstanding Value', value: '$1,420,500', color: 'text-white', accent: null },
]

export function PurchaseOrderView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['PO-2024-105']))
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const filtered = filter === 'ALL' ? mockPOs : mockPOs.filter((po) => po.status === filter)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleSelect = (id: string) => {
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(filtered.map((p) => p.id)) : new Set())
  }

  const draftSelected = mockPOs.filter((p) => selectedRows.has(p.id) && p.status === 'Draft')

  // Create PO modal
  const [showCreatePO, setShowCreatePO] = useState(false)
  const [poForm, setPoForm] = useState({ poNumber: '', supplier: '', deliveryDate: '', notes: '' })
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
    setPoForm({ poNumber: '', supplier: '', deliveryDate: '', notes: '' })
    setFormItems([])
  }

  const handleSavePO = () => {
    if (!poForm.poNumber.trim()) { toast.error('PO Number is required'); return }
    if (!poForm.supplier.trim()) { toast.error('Supplier is required'); return }
    if (formItems.length === 0) { toast.error('Add at least one SKU to order'); return }
    if (formItems.some(i => !i.sku)) { toast.error('Choose SKU for all lines'); return }
    toast.success('Purchase Order Created', { description: `PO "${poForm.poNumber}" — ${formItems.length} SKU(s) từ ${poForm.supplier}` })
    setShowCreatePO(false)
    resetForm()
  }

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
            onClick={() => toast.success('Report Exported', { description: 'PO report downloaded' })}
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
            <button onClick={() => toast.success('CSV Exported')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
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
                <button onClick={() => {
                  toast.success(`${draftSelected.length} POs Approved`, { description: 'Purchase orders sent to vendors' })
                  setSelectedRows(new Set())
                }}
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
                                  {po.lineItems.map((li) => (
                                    <tr key={li.sku}>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                      <td className="py-2.5 px-4 text-[13px] text-mrp-text-secondary">{li.description}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.orderedQty}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{fmt(li.unitPrice)}</td>
                                      <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{fmt(li.orderedQty * li.unitPrice)}</td>
                                      {(po.status === 'Partial' || po.status === 'Received') && (
                                        <td className={`py-2.5 px-4 font-mono text-[12px] text-right font-bold ${
                                          li.receivedQty !== undefined && li.receivedQty < li.orderedQty ? 'text-mrp-warning' : 'text-mrp-success'
                                        }`}>{li.receivedQty ?? 'â€”'}</td>
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
                                  <button onClick={() => toast.success('Status Updated', { description: `${po.id} transitioned` })}
                                    className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-2 cursor-pointer">
                                    {po.status === 'Approved' && <Truck size={14} />}
                                    {actionLabel}
                                  </button>
                                ) : (
                                  <span className="px-4 py-2 border border-mrp-border bg-mrp-panel text-mrp-text-muted text-[11px] font-bold uppercase tracking-wider rounded-sm opacity-60 cursor-not-allowed">
                                    {po.status === 'In Transit' ? 'Awaiting Goods Receipt' : po.status === 'Partial' ? 'Partially Received' : 'PO Completed'}
                                  </span>
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
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing 1-{filtered.length} of {filtered.length} Purchase Orders
            {selectedRows.size > 0 && <span className="ml-2 text-mrp-primary font-medium">Â· {selectedRows.size} selected</span>}
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
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => { setShowCreatePO(false); resetForm() }}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="p-4 border-b border-mrp-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-bold text-white">Create Purchase Order</h3>
              <button onClick={() => { setShowCreatePO(false); resetForm() }} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Row 1: PO Number + Delivery */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">PO Number</label>
                  <input value={poForm.poNumber} onChange={(e) => setPoForm((f) => ({ ...f, poNumber: e.target.value }))}
                    placeholder="e.g. PO-2024-110"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Expected Delivery</label>
                  <input value={poForm.deliveryDate} onChange={(e) => setPoForm((f) => ({ ...f, deliveryDate: e.target.value }))}
                    type="date"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm [color-scheme:dark]" />
                </div>
              </div>

              {/* Supplier */}
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier</label>
                <select
                  value={poForm.supplier}
                  onChange={(e) => { setPoForm((f) => ({ ...f, supplier: e.target.value })); setFormItems([]) }}
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                >
                  <option value="">Select supplier...</option>
                  {Object.keys(SUPPLIER_SKUS).map(s => <option key={s}>{s}</option>)}
                </select>
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
                    disabled={!poForm.supplier}
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

                {formItems.length > 0 && (
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
                                  className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-1 text-[12px] focus:border-mrp-primary focus:outline-none rounded-sm"
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
                                  className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-1 text-[12px] focus:border-mrp-primary focus:outline-none rounded-sm"
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
                                <button onClick={() => removeFormItem(idx)} className="text-mrp-text-muted hover:text-red-400 transition-colors cursor-pointer">
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
                <textarea value={poForm.notes} onChange={(e) => setPoForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Additional notes or instructions..."
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted resize-none" />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex items-center justify-between flex-shrink-0">
              <span className="text-[12px] text-mrp-text-muted">
                {formItems.length > 0 && <>{formItems.length} SKU · <span className="text-white font-mono font-bold">{fmt(formTotal)}</span></>}
              </span>
              <div className="flex gap-3">
                <button onClick={() => { setShowCreatePO(false); resetForm() }} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                <button onClick={handleSavePO} className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm cursor-pointer">Save Purchase Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


