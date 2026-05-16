'use client'

import React from 'react';
import { Search, Bell } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
                <p className={`text-[13px] font-medium ${notification.isCritical ? 'text-mrp-danger' : 'text-white'}`}>
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
      </div>
    </header>
  )
}