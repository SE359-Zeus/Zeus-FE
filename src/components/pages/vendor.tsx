'use client'

import React, { useState } from 'react'
import {
  Search, Plus, ChevronDown, ChevronUp, Pencil, MoreVertical,
  Download, Truck, ShieldCheck, AlertTriangle, Filter,
} from 'lucide-react'
import { toast } from 'sonner'

type VendorTier = 'Preferred' | 'Qualified' | 'Under Review'
type FilterType = 'ALL' | VendorTier

interface SkuMapping {
  sku: string
  name: string
  unitPrice: string
  leadTime: number
}

interface Vendor {
  id: string
  name: string
  contact: string
  tier: VendorTier
  leadTime: number
  qualityScore: number
  onTimeRate: number
  skuMappings: SkuMapping[]
}

const mockVendors: Vendor[] = [
  {
    id: 'VND-001', name: 'Intel Corporation', contact: 'sales@intel.com', tier: 'Preferred',
    leadTime: 14, qualityScore: 98, onTimeRate: 96,
    skuMappings: [
      { sku: 'SOC-XM100-PRO', name: 'Zeus SOC XM100 Pro (14-Core)', unitPrice: '$580.00', leadTime: 14 },
      { sku: 'SOC-XM100-ULTRA', name: 'Zeus SOC XM100 Ultra (24-Core)', unitPrice: '$920.00', leadTime: 18 },
      { sku: 'SOC-XM100-LT', name: 'Zeus SOC XM100 LT (8-Core)', unitPrice: '$340.00', leadTime: 12 },
    ],
  },
  {
    id: 'VND-002', name: 'Samsung Electronics', contact: 'logistics@samsung.com', tier: 'Preferred',
    leadTime: 21, qualityScore: 92, onTimeRate: 89,
    skuMappings: [
      { sku: 'SSD-2T-NVME', name: '2TB NVMe Gen5 Enterprise SSD', unitPrice: '$185.00', leadTime: 21 },
      { sku: 'SSD-1T-NVME', name: '1TB NVMe Gen5 SSD', unitPrice: '$110.00', leadTime: 18 },
      { sku: 'RAM-64G-DDR5', name: '64GB DDR5-6400 ECC SO-DIMM', unitPrice: '$210.00', leadTime: 24 },
    ],
  },
  {
    id: 'VND-003', name: 'NVIDIA', contact: 'contact@nvidia.com', tier: 'Preferred',
    leadTime: 30, qualityScore: 99, onTimeRate: 97,
    skuMappings: [
      { sku: 'GPU-RTX5080-M', name: 'NVIDIA RTX 5080 Mobile (16GB)', unitPrice: '$890.00', leadTime: 30 },
    ],
  },
  {
    id: 'VND-004', name: 'SK Hynix', contact: 'info@skhynix.com', tier: 'Qualified',
    leadTime: 7, qualityScore: 85, onTimeRate: 91,
    skuMappings: [
      { sku: 'RAM-32G-DDR5', name: '32GB DDR5-5600 SO-DIMM', unitPrice: '$95.00', leadTime: 7 },
      { sku: 'RAM-16G-DDR5', name: '16GB DDR5-5600 SO-DIMM', unitPrice: '$48.00', leadTime: 7 },
    ],
  },
  {
    id: 'VND-005', name: 'LG Display', contact: 'b2b@lg.com', tier: 'Qualified',
    leadTime: 45, qualityScore: 88, onTimeRate: 82,
    skuMappings: [
      { sku: 'DISP-OLED-16', name: '16" 4K ProArt OLED Panel', unitPrice: '$420.00', leadTime: 45 },
      { sku: 'DISP-OLED-15', name: '15" 4K OLED Panel', unitPrice: '$380.00', leadTime: 40 },
      { sku: 'DISP-IPS-13', name: '13" FHD IPS Panel', unitPrice: '$120.00', leadTime: 30 },
    ],
  },
  {
    id: 'VND-006', name: 'Murata Manufacturing', contact: 'components@murata.com', tier: 'Qualified',
    leadTime: 10, qualityScore: 94, onTimeRate: 93,
    skuMappings: [
      { sku: 'MOD-WIFI7-AX', name: 'WiFi 7 AX Module', unitPrice: '$35.00', leadTime: 10 },
    ],
  },
  {
    id: 'VND-007', name: 'Texas Instruments', contact: 'sales@ti.com', tier: 'Preferred',
    leadTime: 12, qualityScore: 96, onTimeRate: 95,
    skuMappings: [
      { sku: 'PSU-GAN-240W', name: '240W GaN Power Supply Unit', unitPrice: '$75.00', leadTime: 12 },
    ],
  },
  {
    id: 'VND-008', name: 'Foxconn Technology', contact: 'procurement@foxconn.com', tier: 'Under Review',
    leadTime: 35, qualityScore: 82, onTimeRate: 78,
    skuMappings: [
      { sku: 'MB-ZEUS-X1', name: 'Zeus X1 Titanium Mainboard', unitPrice: '$650.00', leadTime: 35 },
      { sku: 'MB-AERO-S', name: 'Aero S Mainboard', unitPrice: '$290.00', leadTime: 30 },
    ],
  },
]

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'Preferred', label: 'Preferred' },
  { key: 'Qualified', label: 'Qualified' },
  { key: 'Under Review', label: 'Under Review' },
]

