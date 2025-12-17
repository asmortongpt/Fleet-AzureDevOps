/**
 * useInventory Hook
 *
 * React hook for managing inventory with API integration and emulator support.
 * Provides comprehensive parts management, transactions, and stock tracking.
 *
 * Features:
 * - Parts CRUD operations
 * - Inventory transactions
 * - Stock level monitoring
 * - Real-time updates via React Query
 * - Automatic cache invalidation
 * - Optimistic updates
 *
 * @security Respects backend permissions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Part, InventoryTransaction } from "@/lib/types"
import { toast } from "sonner"

import logger from '@/utils/logger';
export interface InventoryStats {
  totalParts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  overstockedCount: number
}

/**
 * Fetch all parts
 */
async function fetchParts(): Promise<Part[]> {
  try {
    // Try API first
    const response = await apiClient.get<Part[]>("/api/v1/inventory/parts")
    return response
  } catch (error) {
    // Fallback to emulator data
    logger.warn("API unavailable, using emulator data")
    return generateEmulatorParts()
  }
}

/**
 * Fetch inventory stats
 */
async function fetchInventoryStats(): Promise<InventoryStats> {
  try {
    const response = await apiClient.get<InventoryStats>("/api/v1/inventory/stats")
    return response
  } catch (error) {
    logger.warn("Stats API unavailable, calculating from parts")
    const parts = await fetchParts()
    return calculateStats(parts)
  }
}

/**
 * Fetch inventory transactions
 */
async function fetchTransactions(partId?: string): Promise<InventoryTransaction[]> {
  try {
    const url = partId
      ? `/api/v1/inventory/transactions?partId=${partId}`
      : "/api/v1/inventory/transactions"
    const response = await apiClient.get<InventoryTransaction[]>(url)
    return response
  } catch (error) {
    logger.warn("Transactions API unavailable")
    return []
  }
}

/**
 * Create a new part
 */
async function createPart(part: Partial<Part>): Promise<Part> {
  const response = await apiClient.post<Part>("/api/v1/inventory/parts", part)
  return response
}

/**
 * Update a part
 */
async function updatePart(partId: string, updates: Partial<Part>): Promise<Part> {
  const response = await apiClient.put<Part>(`/api/v1/inventory/parts/${partId}`, updates)
  return response
}

/**
 * Delete a part
 */
async function deletePart(partId: string): Promise<void> {
  await apiClient.delete(`/api/v1/inventory/parts/${partId}`)
}

/**
 * Create an inventory transaction
 */
async function createTransaction(transaction: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
  const response = await apiClient.post<InventoryTransaction>(
    "/api/v1/inventory/transactions",
    transaction
  )
  return response
}

/**
 * Calculate stats from parts array
 */
function calculateStats(parts: Part[]): InventoryStats {
  return {
    totalParts: parts.length,
    totalValue: parts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0),
    lowStockCount: parts.filter(p => p.quantityOnHand > 0 && p.quantityOnHand <= p.reorderPoint).length,
    outOfStockCount: parts.filter(p => p.quantityOnHand === 0).length,
    overstockedCount: parts.filter(p => p.quantityOnHand >= p.maxStockLevel).length
  }
}

/**
 * Generate emulator parts data
 */
