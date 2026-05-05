'use client'

import React, { useState } from 'react'
import { ShoppingCart, Printer, ChevronDown, ChevronUp, ArrowRight, Filter, Download, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface OrderRow {
  id: string
  orderId: string
  targetBuild: string
  qty: number
  status: 'shortage' | 'clear' | 'partial'
  missingComponents: string
  components?: { sku: string; required: number; onHand: number; shortage: number }[]
}

const mockOrders: OrderRow[] = [
  {
    id: '1',
    orderId: 'ORD-901',
    targetBuild: 'Dell XPS 15 (9530)',
    qty: 5,
    status: 'shortage',
    missingComponents: '5x CPU-I7-13700H, 10x RAM-16G-DDR5',
    components: [
      { sku: 'CPU-I7-13700H', required: 5, onHand: 0, shortage: 5 },
      { sku: 'RAM-16G-DDR5-5600', required: 10, onHand: 4, shortage: 6 },
    ],
  },
  {
    id: '2',
    orderId: 'ORD-902',
    targetBuild: 'ASUS ROG Zephyrus G14',
    qty: 2,
    status: 'clear',
    missingComponents: '-',
    components: [
      { sku: 'CPU-R9-7940HS', required: 2, onHand: 5, shortage: 0 },
      { sku: 'RAM-32G-DDR5-5600', required: 2, onHand: 8, shortage: 0 },
      { sku: 'GPU-RX7600S', required: 2, onHand: 3, shortage: 0 },
    ],
  },
  {
    id: '3',
    orderId: 'ORD-905',
    targetBuild: 'ThinkPad X1 Carbon Gen 11',
    qty: 15,
    status: 'clear',
    missingComponents: '-',
    components: [
      { sku: 'CPU-I7-1365U', required: 15, onHand: 20, shortage: 0 },
      { sku: 'RAM-16G-DDR5-5600', required: 15, onHand: 30, shortage: 0 },
      { sku: 'SSD-1T-NVME-GEN4', required: 15, onHand: 18, shortage: 0 },
    ],
  },
  {
    id: '4',
    orderId: 'ORD-907',
    targetBuild: 'Dell XPS 15 (9530) Pro',
    qty: 3,
    status: 'shortage',
    missingComponents: '3x MB-XPS15-9530, 12x RAM-32G-DDR5',
    components: [
      { sku: 'MB-XPS15-9530', required: 3, onHand: 1, shortage: 2 },
      { sku: 'RAM-32G-DDR5-5600', required: 12, onHand: 4, shortage: 8 },
      { sku: 'PSU-140W-GAN', required: 3, onHand: 3, shortage: 0 },
    ],
  },
]

const statusConfig = {
  shortage: {
    bg: 'bg-mrp-danger/10',
    border: 'border-mrp-danger/20',
    text: 'text-mrp-danger',
    label: 'Shortage',
    pulse: true,
  },
  clear: {
    bg: 'bg-mrp-success/10',
    border: 'border-mrp-success/20',
    text: 'text-mrp-success',
    label: 'Clear to Build',
    pulse: false,
  },
  partial: {
    bg: 'bg-mrp-warning/10',
    border: 'border-mrp-warning/20',
    text: 'text-mrp-warning',
    label: 'Partial',
    pulse: true,
  },
}

const kpiCards = [
  {
    label: 'Total Open Orders',
    value: '1,248',
    valueClass: 'text-white',
    accent: null,
    badge: (
      <span className="text-[10px] text-mrp-success flex items-center gap-0.5">
        <TrendingUp size={12} />
        +12.5%
      </span>
    ),
  },
  {
    label: 'Components In Shortage',
    value: '14',
    valueClass: 'text-mrp-danger',
    accent: 'border-l-4 border-l-mrp-danger',
    badge: <span className="animate-pulse flex h-2 w-2 rounded-full bg-mrp-danger" />,
  },
  {
    label: 'Orders Clear to Build',
    value: '852',
    valueClass: 'text-mrp-success',
    accent: 'border-l-4 border-l-mrp-success',
    badge: <span className="text-[10px] text-mrp-text-muted">68% of Total</span>,
  },
  {
    label: 'POs Pending Arrival',
    value: '29',
    valueClass: 'text-mrp-warning',
    accent: 'border-l-4 border-l-mrp-warning',
    badge: <span className="text-[10px] text-mrp-text-muted">ETA &lt; 48h</span>,
  },
]

export function DashboardPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['1']))
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set(['1']))

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Material Requirements Overview</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Real-time supply chain monitoring for active assembly lines.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('Report Exported', { description: 'Dashboard report downloaded' })}
            className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm"
          >
            <Download size={16} />
            Export Report
          </button>
          <button
            onClick={() => toast.success('Purchase Orders Drafted', { description: '3 POs created for deficit components' })}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm"
          >
            <ShoppingCart size={16} />
            Create Draft PO
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`bg-mrp-panel border border-mrp-border p-4 flex flex-col justify-between rounded-sm ${card.accent ?? ''}`}
          >
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              {card.label}
            </span>
            <div className="flex items-baseline justify-between mt-3">
              <span className={`font-mono font-bold text-2xl ${card.valueClass}`}>{card.value}</span>
              {card.badge}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Stock Level Trend */}
        <div className="bg-mrp-panel border border-mrp-border p-6 rounded-sm">
          <div className="flex justify-between items-start mb-5">
            <h3 className="text-base font-bold text-white">Stock Level Trend (Last 7 Days)</h3>
            <div className="flex gap-4">
              {[
                { color: 'bg-[#0066CC]', label: 'CPU-I7' },
                { color: 'bg-[#3E8635]', label: 'RAM-16G' },
                { color: 'bg-[#F0AB00]', label: 'SSD-1T' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-[10px] text-mrp-text-muted uppercase font-bold">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[200px] w-full border border-mrp-border bg-mrp-app relative overflow-hidden chart-grid">
            <svg
              className="absolute inset-0 w-full h-full p-4"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              <polyline fill="none" stroke="#0066CC" strokeWidth="2"
                points="0,150 50,140 100,160 150,110 200,130 250,90 300,100 400,60" />
              <polyline fill="none" stroke="#3E8635" strokeWidth="2"
                points="0,100 50,110 100,90 150,130 200,100 250,120 300,110 400,130" />
              <polyline fill="none" stroke="#F0AB00" strokeWidth="2"
                points="0,180 50,170 100,175 150,140 200,150 250,130 300,140 400,120" />
            </svg>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <span key={d} className="text-[10px] text-mrp-text-muted">{d}</span>
            ))}
          </div>
        </div>

        {/* Order Fulfillment Rate */}
        <div className="bg-mrp-panel border border-mrp-border p-6 rounded-sm">
          <div className="flex justify-between items-start mb-5">
            <h3 className="text-base font-bold text-white">Order Fulfillment Rate (%)</h3>
            <select className="bg-mrp-app border border-mrp-border text-[11px] px-2 py-1 focus:outline-none text-white rounded-sm focus:border-mrp-primary">
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>
          <div className="h-[200px] w-full border border-mrp-border bg-mrp-app relative overflow-hidden chart-grid">
            <svg
              className="absolute inset-0 w-full h-full p-4"
              viewBox="0 0 400 200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066CC" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0066CC" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d="M0,180 L50,160 L100,170 L150,120 L200,130 L250,80 L300,70 L400,50 L400,200 L0,200 Z"
                fill="url(#areaFill)"
              />
              <polyline fill="none" stroke="#0066CC" strokeWidth="2"
                points="0,180 50,160 100,170 150,120 200,130 250,80 300,70 400,50" />
            </svg>
          </div>
          {/* Y-axis hint */}
          <div className="flex justify-between mt-2 px-1">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Now'].map((d) => (
              <span key={d} className="text-[10px] text-mrp-text-muted">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Material Readiness Matrix */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Filters applied', { description: 'Showing filtered results' })}
              className="flex items-center gap-2 px-3 py-1.5 border border-mrp-border rounded-sm bg-mrp-panel text-white text-[13px] hover:bg-mrp-border transition-colors"
            >
              <Filter size={14} />
              Filter
            </button>
            <div className="h-4 w-px bg-mrp-border" />
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              Material Readiness Matrix
            </span>
          </div>
          <div className="flex gap-4 text-[11px] text-mrp-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mrp-danger" /> Critical Shortage
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-mrp-warning" /> Potential Delay
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(mockOrders.map((o) => o.id)))
                        toast.success('All orders selected')
                      } else {
                        setSelectedRows(new Set())
                      }
                    }}
                  />
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Order ID
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Target Build
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">
                  Qty
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Readiness Status
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider min-w-[200px]">
                  Missing Components
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {mockOrders.map((order) => {
                const cfg = statusConfig[order.status]
                const isExpanded = expandedRows.has(order.id)
                const isSelected = selectedRows.has(order.id)

                return (
                  <React.Fragment key={order.id}>
                    {/* Main Row */}
                    <tr className="hover:bg-mrp-panel transition-colors group">
                      <td className="py-3 px-3 text-center align-top">
                        <input
                          checked={isSelected}
                          onChange={() => toggleSelect(order.id)}
                          className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                          type="checkbox"
                        />
                      </td>
                      <td className="py-3 px-4 align-top font-mono text-[13px] text-white whitespace-nowrap">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4 align-top text-[13px] text-white font-medium">
                        {order.targetBuild}
                      </td>
                      <td className="py-3 px-4 align-top font-mono text-[13px] text-white text-right">
                        {order.qty}
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div
                          className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.text.replace('text-', 'bg-')}${cfg.pulse ? ' animate-pulse' : ''}`}
                          />
                          {cfg.label}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top text-[13px] text-mrp-text-secondary">
                        {order.missingComponents}
                      </td>
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toast.success('Pick List Printed', { description: `${order.orderId} pick list sent to printer` })}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                          >
                            <Printer size={14} />
                            Print Pick List
                          </button>
                          <button
                            onClick={() => toggleRow(order.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                          >
                            {isExpanded ? 'Hide Components' : 'View Components'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Component Breakdown */}
                    {isExpanded && order.components && (
                      <tr key={`${order.id}-expanded`} className="bg-[#1a1c1e] shadow-inner border-b border-mrp-border">
                        <td />
                        <td className="py-4 px-4 pb-6" colSpan={6}>
                          <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
                            <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-3 border-b border-mrp-border pb-2">
                              Component Deficit Breakdown
                            </h4>
                            <div className="grid grid-cols-4 gap-4 text-[13px]">
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider col-span-1">Component SKU</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Required</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">On-Hand</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Shortage</div>

                              {order.components.map((comp, idx) => (
                                <React.Fragment key={idx}>
                                  <div className="col-span-1 font-mono text-white border-t border-mrp-border pt-2">{comp.sku}</div>
                                  <div className="text-right font-mono text-white border-t border-mrp-border pt-2">{comp.required}</div>
                                  <div className="text-right font-mono text-mrp-text-muted border-t border-mrp-border pt-2">{comp.onHand}</div>
                                  <div className={`text-right font-mono font-bold border-t border-mrp-border pt-2 ${comp.shortage > 0 ? 'text-mrp-danger' : 'text-mrp-success'}`}>
                                    {comp.shortage}
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={() => toast.success('PO Generated', { description: `Purchase order created for ${order.orderId} deficits` })}
                                className="text-mrp-primary text-[13px] font-medium hover:text-white flex items-center gap-1 transition-colors"
                              >
                                Generate PO for Deficits
                                <ArrowRight size={14} />
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-4 of 4 Orders</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-mrp-text-secondary">
              Page
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>1</option>
              </select>
              of 1
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 rounded-sm text-mrp-text-muted hover:bg-mrp-border transition-colors disabled:opacity-50" disabled>
                <ChevronUp size={16} className="rotate-[-90deg]" />
              </button>
              <button className="p-1 rounded-sm text-mrp-text-muted hover:bg-mrp-border transition-colors disabled:opacity-50" disabled>
                <ChevronDown size={16} className="rotate-[-90deg]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
