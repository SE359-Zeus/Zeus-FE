'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Topbar } from '@/components/topbar'
import { DashboardPage } from '@/components/pages/dashboard'
import { BomCatalogPage } from '@/components/pages/bom-catalog'
import { InventoryLedgerPage } from '@/components/pages/inventory-ledger'
import { DemandPosPage } from '@/components/pages/demand-pos'
import { UserAccessPage } from '@/components/pages/user-access'
import { AuditLogsPage } from '@/components/pages/audit-logs'

export type PageId = 'dashboard' | 'bom-catalog' | 'inventory-ledger' | 'demand-pos' | 'user-access' | 'audit-logs'

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'bom-catalog':
        return <BomCatalogPage />
      case 'inventory-ledger':
        return <InventoryLedgerPage />
      case 'demand-pos':
        return <DemandPosPage />
      case 'user-access':
        return <UserAccessPage />
      case 'audit-logs':
        return <AuditLogsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-mrp-app">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="flex-1 flex flex-col min-w-[1024px] bg-mrp-app h-screen overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '260px' }}
      >
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
