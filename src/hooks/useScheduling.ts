/**
 * React Hook for Scheduling Operations
 * Uses TanStack Query for data fetching, caching, and optimistic updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  VehicleReservation,
  MaintenanceAppointment,
  CreateReservationRequest,
  UpdateReservationRequest,
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  CheckConflictsRequest,
  ScheduleConflict,
  ReservationFilters,
  MaintenanceFilters,
  AvailableVehiclesParams,
  AvailableServiceBaysParams,
  Vehicle,
  ServiceBay
} from '@/types/scheduling'

// Query keys for cache management
export const schedulingKeys = {
  all: ['scheduling'] as const,
  reservations: () => [...schedulingKeys.all, 'reservations'] as const,
  reservationsList: (filters?: ReservationFilters) => [...schedulingKeys.reservations(), { filters }] as const,
  reservation: (id: string) => [...schedulingKeys.reservations(), id] as const,
  maintenance: () => [...schedulingKeys.all, 'maintenance'] as const,
  maintenanceList: (filters?: MaintenanceFilters) => [...schedulingKeys.maintenance(), { filters }] as const,
  maintenanceItem: (id: string) => [...schedulingKeys.maintenance(), id] as const,
  conflicts: (params: CheckConflictsRequest) => [...schedulingKeys.all, 'conflicts', params] as const,
  availableVehicles: (params: AvailableVehiclesParams) => [...schedulingKeys.all, 'available-vehicles', params] as const,
  availableServiceBays: (params: AvailableServiceBaysParams) => [...schedulingKeys.all, 'available-service-bays', params] as const,
}

// ============================================
// VEHICLE RESERVATIONS
// ============================================

/**
 * Hook to fetch vehicle reservations with optional filters
 */
export function useReservations(filters?: ReservationFilters) {
  return useQuery({
    queryKey: schedulingKeys.reservationsList(filters),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        count: number
        reservations: VehicleReservation[]
      }>('/api/scheduling/reservations', filters)
      return response.reservations
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to create a new vehicle reservation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateReservationRequest) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        reservation: VehicleReservation
      }>('/api/scheduling/reservations', data)
      return response.reservation
    },
    onMutate: async (newReservation) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: schedulingKeys.reservations() })

      // Snapshot previous value
      const previousReservations = queryClient.getQueryData(schedulingKeys.reservationsList())

      // Optimistically update to the new value
      queryClient.setQueryData(
        schedulingKeys.reservationsList(),
        (old: VehicleReservation[] | undefined) => {
          if (!old) return old

          const optimisticReservation: VehicleReservation = {
            id: 'temp-' + Date.now(),
            tenant_id: '',
            vehicle_id: newReservation.vehicleId,
            reserved_by: '',
            driver_id: newReservation.driverId,
            reservation_type: newReservation.reservationType || 'general',
            start_time: typeof newReservation.startTime === 'string'
              ? newReservation.startTime
              : newReservation.startTime.toISOString(),
            end_time: typeof newReservation.endTime === 'string'
              ? newReservation.endTime
              : newReservation.endTime.toISOString(),
            pickup_location: newReservation.pickupLocation,
            dropoff_location: newReservation.dropoffLocation,
            estimated_miles: newReservation.estimatedMiles,
            purpose: newReservation.purpose,
            notes: newReservation.notes,
            status: 'pending',
            approval_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          return [optimisticReservation, ...old]
        }
      )

      return { previousReservations }
    },
    onError: (err, newReservation, context) => {
      // Rollback on error
      if (context?.previousReservations) {
        queryClient.setQueryData(
          schedulingKeys.reservationsList(),
          context.previousReservations
        )
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservations() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.availableVehicles })
    },
  })
}

/**
 * Hook to update a vehicle reservation
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateReservationRequest }) => {
      const response = await apiClient.patch<{
        success: boolean
        message: string
        reservation: VehicleReservation
      }>(`/api/scheduling/reservations/${id}`, data)
      return response.reservation
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: schedulingKeys.reservation(id) })

      const previousReservation = queryClient.getQueryData(schedulingKeys.reservation(id))

      // Optimistically update
      queryClient.setQueryData(
        schedulingKeys.reservation(id),
        (old: VehicleReservation | undefined) => {
          if (!old) return old
          return { ...old, ...data, updated_at: new Date().toISOString() }
        }
      )

      return { previousReservation }
    },
    onError: (err, { id }, context) => {
      if (context?.previousReservation) {
        queryClient.setQueryData(schedulingKeys.reservation(id), context.previousReservation)
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservations() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservation(id) })
    },
  })
}

/**
 * Hook to cancel a vehicle reservation
 */
export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<{
        success: boolean
        message: string
      }>(`/api/scheduling/reservations/${id}`)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservations() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.availableVehicles })
    },
  })
}

/**
 * Hook to approve a vehicle reservation
 */
export function useApproveReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        reservation: VehicleReservation
      }>(`/api/scheduling/reservations/${id}/approve`, {})
      return response.reservation
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservations() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservation(id) })
    },
  })
}

/**
 * Hook to reject a vehicle reservation
 */
export function useRejectReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        reservation: VehicleReservation
      }>(`/api/scheduling/reservations/${id}/reject`, { reason })
      return response.reservation
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservations() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.reservation(id) })
    },
  })
}

// ============================================
// MAINTENANCE APPOINTMENTS
// ============================================

/**
 * Hook to fetch maintenance appointments with optional filters
 */
