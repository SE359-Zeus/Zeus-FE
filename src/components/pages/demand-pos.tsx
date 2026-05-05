'use client'

import { useState } from 'react'
import {
  ShoppingCart, Filter, ArrowUpDown, Send, Eye, Pencil, Plus, Download,
  ChevronDown, ChevronUp, Package, TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react'
import { toast } from 'sonner'

type POStatus = 'draft' | 'sent' | 'received' | 'partial'

interface PurchaseOrder {
  id: string
  vendor: string
  items: string
  status: POStatus
  total: string
  date: string
  expectedDelivery: string
}

interface DemandForecast {
  id: string
  product: string
  forecastQty: number
  period: string
  confidence: 'high' | 'medium' | 'low'
  currentStock: number
  gap: number
}

const poStatusConfig: Record<POStatus, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  draft: { bg: 'bg-mrp-text-muted/10', text: 'text-mrp-text-muted', label: 'Draft', icon: Pencil },
  sent: { bg: 'bg-mrp-primary/10', text: 'text-mrp-primary', label: 'Sent', icon: Send },
  received: { bg: 'bg-mrp-success/10', text: 'text-mrp-success', label: 'Received', icon: CheckCircle },
  partial: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', label: 'Partial', icon: Package },
}

const confidenceConfig: Record<string, { bg: string; text: string }> = {
  high: { bg: 'bg-mrp-success/10', text: 'text-mrp-success' },
  medium: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning' },
  low: { bg: 'bg-mrp-danger/10', text: 'text-mrp-danger' },
}

const mockPOs: PurchaseOrder[] = [
  { id: 'PO-2024-088', vendor: 'Intel Corporation', items: '10x CPU-I9-13900K, 5x GPU-RTX4080', status: 'received', total: '$11,740.00', date: '2026-04-20', expectedDelivery: '2026-04-25' },
  { id: 'PO-2024-087', vendor: 'Samsung Semiconductor', items: '20x RAM-16G-DDR5, 15x SSD-512G-NVME', status: 'sent', total: '$1,835.00', date: '2026-04-22', expectedDelivery: '2026-04-28' },
  { id: 'PO-2024-089', vendor: 'ASUS Components', items: '8x MB-Z790-WIFI', status: 'sent', total: '$1,512.00', date: '2026-04-23', expectedDelivery: '2026-04-30' },
  { id: 'PO-2024-090', vendor: 'Intel Corporation', items: '5x CPU-I7-13650HX', status: 'draft', total: '$1,575.00', date: '2026-04-24', expectedDelivery: 'TBD' },
  { id: 'PO-2024-085', vendor: 'Corsair Memory', items: '30x RAM-8G-DDR4, 20x RAM-16G-DDR5', status: 'received', total: '$1,420.00', date: '2026-04-18', expectedDelivery: '2026-04-23' },
  { id: 'PO-2024-091', vendor: 'EVGA Power', items: '10x PSU-1200W', status: 'partial', total: '$2,850.00', date: '2026-04-21', expectedDelivery: '2026-04-26' },
]

const mockDemands: DemandForecast[] = [
  { id: 'DF-001', product: 'Workstation Alpha', forecastQty: 25, period: 'May 2026', confidence: 'high', currentStock: 5, gap: 20 },
  { id: 'DF-002', product: 'Gaming Rig Beta', forecastQty: 15, period: 'May 2026', confidence: 'medium', currentStock: 8, gap: 7 },
  { id: 'DF-003', product: 'Office Desktop Std', forecastQty: 50, period: 'May 2026', confidence: 'high', currentStock: 30, gap: 20 },
  { id: 'DF-004', product: 'Server Rack Gamma', forecastQty: 8, period: 'Jun 2026', confidence: 'low', currentStock: 2, gap: 6 },
  { id: 'DF-005', product: 'Laptop Pro 15', forecastQty: 30, period: 'Jun 2026', confidence: 'medium', currentStock: 12, gap: 18 },
]

type TabId = 'demand' | 'purchase-orders'

