# AGENTS.md — Zeus Frontend

## Project Overview

Zeus is an ERP orchestration frontend built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4**, and **shadcn/ui (new-york style)**. It is a dark-mode-only dashboard application with role-based access across four domain modules: MRP, SCM, Sales, and System.

The backend API is at `https://zeus.ryanandexen.qzz.io/api/v1` (configurable via `NEXT_PUBLIC_API_BASE_URL`).

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Dev server on **port 3003** (via `scripts/dev.js` which spawns `npx next dev -p 3003` and logs to `dev.log`) |
| `bun run build` | `next build` (standalone output), copies static assets into `.next/standalone/` |
| `bun run start` | Runs the standalone production server |
| `bun run lint` | ESLint with `eslint-config-next` (core-web-vitals + typescript presets) |
| `bun run typecheck` | `tsc --noEmit` — type checking (not run by `next build` due to `ignoreBuildErrors`) |

**No test runner is configured.** There are no test scripts in `package.json`.

## Architecture

### Routing: App Router with `(dashboard)` route group

- **`src/app/layout.tsx`** — Root layout. Wraps everything in `QueryProvider` → `AuthProvider` → children + `Toaster`. Sets `<html className="dark">`.
- **`src/app/(dashboard)/layout.tsx`** — Dashboard layout. Wraps children in `AuthGuard` → Sidebar + Topbar shell. This is a `'use client'` component with collapsible sidebar state.
- **`src/app/page.tsx`** — Root page simply calls `redirect('/mrp/dashboard')`.
- **`src/app/login/page.tsx`** — Login page, not inside the dashboard route group, so it renders without sidebar/topbar.

Each route `page.tsx` is a **thin server component** that exports `metadata` and renders its corresponding `*View` component from `features/`:

```tsx
import { UserAccessView } from '@/features/system/user-access/components/UserAccessView'

export const metadata: Metadata = { title: 'User Access — Zeus' }
export default function UserAccessPage() {
  return <UserAccessView />
}
```

### Feature-Sliced Architecture (`src/features/`)

Each feature module follows this internal structure:

```
features/<domain>/<feature>/
├── components/   <FeatureName>View.tsx   — Main view component ('use client')
├── hooks/        use<Feature>.ts        — React Query hooks
├── <feature>.service.ts                 — API service functions
```

**Pattern for every feature:**
1. **Service** (`*.service.ts`) — calls `apiGet`/`apiPost`/`apiPut`/`apiPatch`/`apiDelete` from `@/lib/axios.client`, returns `Promise<ApiResponse<T>>`.
2. **Hooks** (`use*.ts`) — wraps service calls in `useQuery`/`useMutation` with query key factories, invalidation, and `toast` notifications.
3. **View** (`*View.tsx`) — `'use client'` component that consumes hooks and renders UI.

**Feature modules must not import directly from other feature modules.** Cross-feature communication goes through shared state (Zustand) or the API.

### Domain Modules

| Module | Route prefix | Features |
|---|---|---|
| **MRP** | `/mrp/` | dashboard, bom-catalog (ProductCatalog), inventory-ledger, demand-pos |
| **SCM** | `/scm/` | suppliers, po-orchestration (PurchaseOrder), goods-receipt, shipments, inventory |
| **Sales** | `/sales/` | orders, customers |
| **System** | `/system/` | user-access, audit-logs, auth |

## API Layer — Critical Patterns

### Axios Client (`src/lib/axios.client.ts`)

This is the **single configured Axios instance** for the entire app. Key behaviors:

- **Request interceptor**: Attaches `Authorization: Bearer <token>` from Zustand store.
- **Response interceptor (success)**: **Unwraps the envelope** — returns `response.data` (which is `ApiResponse<T>`) instead of the full `AxiosResponse`. This means `await apiGet<T>(url)` returns `ApiResponse<T>`, not `AxiosResponse<ApiResponse<T>>`.
- **Response interceptor (error)**: On 401, performs silent token refresh. Concurrent 401s are queued (N+1 storm prevention). Only ONE refresh call is made. Uses raw `axios` (not `apiClient`) for the refresh call to avoid recursion.
- **`withCredentials: false`** on `apiClient` — the refresh call uses a raw `axios.post` with `withCredentials: true` to send the HttpOnly refresh token cookie.

