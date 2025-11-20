/**
 * React Query hooks for Personal Use trip classification and policies
 * Manages trip usage data, personal use policies, and related mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import logger from '@/utils/logger'

// Query keys for cache management
export const personalUseQueryKeys = {
  all: ['personalUse'] as const,
  policies: () => [...personalUseQueryKeys.all, 'policies'] as const,
  tripUsages: () => [...personalUseQueryKeys.all, 'tripUsages'] as const,
  tripUsage: (id: string) => [...personalUseQueryKeys.all, 'tripUsage', id] as const,
}

// Interface types
export interface Policy {
  allow_personal_use: boolean
  require_approval: boolean
  charge_personal_use: boolean
  personal_use_rate_per_mile?: number
  auto_approve_under_miles?: number
}

export interface TripUsageData {
  usage_type: 'business' | 'personal' | 'mixed'
  business_percentage?: number
  business_purpose?: string
  personal_notes?: string
  vehicle_id?: string
  driver_id?: string
  miles_total?: number
  trip_date?: string
  start_location?: string
  end_location?: string
  start_odometer?: number
  end_odometer?: number
}

export interface TripUsageResponse {
  id: string
  approval_status: 'pending' | 'approved' | 'rejected'
  data: TripUsageData
}

/**
 * Fetch personal use policies
 * Caches policy data and refetches in the background
 */
export function usePersonalUsePolicies() {
  return useQuery({
    queryKey: personalUseQueryKeys.policies(),
    queryFn: async () => {
      const response: any = await apiClient.personalUse.getPolicies()
      return response.data as Policy
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    enabled: true,
  })
}

/**
 * Fetch all trip usages with optional filters
 */
export function useTripsUsage(params?: any) {
  return useQuery({
    queryKey: [...personalUseQueryKeys.tripUsages(), params],
    queryFn: async () => {
      const response: any = await apiClient.personalUse.getTripUsages(params)
      return response.data
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Fetch a specific trip usage by ID
 */
export function useTripUsage(id: string | null) {
  return useQuery({
    queryKey: id ? personalUseQueryKeys.tripUsage(id) : ['disabled'],
    queryFn: async () => {
      if (!id) return null
      const response: any = await apiClient.personalUse.getTripUsage(id)
      return response.data
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Create a new trip usage record
 * Automatically invalidates and refetches related queries
 */
export function useCreateTripUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TripUsageData) => {
      const response: any = await apiClient.personalUse.createTripUsage(data)
      return response.data as TripUsageResponse
    },
    onSuccess: (data) => {
      // Invalidate trip usages list to trigger refetch
      queryClient.invalidateQueries({ queryKey: personalUseQueryKeys.tripUsages() })

      // Optionally add to cache directly for instant update
      queryClient.setQueryData(personalUseQueryKeys.tripUsage(data.id), data)
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create trip usage'
      logger.error('Error creating trip usage:', { error })
    }
  })
}

/**
 * Mark a trip with usage classification
 * Used by TripMarker component for quick trip classification
 */
export function useMarkTrip() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tripId, data }: { tripId: string; data: TripUsageData }) => {
      const response: any = await apiClient.personalUse.markTrip(tripId, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Invalidate trip usages to refresh list
      queryClient.invalidateQueries({ queryKey: personalUseQueryKeys.tripUsages() })

      // Update the specific trip if it's in cache
      queryClient.invalidateQueries({
        queryKey: personalUseQueryKeys.tripUsage(variables.tripId)
      })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to mark trip'
      logger.error('Error marking trip:', { error })
    }
  })
}

/**
 * Update an existing trip usage record
 */
export function useUpdateTripUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TripUsageData> }) => {
      const response: any = await apiClient.personalUse.updateTripUsage(id, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      // Update specific trip in cache
      queryClient.setQueryData(personalUseQueryKeys.tripUsage(variables.id), data)

      // Invalidate list to sync
      queryClient.invalidateQueries({ queryKey: personalUseQueryKeys.tripUsages() })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update trip usage'
      logger.error('Error updating trip usage:', { error })
    }
  })
}

/**
 * Delete a trip usage record
 */
export function useDeleteTripUsage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.personalUse.deleteTripUsage(id)
    },
    onSuccess: (data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: personalUseQueryKeys.tripUsage(id) })

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: personalUseQueryKeys.tripUsages() })
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete trip usage'
      logger.error('Error deleting trip usage:', { error })
    }
  })
}
