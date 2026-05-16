# Refactor Plan: Feature-Sliced Architecture

I will refactor the project into a modular, feature-based architecture that leverages Next.js App Router routing. This will replace the current state-based navigation with a robust, route-based system.

## Proposed Directory Structure

```
src/
├── app/
│   ├── (dashboard)/            # Route group for pages with Sidebar/Topbar
│   │   ├── layout.tsx          # Shared layout with Sidebar and Topbar
│   │   ├── page.tsx            # Maps to / (Dashboard)
│   │   ├── bom-catalog/
│   │   │   └── page.tsx        # Maps to /bom-catalog
│   │   ├── inventory-ledger/
│   │   │   └── page.tsx        # Maps to /inventory-ledger
│   │   ├── demand-pos/
│   │   │   └── page.tsx        # Maps to /demand-pos
│   │   ├── user-access/
│   │   │   └── page.tsx        # Maps to /user-access
│   │   └── audit-logs/
│   │       └── page.tsx        # Maps to /audit-logs
│   ├── api/
│   ├── globals.css
│   └── layout.tsx              # Global root layout (Toaster, Fonts)
├── components/
│   ├── layout/                 # Global layout components
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   └── ui/                     # Shadcn components (shared)
├── features/                   # Feature-sliced modules
│   ├── dashboard/
│   ├── bom/
│   ├── inventory/
│   ├── demand/
│   ├── users/
│   └── audit/
├── hooks/                      # Shared global hooks
├── lib/                        # Shared utilities and clients
└── types/                      # Shared global types
```

## Migration Steps

1. **Directories Initialization**:
   - Create `src/features/[feature_name]/components` folders.
   - Create `src/components/layout`.

2. **Feature Components Migration**:
   - Relocate page-level components from `src/components/pages/` to their respective `src/features/*/components/` folders.
   - Rename them to more descriptive names (e.g., `DashboardView.tsx`, `InventoryLedgerView.tsx`).

3. **Layout Migration**:
   - Move `sidebar.tsx` and `topbar.tsx` to `src/components/layout/`.
   - Refactor `sidebar.tsx` to use `next/link` and `usePathname` for navigation and active states.

4. **Routing Setup**:
   - Implement `src/app/(dashboard)/layout.tsx` to wrap pages with the global sidebar/topbar layout.
   - Create `page.tsx` for each route that simply imports and renders its corresponding feature "View".

5. **Clean up**:
   - Delete `src/app/page.tsx` (the SPA orchestrator).
   - Delete `src/components/pages` folder.
   - Ensure all `import` statements are updated to use `@/` alias correctly.

6. **Validation**:
   - Run `next dev` to verify navigation and page rendering.
   - Check if the Toaster and other global providers are still working correctly.
