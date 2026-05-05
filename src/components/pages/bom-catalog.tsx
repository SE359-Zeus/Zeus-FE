'use client'

import { useState } from 'react'
import { FolderOpen, Cpu, MemoryStick, CircuitBoard, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ComponentItem {
  sku: string
  name: string
  qty: number
  icon: React.ElementType
}

interface Assembly {
  id: string
  name: string
  components: ComponentItem[]
}

interface CatalogComponent {
  sku: string
  name: string
  type: string
  description: string
  unitCost: string
  whereUsed: { assembly: string; qty: number }[]
}

const mockAssemblies: Assembly[] = [
  {
    id: '1',
    name: 'Workstation Alpha',
    components: [
      { sku: 'CPU-I7-13650HX', name: 'Intel Core i7-13650HX', qty: 1, icon: Cpu },
      { sku: 'RAM-16G-DDR5', name: '16GB DDR5-4800', qty: 2, icon: MemoryStick },
      { sku: 'MB-Z790-WIFI', name: 'Z790 WiFi Motherboard', qty: 1, icon: CircuitBoard },
    ],
  },
  {
    id: '2',
    name: 'Gaming Rig Beta',
    components: [
      { sku: 'CPU-I9-13900K', name: 'Intel Core i9-13900K', qty: 1, icon: Cpu },
      { sku: 'RAM-32G-DDR5', name: '32GB DDR5-5600', qty: 2, icon: MemoryStick },
      { sku: 'GPU-RTX4080', name: 'RTX 4080 16GB', qty: 1, icon: CircuitBoard },
    ],
  },
  {
    id: '3',
    name: 'Office Desktop Std',
    components: [
      { sku: 'CPU-I5-13400', name: 'Intel Core i5-13400', qty: 1, icon: Cpu },
      { sku: 'RAM-8G-DDR4', name: '8GB DDR4-3200', qty: 2, icon: MemoryStick },
      { sku: 'SSD-512G-NVME', name: '512GB NVMe SSD', qty: 1, icon: CircuitBoard },
    ],
  },
]

const mockCatalogComponents: Record<string, CatalogComponent> = {
  'CPU-I7-13650HX': {
    sku: 'CPU-I7-13650HX',
    name: 'Intel Core i7-13650HX Processor',
    type: 'Raw Material',
    description: 'Intel Core i7-13650HX Processor 24M Cache, up to 4.90 GHz. Target architecture x86_64.',
    unitCost: '$315.00',
    whereUsed: [
      { assembly: 'Workstation Alpha', qty: 1 },
      { assembly: 'Gaming Rig Beta', qty: 1 },
    ],
  },
  'RAM-16G-DDR5': {
    sku: 'RAM-16G-DDR5',
    name: '16GB DDR5-4800 SODIMM',
    type: 'Raw Material',
    description: '16GB DDR5-4800 SODIMM Memory Module, CL40 latency, 1.1V operating voltage.',
    unitCost: '$52.00',
    whereUsed: [
      { assembly: 'Workstation Alpha', qty: 2 },
    ],
  },
  'MB-Z790-WIFI': {
    sku: 'MB-Z790-WIFI',
    name: 'Z790 WiFi Motherboard',
    type: 'Raw Material',
    description: 'ATX Form Factor, LGA 1700 Socket, DDR5 Support, WiFi 6E, 2.5G LAN, PCIe 5.0.',
    unitCost: '$189.00',
    whereUsed: [
      { assembly: 'Workstation Alpha', qty: 1 },
    ],
  },
  'CPU-I9-13900K': {
    sku: 'CPU-I9-13900K',
    name: 'Intel Core i9-13900K Processor',
    type: 'Raw Material',
    description: 'Intel Core i9-13900K 24-Core, 36M Cache, up to 5.80 GHz. Unlocked for overclocking.',
    unitCost: '$549.00',
    whereUsed: [
      { assembly: 'Gaming Rig Beta', qty: 1 },
    ],
  },
  'RAM-32G-DDR5': {
    sku: 'RAM-32G-DDR5',
    name: '32GB DDR5-5600 DIMM Kit',
    type: 'Raw Material',
    description: '32GB (2x16GB) DDR5-5600 Memory Kit, CL36, XMP 3.0 ready, AMD Expo compatible.',
    unitCost: '$109.00',
    whereUsed: [
      { assembly: 'Gaming Rig Beta', qty: 2 },
    ],
  },
  'GPU-RTX4080': {
    sku: 'GPU-RTX4080',
    name: 'GeForce RTX 4080 16GB',
    type: 'Raw Material',
    description: 'NVIDIA Ada Lovelace Architecture, 16GB GDDR6X, DLSS 3, Ray Tracing, 320W TDP.',
    unitCost: '$1,199.00',
    whereUsed: [
      { assembly: 'Gaming Rig Beta', qty: 1 },
    ],
  },
  'CPU-I5-13400': {
    sku: 'CPU-I5-13400',
    name: 'Intel Core i5-13400',
    type: 'Raw Material',
    description: 'Intel Core i5-13400 10-Core, 20M Cache, up to 4.60 GHz. Value-oriented desktop processor.',
    unitCost: '$199.00',
    whereUsed: [
      { assembly: 'Office Desktop Std', qty: 1 },
    ],
  },
  'RAM-8G-DDR4': {
    sku: 'RAM-8G-DDR4',
    name: '8GB DDR4-3200 SODIMM',
    type: 'Raw Material',
    description: '8GB DDR4-3200 SODIMM, CL22, 1.2V, standard laptop/mini-PC memory module.',
    unitCost: '$22.00',
    whereUsed: [
      { assembly: 'Office Desktop Std', qty: 2 },
    ],
  },
  'SSD-512G-NVME': {
    sku: 'SSD-512G-NVME',
    name: '512GB NVMe M.2 SSD',
    type: 'Raw Material',
    description: 'PCIe Gen4x4 NVMe M.2 2280 SSD, up to 7000MB/s read, 5500MB/s write.',
    unitCost: '$45.00',
    whereUsed: [
      { assembly: 'Office Desktop Std', qty: 1 },
    ],
  },
}

export function BomCatalogPage() {
  const [selectedAssembly, setSelectedAssembly] = useState('1')
  const [selectedComponent, setSelectedComponent] = useState('CPU-I7-13650HX')

  const currentAssembly = mockAssemblies.find((a) => a.id === selectedAssembly)
  const currentComponent = mockCatalogComponents[selectedComponent]

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white m-0">BOM & Catalog</h1>
          <p className="text-sm text-mrp-text-secondary mt-1">
            Define hardware assemblies and manage the part catalog.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast.success('Assembly Created', { description: 'New product assembly added to BOM' })}
            className="px-4 py-2 bg-mrp-primary hover:bg-mrp-primary-hover text-white rounded-sm text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Create Product Assembly
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex gap-6 min-h-0" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {/* Left: Tree View */}
        <div className="w-1/3 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col">
          <div className="p-3 border-b border-mrp-border font-bold text-[11px] text-mrp-text-muted uppercase tracking-wider">
            Product Assemblies (BOM)
          </div>
          <div className="p-4 overflow-y-auto flex-1 font-mono text-[13px]">
            {mockAssemblies.map((assembly) => (
              <div key={assembly.id} className="mb-4">
                <div
                  className={`flex items-center gap-2 mb-2 cursor-pointer transition-colors ${selectedAssembly === assembly.id ? 'text-mrp-primary' : 'text-white hover:text-mrp-primary'}`}
                  onClick={() => {
                    setSelectedAssembly(assembly.id)
                    if (assembly.components.length > 0) {
                      setSelectedComponent(assembly.components[0].sku)
                    }
                  }}
                >
                  <FolderOpen size={16} />
                  <strong>{assembly.name}</strong>
                </div>
                {selectedAssembly === assembly.id && (
                  <div className="pl-6 border-l border-mrp-border ml-2 flex flex-col gap-2">
                    {assembly.components.map((comp) => {
                      const Icon = comp.icon
                      return (
                        <div
                          key={comp.sku}
                          className={`flex items-center gap-2 cursor-pointer transition-colors ${selectedComponent === comp.sku ? 'text-white' : 'text-mrp-text-secondary hover:text-white'}`}
                          onClick={() => setSelectedComponent(comp.sku)}
                        >
                          <Icon size={16} />
                          {comp.sku}
                          <span className="text-mrp-text-muted text-[11px] ml-auto">Qty: {comp.qty}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Component Details */}
        <div className="w-2/3 bg-mrp-panel border border-mrp-border rounded-sm flex flex-col">
          <div className="p-3 border-b border-mrp-border flex justify-between items-center">
            <span className="font-bold text-[11px] text-mrp-text-muted uppercase tracking-wider">
              Component Specification
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => toast.success('Component Updated', { description: `${currentComponent?.sku} specification saved` })}
                className="text-mrp-primary hover:underline text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Pencil size={12} />
                Edit Component
              </button>
              <button
                onClick={() => toast.success('Component Deleted', { description: `${currentComponent?.sku} removed from catalog` })}
                className="text-mrp-danger hover:underline text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
              >
                <Trash2 size={12} />
                Delete
              </button>
            </div>
          </div>
          {currentComponent && (
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="text-xs text-mrp-primary font-bold tracking-widest font-mono uppercase mb-1">
                    {currentComponent.type}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 font-mono">{currentComponent.sku}</h2>
                  <p className="text-mrp-text-secondary text-sm">{currentComponent.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-mrp-text-muted uppercase mb-1">Unit Cost</div>
                  <div className="text-xl text-white font-bold font-mono">{currentComponent.unitCost}</div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-white mb-3 border-b border-mrp-border pb-2">
                Where Used (Dependencies)
              </h3>
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="py-2 text-mrp-text-muted font-bold">Parent Assembly</th>
                    <th className="py-2 text-mrp-text-muted font-bold">Qty Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mrp-border text-mrp-text-secondary font-mono">
                  {currentComponent.whereUsed.map((usage, idx) => (
                    <tr key={idx}>
                      <td className="py-2 hover:text-mrp-primary cursor-pointer transition-colors">
                        {usage.assembly}
                      </td>
                      <td className="py-2">{usage.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
