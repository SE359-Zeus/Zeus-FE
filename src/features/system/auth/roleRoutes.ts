/**
 * @file roleRoutes.ts
 * @description Maps each UserRole to its default landing page after login,
 * and defines which sidebar nav sections each role is allowed to see.
 *
 * Rules:
 *  - admin        → can access everything; lands on /system/user-access
 *  - mrp_*        → MRP section only; lands on /mrp/dashboard
 *  - scm_*        → SCM section only; lands on /scm/inventory
 *  - sales_*      → Sales section only; lands on /sales/orders
 */

import type { UserRole } from '@/lib/types/api.types'

// ─── Default landing page per role ───────────────────────────────────────────

const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  admin:          '/system/user-access',
  mrp_operator:   '/mrp/dashboard',
  mrp_worker:     '/mrp/dashboard',
  scm_operator:   '/scm/inventory',
  scm_worker:     '/scm/inventory',
  sales_operator: '/sales/orders',
  sales_worker:   '/sales/orders',
}

/**
 * Returns the default landing route for a given role.
 * Falls back to /mrp/dashboard if the role is unrecognised.
 */
export function getDefaultRouteForRole(role: UserRole | string | undefined): string {
  if (!role) return '/mrp/dashboard'
  return ROLE_DEFAULT_ROUTE[role as UserRole] ?? '/mrp/dashboard'
}

// ─── Allowed nav sections per role ───────────────────────────────────────────

/**
 * The sections (by title) that each role is permitted to see in the sidebar.
 * Admin sees all sections.
 */
const ROLE_ALLOWED_SECTIONS: Record<UserRole, string[]> = {
  admin:          ['MRP', 'SCM', 'Sales', 'System'],
  mrp_operator:   ['MRP'],
  mrp_worker:     ['MRP'],
  scm_operator:   ['SCM'],
  scm_worker:     ['SCM'],
  sales_operator: ['Sales'],
  sales_worker:   ['Sales'],
}

/**
 * Returns the set of sidebar section titles the given role is allowed to see.
 * Returns all sections if the role is unrecognised.
 */
export function getAllowedSectionsForRole(role: UserRole | string | undefined): string[] {
  if (!role) return ['MRP', 'SCM', 'Sales', 'System']
  return ROLE_ALLOWED_SECTIONS[role as UserRole] ?? ['MRP', 'SCM', 'Sales', 'System']
}
