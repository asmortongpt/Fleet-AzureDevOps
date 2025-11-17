/**
 * React Hook for Appointment Types
 * Fetches and caches appointment types for maintenance scheduling
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { AppointmentType } from '@/types/scheduling'

// Query keys for cache management
export const appointmentTypesKeys = {
  all: ['appointment-types'] as const,
  lists: () => [...appointmentTypesKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...appointmentTypesKeys.lists(), { filters }] as const,
  detail: (id: string) => [...appointmentTypesKeys.all, 'detail', id] as const,
}

/**
 * Hook to fetch all active appointment types
 * Appointment types are typically static data, so they're cached for longer
 */
export function useAppointmentTypes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: appointmentTypesKeys.list(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        appointmentTypes: AppointmentType[]
      }>('/api/scheduling/appointment-types')
      return response.appointmentTypes
    },
    staleTime: 300000, // 5 minutes - appointment types don't change often
    gcTime: 600000, // 10 minutes
    enabled: options?.enabled !== false,
  })
}

/**
 * Hook to fetch a specific appointment type by ID
 */
export function useAppointmentType(id: string | null, options?: { enabled?: boolean }) {
  const { data: appointmentTypes } = useAppointmentTypes()

  return useQuery({
    queryKey: appointmentTypesKeys.detail(id!),
    queryFn: async () => {
      if (!appointmentTypes) {
        const response = await apiClient.get<{
          success: boolean
          appointmentTypes: AppointmentType[]
        }>('/api/scheduling/appointment-types')
        const type = response.appointmentTypes.find(t => t.id === id)
        return type || null
      }
      return appointmentTypes.find(t => t.id === id) || null
    },
    enabled: options?.enabled !== false && !!id,
    staleTime: 300000,
  })
}

/**
 * Hook with additional utility methods for appointment types
 */
export function useAppointmentTypesWithUtils() {
  const query = useAppointmentTypes()

  return {
    // Query data
    appointmentTypes: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Utility methods
    getById: (id: string) => {
      return query.data?.find(type => type.id === id) || null
    },

    getByName: (name: string) => {
      return query.data?.find(
        type => type.name.toLowerCase() === name.toLowerCase()
      ) || null
    },

    filterByActive: (isActive: boolean = true) => {
      return query.data?.filter(type => type.is_active === isActive) || []
    },

    sortByName: () => {
      return [...(query.data || [])].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    },

    sortByDuration: () => {
      return [...(query.data || [])].sort((a, b) =>
        a.estimated_duration - b.estimated_duration
      )
    },

    getColorMap: () => {
      const colorMap: Record<string, string> = {}
      query.data?.forEach(type => {
        colorMap[type.id] = type.color
      })
      return colorMap
    },

    getNameMap: () => {
      const nameMap: Record<string, string> = {}
      query.data?.forEach(type => {
        nameMap[type.id] = type.name
      })
      return nameMap
    },

    getDurationMap: () => {
      const durationMap: Record<string, number> = {}
      query.data?.forEach(type => {
        durationMap[type.id] = type.estimated_duration
      })
      return durationMap
    },

    // Get estimated end time based on type
    calculateEndTime: (typeId: string, startTime: Date) => {
      const type = query.data?.find(t => t.id === typeId)
      if (!type) return null

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + type.estimated_duration)
      return endTime
    },

    // Refresh method
    refresh: () => query.refetch(),
  }
}

// Export both hooks
export default useAppointmentTypes
