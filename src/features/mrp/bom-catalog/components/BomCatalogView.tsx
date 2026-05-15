'use client'

import { useState, useRef } from 'react'
import {
  FolderOpen, Folder, Cpu, MemoryStick, HardDrive, Monitor, Battery,
  CircuitBoard, Pencil, Plus, Trash2, X, PlusCircle, Filter, GitBranch,
} from 'lucide-react'
import { toast } from 'sonner'

interface ComponentItem { sku: string; qty: number; icon: React.ElementType }
interface Assembly { id: string; name: string; components: ComponentItem[] }
interface CatalogComponent {
  sku: string; name: string; type: string; description: string
  unitCost: string; whereUsed: { assembly: string; qty: number }[]
}
interface ModalRow { id: number; sku: string; qty: number }

const mockAssemblies: Assembly[] = [
  {
    id: '1', name: 'Zeus Workstation X1',
    components: [
      { sku: 'SOC-XM100-PRO', qty: 1, icon: Cpu },
      { sku: 'RAM-64G-DDR5', qty: 2, icon: MemoryStick },
      { sku: 'SSD-2T-NVME', qty: 1, icon: HardDrive },
      { sku: 'DISP-OLED-16', qty: 1, icon: Monitor },
      { sku: 'BATT-LIPO-99W', qty: 1, icon: Battery },
      { sku: 'MB-ZEUS-X1', qty: 1, icon: CircuitBoard },
    ],
  },
  {
    id: '2', name: 'Titan Gaming Pro',
    components: [
      { sku: 'SOC-XM100-ULTRA', qty: 1, icon: Cpu },
      { sku: 'RAM-32G-DDR5', qty: 2, icon: MemoryStick },
      { sku: 'SSD-1T-NVME', qty: 1, icon: HardDrive },
      { sku: 'GPU-RTX5080-M', qty: 1, icon: CircuitBoard },
      { sku: 'DISP-OLED-15', qty: 1, icon: Monitor },
      { sku: 'BATT-LIPO-80W', qty: 1, icon: Battery },
    ],
  },
  {
    id: '3', name: 'Aero Ultrabook S',
    components: [
      { sku: 'SOC-XM100-LT', qty: 1, icon: Cpu },
      { sku: 'RAM-16G-DDR5', qty: 1, icon: MemoryStick },
      { sku: 'SSD-512G-NVME', qty: 1, icon: HardDrive },
      { sku: 'DISP-IPS-13', qty: 1, icon: Monitor },
      { sku: 'BATT-LIPO-50W', qty: 1, icon: Battery },
      { sku: 'MB-AERO-S', qty: 1, icon: CircuitBoard },
    ],
  },
]

const mockCatalog: Record<string, CatalogComponent> = {
  'SOC-XM100-PRO': {
    sku: 'SOC-XM100-PRO', name: 'Zeus SOC XM100 Pro (14-Core)', type: 'Raw Material',
    description: 'High-performance system-on-chip with 14 neural cores and integrated ray-tracing units.',
    unitCost: '$580.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 1 }],
  },
  'RAM-64G-DDR5': {
    sku: 'RAM-64G-DDR5', name: '64GB DDR5-6400 ECC SO-DIMM', type: 'Raw Material',
    description: 'Enterprise-grade error-correcting memory for workstation reliability.',
    unitCost: '$210.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 2 }],
  },
  'SSD-2T-NVME': {
    sku: 'SSD-2T-NVME', name: '2TB NVMe Gen5 Enterprise SSD', type: 'Raw Material',
    description: 'Ultra-fast storage with 12,000MB/s sustained read speeds.',
    unitCost: '$185.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 1 }],
  },
  'DISP-OLED-16': {
    sku: 'DISP-OLED-16', name: '16" 4K ProArt OLED Panel', type: 'Raw Material',
    description: '120Hz OLED with 100% Adobe RGB coverage and Delta E < 1 calibration.',
    unitCost: '$420.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 1 }],
  },
  'BATT-LIPO-99W': {
    sku: 'BATT-LIPO-99W', name: '99.9Wh High-Density Li-Po Battery', type: 'Raw Material',
    description: 'Maximum flight-safe capacity with advanced thermal management.',
    unitCost: '$115.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 1 }],
  },
  'MB-ZEUS-X1': {
    sku: 'MB-ZEUS-X1', name: 'Zeus X1 Titanium Mainboard', type: 'Raw Material',
    description: 'Custom 12-layer PCB with gold-plated connectors and liquid metal support.',
    unitCost: '$650.00', whereUsed: [{ assembly: 'Zeus Workstation X1', qty: 1 }],
  },
  'GPU-RTX5080-M': {
    sku: 'GPU-RTX5080-M', name: 'NVIDIA RTX 5080 Mobile (16GB)', type: 'Raw Material',
    description: 'Next-gen Blackwell architecture for extreme mobile gaming performance.',
    unitCost: '$890.00', whereUsed: [{ assembly: 'Titan Gaming Pro', qty: 1 }],
  },
  'SOC-XM100-ULTRA': {
    sku: 'SOC-XM100-ULTRA', name: 'Zeus SOC XM100 Ultra (24-Core)', type: 'Raw Material',
    description: 'Flagship SOC with 24 high-performance cores for ultimate multitasking.',
    unitCost: '$920.00', whereUsed: [{ assembly: 'Titan Gaming Pro', qty: 1 }],
  },
}