export function useMaintenanceAppointments(filters?: MaintenanceFilters) {
  return useQuery({
    queryKey: schedulingKeys.maintenanceList(filters),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        count: number
        appointments: MaintenanceAppointment[]
      }>('/api/scheduling/maintenance', filters)
      return response.appointments
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to create a new maintenance appointment
 */
export function useCreateMaintenanceAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMaintenanceRequest) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        appointment: MaintenanceAppointment
      }>('/api/scheduling/maintenance', data)
      return response.appointment
    },
    onMutate: async (newAppointment) => {
      await queryClient.cancelQueries({ queryKey: schedulingKeys.maintenance() })

      const previousAppointments = queryClient.getQueryData(schedulingKeys.maintenanceList())

      queryClient.setQueryData(
        schedulingKeys.maintenanceList(),
        (old: MaintenanceAppointment[] | undefined) => {
          if (!old) return old

          const optimisticAppointment: MaintenanceAppointment = {
            id: 'temp-' + Date.now(),
            tenant_id: '',
            vehicle_id: newAppointment.vehicleId,
            appointment_type_id: newAppointment.appointmentTypeId,
            scheduled_start: typeof newAppointment.scheduledStart === 'string'
              ? newAppointment.scheduledStart
              : newAppointment.scheduledStart.toISOString(),
            scheduled_end: typeof newAppointment.scheduledEnd === 'string'
              ? newAppointment.scheduledEnd
              : newAppointment.scheduledEnd.toISOString(),
            assigned_technician_id: newAppointment.assignedTechnicianId,
            service_bay_id: newAppointment.serviceBayId,
            work_order_id: newAppointment.workOrderId,
            priority: newAppointment.priority || 'medium',
            status: 'scheduled',
            notes: newAppointment.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          return [optimisticAppointment, ...old]
        }
      )

      return { previousAppointments }
    },
    onError: (err, newAppointment, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          schedulingKeys.maintenanceList(),
          context.previousAppointments
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.maintenance() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.availableServiceBays })
    },
  })
}

/**
 * Hook to update a maintenance appointment
 */
export function useUpdateMaintenanceAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaintenanceRequest }) => {
      const response = await apiClient.patch<{
        success: boolean
        message: string
        appointment: MaintenanceAppointment
      }>(`/api/scheduling/maintenance/${id}`, data)
      return response.appointment
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: schedulingKeys.maintenanceItem(id) })

      const previousAppointment = queryClient.getQueryData(schedulingKeys.maintenanceItem(id))

      queryClient.setQueryData(
        schedulingKeys.maintenanceItem(id),
        (old: MaintenanceAppointment | undefined) => {
          if (!old) return old
          return { ...old, ...data, updated_at: new Date().toISOString() }
        }
      )

      return { previousAppointment }
    },
    onError: (err, { id }, context) => {
      if (context?.previousAppointment) {
        queryClient.setQueryData(schedulingKeys.maintenanceItem(id), context.previousAppointment)
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.maintenance() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.maintenanceItem(id) })
    },
  })
}

/**
 * Hook to cancel a maintenance appointment
 */
export function useCancelMaintenanceAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<{
        success: boolean
        message: string
        appointment: MaintenanceAppointment
      }>(`/api/scheduling/maintenance/${id}`, { status: 'cancelled' })
      return response.appointment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: schedulingKeys.maintenance() })
      queryClient.invalidateQueries({ queryKey: schedulingKeys.availableServiceBays })
    },
  })
}

// ============================================
// AVAILABILITY & CONFLICTS
// ============================================

/**
 * Hook to check for scheduling conflicts
 */
export function useCheckConflicts(params: CheckConflictsRequest, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: schedulingKeys.conflicts(params),
    queryFn: async () => {
      const response = await apiClient.post<{
        success: boolean
        hasConflicts: boolean
        conflicts: ScheduleConflict
      }>('/api/scheduling/check-conflicts', params)
      return response
    },
    enabled: options?.enabled !== false,
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Hook to find available vehicles for a time period
 */
export function useAvailableVehicles(params: AvailableVehiclesParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: schedulingKeys.availableVehicles(params),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        count: number
        vehicles: Vehicle[]
      }>('/api/scheduling/available-vehicles', params)
      return response.vehicles
    },
    enabled: options?.enabled !== false && !!params.startTime && !!params.endTime,
    staleTime: 10000, // 10 seconds
  })
}

/**
 * Hook to find available service bays
 */
export function useAvailableServiceBays(params: AvailableServiceBaysParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: schedulingKeys.availableServiceBays(params),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        count: number
        serviceBays: ServiceBay[]
      }>('/api/scheduling/available-service-bays', params)
      return response.serviceBays
    },
    enabled: options?.enabled !== false && !!params.facilityId && !!params.startTime && !!params.endTime,
    staleTime: 10000, // 10 seconds
  })
}

// ============================================
// COMBINED HOOK FOR SCHEDULING MODULE
// ============================================

/**
 * Main hook that provides all scheduling functionality
 * This is a convenience hook that combines all scheduling operations
 */
export function useScheduling() {
  return {
    // Reservations
    reservations: {
      useList: useReservations,
      useCreate: useCreateReservation,
      useUpdate: useUpdateReservation,
      useCancel: useCancelReservation,
      useApprove: useApproveReservation,
      useReject: useRejectReservation,
    },
    // Maintenance
    maintenance: {
      useList: useMaintenanceAppointments,
      useCreate: useCreateMaintenanceAppointment,
      useUpdate: useUpdateMaintenanceAppointment,
      useCancel: useCancelMaintenanceAppointment,
    },
    // Availability
    availability: {
      useCheckConflicts: useCheckConflicts,
      useAvailableVehicles: useAvailableVehicles,
      useAvailableServiceBays: useAvailableServiceBays,
    },
  }
}
