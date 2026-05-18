'use client'

import React, { useState } from 'react'
import { Search, Filter, Edit, X, Users, Building, User } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  tier: 'B2B' | 'B2C'
  address: string
  totalOrders: number
}

const mockCustomers: Customer[] = [
  { id: 'CLI-809', name: 'TechCorp Solutions', tier: 'B2B', address: '123 Innovation Drive, Silicon Valley, CA 94043', totalOrders: 145 },
  { id: 'CLI-442', name: 'Global Logistics', tier: 'B2B', address: 'Port Terminal 4, Seattle, WA 98101', totalOrders: 89 },
  { id: 'CLI-015', name: 'Nexus Retail', tier: 'B2C', address: '88 Retail Parkway, Austin, TX 78701', totalOrders: 12 },
  { id: 'CLI-999', name: 'Apex Data Centers', tier: 'B2B', address: 'Server Rack 12, Ashburn, VA 20147', totalOrders: 412 },
  { id: 'CLI-104', name: 'Sarah Jenkins', tier: 'B2C', address: '459 Willow Creek Rd, Denver, CO 80202', totalOrders: 3 },
  { id: 'CLI-223', name: 'Omega Manufacturing', tier: 'B2B', address: 'Factory Zone B, Detroit, MI 48201', totalOrders: 56 },
]

export function CustomersView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const filteredCustomers = mockCustomers.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = () => {
    toast.success('Customer Updated', { description: `Profile for ${editingCustomer?.id} saved successfully.` })
    setEditingCustomer(null)
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Client Registry</h1>
        <p className="text-sm text-mrp-text-secondary mt-1">
          Manage customer profiles, default shipping destinations, and account tiers.
        </p>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Client ID or Name..."
              className="w-full bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-3 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted"
            />
          </div>
          
          <div className="flex items-center border border-mrp-border bg-mrp-panel rounded-sm px-2 py-1.5">
            <Filter size={14} className="text-mrp-text-muted mr-2" />
            <select className="bg-transparent text-[13px] text-white focus:outline-none cursor-pointer">
              <option className="bg-mrp-panel">All Tiers</option>
              <option className="bg-mrp-panel">B2B (Enterprise)</option>
              <option className="bg-mrp-panel">B2C (Retail)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Client ID</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Name</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-center">Tier</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Default Destination Address</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Total Lifetime Orders</th>
                <th className="py-3 px-4 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-mrp-panel transition-colors group">
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary">
                      {customer.id}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium flex items-center gap-2">
                      {customer.tier === 'B2B' ? <Building size={14} className="text-mrp-text-muted" /> : <User size={14} className="text-mrp-text-muted" />}
                      {customer.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider ${
                        customer.tier === 'B2B' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-green-500/10 text-green-400 border border-green-500/20'
                      }`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary truncate max-w-xs" title={customer.address}>
                      {customer.address}
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white text-right">
                      {customer.totalOrders}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => setEditingCustomer(customer)}
                        className="p-1.5 text-mrp-text-muted hover:text-mrp-primary hover:bg-mrp-primary/10 rounded-sm transition-colors"
                        title="Edit Customer"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-mrp-text-muted text-[13px]">
                    No customers found matching "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setEditingCustomer(null)}
          />

          <div className="relative w-full max-w-lg bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl flex flex-col">

            <div className="px-6 py-4 border-b border-mrp-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-mrp-primary" /> Edit Customer Profile
              </h2>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-mrp-text-muted hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Client ID</label>
                  <input 
                    type="text" 
                    value={editingCustomer.id} 
                    disabled 
                    className="w-full bg-mrp-app/50 border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-mrp-text-secondary font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Total Orders</label>
                  <input 
                    type="text" 
                    value={editingCustomer.totalOrders} 
                    disabled 
                    className="w-full bg-mrp-app/50 border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-mrp-text-secondary font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Client Name</label>
                <input 
                  type="text" 
                  defaultValue={editingCustomer.name} 
                  className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Account Tier</label>
                <select 
                  defaultValue={editingCustomer.tier}
                  className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary cursor-pointer"
                >
                  <option value="B2B">B2B (Enterprise)</option>
                  <option value="B2C">B2C (Retail)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Default Destination Address</label>
                <textarea 
                  rows={3}
                  defaultValue={editingCustomer.address} 
                  className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-mrp-border bg-mrp-app/50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 text-[13px] font-medium text-mrp-text-muted hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-5 py-2 bg-mrp-primary text-white text-[13px] font-medium rounded-sm hover:bg-mrp-primary-hover transition-colors"
              >
                Save Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}