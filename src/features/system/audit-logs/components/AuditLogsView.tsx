'use client'

import { useState, useEffect } from 'react'
import {
  Filter, Download, RefreshCw, Search, ArrowUpDown,
  LogIn, Pencil, Trash2, Plus, Settings, ShieldCheck,
  AlertTriangle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useAuditLogs, useAuditMetrics } from '@/features/system/audit-logs/hooks/useAudit'
import type { AuditActionType, AuditLog } from '@/lib/types/api.types'
import { PaginationBar } from '@/components/ui/PaginationBar'

// ---------------------------------------------------------------------------
// Action Config
// ---------------------------------------------------------------------------

type ActionConfig = { bg: string; text: string; icon: React.ElementType; label: string }

const actionConfig: Record<AuditActionType, ActionConfig> = {
  LOGIN:    { bg: 'bg-mrp-success/10',      text: 'text-mrp-success',       icon: LogIn,      label: 'Login'    },
  CREATE:   { bg: 'bg-mrp-primary/10',      text: 'text-mrp-primary',       icon: Plus,       label: 'Create'   },
  UPDATE:   { bg: 'bg-mrp-warning/10',      text: 'text-mrp-warning',       icon: Pencil,     label: 'Update'   },
  DELETE:   { bg: 'bg-mrp-danger/10',       text: 'text-mrp-danger',        icon: Trash2,     label: 'Delete'   },
  SECURITY: { bg: 'bg-red-500/10',          text: 'text-red-400',           icon: ShieldCheck, label: 'Security' },
}

// ---------------------------------------------------------------------------
// Skeleton Row
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-4 bg-mrp-border/40 rounded" style={{ width: `${60 + (i * 7) % 30}%` }} />
        </td>
      ))}
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

interface MetricCardProps {
  label: string
  value: number | string
  color: string
  isLoading?: boolean
}

