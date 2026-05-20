'use client'

import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

type DemandStatus = 'Ready to Build' | 'Shortage' | 'Partial' | 'Planned'
type DemandPriority = 'High' | 'Normal' | 'Low'

interface DemandRecord {
  id: string
  product: string
  sku: string
  qtyRequired: number
  qtyReady: number
  status: DemandStatus
  priority: DemandPriority
  targetDate: string
  poCount: number
}

const mockDemands: DemandRecord[] = [
  {
    id: 'DMD-2024-001', product: 'Zeus Workstation X1', sku: 'ZW-X1-TITAN',
    qtyRequired: 500, qtyReady: 420, status: 'Partial', priority: 'High',
    targetDate: '2026-06-15', poCount: 3,
  },
  {
    id: 'DMD-2024-002', product: 'Titan Gaming Pro', sku: 'TGP-200-X',
    qtyRequired: 1200, qtyReady: 0, status: 'Shortage', priority: 'High',
    targetDate: '2026-06-01', poCount: 5,
  },
  {
    id: 'DMD-2024-003', product: 'Aero Ultrabook S', sku: 'AUS-300-S',
    qtyRequired: 800, qtyReady: 800, status: 'Ready to Build', priority: 'Normal',
    targetDate: '2026-05-28', poCount: 2,
  },
  {
    id: 'DMD-2024-004', product: 'Zeus Server Blade R2', sku: 'ZSR2-RACK',
    qtyRequired: 150, qtyReady: 0, status: 'Planned', priority: 'Low',
    targetDate: '2026-07-10', poCount: 0,
  },
  {
    id: 'DMD-2024-005', product: 'Zeus Workstation X1', sku: 'ZW-X1-TITAN',
    qtyRequired: 200, qtyReady: 200, status: 'Ready to Build', priority: 'Normal',
    targetDate: '2026-05-30', poCount: 2,
  },
]

const statusConfig: Record<DemandStatus, { bg: string; border: string; text: string; dot?: string; pulse?: boolean }> = {
  'Ready to Build': { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' },
  Shortage:         { bg: 'bg-mrp-danger/10',  border: 'border-mrp-danger/20',  text: 'text-mrp-danger',  dot: 'bg-mrp-danger',  pulse: true },
  Partial:          { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  Planned:          { bg: 'bg-mrp-border/30',  border: 'border-mrp-border',     text: 'text-mrp-text-muted' },
}

const priorityConfig: Record<DemandPriority, { text: string }> = {
  High:   { text: 'text-mrp-danger' },
  Normal: { text: 'text-mrp-text-secondary' },
  Low:    { text: 'text-mrp-text-muted' },
}

const kpiCards = [
  { label: 'Total Demand Orders', value: '5', color: 'text-white', accent: null },
  { label: 'Ready to Build', value: '2', color: 'text-mrp-success', accent: 'border-l-4 border-l-mrp-success' },
  { label: 'Shortage / Partial', value: '2', color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
    badge: <span className="w-2 h-2 rounded-full bg-mrp-danger animate-pulse" /> },
  { label: 'Total Units Required', value: '2,850', color: 'text-white', accent: null },
]

export function DemandPosView() {
  const [search, setSearch] = useState('')
  const filtered = mockDemands.filter((d) =>
    d.product.toLowerCase().includes(search.toLowerCase()) ||
    d.id.toLowerCase().includes(search.toLowerCase()) ||
    d.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Demand</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Production demand — how many units of each product need to be built and their component readiness.
          </p>
        </div>
        <button
          onClick={() => toast.success('Create Demand Order', { description: 'New demand order form opened' })}
          className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm self-start md:self-auto"
        >
          <Plus size={16} /> Add Demand
        </button>
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

      {/* Search Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search demand ID or product..."
            className="w-full bg-mrp-app border border-mrp-border rounded-sm text-[13px] text-white placeholder:text-mrp-text-muted py-1.5 pl-9 pr-3 focus:outline-none focus:border-mrp-primary transition-colors"
          />
        </div>
        <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border">
          <SlidersHorizontal size={14} />
          Filter
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['Demand ID', 'Product', 'SKU', 'Priority', 'Qty Required', 'Qty Ready', 'Status', 'Target Date', 'POs'].map((col) => (
                  <th key={col} className={`px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${['Qty Required', 'Qty Ready', 'POs'].includes(col) ? 'text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((demand) => {
                const sCfg = statusConfig[demand.status]
                const pCfg = priorityConfig[demand.priority]
                const readyPct = demand.qtyRequired > 0 ? Math.round((demand.qtyReady / demand.qtyRequired) * 100) : 0

                return (
                  <tr key={demand.id} className="hover:bg-mrp-panel transition-colors">
                    <td className="px-4 py-3 font-mono text-[13px] text-white whitespace-nowrap">{demand.id}</td>
                    <td className="px-4 py-3 text-[13px] text-white font-medium">{demand.product}</td>
                    <td className="px-4 py-3 font-mono text-[12px] text-mrp-text-muted">{demand.sku}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${pCfg.text}`}>
                        {demand.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-white text-right whitespace-nowrap">
                      {demand.qtyRequired.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-[13px] text-white">{demand.qtyReady.toLocaleString()}</span>
                        <div className="w-20 h-1 bg-mrp-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${readyPct === 100 ? 'bg-mrp-success' : readyPct > 0 ? 'bg-mrp-warning' : 'bg-mrp-danger'}`}
                            style={{ width: `${readyPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 ${sCfg.bg} border ${sCfg.border} ${sCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        {sCfg.dot && <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}${sCfg.pulse ? ' animate-pulse' : ''}`} />}
                        {demand.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{demand.targetDate}</td>
                    <td className="px-4 py-3 font-mono text-[13px] text-mrp-text-muted text-right">{demand.poCount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing 1-{filtered.length} of {filtered.length} Demand Orders
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
    </div>
  );
}
