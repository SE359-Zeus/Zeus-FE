import React, { useState } from 'react';
import { Search, SlidersHorizontal, Printer, Eye, EyeOff } from 'lucide-react';

// --- Mock Data ---
const purchaseOrders = [
  {
    id: 'PO-20240501-A',
    targetBuild: 'MRP-X9 Mainboard Assembly',
    qty: 500,
    status: 'Shortage',
    missingCount: 3,
  },
  {
    id: 'PO-20240502-B',
    targetBuild: 'MRP-X9 PSU Unit',
    qty: 1200,
    status: 'Clear to Build',
    missingCount: 0,
  },
  {
    id: 'PO-20240503-C',
    targetBuild: 'MRP-X9 Top Casing',
    qty: 150,
    status: 'Partial',
    missingCount: 1,
  },
  {
    id: 'PO-20240504-D',
    targetBuild: 'MRP-Z1 Sensor Module',
    qty: 800,
    status: 'Shortage',
    missingCount: 5,
  },
  {
    id: 'PO-20240505-E',
    targetBuild: 'MRP-Z1 Wiring Harness',
    qty: 3000,
    status: 'Clear to Build',
    missingCount: 0,
  },
];

// --- Helper: Status Badge Component ---
const ReadinessBadge = ({ status }: { status: string }) => {
  const baseClasses = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border';

  switch (status) {
    case 'Shortage':
      return (
        <div className={`${baseClasses} bg-mrp-danger/10 border-mrp-danger/20 text-mrp-danger`}>
          <span className="w-1.5 h-1.5 rounded-full bg-mrp-danger animate-pulse"></span>
          Shortage
        </div>
      );
    case 'Clear to Build':
      return (
        <div className={`${baseClasses} bg-mrp-success/10 border-mrp-success/20 text-mrp-success`}>
          Clear to Build
        </div>
      );
    case 'Partial':
      return (
        <div className={`${baseClasses} bg-mrp-warning/10 border-mrp-warning/20 text-mrp-warning`}>
          Partial
        </div>
      );
    default:
      return null;
  }
};

// --- Main Component ---
export function DemandPosPage() {
  // State to simulate toggling component visibility per row
  const [visibleComponents, setVisibleComponents] = useState<Record<string, boolean>>({});

  const toggleVisibility = (id: string) => {
    setVisibleComponents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Demand & POs</h1>
        <p className="text-sm text-mrp-text-secondary mt-1">Manage purchase orders and component readiness against production demand.</p>
      </div>

      {/* Top Control Bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search Input */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mrp-text-muted" size={14} />
          <input
            type="text"
            placeholder="Search PO ID or Build..."
            className="w-full bg-mrp-app border border-mrp-border rounded-sm text-[13px] text-white placeholder:text-mrp-text-muted py-1.5 pl-9 pr-3 focus:outline-none focus:border-mrp-primary transition-colors"
          />
        </div>

        {/* Filter Button (Outline Variant) */}
        <button className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-transparent rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border">
          <SlidersHorizontal size={14} />
          Filter
        </button>
      </div>

      {/* Data Table Container */}
      <div className="bg-mrp-panel border border-mrp-border rounded-sm shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            {/* Table Header */}
            <thead className="bg-mrp-panel border-b border-mrp-border sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Order ID
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Target Build
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">
                  Qty
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap">
                  Readiness Status
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">
                  Missing Components
                </th>
                <th className="px-4 py-3 text-[11px] font-bold text-mrp-text-muted uppercase tracking-wider whitespace-nowrap text-right">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-mrp-border bg-mrp-app">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-mrp-panel transition-colors group">
                  {/* Order ID (Mono font for data) */}
                  <td className="px-4 py-3 font-mono text-[13px] text-white whitespace-nowrap">
                    {po.id}
                  </td>

                  {/* Target Build */}
                  <td className="px-4 py-3 text-[13px] text-white font-medium whitespace-nowrap">
                    {po.targetBuild}
                  </td>

                  {/* Qty (Mono font for numbers) */}
                  <td className="px-4 py-3 font-mono text-[13px] text-white text-right whitespace-nowrap">
                    {po.qty.toLocaleString()}
                  </td>

                  {/* Readiness Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ReadinessBadge status={po.status} />
                  </td>

                  {/* Missing Components (Conditional coloring) */}
                  <td className="px-4 py-3 font-mono text-[13px] text-right whitespace-nowrap">
                    {po.missingCount > 0 ? (
                      <span className="text-mrp-danger font-medium">{po.missingCount}</span>
                    ) : (
                      <span className="text-mrp-text-muted">0</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border">
                        <Printer size={14} />
                        Print Pick List
                      </button>
                      <button
                        onClick={() => toggleVisibility(po.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 border border-mrp-border text-white bg-mrp-panel rounded-sm text-[13px] font-medium transition-colors hover:bg-mrp-border"
                      >
                        {visibleComponents[po.id] ? (
                          <>
                            <EyeOff size={14} />
                            Hide Components
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            View Components
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
