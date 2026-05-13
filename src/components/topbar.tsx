'use client'

import React from 'react';
import { Search, Bell, User, Settings, Palette, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const notifications = [
  {
    id: 1,
    title: 'Component Shortage for ORD-901',
    description: 'Missing 50x CAP-MLCC-0402-10uF',
    time: '2 minutes ago',
    isCritical: true,
  },
  {
    id: 2,
    title: 'PO-402 marked as Clear to Build',
    description: 'All required components are in stock.',
    time: '15 minutes ago',
    isCritical: false,
  },
  {
    id: 3,
    title: 'New user added to the system',
    description: 'Admin "Sarah Jenkins" was granted Editor role.',
    time: '1 hour ago',
    isCritical: false,
  },
];

export function NotificationBell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-sm text-mrp-text-muted hover:text-white hover:bg-mrp-panel transition-colors focus:outline-none">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mrp-danger rounded-full"></span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 bg-mrp-panel border border-mrp-border rounded-sm shadow-sm p-0 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-mrp-border">
          <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
            Notifications
          </h3>
        </div>

        <div className="divide-y divide-mrp-border max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="px-4 py-3 rounded-none cursor-pointer focus:bg-mrp-app focus:text-white transition-colors"
            >
              <div className="flex flex-col gap-1 w-full">
                <p className={`text-[13px] font-medium ${notification.isCritical ? 'text-mrp-danger' : 'text-white'
                  }`}>
                  {notification.title}
                </p>
                <p className="text-[13px] text-mrp-text-secondary leading-snug">
                  {notification.description}
                </p>
                <p className="text-[11px] text-mrp-text-muted mt-0.5">
                  {notification.time}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserProfileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center justify-center w-8 h-8 rounded-full border border-mrp-border bg-mrp-panel text-mrp-text-muted hover:text-white transition-colors focus:outline-none">
          <User size={16} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56 bg-mrp-panel border border-mrp-border rounded-sm shadow-sm p-0 overflow-hidden"
      >
        <div className="px-3 py-3 border-b border-mrp-border">
          <p className="text-[13px] text-white font-medium truncate">
            Elias Thorne
          </p>
          <p className="text-[13px] text-mrp-text-secondary truncate mt-0.5">
            elias.thorne@mrp-corp.com
          </p>
        </div>

        <div className="py-1">
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-[13px] text-white font-medium cursor-pointer rounded-none focus:bg-mrp-border focus:text-white data-[highlighted]:bg-mrp-border data-[highlighted]:text-white outline-none">
            <Settings size={14} className="text-mrp-text-muted" />
            Account Settings
          </DropdownMenuItem>

          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-[13px] text-white font-medium cursor-pointer rounded-none focus:bg-mrp-border focus:text-white data-[highlighted]:bg-mrp-border data-[highlighted]:text-white outline-none">
            <Palette size={14} className="text-mrp-text-muted" />
            Preferences
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-mrp-border h-px mx-0" />

        <div className="py-1">
          <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-[13px] text-mrp-danger font-medium cursor-pointer rounded-none focus:bg-mrp-danger/10 focus:text-mrp-danger data-[highlighted]:bg-mrp-danger/10 data-[highlighted]:text-mrp-danger outline-none">
            <LogOut size={14} />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  return (
    <header className="h-14 w-full bg-mrp-panel sticky top-0 z-40 border-b border-mrp-border flex items-center justify-between px-8 shrink-0">
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[400px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
          <input
            className="w-full bg-mrp-app border border-mrp-border rounded-sm text-sm pl-10 pr-4 py-1.5 focus:outline-none focus:border-mrp-primary text-mrp-text-main placeholder-mrp-text-muted h-8 transition-colors"
            placeholder="Search SKUs or Orders..."
            type="text"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                toast.success('Search completed', { description: 'Results loaded successfully' })
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <NotificationBell />
        <UserProfileMenu />
        <button
          onClick={() => toast.success('Settings saved', { description: 'Preferences updated' })}
          className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer p-2 rounded-full"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}