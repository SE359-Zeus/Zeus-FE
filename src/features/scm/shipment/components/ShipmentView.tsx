'use client'

import React, { useState } from 'react'
import {
  Download, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, Filter, Truck, Package, X,
} from 'lucide-react'
import { toast } from 'sonner'

type ShipmentStatus = 'Scheduled' | 'In Transit' | 'Delivered' | 'Delayed'
type FilterType = 'ALL' | ShipmentStatus

interface ShipmentItem {
  sku: string
  description: string
  qty: number
}

interface Shipment {
  id: string
  poRef: string
  supplier: string
  status: ShipmentStatus
  carrier: string
  shipDate: string
  eta: string
  items: ShipmentItem[]
  trackingNo: string
  origin: string
}

const mockShipments: Shipment[] = [
  {
    id: 'SHP-2024-201', poRef: 'PO-2024-106', supplier: 'Intel Corporation',
    status: 'In Transit', carrier: 'DHL Express', shipDate: '2026-05-13', eta: '2026-05-20',
    trackingNo: 'DHL-8824991023', origin: 'Hillsboro, OR (US)',
    items: [
      { sku: 'SOC-XM100-PRO', description: 'Zeus SOC XM100 Pro (14-Core)', qty: 150 },
      { sku: 'SOC-XM100-LT', description: 'Zeus SOC XM100 LT (8-Core)', qty: 100 },
    ],
  },
  {
    id: 'SHP-2024-202', poRef: 'PO-2024-105', supplier: 'Samsung Electronics',
    status: 'In Transit', carrier: 'FedEx International', shipDate: '2026-05-12', eta: '2026-05-25',
    trackingNo: 'FX-7743821900', origin: 'Suwon, KR',
    items: [
      { sku: 'RAM-64G-DDR5', description: '64GB DDR5 Memory Module', qty: 200 },
      { sku: 'SSD-2T-NVME', description: '2TB NVMe Gen5 Enterprise SSD', qty: 100 },
    ],
  },
  {
    id: 'SHP-2024-203', poRef: 'PO-2024-103', supplier: 'NVIDIA',
    status: 'Scheduled', carrier: 'Maersk Shipping', shipDate: '2026-05-20', eta: '2026-06-07',
    trackingNo: '(pending)', origin: 'Santa Clara, CA (US)',
    items: [
      { sku: 'GPU-RTX5080-M', description: 'NVIDIA RTX 5080 Mobile (16GB)', qty: 200 },
    ],
  },
  {
    id: 'SHP-2024-204', poRef: 'PO-2024-101', supplier: 'SK Hynix',
    status: 'Delivered', carrier: 'UPS Freight', shipDate: '2026-05-06', eta: '2026-05-15',
    trackingNo: 'UPS-1Z999AA1012', origin: 'Icheon, KR',
    items: [
      { sku: 'RAM-32G-DDR5', description: '32GB DDR5-5600 SO-DIMM', qty: 300 },
      { sku: 'RAM-16G-DDR5', description: '16GB DDR5-5600 SO-DIMM', qty: 250 },
    ],
  },
  {
    id: 'SHP-2024-205', poRef: 'PO-2024-099', supplier: 'Texas Instruments',
    status: 'Delayed', carrier: 'DHL Express', shipDate: '2026-04-30', eta: '2026-05-10',
    trackingNo: 'DHL-6612338901', origin: 'Dallas, TX (US)',
    items: [
      { sku: 'PSU-GAN-240W', description: '240W GaN Power Supply', qty: 250 },
    ],
  },
  {
    id: 'SHP-2024-206', poRef: 'PO-2024-107', supplier: 'LG Display',
    status: 'Scheduled', carrier: 'Maersk Shipping', shipDate: '2026-05-28', eta: '2026-06-25',
    trackingNo: '(pending)', origin: 'Paju, KR',
    items: [
      { sku: 'DISP-OLED-16', description: '16" 4K ProArt OLED Panel', qty: 100 },
    ],
  },
  {
    id: 'SHP-2024-207', poRef: 'PO-2024-098', supplier: 'Intel Corporation',
    status: 'Delivered', carrier: 'FedEx International', shipDate: '2026-04-28', eta: '2026-05-08',
    trackingNo: 'FX-5501229873', origin: 'Hillsboro, OR (US)',
    items: [
      { sku: 'SOC-XM100-LT', description: 'Zeus SOC XM100 LT (8-Core)', qty: 100 },
    ],
  },
]

