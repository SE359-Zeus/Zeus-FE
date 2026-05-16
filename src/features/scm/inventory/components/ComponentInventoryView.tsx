'use client'

import React, { useState } from 'react'
import {
  Search, Plus, ChevronDown, ChevronUp, Download, Filter,
  ChevronLeft, ChevronRight, AlertTriangle, Package,
} from 'lucide-react'
import { toast } from 'sonner'

type ComponentStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued'
type FilterType = 'ALL' | ComponentStatus

interface ComponentItem {
  sku: string
  name: string
  category: string
  stockQty: number
  reorderPoint: number
  unitCost: string
  status: ComponentStatus
  primarySupplier: string
  leadTime: number
  location: string
}

const mockComponents: ComponentItem[] = [
  {
    sku: 'SOC-XM100-PRO', name: 'Zeus SOC XM100 Pro (14-Core)', category: 'Processor',
    stockQty: 245, reorderPoint: 100, unitCost: '$580.00', status: 'In Stock',
    primarySupplier: 'Intel Corporation', leadTime: 14, location: 'WH-A / Zone-C1',
  },
  {
    sku: 'SOC-XM100-LT', name: 'Zeus SOC XM100 LT (8-Core)', category: 'Processor',
    stockQty: 58, reorderPoint: 100, unitCost: '$340.00', status: 'Low Stock',
    primarySupplier: 'Intel Corporation', leadTime: 12, location: 'WH-A / Zone-C2',
  },
  {
    sku: 'GPU-RTX5080-M', name: 'NVIDIA RTX 5080 Mobile (16GB)', category: 'GPU',
    stockQty: 0, reorderPoint: 50, unitCost: '$890.00', status: 'Out of Stock',
    primarySupplier: 'NVIDIA', leadTime: 30, location: 'WH-A / Zone-G1',
  },
  {
    sku: 'RAM-64G-DDR5', name: '64GB DDR5-6400 ECC SO-DIMM', category: 'Memory',
    stockQty: 412, reorderPoint: 200, unitCost: '$210.00', status: 'In Stock',
    primarySupplier: 'Samsung Electronics', leadTime: 24, location: 'WH-B / Zone-M1',
  },
  {
    sku: 'RAM-32G-DDR5', name: '32GB DDR5-5600 SO-DIMM', category: 'Memory',
    stockQty: 88, reorderPoint: 150, unitCost: '$95.00', status: 'Low Stock',
    primarySupplier: 'SK Hynix', leadTime: 7, location: 'WH-B / Zone-M2',
  },
  {
    sku: 'SSD-2T-NVME', name: '2TB NVMe Gen5 Enterprise SSD', category: 'Storage',
    stockQty: 310, reorderPoint: 100, unitCost: '$185.00', status: 'In Stock',
    primarySupplier: 'Samsung Electronics', leadTime: 21, location: 'WH-B / Zone-S1',
  },
  {
    sku: 'DISP-OLED-16', name: '16" 4K ProArt OLED Panel', category: 'Display',
    stockQty: 72, reorderPoint: 80, unitCost: '$420.00', status: 'Low Stock',
    primarySupplier: 'LG Display', leadTime: 45, location: 'WH-C / Zone-D1',
  },
  {
    sku: 'MOD-WIFI7-AX', name: 'WiFi 7 AX Module', category: 'Connectivity',
    stockQty: 620, reorderPoint: 200, unitCost: '$35.00', status: 'In Stock',
    primarySupplier: 'Murata Manufacturing', leadTime: 10, location: 'WH-B / Zone-W1',
  },
  {
    sku: 'PSU-GAN-240W', name: '240W GaN Power Supply Unit', category: 'Power',
    stockQty: 145, reorderPoint: 100, unitCost: '$75.00', status: 'In Stock',
    primarySupplier: 'Texas Instruments', leadTime: 12, location: 'WH-C / Zone-P1',
  },
  {
    sku: 'MB-ZEUS-X1', name: 'Zeus X1 Titanium Mainboard', category: 'Mainboard',
    stockQty: 0, reorderPoint: 30, unitCost: '$650.00', status: 'Out of Stock',
    primarySupplier: 'Foxconn Technology', leadTime: 35, location: 'WH-A / Zone-B1',
  },
  {
    sku: 'BATT-LIPO-99W', name: 'Li-Po Battery Pack 99Wh', category: 'Battery',
    stockQty: 203, reorderPoint: 100, unitCost: '$45.00', status: 'In Stock',
    primarySupplier: '—', leadTime: 21, location: 'WH-C / Safe-01',
  },
]

const statusConfig: Record<ComponentStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  'In Stock':     { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
  'Low Stock':    { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  'Out of Stock': { bg: 'bg-mrp-danger/10',  border: 'border-mrp-danger/20',  text: 'text-mrp-danger',  dot: 'bg-mrp-danger',  pulse: true },
  'Discontinued': { bg: 'bg-mrp-border/30',  border: 'border-mrp-border',     text: 'text-mrp-text-muted', dot: 'bg-mrp-text-muted', pulse: false },
}

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL',           label: 'All' },
  { key: 'In Stock',      label: 'In Stock' },
  { key: 'Low Stock',     label: 'Low Stock' },
  { key: 'Out of Stock',  label: 'Out of Stock' },
]

const kpiCards = [
  { label: 'Total SKUs', value: '11', color: 'text-white', accent: null },
  { label: 'Low Stock', value: '3', color: 'text-mrp-warning', accent: 'border-l-4 border-l-mrp-warning',
    badge: <span className="w-2 h-2 rounded-full bg-mrp-warning animate-pulse" /> },
  { label: 'Out of Stock', value: '2', color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
    badge: <span className="w-2 h-2 rounded-full bg-mrp-danger animate-pulse" /> },
  { label: 'Total Stock Value', value: '$1.24M', color: 'text-white', accent: null },
]

