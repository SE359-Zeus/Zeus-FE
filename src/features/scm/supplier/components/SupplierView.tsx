'use client'

import React, { useState } from 'react'
import {
  Search, Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Pencil,
  Download, X,
} from 'lucide-react'
import { toast } from 'sonner'

type SupplierTier = 'Preferred' | 'Qualified' | 'Under Review'
type FilterType = 'ALL' | SupplierTier

interface SkuMapping {
  sku: string
  name: string
  unitPrice: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  tier: SupplierTier
  skuMappings: SkuMapping[]
}

const mockSuppliers: Supplier[] = [
  {
    id: 'INTEL-CPU-US', name: 'Intel Corporation', contact: 'sales@intel.com', tier: 'Preferred',
    skuMappings: [
      { sku: 'CPU-XM100PRO-14C-55W',  name: 'Zeus SOC XM100 Pro (14-Core)',   unitPrice: '$580.00' },
      { sku: 'CPU-XM100ULT-24C-65W', name: 'Zeus SOC XM100 Ultra (24-Core)', unitPrice: '$920.00' },
      { sku: 'CPU-XM100LT-8C-28W',   name: 'Zeus SOC XM100 LT (8-Core)',     unitPrice: '$340.00' },
    ],
  },
  {
    id: 'SMSNG-MEM-KR', name: 'Samsung Electronics', contact: 'logistics@samsung.com', tier: 'Preferred',
    skuMappings: [
      { sku: 'SSD-NVME5-2TB-7GBs',  name: '2TB NVMe Gen5 Enterprise SSD',   unitPrice: '$185.00' },
      { sku: 'SSD-NVME5-1TB-7GBs',  name: '1TB NVMe Gen5 SSD',              unitPrice: '$110.00' },
      { sku: 'RAM-DDR5SO-64G-6400', name: '64GB DDR5-6400 ECC SO-DIMM',      unitPrice: '$210.00' },
    ],
  },
  {
    id: 'NVDIA-GPU-US', name: 'NVIDIA', contact: 'contact@nvidia.com', tier: 'Preferred',
    skuMappings: [
      { sku: 'GPU-RTX5080M-16G-150W', name: 'NVIDIA RTX 5080 Mobile (16GB GDDR7)', unitPrice: '$890.00' },
      { sku: 'GPU-RTX5070M-12G-120W', name: 'NVIDIA RTX 5070 Mobile (12GB GDDR7)', unitPrice: '$620.00' },
    ],
  },
  {
    id: 'SKHYX-RAM-KR', name: 'SK Hynix', contact: 'info@skhynix.com', tier: 'Qualified',
    skuMappings: [
      { sku: 'RAM-DDR5SO-32G-5600', name: '32GB DDR5-5600 SO-DIMM', unitPrice: '$95.00' },
      { sku: 'RAM-DDR5SO-16G-5600', name: '16GB DDR5-5600 SO-DIMM', unitPrice: '$48.00' },
      { sku: 'RAM-DDR5SO-8G-5600',  name: '8GB DDR5-5600 SO-DIMM',  unitPrice: '$25.00' },
    ],
  },
  {
    id: 'LGDSP-DSP-KR', name: 'LG Display', contact: 'b2b@lg.com', tier: 'Qualified',
    skuMappings: [
      { sku: 'DSP-OLED4K-16IN-120Hz', name: '16" 4K ProArt OLED 120Hz Panel', unitPrice: '$420.00' },
      { sku: 'DSP-OLED4K-15IN-120Hz', name: '15" 4K OLED 120Hz Panel',        unitPrice: '$380.00' },
      { sku: 'DSP-IPSFHD-13IN-60Hz',  name: '13" FHD IPS 60Hz Panel',         unitPrice: '$120.00' },
    ],
  },
  {
    id: 'MURAT-MOD-JP', name: 'Murata Manufacturing', contact: 'components@murata.com', tier: 'Qualified',
    skuMappings: [
      { sku: 'MOD-WIFI7AX-6GHz-2W',    name: 'WiFi 7 AX 6GHz Module (M.2)', unitPrice: '$35.00' },
      { sku: 'MOD-BT53LE-2.4GHz-0.5W', name: 'Bluetooth 5.3 LE Module',      unitPrice: '$12.00' },
    ],
  },
  {
    id: 'TEXAS-PWR-US', name: 'Texas Instruments', contact: 'sales@ti.com', tier: 'Preferred',
    skuMappings: [
      { sku: 'PSU-GaN-240W-95E', name: '240W GaN PSU 95% Eff. (USB-C)', unitPrice: '$75.00' },
      { sku: 'IC-BUCK-5A-3.3V',  name: '5A Synchronous Buck Converter',  unitPrice: '$4.00'  },
    ],
  },
  {
    id: 'FOXCN-MB-TW', name: 'Foxconn Technology', contact: 'procurement@foxconn.com', tier: 'Under Review',
    skuMappings: [
      { sku: 'MB-EATX-ZX1Ti-DDR5', name: 'Zeus X1 Titanium Mainboard (E-ATX)', unitPrice: '$650.00' },
      { sku: 'MB-MATX-AeroS-DDR5', name: 'Aero S Mainboard (M-ATX)',            unitPrice: '$290.00' },
    ],
  },
]

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Preferred', label: 'Preferred' },
  { key: 'Qualified', label: 'Qualified' },
  { key: 'Under Review', label: 'Under Review' },
]


