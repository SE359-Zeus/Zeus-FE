'use client'

import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Users,
  History,
  Factory,
  Menu,
  ChevronLeft,
  Truck,
} from 'lucide-react'
import type { PageId } from '@/app/page'

interface SidebarProps {
  currentPage: PageId
  onNavigate: (page: PageId) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'bom-catalog', label: 'BOM & Catalog', icon: Package },
  { id: 'inventory-ledger', label: 'Inventory Ledger', icon: FileText },
  { id: 'demand-pos', label: 'Demand & POs', icon: ShoppingCart },
  { id: 'user-access', label: 'User Access', icon: Users },
  { id: 'audit-logs', label: 'Audit Logs', icon: History },
  { id: 'vendor-routing', label: 'Vendor Routing', icon: Truck },
]

export function Sidebar({ currentPage, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <nav
      className="bg-mrp-panel fixed left-0 top-0 bottom-0 z-50 flex flex-col h-full border-r border-mrp-border transition-all duration-300"
      style={{ width: collapsed ? '64px' : '260px' }}
    >
      {/* Logo Area */}
      <div className="px-4 py-6 border-b border-mrp-border mb-4 flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="text-mrp-text-muted hover:text-white shrink-0 focus:outline-none flex items-center justify-center p-1 rounded-full hover:bg-mrp-app transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
        <div
          className="flex items-center gap-3 whitespace-nowrap overflow-hidden transition-all duration-300"
          style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
        >
          <Factory size={22} className="text-mrp-primary shrink-0" fill="currentColor" />
          <div>
            <div className="text-white font-bold tracking-widest text-sm uppercase font-mono">
              MRP Orchestrator
            </div>
            <div className="text-mrp-text-muted text-xs mt-1">V2.4.0</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full text-left py-3 px-4 flex items-center gap-3 text-[13px] transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'border-l-4 border-mrp-primary bg-mrp-app text-white font-bold'
                      : 'text-mrp-text-muted font-medium hover:bg-mrp-app hover:text-mrp-text-secondary border-l-4 border-transparent'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`shrink-0 ${isActive ? 'text-mrp-primary' : ''}`}
                    {...(isActive ? { fill: 'currentColor', strokeWidth: 1.5 } : { strokeWidth: 2 })}
                  />
                  <span
                    className="transition-all duration-300 overflow-hidden"
                    style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
