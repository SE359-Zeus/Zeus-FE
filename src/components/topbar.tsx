'use client'

import { Search, Bell, UserCircle, Settings } from 'lucide-react'
import { toast } from 'sonner'

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
        <button
          onClick={() => toast.success('Notifications loaded', { description: '3 unread notifications' })}
          className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer p-2 rounded-full relative"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-mrp-danger rounded-full border border-mrp-panel"></span>
        </button>
        <button
          onClick={() => toast.success('Profile loaded', { description: 'Logged in as Admin' })}
          className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer p-2 rounded-full"
        >
          <UserCircle size={20} />
        </button>
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
