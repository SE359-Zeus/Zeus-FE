'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  ChevronDown,
  LogOut,
  AlertTriangle,
  Truck,
  ClipboardList,
  PackageCheck,
  Ship,
  Boxes
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

const navSections = [
  {
    title: 'MRP',
    items: [
      { href: '/mrp/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/mrp/bom-catalog', label: 'Product Catalog', icon: Package },
      { href: '/mrp/inventory-ledger', label: 'Inventory Ledger', icon: FileText },
      { href: '/mrp/demand-pos', label: 'Demand', icon: ShoppingCart },
    ]
  },
  {
    title: 'SCM',
    items: [
      { href: '/scm/suppliers', label: 'Supplier', icon: Truck },
      { href: '/scm/po-orchestration', label: 'Purchase Order', icon: ClipboardList },
      { href: '/scm/goods-receipt', label: 'Goods Receipt', icon: PackageCheck },
      { href: '/scm/shipments', label: 'Shipment', icon: Ship },
      { href: '/scm/inventory', label: 'Inventory', icon: Boxes },
    ]
  },
  {
    title: 'Sales',
    items: [
      { href: '/sales/orders', label: 'Sales Orders', icon: ShoppingCart },
      { href: '/sales/customers', label: 'Customers', icon: Users },
    ]
  },
  {
    title: 'HR',
    items: [
      { href: '/hr/user-access', label: 'User Access', icon: Users },
      { href: '/hr/audit-logs', label: 'Audit Logs', icon: History },
    ]
  }
]

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'MRP': true,
    'SCM': true,
    'Sales': true,
    'HR': true,
  })

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const renderNavItem = (item: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === item.href
    const Icon = item.icon
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`w-full text-left py-2.5 px-4 flex items-center gap-3 text-[13px] transition-all duration-200 whitespace-nowrap ${
            isActive
              ? 'border-l-4 border-mrp-primary bg-mrp-app text-white font-bold'
              : 'text-mrp-text-muted font-medium hover:bg-mrp-app hover:text-mrp-text-secondary border-l-4 border-transparent'
          }`}
        >
          <div className="relative flex shrink-0 items-center justify-center">
            <Icon
              size={18}
              className={`${isActive ? 'text-mrp-primary' : ''}`}
              {...(isActive ? { fill: 'currentColor', strokeWidth: 1.5 } : { strokeWidth: 2 })}
            />
            {item.label === 'Shortages' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-mrp-danger animate-pulse" />
            )}
          </div>
          
          <span
            className="transition-all duration-300 overflow-hidden"
            style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          >
            {item.label}
          </span>
        </Link>
      </li>
    )
  }

  return (
    <nav
      className="bg-mrp-panel fixed left-0 top-0 bottom-0 z-50 flex flex-col h-full border-r border-mrp-border transition-all duration-300"
      style={{ width: collapsed ? '64px' : '260px' }}
    >
      {/* Logo Area */}
      <div className="px-4 py-6 border-b border-mrp-border flex items-center gap-3 shrink-0">
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
            <div className="text-mrp-text-muted text-[10px] mt-0.5 tracking-wider">V2.4.0</div>
          </div>
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pt-2">
        {navSections.map((section) => {
          const isSectionExpanded = expandedSections[section.title] !== false

          return (
            <div key={section.title} className="mb-2">
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-4 py-2 mt-2 group"
                >
                  <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider group-hover:text-mrp-text-secondary transition-colors">
                    {section.title}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-mrp-text-muted transform transition-transform duration-200 group-hover:text-mrp-text-secondary ${
                      isSectionExpanded ? '' : '-rotate-90'
                    }`}
                  />
                </button>
              )}

              {(collapsed || isSectionExpanded) && (
                <ul className="space-y-1 mt-1">
                  {section.items.map(renderNavItem)}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-mrp-border p-3 shrink-0">
        <Link
          href="/login"
          className="w-full flex items-center gap-3 text-mrp-text-muted hover:text-white hover:bg-mrp-app p-2 rounded-sm transition-all duration-200 group overflow-hidden"
          title={collapsed ? "Logout" : ""}
        >
          <div className="w-8 h-8 rounded-full bg-mrp-danger/10 border border-mrp-danger/20 text-mrp-danger flex items-center justify-center font-bold text-[13px] shrink-0">
            N
          </div>
          
          <div
            className="flex flex-1 items-center justify-between transition-all duration-300 whitespace-nowrap"
            style={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
          >
            <span className="text-[13px] font-medium">Logout</span>
            <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-mrp-danger" />
          </div>
        </Link>
      </div>
    </nav>
  )
}