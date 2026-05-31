'use client'

import React, { useState, useEffect } from 'react'
import { Search, ChevronDown, ChevronUp, Filter, Download, TrendingUp, Loader2, Package, RefreshCw, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost } from '@/lib/axios.client'

interface ComponentStatus {
  part_id: string
  component_sku?: string
  sku?: string
  total_required_qty: number
  available_qty: number
  is_shortage: boolean
}

interface OrderRow {
  order_id: string
  target_build: string
  quantity: number
  status: string
  deficit_breakdown?: ComponentStatus[]
}

interface DashboardMetrics {
  total_open_orders: number
  supply_readiness_rate: number
  components_in_shortage: number
  blocked_orders: number
}

export function DashboardView() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMetricsLoading, setIsMetricsLoading] = useState(true)
  
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [detailData, setDetailData] = useState<Record<string, ComponentStatus[]>>({})
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({})
  
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [totalItems, setTotalItems] = useState(0)

  const fetchMetrics = async () => {
    setIsMetricsLoading(true)
    try {
      const res = await apiGet<DashboardMetrics>('/mrp/readiness/metrics')
      if (res.data) setMetrics(res.data)
    } catch (error) {
      toast.error('Metrics Error', { description: 'Cannot load dashboard metrics.' })
    } finally {
      setIsMetricsLoading(false)
    }
  }

  const fetchTableData = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (statusFilter !== 'ALL') params.status = statusFilter 
      if (searchQuery.trim() !== '') params.search = searchQuery

      const res = await apiGet<any>('/mrp/readiness', { params })
      const dataList = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setOrders(dataList)
      setTotalItems(res.metadata?.total || res.data?.metadata?.total || dataList.length)
    } catch (error) {
      toast.error('Table Error', { description: 'Cannot load readiness table data.' })
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshAll = () => {
    fetchMetrics()
    fetchTableData()
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchTableData()
  }, [statusFilter, page, perPage])

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1)
      fetchTableData()
    }
  }

  const handleToggleRow = async (orderId: string) => {
    const isCurrentlyExpanded = !!expandedRows[orderId]
    setExpandedRows(prev => ({ ...prev, [orderId]: !isCurrentlyExpanded }))

    if (!isCurrentlyExpanded && !detailData[orderId]) {
      setLoadingDetails(prev => ({ ...prev, [orderId]: true }))
      try {
        const res = await apiGet<OrderRow>(`/mrp/readiness/${orderId}`)
        if (res.data?.deficit_breakdown) {
          setDetailData(prev => ({ ...prev, [orderId]: res.data?.deficit_breakdown as ComponentStatus[] }))
        } else {
          setDetailData(prev => ({ ...prev, [orderId]: [] }))
        }
      } catch (error) {
        toast.error('Detail Error', { description: 'Cannot load shortage breakdown for this order.' })
      } finally {
        setLoadingDetails(prev => ({ ...prev, [orderId]: false }))
      }
    }
  }

  const handleExport = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'ALL') params.status = statusFilter
      if (searchQuery.trim() !== '') params.search = searchQuery

      const response = await apiGet('/mrp/readiness/export', { 
        params, 
        responseType: 'blob' 
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data as any]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `material-readiness-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('CSV Exported', { description: 'Readiness matrix exported successfully.' })
    } catch (error) {
      toast.error('Export Failed', { description: 'Could not download the CSV file.' })
    }
  }

  const renderStatusBadge = (status: string) => {
    const s = status?.toLowerCase()
    if (s === 'clear_to_build') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase bg-mrp-success/10 text-mrp-success border border-mrp-success/20">
          <span className="w-1 h-1 rounded-full bg-mrp-success"></span>
          Clear
        </span>
      )
    }
    if (s === 'partial') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase bg-mrp-warning/10 text-mrp-warning border border-mrp-warning/20">
          <span className="w-1 h-1 rounded-full bg-mrp-warning"></span>
          Partial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-bold uppercase bg-mrp-danger/10 text-mrp-danger border border-mrp-danger/20 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-mrp-danger"></span>
        Shortage
      </span>
    )
  }

  const formattedReadinessRate = metrics?.supply_readiness_rate 
    ? (Math.ceil(metrics.supply_readiness_rate * 100) / 100).toFixed(2)
    : '0.00'

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  return (
    <div className="flex-1 bg-mrp-app p-6 overflow-y-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-mrp-border pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Material Readiness Matrix</h1>
          <p className="text-[13px] text-mrp-text-secondary mt-1">Analyze actual component inventory status based on the order list.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefreshAll} className="p-2 border border-mrp-border rounded-sm bg-mrp-panel text-mrp-text-secondary hover:text-white transition-colors">
            <RefreshCw size={16} className={isLoading || isMetricsLoading ? "animate-spin" : ""} />
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-mrp-border rounded-sm bg-mrp-panel text-[13px] font-medium text-mrp-text-secondary hover:text-white transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider block">Total Active Orders</span>
            <span className="text-2xl font-semibold text-white block tracking-tight font-mono">{isMetricsLoading ? '...' : metrics?.total_open_orders ?? 0}</span>
          </div>
          <div className="p-2.5 bg-mrp-border/40 rounded-sm text-mrp-text-secondary group-hover:text-mrp-primary transition-colors"><Package size={20} /></div>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider block">Supply Readiness Rate</span>
            <span className="text-2xl font-semibold text-mrp-success block tracking-tight font-mono">{isMetricsLoading ? '...' : `${formattedReadinessRate}%`}</span>
          </div>
          <div className="p-2.5 bg-mrp-success/10 border border-mrp-success/20 rounded-sm text-mrp-success"><CheckCircle2 size={20} /></div>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider block">Blocked Orders</span>
            <span className="text-2xl font-semibold text-mrp-danger block tracking-tight font-mono">{isMetricsLoading ? '...' : metrics?.blocked_orders ?? 0}</span>
          </div>
          <div className="p-2.5 bg-mrp-danger/10 border border-mrp-danger/20 rounded-sm text-mrp-danger"><AlertTriangle size={20} className="animate-pulse" /></div>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider block">Shortage Components</span>
            <span className="text-2xl font-semibold text-mrp-warning block tracking-tight font-mono">{isMetricsLoading ? '...' : metrics?.components_in_shortage ?? 0}</span>
          </div>
          <div className="p-2.5 bg-mrp-warning/10 border border-mrp-warning/20 rounded-sm text-mrp-warning"><TrendingUp size={20} /></div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-mrp-panel border border-mrp-border rounded-sm p-3 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" size={16} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleSearchSubmit} placeholder="Search Matrix by Order ID or Target Build... (Press Enter to search)" className="w-full bg-mrp-app border border-mrp-border rounded-sm pl-9 pr-4 py-1.5 text-[13px] text-white focus:outline-none focus:border-mrp-primary placeholder:text-mrp-text-muted" />
        </div>
        <div className="flex items-center gap-2 border border-mrp-border rounded-sm px-3 py-1.5 bg-mrp-app">
          <Filter size={14} className="text-mrp-text-muted" />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-transparent text-[13px] text-white focus:outline-none cursor-pointer">
            <option value="ALL" className="bg-mrp-panel">All Readiness Status</option>
            <option value="CLEAR_TO_BUILD" className="bg-mrp-panel">Clear (100% Allocated)</option>
            <option value="PARTIAL" className="bg-mrp-panel">Partial Availability</option>
            <option value="SHORTAGE" className="bg-mrp-panel">Shortage / Blocked</option>
          </select>
        </div>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Target Assembly Model</th>
                <th className="py-3 px-4 text-right">Build Qty</th>
                <th className="py-3 px-4 text-center">Readiness Status</th>
                <th className="py-3 px-4">Missing Components Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[13px] text-mrp-text-muted">
                    <Loader2 className="animate-spin mx-auto mb-2 text-mrp-primary" size={24} />
                    Calculating Material Allocation Matrix...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[13px] text-mrp-text-muted">No matching production orders found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isExpanded = !!expandedRows[order.order_id]
                  const hasShortage = order.status?.toLowerCase() === 'shortage' || order.status?.toLowerCase() === 'partial'
                  const breakdownData = detailData[order.order_id] || order.deficit_breakdown

                  const missingStr = breakdownData
                    ? breakdownData
                        .filter(c => c.is_shortage)
                        .map(c => `${Math.max(0, c.total_required_qty - c.available_qty)}x ${c.component_sku || c.sku || c.part_id || 'UNKNOWN'}`)
                        .join(', ')
                    : hasShortage ? 'Expand to view shortages...' : '— Ready to Build'
                  
                  return (
                    <React.Fragment key={order.order_id}>
                      <tr 
                        onClick={() => handleToggleRow(order.order_id)}
                        className="hover:bg-mrp-panel/60 border-b border-mrp-border/40 transition-colors group cursor-pointer text-[13px]"
                      >
                        <td className="py-3 px-4 text-center">
                          {isExpanded ? <ChevronUp size={14} className="text-mrp-text-muted" /> : <ChevronDown size={14} className="text-mrp-text-muted" />}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-mrp-primary">ORD-{order.order_id.substring(0, 6).toUpperCase()}</td>
                        <td className="py-3 px-4 font-medium text-mrp-text-main">{order.target_build}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-white">{order.quantity}</td>
                        <td className="py-3 px-4 text-center">{renderStatusBadge(order.status)}</td>
                        <td className="py-3 px-4 text-mrp-text-secondary truncate max-w-xs font-mono text-[12px]">{missingStr}</td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-mrp-panel/30 border-b border-mrp-border">
                          <td colSpan={6} className="p-4 bg-mrp-app/40 relative">
                            <div className="border border-mrp-border/60 rounded-sm bg-mrp-panel/60 p-4 shadow-inner min-h-[120px]">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">Component Allocation Detail</h4>
                              </div>

                              {loadingDetails[order.order_id] ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-mrp-panel/50 z-10 rounded-sm">
                                  <Loader2 className="animate-spin text-mrp-primary" size={24} />
                                </div>
                              ) : breakdownData && breakdownData.length > 0 ? (
                                <div className="overflow-hidden border border-mrp-border rounded-sm">
                                  <table className="w-full text-left text-[12px]">
                                    <thead className="bg-mrp-app border-b border-mrp-border text-mrp-text-muted font-bold uppercase tracking-wider text-[11px]">
                                      <tr>
                                        <th className="p-2.5">Component SKU</th>
                                        <th className="p-2.5 text-right">Required</th>
                                        <th className="p-2.5 text-right">On-Hand</th>
                                        <th className="p-2.5 text-right">Shortage</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-mrp-border/60 font-mono">
                                      {breakdownData.map((comp, idx) => {
                                        const deficit = Math.max(0, comp.total_required_qty - comp.available_qty)
                                        const displaySku = comp.component_sku || comp.sku || comp.part_id || 'UNKNOWN'
                                        return (
                                          <tr key={idx} className="hover:bg-mrp-app/30">
                                            <td className="p-2.5 text-white">{displaySku}</td>
                                            <td className="p-2.5 text-right text-white">{comp.total_required_qty}</td>
                                            <td className="p-2.5 text-right text-mrp-text-secondary">{comp.available_qty}</td>
                                            <td className={`p-2.5 text-right font-bold ${comp.is_shortage ? 'text-mrp-danger' : 'text-mrp-success'}`}>
                                              {comp.is_shortage ? deficit : '0'}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center py-4 text-[12px] text-mrp-text-muted italic">No breakdown details returned from server.</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between shrink-0">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {totalItems === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)} of {totalItems} Entries
          </span>
          <div className="flex items-center gap-4 text-[13px] text-mrp-text-muted">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select 
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="bg-mrp-app border border-mrp-border rounded-sm focus:outline-none focus:border-mrp-primary px-1 py-0.5 text-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="w-px h-4 bg-mrp-border"></div>
            <div className="flex items-center gap-2">
              <span>Page</span>
              <select 
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                className="bg-mrp-app border border-mrp-border rounded-sm focus:outline-none focus:border-mrp-primary px-1 py-0.5 text-white cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span>of {totalPages}</span>
            </div>
            <div className="w-px h-4 bg-mrp-border"></div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 disabled:opacity-30 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 disabled:opacity-30 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}