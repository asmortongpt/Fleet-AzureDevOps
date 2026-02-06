/**
 * useVehicleInventory Hook
 *
 * React hook for managing vehicle-specific inventory with API integration.
 * Provides per-vehicle parts tracking, usage history, and maintenance integration.
 *
 * Features:
 * - Vehicle-assigned parts (derived from inventory transactions)
 * - Compatible parts lookup (from inventory catalog)
 * - Usage history tracking
 * - Maintenance records integration
 * - Parts assignment/removal
 * - Cost analytics per vehicle
 *
 * @security Respects backend permissions
 */

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useInventory } from "@/hooks/useInventory"
import { secureFetch } from "@/hooks/use-api"
import { Part, InventoryTransaction, WorkOrder } from "@/lib/types"
import logger from "@/utils/logger"

export interface VehicleInventoryStats {
  totalAssignedParts: number
  totalValue: number
  lowStockCount: number
  usageLast30Days: number
  costLast30Days: number
}

const unwrapRows = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (payload?.data && Array.isArray(payload.data)) return payload.data as T[]
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data as T[]
  return []
}

const mapTransactionRow = (row: any): InventoryTransaction => ({
  id: row.id,
  partId: row.item_id,
  partNumber: row.part_number || row.sku || row.item_name || '',
  type: row.transaction_type,
  quantity: Number(row.quantity ?? 0),
  date: row.timestamp || row.date || row.created_at,
  reference: row.reference_number,
  workOrderId: row.work_order_id,
  cost: Number(row.total_cost ?? row.unit_cost ?? 0),
  performedBy: row.user_name || 'Unknown',
  notes: row.notes
})

async function fetchVehicleTransactions(vehicleId: string): Promise<InventoryTransaction[]> {
  try {
    const response = await secureFetch(`/api/inventory/transactions?vehicle_id=${encodeURIComponent(vehicleId)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch vehicle inventory transactions (${response.status})`)
    }
    const payload = await response.json()
    return unwrapRows<any>(payload).map(mapTransactionRow)
  } catch (error) {
    logger.error("Vehicle inventory transactions API unavailable", error)
    return []
  }
}

async function fetchMaintenanceHistory(vehicleId: string): Promise<WorkOrder[]> {
  try {
    const response = await secureFetch(`/api/work-orders?vehicle_id=${encodeURIComponent(vehicleId)}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch maintenance history (${response.status})`)
    }
    const payload = await response.json()
    return unwrapRows<WorkOrder>(payload)
  } catch (error) {
    logger.error("Maintenance history API unavailable", error)
    return []
  }
}

async function createVehicleTransaction(payload: {
  item_id: string
  transaction_type: InventoryTransaction['type']
  quantity: number
  unit_cost: number
  reason: string
  vehicle_id: string
  work_order_id?: string
  reference_number?: string
  notes?: string
}): Promise<InventoryTransaction> {
  const response = await secureFetch('/api/inventory/transactions', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    throw new Error(`Failed to create inventory transaction (${response.status})`)
  }
  const result = await response.json()
  const row = result.data || result
  return mapTransactionRow(row)
}

/**
 * Main vehicle inventory hook
 */
