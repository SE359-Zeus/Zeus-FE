'use client'

import { useState } from 'react'
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
    id: '1', name: 'Dell XPS 15 (9530)',
    components: [
      { sku: 'CPU-I7-13700H', qty: 1, icon: Cpu },
      { sku: 'RAM-16G-DDR5-5600', qty: 2, icon: MemoryStick },
      { sku: 'SSD-1T-NVME-GEN4', qty: 1, icon: HardDrive },
      { sku: 'DISP-15-4K-OLED', qty: 1, icon: Monitor },
      { sku: 'BAT-86WHR', qty: 1, icon: Battery },
      { sku: 'MB-XPS15-9530', qty: 1, icon: CircuitBoard },
    ],
  },
  {
    id: '2', name: 'ThinkPad X1 Carbon Gen 11',
    components: [
      { sku: 'CPU-I7-1365U', qty: 1, icon: Cpu },
      { sku: 'RAM-16G-DDR5-5600', qty: 1, icon: MemoryStick },
      { sku: 'SSD-512G-NVME-GEN4', qty: 1, icon: HardDrive },
      { sku: 'DISP-14-2K-IPS', qty: 1, icon: Monitor },
      { sku: 'BAT-57WHR', qty: 1, icon: Battery },
      { sku: 'MB-X1C-GEN11', qty: 1, icon: CircuitBoard },
    ],
  },
  {
    id: '3', name: 'ASUS ROG Zephyrus G14 (2024)',
    components: [
      { sku: 'CPU-R9-7940HS', qty: 1, icon: Cpu },
      { sku: 'RAM-32G-DDR5-5600', qty: 2, icon: MemoryStick },
      { sku: 'SSD-1T-NVME-GEN4', qty: 1, icon: HardDrive },
      { sku: 'GPU-RX7600S', qty: 1, icon: CircuitBoard },
      { sku: 'DISP-14-2K-IPS', qty: 1, icon: Monitor },
      { sku: 'BAT-72WHR', qty: 1, icon: Battery },
    ],
  },
]

