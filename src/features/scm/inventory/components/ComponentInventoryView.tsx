'use client'

import React, { useState } from 'react'
import { Search, Plus, ChevronDown, ChevronUp, Download, Filter,
  ChevronLeft, ChevronRight, AlertTriangle, Package, X, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useComponentStocks, useCreateComponentStock, useInventoryMetrics } from '../hooks/useInventory'
import { downloadFile } from '@/lib/axios.client'
import type { ComponentStatus } from '../inventory.types'

type FilterType = 'ALL' | ComponentStatus

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

export function ComponentInventoryView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  // Add Component modal
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [compForm, setCompForm] = useState({
    sku: '', name: '', category: '', unitCost: '', reorderPoint: '', supplier: '', location: ''
  })

  const { data, isLoading, isError } = useComponentStocks({
    page,
    limit,
    status: filter === 'ALL' ? undefined : filter,
    q: search || undefined
  })

  const { data: metricsData } = useInventoryMetrics()
  const metrics = metricsData?.data

  const createMutation = useCreateComponentStock()

  const handleSaveComponent = async () => {
    if (!compForm.sku.trim()) { toast.error('SKU is required'); return }
    if (!compForm.name.trim()) { toast.error('Component name is required'); return }
    
    try {
      await createMutation.mutateAsync({
        sku: compForm.sku,
        name: compForm.name,
        category: compForm.category || 'Component',
        unit_cost: Number(compForm.unitCost.replace(/[^0-9.]/g, '')) || 1, // default to 1 if 0 to bypass required
        reorder_point: Number(compForm.reorderPoint || 0),
        location: compForm.location || 'WH-A / Zone-C1',
        stock_qty: 0,
        primary_supplier_id: undefined // Do not send supplier name as UUID
      })

      setShowAddComponent(false)
      setCompForm({ sku: '', name: '', category: '', unitCost: '', reorderPoint: '', supplier: '', location: '' })
    } catch (e) {
      // The onError hook in useInventory handles the toast
    }
  }

  const toggleExpand = (sku: string) => {
    setExpanded((prev) => {
      const n = new Set(prev)
      n.has(sku) ? n.delete(sku) : n.add(sku)
      return n
    })
  }

  // Handle both possible structures: { data: { items: [] } } or { data: [] }
  const rawData = data?.data
  const items = Array.isArray(rawData) ? rawData : ((rawData as any)?.items ?? (rawData as any)?.data ?? [])
  const paginationMeta = data?.metadata?.pagination as any
  const total = paginationMeta?.total_rows || paginationMeta?.totalCount || 0
  const totalPages = paginationMeta?.total_pages || paginationMeta?.totalPages || 1
  
  // Calculate local KPIs (fallback if API is down)
  const totalSKUs = metrics?.total_skus || total
  const lowStock = metrics?.low_stock || items.filter(i => i.status === 'Low Stock').length
  const outOfStock = metrics?.out_of_stock || items.filter(i => i.status === 'Out of Stock').length
  const totalValue = metrics?.stock_value || items.reduce((sum, item) => sum + (item.stock_qty * item.unit_cost), 0)

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
  }

  const formatCompactCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(val)
  }

  const kpiCards = [
    { label: 'Total SKUs', value: totalSKUs.toString(), color: 'text-white', accent: null },
    { label: 'Low Stock', value: lowStock.toString(), color: 'text-mrp-warning', accent: 'border-l-4 border-l-mrp-warning',
      badge: <span className="w-2 h-2 rounded-full bg-mrp-warning animate-pulse" /> },
    { label: 'Out of Stock', value: outOfStock.toString(), color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
      badge: <span className="w-2 h-2 rounded-full bg-mrp-danger animate-pulse" /> },
    { label: 'Stock Value', value: formatCompactCurrency(totalValue), color: 'text-white', accent: null },
  ]

  const handleExport = async () => {
    try {
      const toastId = toast.loading('Exporting inventory report...')
      await downloadFile('/scm/inventory/export', 'inventory_report.csv')
      toast.success('Export completed', { id: toastId })
    } catch (err) {
      toast.error('Export failed')
    }
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
            onClick={handleExport}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <Download size={16} /> Export
          </button>
          <button
            onClick={() => setShowAddComponent(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
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
              <button key={key} onClick={() => { setFilter(key); setPage(1); }}
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors cursor-pointer ${
                  filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search SKU, name..."
                className="bg-mrp-panel border border-mrp-border text-white text-[13px] py-1.5 pl-8 pr-3 rounded-sm w-56 focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted"
              />
            </div>
            <button onClick={() => toast.success('Filters applied')} className="p-1.5 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors cursor-pointer">
              <Filter size={15} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px] text-mrp-text-muted">
              <Loader2 className="animate-spin" size={24} />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-[300px] text-mrp-danger">
              Failed to load component inventory
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-mrp-text-muted">
              No components found matching your criteria
            </div>
          ) : (
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
                {items.map((comp) => {
                  const cfg = statusConfig[comp.status] || statusConfig['In Stock']
                  const isExp = expanded.has(comp.sku)
                  const stockPct = comp.reorder_point > 0
                    ? Math.min(100, Math.round((comp.stock_qty / (comp.reorder_point * 3)) * 100))
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
                            <span className="font-mono text-[13px] text-white">{comp.stock_qty.toLocaleString()}</span>
                            <div className="w-16 h-1 bg-mrp-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  comp.stock_qty === 0 ? 'bg-mrp-danger' :
                                  comp.stock_qty <= comp.reorder_point ? 'bg-mrp-warning' : 'bg-mrp-success'
                                }`}
                                style={{ width: `${stockPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted text-right">{comp.reorder_point.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-[13px] text-white text-right whitespace-nowrap">{formatCurrency(comp.unit_cost)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}${cfg.pulse ? ' animate-pulse' : ''}`} />
                            {comp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{comp.primary_supplier || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => toggleExpand(comp.sku)} className="p-1 text-mrp-text-muted hover:text-white transition-colors cursor-pointer">
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
                                  { label: 'Warehouse Location', value: comp.location || 'Not Assigned' },
                                  { label: 'Reorder Point', value: comp.reorder_point.toLocaleString() + ' units' },
                                  { label: 'Unit Cost', value: formatCurrency(comp.unit_cost) },
                                ].map((row) => (
                                  <div key={row.label} className="flex justify-between">
                                    <span className="text-mrp-text-muted">{row.label}</span>
                                    <span className="font-mono text-white">{row.value}</span>
                                  </div>
                                ))}
                                {comp.stock_qty <= comp.reorder_point && comp.stock_qty > 0 && (
                                  <div className="flex items-center gap-1.5 text-mrp-warning text-[11px] font-bold mt-2 border border-mrp-warning/20 bg-mrp-warning/10 rounded-sm px-2 py-1">
                                    <AlertTriangle size={12} /> Below reorder point — create PO
                                  </div>
                                )}
                                {comp.stock_qty === 0 && (
                                  <div className="flex items-center gap-1.5 text-mrp-danger text-[11px] font-bold mt-2 border border-mrp-danger/20 bg-mrp-danger/10 rounded-sm px-2 py-1">
                                    <AlertTriangle size={12} /> Out of stock — urgent PO required
                                  </div>
                                )}
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
          )}
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {items.length > 0 ? (page - 1) * limit + 1 : 0}-{Math.min(page * limit, total)} of {total} Components
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Component Modal */}
      {showAddComponent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAddComponent(false)}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Component</h3>
              <button onClick={() => setShowAddComponent(false)} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">SKU</label>
                  <input value={compForm.sku} onChange={(e) => setCompForm((f) => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. SOC-XM100-PRO"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] font-mono focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted placeholder:font-sans" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Category</label>
                  <select value={compForm.category} onChange={(e) => setCompForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm">
                    <option value="">Select category...</option>
                    <option>Processor</option>
                    <option>GPU</option>
                    <option>Memory</option>
                    <option>Storage</option>
                    <option>Display</option>
                    <option>Connectivity</option>
                    <option>Power</option>
                    <option>Mainboard</option>
                    <option>Battery</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Component Name</label>
                <input value={compForm.name} onChange={(e) => setCompForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Zeus SOC XM100 Pro (14-Core)"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Unit Cost</label>
                  <input value={compForm.unitCost} onChange={(e) => setCompForm((f) => ({ ...f, unitCost: e.target.value }))}
                    placeholder="$0.00"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Reorder Point</label>
                  <input value={compForm.reorderPoint} onChange={(e) => setCompForm((f) => ({ ...f, reorderPoint: e.target.value }))}
                    type="number" min={0} placeholder="0"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Location</label>
                  <input value={compForm.location} onChange={(e) => setCompForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="WH-A / Zone-C1"
                    className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button onClick={() => setShowAddComponent(false)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
              <button 
                onClick={handleSaveComponent} 
                disabled={createMutation.isPending}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm cursor-pointer flex items-center gap-2"
              >
                {createMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Save Component
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
