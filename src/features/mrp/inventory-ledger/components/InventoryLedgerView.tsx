'use client'

import { useState } from 'react'
import { Download, RefreshCw, Plus, Minus, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

type TxnType = 'IN' | 'OUT' | 'ADJ'
type FilterType = 'ALL' | TxnType

interface Transaction {
  id: string; sku: string; type: TxnType; qtyChange: number
  runningBalance: number; location: string; timestamp: string
  operator: string; reference: string
}

const mockTransactions: Transaction[] = [
  { id: 'TXN-9001', sku: 'SOC-XM100-PRO',    type: 'OUT', qtyChange: -10, runningBalance: 15,  location: 'WH-A / Zone-C1', timestamp: '2026-05-06 14:15', operator: 'A. Jensen',  reference: 'ORD-101' },
  { id: 'TXN-9002', sku: 'RAM-64G-DDR5',     type: 'OUT', qtyChange: -20, runningBalance: 40,  location: 'WH-A / Zone-M2', timestamp: '2026-05-06 14:16', operator: 'A. Jensen',  reference: 'ORD-101' },
  { id: 'TXN-9003', sku: 'GPU-RTX5080-M',    type: 'IN',  qtyChange: 50,  runningBalance: 120, location: 'RECEIVING-02',  timestamp: '2026-05-06 09:30', operator: 'L. Zhang',   reference: 'PO-2024-112' },
  { id: 'TXN-9004', sku: 'BATT-LIPO-99W',    type: 'ADJ', qtyChange: -2,  runningBalance: 88,  location: 'WH-C / Safe-01', timestamp: '2026-05-05 17:45', operator: 'K. Smith',   reference: 'CYCLE-COUNT' },
  { id: 'TXN-9005', sku: 'SSD-2T-NVME',      type: 'IN',  qtyChange: 100, runningBalance: 250, location: 'RECEIVING-01',  timestamp: '2026-05-05 11:20', operator: 'L. Zhang',   reference: 'PO-2024-108' },
  { id: 'TXN-9006', sku: 'MOD-WIFI7-AX',     type: 'OUT', qtyChange: -5,  runningBalance: 45,  location: 'WH-B / Shelf-04', timestamp: '2026-05-05 10:15', operator: 'A. Jensen',  reference: 'ORD-098' },
  { id: 'TXN-9007', sku: 'PSU-GAN-240W',     type: 'IN',  qtyChange: 30,  runningBalance: 75,  location: 'RECEIVING-02',  timestamp: '2026-05-04 15:50', operator: 'L. Zhang',   reference: 'PO-2024-105' },
]

const typeConfig: Record<TxnType, { bg: string; text: string; border: string; label: string; Icon: React.ElementType }> = {
  IN:  { bg: 'bg-mrp-success/10', text: 'text-mrp-success', border: 'border-mrp-success/20', label: 'Stock In',    Icon: Plus },
  OUT: { bg: 'bg-mrp-danger/10',  text: 'text-mrp-danger',  border: 'border-mrp-danger/20',  label: 'Stock Out',   Icon: Minus },
  ADJ: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', border: 'border-mrp-warning/20', label: 'Adjustment',  Icon: RotateCcw },
}

const kpiStats = [
  { label: 'Active SKUs',         value: '154',   color: 'text-white' },
  { label: 'Stock Accuracy',      value: '99.2%', color: 'text-mrp-success' },
  { label: 'Inventory Turnover',  value: '12.4x', color: 'text-mrp-primary' },
  { label: 'Cycle Count Gaps',    value: '3',     color: 'text-mrp-warning' },
]

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'IN',  label: 'Stock In' },
  { key: 'OUT', label: 'Stock Out' },
  { key: 'ADJ', label: 'Adjustments' },
]

function exportCSV(rows: Transaction[]) {
  const headers = ['TXN ID', 'SKU', 'Type', 'Qty Change', 'Balance', 'Location', 'Timestamp', 'Operator', 'Reference']
  const csvRows = [
    headers.join(','),
    ...rows.map((r) =>
      [r.id, r.sku, r.type, r.qtyChange, r.runningBalance, r.location, r.timestamp, r.operator, r.reference]
        .map((v) => `"${v}"`).join(',')
    ),
  ]
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inventory-ledger-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function InventoryLedgerView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

  const filtered = filter === 'ALL' ? mockTransactions : mockTransactions.filter((t) => t.type === filter)

  const toggleRow = (id: string) =>
    setSelectedRows((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const toggleAll = (checked: boolean) =>
    setSelectedRows(checked ? new Set(filtered.map((t) => t.id)) : new Set())

  const handleExport = () => {
    const toExport = selectedRows.size > 0 ? filtered.filter((t) => selectedRows.has(t.id)) : filtered
    exportCSV(toExport)
    toast.success('CSV Exported', { description: `${toExport.length} transactions downloaded` })
  }

  return (
    <>
      {/* Page Header */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {kpiStats.map((s) => (
          <div key={s.label} className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">{s.label}</span>
            <span className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">

        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
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
            onClick={() => toast.success('Data Refreshed', { description: 'Latest transactions loaded' })}
            className="flex items-center gap-2 text-mrp-text-muted hover:text-white transition-colors text-[13px]"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                    onChange={(e) => toggleAll(e.target.checked)}
                    checked={filtered.length > 0 && filtered.every((t) => selectedRows.has(t.id))}
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
              {filtered.map((txn) => {
                const cfg = typeConfig[txn.type]
                const Icon = cfg.Icon
                return (
                  <tr key={txn.id} className="hover:bg-mrp-panel transition-colors">
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(txn.id)}
                        onChange={() => toggleRow(txn.id)}
                        className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{txn.id}</td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">{txn.sku}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm ${cfg.bg} ${cfg.text} border ${cfg.border} text-[10px] font-bold uppercase tracking-wider`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-mono text-[13px] font-bold text-right ${txn.qtyChange > 0 ? 'text-mrp-success' : txn.qtyChange < 0 ? 'text-mrp-danger' : 'text-mrp-text-muted'}`}>
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">
            Showing 1-{filtered.length} of {filtered.length} Transactions
            {selectedRows.size > 0 && (
              <span className="ml-2 text-mrp-primary font-medium">· {selectedRows.size} selected</span>
            )}
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
