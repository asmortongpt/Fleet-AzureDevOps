/**
 * useInventory Hook
 *
 * React hook for managing inventory with API integration.
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
import { toast } from "sonner"

import { Part, InventoryTransaction } from "@/lib/types"
import logger from '@/utils/logger';
import { secureFetch } from "@/hooks/use-api"
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
const unwrapRows = <T,>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[]
  if (payload?.data && Array.isArray(payload.data)) return payload.data as T[]
  if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data as T[]
  return []
}

const mapCategory = (category?: string): Part['category'] => {
  switch (category) {
    case 'fluids':
      return 'fluids'
    case 'tires':
      return 'tires'
    case 'filters':
      return 'filters'
    case 'electrical':
    case 'lighting':
    case 'batteries':
      return 'electrical'
    case 'brakes':
      return 'brakes'
    case 'engine':
      return 'engine'
    case 'transmission':
      return 'transmission'
    default:
      return 'other'
  }
}

const mapInventoryItemToPart = (row: any): Part => {
  const quantityOnHand = Number(row.quantity_on_hand ?? row.quantityOnHand ?? 0)
  const reorderPoint = Number(row.reorder_point ?? row.reorderPoint ?? 0)
  const reorderQuantity = Number(row.reorder_quantity ?? 0)
  return {
    id: row.id,
    partNumber: row.part_number || row.partNumber || row.sku || '',
    name: row.name,
    description: row.description || '',
    category: mapCategory(row.category),
    manufacturer: row.manufacturer || row.primary_supplier_name || 'Unknown',
    compatibleVehicles: row.compatible_models || row.compatible_vehicles || [],
    quantityOnHand,
    minStockLevel: reorderPoint,
    maxStockLevel: reorderPoint + (reorderQuantity || 0),
    reorderPoint,
    unitCost: Number(row.unit_cost ?? row.unitCost ?? 0),
    location: row.warehouse_location || row.bin_location || row.location || '',
    preferredVendorId: row.primary_supplier_id,
    alternateVendors: [],
    lastOrdered: row.last_ordered || row.last_restocked,
    lastUsed: row.last_used,
    imageUrl: row.metadata?.image_url
  }
}

async function fetchParts(): Promise<Part[]> {
  try {
    const response = await secureFetch("/api/inventory/items?limit=200")
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory items (${response.status})`)
    }
    const payload = await response.json()
    const rows = unwrapRows<any>(payload)
    return rows.map(mapInventoryItemToPart)
  } catch (error) {
    logger.error("Inventory API unavailable", error)
    return []
  }
}

/**
 * Fetch inventory stats
 */
async function fetchInventoryStats(): Promise<InventoryStats> {
  const parts = await fetchParts()
  return calculateStats(parts)
}

/**
 * Fetch inventory transactions
 */
async function fetchTransactions(partId?: string): Promise<InventoryTransaction[]> {
  try {
    const url = partId
      ? `/api/inventory/transactions?item_id=${encodeURIComponent(partId)}`
      : "/api/inventory/transactions"
    const response = await secureFetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory transactions (${response.status})`)
    }
    const payload = await response.json()
    const rows = unwrapRows<any>(payload)
    return rows.map((row: any) => ({
      id: row.id,
      partId: row.item_id,
      partNumber: row.part_number || row.sku || '',
      type: row.transaction_type,
      quantity: Number(row.quantity ?? 0),
      date: row.timestamp || row.date || row.created_at,
      reference: row.reference_number,
      workOrderId: row.work_order_id,
      cost: Number(row.total_cost ?? row.unit_cost ?? 0),
      performedBy: row.user_name || 'Unknown',
      notes: row.notes
    }))
  } catch (error) {
    logger.error("Transactions API unavailable", error)
    return []
  }
}

/**
 * Create a new part
 */
async function createPart(part: Partial<Part>): Promise<Part> {
  const response = await secureFetch("/api/inventory/items", {
    method: 'POST',
    body: JSON.stringify(part)
  })
  if (!response.ok) throw new Error('Failed to create inventory item')
  const payload = await response.json()
  return mapInventoryItemToPart(payload.data || payload)
}

/**
 * Update a part
 */
async function updatePart(partId: string, updates: Partial<Part>): Promise<Part> {
  const response = await secureFetch(`/api/inventory/items/${partId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  if (!response.ok) throw new Error('Failed to update inventory item')
  const payload = await response.json()
  return mapInventoryItemToPart(payload.data || payload)
}

/**
 * Delete a part
 */
async function deletePart(partId: string): Promise<void> {
  const response = await secureFetch(`/api/inventory/items/${partId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete inventory item')
}

/**
 * Create an inventory transaction
 */
async function createTransaction(transaction: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
  const response = await secureFetch("/api/inventory/transactions", {
    method: 'POST',
    body: JSON.stringify(transaction)
  })
  if (!response.ok) throw new Error('Failed to create inventory transaction')
  const payload = await response.json()
  const row = payload.data || payload
  return {
    id: row.id,
    partId: row.item_id,
    partNumber: row.part_number || row.sku || '',
    type: row.transaction_type,
    quantity: Number(row.quantity ?? 0),
    date: row.timestamp || row.date || row.created_at,
    reference: row.reference_number,
    workOrderId: row.work_order_id,
    cost: Number(row.total_cost ?? row.unit_cost ?? 0),
    performedBy: row.user_name || 'Unknown',
    notes: row.notes
  }
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
      const response = await secureFetch(`/api/inventory/items/${partId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory item (${response.status})`)
      }
      const payload = await response.json()
      const row = payload.data || payload
      return mapInventoryItemToPart(row)
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