const statusConfig: Record<ShipmentStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Scheduled:   { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: false },
  'In Transit':{ bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: true },
  Delivered:   { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
  Delayed:     { bg: 'bg-mrp-danger/10', border: 'border-mrp-danger/20', text: 'text-mrp-danger', dot: 'bg-mrp-danger', pulse: true },
}

const LIFECYCLE_STEPS: ShipmentStatus[] = ['Scheduled', 'In Transit', 'Delivered']

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Scheduled', label: 'Scheduled' },
  { key: 'In Transit', label: 'In Transit' },
  { key: 'Delivered', label: 'Delivered' },
  { key: 'Delayed', label: 'Delayed' },
]

function getStepState(currentStatus: ShipmentStatus, step: ShipmentStatus): 'done' | 'current' | 'future' {
  const resolvedStatus = currentStatus === 'Delayed' ? 'In Transit' : currentStatus
  const ci = LIFECYCLE_STEPS.indexOf(resolvedStatus)
  const si = LIFECYCLE_STEPS.indexOf(step)
  if (si < ci) return 'done'
  if (si === ci) return 'current'
  return 'future'
}

const kpiCards = [
  { label: 'Total Shipments', value: '7', color: 'text-white', accent: null },
  { label: 'In Transit', value: '2', color: 'text-mrp-primary', accent: 'border-l-4 border-l-mrp-primary',
    badge: <span className="animate-pulse flex h-2 w-2 rounded-full bg-mrp-primary" /> },
  { label: 'Delayed', value: '1', color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
    badge: <span className="text-[10px] text-mrp-danger">Requires attention</span> },
  { label: 'On-Time Rate', value: '85.7%', color: 'text-mrp-success', accent: null },
]

