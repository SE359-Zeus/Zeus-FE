'use client'

import React, { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, Loader2, RefreshCw, ChevronDown, ChevronUp, MapPin, Package } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost } from '@/lib/axios.client'

interface DemandRecord {
  order_id: string
  target_build: string
  quantity: number
  qty_ready: number
  status: string
  priority: string
  target_date: string
  po_count: number
  missing_count?: number
}

interface DemandMetrics {
  ready_to_build: number
  shortage_or_partial: number
  total_demand_orders: number
  total_units_required: number
}

interface PickListItem {
  part_id: string
  sku: string
  quantity: number
  bin_location: string
}

const statusConfig: Record<string, { bg: string; border: string; text: string; dot?: string; pulse?: boolean }> = {
  'Ready to Build': { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' },
  'Shortage':       { bg: 'bg-mrp-danger/10',  border: 'border-mrp-danger/20',  text: 'text-mrp-danger',  dot: 'bg-mrp-danger',  pulse: true },
  'Partial':        { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  'Planned':        { bg: 'bg-mrp-border/30',  border: 'border-mrp-border',     text: 'text-mrp-text-muted' },
}

const priorityConfig: Record<string, { text: string }> = {
  'High':   { text: 'text-mrp-danger' },
  'Normal': { text: 'text-mrp-text-secondary' },
  'Low':    { text: 'text-mrp-text-muted' },
}

const formatStatus = (s: string) => {
  if (!s) return 'Planned'
  const upper = s.toUpperCase()
  if (upper === 'CLEAR_TO_BUILD') return 'Ready to Build'
  if (upper === 'SHORTAGE') return 'Shortage'
  if (upper === 'PARTIAL') return 'Partial'
  return 'Planned'
}

const formatPriority = (p: string) => {
  if (!p) return 'Normal'
  const upper = p.toUpperCase()
  if (upper === 'HIGH') return 'High'
  if (upper === 'LOW') return 'Low'
  return 'Normal'
}

export function DemandPosView() {
  const [demands, setDemands] = useState<DemandRecord[]>([])
  const [metrics, setMetrics] = useState<DemandMetrics | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isMetricsLoading, setIsMetricsLoading] = useState(true)
  
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [pickLists, setPickLists] = useState<Record<string, PickListItem[]>>({})
  const [loadingPickLists, setLoadingPickLists] = useState<Record<string, boolean>>({})
  const [generatingPickLists, setGeneratingPickLists] = useState<Record<string, boolean>>({})

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  const fetchMetrics = async () => {
    setIsMetricsLoading(true)
    try {
      const res = await apiGet<any>('/mrp/demand/metrics', { timeout: 15000 })
      if (res.data) setMetrics(res.data)
    } catch (error) {
      toast.error('Metrics Error', { description: 'Cannot load demand metrics.' })
    } finally {
      setIsMetricsLoading(false)
    }
  }

  const fetchDemandData = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (searchQuery.trim() !== '') params.search = searchQuery

      const res = await apiGet<any>('/mrp/demand', { 
        params,
        timeout: 30000 
      })
      
      const dataList = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setDemands(dataList)
      setTotalItems(res.metadata?.total || res.data?.metadata?.total || dataList.length)
    } catch (error) {
      toast.error('Sync Error', { description: 'Cannot load demand orders from server.' })
      setDemands([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshAll = () => {
    fetchMetrics()
    fetchDemandData()
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchDemandData()
  }, [page, perPage])

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1)
      fetchDemandData()
    }
  }

  const handleTriggerPO = async () => {
    try {
      await apiPost('/mrp/demand/generate-pos')
      toast.success('PO Task Started', { description: 'Background task to generate draft POs has started.' })
      setTimeout(handleRefreshAll, 1500)
    } catch (error: any) {
      toast.error('Backend Error', { description: error?.response?.data?.message || 'Failed to generate POs.' })
    }
  }

  const handleToggleRow = async (orderId: string) => {
    const isExpanded = !!expandedRows[orderId]
    setExpandedRows(prev => ({ ...prev, [orderId]: !isExpanded }))

    if (!isExpanded && !pickLists[orderId]) {
      setLoadingPickLists(prev => ({ ...prev, [orderId]: true }))
      try {
        const res = await apiGet<any>(`/mrp/demand/${orderId}/pick-list`)
        if (res.data?.components) {
          setPickLists(prev => ({ ...prev, [orderId]: res.data.components }))
        }
      } catch (error) {
        setPickLists(prev => ({ ...prev, [orderId]: [] }))
      } finally {
        setLoadingPickLists(prev => ({ ...prev, [orderId]: false }))
      }
    }
  }

  const handleGeneratePickList = async (orderId: string) => {
    setGeneratingPickLists(prev => ({ ...prev, [orderId]: true }))
    try {
      const res = await apiPost<any>(`/mrp/demand/${orderId}/pick-list`)
      toast.success('Success', { description: 'Warehouse picking list generated.' })
      if (res.data?.components) {
        setPickLists(prev => ({ ...prev, [orderId]: res.data.components }))
      } else {
        const getRes = await apiGet<any>(`/mrp/demand/${orderId}/pick-list`)
        setPickLists(prev => ({ ...prev, [orderId]: getRes.data?.components || [] }))
      }
    } catch (error) {
      toast.error('Generation Failed', { description: 'Could not generate pick list.' })
    } finally {
      setGeneratingPickLists(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  const kpiCards = [
    { label: 'Total Demand Orders', value: isMetricsLoading ? '...' : (metrics?.total_demand_orders ?? 0), color: 'text-white', accent: null },
    { label: 'Ready to Build', value: isMetricsLoading ? '...' : (metrics?.ready_to_build ?? 0), color: 'text-mrp-success', accent: 'border-l-4 border-l-mrp-success' },
    { label: 'Shortage / Partial', value: isMetricsLoading ? '...' : (metrics?.shortage_or_partial ?? 0), color: 'text-mrp-danger', accent: 'border-l-4 border-l-mrp-danger',
      badge: <span className="w-2 h-2 rounded-full bg-mrp-danger animate-pulse" /> },
    { label: 'Total Units Required', value: isMetricsLoading ? '...' : (metrics?.total_units_required?.toLocaleString() ?? 0), color: 'text-white', accent: null },
  ]

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Demand</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Production demand — how many units of each product need to be built and their component readiness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefreshAll}
            className="p-2 border border-mrp-border rounded-sm bg-mrp-panel text-mrp-text-secondary hover:text-white transition-colors"
          >
            <RefreshCw size={16} className={isLoading || isMetricsLoading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleTriggerPO}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm self-start md:self-auto"
          >
            <Plus size={16} /> Auto-Draft POs
          </button>
        </div>
      </div>

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

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder="Search by Order ID or Target Build..."
            className="w-full bg-mrp-app border border-mrp-border rounded-sm text-[13px] text-white placeholder:text-mrp-text-muted py-1.5 pl-9 pr-3 focus:outline-none focus:border-mrp-primary transition-colors"
          />
        </div>
        <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border">
          <SlidersHorizontal size={14} />
          Filter
        </button>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 w-10"></th>
                {['Demand ID', 'Target Build', 'Priority', 'Qty Required', 'Qty Ready', 'Status', 'Target Date', 'POs'].map((col) => (
                  <th key={col} className={`px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${['Qty Required', 'Qty Ready', 'POs'].includes(col) ? 'text-right' : ''}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[13px] text-mrp-text-muted">
                    <Loader2 className="animate-spin mx-auto mb-2 text-mrp-primary" size={24} />
                    Loading demand data...
                  </td>
                </tr>
              ) : demands.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[13px] text-mrp-text-muted">No demand records found.</td>
                </tr>
              ) : demands.map((demand) => {
                const isExpanded = !!expandedRows[demand.order_id]
                const uiStatus = formatStatus(demand.status)
                const uiPriority = formatPriority(demand.priority)
                
                const sCfg = statusConfig[uiStatus] || statusConfig['Planned']
                const pCfg = priorityConfig[uiPriority] || priorityConfig['Normal']
                
                const required = Number(demand.quantity) || 0
                const ready = Number(demand.qty_ready) || 0
                const readyPct = required > 0 ? Math.round((ready / required) * 100) : 0
                
                const pickListData = pickLists[demand.order_id]
                const isPickListLoading = loadingPickLists[demand.order_id]
                const isGenerating = generatingPickLists[demand.order_id]

                return (
                  <React.Fragment key={demand.order_id}>
                    <tr onClick={() => handleToggleRow(demand.order_id)} className="hover:bg-mrp-panel/60 transition-colors cursor-pointer group">
                      <td className="py-3 px-4 text-center text-mrp-text-muted group-hover:text-white transition-colors">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-mrp-primary font-bold whitespace-nowrap">
                        ORD-{demand.order_id.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-white font-medium">{demand.target_build || 'Unknown Model'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${pCfg.text}`}>
                          {uiPriority}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-white text-right whitespace-nowrap">
                        {required.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-[13px] text-white">{ready.toLocaleString()}</span>
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
                          {uiStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{demand.target_date}</td>
                      <td className="px-4 py-3 font-mono text-[13px] text-mrp-text-muted text-right">{demand.po_count || 0}</td>
                    </tr>
                    
                    {isExpanded && (
                      <tr className="bg-mrp-panel/30 border-b border-mrp-border">
                        <td colSpan={9} className="p-4 bg-mrp-app/40 relative">
                          <div className="border border-mrp-border/60 rounded-sm bg-mrp-panel/60 p-4 shadow-inner min-h-[100px]">
                            
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <Package size={14} className="text-mrp-primary" /> Warehouse Picking List
                              </h4>
                              {(!pickListData || pickListData.length === 0) && !isPickListLoading && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleGeneratePickList(demand.order_id) }} 
                                  disabled={isGenerating}
                                  className="px-3 py-1.5 bg-mrp-primary/20 border border-mrp-primary/50 text-mrp-primary text-[12px] font-medium rounded-sm hover:bg-mrp-primary hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                                  Generate Pick List
                                </button>
                              )}
                            </div>

                            {isPickListLoading ? (
                              <div className="absolute inset-0 flex items-center justify-center bg-mrp-panel/50 z-10 rounded-sm">
                                <Loader2 className="animate-spin text-mrp-primary" size={24} />
                              </div>
                            ) : pickListData && pickListData.length > 0 ? (
                              <div className="overflow-hidden border border-mrp-border rounded-sm">
                                <table className="w-full text-left text-[12px]">
                                  <thead className="bg-mrp-app border-b border-mrp-border text-mrp-text-muted font-bold uppercase tracking-wider text-[11px]">
                                    <tr>
                                      <th className="p-2.5">Component SKU</th>
                                      <th className="p-2.5 text-right">Quantity Required</th>
                                      <th className="p-2.5 text-right">Assigned Bin Location</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-mrp-border/60 font-mono">
                                    {pickListData.map((comp, idx) => (
                                      <tr key={idx} className="hover:bg-mrp-app/30 transition-colors">
                                        <td className="p-2.5 text-white">{comp.sku}</td>
                                        <td className="p-2.5 text-right text-white">{comp.quantity}</td>
                                        <td className="p-2.5 text-right">
                                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-bold ${comp.bin_location === 'UNASSIGNED' ? 'bg-mrp-danger/10 text-mrp-danger border border-mrp-danger/20' : 'bg-mrp-app border border-mrp-border text-mrp-text-secondary'}`}>
                                            {comp.bin_location}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-[12px] text-mrp-text-muted flex flex-col items-center gap-2">
                                <MapPin size={24} className="text-mrp-border" />
                                <span>No picking list generated for this order yet.</span>
                              </div>
                            )}

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

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Total {totalItems} Demand Orders
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select 
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[13px] text-mrp-text-muted px-2">Page {page} of {totalPages}</span>
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
    </div>
  )
}