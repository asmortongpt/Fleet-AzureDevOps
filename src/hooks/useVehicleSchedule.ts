/**
 * React Hook for Vehicle Schedule
 * Provides a combined view of reservations and maintenance for a specific vehicle
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { VehicleSchedule } from '@/types/scheduling'

// Query keys for cache management
export const vehicleScheduleKeys = {
  all: ['vehicle-schedule'] as const,
  vehicle: (vehicleId: string) => [...vehicleScheduleKeys.all, vehicleId] as const,
  vehicleWithDates: (vehicleId: string, startDate?: string, endDate?: string) =>
    [...vehicleScheduleKeys.vehicle(vehicleId), { startDate, endDate }] as const,
}

/**
 * Hook to fetch a vehicle's complete schedule including reservations and maintenance
 * @param vehicleId - The vehicle ID to fetch schedule for
 * @param startDate - Optional start date filter (ISO string)
 * @param endDate - Optional end date filter (ISO string)
 * @param options - Query options including enabled flag
 */
export function useVehicleSchedule(
  vehicleId: string | null,
  options?: {
    startDate?: string
    endDate?: string
    enabled?: boolean
  }
) {
  const { startDate, endDate, enabled = true } = options || {}

  return useQuery({
    queryKey: vehicleScheduleKeys.vehicleWithDates(vehicleId!, startDate, endDate),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await apiClient.get<{
        success: boolean
        schedule: VehicleSchedule
      }>(`/api/scheduling/vehicle/${vehicleId}/schedule`, params)

      return response.schedule
    },
    enabled: enabled && !!vehicleId,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook with additional utility methods for working with vehicle schedules
 */
export function useVehicleScheduleWithUtils(
  vehicleId: string | null,
  options?: {
    startDate?: string
    endDate?: string
    enabled?: boolean
  }
) {
  const query = useVehicleSchedule(vehicleId, options)

  return {
    // Query data
    schedule: query.data,
    reservations: query.data?.reservations || [],
    maintenance: query.data?.maintenance || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,

    // Utility methods
    hasUpcomingReservations: () => {
      if (!query.data?.reservations) return false
      const now = new Date()
      return query.data.reservations.some(
        reservation =>
          new Date(reservation.start_time) > now &&
          reservation.status !== 'cancelled'
      )
    },

    hasUpcomingMaintenance: () => {
      if (!query.data?.maintenance) return false
      const now = new Date()
      return query.data.maintenance.some(
        appointment =>
          new Date(appointment.scheduled_start) > now &&
          appointment.status !== 'cancelled'
      )
    },

    getNextReservation: () => {
      if (!query.data?.reservations) return null
      const now = new Date()
      const upcoming = query.data.reservations
        .filter(
          reservation =>
            new Date(reservation.start_time) > now &&
            reservation.status !== 'cancelled'
        )
        .sort((a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      return upcoming[0] || null
    },

    getNextMaintenance: () => {
      if (!query.data?.maintenance) return null
      const now = new Date()
      const upcoming = query.data.maintenance
        .filter(
          appointment =>
            new Date(appointment.scheduled_start) > now &&
            appointment.status !== 'cancelled'
        )
        .sort((a, b) =>
          new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
        )
      return upcoming[0] || null
    },

    getCurrentReservation: () => {
      if (!query.data?.reservations) return null
      const now = new Date()
      return query.data.reservations.find(
        reservation =>
          new Date(reservation.start_time) <= now &&
          new Date(reservation.end_time) >= now &&
          (reservation.status === 'confirmed' || reservation.status === 'active')
      ) || null
    },

    getCurrentMaintenance: () => {
      if (!query.data?.maintenance) return null
      const now = new Date()
      return query.data.maintenance.find(
        appointment =>
          new Date(appointment.scheduled_start) <= now &&
          new Date(appointment.scheduled_end) >= now &&
          (appointment.status === 'scheduled' || appointment.status === 'in_progress')
      ) || null
    },

    isVehicleAvailable: (checkStart: Date, checkEnd: Date) => {
      if (!query.data) return true

      const { reservations, maintenance } = query.data

      // Check reservations
      const hasReservationConflict = reservations.some(
        reservation =>
          reservation.status !== 'cancelled' &&
          new Date(reservation.start_time) < checkEnd &&
          new Date(reservation.end_time) > checkStart
      )

      // Check maintenance
      const hasMaintenanceConflict = maintenance.some(
        appointment =>
          appointment.status !== 'cancelled' &&
          new Date(appointment.scheduled_start) < checkEnd &&
          new Date(appointment.scheduled_end) > checkStart
      )

      return !hasReservationConflict && !hasMaintenanceConflict
    },

    getAllEvents: () => {
      if (!query.data) return []

      const events = [
        ...query.data.reservations.map(reservation => ({
          id: reservation.id,
          type: 'reservation' as const,
          start: new Date(reservation.start_time),
          end: new Date(reservation.end_time),
          status: reservation.status,
          data: reservation,
        })),
        ...query.data.maintenance.map(appointment => ({
          id: appointment.id,
          type: 'maintenance' as const,
          start: new Date(appointment.scheduled_start),
          end: new Date(appointment.scheduled_end),
          status: appointment.status,
          data: appointment,
        })),
      ]

      // Sort by start time
      return events.sort((a, b) => a.start.getTime() - b.start.getTime())
    },

    getEventsForDateRange: (start: Date, end: Date) => {
      if (!query.data) return []

      const events = [
        ...query.data.reservations
          .filter(
            reservation =>
              new Date(reservation.start_time) < end &&
              new Date(reservation.end_time) > start
          )
          .map(reservation => ({
            id: reservation.id,
            type: 'reservation' as const,
            start: new Date(reservation.start_time),
            end: new Date(reservation.end_time),
            status: reservation.status,
            data: reservation,
          })),
        ...query.data.maintenance
          .filter(
            appointment =>
              new Date(appointment.scheduled_start) < end &&
              new Date(appointment.scheduled_end) > start
          )
          .map(appointment => ({
            id: appointment.id,
            type: 'maintenance' as const,
            start: new Date(appointment.scheduled_start),
            end: new Date(appointment.scheduled_end),
            status: appointment.status,
            data: appointment,
          })),
      ]

      return events.sort((a, b) => a.start.getTime() - b.start.getTime())
    },

    // Refresh method
    refresh: () => query.refetch(),
  }
}

// Export both hooks
export default useVehicleSchedule