function scoreColor(score: number) {
  if (score >= 90) return { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' }
  if (score >= 70) return { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning' }
  return { bg: 'bg-mrp-danger/10', border: 'border-mrp-danger/20', text: 'text-mrp-danger', dot: 'bg-mrp-danger' }
}

function tierBadge(tier: VendorTier) {
  switch (tier) {
    case 'Preferred': return { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success' }
    case 'Qualified': return { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary' }
    case 'Under Review': return { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning animate-pulse' }
  }
}

const kpiStats = [
  { label: 'Total Active Vendors', value: '8', color: 'text-white' },
  { label: 'Avg. Lead Time', value: '18.5', unit: 'days', color: 'text-mrp-primary' },
  { label: 'Avg. Quality Score', value: '94.2%', color: 'text-mrp-success' },
  { label: 'On-Time Delivery Rate', value: '91.8%', color: 'text-mrp-success' },
]

// Simple bar chart data for Vendor Risk Analysis
const riskData = [
  { name: 'INTEL', value: 98, hex: '#0066CC' },
  { name: 'SAMS', value: 92, hex: '#0066CC' },
  { name: 'NVIDIA', value: 99, hex: '#0066CC' },
  { name: 'HYNIX', value: 85, hex: '#F0AB00' },
  { name: 'LG', value: 88, hex: '#F0AB00' },
  { name: 'MURATA', value: 94, hex: '#0066CC' },
  { name: 'TI', value: 96, hex: '#0066CC' },
  { name: 'FOXC', value: 78, hex: '#C9190B' },
]

export function VendorPage() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['VND-003']))
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = mockVendors.filter((v) => {
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
          <h1 className="text-2xl font-bold text-white m-0">Vendor</h1>
          <p className="text-sm text-mrp-text-muted mt-1">
            Manage vendor relationships, map SKU associations, and optimize procurement routing.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-mrp-app border border-mrp-border text-white py-2 pl-9 pr-4 text-[13px] rounded-sm focus:border-mrp-primary focus:outline-none transition-colors placeholder:text-mrp-text-muted"
              placeholder="Search vendors or SKUs..."
              type="text"
            />
          </div>
          <button
            onClick={() => toast.success('Add Vendor', { description: 'Vendor registration form opened' })}
            className="bg-mrp-primary hover:bg-mrp-primary-hover text-white text-sm font-medium py-2 px-4 rounded-sm transition-colors flex items-center gap-2 border border-transparent shadow-sm"
          >
            <Plus size={16} />
            Add Vendor
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {kpiStats.map((s) => (
          <div key={s.label} className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-mrp-text-muted mb-2">{s.label}</span>
            <div className="flex items-baseline gap-1">
              <span className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</span>
              {s.unit && <span className="text-sm text-mrp-text-muted">{s.unit}</span>}
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
                className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
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
            onClick={() => toast.success('Report Exported', { description: 'Vendor performance report downloaded' })}
            className="flex items-center gap-2 text-mrp-text-muted hover:text-white transition-colors text-[13px]"
          >
            <Download size={14} /> Export
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['Vendor ID', 'Name', 'Contact', 'Tier', 'Lead Time', 'Quality Score', 'On-Time Rate', 'Actions'].map((col) => (
                  <th
                    key={col}
                    className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${
                      ['Lead Time', 'Actions'].includes(col) ? 'text-right' : ''
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((vendor) => {
                const isExpanded = expandedRows.has(vendor.id)
                const qCfg = scoreColor(vendor.qualityScore)
                const oCfg = scoreColor(vendor.onTimeRate)
                const tCfg = tierBadge(vendor.tier)

                return (
                  <React.Fragment key={vendor.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors group ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-muted whitespace-nowrap">{vendor.id}</td>
                      <td className="py-3 px-4 text-[13px] text-white font-medium">{vendor.name}</td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{vendor.contact}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${tCfg.bg} border ${tCfg.border} ${tCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${tCfg.dot}`} />
                          {vendor.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{vendor.leadTime} days</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${qCfg.bg} border ${qCfg.border} ${qCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${qCfg.dot}`} />
                          {vendor.qualityScore}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${oCfg.bg} border ${oCfg.border} ${oCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${oCfg.dot}`} />
                          {vendor.onTimeRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRow(vendor.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                          >
                            {isExpanded ? 'Hide SKUs' : 'View SKUs'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button
                            onClick={() => toast.success('Edit Vendor', { description: `Editing ${vendor.name}` })}
                            className="p-1 border border-mrp-border text-mrp-text-muted bg-transparent rounded-sm transition-colors hover:bg-mrp-border hover:text-white"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded SKU Mapping */}
                    {isExpanded && (
                      <tr key={`${vendor.id}-expanded`} className="bg-[#1a1c1e] border-b border-mrp-border">
                        <td />
                        <td className="py-4 px-4 pb-6" colSpan={7}>
                          <div className="bg-mrp-panel border border-mrp-border rounded-sm p-4">
                            <div className="flex items-center justify-between mb-3 border-b border-mrp-border pb-2">
                              <h4 className="text-[11px] font-bold text-mrp-primary uppercase tracking-wider">
                                SKU Mapping — {vendor.name}
                              </h4>
                              <button
                                onClick={() => toast.success('Vendor Selected', { description: `${vendor.name} selected for PO generation` })}
                                className="flex items-center gap-1 px-3 py-1 text-mrp-primary border border-mrp-primary/40 hover:bg-mrp-primary hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider rounded-sm"
                              >
                                <ShieldCheck size={12} />
                                Select Vendor for PO
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-[13px]">
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">SKU</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Component Name</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Unit Price</div>
                              <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Lead Time</div>

                              {vendor.skuMappings.map((sku) => (
                                <React.Fragment key={sku.sku}>
                                  <div className="col-span-1 font-mono text-white border-t border-mrp-border pt-2">{sku.sku}</div>
                                  <div className="text-mrp-text-secondary border-t border-mrp-border pt-2">{sku.name}</div>
                                  <div className="text-right font-mono text-white border-t border-mrp-border pt-2">{sku.unitPrice}</div>
                                  <div className="text-right font-mono text-mrp-text-muted border-t border-mrp-border pt-2">{sku.leadTime} days</div>
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
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filtered.length} of {filtered.length} Vendors</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
              <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
                <option>10</option><option>20</option><option>50</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Panels: Risk Analysis */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vendor Risk Analysis Chart */}
        <div className="bg-mrp-panel border border-mrp-border p-6 rounded-sm flex flex-col justify-between h-64 overflow-hidden">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Vendor Risk Analysis — Supply Stability Index</h4>
            <span className="text-[10px] text-mrp-text-muted">Updated 12 min ago</span>
          </div>
          <div className="flex-1 flex items-end gap-2 pt-4 pb-1">
            {riskData.map((d) => {
              const barHeight = Math.round((d.value / 100) * 140)
              return (
                <div key={d.name} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-mono text-mrp-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                    {d.value}%
                  </span>
                  <div
                    className="w-full rounded-sm transition-all group-hover:opacity-80"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: `${d.hex}20`,
                      borderTop: `2px solid ${d.hex}`,
                    }}
                  />
                  <span className="text-[9px] text-mrp-text-muted font-mono">{d.name}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Regional Fulfillment Summary */}
        <div className="bg-mrp-panel border border-mrp-border p-6 rounded-sm flex flex-col justify-between h-64">
          <div className="flex items-center gap-2 mb-3">
            <Truck size={14} className="text-mrp-text-muted" />
            <h4 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Regional Fulfillment Summary</h4>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {[
              { region: 'East Asia (TW, KR, JP)', vendors: 5, avgLead: '18 days', status: 'Optimal' },
              { region: 'North America (US)', vendors: 2, avgLead: '13 days', status: 'Optimal' },
              { region: 'Southeast Asia (CN)', vendors: 1, avgLead: '35 days', status: 'At Risk' },
            ].map((r) => (
              <div key={r.region} className="bg-mrp-app border border-mrp-border rounded-sm p-3 flex items-center justify-between">
                <div>
                  <span className="text-[13px] text-white font-medium">{r.region}</span>
                  <div className="text-[11px] text-mrp-text-muted mt-0.5">{r.vendors} vendors · Avg. {r.avgLead}</div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                  r.status === 'Optimal'
                    ? 'bg-mrp-success/10 border border-mrp-success/20 text-mrp-success'
                    : 'bg-mrp-danger/10 border border-mrp-danger/20 text-mrp-danger'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Optimal' ? 'bg-mrp-success' : 'bg-mrp-danger animate-pulse'}`} />
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
