'use client'

import React, { useState, useEffect } from 'react'
import { Search, Filter, Edit, X, Users, Building, User, Plus, Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/axios.client'

interface ClientModel {
  id: string
  name: string
  tier: 'B2B' | 'B2C'
  default_destination_address: string
  total_lifetime_orders: number
}

export function CustomersView() {
  const [clients, setClients] = useState<ClientModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')
  
  const [editingCustomer, setEditingCustomer] = useState<ClientModel | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [customerToDelete, setCustomerToDelete] = useState<ClientModel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({ name: '', tier: 'B2B', address: '' })

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const params: any = { page: 1, pageSize: 50 }
      if (tierFilter !== 'ALL') params.tiers = tierFilter

      const response = await apiGet<ClientModel[]>('/sales/clients', { params })
      setClients(response.data || [])
    } catch (error) {
      toast.error('Error loading data', { description: 'Unable to connect to the server.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [tierFilter])

  const filteredCustomers = clients.filter(c => 
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = async () => {
    if (!formData.name) return toast.error('Validation Error', { description: 'Client name is required.' })
    try {
      await apiPost('/sales/clients', {
        name: formData.name,
        tier: formData.tier,
        defaultDestinationAddress: formData.address
      })
      toast.success('Success', { description: 'New client profile created successfully.' })
      setShowCreateModal(false)
      await fetchClients()
    } catch (error) {
      toast.error('Failed', { description: 'Unable to create client (Name might already exist).' })
    }
  }

  const handleUpdate = async () => {
    if (!editingCustomer) return
    try {
      await apiPatch(`/sales/clients/${editingCustomer.id}`, {
        name: formData.name,
        tier: formData.tier,
        defaultDestinationAddress: formData.address
      })
      toast.success('Success', { description: 'Client updated successfully.' })
      setEditingCustomer(null)
      await fetchClients()
    } catch (error) {
      toast.error('Failed', { description: 'Error occurred while updating client data.' })
    }
  }

  const confirmDelete = (client: ClientModel) => {
    setCustomerToDelete(client)
  }

  const executeDelete = async () => {
    if (!customerToDelete) return
    setIsDeleting(true)
    
    try {
      await apiDelete(`/sales/clients/${customerToDelete.id}`)
      toast.success('Deleted', { description: 'Client profile has been removed.' })
      setCustomerToDelete(null)
      await fetchClients() 
    } catch (error) {
      toast.error('Delete Failed', { description: 'Unable to delete this client.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', tier: 'B2B', address: '' })
    setShowCreateModal(true)
  }

  const openEditModal = (client: ClientModel) => {
    setFormData({ 
      name: client.name, 
      tier: client.tier, 
      address: client.default_destination_address || '' 
    })
    setEditingCustomer(client)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Client Registry</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">Manage customer profiles, default shipping destinations, and account tiers.</p>
        </div>
        <button onClick={openCreateModal} className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2">
          <Plus size={16} className="shrink-0" /> Add Client
        </button>
      </div>

      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-mrp-border bg-mrp-app flex flex-wrap items-center gap-4">
          <div className="relative w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Client ID or Name..." className="w-full bg-mrp-panel border border-mrp-border rounded-sm text-[13px] pl-9 pr-3 py-1.5 focus:outline-none focus:border-mrp-primary text-white placeholder-mrp-text-muted" />
          </div>
          
          <div className="flex items-center border border-mrp-border bg-mrp-panel rounded-sm px-2 py-1.5">
            <Filter size={14} className="text-mrp-text-muted mr-2" />
            <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="bg-transparent text-[13px] text-white focus:outline-none cursor-pointer">
              <option value="ALL" className="bg-mrp-panel">All Tiers</option>
              <option value="B2B" className="bg-mrp-panel">B2B (Enterprise)</option>
              <option value="B2C" className="bg-mrp-panel">B2C (Retail)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-mrp-app/50 flex items-center justify-center z-20">
              <Loader2 className="animate-spin text-mrp-primary" size={24} />
            </div>
          )}
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
                    <td className="py-3 px-4 font-mono text-[13px] text-mrp-primary truncate max-w-[120px]">
                      CLI-{String(customer.id).substring(0, 6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-white font-medium flex items-center gap-2">
                      {customer.tier === 'B2B' ? <Building size={14} className="text-mrp-text-muted" /> : <User size={14} className="text-mrp-text-muted" />}
                      {customer.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider ${customer.tier === 'B2B' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {customer.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-mrp-text-secondary truncate max-w-[200px]" title={customer.default_destination_address}>
                      {customer.default_destination_address || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[13px] text-white text-right">{customer.total_lifetime_orders}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(customer)} className="p-1.5 text-mrp-text-muted hover:text-mrp-primary hover:bg-mrp-primary/10 rounded-sm transition-colors" title="Edit Customer">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => confirmDelete(customer)} className="p-1.5 text-mrp-text-muted hover:text-mrp-danger hover:bg-mrp-danger/10 rounded-sm transition-colors" title="Delete Customer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="py-8 text-center text-mrp-text-muted text-[13px]">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(editingCustomer || showCreateModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => editingCustomer ? setEditingCustomer(null) : setShowCreateModal(false)} />
          <div className="relative w-full max-w-lg bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-mrp-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-mrp-primary" /> {editingCustomer ? 'Edit Customer Profile' : 'Add New Client'}
              </h2>
              <button onClick={() => editingCustomer ? setEditingCustomer(null) : setShowCreateModal(false)} className="text-mrp-text-muted hover:text-white transition-colors p-1"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              {editingCustomer && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Client ID</label>
                    <input type="text" value={`CLI-${String(editingCustomer.id).substring(0, 6).toUpperCase()}`} disabled className="w-full bg-mrp-app/50 border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-mrp-text-secondary font-mono cursor-not-allowed truncate" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Total Orders</label>
                    <input type="text" value={editingCustomer.total_lifetime_orders} disabled className="w-full bg-mrp-app/50 border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-mrp-text-secondary font-mono cursor-not-allowed" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Client Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary" placeholder="e.g. Acme Corporation" />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Account Tier</label>
                <select value={formData.tier} onChange={(e) => setFormData({...formData, tier: e.target.value as 'B2B'|'B2C'})} className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary cursor-pointer">
                  <option value="B2B" className="bg-mrp-panel">B2B (Enterprise)</option>
                  <option value="B2C" className="bg-mrp-panel">B2C (Retail)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1.5">Default Destination Address</label>
                <textarea rows={3} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-mrp-app border border-mrp-border rounded-sm px-3 py-2 text-[13px] text-white focus:outline-none focus:border-mrp-primary resize-none" placeholder="Enter physical shipping address..." />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-mrp-border bg-mrp-app/50 flex justify-end gap-3">
              <button onClick={() => editingCustomer ? setEditingCustomer(null) : setShowCreateModal(false)} className="px-4 py-2 text-[13px] font-medium text-mrp-text-muted hover:text-white transition-colors">Cancel</button>
              <button onClick={editingCustomer ? handleUpdate : handleCreate} className="px-5 py-2 bg-mrp-primary text-white text-[13px] font-medium rounded-sm hover:bg-mrp-primary-hover transition-colors">
                {editingCustomer ? 'Save Profile' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isDeleting && setCustomerToDelete(null)} />
          <div className="relative w-full max-w-md bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl flex flex-col transform transition-all">
            
            <div className="px-6 py-4 border-b border-mrp-border flex items-center justify-between bg-mrp-danger/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-mrp-danger" /> 
                Confirm Deletion
              </h2>
              <button 
                onClick={() => !isDeleting && setCustomerToDelete(null)} 
                className="text-mrp-text-muted hover:text-white transition-colors p-1"
                disabled={isDeleting}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-[13px] text-mrp-text-secondary leading-relaxed">
                Are you sure you want to permanently delete the client <strong className="text-white font-medium">{customerToDelete.name}</strong>?
              </p>
              <p className="text-[13px] text-mrp-text-secondary mt-2">
                This action cannot be undone and will remove all associated profile data from the system.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-mrp-border bg-mrp-app/50 flex justify-end gap-3">
              <button 
                onClick={() => setCustomerToDelete(null)} 
                disabled={isDeleting} 
                className="px-4 py-2 text-[13px] font-medium text-mrp-text-muted hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                disabled={isDeleting} 
                className="px-4 py-2 bg-[#C9190B] text-white text-[13px] font-medium rounded-sm hover:bg-[#A31509] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isDeleting ? 'Deleting...' : 'Delete Client'}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}