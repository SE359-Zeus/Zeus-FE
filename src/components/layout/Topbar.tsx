'use client'

import React, { useState, useCallback } from 'react';
import { Search, Bell, LogOut, ShieldCheck, Lock, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/system/auth/hooks/useAuth';
import { useAuditMetrics } from '@/features/system/audit-logs/hooks/useAudit';
import { changePassword } from '@/features/system/auth/auth.service';

// ---------------------------------------------------------------------------
// Password input field — defined OUTSIDE modal to avoid re-mount on render
// ---------------------------------------------------------------------------

interface PasswordInputProps {
  id: string
  label: string
  value: string
  show: boolean
  onToggleShow: () => void
  onChange: (v: string) => void
  placeholder?: string
}

function PasswordInput({
  id, label, value, show, onToggleShow, onChange, placeholder = '••••••••',
}: PasswordInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted pointer-events-none" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-mrp-app border border-mrp-border text-white pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-mrp-primary rounded-sm transition-colors placeholder:text-mrp-text-muted/40"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-mrp-text-muted hover:text-white transition-colors"
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Change Password Modal
// ---------------------------------------------------------------------------

interface ChangePasswordModalProps {
  onClose: () => void
}

function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable callbacks to avoid re-renders
  const toggleShowOld = useCallback(() => setShowOld(v => !v), [])
  const toggleShowNew = useCallback(() => setShowNew(v => !v), [])
  const toggleShowConfirm = useCallback(() => setShowConfirm(v => !v), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPw !== confirmPw) {
      setError('New passwords do not match.')
      return
    }
    if (newPw.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setIsLoading(true)
    try {
      await changePassword({ old_password: oldPw, new_password: newPw })
      toast.success('Password Changed', { description: 'Your password has been updated successfully.' })
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } }
      if (axiosErr.response?.status === 401) {
        setError('Current password is incorrect.')
      } else if (axiosErr.response?.status === 400) {
        setError(axiosErr.response.data?.message ?? 'Invalid request. Check your inputs.')
      } else {
        setError('Failed to change password. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl overflow-hidden">
        <div className="h-[3px] bg-mrp-primary w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-mrp-border">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-mrp-primary" />
            <h2 className="text-[13px] font-bold text-white uppercase tracking-wider">Change Password</h2>
          </div>
          <button onClick={onClose} className="text-mrp-text-muted hover:text-white transition-colors p-1">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-3 py-2 text-[12px] text-red-400">
              {error}
            </div>
          )}

          <PasswordInput
            id="cp-old"
            label="Current Password"
            value={oldPw}
            show={showOld}
            onToggleShow={toggleShowOld}
            onChange={setOldPw}
          />
          <PasswordInput
            id="cp-new"
            label="New Password"
            value={newPw}
            show={showNew}
            onToggleShow={toggleShowNew}
            onChange={setNewPw}
          />
          <PasswordInput
            id="cp-confirm"
            label="Confirm New Password"
            value={confirmPw}
            show={showConfirm}
            onToggleShow={toggleShowConfirm}
            onChange={setConfirmPw}
          />

          <div className="flex gap-3 pt-1">
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
                ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                : 'Update Password'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notification Bell — wired to real security_events metric
// ---------------------------------------------------------------------------

function NotificationBell() {
  const { data: metricsData } = useAuditMetrics();
  const securityEvents = metricsData?.data?.security_events ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-panel transition-colors focus:outline-none">
          <Bell size={16} />
          {securityEvents > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mrp-danger rounded-full animate-pulse" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-mrp-panel border border-mrp-border rounded-sm shadow-sm p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-mrp-border flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">System Alerts</h3>
          {securityEvents > 0 && (
            <span className="text-[10px] font-bold text-mrp-danger bg-mrp-danger/10 px-2 py-0.5 rounded-sm">
              {securityEvents} Security {securityEvents === 1 ? 'Event' : 'Events'}
            </span>
          )}
        </div>
        <div className="px-4 py-3">
          {securityEvents > 0 ? (
            <div className="flex items-start gap-3">
              <ShieldCheck size={16} className="text-mrp-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-mrp-danger font-medium">
                  {securityEvents} security {securityEvents === 1 ? 'event' : 'events'} detected
                </p>
                <p className="text-[12px] text-mrp-text-muted mt-0.5">
                  Review Audit Logs → Security filter for details.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-mrp-text-muted text-center py-2">No active alerts</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// User Menu — avatar click → Change Password only
// ---------------------------------------------------------------------------

function UserMenu() {
  const { currentUser, handleLogout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ZS';

  return (
    <>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            id="user-avatar-trigger"
            className="flex items-center gap-2 p-1.5 rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-panel transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-sm bg-mrp-primary/20 border border-mrp-primary/30 flex items-center justify-center">
              <span className="text-[11px] font-bold text-mrp-primary font-mono">{initials}</span>
            </div>
            {currentUser && (
              <div className="hidden md:flex flex-col items-start">
                <span className="text-[12px] font-medium text-white leading-none">{currentUser.full_name}</span>
                <span className="text-[10px] text-mrp-text-muted leading-none mt-0.5">{currentUser.role}</span>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-52 bg-mrp-panel border border-mrp-border rounded-sm shadow-lg p-1"
        >
          {/* User info header */}
          {currentUser && (
            <>
              <div className="px-3 py-2.5">
                <p className="text-[13px] font-medium text-white">{currentUser.full_name}</p>
                <p className="text-[11px] text-mrp-text-muted mt-0.5">{currentUser.email}</p>
                <p className="text-[10px] text-mrp-primary font-bold uppercase tracking-wider mt-1">{currentUser.role}</p>
              </div>
              <DropdownMenuSeparator className="bg-mrp-border my-1" />
            </>
          )}

          {/* Change Password */}
          <DropdownMenuItem
            id="menu-change-password"
            onClick={() => setShowChangePassword(true)}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-mrp-text-muted cursor-pointer hover:text-white hover:bg-mrp-app rounded-sm focus:bg-mrp-app focus:text-white"
          >
            <Lock size={14} />
            Change Password
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-mrp-border my-1" />

          {/* Logout — kept as a secondary small link below the separator */}
          <DropdownMenuItem
            id="menu-logout"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-[13px] text-mrp-danger cursor-pointer hover:bg-mrp-danger/10 rounded-sm focus:bg-mrp-danger/10 focus:text-mrp-danger"
          >
            <LogOut size={14} />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

export function Topbar() {
  return (
    <header className="h-14 w-full bg-mrp-panel sticky top-0 z-40 border-b border-mrp-border flex items-center justify-between px-8 shrink-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[400px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
          <input
            className="w-full bg-mrp-app border border-mrp-border rounded-sm text-sm pl-10 pr-4 py-1.5 focus:outline-none focus:border-mrp-primary text-mrp-text-main placeholder-mrp-text-muted h-8 transition-colors"
            placeholder="Search operators, audit entries..."
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                toast.info('Search', { description: 'Use the search fields within each module for full functionality.' })
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <NotificationBell />
        <div className="h-5 w-px bg-mrp-border" />
        <UserMenu />
      </div>
    </header>
  )
}