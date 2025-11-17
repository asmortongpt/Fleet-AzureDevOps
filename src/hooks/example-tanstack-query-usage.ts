/**
 * Example TanStack Query Hook Usage
 *
 * This file demonstrates how to use TanStack Query with the configured setup.
 * You can copy these patterns to create your own query hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-client'

// Example type definitions
interface Vehicle {
  id: string
  name: string
  status: string
  // ... other fields
}

interface VehicleFilters {
  status?: string
  search?: string
}

/**
 * Example Query Hook - Fetch all vehicles
 *
 * Usage in component:
 * const { data, isLoading, error } = useVehicles({ status: 'active' })
 */
export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    // Use the query key factory for consistent keys
    queryKey: queryKeys.vehicles.list(filters),

    // Your fetch function
    queryFn: async () => {
      const response = await fetch('/api/vehicles?' + new URLSearchParams(filters as any))
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      return response.json() as Promise<Vehicle[]>
    },

    // Optional: Override default options for this specific query
    // staleTime: 1000 * 60 * 10, // 10 minutes
    // enabled: true, // Only run query when this is true
  })
}

/**
 * Example Query Hook - Fetch single vehicle by ID
 *
 * Usage in component:
 * const { data: vehicle } = useVehicle(vehicleId)
 */
export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.detail(id!),
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch vehicle')
      }
      return response.json() as Promise<Vehicle>
    },
    // Only run query when we have an ID
    enabled: !!id,
  })
}

/**
 * Example Mutation Hook - Update a vehicle
 *
 * Usage in component:
 * const updateVehicle = useUpdateVehicle()
 *
 * // In event handler:
 * updateVehicle.mutate(
 *   { id: '123', data: { status: 'maintenance' } },
 *   {
 *     onSuccess: () => toast.success('Vehicle updated!'),
 *     onError: (error) => toast.error(error.message)
 *   }
 * )
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to update vehicle')
      }
      return response.json() as Promise<Vehicle>
    },

    // Optimistic update (optional)
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.vehicles.detail(id) })

      // Snapshot the previous value
      const previousVehicle = queryClient.getQueryData(queryKeys.vehicles.detail(id))

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.vehicles.detail(id), (old: Vehicle | undefined) =>
        old ? { ...old, ...data } : old
      )

      // Return context with the snapshot
      return { previousVehicle }
    },

    // On error, roll back
    onError: (err, { id }, context) => {
      if (context?.previousVehicle) {
        queryClient.setQueryData(queryKeys.vehicles.detail(id), context.previousVehicle)
      }
    },

    // Always refetch after error or success
    onSettled: (data, error, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() })
    },
  })
}

/**
 * Example Mutation Hook - Create a new vehicle
 *
 * Usage in component:
 * const createVehicle = useCreateVehicle()
 *
 * // In event handler:
 * createVehicle.mutate(newVehicleData)
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<Vehicle, 'id'>) => {
      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to create vehicle')
      }
      return response.json() as Promise<Vehicle>
    },

    // Invalidate vehicle list after successful creation
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.vehicles.lists() })
    },
  })
}

/**
 * Example: Infinite Query (for pagination)
 *
 * Usage in component:
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = useInfiniteVehicles()
 */
import { useInfiniteQuery } from '@tanstack/react-query'

export function useInfiniteVehicles(filters?: VehicleFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.vehicles.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch(
        `/api/vehicles?page=${pageParam}&` + new URLSearchParams(filters as any)
      )
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles')
      }
      return response.json() as Promise<{
        vehicles: Vehicle[]
        nextPage: number | null
        hasMore: boolean
      }>
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })
}