function tierBadge(tier: SupplierTier) {
  switch (tier) {
    case 'Preferred':    return { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' }
    case 'Qualified':    return { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary' }
    case 'Under Review': return { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning animate-pulse' }
  }
}

function tierLabel(tier: SupplierTier): string {
  switch (tier) {
    case 'Preferred':    return 'Tier 1'
    case 'Qualified':    return 'Tier 2'
    case 'Under Review': return 'Tier 3'
  }
}

const kpiStats = [
  { label: 'Total Active Suppliers', value: '8', color: 'text-white' },
  { label: 'On-Time Delivery Rate', value: '91.8%', color: 'text-mrp-success' },
]

export function SupplierView() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['SUP-003']))
  const [searchQuery, setSearchQuery] = useState('')

  // Add Supplier modal
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [form, setForm] = useState({ name: '', contact: '', tier: 'Qualified' as SupplierTier })

  const handleSaveSupplier = () => {
    if (!form.name.trim()) { toast.error('Supplier name is required'); return }
    if (!form.contact.trim()) { toast.error('Contact email is required'); return }
    toast.success('Supplier Added', { description: `"${form.name}" has been registered` })
    setShowAddSupplier(false)
    setForm({ name: '', contact: '', tier: 'Qualified' })
  }

  const filtered = mockSuppliers.filter((v) => {
    const matchesTier = filter === 'ALL' || v.tier === filter
    const matchesSearch = searchQuery === '' ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skuMappings.some((s) => s.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTier && matchesSearch
  })

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Supplier</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Manage supplier relationships, map SKU associations, and optimize procurement routing.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-mrp-app border border-mrp-border text-white py-2 pl-9 pr-4 text-[13px] rounded-sm focus:border-mrp-primary focus:outline-none transition-colors placeholder:text-mrp-text-muted"
              placeholder="Search suppliers or SKUs..."
              type="text"
            />
          </div>
          <button
          onClick={() => setShowAddSupplier(true)}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {kpiStats.map((s) => (
          <div key={s.label} className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">{s.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Filter Bar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors cursor-pointer ${
                  filter === key
                    ? 'bg-mrp-primary text-white'
                    : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => toast.success('Report Exported', { description: 'Supplier performance report downloaded' })}
            className="flex items-center gap-2 text-mrp-text-muted hover:text-white transition-colors text-[13px] cursor-pointer"
          >
            <Download size={14} /> Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['#', 'Supplier ID', 'Name', 'Contact', 'Tier', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${
                      col === '#' ? 'w-10 text-center' :
                      col === 'Actions' ? 'text-right' : ''
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((supplier, idx) => {
                const isExpanded = expandedRows.has(supplier.id)
                const tCfg = tierBadge(supplier.tier)

                return (
                  <React.Fragment key={supplier.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors group ${isExpanded ? `bg-mrp-panel` : ``}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted text-center">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted whitespace-nowrap">{supplier.id}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{supplier.name}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{supplier.contact}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${tCfg.bg} border ${tCfg.border} ${tCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tCfg.dot}`} />
                          {tierLabel(supplier.tier)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRow(supplier.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border cursor-pointer"
                          >
                            {isExpanded ? 'Hide SKUs' : 'View SKUs'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            onClick={() => toast.success('Edit Supplier', { description: `Editing ${supplier.name}` })}
                            className="p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-white cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded SKU Mapping */}
                    {isExpanded && (
                      <tr key={`${supplier.id}-expanded`} className="bg-[#1a1c1e] border-b border-mrp-border">
                        <td />
                        <td className="py-4 px-4 pb-6" colSpan={7}>
                          <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
                            <div className="flex items-center justify-between mb-3 border-b border-mrp-border pb-2">
                              <h4 className="text-[11px] font-bold text-mrp-primary uppercase tracking-wider">
                                SKU Mapping — {supplier.name}
                              </h4>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-[13px]">
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">SKU</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Component Name</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Unit Price</div>

                              {supplier.skuMappings.map((sku) => (
                                <React.Fragment key={sku.sku}>
                                  <div className="col-span-1 font-mono text-white border-t border-mrp-border pt-2">{sku.sku}</div>
                                  <div className="text-mrp-text-secondary border-t border-mrp-border pt-2">{sku.name}</div>
                                  <div className="text-right font-mono text-white border-t border-mrp-border pt-2">{sku.unitPrice}</div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filtered.length} of {filtered.length} Suppliers</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option><option>20</option><option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="p-1 text-mrp-text-muted hover:text-white disabled:opacity-30 transition-colors cursor-pointer" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}

      {showAddSupplier && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowAddSupplier(false)}>
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-lg rounded-sm shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Add Supplier</h3>
              <button onClick={() => setShowAddSupplier(false)} className="text-mrp-text-muted hover:text-white transition-colors cursor-pointer"><X size={18} /></button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Supplier Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Samsung Electronics"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Contact Email</label>
                <input
                  value={form.contact}
                  onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                  placeholder="e.g. procurement@supplier.com"
                  type="email"
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as SupplierTier }))}
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                >
                  <option>Preferred</option>
                  <option>Qualified</option>
                  <option>Under Review</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button
                onClick={() => setShowAddSupplier(false)}
                className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSupplier}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm cursor-pointer"
              >
                Save Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