export function useVehicleInventory(vehicleId: string) {
  const queryClient = useQueryClient()
  const { parts, isLoading: partsLoading } = useInventory()

  const partsById = useMemo(() => new Map(parts.map(part => [part.id, part])), [parts])

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    error: transactionsError
  } = useQuery<InventoryTransaction[]>({
    queryKey: ["vehicle-inventory", vehicleId, "transactions"],
    queryFn: () => fetchVehicleTransactions(vehicleId),
    enabled: !!vehicleId,
    staleTime: 30 * 1000
  })

  const {
    data: maintenanceHistory = [],
    isLoading: maintenanceLoading
  } = useQuery<WorkOrder[]>({
    queryKey: ["vehicle-inventory", vehicleId, "maintenance"],
    queryFn: () => fetchMaintenanceHistory(vehicleId),
    enabled: !!vehicleId,
    staleTime: 60 * 1000
  })

  const assignedQuantityByPart = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach((transaction) => {
      if (transaction.type === 'transfer' || transaction.type === 'return') {
        const prev = map.get(transaction.partId) ?? 0
        map.set(transaction.partId, prev + transaction.quantity)
      }
    })
    return map
  }, [transactions])

  const assignedParts = useMemo(() => {
    return parts
      .map((part) => {
        const net = assignedQuantityByPart.get(part.id) ?? 0
        const assignedQty = Math.max(0, -net)
        if (assignedQty <= 0) return null
        return {
          ...part,
          quantityOnHand: assignedQty
        }
      })
      .filter((part): part is Part => !!part)
  }, [parts, assignedQuantityByPart])

  const usageHistory = useMemo(() => {
    return transactions.filter(transaction => transaction.type === 'usage')
  }, [transactions])

  const compatibleParts = useMemo(() => {
    const assignedIds = new Set(assignedParts.map(part => part.id))
    return parts.filter(part => !assignedIds.has(part.id))
  }, [parts, assignedParts])

  const assignPartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const part = partsById.get(partId)
      if (!part) {
        throw new Error('Part not found')
      }
      return createVehicleTransaction({
        item_id: partId,
        transaction_type: 'transfer',
        quantity: -1,
        unit_cost: part.unitCost,
        reason: `Assigned to vehicle ${vehicleId}`,
        vehicle_id: vehicleId,
        notes: `Assigned ${part.partNumber} to vehicle`
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "transactions"] })
    },
    onError: (error) => {
      logger.error("Failed to assign part:", error)
      toast.error("Failed to assign part")
    }
  })

  const removePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const part = partsById.get(partId)
      if (!part) {
        throw new Error('Part not found')
      }
      return createVehicleTransaction({
        item_id: partId,
        transaction_type: 'return',
        quantity: 1,
        unit_cost: part.unitCost,
        reason: `Returned from vehicle ${vehicleId}`,
        vehicle_id: vehicleId,
        notes: `Returned ${part.partNumber} from vehicle`
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "transactions"] })
    },
    onError: (error) => {
      logger.error("Failed to remove part:", error)
      toast.error("Failed to remove part")
    }
  })

  const recordUsageMutation = useMutation({
    mutationFn: async (transaction: Partial<InventoryTransaction>) => {
      const partId = transaction.partId
      if (!partId) {
        throw new Error('Part ID is required')
      }
      const part = partsById.get(partId)
      if (!part) {
        throw new Error('Part not found')
      }
      const quantity = Number(transaction.quantity ?? 0)
      if (!quantity) {
        throw new Error('Quantity is required')
      }
      const unitCost = transaction.cost
        ? Math.abs(transaction.cost / Math.max(1, Math.abs(quantity)))
        : part.unitCost

      return createVehicleTransaction({
        item_id: partId,
        transaction_type: transaction.type || 'usage',
        quantity,
        unit_cost: unitCost,
        reason: transaction.notes || 'Usage recorded',
        vehicle_id: vehicleId,
        work_order_id: transaction.workOrderId,
        reference_number: transaction.reference,
        notes: transaction.notes
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "transactions"] })
    },
    onError: (error) => {
      logger.error("Failed to record usage:", error)
      toast.error("Failed to record usage")
    }
  })

  const stats: VehicleInventoryStats = useMemo(() => {
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentUsage = usageHistory.filter((h) => new Date(h.date) >= last30Days)

    return {
      totalAssignedParts: assignedParts.length,
      totalValue: assignedParts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
      lowStockCount: assignedParts.filter(p => p.quantityOnHand <= p.reorderPoint).length,
      usageLast30Days: recentUsage.reduce((sum, h) => sum + Math.abs(h.quantity), 0),
      costLast30Days: recentUsage.reduce((sum, h) => sum + (h.cost || 0), 0)
    }
  }, [assignedParts, usageHistory])

  return {
    assignedParts,
    compatibleParts,
    usageHistory,
    maintenanceHistory,
    stats,

    isLoading: partsLoading || transactionsLoading || maintenanceLoading,
    assignedLoading: partsLoading,
    compatibleLoading: partsLoading,
    usageLoading: transactionsLoading,
    maintenanceLoading,

    error: transactionsError,

    assignPart: assignPartMutation.mutateAsync,
    removePart: removePartMutation.mutateAsync,
    recordUsage: recordUsageMutation.mutateAsync,

    isAssigning: assignPartMutation.isPending,
    isRemoving: removePartMutation.isPending,
    isRecordingUsage: recordUsageMutation.isPending,

    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
    }
  }
}

/**
 * Hook for fetching parts for multiple vehicles
 */
export function useMultiVehicleInventory(vehicleIds: string[]) {
  const results = vehicleIds.map(id => useVehicleInventory(id))

  const isLoading = results.some(r => r.isLoading)
  const hasError = results.some(r => r.error)

  const totalParts = results.reduce((sum, r) => sum + r.assignedParts.length, 0)
  const totalValue = results.reduce((sum, r) => sum + r.stats.totalValue, 0)
  const totalLowStock = results.reduce((sum, r) => sum + r.stats.lowStockCount, 0)

  return {
    results,
    isLoading,
    hasError,
    summary: {
      totalParts,
      totalValue,
      totalLowStock
    }
  }
}
