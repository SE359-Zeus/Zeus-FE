'use client'

import { useState, useEffect } from 'react'
import {
  UserPlus, Pencil, Search, ChevronLeft, ChevronRight,
  Loader2, RefreshCw, UserCog, ToggleLeft, ToggleRight, X,
} from 'lucide-react'
import { useUsers, useCreateUser, useUpdateUser, useSetUserStatus } from '@/features/hr/user-access/hooks/useUsers'
import type { UserResponse, CreateUserRequest, UpdateUserRequest, UserRole } from '@/lib/types/api.types'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'ACTIVE' | 'INACTIVE' }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border'
  if (status === 'ACTIVE') {
    return <span className={`${base} bg-mrp-success/10 border-mrp-success/20 text-mrp-success`}>Active</span>
  }
  return <span className={`${base} bg-mrp-warning/10 border-mrp-warning/20 text-mrp-warning`}>Inactive</span>
}

function RoleBadge({ role }: { role: UserRole }) {
  const map: Record<UserRole, string> = {
    Admin:  'bg-mrp-primary/10 border-mrp-primary/20 text-mrp-primary',
    Editor: 'bg-mrp-warning/10 border-mrp-warning/20 text-mrp-warning',
    Viewer: 'bg-mrp-text-muted/10 border-mrp-text-muted/20 text-mrp-text-muted',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${map[role]}`}>
      {role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// User Dialog (Create / Edit)
// ---------------------------------------------------------------------------

interface UserDialogProps {
  mode: 'create' | 'edit'
  user?: UserResponse | null
  onClose: () => void
}

function UserDialog({ mode, user, onClose }: UserDialogProps) {
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    email: user?.email ?? '',
    password: '',
    role: (user?.role ?? 'Viewer') as UserRole,
  })

  const isLoading = createUser.isPending || updateUser.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'create') {
        const payload: CreateUserRequest = {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: form.role,
        }
        await createUser.mutateAsync(payload)
      } else if (user) {
        const payload: UpdateUserRequest = {
          full_name: form.full_name,
          role: form.role,
        }
        await updateUser.mutateAsync({ id: user.id, payload })
      }
      onClose()
    } catch {
      // Errors are already handled (toast) inside the mutation hooks
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-[3px] bg-mrp-primary w-full" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-mrp-border">
          <div className="flex items-center gap-2">
            <UserCog size={16} className="text-mrp-primary" />
            <h2 className="text-[13px] font-bold text-white uppercase tracking-wider">
              {mode === 'create' ? 'Add New Operator' : 'Edit Operator'}
            </h2>
          </div>
          <button onClick={onClose} className="text-mrp-text-muted hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/40"
              placeholder="e.g. James Chen"
            />
          </div>

          {/* Email — only shown on create */}
          {mode === 'create' && (
            <div>
              <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/40"
                placeholder="operator@zeus.sys"
              />
            </div>
          )}

          {/* Password — only shown on create */}
          {mode === 'create' && (
            <div>
              <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">
                Initial Password <span className="text-mrp-text-muted/50 normal-case font-normal">(min 8 chars)</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/40"
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">
              Access Role
            </label>
            <div className="flex gap-2">
              {(['Admin', 'Editor', 'Viewer'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`flex-1 py-2 rounded-sm text-[12px] font-bold uppercase tracking-wider border transition-all ${
                    form.role === r
                      ? 'bg-mrp-primary border-mrp-primary text-white'
                      : 'bg-mrp-app border-mrp-border text-mrp-text-muted hover:border-mrp-primary/50 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border py-2.5 rounded-sm text-[12px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-mrp-primary hover:bg-mrp-primary-hover disabled:opacity-50 text-white py-2.5 rounded-sm text-[12px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {isLoading
                ? <Loader2 size={14} className="animate-spin" />
                : mode === 'create' ? 'Create Operator' : 'Save Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function UserAccessView() {
  const [page, setPage] = useState(1)
  const [limit] = useState(15)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editTarget, setEditTarget] = useState<UserResponse | null>(null)

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const { data, isLoading, isError, refetch, isFetching } = useUsers({
    page,
    limit,
    q: debouncedSearch || undefined,
  })

  const setStatus = useSetUserStatus()

  const users = data?.data?.items ?? []
  const pagination = data?.data?.pagination

  const handleToggleStatus = (user: UserResponse) => {
    const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setStatus.mutate({ id: user.id, status: next })
  }

  const openEdit = (user: UserResponse) => {
    setEditTarget(user)
    setDialogMode('edit')
  }

  const closeDialog = () => {
    setDialogMode(null)
    setEditTarget(null)
  }

  return (
    <>
      {/* Dialog */}
      {dialogMode && (
        <UserDialog
          mode={dialogMode}
          user={editTarget}
          onClose={closeDialog}
        />
      )}

      <div className="flex flex-col h-full w-full">
        {/* Page Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white m-0">User Access</h1>
            <p className="text-sm text-mrp-text-secondary mt-1">
              Manage operator accounts, roles, and access privileges.
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh list"
              className="p-2 border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border rounded-sm transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            </button>

            {/* Create */}
            <button
              onClick={() => setDialogMode('create')}
              className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm"
            >
              <UserPlus size={16} />
              Add Operator
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 relative w-full max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-mrp-panel border border-mrp-border text-white text-sm pl-9 pr-4 py-2 rounded-sm focus:outline-none focus:border-mrp-primary transition-colors placeholder:text-mrp-text-muted/50 h-9"
          />
        </div>

        {/* Data Table */}
        <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
                <tr>
                  {['Full Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(col => (
                    <th
                      key={col}
                      className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${col === 'Actions' ? 'text-right' : ''}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-mrp-border bg-mrp-app">
                {/* Loading skeleton */}
                {isLoading && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="py-3 px-4">
                          <div className="h-4 bg-mrp-border/50 rounded w-3/4" />
                        </td>
                      ))}
                    </tr>
                  ))
                )}

                {/* Error state */}
                {isError && !isLoading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-mrp-text-muted text-sm">
                      Failed to load users. <button onClick={() => refetch()} className="text-mrp-primary underline ml-1">Retry</button>
                    </td>
                  </tr>
                )}

                {/* Empty state */}
                {!isLoading && !isError && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-mrp-text-muted text-sm">
                      {debouncedSearch ? `No users found for "${debouncedSearch}".` : 'No users in the system yet.'}
                    </td>
                  </tr>
                )}

                {/* Data rows */}
                {!isLoading && users.map(user => (
                  <tr key={user.id} className="hover:bg-mrp-panel transition-colors group">
                    <td className="py-3 px-4 text-[13px] text-white font-medium whitespace-nowrap">
                      {user.full_name}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary whitespace-nowrap">
                      {user.email}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'
                      }
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Edit */}
                        <button
                          title="Edit User"
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center justify-center p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-white"
                        >
                          <Pencil size={14} />
                        </button>

                        {/* Toggle Status */}
                        <button
                          title={user.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                          onClick={() => handleToggleStatus(user)}
                          disabled={setStatus.isPending}
                          className={`inline-flex items-center justify-center p-1 border rounded-sm transition-colors disabled:opacity-40 ${
                            user.status === 'ACTIVE'
                              ? 'border-mrp-success/30 text-mrp-success hover:bg-mrp-success/10'
                              : 'border-mrp-warning/30 text-mrp-warning hover:bg-mrp-warning/10'
                          }`}
                        >
                          {user.status === 'ACTIVE'
                            ? <ToggleRight size={14} />
                            : <ToggleLeft size={14} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination && (
            <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between shrink-0">
              <span className="text-[13px] text-mrp-text-muted">
                {pagination.total_rows === 0
                  ? 'No results'
                  : `Page ${pagination.page} of ${pagination.total_pages} · ${pagination.total_rows} operators total`
                }
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="p-1.5 border border-mrp-border rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-border transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[13px] text-white font-mono px-2">
                  {page} / {pagination.total_pages || 1}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page >= pagination.total_pages || isFetching}
                  className="p-1.5 border border-mrp-border rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-border transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
