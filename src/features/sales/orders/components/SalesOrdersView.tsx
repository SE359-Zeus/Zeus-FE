'use client'

import React, { useState } from 'react'
import { 
  Search, Filter, Calendar, X, Lock, Unlock, 
  MapPin, Package, ShoppingCart, DollarSign, CheckCircle, Factory 
} from 'lucide-react'
import { toast } from 'sonner'

interface LineItem { sku: string; qty: number; unitPrice: string }
interface Order {
  id: string
  clientId: string
  clientName: string
  requiredDate: string
  totalValue: string
  status: 'pending' | 'processing' | 'delivering' | 'completed'
  isLocked: boolean
  destination: string
  items: LineItem[]
}

const mockOrders: Order[] = [
  {
    id: 'SO-2605-001', clientId: 'CLI-809', clientName: 'TechCorp Solutions',
    requiredDate: '2026-05-20', totalValue: '$75,000.00', status: 'pending',
    isLocked: false, destination: '123 Innovation Drive, Silicon Valley, CA 94043',
    items: [
      { sku: 'PROD-ZEUS-X1', qty: 10, unitPrice: '$4,500.00' },
      { sku: 'PROD-AERO-S', qty: 20, unitPrice: '$1,500.00' }
    ]
  },
  {
    id: 'SO-2605-002', clientId: 'CLI-442', clientName: 'Global Logistics',
    requiredDate: '2026-05-18', totalValue: '$140,000.00', status: 'processing',
    isLocked: true, destination: 'Port Terminal 4, Seattle, WA 98101',
    items: [
      { sku: 'PROD-TITAN-P', qty: 50, unitPrice: '$2,800.00' }
    ]
  },
  {
    id: 'SO-2605-003', clientId: 'CLI-015', clientName: 'Nexus Retail (B2C)',
    requiredDate: '2026-05-19', totalValue: '$7,500.00', status: 'delivering',
    isLocked: true, destination: '88 Retail Parkway, Austin, TX 78701',
    items: [
      { sku: 'PROD-AERO-S', qty: 5, unitPrice: '$1,500.00' }
    ]
  },
  {
    id: 'SO-2605-004', clientId: 'CLI-999', clientName: 'Apex Data Centers',
    requiredDate: '2026-05-15', totalValue: '$170,000.00', status: 'completed',
    isLocked: true, destination: 'Server Rack 12, Ashburn, VA 20147',
    items: [
      { sku: 'PROD-SERV-R1', qty: 20, unitPrice: '$8,500.00' } 
    ]
  }
]

