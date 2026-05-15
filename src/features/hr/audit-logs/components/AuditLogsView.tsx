'use client'

import { useState } from 'react'
import {
  Filter, Download, RefreshCw, Search, ArrowUpDown,
  LogIn, LogOut, Pencil, Trash2, Plus, Settings, ShieldCheck, Eye,
} from 'lucide-react'
import { toast } from 'sonner'

type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'config'

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: AuditAction
  resource: string
  details: string
  ipAddress: string
}

const actionConfig: Record<AuditAction, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  login: { bg: 'bg-mrp-success/10', text: 'text-mrp-success', icon: LogIn, label: 'Login' },
  logout: { bg: 'bg-mrp-text-muted/10', text: 'text-mrp-text-muted', icon: LogOut, label: 'Logout' },
  create: { bg: 'bg-mrp-primary/10', text: 'text-mrp-primary', icon: Plus, label: 'Create' },
  update: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', icon: Pencil, label: 'Update' },
  delete: { bg: 'bg-mrp-danger/10', text: 'text-mrp-danger', icon: Trash2, label: 'Delete' },
  view: { bg: 'bg-mrp-text-muted/10', text: 'text-mrp-text-secondary', icon: Eye, label: 'View' },
  config: { bg: 'bg-mrp-primary/10', text: 'text-mrp-primary', icon: Settings, label: 'Config' },
}

const mockAuditEntries: AuditEntry[] = [
  { id: 'LOG-1001', timestamp: '2026-04-24 09:30:12', user: 'James Chen', action: 'login', resource: 'System', details: 'User authenticated via SSO', ipAddress: '10.0.1.45' },
  { id: 'LOG-1002', timestamp: '2026-04-24 09:31:05', user: 'James Chen', action: 'view', resource: 'Dashboard', details: 'Viewed Material Readiness Matrix', ipAddress: '10.0.1.45' },
  { id: 'LOG-1003', timestamp: '2026-04-24 09:15:44', user: 'James Chen', action: 'create', resource: 'Purchase Order', details: 'Created PO-2024-090 for Intel Corporation', ipAddress: '10.0.1.45' },
  { id: 'LOG-1004', timestamp: '2026-04-24 08:45:00', user: 'Maria Park', action: 'login', resource: 'System', details: 'User authenticated via SSO', ipAddress: '10.0.2.12' },
  { id: 'LOG-1005', timestamp: '2026-04-24 08:46:30', user: 'Maria Park', action: 'update', resource: 'Inventory', details: 'Stock count adjusted for SSD-512G-NVME (+3 units)', ipAddress: '10.0.2.12' },
  { id: 'LOG-1006', timestamp: '2026-04-23 17:45:22', user: 'Sarah Lee', action: 'update', resource: 'Inventory', details: 'Adjustment ADJ-2024-012 applied to SSD-512G-NVME', ipAddress: '10.0.3.88' },
  { id: 'LOG-1007', timestamp: '2026-04-23 16:30:10', user: 'James Chen', action: 'create', resource: 'Order', details: 'Created ORD-899 for Office Desktop Std', ipAddress: '10.0.1.45' },
  { id: 'LOG-1008', timestamp: '2026-04-23 14:15:00', user: 'Alex Rivera', action: 'view', resource: 'BOM Catalog', details: 'Viewed component CPU-I7-13650HX details', ipAddress: '10.0.4.23' },
  { id: 'LOG-1009', timestamp: '2026-04-23 11:00:45', user: 'Sarah Lee', action: 'update', resource: 'Inventory', details: 'Adjustment ADJ-2024-011 applied to PSU-1200W', ipAddress: '10.0.3.88' },
  { id: 'LOG-1010', timestamp: '2026-04-23 09:50:33', user: 'Maria Park', action: 'create', resource: 'Purchase Order', details: 'Created PO-2024-083 for Intel Corporation', ipAddress: '10.0.2.12' },
  { id: 'LOG-1011', timestamp: '2026-04-22 17:00:00', user: 'James Chen', action: 'config', resource: 'System Settings', details: 'Updated notification preferences for low-stock alerts', ipAddress: '10.0.1.45' },
  { id: 'LOG-1012', timestamp: '2026-04-22 16:20:15', user: 'James Chen', action: 'delete', resource: 'Purchase Order', details: 'Cancelled PO-2024-079 (duplicate order)', ipAddress: '10.0.1.45' },
  { id: 'LOG-1013', timestamp: '2026-04-22 15:45:00', user: 'Emily Watson', action: 'login', resource: 'System', details: 'User authenticated via SSO', ipAddress: '10.0.5.67' },
  { id: 'LOG-1014', timestamp: '2026-04-22 15:30:00', user: 'Carlos Mendez', action: 'login', resource: 'System', details: 'Failed authentication attempt (account suspended)', ipAddress: '192.168.1.100' },
  { id: 'LOG-1015', timestamp: '2026-04-22 14:10:22', user: 'Alex Rivera', action: 'update', resource: 'User Access', details: 'Changed role for Carlos Mendez from planner to viewer', ipAddress: '10.0.4.23' },
]

