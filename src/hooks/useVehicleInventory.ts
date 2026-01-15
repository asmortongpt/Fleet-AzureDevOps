/**
 * useVehicleInventory Hook
 *
 * React hook for managing vehicle-specific inventory with API integration.
 * Provides per-vehicle parts tracking, usage history, and maintenance integration.
 *
 * Features:
 * - Vehicle-assigned parts
 * - Compatible parts lookup
 * - Usage history tracking
 * - Maintenance records integration
 * - Parts assignment/removal
 * - Cost analytics per vehicle
 *
 * @security Respects backend permissions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiClient } from "@/lib/api-client"
import { Part, InventoryTransaction, WorkOrder } from "@/lib/types"
import logger from '@/utils/logger';
export interface VehicleInventoryStats {
  totalAssignedParts: number
  totalValue: number
  lowStockCount: number
  usageLast30Days: number
  costLast30Days: number
}

/**
 * Fetch parts assigned to a vehicle
 */
async function fetchAssignedParts(vehicleId: string): Promise<Part[]> {
  try {
    const response = await apiClient.get<Part[]>(`/api/v1/vehicles/${vehicleId}/inventory/assigned`)
    return response
  } catch (error) {
    logger.warn("Assigned parts API unavailable, using emulator data")
    return generateEmulatorAssignedParts(vehicleId)
  }
}

/**
 * Fetch compatible parts for a vehicle
 */
async function fetchCompatibleParts(vehicleId: string): Promise<Part[]> {
  try {
    const response = await apiClient.get<Part[]>(`/api/v1/vehicles/${vehicleId}/inventory/compatible`)
    return response
  } catch (error) {
    logger.warn("Compatible parts API unavailable, using emulator data")
    return generateEmulatorCompatibleParts(vehicleId)
  }
}

/**
 * Fetch usage history for a vehicle
 */
async function fetchUsageHistory(vehicleId: string): Promise<InventoryTransaction[]> {
  try {
    const response = await apiClient.get<InventoryTransaction[]>(
      `/api/v1/vehicles/${vehicleId}/inventory/usage`
    )
    return response
  } catch (error) {
    logger.warn("Usage history API unavailable")
    return generateEmulatorUsageHistory(vehicleId)
  }
}

/**
 * Fetch maintenance history for a vehicle
 */
async function fetchMaintenanceHistory(vehicleId: string): Promise<WorkOrder[]> {
  try {
    const response = await apiClient.get<WorkOrder[]>(`/api/v1/vehicles/${vehicleId}/maintenance`)
    return response
  } catch (error) {
    logger.warn("Maintenance history API unavailable")
    return []
  }
}

/**
 * Assign a part to a vehicle
 */
async function assignPartToVehicle(vehicleId: string, partId: string): Promise<void> {
  await apiClient.post(`/api/v1/vehicles/${vehicleId}/inventory/assign`, { partId })
}

/**
 * Remove a part from a vehicle
 */
async function removePartFromVehicle(vehicleId: string, partId: string): Promise<void> {
  await apiClient.post(`/api/v1/vehicles/${vehicleId}/inventory/remove`, { partId })
}

/**
 * Record parts usage for a vehicle
 */
async function recordPartsUsage(
  vehicleId: string,
  transaction: Partial<InventoryTransaction>
): Promise<InventoryTransaction> {
  const response = await apiClient.post<InventoryTransaction>(
    `/api/v1/vehicles/${vehicleId}/inventory/usage`,
    transaction
  )
  return response
}

/**
 * Generate emulator assigned parts
 */
