'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Shield, ShieldCheck, Eye, Filter, Search } from 'lucide-react'
import { toast } from 'sonner'

type UserRole = 'admin' | 'planner' | 'viewer'
type UserStatus = 'active' | 'inactive' | 'suspended'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  lastActive: string
  status: UserStatus
  department: string
}

const roleConfig: Record<UserRole, { bg: string; text: string; icon: React.ElementType }> = {
  admin: { bg: 'bg-mrp-primary/10', text: 'text-mrp-primary', icon: ShieldCheck },
  planner: { bg: 'bg-mrp-warning/10', text: 'text-mrp-warning', icon: Shield },
  viewer: { bg: 'bg-mrp-text-muted/10', text: 'text-mrp-text-muted', icon: Eye },
}

const statusConfig: Record<UserStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-mrp-success/10', text: 'text-mrp-success', label: 'Active' },
  inactive: { bg: 'bg-mrp-text-muted/10', text: 'text-mrp-text-muted', label: 'Inactive' },
  suspended: { bg: 'bg-mrp-danger/10', text: 'text-mrp-danger', label: 'Suspended' },
}

const mockUsers: User[] = [
  { id: 'USR-001', name: 'James Chen', email: 'j.chen@mrp-orch.com', role: 'admin', lastActive: '2026-04-24 09:30', status: 'active', department: 'Operations' },
  { id: 'USR-002', name: 'Maria Park', email: 'm.park@mrp-orch.com', role: 'planner', lastActive: '2026-04-24 08:45', status: 'active', department: 'Supply Chain' },
  { id: 'USR-003', name: 'Sarah Lee', email: 's.lee@mrp-orch.com', role: 'planner', lastActive: '2026-04-23 17:20', status: 'active', department: 'Inventory' },
  { id: 'USR-004', name: 'Alex Rivera', email: 'a.rivera@mrp-orch.com', role: 'viewer', lastActive: '2026-04-23 14:10', status: 'active', department: 'Procurement' },
  { id: 'USR-005', name: 'David Kim', email: 'd.kim@mrp-orch.com', role: 'viewer', lastActive: '2026-04-20 11:30', status: 'inactive', department: 'Sales' },
  { id: 'USR-006', name: 'Emily Watson', email: 'e.watson@mrp-orch.com', role: 'planner', lastActive: '2026-04-22 16:00', status: 'active', department: 'Supply Chain' },
  { id: 'USR-007', name: 'Carlos Mendez', email: 'c.mendez@mrp-orch.com', role: 'viewer', lastActive: '2026-04-15 09:00', status: 'suspended', department: 'Operations' },
]

export function UserAccessPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = searchQuery === '' ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'ALL' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">User Access</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Manage user accounts, roles, and permissions across the platform.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('User Invited', { description: 'Invitation email sent to new user' })}
            className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: '7', color: 'text-white' },
          { label: 'Admins', value: '1', color: 'text-mrp-primary' },
          { label: 'Planners', value: '3', color: 'text-mrp-warning' },
          { label: 'Viewers', value: '3', color: 'text-mrp-text-muted' },
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
              className="bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-4 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted h-8 transition-colors w-[240px]"
              placeholder="Search users..."
              type="text"
            />
          </div>
          <div className="h-4 w-px bg-mrp-border"></div>
          <div className="flex gap-2">
            {(['ALL', 'admin', 'planner', 'viewer'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className={`px-3 py-1 rounded-sm text-[12px] font-medium transition-colors ${
                  filterRole === role
                    ? 'bg-mrp-primary text-white'
                    : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >
                {role === 'ALL' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5" type="checkbox" />
                </th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Department</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">Last Active</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filteredUsers.map((user) => {
                const roleCfg = roleConfig[user.role]
                const statCfg = statusConfig[user.status]
                const RoleIcon = roleCfg.icon
                return (
                  <tr key={user.id} className="hover:bg-mrp-panel transition-colors">
                    <td className="py-3 px-3 text-center">
                      <input
                        checked={selectedUsers.has(user.id)}
                        onChange={() => {
                          setSelectedUsers((prev) => {
                            const next = new Set(prev)
                            if (next.has(user.id)) next.delete(user.id)
                            else next.add(user.id)
                            return next
                          })
                        }}
                        className="rounded border-mrp-border bg-mrp-app accent-mrp-primary h-3.5 w-3.5"
                        type="checkbox"
                      />
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">{user.name}</td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 ${roleCfg.bg} ${roleCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <RoleIcon size={10} />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{user.department}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 ${statCfg.bg} ${statCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statCfg.text.replace('text-', 'bg-')}`}></span>
                        {statCfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-muted whitespace-nowrap">{user.lastActive}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toast.success('User Updated', { description: `${user.name}'s profile has been updated` })}
                          className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (user.status === 'active') {
                              toast.success('User Deactivated', { description: `${user.name} has been deactivated` })
                            } else {
                              toast.success('User Activated', { description: `${user.name} has been activated` })
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1 border rounded-sm text-[13px] font-medium transition-colors ${
                            user.status === 'active'
                              ? 'border-mrp-danger/20 text-mrp-danger hover:bg-mrp-danger/10'
                              : 'border-mrp-success/20 text-mrp-success hover:bg-mrp-success/10'
                          }`}
                        >
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filteredUsers.length} of {filteredUsers.length} Users</span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option>
                <option>20</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
