'use client'

import React from 'react';
import { Search, Bell, LogOut, User, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAuditMetrics } from '@/features/hr/audit-logs/hooks/useAudit';

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
          <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
            System Alerts
          </h3>
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
            <p className="text-[13px] text-mrp-text-muted text-center py-2">
              No active alerts
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// User Menu — shows current user + logout
// ---------------------------------------------------------------------------

function UserMenu() {
  const { currentUser, handleLogout } = useAuth();

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ZS';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-1.5 rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-panel transition-colors focus:outline-none">
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

        <DropdownMenuItem
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-mrp-text-muted cursor-pointer hover:text-white hover:bg-mrp-app rounded-sm focus:bg-mrp-app focus:text-white"
        >
          <User size={14} />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-mrp-border my-1" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-mrp-danger cursor-pointer hover:bg-mrp-danger/10 rounded-sm focus:bg-mrp-danger/10 focus:text-mrp-danger"
        >
          <LogOut size={14} />
          Terminate Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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