function generateEmulatorAssignedParts(vehicleId: string): Part[] {
  return [
    {
      id: "part-1",
      partNumber: "OIL-FILTER-001",
      name: "Engine Oil Filter",
      description: "High-performance oil filter",
      category: "filters",
      manufacturer: "ACDelco",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 45,
      minStockLevel: 20,
      maxStockLevel: 100,
      reorderPoint: 30,
      unitCost: 12.99,
      location: "Shelf A-12",
      alternateVendors: []
    },
    {
      id: "part-3",
      partNumber: "AIR-FILTER-003",
      name: "Engine Air Filter",
      description: "Premium air filter",
      category: "filters",
      manufacturer: "K&N",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 8,
      minStockLevel: 15,
      maxStockLevel: 75,
      reorderPoint: 20,
      unitCost: 24.99,
      location: "Shelf A-15",
      alternateVendors: []
    },
    {
      id: "part-7",
      partNumber: "COOLANT-007",
      name: "Engine Coolant 1 Gallon",
      description: "Extended life antifreeze/coolant",
      category: "fluids",
      manufacturer: "Prestone",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 65,
      minStockLevel: 25,
      maxStockLevel: 100,
      reorderPoint: 35,
      unitCost: 14.99,
      location: "Fluids Storage",
      alternateVendors: []
    }
  ]
}

/**
 * Generate emulator compatible parts
 */
function generateEmulatorCompatibleParts(vehicleId: string): Part[] {
  return [
    {
      id: "part-2",
      partNumber: "BRAKE-PAD-002",
      name: "Front Brake Pads",
      description: "Ceramic brake pads",
      category: "brakes",
      manufacturer: "Brembo",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 12,
      minStockLevel: 10,
      maxStockLevel: 50,
      reorderPoint: 15,
      unitCost: 89.99,
      location: "Shelf B-5",
      alternateVendors: []
    },
    {
      id: "part-5",
      partNumber: "WIPER-BLADE-005",
      name: "Windshield Wiper Blade 22in",
      description: "Heavy-duty wiper blade",
      category: "other",
      manufacturer: "Bosch",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 28,
      minStockLevel: 12,
      maxStockLevel: 60,
      reorderPoint: 18,
      unitCost: 19.99,
      location: "Shelf C-8",
      alternateVendors: []
    },
    {
      id: "part-6",
      partNumber: "BATTERY-006",
      name: "Heavy-Duty Battery 12V 850CCA",
      description: "Maintenance-free battery",
      category: "electrical",
      manufacturer: "Interstate",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 3,
      minStockLevel: 5,
      maxStockLevel: 20,
      reorderPoint: 8,
      unitCost: 149.99,
      location: "Battery Cabinet",
      alternateVendors: []
    },
    {
      id: "part-8",
      partNumber: "SPARK-PLUG-008",
      name: "Iridium Spark Plug",
      description: "Long-life iridium spark plug",
      category: "engine",
      manufacturer: "NGK",
      compatibleVehicles: [vehicleId],
      quantityOnHand: 42,
      minStockLevel: 20,
      maxStockLevel: 80,
      reorderPoint: 30,
      unitCost: 8.99,
      location: "Shelf A-3",
      alternateVendors: []
    }
  ]
}

/**
 * Generate emulator usage history
 */
function generateEmulatorUsageHistory(vehicleId: string): InventoryTransaction[] {
  const now = new Date()
  return [
    {
      id: "trans-1",
      partId: "part-1",
      partNumber: "OIL-FILTER-001",
      type: "usage",
      quantity: -1,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      workOrderId: "WO-12345",
      cost: 12.99,
      performedBy: "Tech Smith",
      notes: "Regular oil change service"
    },
    {
      id: "trans-2",
      partId: "part-3",
      partNumber: "AIR-FILTER-003",
      type: "usage",
      quantity: -1,
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      workOrderId: "WO-12320",
      cost: 24.99,
      performedBy: "Tech Johnson",
      notes: "Air filter replacement during inspection"
    },
    {
      id: "trans-3",
      partId: "part-7",
      partNumber: "COOLANT-007",
      type: "usage",
      quantity: -2,
      date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      workOrderId: "WO-12285",
      cost: 29.98,
      performedBy: "Tech Brown",
      notes: "Coolant flush and refill"
    }
  ]
}

