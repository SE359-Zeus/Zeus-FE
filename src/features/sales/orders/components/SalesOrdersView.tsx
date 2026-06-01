'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, Filter, Calendar, X, Lock, Unlock, 
  MapPin, Package, ShoppingCart, DollarSign, CheckCircle, Factory, Loader2, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPatch } from '@/lib/axios.client'

interface LineItem { sku: string; requestedQty: number; unitPrice: number }
interface OrderModel {
  orderId: string;
  clientId: string
  clientName: string
  requiredDate: string
  totalValue: number
  status: 'PENDING' | 'PROCESSING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  locked: boolean
  destinationAddress: string
  items?: LineItem[]
}
interface MetricsModel {
  total_pending: number
  active_processing_value: number
  completed_24h: number
}

const statusConfig: Record<string, any> = {
  PENDING: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', label: 'Pending' },
  PROCESSING: { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', label: 'Processing' },
  DELIVERING: { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', label: 'Delivering' },
  COMPLETED: { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', label: 'Completed' },
  CANCELLED: { bg: 'bg-mrp-danger/10', border: 'border-mrp-danger/20', text: 'text-mrp-danger', label: 'Cancelled' },
}

export function SalesOrdersView() {
  const [metrics, setMetrics] = useState<any>({ total_pending: 0, active_processing_value: 0, completed_24h: 0 })
  const [orders, setOrders] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  
  const [filterState, setFilterState] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [totalItems, setTotalItems] = useState(0)

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, pageSize: perPage } 
      if (filterState !== 'ALL') params.states = filterState
      if (searchQuery.trim() !== '') params.search = searchQuery

      const [metricsRes, ordersRes] = await Promise.all([
        apiGet<any>('/sales/metrics'),
        apiGet<any>('/sales/orders', { params })
      ])
      
      if (metricsRes.data) setMetrics(metricsRes.data)
      
      const dataList = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || [])
      setOrders(dataList)
      setTotalItems(ordersRes.metadata?.total || ordersRes.data?.metadata?.total || dataList.length)
    } catch (error) {
      toast.error('Failed to load data', { description: 'Unable to connect to the server.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchDashboardData() }, [filterState, page, perPage])

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1)
      fetchDashboardData()
    }
  }

  const handleSelectOrder = async (order: OrderModel) => {
    setSelectedOrder(order)
    setIsDetailLoading(true)
    try {
      const res = await apiGet<any>(`/sales/orders/${order.orderId}`)
      if (res.data) {
        setSelectedOrder({ 
          ...order,
          ...res.data.order,
          items: res.data.items 
        })
      }
    } catch (error) {
      toast.error('Failed to load order details', { description: 'Unable to connect to the server.' })
    } finally {
      setIsDetailLoading(false)
    }
  }

  const handleReserve = async (id: string) => {
    try {
      await apiPost(`/sales/orders/${id}`)
      toast.success('Atomic RESERVE Triggered', { description: 'Inventory soft-locked in MRP.' })
      setSelectedOrder(null)
      fetchDashboardData()
    } catch (error) {
      toast.error('Reserve Failed', { description: 'Unable to connect to the server.' })
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await apiPost(`/sales/orders/${id}/cancel`)
      toast.success('Order Cancelled', { description: 'The order has been cancelled successfully.' })
      setSelectedOrder(null)
      fetchDashboardData()
    } catch (error) {
      toast.error('Action denied', { description: 'Unable to connect to the server.' })
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0)

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Sales Orders</h1>
        <p className="text-sm text-mrp-text-secondary mt-1">Monitor inbound client demand, track lifecycle states, and resolve concurrency locks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Total Pending Orders</span>
            <ShoppingCart size={14} className="text-gray-400" />
          </div>
          <span className="font-mono font-bold text-2xl text-white mt-3">{metrics.total_pending}</span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between border-l-4 border-l-mrp-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Active Processing Value</span>
            <DollarSign size={14} className="text-mrp-primary" />
          </div>
          <span className="font-mono font-bold text-2xl text-mrp-primary mt-3">{formatCurrency(metrics.active_processing_value)}</span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between border-l-4 border-l-mrp-success">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">24-Hour Completed</span>
            <CheckCircle size={14} className="text-mrp-success" />
          </div>
          <span className="font-mono font-bold text-2xl text-mrp-success mt-3">{metrics.completed_24h}</span>
        </div>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-4">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              placeholder="Search by ID or Name (Press Enter)..." 
              className="w-full bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-3 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted" 
            />
          </div>
          
          <div className="flex items-center border border-mrp-border bg-mrp-panel rounded-sm px-2 py-1.5">
            <Filter size={14} className="text-mrp-text-muted mr-2" />
            <select value={filterState} onChange={(e) => { setFilterState(e.target.value); setPage(1); }} className="bg-transparent text-[13px] text-white focus:outline-none cursor-pointer">
              <option value="ALL" className="bg-mrp-panel">All States</option>
              <option value="PENDING" className="bg-mrp-panel">Pending</option>
              <option value="PROCESSING" className="bg-mrp-panel">Processing</option>
              <option value="DELIVERING" className="bg-mrp-panel">Delivering</option>
              <option value="COMPLETED" className="bg-mrp-panel">Completed</option>
              <option value="CANCELLED" className="bg-mrp-panel">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-mrp-app/50 flex items-center justify-center z-20">
              <Loader2 className="animate-spin text-mrp-primary" size={24} />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Client Name</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Required Date</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Total Value</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {orders.length > 0 ? orders.map((order) => {
                const cfg = statusConfig[order.status] || statusConfig['PENDING']
                return (
                  <tr key={order.orderId} onClick={() => handleSelectOrder(order)} className="hover:bg-mrp-panel transition-colors cursor-pointer group">
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary group-hover:underline truncate max-w-[120px]">
                      ORD-{String(order.orderId).substring(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium">{order.clientName}</td>
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-secondary">{new Date(order.requiredDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{formatCurrency(order.totalValue)}</td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.text.replace('text-', 'bg-')}`} />
                        {cfg.label}
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={5} className="py-8 text-center text-mrp-text-muted text-[13px]">No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between shrink-0">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {totalItems === 0 ? 0 : (page - 1) * perPage + 1}–{(page - 1) * perPage + orders.length} of {totalItems} Entries
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

      {selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="fixed top-0 right-0 bottom-0 w-[550px] bg-mrp-panel border-l border-mrp-border z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="px-6 py-5 border-b border-mrp-border flex items-start justify-between bg-mrp-app/50 shrink-0">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white font-mono truncate">
                    ORD-{String(selectedOrder.orderId).substring(0, 6).toUpperCase()}
                  </h2>
                  <div className={`inline-flex shrink-0 items-center gap-1.5 ${statusConfig[selectedOrder.status]?.bg} border ${statusConfig[selectedOrder.status]?.border} ${statusConfig[selectedOrder.status]?.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                    {statusConfig[selectedOrder.status]?.label}
                  </div>
                </div>
                <p className="text-[13px] text-mrp-text-secondary truncate">{selectedOrder.clientName}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-mrp-text-muted hover:text-white transition-colors p-1 shrink-0"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
              {isDetailLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-mrp-panel/50 z-10">
                  <Loader2 className="animate-spin text-mrp-primary" size={32} />
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-sm border flex items-start gap-3 ${selectedOrder.locked ? 'bg-mrp-warning/10 border-mrp-warning/20' : 'bg-mrp-success/10 border-mrp-success/20'}`}>
                    {selectedOrder.locked ? <Lock size={18} className="text-mrp-warning shrink-0 mt-0.5" /> : <Unlock size={18} className="text-mrp-success shrink-0 mt-0.5" />}
                    <div>
                      <h4 className={`text-[13px] font-bold ${selectedOrder.locked ? 'text-mrp-warning' : 'text-mrp-success'}`}>
                        {selectedOrder.locked ? 'Allocation Lock Active' : 'Order Unlocked'}
                      </h4>
                      <p className="text-[12px] text-mrp-text-secondary mt-1">
                        {selectedOrder.locked ? 'The Orchestrator holds a read/write lock. External modifications are disabled.' : 'Full API modification is currently allowed.'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2 flex items-center gap-2"><MapPin size={14} /> Destination Address</h3>
                    <div className="bg-mrp-app border border-mrp-border p-3 rounded-sm text-[13px] text-white">
                      {selectedOrder.destinationAddress || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2 flex items-center gap-2"><Package size={14} /> Requested SKUs</h3>
                    <div className="border border-mrp-border rounded-sm overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-mrp-app border-b border-mrp-border">
                          <tr>
                            <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">SKU</th>
                            <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Qty</th>
                            <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Unit Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-mrp-border">
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx} className="hover:bg-mrp-app/50 transition-colors">
                              <td className="px-3 py-2 text-[13px] font-mono text-white">{item.sku}</td>
                              <td className="px-3 py-2 text-[13px] font-mono text-white text-right">{item.requestedQty}</td>
                              <td className="px-3 py-2 text-[13px] font-mono text-mrp-text-secondary text-right">{formatCurrency(item.unitPrice)}</td>
                            </tr>
                          ))}
                          {!selectedOrder.items && <tr><td colSpan={3} className="text-center py-4 text-mrp-text-muted text-xs">No items</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-mrp-border bg-mrp-app/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => handleCancel(selectedOrder.orderId)}
                disabled={selectedOrder.locked}
                className="px-4 py-2 border border-mrp-danger/40 text-mrp-danger text-[13px] font-medium rounded-sm hover:bg-mrp-danger hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
              
              {selectedOrder.status === 'PENDING' && (
                <button 
                  onClick={() => handleReserve(selectedOrder.orderId)}
                  className="px-4 py-2 bg-mrp-primary text-white text-[13px] font-medium rounded-sm hover:bg-mrp-primary-hover transition-colors flex items-center gap-2"
                >
                  <Package size={14} />
                  Reserve Inventory (MRP)
                </button>
              )}

              {selectedOrder.status === 'PROCESSING' && (
                <>
                  <button onClick={() => toast.warning('Force Allocation Executed')} className="px-4 py-2 border border-mrp-warning/40 text-mrp-warning text-[13px] font-medium rounded-sm hover:bg-mrp-warning hover:text-white transition-colors flex items-center gap-2">
                    Force Allocation
                  </button>
                  <button onClick={() => toast.success('Manufacturing Order Created')} className="px-4 py-2 bg-mrp-primary/20 text-mrp-primary border border-mrp-primary/50 text-[13px] font-medium rounded-sm hover:bg-mrp-primary hover:text-white transition-colors flex items-center gap-2">
                    <Factory size={14} /> Convert to MO
                  </button>
                  <button onClick={() => toast.success('Manifest Transmitted')} className="px-4 py-2 bg-mrp-success/20 text-mrp-success border border-mrp-success/50 text-[13px] font-medium rounded-sm hover:bg-mrp-success hover:text-white transition-colors flex items-center gap-2">
                    <ShoppingCart size={14} /> Dispatch Manifest
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}