'use client'

import { useState } from 'react'
import { Filter, ArrowUpDown, Download, RefreshCw, Plus, Minus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

type TransactionType = 'IN' | 'OUT' | 'ADJ'

interface InventoryTransaction {
  id: string
  sku: string
  type: TransactionType
  qtyChange: number
  runningBalance: number
  location: string
  timestamp: string
  operator: string
  reference: string
}

const typeConfig: Record<TransactionType, { bg: string; text: string; label: string }> = {
  IN: { bg: 'bg-mrp-success/10', text: 'text-mrp-success', label: 'Stock In' },
  OUT: { bg: 'bg-mrp-danger/10', text: 'text-mrp-danger', label: 'Stock Out' },
  ADJ: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', label: 'Adjustment' },
}

const mockTransactions: InventoryTransaction[] = [
  { id: 'TXN-4001', sku: 'CPU-I7-13650HX', type: 'OUT', qtyChange: -5, runningBalance: 0, location: 'WH-A / Shelf-03', timestamp: '2026-04-24 09:15', operator: 'J. Chen', reference: 'ORD-901' },
  { id: 'TXN-4002', sku: 'RAM-16G-DDR5', type: 'OUT', qtyChange: -6, runningBalance: 4, location: 'WH-A / Shelf-07', timestamp: '2026-04-24 09:16', operator: 'J. Chen', reference: 'ORD-901' },
  { id: 'TXN-4003', sku: 'CPU-I9-13900K', type: 'IN', qtyChange: 10, runningBalance: 15, location: 'WH-B / Shelf-01', timestamp: '2026-04-24 08:30', operator: 'M. Park', reference: 'PO-2024-088' },
  { id: 'TXN-4004', sku: 'GPU-RTX4080', type: 'IN', qtyChange: 5, runningBalance: 8, location: 'WH-B / Shelf-02', timestamp: '2026-04-24 08:22', operator: 'M. Park', reference: 'PO-2024-088' },
  { id: 'TXN-4005', sku: 'SSD-512G-NVME', type: 'ADJ', qtyChange: 3, runningBalance: 21, location: 'WH-A / Shelf-11', timestamp: '2026-04-23 17:45', operator: 'S. Lee', reference: 'ADJ-2024-012' },
  { id: 'TXN-4006', sku: 'RAM-8G-DDR4', type: 'OUT', qtyChange: -20, runningBalance: 30, location: 'WH-A / Shelf-06', timestamp: '2026-04-23 16:30', operator: 'J. Chen', reference: 'ORD-899' },
  { id: 'TXN-4007', sku: 'MB-Z790-WIFI', type: 'IN', qtyChange: 8, runningBalance: 12, location: 'WH-C / Shelf-01', timestamp: '2026-04-23 14:15', operator: 'A. Rivera', reference: 'PO-2024-085' },
  { id: 'TXN-4008', sku: 'PSU-1200W', type: 'ADJ', qtyChange: -1, runningBalance: 7, location: 'WH-C / Shelf-05', timestamp: '2026-04-23 11:00', operator: 'S. Lee', reference: 'ADJ-2024-011' },
  { id: 'TXN-4009', sku: 'CPU-XEON-W2400', type: 'IN', qtyChange: 4, runningBalance: 5, location: 'WH-B / Shelf-03', timestamp: '2026-04-23 09:50', operator: 'M. Park', reference: 'PO-2024-083' },
  { id: 'TXN-4010', sku: 'RAM-32G-ECC-DDR5', type: 'OUT', qtyChange: -8, runningBalance: 4, location: 'WH-B / Shelf-08', timestamp: '2026-04-22 16:20', operator: 'J. Chen', reference: 'ORD-897' },
]

export function InventoryLedgerPage() {
  const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const filteredTransactions = filterType === 'ALL'
    ? mockTransactions
    : mockTransactions.filter((t) => t.type === filterType)

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Inventory Ledger</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Stock transaction history and running balance tracking.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('Stock Adjustment Saved', { description: 'Inventory balance updated' })}
            className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Record Transaction
          </button>
          <button
            onClick={() => toast.success('Report Exported', { description: 'Inventory ledger CSV downloaded' })}
            className="px-4 py-2 border border-mrp-border text-white rounded-sm text-sm font-medium transition-colors hover:bg-mrp-border flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total SKUs', value: '47', color: 'text-white' },
          { label: 'Stock In (Today)', value: '+15', color: 'text-mrp-success' },
          { label: 'Stock Out (Today)', value: '-31', color: 'text-mrp-danger' },
          { label: 'Adjustments (Today)', value: '+2', color: 'text-mrp-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
            <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1">
              {stat.label}
            </div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Data Grid */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-3">
          <button
            onClick={() => toast.success('Filters applied', { description: 'Showing filtered results' })}
            className="flex items-center gap-2 px-3 py-1.5 border border-mrp-border rounded-sm bg-mrp-panel text-white text-[13px] hover:bg-mrp-border transition-colors"
          >
            <Filter size={14} />
            Filter
          </button>
          <div className="h-4 w-px bg-mrp-border"></div>
          <div className="flex gap-2">
            {(['ALL', 'IN', 'OUT', 'ADJ'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-colors ${
                  filterType === type
                    ? 'bg-mrp-primary text-white'
                    : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >
                {type === 'ALL' ? 'All' : type === 'IN' ? 'Stock In' : type === 'OUT' ? 'Stock Out' : 'Adjustments'}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => toast.success('Data Refreshed', { description: 'Latest transactions loaded' })}
              className="flex items-center gap-2 px-3 py-1.5 text-mrp-text-muted hover:text-white text-[13px] transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
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
                  <span className="flex items-center gap-1 cursor-pointer hover:text-white">TXN ID <ArrowUpDown size={12} /></span>
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">SKU</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Qty Change</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Balance</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Location</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filteredTransactions.map((txn) => {
                const cfg = typeConfig[txn.type]
                return (
                  <tr key={txn.id} className="hover:bg-mrp-panel transition-colors">
                    <td className="py-3 px-3 text-center">
                      <input
                        checked={selectedRows.has(txn.id)}
                        onChange={() => {
                          setSelectedRows((prev) => {
                            const next = new Set(prev)
                            if (next.has(txn.id)) next.delete(txn.id)
                            else next.add(txn.id)
                            return next
                          })
                        }}
                        className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                        type="checkbox"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{txn.id}</td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{txn.sku}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.text.replace('text-', 'border-') + '/20'} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        {txn.type === 'IN' ? <Plus size={10} /> : txn.type === 'OUT' ? <Minus size={10} /> : <RotateCcw size={10} />}
                        {cfg.label}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-mono text-[13px] text-right font-bold ${txn.qtyChange > 0 ? 'text-mrp-success' : txn.qtyChange < 0 ? 'text-mrp-danger' : 'text-mrp-text-muted'}`}>
                      {txn.qtyChange > 0 ? `+${txn.qtyChange}` : txn.qtyChange}
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{txn.runningBalance}</td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{txn.location}</td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-muted whitespace-nowrap">{txn.timestamp}</td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{txn.operator}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filteredTransactions.length} of {filteredTransactions.length} Transactions</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