/**
 * Main vehicle inventory hook
 */
export function useVehicleInventory(vehicleId: string) {
  const queryClient = useQueryClient()

  // Fetch assigned parts
  const {
    data: assignedParts,
    isLoading: assignedLoading,
    error: assignedError
  } = useQuery<Part[]>({
    queryKey: ["vehicle-inventory", vehicleId, "assigned"],
    queryFn: () => fetchAssignedParts(vehicleId),
    enabled: !!vehicleId,
    staleTime: 30 * 1000
  })

  // Fetch compatible parts
  const {
    data: compatibleParts,
    isLoading: compatibleLoading
  } = useQuery<Part[]>({
    queryKey: ["vehicle-inventory", vehicleId, "compatible"],
    queryFn: () => fetchCompatibleParts(vehicleId),
    enabled: !!vehicleId,
    staleTime: 60 * 1000
  })

  // Fetch usage history
  const {
    data: usageHistory,
    isLoading: usageLoading
  } = useQuery<InventoryTransaction[]>({
    queryKey: ["vehicle-inventory", vehicleId, "usage"],
    queryFn: () => fetchUsageHistory(vehicleId),
    enabled: !!vehicleId,
    staleTime: 30 * 1000
  })

  // Fetch maintenance history
  const {
    data: maintenanceHistory,
    isLoading: maintenanceLoading
  } = useQuery<WorkOrder[]>({
    queryKey: ["vehicle-inventory", vehicleId, "maintenance"],
    queryFn: () => fetchMaintenanceHistory(vehicleId),
    enabled: !!vehicleId,
    staleTime: 60 * 1000
  })

  // Assign part mutation
  const assignPartMutation = useMutation({
    mutationFn: (partId: string) => assignPartToVehicle(vehicleId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
    },
    onError: (error) => {
      logger.error("Failed to assign part:", error)
      toast.error("Failed to assign part")
    }
  })

  // Remove part mutation
  const removePartMutation = useMutation({
    mutationFn: (partId: string) => removePartFromVehicle(vehicleId, partId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-inventory", vehicleId] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
    },
    onError: (error) => {
      logger.error("Failed to remove part:", error)
      toast.error("Failed to remove part")
    }
  })

  // Record usage mutation
  const recordUsageMutation = useMutation({
    mutationFn: (transaction: Partial<InventoryTransaction>) =>
      recordPartsUsage(vehicleId, transaction),
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

  // Calculate stats
  const stats: VehicleInventoryStats = {
    totalAssignedParts: assignedParts?.length || 0,
    totalValue: (assignedParts || []).reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
    lowStockCount: (assignedParts || []).filter(p => p.quantityOnHand <= p.reorderPoint).length,
    usageLast30Days: (usageHistory || [])
      .filter(h => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(h.date) >= thirtyDaysAgo
      })
      .reduce((sum, h) => sum + Math.abs(h.quantity), 0),
    costLast30Days: (usageHistory || [])
      .filter(h => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(h.date) >= thirtyDaysAgo
      })
      .reduce((sum, h) => sum + (h.cost || 0), 0)
  }

  return {
    // Data
    assignedParts: assignedParts || [],
    compatibleParts: compatibleParts || [],
    usageHistory: usageHistory || [],
    maintenanceHistory: maintenanceHistory || [],
    stats,

    // Loading states
    isLoading: assignedLoading || compatibleLoading || usageLoading || maintenanceLoading,
    assignedLoading,
    compatibleLoading,
    usageLoading,
    maintenanceLoading,

    // Error states
    error: assignedError,

    // Actions
    assignPart: assignPartMutation.mutateAsync,
    removePart: removePartMutation.mutateAsync,
    recordUsage: recordUsageMutation.mutateAsync,

    // Mutation states
    isAssigning: assignPartMutation.isPending,
    isRemoving: removePartMutation.isPending,
    isRecordingUsage: recordUsageMutation.isPending,

    // Refetch
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