### API Response Envelope

Every API response follows this shape:

```ts
interface ApiResponse<T> {
  statusCode: number
  message: string
  data: T | null
  metadata: { pagination?: PaginationMeta; [key: string]: unknown }
}
```

**Access pattern in components:**
```ts
const { data } = useUsers()
const items = data?.data?.items ?? []           // actual payload
const pagination = data?.metadata?.pagination   // pagination info
```

For paginated lists, `data` is `PaginatedResult<T>`:
```ts
interface PaginatedResult<T> { items: T[]; pagination?: PaginationMeta }
```

### Typed HTTP Wrappers — Use These, Not `apiClient` Directly

```ts
apiGet<T>(url, config?)    → Promise<ApiResponse<T>>
apiPost<T>(url, data?, config?) → Promise<ApiResponse<T>>
apiPut<T>(url, data?, config?) → Promise<ApiResponse<T>>
apiPatch<T>(url, data?, config?) → Promise<ApiResponse<T>>
apiDelete<T>(url, config?) → Promise<ApiResponse<T>>
```

**API route convention**: Service functions include the module prefix (e.g. `/system/users`, `/mrp/dashboard`), NOT just the endpoint. The `API_BASE_URL` already includes `/api/v1`.

## Authentication Flow

### Token Strategy
- **Access token**: Stored **only in Zustand memory** (never localStorage/sessionStorage). Lost on page refresh.
- **Refresh token**: Stored as **HttpOnly cookie** by the server. JavaScript has zero read access.

### Bootstrapping Flow (cold start / F5)
1. `AuthProvider` mounts → `useEffect` calls `initialLoad()`.
2. `initialLoad()` sets `isBootstrapping = true` → shows `BootstrappingScreen`.
3. Calls `refreshTokenSilently()` (raw axios, `withCredentials: true`).
4. On success: stores new access token + populates `currentUser` from JWT decode.
5. On failure: clears auth state.
6. Finally: `isBootstrapping = false`, `isReady = true`.
7. `AuthGuard` checks: if `isReady && !isAuthenticated` → `router.replace('/login')`.

### SSR Hydration Safety
- `isBootstrapping` initial value in Zustand is `false` (so SSR renders children, not a loading screen).
- `AuthProvider` sets it to `true` inside `useEffect` (client-only), preventing hydration mismatch.
- `isReady` is `false` until bootstrapping completes — `AuthGuard` renders `null` until ready.

### Periodic Token Refresh
`AuthProvider` runs `setInterval` every **12 minutes** to silently refresh the access token while authenticated.

### Role-Based Routing (`src/features/system/auth/roleRoutes.ts`)
- Login redirects to a role-specific landing page (e.g. `admin` → `/system/user-access`, `scm_operator` → `/scm/inventory`).
- Sidebar navigation sections are filtered by role (admin sees all; others see only their module).

## State Management

- **Zustand** (`src/lib/stores/auth.store.ts`) — auth state only. Use `useAuthStore` as a React hook, or the vanilla getters (`getAccessToken`, `setAccessToken`, `clearAuth`) for non-React contexts (Axios interceptors).
- **TanStack React Query** (`src/lib/providers/QueryProvider.tsx`) — all server state. Default: `staleTime: 0`, `retry: 1` (no retry on 4xx), `refetchOnWindowFocus: true`. Individual hooks may override `staleTime`.

## Styling