export function DemandPosPage() {
  const [activeTab, setActiveTab] = useState<TabId>('purchase-orders')
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set())

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Demand & Purchase Orders</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Demand forecasting, purchase order management, and vendor tracking.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('PO Created', { description: 'New purchase order drafted successfully' })}
            className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Create PO
          </button>
          <button
            onClick={() => toast.success('Forecast Updated', { description: 'Demand projections recalculated' })}
            className="px-4 py-2 border border-mrp-border text-white rounded-sm text-sm font-medium transition-colors hover:bg-mrp-border flex items-center gap-2"
          >
            <TrendingUp size={16} />
            Update Forecast
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open POs', value: '4', icon: ShoppingCart, color: 'text-mrp-primary' },
          { label: 'Demand Gap (Units)', value: '71', icon: AlertTriangle, color: 'text-mrp-warning' },
          { label: 'Received This Month', value: '3', icon: CheckCircle, color: 'text-mrp-success' },
          { label: 'Total PO Value', value: '$21.1K', icon: Package, color: 'text-white' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-mrp-panel border border-mrp-border rounded-sm p-4 flex items-center gap-4">
              <div className={`p-2 rounded-sm bg-mrp-app ${stat.color}`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1">
                  {stat.label}
                </div>
                <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 bg-mrp-panel border border-mrp-border rounded-sm p-1 w-fit">
        <button
          onClick={() => setActiveTab('purchase-orders')}
          className={`px-4 py-2 rounded-sm text-[13px] font-medium transition-colors ${
            activeTab === 'purchase-orders' ? 'bg-mrp-primary text-white' : 'text-mrp-text-muted hover:text-white hover:bg-mrp-app'
          }`}
        >
          Purchase Orders
        </button>
        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2 rounded-sm text-[13px] font-medium transition-colors ${
            activeTab === 'demand' ? 'bg-mrp-primary text-white' : 'text-mrp-text-muted hover:text-white hover:bg-mrp-app'
          }`}
        >
          Demand Forecasts
        </button>
      </div>

      {activeTab === 'purchase-orders' && (
        <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-3">
            <button
              onClick={() => toast.success('Filters applied', { description: 'PO list filtered' })}
              className="flex items-center gap-2 px-3 py-1.5 border border-mrp-border rounded-sm bg-mrp-panel text-white text-[13px] hover:bg-mrp-border transition-colors"
            >
              <Filter size={14} />
              Filter
            </button>
            <div className="h-4 w-px bg-mrp-border"></div>
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              Showing: All Purchase Orders
            </span>
            <div className="ml-auto flex gap-2">
              {selectedPOs.size > 0 && (
                <button
                  onClick={() => toast.success('POs Sent', { description: `${selectedPOs.size} purchase order(s) dispatched to vendors` })}
                  className="flex items-center gap-2 px-3 py-1.5 bg-mrp-success/10 border border-mrp-success/20 text-mrp-success rounded-sm text-[13px] font-medium hover:bg-mrp-success/20 transition-colors"
                >
                  <Send size={14} />
                  Send Selected ({selectedPOs.size})
                </button>
              )}
              <button
                onClick={() => toast.success('Report Exported', { description: 'PO report CSV downloaded' })}
                className="flex items-center gap-2 px-3 py-1.5 text-mrp-text-muted hover:text-white text-[13px] transition-colors"
              >
                <Download size={14} />
                Export
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5" type="checkbox" />
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    PO Number
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    Vendor
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    Items
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">
                    Total
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    Date
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                    Expected
                  </th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mrp-border bg-mrp-app">
                {mockPOs.map((po) => {
                  const cfg = poStatusConfig[po.status]
                  const StatusIcon = cfg.icon
                  return (
                    <tr key={po.id} className="hover:bg-mrp-panel transition-colors">
                      <td className="py-3 px-3 text-center">
                        <input
                          checked={selectedPOs.has(po.id)}
                          onChange={() => {
                            setSelectedPOs((prev) => {
                              const next = new Set(prev)
                              if (next.has(po.id)) next.delete(po.id)
                              else next.add(po.id)
                              return next
                            })
                          }}
                          className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                          type="checkbox"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{po.id}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{po.vendor}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary max-w-[250px] truncate">{po.items}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <StatusIcon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{po.total}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-muted whitespace-nowrap">{po.date}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{po.expectedDelivery}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toast.success('PO Details Loaded', { description: `Viewing ${po.id} details` })}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          {po.status === 'draft' && (
                            <button
                              onClick={() => toast.success('PO Sent to Vendor', { description: `${po.id} dispatched to ${po.vendor}` })}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-[13px] font-medium transition-colors"
                            >
                              <Send size={14} />
                              Send
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
            <span className="text-[13px] text-mrp-text-muted">Showing 1-6 of 6 Purchase Orders</span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
                <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                  <option>10</option>
                  <option>20</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demand' && (
        <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center gap-3">
            <Filter size={14} className="text-mrp-text-muted" />
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              Showing: All Demand Forecasts
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Forecast ID</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Product</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Forecast Qty</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Period</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Confidence</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Current Stock</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Gap</th>
                  <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mrp-border bg-mrp-app">
                {mockDemands.map((demand) => {
                  const confCfg = confidenceConfig[demand.confidence]
                  return (
                    <tr key={demand.id} className="hover:bg-mrp-panel transition-colors">
                      <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{demand.id}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{demand.product}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{demand.forecastQty}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{demand.period}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${confCfg.bg} ${confCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          {demand.confidence}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted text-right">{demand.currentStock}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-right font-bold text-mrp-danger">{demand.gap > 0 ? demand.gap : '-'}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => toast.success('PO Generated from Forecast', { description: `Purchase order created for ${demand.product} gap of ${demand.gap} units` })}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-[13px] font-medium transition-colors"
                        >
                          <ShoppingCart size={14} />
                          Generate PO
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