const statusConfig = {
  pending: { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400', label: 'Pending' },
  processing: { bg: 'bg-mrp-primary/10', border: 'border-mrp-primary/20', text: 'text-mrp-primary', label: 'Processing' },
  delivering: { bg: 'bg-mrp-warning/10', border: 'border-mrp-warning/20', text: 'text-mrp-warning', label: 'Delivering' },
  completed: { bg: 'bg-mrp-success/10', border: 'border-mrp-success/20', text: 'text-mrp-success', label: 'Completed' },
}

export function SalesOrdersView() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Sales Orders</h1>
        <p className="text-sm text-mrp-text-secondary mt-1">
          Monitor inbound client demand, track lifecycle states, and resolve concurrency locks.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Total Pending Orders</span>
            <ShoppingCart size={14} className="text-gray-400" />
          </div>
          <span className="font-mono font-bold text-2xl text-white mt-3">42</span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between border-l-4 border-l-mrp-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Active Processing Value</span>
            <DollarSign size={14} className="text-mrp-primary" />
          </div>
          <span className="font-mono font-bold text-2xl text-mrp-primary mt-3">$128,450.00</span>
        </div>
        <div className="bg-mrp-panel border border-mrp-border p-4 rounded-sm flex flex-col justify-between border-l-4 border-l-mrp-success">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">24-Hour Completed</span>
            <CheckCircle size={14} className="text-mrp-success" />
          </div>
          <span className="font-mono font-bold text-2xl text-mrp-success mt-3">18</span>
        </div>
      </div>
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        {/* Filter Toolbar */}
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-4">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              type="text"
              placeholder="Search by Client ID or Name..."
              className="w-full bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-3 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted"
            />
          </div>
          
          <div className="flex items-center border border-mrp-border bg-mrp-panel rounded-sm px-2 py-1.5">
            <Filter size={14} className="text-mrp-text-muted mr-2" />
            <select className="bg-transparent text-[13px] text-white focus:outline-none cursor-pointer">
              <option className="bg-mrp-panel">All States</option>
              <option className="bg-mrp-panel">Pending</option>
              <option className="bg-mrp-panel">Processing</option>
              <option className="bg-mrp-panel">Delivering</option>
              <option className="bg-mrp-panel">Completed</option>
            </select>
          </div>

          <div className="flex items-center border border-mrp-border bg-mrp-panel rounded-sm px-2 py-1.5 gap-2">
            <Calendar size={14} className="text-mrp-text-muted" />
            <input 
              type="date" 
              className="bg-transparent text-[13px] text-mrp-text-secondary focus:outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Order ID</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Client Name</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Required Date</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Total Value</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {mockOrders.map((order) => {
                const cfg = statusConfig[order.status]
                return (
                  <tr 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-mrp-panel transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary group-hover:underline">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium">
                      {order.clientName} <span className="text-mrp-text-muted font-mono text-[11px] ml-1">({order.clientId})</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-text-secondary">
                      {order.requiredDate}
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white text-right">
                      {order.totalValue}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center gap-1.5 ${cfg.bg} border ${cfg.border} ${cfg.text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.text.replace('text-', 'bg-')}`} />
                        {cfg.label}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedOrder && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-[550px] bg-mrp-panel border-l border-mrp-border z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="px-6 py-5 border-b border-mrp-border flex items-start justify-between bg-mrp-app/50 shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white font-mono">{selectedOrder.id}</h2>
                  <div className={`inline-flex items-center gap-1.5 ${statusConfig[selectedOrder.status].bg} border ${statusConfig[selectedOrder.status].border} ${statusConfig[selectedOrder.status].text} px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider`}>
                    {statusConfig[selectedOrder.status].label}
                  </div>
                </div>
                <p className="text-[13px] text-mrp-text-secondary">{selectedOrder.clientName} ({selectedOrder.clientId})</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-mrp-text-muted hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className={`p-4 rounded-sm border flex items-start gap-3 ${selectedOrder.isLocked ? 'bg-mrp-warning/10 border-mrp-warning/20' : 'bg-mrp-success/10 border-mrp-success/20'}`}>
                {selectedOrder.isLocked ? (
                  <Lock size={18} className="text-mrp-warning shrink-0 mt-0.5" />
                ) : (
                  <Unlock size={18} className="text-mrp-success shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`text-[13px] font-bold ${selectedOrder.isLocked ? 'text-mrp-warning' : 'text-mrp-success'}`}>
                    {selectedOrder.isLocked ? 'Allocation Lock Active' : 'Order Unlocked'}
                  </h4>
                  <p className="text-[12px] text-mrp-text-secondary mt-1">
                    {selectedOrder.isLocked 
                      ? 'The Fulfillment Orchestrator currently holds a read/write lock. External modifications are disabled.' 
                      : 'This order is in Pending state. Full API modification is currently allowed.'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <MapPin size={14} /> Destination Address
                </h3>
                <div className="bg-mrp-app border border-mrp-border p-3 rounded-sm text-[13px] text-white">
                  {selectedOrder.destination}
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Package size={14} /> Requested SKUs
                </h3>
                <div className="border border-mrp-border rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-mrp-app border-b border-mrp-border">
                      <tr>
                        <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">SKU</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Qty</th>
                        <th className="px-3 py-2 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mrp-border">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-mrp-app/50 transition-colors">
                          <td className="px-3 py-2 text-[13px] font-mono text-white">{item.sku}</td>
                          <td className="px-3 py-2 text-[13px] font-mono text-white text-right">{item.qty}</td>
                          <td className="px-3 py-2 text-[13px] font-mono text-mrp-text-secondary text-right">{item.unitPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-mrp-border bg-mrp-app/50 flex justify-end gap-3 shrink-0">
              
              <button 
                onClick={() => toast.error('Action denied', { description: 'Cannot delete locked order' })}
                disabled={selectedOrder.isLocked}
                className="px-4 py-2 border border-mrp-danger/40 text-mrp-danger text-[13px] font-medium rounded-sm hover:bg-mrp-danger hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel Order
              </button>
              
              {selectedOrder.status === 'pending' && (
                <button 
                  onClick={() => toast.success('Atomic RESERVE Triggered', { description: 'Inventory soft-locked in MRP Product Catalog.' })}
                  className="px-4 py-2 bg-mrp-primary text-white text-[13px] font-medium rounded-sm hover:bg-mrp-primary-hover transition-colors flex items-center gap-2"
                >
                  <Package size={14} />
                  Reserve Inventory (MRP)
                </button>
              )}

              {selectedOrder.status === 'processing' && (
                <>
                  <button 
                    onClick={() => toast.warning('Force Allocation Executed', { description: 'Bypassing queue for partial fulfillment.' })}
                    className="px-4 py-2 border border-mrp-warning/40 text-mrp-warning text-[13px] font-medium rounded-sm hover:bg-mrp-warning hover:text-white transition-colors flex items-center gap-2"
                  >
                    Force Allocation
                  </button>

                  <button 
                    onClick={() => toast.success('Manufacturing Order Created', { description: 'Sales Order pipeline successfully transmitted to MRP production queue.' })}
                    className="px-4 py-2 bg-mrp-primary/20 text-mrp-primary border border-mrp-primary/50 text-[13px] font-medium rounded-sm hover:bg-mrp-primary hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Factory size={14} />
                    Convert to MO (MRP)
                  </button>

                  <button 
                    onClick={() => toast.success('Manifest Transmitted', { description: 'Dispatch trigger sent to SCM Logistics.' })}
                    className="px-4 py-2 bg-mrp-success/20 text-mrp-success border border-mrp-success/50 text-[13px] font-medium rounded-sm hover:bg-mrp-success hover:text-white transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart size={14} />
                    Dispatch Manifest (SCM)
                  </button>
                </>
              )}
              
              {(selectedOrder.status === 'delivering' || selectedOrder.status === 'completed') && (
                <button 
                  onClick={() => toast.info('Logistics Tracking', { description: 'Fetching tracking data from SCM...' })}
                  className="px-4 py-2 bg-mrp-panel border border-mrp-border text-white text-[13px] font-medium rounded-sm hover:bg-mrp-border transition-colors flex items-center gap-2"
                >
                  <MapPin size={14} />
                  Track Shipment
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