const mockCatalog: Record<string, CatalogComponent> = {
  'CPU-I7-13700H': {
    sku: 'CPU-I7-13700H', name: 'Intel Core i7-13700H Processor', type: 'Raw Material',
    description: '13th Gen Intel® Core™ i7-13700H, 24MB cache, 14 cores, 20 threads, up to 5.00 GHz Turbo. Optimized for high-performance mobile workstations.',
    unitCost: '$452.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 1 }],
  },
  'RAM-16G-DDR5-5600': {
    sku: 'RAM-16G-DDR5-5600', name: '16GB DDR5-5600 SODIMM', type: 'Raw Material',
    description: '16GB DDR5-5600MHz SODIMM, CL46, 1.1V. Compatible with 12th/13th Gen Intel mobile platforms.',
    unitCost: '$68.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 2 }, { assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }],
  },
  'SSD-1T-NVME-GEN4': {
    sku: 'SSD-1T-NVME-GEN4', name: '1TB NVMe PCIe Gen4 M.2 SSD', type: 'Raw Material',
    description: 'PCIe Gen4x4 NVMe M.2 2280. Up to 7,400MB/s read, 6,900MB/s write. AES-256 hardware encryption.',
    unitCost: '$89.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 1 }, { assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 1 }],
  },
  'DISP-15-4K-OLED': {
    sku: 'DISP-15-4K-OLED', name: '15.6" 4K OLED Display Panel', type: 'Raw Material',
    description: 'Samsung OLED 3840×2400, 120Hz, 0.2ms, 100% DCI-P3, 400nit peak, DisplayHDR True Black 500.',
    unitCost: '$310.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 1 }],
  },
  'BAT-86WHR': {
    sku: 'BAT-86WHR', name: '86 Whr 6-Cell Li-Ion Battery', type: 'Raw Material',
    description: '86 Whr 6-cell Li-Ion, 11.4V, integrated BMS with thermal protection. Up to 13h typical usage.',
    unitCost: '$95.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 1 }],
  },
  'MB-XPS15-9530': {
    sku: 'MB-XPS15-9530', name: 'Dell XPS 15 9530 Mainboard', type: 'Raw Material',
    description: 'OEM mainboard for XPS 15 9530. Dual DDR5 SO-DIMM, 2× M.2 Gen4, Thunderbolt 4, Wi-Fi 6E.',
    unitCost: '$520.00', whereUsed: [{ assembly: 'Dell XPS 15 (9530)', qty: 1 }],
  },
  'CPU-I7-1365U': {
    sku: 'CPU-I7-1365U', name: 'Intel Core i7-1365U Processor', type: 'Raw Material',
    description: '13th Gen Core™ i7-1365U, 12MB cache, 10 cores, up to 5.20 GHz. 15W TDP for ultra-thin business.',
    unitCost: '$298.00', whereUsed: [{ assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }],
  },
  'SSD-512G-NVME-GEN4': {
    sku: 'SSD-512G-NVME-GEN4', name: '512GB NVMe PCIe Gen4 M.2 SSD', type: 'Raw Material',
    description: 'PCIe Gen4x4 NVMe M.2 2280. Up to 7,000MB/s read, 5,500MB/s write. Power-loss protection.',
    unitCost: '$49.00', whereUsed: [{ assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }],
  },
  'DISP-14-2K-IPS': {
    sku: 'DISP-14-2K-IPS', name: '14" 2K IPS Anti-Glare Display', type: 'Raw Material',
    description: 'IPS 2560×1600, 60Hz, 400nit, 100% sRGB, anti-glare. TÜV Rheinland low blue-light certified.',
    unitCost: '$185.00', whereUsed: [{ assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }, { assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 1 }],
  },
  'BAT-57WHR': {
    sku: 'BAT-57WHR', name: '57 Whr 4-Cell Li-Polymer Battery', type: 'Raw Material',
    description: '57 Whr, 15.44V. Rapid Charge 0–80% in ~1hr. Compatible with 65W and 135W USB-C PD.',
    unitCost: '$72.00', whereUsed: [{ assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }],
  },
  'MB-X1C-GEN11': {
    sku: 'MB-X1C-GEN11', name: 'ThinkPad X1 Carbon Gen 11 Mainboard', type: 'Raw Material',
    description: 'OEM mainboard for X1 Carbon Gen 11. Single DDR5 SO-DIMM, 2× M.2 2280, Thunderbolt 4.',
    unitCost: '$480.00', whereUsed: [{ assembly: 'ThinkPad X1 Carbon Gen 11', qty: 1 }],
  },
  'CPU-R9-7940HS': {
    sku: 'CPU-R9-7940HS', name: 'AMD Ryzen 9 7940HS Processor', type: 'Raw Material',
    description: 'Ryzen™ 9 7940HS, 8C/16T, up to 5.2GHz, 16MB L3. TSMC 4nm. Radeon 780M iGPU. 35–54W TDP.',
    unitCost: '$389.00', whereUsed: [{ assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 1 }],
  },
  'RAM-32G-DDR5-5600': {
    sku: 'RAM-32G-DDR5-5600', name: '32GB DDR5-5600 SODIMM', type: 'Raw Material',
    description: '32GB DDR5-5600MHz SODIMM, CL46, 1.1V. XMP 3.0 / EXPO profile. For gaming and creator laptops.',
    unitCost: '$128.00', whereUsed: [{ assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 2 }],
  },
  'GPU-RX7600S': {
    sku: 'GPU-RX7600S', name: 'AMD Radeon RX 7600S Mobile GPU', type: 'Raw Material',
    description: 'RDNA 3, 8GB GDDR6, 128-bit bus, 100W TGP. DirectX 12 Ultimate, AV1 encode, FSR 3.0.',
    unitCost: '$290.00', whereUsed: [{ assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 1 }],
  },
  'BAT-72WHR': {
    sku: 'BAT-72WHR', name: '72 Whr 4-Cell Li-Polymer Battery', type: 'Raw Material',
    description: '72 Whr, 15.4V. Up to 10h runtime. 240W USB-C PD fast charge, 0–50% in 30 minutes.',
    unitCost: '$88.00', whereUsed: [{ assembly: 'ASUS ROG Zephyrus G14 (2024)', qty: 1 }],
  },
}

const ALL_SKUS = Object.keys(mockCatalog)

export function BomCatalogPage() {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('1')
  const [selectedSku, setSelectedSku] = useState('CPU-I7-13700H')
  const [showModal, setShowModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalRows, setModalRows] = useState<ModalRow[]>([{ id: 1, sku: '', qty: 1 }])
  const [nextId, setNextId] = useState(2)

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
                        <select
                          value={row.sku}
                          onChange={(e) => updateRow(row.id, 'sku', e.target.value)}
                          className="w-full bg-mrp-app border border-mrp-border text-white px-2 py-2 text-[13px] focus:border-mrp-primary focus:outline-none rounded-sm"
                        >
                          <option value="">Select SKU...</option>
                          {ALL_SKUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
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
    </>
  )
}
