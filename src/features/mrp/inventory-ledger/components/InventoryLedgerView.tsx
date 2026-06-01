'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Plus, Minus, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet } from '@/lib/axios.client'

type TxnType = 'IN' | 'OUT' | 'ADJ'
type FilterType = 'ALL' | TxnType

interface Transaction {
  id: string
  sku: string
  type: TxnType
  qty_change: number
  running_balance: number
  location: string
  timestamp: string
  operator: string
  reference: string
}

interface InventoryMetrics {
  active_skus: number | string
  stock_accuracy: string
  inventory_turnover: string
  cycle_count_gaps: number | string
}

const typeConfig: Record<TxnType, { bg: string; text: string; border: string; label: string; Icon: React.ElementType }> = {
  IN:  { bg: 'bg-mrp-success/10', text: 'text-mrp-success', border: 'border-mrp-success/20', label: 'Stock In',    Icon: Plus },
  OUT: { bg: 'bg-mrp-danger/10',  text: 'text-mrp-danger',  border: 'border-mrp-danger/20',  label: 'Stock Out',   Icon: Minus },
  ADJ: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', border: 'border-mrp-warning/20', label: 'Adjustment',  Icon: RotateCcw },
}

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'IN',  label: 'Stock In' },
  { key: 'OUT', label: 'Stock Out' },
  { key: 'ADJ', label: 'Adjustments' },
]

export function InventoryLedgerView() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [metrics, setMetrics] = useState<InventoryMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMetricsLoading, setIsMetricsLoading] = useState(true)
  
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [totalItems, setTotalItems] = useState(0)

  const fetchMetrics = async () => {
    setIsMetricsLoading(true)
    try {
      const res = await apiGet<any>('/mrp/inventory/metrics')
      if (res.data) setMetrics(res.data)
    } catch (error) {
      toast.error('Metrics Error', { description: 'Cannot load inventory metrics.' })
    } finally {
      setIsMetricsLoading(false)
    }
  }

  const fetchLedgerData = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, per_page: perPage }
      if (filter !== 'ALL') params.type = filter

      const res = await apiGet<any>('/mrp/inventory/ledger', { params })
      
      const dataList = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setTransactions(dataList)
      
      const total = res.metadata?.total || res.data?.metadata?.total || dataList.length
      setTotalItems(total)
      
      setSelectedRows(new Set())
    } catch (error) {
      toast.error('Sync Error', { description: 'Cannot load ledger data.' })
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshAll = () => {
    fetchMetrics()
    fetchLedgerData()
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchLedgerData()
  }, [filter, page, perPage])

  const toggleRow = (id: string) =>
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleAll = (checked: boolean) =>
    setSelectedRows(checked ? new Set(transactions.map((t) => t.id)) : new Set())

  const handleExport = async () => {
    try {
      const params: any = selectedRows.size > 0 ? { ids: Array.from(selectedRows).join(',') } : {}
      if (filter !== 'ALL' && selectedRows.size === 0) params.type = filter

      const response = await apiGet('/mrp/inventory/ledger/export', { 
        params, 
        responseType: 'blob' 
      })
      const fileData = response.data !== undefined ? response.data : response;
      
      const blob = new Blob([fileData as any], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `inventory-ledger-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV Exported', { description: 'Export completed successfully.' })
    } catch (error) {
      toast.error('Export Failed', { description: 'Could not download the CSV file.' })
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Inventory Ledger</h1>
          <p className="text-sm text-mrp-text-muted mt-1">Stock transaction history and running balance tracking.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-mrp-border bg-transparent text-white rounded-sm hover:bg-mrp-panel transition-colors text-sm font-medium"
        >
          <Download size={16} /> Export CSV
          {selectedRows.size > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-mrp-primary text-white text-[10px] font-bold rounded-sm">
              {selectedRows.size}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">Active SKUs</span>
          <span className="font-mono text-2xl font-bold text-white">
            {isMetricsLoading ? '...' : metrics?.active_skus || 0}
          </span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">Stock Accuracy</span>
          <span className="font-mono text-2xl font-bold text-mrp-success">
            {isMetricsLoading ? '...' : metrics?.stock_accuracy || '0%'}
          </span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">Inventory Turnover</span>
          <span className="font-mono text-2xl font-bold text-mrp-primary">
            {isMetricsLoading ? '...' : metrics?.inventory_turnover || '0x'}
          </span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">Cycle Count Gaps</span>
          <span className="font-mono text-2xl font-bold text-mrp-warning">
            {isMetricsLoading ? '...' : metrics?.cycle_count_gaps || 0}
          </span>
        </div>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilter(key); setPage(1); }}
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
                  filter === key
                    ? 'bg-mrp-primary text-white'
                    : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefreshAll}
            className="flex items-center gap-2 text-mrp-text-muted hover:text-white transition-colors text-[13px]"
          >
            <RefreshCw size={14} className={isLoading || isMetricsLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5 cursor-pointer"
                    onChange={(e) => toggleAll(e.target.checked)}
                    checked={transactions.length > 0 && transactions.every((t) => selectedRows.has(t.id))}
                  />
                </th>
                {['TXN ID', 'SKU', 'Type', 'Qty Change', 'Balance', 'Location', 'Timestamp', 'Operator'].map((col) => (
                  <th key={col} className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
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
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[13px] text-mrp-text-muted">No transactions found for the selected filter.</td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const cfg = typeConfig[txn.type] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: txn.type || 'UNKNOWN', Icon: Minus }
                  const Icon = cfg.Icon
                  const qtyChange = Number(txn.qty_change) || 0
                  
                  return (
                    <tr key={txn.id} className="hover:bg-mrp-panel transition-colors">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(txn.id)}
                          onChange={() => toggleRow(txn.id)}
                          className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">
                        TXN-{String(txn.id).substring(0, 6).toUpperCase()}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{txn.sku}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${cfg.bg} ${cfg.text} border ${cfg.border} text-[10px] font-bold uppercase tracking-wider`}>
                          <Icon size={10} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`py-3 px-4 font-mono text-[13px] font-bold text-right ${qtyChange > 0 ? 'text-mrp-success' : qtyChange < 0 ? 'text-mrp-danger' : 'text-mrp-text-muted'}`}>
                        {qtyChange > 0 ? `+${qtyChange}` : qtyChange}
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{txn.running_balance}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{txn.location}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-muted whitespace-nowrap">
                        {new Date(txn.timestamp).toLocaleString('en-EN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{txn.operator}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between shrink-0">
          <span className="text-[13px] text-mrp-text-muted">
            Showing {totalItems === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)} of {totalItems} Entries
            {selectedRows.size > 0 && <span className="ml-2 text-mrp-primary font-medium">· {selectedRows.size} selected</span>}
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
    </>
  )
}