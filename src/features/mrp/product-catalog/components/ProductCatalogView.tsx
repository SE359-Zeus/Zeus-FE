'use client'

import React, { useState, useEffect } from 'react'
import {
  FolderOpen, Folder, Cpu, MemoryStick, HardDrive, Monitor, Battery, RefreshCw,
  CircuitBoard, Plus, Trash2, X, PlusCircle, GitBranch, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { apiGet, apiPost, apiDelete } from '@/lib/axios.client'

interface ComponentItem { 
  sku: string
  qty: number
}

interface AssemblyDetail { 
  model_code: string
  name: string
  description?: string
  total_parts?: number
  components: ComponentItem[] 
}

interface CatalogItem {
  model_code: string
  model_name?: string
  description?: string
  price?: number
  unit_price: number
  type?: string
}

interface WhereUsedItem {
  parent_model: string
  required_qty: number
}

interface ModalRow { 
  id: number
  sku: string
  name: string
  qty: number
}

const getIconForSku = (sku: string) => {
  const upperSku = sku.toUpperCase()
  if (upperSku.includes('SOC') || upperSku.includes('CPU')) return Cpu
  if (upperSku.includes('RAM') || upperSku.includes('MEM')) return MemoryStick
  if (upperSku.includes('SSD') || upperSku.includes('HDD')) return HardDrive
  if (upperSku.includes('DISP') || upperSku.includes('LCD')) return Monitor
  if (upperSku.includes('BATT')) return Battery
  return CircuitBoard
}

export function BomCatalogView() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [selectedSku, setSelectedSku] = useState<string | null>(null)
  const [selectedSubSku, setSelectedSubSku] = useState<string | null>(null)
  
  const [assemblyDetails, setAssemblyDetails] = useState<Record<string, AssemblyDetail | null>>({})
  const [loadingAssemblies, setLoadingAssemblies] = useState<Record<string, boolean>>({})
  const [whereUsedData, setWhereUsedData] = useState<WhereUsedItem[]>([])
  const [isWhereUsedLoading, setIsWhereUsedLoading] = useState(false)
  
  const [showModal, setShowModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalRows, setModalRows] = useState<ModalRow[]>([{ id: 1, sku: '', name: '', qty: 1 }])
  const [nextId, setNextId] = useState(2)

  const [activeRowId, setActiveRowId] = useState<number | null>(null)
  const [skuQuery, setSkuQuery] = useState('')
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const ALL_PARTS = catalog.map(item => ({ 
    sku: item.model_code, 
    name: item.model_name || 'Unknown Part' 
  }))

  const fetchCatalogData = async () => {
    setIsLoading(true)
    try {
      const res = await apiGet<any>('/mrp/catalog')
      const dataList = Array.isArray(res.data) ? res.data : []
      
      dataList.sort((a, b) => {
        const nameA = a.model_name || a.model_code || ''
        const nameB = b.model_name || b.model_code || ''
        return nameA.localeCompare(nameB)
      })

      setCatalog(dataList)
    } catch (error) {
      toast.error('Sync Error', { description: 'Cannot load Catalog directory.' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCatalogData()
  }, [])

  const handleToggleCatalogItem = async (identifier: string) => {
    const isExpanded = !!expandedItems[identifier]
    
    setExpandedItems(prev => ({ ...prev, [identifier]: !isExpanded }))
    setSelectedSku(identifier)
    setSelectedSubSku(null)

    if (!isExpanded && assemblyDetails[identifier] === undefined) {
      setLoadingAssemblies(prev => ({ ...prev, [identifier]: true }))
      try {
        const res = await apiGet<any>(`/mrp/assemblies/${identifier}`)
        setAssemblyDetails(prev => ({ ...prev, [identifier]: res.data || null }))
      } catch (error) {
        setAssemblyDetails(prev => ({ ...prev, [identifier]: null }))
      } finally {
        setLoadingAssemblies(prev => ({ ...prev, [identifier]: false }))
      }
    }
  }

  useEffect(() => {
    if (selectedSubSku) {
      const fetchWhereUsed = async () => {
        setIsWhereUsedLoading(true)
        try {
          const res = await apiGet<any>(`/mrp/catalog/${selectedSubSku}/where-used`)
          setWhereUsedData(Array.isArray(res.data) ? res.data : [])
        } catch (error) {
          setWhereUsedData([])
        } finally {
          setIsWhereUsedLoading(false)
        }
      }
      fetchWhereUsed()
    }
  }, [selectedSubSku])

  const addRow = () => { 
    setModalRows((p) => [...p, { id: nextId, sku: '', name: '', qty: 1 }])
    setNextId((n) => n + 1) 
  }
  
  const removeRow = (id: number) => setModalRows((p) => p.filter((r) => r.id !== id))
  
  const updateRowQty = (id: number, qty: number) =>
    setModalRows((p) => p.map((r) => r.id === id ? { ...r, qty } : r))

  const handleCreateAssembly = async () => {
    if (!modalName.trim()) return toast.error('Validation Error', { description: 'Assembly name is required' })
    const validComponents = modalRows.filter(r => r.sku.trim() !== '' && r.qty > 0)
    if (validComponents.length === 0) return toast.error('Validation Error', { description: 'At least one component is required' })

    try {
      const payload = {
        name: modalName,
        components: validComponents.map(r => ({ sku: r.sku, qty: r.qty }))
      }
      await apiPost('/mrp/assemblies', payload)
      toast.success('Created', { description: `Assembly mapped to ${modalName}` })
      setShowModal(false)
      setModalName('')
      setModalRows([{ id: 1, sku: '', name: '', qty: 1 }])
      fetchCatalogData()
    } catch (error) {
      toast.error('Create Failed', { description: 'Cannot save assembly configuration.' })
    }
  }

  const handleDeleteAssembly = async (sku: string) => {
    if (!window.confirm(`Delete assembly configuration for ${sku}?`)) return
    try {
      await apiDelete(`/mrp/assemblies/${sku}`)
      toast.success('Deleted', { description: 'Assembly structure removed.' })
      setAssemblyDetails(prev => { const next = {...prev}; delete next[sku]; return next; })
      setExpandedItems(prev => ({...prev, [sku]: false}))
    } catch (error) {
      toast.error('Failed', { description: 'Cannot delete linked assembly.' })
    }
  }

  const displaySku = selectedSubSku || selectedSku
  const displayCatalogInfo = displaySku ? catalog.find(c => c.model_code === displaySku) : null
  const displayAssemblyDetail = selectedSku ? assemblyDetails[selectedSku] : null
  const currentPrice = displayCatalogInfo?.unit_price ?? 0

  return (
    <>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Product Catalog</h1>
          <p className="text-sm text-mrp-text-muted mt-1">Manage standard parts and trace engineering bill of materials (BOM).</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Create BOM Link
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="w-[340px] shrink-0 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-mrp-border flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Catalog Directory</span>
            <button onClick={fetchCatalogData} className="text-mrp-text-muted hover:text-white transition-colors">
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
               <div className="flex justify-center py-8 text-mrp-text-muted"><Loader2 className="animate-spin" size={20} /></div>
            ) : catalog.length === 0 ? (
               <div className="text-center py-4 text-[12px] text-mrp-text-muted">No items in catalog.</div>
            ) : catalog.map((item, catalogIndex) => {
              const identifier = item.model_code
              const isExpanded = !!expandedItems[identifier]
              const isSelected = selectedSku === identifier
              const detail = assemblyDetails[identifier]
              const isDetailLoading = loadingAssemblies[identifier]

              return (
                <div key={`catalog-${identifier}-${catalogIndex}`}>
                  <div
                    className={`group flex items-start justify-between p-2.5 cursor-pointer transition-colors rounded-sm border-l-2 ${
                      isSelected && selectedSubSku === null ? 'bg-mrp-app border-mrp-primary' : 'border-transparent hover:bg-mrp-app hover:border-mrp-border'
                    }`}
                    onClick={() => handleToggleCatalogItem(identifier)}
                  >
                    <div className="flex gap-2 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {isExpanded ? <FolderOpen size={15} className="text-mrp-primary" /> : <Folder size={15} className="text-mrp-text-muted" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[13px] font-bold truncate ${isSelected && selectedSubSku === null ? 'text-mrp-primary' : 'text-mrp-text-main'}`}>
                          {item.model_name || identifier}
                        </span>
                        {item.description && (
                          <span className="text-[11px] text-mrp-text-secondary truncate mt-0.5">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-5 mt-1 mb-2 border-l border-mrp-border pl-2 space-y-1">
                      {isDetailLoading ? (
                        <div className="py-2 flex items-center gap-2 text-mrp-text-muted text-[11px]">
                          <Loader2 size={12} className="animate-spin" /> Resolving BOM dependencies...
                        </div>
                      ) : detail?.components && detail.components.length > 0 ? (
                        detail.components.map((comp, bomIndex) => {
                          const Icon = getIconForSku(comp.sku)
                          const isSubSelected = selectedSubSku === comp.sku
                          return (
                            <div
                              key={`bom-${identifier}-${comp.sku}-${bomIndex}`}
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setSelectedSku(identifier); 
                                setSelectedSubSku(comp.sku); 
                              }}
                              className={`flex items-center justify-between px-2 py-2 cursor-pointer rounded-sm transition-colors ${
                                isSubSelected ? 'bg-mrp-border text-white shadow-sm' : 'text-mrp-text-muted hover:text-white hover:bg-mrp-app'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon size={13} className="shrink-0 text-mrp-text-muted" />
                                <span className="text-[12px] font-mono truncate">{comp.sku}</span>
                              </div>
                              <span className="text-[10px] font-bold bg-mrp-app border border-mrp-border px-1.5 py-0.5 rounded-sm shrink-0">
                                x{comp.qty}
                              </span>
                            </div>
                          )
                        })
                      ) : (
                        <div className="py-1.5 pl-2 text-[11px] text-mrp-text-muted italic flex items-center gap-1.5">
                          Raw material — No sub-components.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-mrp-border flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">
              {selectedSubSku ? 'Part Usage & Dependencies' : selectedSku ? 'Catalog Item Overview' : 'Select an item'}
            </span>
            {selectedSku && !selectedSubSku && displayAssemblyDetail && (
              <button
                onClick={() => handleDeleteAssembly(selectedSku)}
                className="flex items-center gap-1 px-3 py-1 text-mrp-danger border border-mrp-danger/40 hover:bg-mrp-danger hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider rounded-sm"
              >
                <Trash2 size={12} /> Clear BOM Map
              </button>
            )}
          </div>

          {displaySku && (selectedSku || selectedSubSku) ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-mrp-primary font-bold text-[13px]">{displayCatalogInfo?.model_code || displaySku}</span>
                    <span className="px-2 py-0.5 border border-mrp-primary/30 bg-mrp-primary/10 text-mrp-primary text-[9px] uppercase font-bold tracking-widest rounded-sm">
                      {selectedSubSku ? 'SUB-COMPONENT' : (displayAssemblyDetail ? 'PRODUCT ASSEMBLY' : 'RAW MATERIAL')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {selectedSubSku ? (catalog.find(c => c.model_code === displaySku)?.model_name || `Component ${displaySku}`) : (displayCatalogInfo?.model_name || displayAssemblyDetail?.name || 'Unregistered Model')}
                  </h2>
                  <p className="text-mrp-text-muted text-sm leading-relaxed">
                    {!selectedSubSku && (displayCatalogInfo?.description || displayAssemblyDetail?.description || 'No system description provided.')}
                  </p>
                </div>
                {!selectedSubSku && (
                  <div className="text-right shrink-0">
                    <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1">Valuation Cost</div>
                    <div className="text-3xl font-bold font-mono text-white">${currentPrice.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {selectedSubSku ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GitBranch size={14} className="text-mrp-text-muted" />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Component Usage</h3>
                  </div>
                  <div className="border border-mrp-border rounded-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-mrp-app border-b border-mrp-border">
                          <th className="px-4 py-2.5 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Product Assembly</th>
                          <th className="px-4 py-2.5 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Qty Per Build</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-mrp-border">
                        {isWhereUsedLoading ? (
                          <tr><td colSpan={2} className="px-4 py-4 text-center"><Loader2 size={16} className="animate-spin text-mrp-primary mx-auto"/></td></tr>
                        ) : whereUsedData.length === 0 ? (
                          <tr><td colSpan={2} className="px-4 py-4 text-center text-[12px] text-mrp-text-muted">Part is not utilized in any active assembly configurations.</td></tr>
                        ) : whereUsedData.map((u, wuIndex) => {
                          const catalogMatch = catalog.find(c => c.model_code === u.parent_model)
                          const displayName = catalogMatch?.model_name || u.parent_model

                          return (
                            <tr key={`wu-${u.parent_model}-${wuIndex}`} className="hover:bg-mrp-app/50 transition-colors">
                              <td className="px-4 py-2.5 text-[13px] text-mrp-text-secondary">
                                {displayName}
                              </td>
                              <td className="px-4 py-2.5 text-[13px] text-white text-right font-mono">
                                x{u.required_qty}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CircuitBoard size={14} className="text-mrp-text-muted" />
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Bill of Materials</h3>
                  </div>
                  <div className="bg-mrp-app border border-mrp-border p-4 rounded-sm">
                    {displayAssemblyDetail ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-[13px] text-mrp-text-secondary">
                          This product contains <strong className="text-white">{displayAssemblyDetail.components.length}</strong> components.
                        </span>
                        <span className="text-[12px] text-mrp-text-muted">
                          Expand the item in the left directory to view the complete list of parts.
                        </span>
                      </div>
                    ) : (
                      <span className="text-[13px] text-mrp-text-muted italic">This item is classified as a raw material. It does not have an underlying assembly BOM structure.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-mrp-text-muted text-[13px]">
              Select an item from the catalog tree directory to inspect parameters.
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-2xl rounded-sm shadow-2xl flex flex-col">
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create BOM Link</h3>
              <button onClick={() => setShowModal(false)} className="text-mrp-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Target Catalog SKU</label>
                <input
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted font-mono"
                  placeholder="Enter parent SKU (e.g., ZW-X1-TITAN)"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Required Components</label>
                  <button onClick={addRow} className="text-mrp-primary text-[12px] font-bold flex items-center gap-1 hover:underline">
                    <PlusCircle size={13} /> Add Sub-Part
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                  <span className="col-span-7 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Sub-Part SKU</span>
                  <span className="col-span-4 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Quantity</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {modalRows.map((row) => (
                    <div key={`modal-row-${row.id}`} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7 relative">
                        <input
                          type="text"
                          autoComplete="off"
                          placeholder="Search SKU or Name..."
                          value={activeRowId === row.id ? skuQuery : (row.sku ? `${row.sku} (${row.name})` : '')}
                          onFocus={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
                            setActiveRowId(row.id)
                            setSkuQuery('')
                          }}
                          onChange={(e) => {
                            setSkuQuery(e.target.value)
                            setActiveRowId(row.id)
                            setModalRows(prev => prev.map(r => r.id === row.id ? { ...r, sku: '', name: '' } : r))
                          }}
                          onBlur={() => setTimeout(() => setActiveRowId(null), 150)}
                          className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-2 text-[13px] font-mono focus:outline-none focus:border-mrp-primary rounded-sm placeholder:text-mrp-text-muted placeholder:font-sans"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number" min={1}
                          value={row.qty}
                          onChange={(e) => updateRowQty(row.id, Number(e.target.value))}
                          className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeRow(row.id)} className="text-mrp-text-muted hover:text-mrp-danger transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-mrp-border bg-mrp-app/40 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateAssembly} className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm">
                Save BOM Map
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && activeRowId !== null && dropdownPos && (() => {
        const filteredParts = ALL_PARTS.filter(p => 
          p.sku.toLowerCase().includes(skuQuery.toLowerCase()) || 
          p.name.toLowerCase().includes(skuQuery.toLowerCase())
        )
        return (
          <div 
            className="fixed z-[9999] bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl max-h-48 overflow-y-auto" 
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {filteredParts.length > 0 ? filteredParts.map((p, dropIndex) => (
              <div
                key={`drop-${p.sku}-${dropIndex}`}
                onMouseDown={() => {
                  setModalRows(prev => prev.map(r => r.id === activeRowId ? { ...r, sku: p.sku, name: p.name } : r))
                  setActiveRowId(null)
                  setSkuQuery('')
                }}
                className="px-3 py-2 text-[12px] cursor-pointer hover:bg-mrp-app hover:text-white text-mrp-text-secondary transition-colors"
              >
                <span className="font-mono font-bold text-mrp-primary">{p.sku}</span>
                <span className="ml-2">— {p.name}</span>
              </div>
            )) : (
              <div className="px-3 py-3 text-[12px] text-mrp-text-muted">No match found</div>
            )}
          </div>
        )
      })()}
    </>
  )
}