export function AuditLogsView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState<AuditAction | 'ALL'>('ALL')
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  const filteredEntries = mockAuditEntries.filter((entry) => {
    const matchesSearch = searchQuery === '' ||
      entry.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAction = filterAction === 'ALL' || entry.action === filterAction
    return matchesSearch && matchesAction
  })

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Audit Logs</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Complete activity trail and compliance record for all platform operations.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsAutoRefresh(!isAutoRefresh)
              toast.success(isAutoRefresh ? 'Auto-refresh Disabled' : 'Auto-refresh Enabled', { description: 'Log stream settings updated' })
            }}
            className={`px-4 py-2 border rounded-sm text-sm font-medium transition-colors flex items-center gap-2 ${
              isAutoRefresh
                ? 'border-mrp-success/20 bg-mrp-success/10 text-mrp-success hover:bg-mrp-success/20'
                : 'border-mrp-border text-mrp-text-muted hover:bg-mrp-border hover:text-white'
            }`}
          >
            <RefreshCw size={16} className={isAutoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            {isAutoRefresh ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={() => toast.success('Audit Report Exported', { description: 'Full audit log CSV downloaded' })}
            className="px-4 py-2 border border-mrp-border text-white rounded-sm text-sm font-medium transition-colors hover:bg-mrp-border flex items-center gap-2"
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Events Today', value: '5', color: 'text-white' },
          { label: 'Logins Today', value: '3', color: 'text-mrp-success' },
          { label: 'Modifications', value: '7', color: 'text-mrp-warning' },
          { label: 'Security Events', value: '1', color: 'text-mrp-danger' },
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
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-4 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted h-8 transition-colors w-[280px]"
              placeholder="Search logs by user, resource, or detail..."
              type="text"
            />
          </div>
          <div className="h-4 w-px bg-mrp-border"></div>
          <div className="flex gap-1 flex-wrap">
            {(['ALL', 'login', 'create', 'update', 'delete', 'view', 'config'] as const).map((action) => {
              const cfg = actionConfig[action as AuditAction]
              return (
                <button
                  key={action}
                  onClick={() => setFilterAction(action)}
                  className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-colors flex items-center gap-1 ${
                    filterAction === action
                      ? 'bg-mrp-primary text-white'
                      : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                  }`}
                >
                  {action === 'ALL' ? 'All Actions' : (
                    <>
                      {cfg && <cfg.icon size={10} />}
                      {cfg?.label || action}
                    </>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-white">Timestamp <ArrowUpDown size={12} /></span>
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">User</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Action</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Resource</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider min-w-[300px]">Details</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filteredEntries.map((entry) => {
                const cfg = actionConfig[entry.action]
                const ActionIcon = cfg.icon
                return (
                  <tr key={entry.id} className="hover:bg-mrp-panel transition-colors">
                    <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">{entry.timestamp}</td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">{entry.user}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 ${cfg.bg} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <ActionIcon size={10} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{entry.resource}</td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{entry.details}</td>
                    <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">{entry.ipAddress}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filteredEntries.length} of {filteredEntries.length} Entries</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>15</option>
                <option>25</option>
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
          </div>
        </div>
      </div>
    </>
  )
}