const ALL_SKUS = Object.keys(mockCatalog)

export function BomCatalogView() {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('1')
  const [selectedSku, setSelectedSku] = useState('SOC-XM100-PRO')
  const [showModal, setShowModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalRows, setModalRows] = useState<ModalRow[]>([{ id: 1, sku: '', qty: 1 }])
  const [nextId, setNextId] = useState(2)
  const [activeRowId, setActiveRowId] = useState<number | null>(null)
  const [skuQuery, setSkuQuery] = useState('')
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  const selectedComponent = mockCatalog[selectedSku]

  const addRow = () => { setModalRows((p) => [...p, { id: nextId, sku: '', qty: 1 }]); setNextId((n) => n + 1) }
  const removeRow = (id: number) => setModalRows((p) => p.filter((r) => r.id !== id))
  const updateRow = (id: number, f: 'sku' | 'qty', v: string | number) =>
    setModalRows((p) => p.map((r) => r.id === id ? { ...r, [f]: v } : r))

  const handleSave = () => {
    if (!modalName.trim()) { toast.error('Assembly name is required'); return }
    toast.success('Assembly Created', { description: `"${modalName}" added to BOM` })
    setShowModal(false); setModalName(''); setModalRows([{ id: 1, sku: '', qty: 1 }])
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">BOM &amp; Catalog</h1>
          <p className="text-sm text-mrp-text-muted mt-1">Define hardware assemblies and manage the part catalog.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Create Product Assembly
        </button>
      </div>

      {/* Two-Panel Split */}
      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 200px)' }}>

        {/* Left Panel: BOM Tree */}
        <div className="w-[300px] shrink-0 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-mrp-border flex items-center justify-between">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Product Assemblies (BOM)</span>
            <Filter size={13} className="text-mrp-text-muted hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {mockAssemblies.map((assembly) => {
              const isSelected = selectedAssemblyId === assembly.id
              return (
                <div key={assembly.id}>
                  <div
                    className={`group flex items-center justify-between p-2 cursor-pointer transition-colors rounded-sm border-l-2 ${
                      isSelected ? 'bg-mrp-app border-mrp-primary' : 'border-transparent hover:bg-mrp-app hover:border-mrp-border'
                    }`}
                    onClick={() => { setSelectedAssemblyId(assembly.id); setSelectedSku(assembly.components[0].sku) }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSelected
                        ? <FolderOpen size={15} className="text-mrp-primary shrink-0" />
                        : <Folder size={15} className="text-mrp-text-muted shrink-0" />}
                      <span className={`text-[13px] font-semibold truncate ${isSelected ? 'text-mrp-primary' : 'text-mrp-text-secondary'}`}>
                        {assembly.name}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toast.success('Edit mode', { description: `Editing ${assembly.name}` }) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-mrp-text-muted hover:text-white shrink-0"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>

                  {isSelected && (
                    <div className="ml-5 mt-0.5 mb-2 border-l border-mrp-border pl-2 space-y-0.5">
                      {assembly.components.map((comp) => {
                        const Icon = comp.icon
                        return (
                          <div
                            key={comp.sku}
                            onClick={() => setSelectedSku(comp.sku)}
                            className={`flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-sm transition-colors ${
                              selectedSku === comp.sku ? 'bg-mrp-border/40 text-white' : 'text-mrp-text-muted hover:text-white hover:bg-mrp-app'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={13} className="shrink-0" />
                              <span className="text-[12px] font-mono">{comp.sku}</span>
                            </div>
                            <span className="text-[10px] text-mrp-text-muted shrink-0">Qty: {comp.qty}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel: Component Detail */}
        <div className="flex-1 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col overflow-hidden">
          <div className="p-3 border-b border-mrp-border flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Component Specification</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success('Component Updated', { description: `${selectedSku} spec saved` })}
                className="flex items-center gap-1 px-3 py-1 text-mrp-primary border border-mrp-primary/40 hover:bg-mrp-primary hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider rounded-sm"
              >
                <Pencil size={12} /> Edit Component
              </button>
              <button
                onClick={() => toast.error('Deleted', { description: `${selectedSku} removed` })}
                className="flex items-center gap-1 px-3 py-1 text-mrp-danger border border-mrp-danger/40 hover:bg-mrp-danger hover:text-white transition-all text-[11px] font-bold uppercase tracking-wider rounded-sm"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {selectedComponent && (
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Identity */}
              <div className="flex items-start justify-between gap-8">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-mrp-primary font-bold text-[13px]">{selectedComponent.sku}</span>
                    <span className="px-2 py-0.5 border border-mrp-success/30 bg-mrp-success/10 text-mrp-success text-[9px] uppercase font-bold tracking-widest rounded-sm">
                      {selectedComponent.type}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedComponent.name}</h2>
                  <p className="text-mrp-text-muted text-sm leading-relaxed">{selectedComponent.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-1">Unit Cost</div>
                  <div className="text-3xl font-bold font-mono text-white">{selectedComponent.unitCost}</div>
                </div>
              </div>

              {/* Where Used */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch size={14} className="text-mrp-text-muted" />
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Where Used (Dependencies)</h3>
                </div>
                <div className="border border-mrp-border rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-mrp-app border-b border-mrp-border">
                        <th className="px-4 py-2.5 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Parent Assembly</th>
                        <th className="px-4 py-2.5 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider text-right">Qty Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mrp-border">
                      {selectedComponent.whereUsed.map((u, i) => (
                        <tr key={i} className="hover:bg-mrp-app/50 transition-colors">
                          <td className="px-4 py-2.5 text-[13px] text-mrp-text-secondary">{u.assembly}</td>
                          <td className="px-4 py-2.5 text-[13px] text-white text-right font-mono">{u.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Assembly Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-mrp-panel border border-mrp-border w-full max-w-2xl rounded-sm shadow-2xl flex flex-col">
            <div className="p-4 border-b border-mrp-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create Product Assembly</h3>
              <button onClick={() => setShowModal(false)} className="text-mrp-text-muted hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider mb-2">Assembly Name</label>
                <input
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full bg-mrp-app border border-mrp-border text-white px-3 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm placeholder:text-mrp-text-muted"
                  placeholder="e.g. ThinkPad E16 Gen 2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider">Components</label>
                  <button onClick={addRow} className="text-mrp-primary text-[12px] font-bold flex items-center gap-1 hover:underline">
                    <PlusCircle size={13} /> Add Component
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                  <span className="col-span-7 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">SKU</span>
                  <span className="col-span-4 text-[10px] font-bold text-mrp-text-muted uppercase tracking-wider">Qty</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {modalRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <input
                          ref={(el) => { inputRefs.current[row.id] = el }}
                          type="text"
                          autoComplete="off"
                          placeholder="Type to search SKU..."
                          value={activeRowId === row.id ? skuQuery : row.sku}
                          onFocus={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
                            setActiveRowId(row.id)
                            setSkuQuery(row.sku)
                          }}
                          onChange={(e) => {
                            setSkuQuery(e.target.value)
                            setActiveRowId(row.id)
                            updateRow(row.id, 'sku', '')
                            // Update position in case layout shifted
                            const rect = e.currentTarget.getBoundingClientRect()
                            setDropdownPos({ top: rect.bottom + 2, left: rect.left, width: rect.width })
                          }}
                          onBlur={() => setTimeout(() => setActiveRowId(null), 150)}
                          className={`w-full bg-mrp-app border text-white px-2 py-2 text-[13px] font-mono focus:outline-none rounded-sm placeholder:text-mrp-text-muted placeholder:font-sans ${
                            row.sku ? 'border-mrp-primary/50' : 'border-mrp-border'
                          }`}
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="number" min={1}
                          value={row.qty}
                          onChange={(e) => updateRow(row.id, 'qty', Number(e.target.value))}
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
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-[11px] font-bold text-mrp-text-muted hover:text-white uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-[11px] font-bold bg-mrp-primary hover:bg-mrp-primary-hover text-white uppercase tracking-widest transition-colors rounded-sm"
              >
                Save Assembly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed-position SKU dropdown — rendered outside all overflow containers */}
      {showModal && activeRowId !== null && dropdownPos && (() => {
        const filteredSkus = ALL_SKUS.filter(s => s.toLowerCase().includes(skuQuery.toLowerCase()))
        return (
          <div
            className="fixed z-[9999] bg-mrp-panel border border-mrp-border rounded-sm shadow-2xl max-h-48 overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
          >
            {filteredSkus.length > 0 ? filteredSkus.map((s) => (
              <div
                key={s}
                onMouseDown={() => {
                  updateRow(activeRowId, 'sku', s)
                  setActiveRowId(null)
                  setSkuQuery('')
                }}
                className={`px-3 py-2 text-[12px] font-mono cursor-pointer transition-colors ${
                  s === (modalRows.find(r => r.id === activeRowId)?.sku)
                    ? 'bg-mrp-primary text-white'
                    : 'text-mrp-text-secondary hover:bg-mrp-app hover:text-white'
                }`}
              >
                {s}
              </div>
            )) : (
              <div className="px-3 py-3 text-[12px] text-mrp-text-muted">No matching SKUs</div>
            )}
          </div>
        )
      })()}
    </>
  )
}
