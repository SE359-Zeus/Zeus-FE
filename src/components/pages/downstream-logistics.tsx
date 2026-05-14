'use client'

import React, { useState } from 'react'
import {
  RefreshCw, Download, Lock, Unlock, ChevronDown, ChevronUp,
  Truck, ShieldCheck, Gauge, Package, Check, Eye, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

type DSPStatus = 'Packing' | 'Dispatched' | 'Delivered'
type Priority = 'High' | 'Normal' | 'Low'
type FilterType = 'ALL' | DSPStatus

interface PickItem { product: string; sku: string; qty: number; location: string; picked: boolean }

interface Dispatch {
  id: string; soRef: string; customer: string; city: string
  product: string; priority: Priority; status: DSPStatus
  carrier: string | null; operator: string
  lockedBy: string | null; lockMinutes: number | null
  pickList: PickItem[]; shippingCost: string; trackingNo: string
}

const mockDispatches: Dispatch[] = [
  {
    id: 'DSP-2024-501', soRef: 'SO-2024-801', customer: 'Acme Corp', city: 'New York, NY',
    product: 'Zeus Workstation X1 (x10)', priority: 'High', status: 'Packing',
    carrier: null, operator: 'A. Jensen', lockedBy: 'self', lockMinutes: 30,
    shippingCost: '450.00', trackingNo: '',
    pickList: [
      { product: 'Zeus Workstation X1', sku: 'ZW-102-X', qty: 6, location: 'A2-R4-S1', picked: true },
      { product: 'Zeus Workstation X1', sku: 'ZW-102-X', qty: 4, location: 'A2-R4-S1', picked: false },
    ],
  },
  {
    id: 'DSP-2024-502', soRef: 'SO-2024-802', customer: 'Stark Industries', city: 'Malibu, CA',
    product: 'Titan Gaming Pro (x5)', priority: 'Normal', status: 'Dispatched',
    carrier: 'FedEx Priority', operator: 'L. Zhang', lockedBy: null, lockMinutes: null,
    shippingCost: '780.00', trackingNo: '794644790568',
    pickList: [{ product: 'Titan Gaming Pro', sku: 'TGP-200-X', qty: 5, location: 'B1-R2-S3', picked: true }],
  },
  {
    id: 'DSP-2024-503', soRef: 'SO-2024-803', customer: 'Wayne Enterprises', city: 'Gotham City',
    product: 'Zeus Workstation X1 (x8)', priority: 'High', status: 'Packing',
    carrier: null, operator: 'K. Smith', lockedBy: 'L. Zhang', lockMinutes: 24,
    shippingCost: '', trackingNo: '',
    pickList: [{ product: 'Zeus Workstation X1', sku: 'ZW-102-X', qty: 8, location: 'A2-R4-S1', picked: false }],
  },
  {
    id: 'DSP-2024-504', soRef: 'SO-2024-804', customer: 'Umbrella Corp', city: 'Raccoon City',
    product: 'Aero Ultrabook S (x25)', priority: 'Low', status: 'Delivered',
    carrier: 'UPS Ground', operator: 'M. Park', lockedBy: null, lockMinutes: null,
    shippingCost: '1200.00', trackingNo: '1Z999AA10123456784',
    pickList: [{ product: 'Aero Ultrabook S', sku: 'AUS-300-S', qty: 25, location: 'C3-R1-S2', picked: true }],
  },
  {
    id: 'DSP-2024-505', soRef: 'SO-2024-805', customer: 'Cyberdyne Systems', city: 'Los Angeles, CA',
    product: 'Titan Gaming Pro (x12)', priority: 'Normal', status: 'Dispatched',
    carrier: 'DHL Express', operator: 'A. Jensen', lockedBy: null, lockMinutes: null,
    shippingCost: '950.00', trackingNo: '1234567890',
    pickList: [{ product: 'Titan Gaming Pro', sku: 'TGP-200-X', qty: 12, location: 'B1-R2-S3', picked: true }],
  },
  {
    id: 'DSP-2024-506', soRef: 'SO-2024-806', customer: 'OsCorp', city: 'Singapore',
    product: 'Zeus Workstation X1 (x15)', priority: 'Normal', status: 'Packing',
    carrier: null, operator: 'J. Chen', lockedBy: null, lockMinutes: null,
    shippingCost: '', trackingNo: '',
    pickList: [
      { product: 'Zeus Workstation X1', sku: 'ZW-102-X', qty: 10, location: 'A2-R4-S1', picked: false },
      { product: 'Zeus Workstation X1', sku: 'ZW-102-X', qty: 5, location: 'A3-R1-S2', picked: false },
    ],
  },
  {
    id: 'DSP-2024-507', soRef: 'SO-2024-807', customer: 'Stark Industries', city: 'Malibu, CA',
    product: 'Aero Ultrabook S (x20)', priority: 'Low', status: 'Delivered',
    carrier: 'Maersk Shipping', operator: 'L. Zhang', lockedBy: null, lockMinutes: null,
    shippingCost: '4500.00', trackingNo: 'MAEU1234567',
    pickList: [{ product: 'Aero Ultrabook S', sku: 'AUS-300-S', qty: 20, location: 'C3-R1-S2', picked: true }],
  },
]

const statusCfg: Record<DSPStatus, { bg: string; border: string; text: string; dot: string; pulse: boolean }> = {
  Packing:    { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', dot: 'bg-mrp-warning', pulse: true },
  Dispatched: { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', dot: 'bg-mrp-primary', pulse: false },
  Delivered:  { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', dot: 'bg-mrp-success', pulse: false },
}

const priorityCfg: Record<Priority, { bg: string; border: string; text: string }> = {
  High:   { bg: 'bg-mrp-danger/10', border: 'border-mrp-danger/20', text: 'text-mrp-danger' },
  Normal: { bg: 'bg-mrp-border/30', border: 'border-mrp-border', text: 'text-mrp-text-secondary' },
  Low:    { bg: 'bg-mrp-border/20', border: 'border-mrp-border', text: 'text-mrp-text-muted' },
}

const STEPS: DSPStatus[] = ['Packing', 'Dispatched', 'Delivered']
const CARRIERS = ['DHL Express', 'FedEx International', 'UPS Freight', 'Maersk Shipping', 'Local Courier']
const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'All' }, { key: 'Packing', label: 'Packing' },
  { key: 'Dispatched', label: 'Dispatched' }, { key: 'Delivered', label: 'Delivered' },
]

function stepState(current: DSPStatus, step: DSPStatus): 'done' | 'current' | 'future' {
  const ci = STEPS.indexOf(current), si = STEPS.indexOf(step)
  return si < ci ? 'done' : si === ci ? 'current' : 'future'
}

export function DownstreamLogisticsPage() {
  const [filter, setFilter] = useState<FilterType>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>('DSP-2024-501')

  const filtered = filter === 'ALL' ? mockDispatches : mockDispatches.filter((d) => d.status === filter)

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Downstream Logistics</h1>
          <p className="text-sm text-mrp-text-muted mt-1">Manage outbound shipments, packing workflows, and carrier dispatching.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => toast.info('Refreshed')} className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => toast.success('Manifest exported')} className="px-4 py-2 border border-mrp-border bg-transparent text-white text-sm font-medium hover:bg-mrp-panel transition-colors flex items-center gap-2 rounded-sm">
            <Download size={16} /> Export Manifest
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Dispatch', value: '12', color: 'text-mrp-warning', accent: 'border-l-mrp-warning', pulse: true },
          { label: 'In Transit', value: '28', color: 'text-mrp-primary', accent: 'border-l-mrp-primary' },
          { label: 'Delivered Today', value: '15', color: 'text-mrp-success', accent: 'border-l-mrp-success' },
          { label: 'Total Freight Cost (Today)', value: '$12,450', color: 'text-white', accent: 'border-l-white' },
        ].map((k) => (
          <div key={k.label} className={`bg-mrp-panel border border-mrp-border p-4 rounded-sm border-l-4 ${k.accent}`}>
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">{k.label}</span>
            <div className="flex items-baseline gap-2 mt-3">
              <span className={`font-mono text-2xl font-bold ${k.color}`}>{k.value}</span>
              {k.pulse && <span className="w-2 h-2 rounded-full bg-mrp-warning animate-pulse" />}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex items-center gap-2">
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-sm text-[12px] font-medium transition-colors ${
                filter === key ? 'bg-mrp-primary text-white' : 'bg-mrp-app border border-mrp-border text-mrp-text-muted hover:text-white hover:bg-mrp-border'
              }`}>{label}</button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                {['Dispatch ID', 'SO Ref', 'Customer / Destination', 'Product', 'Priority', 'Status', 'Carrier', 'Actions'].map((h) => (
                  <th key={h} className={`py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filtered.map((dsp) => {
                const sCfg = statusCfg[dsp.status]
                const pCfg = priorityCfg[dsp.priority]
                const isExpanded = expandedId === dsp.id
                const isLockedByOther = dsp.lockedBy !== null && dsp.lockedBy !== 'self'
                const isSelfLock = dsp.lockedBy === 'self'

                return (
                  <React.Fragment key={dsp.id}>
                    <tr className={`hover:bg-mrp-panel transition-colors ${isExpanded ? 'bg-mrp-panel' : ''}`}>
                      <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary whitespace-nowrap">{dsp.id}</td>
                      <td className="py-3 px-4 font-mono text-[13px] text-white">{dsp.soRef}</td>
                      <td className="py-3 px-4">
                        <div className="text-[13px] text-white font-medium">{dsp.customer}</div>
                        <div className="text-[11px] text-mrp-text-muted">{dsp.city}</div>
                      </td>
                      <td className="py-3 px-4 text-[13px] text-mrp-text-secondary">{dsp.product}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${pCfg.bg} border ${pCfg.border} ${pCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          {dsp.priority === 'High' && <AlertTriangle size={10} />}
                          {dsp.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 ${sCfg.bg} border ${sCfg.border} ${sCfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sCfg.dot}${sCfg.pulse ? ' animate-pulse' : ''}`} />
                          {dsp.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[12px] text-mrp-text-muted">{dsp.carrier ?? '---'}</td>
                      <td className="py-3 px-4 text-right">
                        {isLockedByOther ? (
                          <Lock size={16} className="text-mrp-text-muted inline-block opacity-50" />
                        ) : dsp.status === 'Packing' && !isSelfLock ? (
                          <button onClick={() => { setExpandedId(isExpanded ? null : dsp.id); if (!isExpanded) toast.info(`Lock acquired for ${dsp.id}`, { description: '30 min packing session started.' }) }}
                            className="px-3 py-1.5 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-[12px] font-medium transition-colors">Pack Order</button>
                        ) : isSelfLock ? (
                          <button onClick={() => setExpandedId(isExpanded ? null : dsp.id)}
                            className="p-1 text-mrp-primary hover:text-white transition-colors">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        ) : (
                          <button onClick={() => setExpandedId(isExpanded ? null : dsp.id)}
                            className="px-3 py-1.5 border border-mrp-border text-white hover:bg-mrp-border rounded-sm text-[12px] font-medium transition-colors">View Details</button>
                        )}
                      </td>
                    </tr>

                    {/* Lock Banner */}
                    {isLockedByOther && (
                      <tr className="bg-mrp-danger/5">
                        <td colSpan={8} className="py-2.5 px-6 border-b border-mrp-danger/10">
                          <div className="flex items-center gap-3 text-[12px] text-mrp-danger/90">
                            <Lock size={14} />
                            <span>🔒 [{dsp.lockedBy}] is packing this order. Lock expires in [{dsp.lockMinutes}] minutes.</span>
                            <button disabled className="ml-auto px-3 py-1 bg-mrp-border text-mrp-text-muted rounded-sm text-[11px] opacity-50 cursor-not-allowed">Pack Order</button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Expanded Packing Detail */}
                    {isExpanded && (
                      <tr className="bg-[#1a1c1e]">
                        <td colSpan={8} className="p-0 border-b border-mrp-border">
                          <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left: Pick list + stepper */}
                              <div className="lg:col-span-2 space-y-5">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-[14px] font-bold text-white">Packing Detail</h3>
                                    {isSelfLock && (
                                      <div className="flex items-center gap-1.5 text-mrp-success text-[12px] mt-1">
                                        <Unlock size={14} /> You hold the lock (Expires in {dsp.lockMinutes} min)
                                      </div>
                                    )}
                                  </div>
                                  {/* Stepper */}
                                  <div className="flex items-center gap-2">
                                    {STEPS.map((step, i) => {
                                      const state = stepState(dsp.status, step)
                                      return (
                                        <React.Fragment key={step}>
                                          <div className="flex flex-col items-center gap-1">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                              state === 'done' ? 'bg-mrp-primary' : state === 'current' ? 'bg-mrp-primary' : 'bg-mrp-border'
                                            }`}>
                                              {state === 'done' ? <Check size={14} className="text-white" />
                                                : state === 'current' ? <Package size={12} className="text-white" />
                                                : <span className="w-2 h-2 rounded-full bg-mrp-text-muted" />}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                              state === 'current' ? 'text-mrp-primary' : state === 'done' ? 'text-white' : 'text-mrp-text-muted opacity-50'
                                            }`}>{step}</span>
                                          </div>
                                          {i < STEPS.length - 1 && <div className="w-8 h-0.5 bg-mrp-border mt-[-12px]" />}
                                        </React.Fragment>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Pick List */}
                                <div className="bg-mrp-app border border-mrp-border rounded-sm overflow-hidden">
                                  <table className="w-full text-left border-collapse text-[13px]">
                                    <thead className="border-b border-mrp-border">
                                      <tr>
                                        <th className="py-2.5 px-4 w-10" />
                                        <th className="py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Item (Product + SKU)</th>
                                        <th className="py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Qty</th>
                                        <th className="py-2.5 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Location</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-mrp-border">
                                      {dsp.pickList.map((item, idx) => (
                                        <tr key={idx} className={item.picked ? 'opacity-40 line-through' : ''}>
                                          <td className="py-2.5 px-4 text-center">
                                            <input type="checkbox" defaultChecked={item.picked} className="rounded border-mrp-border bg-mrp-panel accent-mrp-primary h-3.5 w-3.5" />
                                          </td>
                                          <td className="py-2.5 px-4 text-mrp-text-secondary">{item.product} — <span className="font-mono text-white">{item.sku}</span></td>
                                          <td className="py-2.5 px-4 font-mono text-white text-right">{item.qty}</td>
                                          <td className="py-2.5 px-4 font-mono text-mrp-text-muted">{item.location}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <p className="text-[11px] text-mrp-text-muted italic">ⓘ Data syncs to Sales & Financial modules</p>
                              </div>

                              {/* Right: Freight data */}
                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Carrier</label>
                                  <select defaultValue={dsp.carrier ?? ''} className="w-full bg-mrp-app border border-mrp-border rounded-sm p-2 text-[13px] text-white focus:border-mrp-primary focus:outline-none">
                                    <option value="" disabled>Select carrier...</option>
                                    {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Shipping Cost ($)</label>
                                    <input type="text" defaultValue={dsp.shippingCost} placeholder="0.00"
                                      className="w-full bg-mrp-app border border-mrp-border rounded-sm p-2 font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Tracking No.</label>
                                    <input type="text" defaultValue={dsp.trackingNo} placeholder="Pending..."
                                      className="w-full bg-mrp-app border border-mrp-border rounded-sm p-2 font-mono text-[12px] text-white focus:border-mrp-primary focus:outline-none placeholder:text-mrp-text-muted" />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Notes</label>
                                  <textarea placeholder="Add logistics notes or handling instructions..."
                                    className="w-full bg-mrp-app border border-mrp-border rounded-sm p-2 text-[13px] text-white focus:border-mrp-primary focus:outline-none h-20 resize-none placeholder:text-mrp-text-muted" />
                                </div>
                                <div className="pt-3 flex gap-3">
                                  <button onClick={() => setExpandedId(null)}
                                    className="flex-1 px-4 py-2 border border-mrp-border text-white rounded-sm text-[13px] hover:bg-mrp-border transition-colors">Cancel</button>
                                  <button onClick={() => {
                                    toast.success(`${dsp.id} dispatched`, { description: `Shipped via carrier. Inventory updated.` })
                                    setExpandedId(null)
                                  }}
                                    className="flex-1 px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white font-bold rounded-sm text-[13px] transition-colors">Confirm Dispatch</button>
                                </div>
                              </div>
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

        <div className="px-4 py-3 border-t border-mrp-border bg-mrp-panel flex items-center justify-between">
          <span className="text-[13px] text-mrp-text-muted">Showing 1-{filtered.length} of {filtered.length} Dispatches</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-mrp-text-muted">Rows per page:</span>
            <select className="border border-mrp-border rounded-sm bg-mrp-app text-white text-[13px] py-1 pl-2 pr-8 focus:border-mrp-primary focus:outline-none">
              <option>10</option><option>20</option><option>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Summary Cards */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { icon: <Truck size={24} className="text-mrp-primary" />, title: 'Active Carriers', desc: '3 Carriers connected and syncing API data.' },
          { icon: <ShieldCheck size={24} className="text-mrp-success" />, title: 'QA Integrity Score', desc: '99.8% accurate packing list validation today.' },
          { icon: <Gauge size={24} className="text-mrp-text-secondary" />, title: 'Average Dispatch Time', desc: '42 mins from sales order to carrier handoff.' },
        ].map((c) => (
          <div key={c.title} className="bg-mrp-panel border border-mrp-border rounded-sm p-5 flex items-center gap-5">
            <div className="h-14 w-14 bg-mrp-app border border-mrp-border rounded-sm flex items-center justify-center shrink-0">{c.icon}</div>
            <div>
              <h4 className="text-[13px] font-bold text-white">{c.title}</h4>
              <p className="text-[11px] text-mrp-text-muted mt-0.5">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
