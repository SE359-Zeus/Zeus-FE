'use client'

import { useShortageSummary } from '../hooks/useShortageSummary'
import { Loader2, AlertCircle } from 'lucide-react'

export function ShortageSummaryView() {
  const { data: response, isLoading, isError } = useShortageSummary()
  const items = response?.data ?? []

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Shortage Summary</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Overview of component shortages and required quantities.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-left">STT</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-left">SKU</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">Req. Qty</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-left">Best Supplier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mrp-text-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading shortage summary...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mrp-danger">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    Failed to load shortage summary.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-mrp-text-muted">
                    No shortages found.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && items.map((item, idx) => (
                <tr key={`${item.sku}-${idx}`} className="hover:bg-mrp-border/30 transition-colors group">
                  <td className="py-3 px-4 text-[13px] text-mrp-text-muted font-mono">{item.stt}</td>
                  <td className="py-3 px-4 font-mono text-[13px] text-white whitespace-nowrap">
                    {item.sku}
                  </td>
                  <td className="py-3 px-4 font-mono text-[13px] text-mrp-danger text-right font-semibold">
                    {item.req_qty}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-white">
                    {item.best_supplier || <span className="text-mrp-text-muted italic">Not found</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