function generateEmulatorParts(): Part[] {
  return [
    {
      id: "part-1",
      partNumber: "OIL-FILTER-001",
      name: "Engine Oil Filter",
      description: "High-performance oil filter for fleet vehicles",
      category: "filters",
      manufacturer: "ACDelco",
      compatibleVehicles: ["vehicle-1", "vehicle-2", "vehicle-3"],
      quantityOnHand: 45,
      minStockLevel: 20,
      maxStockLevel: 100,
      reorderPoint: 30,
      unitCost: 12.99,
      location: "Shelf A-12",
      alternateVendors: ["vendor-1", "vendor-2"]
    },
    {
      id: "part-2",
      partNumber: "BRAKE-PAD-002",
      name: "Front Brake Pads",
      description: "Ceramic brake pads for heavy-duty vehicles",
      category: "brakes",
      manufacturer: "Brembo",
      compatibleVehicles: ["vehicle-1", "vehicle-4"],
      quantityOnHand: 12,
      minStockLevel: 10,
      maxStockLevel: 50,
      reorderPoint: 15,
      unitCost: 89.99,
      location: "Shelf B-5",
      alternateVendors: ["vendor-3"]
    },
    {
      id: "part-3",
      partNumber: "AIR-FILTER-003",
      name: "Engine Air Filter",
      description: "Premium air filter for optimal engine performance",
      category: "filters",
      manufacturer: "K&N",
      compatibleVehicles: ["vehicle-1", "vehicle-2", "vehicle-3", "vehicle-5"],
      quantityOnHand: 8,
      minStockLevel: 15,
      maxStockLevel: 75,
      reorderPoint: 20,
      unitCost: 24.99,
      location: "Shelf A-15",
      alternateVendors: ["vendor-1"]
    },
    {
      id: "part-4",
      partNumber: "TIRE-ALL-004",
      name: "All-Season Tire LT275/65R18",
      description: "Commercial-grade all-season tire",
      category: "tires",
      manufacturer: "Michelin",
      compatibleVehicles: ["vehicle-3", "vehicle-4"],
      quantityOnHand: 0,
      minStockLevel: 8,
      maxStockLevel: 32,
      reorderPoint: 12,
      unitCost: 189.99,
      location: "Tire Rack 1",
      alternateVendors: ["vendor-4", "vendor-5"]
    },
    {
      id: "part-5",
      partNumber: "WIPER-BLADE-005",
      name: "Windshield Wiper Blade 22in",
      description: "Heavy-duty wiper blade",
      category: "other",
      manufacturer: "Bosch",
      compatibleVehicles: ["vehicle-1", "vehicle-2", "vehicle-3", "vehicle-4", "vehicle-5"],
      quantityOnHand: 28,
      minStockLevel: 12,
      maxStockLevel: 60,
      reorderPoint: 18,
      unitCost: 19.99,
      location: "Shelf C-8",
      alternateVendors: ["vendor-1", "vendor-2"]
    },
    {
      id: "part-6",
      partNumber: "BATTERY-006",
      name: "Heavy-Duty Battery 12V 850CCA",
      description: "Maintenance-free battery for fleet vehicles",
      category: "electrical",
      manufacturer: "Interstate",
      compatibleVehicles: ["vehicle-1", "vehicle-3", "vehicle-4"],
      quantityOnHand: 3,
      minStockLevel: 5,
      maxStockLevel: 20,
      reorderPoint: 8,
      unitCost: 149.99,
      location: "Battery Cabinet",
      alternateVendors: ["vendor-3", "vendor-4"]
    },
    {
      id: "part-7",
      partNumber: "COOLANT-007",
      name: "Engine Coolant 1 Gallon",
      description: "Extended life antifreeze/coolant",
      category: "fluids",
      manufacturer: "Prestone",
      compatibleVehicles: ["vehicle-1", "vehicle-2", "vehicle-3", "vehicle-4", "vehicle-5"],
      quantityOnHand: 65,
      minStockLevel: 25,
      maxStockLevel: 100,
      reorderPoint: 35,
      unitCost: 14.99,
      location: "Fluids Storage",
      alternateVendors: ["vendor-1", "vendor-2"]
    },
    {
      id: "part-8",
      partNumber: "SPARK-PLUG-008",
      name: "Iridium Spark Plug",
      description: "Long-life iridium spark plug",
      category: "engine",
      manufacturer: "NGK",
      compatibleVehicles: ["vehicle-1", "vehicle-2"],
      quantityOnHand: 42,
      minStockLevel: 20,
      maxStockLevel: 80,
      reorderPoint: 30,
      unitCost: 8.99,
      location: "Shelf A-3",
      alternateVendors: ["vendor-2", "vendor-3"]
    }
  ]
}

