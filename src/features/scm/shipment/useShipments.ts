/**
 * @file useShipments.ts
 * @description TanStack React Query hooks for the SCM Shipment module.
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentService } from './shipment.service'
import type {
  ShipmentListParams,
  CreateShipmentRequest,
  AcquireDispatchLockRequest,
  DispatchShipmentRequest,
  MarkDeliveredRequest,
  TransitionShipmentStateRequest,
} from './shipment.types'

// Cross-feature invalidation key — mirrors goodsReceiptKeys.all from useGoodsReceipts.ts
const GR_QUERY_KEY = ['goodsReceipts'] as const
const PO_QUERY_KEY = ['purchaseOrders'] as const

export const shipmentKeys = {
  all:     ['shipments'] as const,
  lists:   () => [...shipmentKeys.all, 'list'] as const,
  list:    (p: ShipmentListParams) => [...shipmentKeys.lists(), p] as const,
  details: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
  metrics: () => [...shipmentKeys.all, 'metrics'] as const,
  carriers: () => [...shipmentKeys.all, 'carriers'] as const,
}

/** Hook to list shipments with optional status filter + pagination */
export function useShipments(params: ShipmentListParams = {}) {
  return useQuery({
    queryKey: shipmentKeys.list(params),
    queryFn:  () => shipmentService.listShipments(params),
  })
}

/** Hook to fetch live KPI metrics */
export function useShipmentMetrics() {
  return useQuery({
    queryKey: shipmentKeys.metrics(),
    queryFn:  () => shipmentService.getMetrics(),
    staleTime: 30_000,
  })
}

/** Hook to fetch carriers list (for dropdown) */
export function useCarriers() {
  return useQuery({
    queryKey: shipmentKeys.carriers(),
    queryFn:  () => shipmentService.getCarriers(),
    staleTime: 5 * 60_000, // carriers rarely change
  })
}

/** Hook to fetch a single shipment detail */
export function useShipmentDetails(shipmentId: string) {
  return useQuery({
    queryKey: shipmentKeys.details(shipmentId),
    queryFn:  () => shipmentService.getShipment(shipmentId),
    enabled:  !!shipmentId,
  })
}

/** Mutation — create a new Shipment (POST /scm/shipments) */
export function useCreateShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateShipmentRequest) => shipmentService.createShipment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.metrics() })
    },
  })
}

/** Mutation — acquire dispatch lock (POST /scm/shipments/{id}/lock) */
export function useAcquireDispatchLock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, payload }: { shipmentId: string; payload: AcquireDispatchLockRequest }) =>
      shipmentService.acquireDispatchLock(shipmentId, payload),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.details(shipmentId) })
    },
  })
}

/** Mutation — dispatch shipment (POST /scm/shipments/{id}/dispatch) — Scheduled → In Transit */
export function useDispatchShipment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, payload }: { shipmentId: string; payload: DispatchShipmentRequest }) =>
      shipmentService.dispatchShipment(shipmentId, payload),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.details(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.metrics() })
      // PO may reflect the In Transit status depending on backend logic
      queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY })
    },
  })
}

/**
 * Mutation — mark shipment as delivered (POST /scm/shipments/{id}/deliver)
 * This is the KEY action: backend automatically creates a GoodsReceipt linked to the PO.
 */
export function useMarkDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, payload }: { shipmentId: string; payload: MarkDeliveredRequest }) =>
      shipmentService.markDelivered(shipmentId, payload),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.details(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.metrics() })
      // Mark Delivered auto-creates a GoodsReceipt — invalidate GR + PO queries
      queryClient.invalidateQueries({ queryKey: GR_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PO_QUERY_KEY })
    },
  })
}

/** Mutation — generic state transition (PUT /scm/shipments/{id}/state) */
export function useTransitionShipmentState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ shipmentId, payload }: { shipmentId: string; payload: TransitionShipmentStateRequest }) =>
      shipmentService.transitionState(shipmentId, payload),
    onSuccess: (_, { shipmentId }) => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.details(shipmentId) })
      queryClient.invalidateQueries({ queryKey: shipmentKeys.metrics() })
    },
  })
}
