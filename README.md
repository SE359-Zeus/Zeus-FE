# Project Structure

The project has been refactored to follow a modular, Service-Oriented Architecture (SOA) utilizing Next.js App Router. The codebase is organized into four distinct services, separating domain concerns into feature-sliced modules.

## Services Overview

- **MRP** (Material Requirements Planning):
  - **Dashboard**: Real-time material readiness and production blockage monitoring.
  - **BOM & Catalog**: Hardware assemblies and part catalog management.
  - **Inventory Ledger**: Stock transaction history and running balance tracking.
  - **Demand & POs**: Purchase orders and component readiness against production demand.
- **SCM** (Supply Chain Management): Includes sections like Suppliers and Shipments (placeholders).
- **Sales**: Includes sections like Sales Orders and Customers (placeholders).
- **HR** (Human Resources):
  - **User Access**: User roles and access management.
  - **Audit Logs**: Activity trail and compliance records.

## Directory Layout (`src/`)

```
src/
├── app/
│   ├── (dashboard)/            # Route group containing shared layouts and services
│   │   ├── layout.tsx          # Main dashboard layout (includes Sidebar & Topbar)
│   │   ├── mrp/                # MRP Service routes
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── bom-catalog/page.tsx
│   │   │   ├── inventory-ledger/page.tsx
│   │   │   └── demand-pos/page.tsx
│   │   ├── hr/                 # HR Service routes
│   │   │   ├── user-access/page.tsx
│   │   │   └── audit-logs/page.tsx
│   │   ├── scm/                # SCM Service routes
│   │   └── sales/              # Sales Service routes
│   ├── api/
│   ├── globals.css
│   └── layout.tsx              # Root Next.js layout with global providers (e.g., Toaster)
├── components/
│   ├── layout/                 # Global UI layout components
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   └── ui/                     # Reusable Shadcn UI components
├── features/                   # Domain-driven feature modules
│   ├── mrp/                    # MRP Features
│   │   ├── dashboard/components/DashboardView.tsx
│   │   ├── bom-catalog/components/BomCatalogView.tsx
│   │   ├── inventory-ledger/components/InventoryLedgerView.tsx
│   │   └── demand-pos/components/DemandPosView.tsx
│   ├── hr/                     # HR Features
│   │   ├── user-access/components/UserAccessView.tsx
│   │   └── audit-logs/components/AuditLogsView.tsx
│   ├── scm/                    # SCM Features
│   └── sales/                  # Sales Features
├── hooks/                      # Shared React hooks (e.g., use-mobile, use-toast)
├── lib/                        # Utility functions and shared clients (e.g., db.ts, utils.ts)
```

## Architectural Guidelines

1. **Routing**: Handled exclusively inside the `src/app` directory. Pages act as thin wrappers around views from the `features` folder.
2. **Features**: The `src/features/` folder encapsulates all domain-specific logic, components, types, and utilities. A feature should rarely reach out to another feature directly; prefer communicating through shared state or APIs if necessary.
3. **Components**: The `src/components/` folder is strictly for cross-cutting components like global layout structural pieces or generic UI elements (buttons, modals).
4. **Styles**: Handled by Tailwind CSS with custom thematic variables located in `src/app/globals.css`. Ensure `tailwind.config.ts` maintains accurate content path globs for the `features` directory.