export function ComponentInventoryView() {
  const [filter, setFilter]     = useState<FilterType>('ALL')
  const [search, setSearch]     = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = mockComponents.filter((c) => {
    const matchStatus = filter === 'ALL' || c.status === filter
    const matchSearch = search === '' ||
      c.sku.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.primarySupplier.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const toggleExpand = (sku: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      n.has(sku) ? n.delete(sku) : n.add(sku)
      return n
    })
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Component Inventory</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Manage purchased components — stock levels, reorder thresholds, supplier mapping, and warehouse locations.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('Exported', { description: 'Component list downloaded' })}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => toast.success('Add Component', { description: 'New component registration form opened' })}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm"
          >
            <Plus size={16} /> Add Component
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

      {/* Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Filter + Search Bar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
                  filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, name, supplier..."
                className="bg-mrp-panel border border-mrp-border text-white text-[13px] py-1.5 pl-8 pr-3 rounded-sm w-56 focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted"
              />
            </div>
            <button onClick={() => toast.success('Filters applied')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors">
              <Filter size={15} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['SKU', 'Component Name', 'Category', 'Stock Qty', 'Reorder Pt.', 'Unit Cost', 'Status', 'Primary Supplier', ''].map((col) => (
                  <th key={col} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${
                    ['Stock Qty', 'Reorder Pt.', 'Unit Cost'].includes(col) ? 'text-right' : ''
                  }`}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((comp) => {
                const cfg = statusConfig[comp.status]
                const isExp = expanded.has(comp.sku)
                const stockPct = comp.reorderPoint > 0
                  ? Math.min(100, Math.round((comp.stockQty / (comp.reorderPoint * 3)) * 100))
                  : 100

                return (
                  <React.Fragment key={comp.sku}>
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExp ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[12px] text-mrp-primary whitespace-nowrap">{comp.sku}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{comp.name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-mrp-border/40 border border-mrp-border text-mrp-text-secondary rounded-sm text-[10px] font-bold uppercase tracking-wider">
                          <Package size={9} />
                          {comp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-[13px] text-white">{comp.stockQty.toLocaleString()}</span>
                          <div className="w-16 h-1 bg-mrp-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                comp.stockQty === 0 ? 'bg-mrp-danger' :
                                comp.stockQty <= comp.reorderPoint ? 'bg-mrp-warning' : 'bg-mrp-success'
                              }`}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted text-right">{comp.reorderPoint.toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right whitespace-nowrap">{comp.unitCost}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
                          {comp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{comp.primarySupplier}</td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => toggleExpand(comp.sku)} className="p-1 text-mrp-text-muted hover:text-white transition-colors">
                          {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row */}
                    {isExp && (
                      <tr className="bg-[#1a1c1e]">
                        <td colSpan={9} className="p-0 border-b border-mrp-border">
                          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
                            {/* Location & Stock */}
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-1">Stock Details</h4>
                              {[
                                { label: 'Warehouse Location', value: comp.location },
                                { label: 'Reorder Point', value: comp.reorderPoint.toLocaleString() + ' units' },
                                { label: 'Unit Cost', value: comp.unitCost },
                              ].map((row) => (
                                <div key={row.label} className="flex justify-between">
                                  <span className="text-mrp-text-muted">{row.label}</span>
                                  <span className="font-mono text-white">{row.value}</span>
                                </div>
                              ))}
                              {comp.stockQty <= comp.reorderPoint && comp.stockQty > 0 && (
                                <div className="flex items-center gap-1.5 text-mrp-warning text-[11px] font-bold mt-2 border border-mrp-warning/20 bg-mrp-warning/10 rounded-sm px-2 py-1">
                                  <AlertTriangle size={12} /> Below reorder point — create PO
                                </div>
                              )}
                              {comp.stockQty === 0 && (
                                <div className="flex items-center gap-1.5 text-mrp-danger text-[11px] font-bold mt-2 border border-mrp-danger/20 bg-mrp-danger/10 rounded-sm px-2 py-1">
                                  <AlertTriangle size={12} /> Out of stock — urgent PO required
                                </div>
                              )}
                            </div>

                            {/* Supplier Info */}
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-1">Supplier Info</h4>
                              {[
                                { label: 'Primary Supplier', value: comp.primarySupplier },
                                { label: 'Lead Time', value: comp.leadTime + ' days' },
                                { label: 'Category', value: comp.category },
                              ].map((row) => (
                                <div key={row.label} className="flex justify-between">
                                  <span className="text-mrp-text-muted">{row.label}</span>
                                  <span className="text-white">{row.value}</span>
                                </div>
                              ))}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider border-b border-mrp-border pb-1">Quick Actions</h4>
                              <button
                                onClick={() => toast.success('Create PO', { description: `PO draft created for ${comp.sku} via ${comp.primarySupplier}` })}
                                className="w-full px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white text-[12px] font-bold rounded-sm transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus size={14} /> Create Purchase Order
                              </button>
                              <button
                                onClick={() => toast.info('Adjust Stock', { description: `Stock adjustment form opened for ${comp.sku}` })}
                                className="w-full px-4 py-2 border border-mrp-border text-white text-[12px] font-medium rounded-sm hover:bg-mrp-border transition-colors"
                              >
                                Adjust Stock
                              </button>
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
            Showing 1-{filtered.length} of {filtered.length} Components
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
    </>
  )
}