- **Dark mode only** — `<html className="dark">`. No light theme exists.
- **Custom MRP color palette** defined as CSS custom properties in `globals.css` and mapped to Tailwind via `@theme inline`. Use `mrp-*` prefixed classes for custom colors:
  - `bg-mrp-app` (#151515), `bg-mrp-panel` (#212427), `border-mrp-border` (#3C3F42)
  - `text-mrp-text-main`, `text-mrp-text-secondary`, `text-mrp-text-muted`
  - `bg-mrp-primary` (#0066CC), `hover:bg-mrp-primary-hover` (#0055AA)
  - `text-mrp-success` (#3E8635), `text-mrp-danger` (#C9190B), `text-mrp-warning` (#F0AB00)
- **shadcn/ui** components in `src/components/ui/` — new-york style, RSC enabled. Add new components with `npx shadcn@latest add <component>`.
- **Font**: Inter (body) + Space Grotesk (mono). Applied via CSS variables `--font-inter` / `--font-space-grotesk`.
- **Border radius**: Very small (`--radius: 0.125rem`) — UI is intentionally sharp/square.

## TypeScript Conventions

- **Path alias**: `@/*` → `./src/*` (configured in `tsconfig.json`).
- **Strict mode is on**, but `noImplicitAny: false`.
- **Type definitions** live in `src/lib/types/api.types.ts` — one canonical file matching the OpenAPI spec. Types are re-exported from `src/lib/index.ts` barrel.
- **Naming**: `ApiResponse<T>` (envelope), `PaginatedResult<T>` (list payload), model interfaces named after OpenAPI schemas (e.g. `User`, `AuditLog`), request interfaces suffixed with `Request`, params interfaces suffixed with `Params`.
- `UserResponse` is a **deprecated alias** for `User` — use `User` in new code.
- **ESLint is extremely permissive** — `no-explicit-any`, `no-unused-vars`, `no-console`, `no-debugger`, and `exhaustive-deps` are all **off**. Do not treat lint output as authoritative.

## Key Gotchas

1. **Dev server port is 3003**, not 3000. The `dev` script uses `scripts/dev.js` which spawns `npx next dev -p 3003`.
2. **`reactStrictMode: false`** in `next.config.ts` — double-render behavior in dev is disabled.
3. **`typescript.ignoreBuildErrors: true`** — `next build` does NOT type-check. Run `tsc --noEmit` separately if you want type safety.
4. **`output: 'standalone'`** — the build produces a standalone server bundle. The `build` script copies static assets into `.next/standalone/`.
5. **`withCredentials: false`** on `apiClient` — only the raw `refreshTokenSilently()` call uses `withCredentials: true`. If you need cookie-based requests, use raw `axios` explicitly.
6. **The Axios interceptor unwraps responses** — `await apiGet<T>(url)` returns `ApiResponse<T>`, NOT `AxiosResponse<ApiResponse<T>>`. This is a common source of confusion when reading code. The unwrapping happens in the success interceptor via `return response.data`.
7. **`refreshTokenSilently()` bypasses interceptors** — it uses raw `axios.post`, so its response IS a full `AxiosResponse`. That's why it manually accesses `.data.data` for the token pair.
8. **Package manager is Bun** — `bun.lock` exists, not `package-lock.json` or `yarn.lock`.
9. **`PaginatedData` is an alias** for `PaginatedResult` — both names are valid, but `PaginatedResult` is preferred.
10. **No test framework** is set up. Do not look for Jest, Vitest, or Playwright configs.
11. **The `examples/` directory** is ignored by ESLint and is not part of the application.
12. **`PaginationBar`** in `src/components/ui/PaginationBar.tsx` is a **custom component** (not from shadcn). It's shared across paginated list views.

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

Runs on push and PR to `main`. Three jobs with dependency chain:

1. **lint-and-typecheck** — `bun install --frozen-lockfile` → `bun run lint` → `bunx tsc --noEmit`
2. **build** — `bun run build` with `NEXT_PUBLIC_API_BASE_URL` set → verifies standalone output (`server.js`, static assets, public dir)
3. **docker-build** — Builds the Docker image via Buildx with GitHub Actions cache → starts container and curls port 3000 to verify it responds

Concurrency group cancels in-progress runs on the same branch.

### Dockerfile

Multi-stage build optimized for the standalone output mode:

- **deps** — `bun install --frozen-lockfile --production` (runtime deps only)
- **builder** — full install + `bun run build` (with `NEXT_PUBLIC_API_BASE_URL` build arg)
- **runner** — copies only `public/`, standalone server, and static assets. Runs as non-root user `nextjs` on port 3000.

Container exposes **port 3000** (not 3003 — dev port is only for `scripts/dev.js`).

Build: `docker build -t zeus-fe .`
Run: `docker run -p 3000:3000 zeus-fe`
