'use client'

import React, { useState } from 'react'
import {
  RefreshCw, Download, Lock, Unlock, ChevronRight, AlertTriangle,
  PackageCheck, Eye, ClipboardCheck, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

type GRStatus = 'Pending' | 'Inspected' | 'Complete' | 'Discrepancy'
type FilterType = 'ALL' | GRStatus

interface LineItem {
  sku: string; name: string; orderedQty: number
  agingSensitive: boolean; agingLabel?: string
}

interface GoodsReceipt {
  id: string; poRef: string; vendor: string; status: GRStatus
  arrivalDate: string; operator: string
  lockedBy: string | null; lockMinutes: number | null
  lineItems: LineItem[]
}

const mockGRs: GoodsReceipt[] = [
  {
    id: 'GR-2024-301', poRef: 'PO-2024-101', vendor: 'Intel Corporation', status: 'Inspected',
    arrivalDate: 'May 15, 2026', operator: 'A. Jensen', lockedBy: 'self', lockMinutes: 58,
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

function getActionInfo(gr: GoodsReceipt): { label: string; primary: boolean; disabled: boolean } {
  if (gr.lockedBy === 'self') return { label: 'Continue Inspection', primary: true, disabled: false }
  if (gr.lockedBy) return { label: 'Admit', primary: false, disabled: true }
  if (gr.status === 'Pending') return { label: 'Start Inspection', primary: true, disabled: false }
  if (gr.status === 'Discrepancy') return { label: 'Review Diff', primary: false, disabled: false }
  return { label: 'View Details', primary: false, disabled: false }
}

export function GoodsReceiptView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>('GR-2024-301')

  const filtered = filter === 'ALL' ? mockGRs : mockGRs.filter((g) => g.status === filter)

  const handleComplete = () => {
    toast.success('GR-2024-301 completed', {
      description: 'Inventory Ledger updated. PO-2024-101 status: Received',
    })
    setExpandedId(null)
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Goods Receipt</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Physically validate inbound shipments against purchase orders to ensure inventory accuracy.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => toast.info('Refreshed')}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => toast.success('Report exported')}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Receipts', value: '12', color: 'text-mrp-warning', accent: 'border-l-mrp-warning', pulse: true },
          { label: 'Completed Today', value: '45', color: 'text-mrp-success', accent: 'border-l-mrp-success', pulse: false },
          { label: 'Active Discrepancies', value: '3', color: 'text-mrp-danger', accent: 'border-l-mrp-danger', pulse: false },
          { label: 'Inspection Queue', value: '8', color: 'text-white', accent: 'border-l-white', pulse: false },
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

      {/* Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center gap-2">
          {FILTER_TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
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
                const cfg = statusConfig[gr.status]
                const action = getActionInfo(gr)
                const isExpanded = expandedId === gr.id

                return (
                  <React.Fragment key={gr.id}>
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
                          <span className="text-mrp-text-muted opacity-40">â€”</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          disabled={action.disabled}
                          onClick={() => {
                            if (action.disabled) return
                            if (gr.status === 'Pending' || gr.lockedBy === 'self') {
                              setExpandedId(isExpanded ? null : gr.id)
                              if (!isExpanded) toast.info(`Lock acquired for ${gr.id}`, { description: 'You have 60 minutes to complete inspection.' })
                            } else {
                              setExpandedId(isExpanded ? null : gr.id)
                            }
                          }}
                          className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors whitespace-nowrap ${
                            action.disabled ? 'bg-mrp-panel text-mrp-text-muted border border-mrp-border cursor-not-allowed opacity-50'
                            : action.primary ? 'bg-mrp-primary hover:bg-mrp-primary-hover text-white'
                            : 'border border-mrp-border text-white hover:bg-mrp-border'
                          }`}>
                          {action.label}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Inspection Detail */}
                    {isExpanded && (
                      <tr className="bg-[#1a1c1e]">
                        <td colSpan={8} className="p-0 border-b border-mrp-border">
                          {/* Lock Banner */}
                          <div className="px-6 py-3 flex items-center justify-between" style={{ backgroundColor: '#F0AB0015', borderBottom: '1px solid #F0AB0030' }}>
                            <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
                              <PackageCheck size={18} className="text-mrp-warning" />
                              Inspection Detail: {gr.id}
                            </h2>
                            {gr.lockedBy === 'self' && (
                              <span className="text-mrp-warning text-[12px] font-medium flex items-center gap-1.5">
                                <Lock size={14} /> Currently being processed by you. Lock expires in {gr.lockMinutes} minutes.
                              </span>
                            )}
                          </div>

                          <div className="p-6">
                            <div className="grid grid-cols-12 gap-6">
                              {/* Line Items â€” Blind Receiving */}
                              <div className="col-span-12 lg:col-span-9 space-y-3">
                                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Line Item Validation</h3>
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
                                      {gr.lineItems.map((li) => (
                                        <tr key={li.sku} className="bg-mrp-app">
                                          <td className="py-3 px-4 font-mono text-[12px] text-white">{li.sku}</td>
                                          <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{li.name}</td>
                                          <td className="py-3 px-4 font-mono text-[12px] text-white text-right">{li.orderedQty}</td>
                                          {/* BLIND RECEIVING: inputs MUST be empty */}
                                          <td className="py-3 px-4 w-28">
                                            <input type="number" placeholder="0"
                                              className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-right font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted" />
                                          </td>
                                          <td className="py-3 px-4 w-28">
                                            <input type="number" placeholder="0"
                                              className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-right font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted" />
                                          </td>
                                          <td className="py-3 px-4">
                                            {li.agingSensitive ? (
                                              <div className="space-y-1">
                                                <input type="date"
                                                  className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-1.5 text-[12px] text-white focus:border-mrp-primary focus:outline-none" />
                                                <div className="flex items-center gap-1 text-mrp-warning text-[10px] font-bold uppercase tracking-wider">
                                                  <AlertTriangle size={12} /> {li.agingLabel}
                                                </div>
                                              </div>
                                            ) : (
                                              <span className="text-mrp-text-muted text-[12px] italic">N/A</span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Batch Summary Sidebar */}
                              <div className="col-span-12 lg:col-span-3">
                                <div className="bg-mrp-app border border-mrp-border rounded-sm p-4 space-y-4">
                                  <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-2">Batch Summary</h3>
                                  <div className="space-y-3 text-[13px]">
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Ordered</span>
                                      <span className="font-mono text-white">{gr.lineItems.reduce((s, l) => s + l.orderedQty, 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Received</span>
                                      <span className="font-mono text-mrp-primary">--</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-mrp-text-muted">Total Defective</span>
                                      <span className="font-mono text-mrp-danger">--</span>
                                    </div>
                                    <div className="flex justify-between border-t border-mrp-border pt-2 font-bold">
                                      <span className="text-white">Discrepancy</span>
                                      <span className="font-mono text-white">--</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5 pt-2">
                                    <label className="text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Batch/Lot ID</label>
                                    <input type="text" placeholder="e.g. LOT-2024-X1"
                                      className="w-full bg-mrp-panel border border-mrp-border rounded-sm p-2 text-[13px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted" />
                                  </div>
                                  <button onClick={handleComplete}
                                    className="w-full bg-mrp-primary hover:bg-mrp-primary-hover text-white py-2.5 font-bold rounded-sm flex items-center justify-center gap-2 transition-colors mt-4 text-[13px]">
                                    Complete Receipt <ChevronRight size={16} />
                                  </button>
                                  <p className="text-[10px] text-mrp-text-muted text-center">
                                    This action will write to Inventory Ledger and update PO status.
                                  </p>
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
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filtered.length} of {filtered.length} Goods Receipts</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
            <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
              <option>10</option><option>20</option><option>50</option>
            </select>
          </div>
        </div>
      </div>
    </>
  )
}

