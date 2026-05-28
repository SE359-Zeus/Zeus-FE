'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
  /** Label for the items being paginated (e.g. "Users", "Events") */
  itemLabel?: string
  page: number
  limit: number
  totalRows: number
  totalPages: number
  isFetching?: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  rowsPerPageOptions?: number[]
}

const DEFAULT_OPTIONS = [3, 5, 10, 15, 25, 50, 100]

/**
 * Compact pagination footer matching the design:
 *   Showing X–Y of Z Items  |  Rows per page: [10 ▼]  |  Page [1 ▼] of N  |  < >
 */
export function PaginationBar({
  itemLabel = 'Items',
  page,
  limit,
  totalRows,
  totalPages,
  isFetching = false,
  onPageChange,
  onLimitChange,
  rowsPerPageOptions = DEFAULT_OPTIONS,
}: PaginationBarProps) {
  const from = totalRows === 0 ? 0 : (page - 1) * limit + 1
  const to   = Math.min(page * limit, totalRows)

  const selectClass =
    'bg-mrp-app border border-mrp-border text-white text-[12px] rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-mrp-primary transition-colors cursor-pointer appearance-none pr-5 relative'

  return (
    <div className="px-4 py-2.5 border-t border-mrp-border bg-mrp-panel flex items-center justify-between shrink-0 gap-4 flex-wrap">
      {/* Left: showing info */}
      <span className="text-[12px] text-mrp-text-muted whitespace-nowrap">
        {totalRows === 0
          ? `No ${itemLabel}`
          : `Showing ${from}–${to} of ${totalRows} ${itemLabel}`
        }
      </span>

      {/* Right: controls */}
      <div className="flex items-center gap-4">
        {/* Rows per page */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-mrp-text-muted whitespace-nowrap">Rows per page:</span>
          <div className="relative">
            <select
              id="pagination-rows-per-page"
              value={limit}
              onChange={e => {
                onLimitChange(Number(e.target.value))
                onPageChange(1)
              }}
              disabled={isFetching}
              className={selectClass}
            >
              {rowsPerPageOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-mrp-text-muted">
              <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
                <path d="M0 0l4 5 4-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="w-px h-4 bg-mrp-border" />

        {/* Page selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-mrp-text-muted">Page</span>
          <div className="relative">
            <select
              id="pagination-page-select"
              value={page}
              onChange={e => onPageChange(Number(e.target.value))}
              disabled={isFetching || totalPages <= 1}
              className={selectClass}
            >
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-mrp-text-muted">
              <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor">
                <path d="M0 0l4 5 4-5z" />
              </svg>
            </div>
          </div>
          <span className="text-[12px] text-mrp-text-muted whitespace-nowrap">of {totalPages || 1}</span>
        </div>

        <div className="w-px h-4 bg-mrp-border" />

        {/* Prev / Next */}
        <div className="flex items-center gap-1">
          <button
            id="pagination-prev"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1 || isFetching}
            className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            id="pagination-next"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || isFetching}
            className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