function MetricCard({ label, value, color, isLoading }: MetricCardProps) {
  return (
    <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
      <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1">{label}</div>
      {isLoading
        ? <div className="h-8 w-16 bg-mrp-border/40 rounded animate-pulse mt-1" />
        : <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

type FilterType = AuditActionType | 'ALL'

export function AuditLogsView() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(15)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<FilterType>('ALL')
  const [sortDesc, setSortDesc] = useState(true)
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')

  // Reset page when filter action or date range changes
  useEffect(() => {
    setPage(1)
  }, [filterAction, startDateInput, endDateInput])

  // Helper to format date strings to RFC 3339 strings safely
  const getRFC3339Date = (dateStr: string, isEnd = false) => {
    if (!dateStr) return undefined
    try {
      const date = new Date(isEnd ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`)
      if (isNaN(date.getTime())) return undefined
      return date.toISOString()
    } catch {
      return undefined
    }
  }

  // Build API filter
  const apiFilter = {
    page,
    limit,
    ...(filterAction !== 'ALL' ? { action_type: filterAction } : {}),
    ...(startDateInput ? { start_date: getRFC3339Date(startDateInput) } : {}),
    ...(endDateInput ? { end_date: getRFC3339Date(endDateInput, true) } : {}),
  }

  const {
    data: logsData,
    isLoading: logsLoading,
    isError: logsError,
    isFetching,
    refetch,
  } = useAuditLogs(apiFilter, { refetchInterval: 30_000 })

  const {
    data: metricsData,
    isLoading: metricsLoading,
  } = useAuditMetrics()

  const logs: AuditLog[] = logsData?.data?.items ?? []
  const pagination = logsData?.metadata?.pagination
  const metrics = metricsData?.data

  // Client-side search filter (on current page data)
  const filtered = searchQuery
    ? logs.filter(e =>
        e.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.target_resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.details?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs

  // Client-side sort toggle
  const sorted = sortDesc ? filtered : [...filtered].reverse()

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('No data to export')
      return
    }
    const header = 'Timestamp,User Email,Action,Resource,Details,IP Address,Security Event\n'
    const rows = filtered.map(e =>
      [
        e.timestamp,
        e.user_email,
        e.action_type,
        e.target_resource,
        `"${(e.details ?? '').replace(/"/g, '""')}"`,
        e.ip_address ?? '',
        e.is_security_event ? 'Yes' : 'No',
      ].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zeus-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit Report Exported', { description: `${filtered.length} entries downloaded as CSV.` })
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Audit Logs</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Complete activity trail and compliance record for all platform operations.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className={`px-4 py-2 border rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
              isFetching
                ? 'border-mrp-success/20 bg-mrp-success/10 text-mrp-success'
                : 'border-mrp-border text-mrp-text-muted hover:bg-mrp-border hover:text-white'
            }`}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} style={{ animationDuration: '1.5s' }} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-mrp-border text-white rounded-sm text-sm font-medium transition-colors hover:bg-mrp-border flex items-center gap-2"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Events"
          value={pagination?.total_rows ?? 0}
          color="text-white"
          isLoading={logsLoading}
        />
        <MetricCard
          label="Logins Today"
          value={metrics?.logins_today ?? 0}
          color="text-mrp-success"
          isLoading={metricsLoading}
        />
        <MetricCard
          label="Modification Rate"
          value={metrics?.modification_velocity ?? 0}
          color="text-mrp-warning"
          isLoading={metricsLoading}
        />
        <MetricCard
          label="Security Events"
          value={metrics?.security_events ?? 0}
          color="text-mrp-danger"
          isLoading={metricsLoading}
        />
      </div>

      {/* Data Grid */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-4 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted h-8 transition-colors w-[260px]"
              placeholder="Search by user, resource, detail..."
            />
          </div>

          <div className="h-4 w-px bg-mrp-border" />

          {/* Action filter pills */}
          <div className="flex gap-1.5 flex-wrap items-center">
            <Filter size={13} className="text-mrp-text-muted" />
            {(['ALL', 'LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'SECURITY'] as FilterType[]).map(action => {
              const cfg = action !== 'ALL' ? actionConfig[action as AuditActionType] : null
              return (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                    filterAction === action
                      ? 'bg-mrp-primary text-white'
                      : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                  }`}
                >
                  {cfg ? <cfg.icon size={10} /> : null}
                  {action === 'ALL' ? 'All' : cfg?.label}
                </button>
              )
            })}
          </div>

          <div className="h-4 w-px bg-mrp-border" />

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={startDateInput}
              onChange={e => setStartDateInput(e.target.value)}
              className="bg-mrp-panel border border-mrp-border rounded-sm text-[12px] px-2.5 py-1 focus:outline-none focus:border-mrp-primary text-white h-8 transition-colors cursor-pointer scheme-dark"
            />
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={endDateInput}
              onChange={e => setEndDateInput(e.target.value)}
              className="bg-mrp-panel border border-mrp-border rounded-sm text-[12px] px-2.5 py-1 focus:outline-none focus:border-mrp-primary text-white h-8 transition-colors cursor-pointer scheme-dark"
            />
            {(startDateInput || endDateInput) && (
              <button
                type="button"
                onClick={() => {
                  setStartDateInput('')
                  setEndDateInput('')
                }}
                className="text-[11px] font-bold text-mrp-danger hover:text-red-400 uppercase tracking-wider ml-1 transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Loading indicator */}
          {isFetching && (
            <div className="ml-auto flex items-center gap-1.5 text-mrp-text-muted text-[11px]">
              <Loader2 size={12} className="animate-spin" />
              Syncing...
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  <button
                    onClick={() => setSortDesc(!sortDesc)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Timestamp <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Action</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Resource</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider min-w-[300px]">Details</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">IP Address</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {/* Skeleton */}
              {logsLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

              {/* Error */}
              {logsError && !logsLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-mrp-danger">
                      <AlertTriangle size={24} />
                      <p className="text-sm">Failed to load audit logs.</p>
                      <button onClick={() => refetch()} className="text-mrp-primary text-sm underline">
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty */}
              {!logsLoading && !logsError && sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-mrp-text-muted text-sm">
                    {searchQuery
                      ? `No entries match "${searchQuery}".`
                      : 'No audit log entries found for the selected filter.'
                    }
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!logsLoading && sorted.map(entry => {
                const cfg = actionConfig[entry.action_type]
                const ActionIcon = cfg.icon
                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-mrp-panel transition-colors ${entry.is_security_event ? 'border-l-2 border-l-red-500/50' : ''}`}
                  >
                    <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">
                      {format(new Date(entry.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">
                      {entry.user_email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <ActionIcon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">
                      {entry.target_resource}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">
                      {entry.details ?? '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">
                      {entry.ip_address ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer — always visible */}
        <PaginationBar
          itemLabel="Entries"
          page={page}
          limit={limit}
          totalRows={pagination?.total_rows ?? 0}
          totalPages={pagination?.total_pages ?? 1}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </>
  )
}