export function ShipmentView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['SHP-2024-201']))

  // Create Shipment modal
  const [showCreateShipment, setShowCreateShipment] = useState(false)
  const [shForm, setShForm] = useState({ poRef: '', supplier: '', carrier: '', shipDate: '', eta: '' })

  const handleSaveShipment = () => {
    if (!shForm.poRef.trim()) { toast.error('PO Reference is required'); return }
    if (!shForm.supplier.trim()) { toast.error('Supplier is required'); return }
    const newId = `SHP-${Date.now().toString().slice(-6)}`
    toast.success('Shipment Created', { description: `${newId} linked to ${shForm.poRef}` })
    setShowCreateShipment(false)
    setShForm({ poRef: '', supplier: '', carrier: '', shipDate: '', eta: '' })
  }

  const filtered = filter === 'ALL' ? mockShipments : mockShipments.filter((s) => s.status === filter)

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

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
            onClick={() => toast.success('Report Exported', { description: 'Shipment report downloaded' })}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm"
          >
            <Download size={16} /> Export Report
          </button>
          <button
            onClick={() => setShowCreateShipment(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm"
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
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
                  filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toast.success('Filters applied')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors">
              <Filter size={16} />
            </button>
            <button onClick={() => toast.success('CSV Exported')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors">
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['Shipment ID', 'PO Reference', 'Supplier', 'Items', 'Status', 'Carrier', 'Ship Date', 'ETA', ''].map((col) => (
                  <th key={col} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${col === '' ? 'text-right' : ''}`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((shp) => {
                const isExpanded = expandedRows.has(shp.id)
                const cfg = statusConfig[shp.status]

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
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{shp.eta}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => toggleRow(shp.id)} className="p-1 text-mrp-text-muted hover:text-white transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <tr key={`${shp.id}-exp`} className="bg-[#1a1c1e]">
                        <td colSpan={9} className="p-0 border-b border-mrp-border">
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
                                    {shp.items.map((li) => (
                                      <tr key={li.sku}>
                                        <td className="py-2.5 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                        <td className="py-2.5 px-4 text-[13px] text-mrp-text-secondary">{li.description}</td>
                                        <td className="py-2.5 px-4 font-mono text-[12px] text-white text-right">{li.qty}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Shipment Metadata */}
                              <div className="bg-mrp-app border border-mrp-border rounded-sm p-4 space-y-3">
                                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-2">Shipment Details</h3>
                                {[
                                  { label: 'Tracking No.', value: shp.trackingNo },
                                  { label: 'Origin', value: shp.origin },
                                  { label: 'Carrier', value: shp.carrier },
                                  { label: 'Ship Date', value: shp.shipDate },
                                  { label: 'ETA', value: shp.eta },
                                ].map((row) => (
                                  <div key={row.label} className="flex justify-between text-[13px]">
                                    <span className="text-mrp-text-muted">{row.label}</span>
                                    <span className="font-mono text-white text-right">{row.value}</span>
                                  </div>
                                ))}
                                {shp.status === 'Delayed' && (
                                  <div className="mt-3 pt-2 border-t border-mrp-border">
                                    <span className="text-mrp-danger text-[11px] font-bold uppercase tracking-wider">⚠ Shipment Delayed</span>
                                    <p className="text-mrp-text-muted text-[11px] mt-1">Contact supplier to confirm revised ETA.</p>
                                  </div>
                                )}
                                {shp.status !== 'Delivered' && shp.status !== 'Delayed' && (
                                  <button
                                    onClick={() => toast.success('Status Updated', { description: `${shp.id} marked as received` })}
                                    className="w-full mt-3 px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[11px] font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2"
                                  >
                                    <Package size={14} /> Mark as Received
                                  </button>
                                )}
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
            Showing 1-{filtered.length} of {filtered.length} Shipments
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

      {/* Create Shipment Modal */}
      {showCreateShipment && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col">
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Shipment</h3>
              <button onClick={() => setShowCreateShipment(false)} className="text-mrp-text-muted hover:text-white transition-colors"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">PO Reference</label>
                  <input value={shForm.poRef} onChange={(e) => setShForm((f) => ({ ...f, poRef: e.target.value }))}
                    placeholder="e.g. PO-2024-110"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Carrier</label>
                  <select value={shForm.carrier} onChange={(e) => setShForm((f) => ({ ...f, carrier: e.target.value }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm">
                    <option value="">Select carrier...</option>
                    <option>DHL Express</option>
                    <option>FedEx International</option>
                    <option>UPS Freight</option>
                    <option>Maersk Shipping</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier</label>
                <select value={shForm.supplier} onChange={(e) => setShForm((f) => ({ ...f, supplier: e.target.value }))}
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm">
                  <option value="">Select supplier...</option>
                  <option>Intel Corporation</option>
                  <option>Samsung Electronics</option>
                  <option>NVIDIA</option>
                  <option>SK Hynix</option>
                  <option>LG Display</option>
                  <option>Texas Instruments</option>
                  <option>Foxconn Technology</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Ship Date</label>
                  <input value={shForm.shipDate} onChange={(e) => setShForm((f) => ({ ...f, shipDate: e.target.value }))}
                    type="date" className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">ETA</label>
                  <input value={shForm.eta} onChange={(e) => setShForm((f) => ({ ...f, eta: e.target.value }))}
                    type="date" className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button onClick={() => setShowCreateShipment(false)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors">Cancel</button>
              <button onClick={handleSaveShipment} className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm">Create Shipment</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