/**
 * Main inventory hook
 */
export function useInventory() {
  const queryClient = useQueryClient()

  // Fetch all parts
  const {
    data: parts,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Part[]>({
    queryKey: ["inventory", "parts"],
    queryFn: fetchParts,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch stats
  const {
    data: stats,
    isLoading: statsLoading
  } = useQuery<InventoryStats>({
    queryKey: ["inventory", "stats"],
    queryFn: fetchInventoryStats,
    staleTime: 30 * 1000
  })

  // Fetch transactions
  const {
    data: transactions,
    isLoading: transactionsLoading
  } = useQuery<InventoryTransaction[]>({
    queryKey: ["inventory", "transactions"],
    queryFn: () => fetchTransactions(),
    staleTime: 60 * 1000
  })

  // Add part mutation
  const addPartMutation = useMutation({
    mutationFn: createPart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] })
    },
    onError: (error) => {
      logger.error("Failed to add part:", error)
      toast.error("Failed to add part")
    }
  })

  // Update part mutation
  const updatePartMutation = useMutation({
    mutationFn: ({ partId, updates }: { partId: string; updates: Partial<Part> }) =>
      updatePart(partId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] })
    },
    onError: (error) => {
      logger.error("Failed to update part:", error)
      toast.error("Failed to update part")
    }
  })

  // Delete part mutation
  const deletePartMutation = useMutation({
    mutationFn: deletePart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] })
    },
    onError: (error) => {
      logger.error("Failed to delete part:", error)
      toast.error("Failed to delete part")
    }
  })

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "parts"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "stats"] })
      queryClient.invalidateQueries({ queryKey: ["inventory", "transactions"] })
    },
    onError: (error) => {
      logger.error("Failed to create transaction:", error)
      toast.error("Failed to record transaction")
    }
  })

  return {
    // Data
    parts: parts || [],
    stats,
    transactions: transactions || [],

    // Loading states
    isLoading,
    statsLoading,
    transactionsLoading,

    // Error states
    isError,
    error,

    // Actions
    addPart: addPartMutation.mutateAsync,
    updatePart: (partId: string, updates: Partial<Part>) =>
      updatePartMutation.mutateAsync({ partId, updates }),
    deletePart: deletePartMutation.mutateAsync,
    createTransaction: createTransactionMutation.mutateAsync,
    refetch,

    // Mutation states
    isAdding: addPartMutation.isPending,
    isUpdating: updatePartMutation.isPending,
    isDeleting: deletePartMutation.isPending,
    isCreatingTransaction: createTransactionMutation.isPending
  }
}

/**
 * Hook for fetching a single part
 */
export function usePart(partId: string) {
  const { data, isLoading, error } = useQuery<Part>({
    queryKey: ["inventory", "parts", partId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Part>(`/api/v1/inventory/parts/${partId}`)
        return response
      } catch (error) {
        // Fallback to finding in emulator data
        const parts = generateEmulatorParts()
        const part = parts.find(p => p.id === partId)
        if (!part) throw new Error("Part not found")
        return part
      }
    },
    enabled: !!partId,
    staleTime: 60 * 1000
  })

  return {
    part: data,
    isLoading,
    error
  }
}

/**
 * Hook for fetching parts by category
 */
export function usePartsByCategory(category: Part["category"]) {
  const { parts, isLoading, error } = useInventory()

  const filteredParts = parts.filter(p => p.category === category)

  return {
    parts: filteredParts,
    isLoading,
    error
  }
}

/**
 * Hook for low stock parts
 */
export function useLowStockParts() {
  const { parts, isLoading, error } = useInventory()

  const lowStockParts = parts.filter(p => p.quantityOnHand <= p.reorderPoint)

  return {
    parts: lowStockParts,
    count: lowStockParts.length,
    isLoading,
    error
  }
}
