/**
 * useReservations Hook
 *
 * React hook for managing vehicle reservations
 * Integrates with the backend API and Microsoft 365
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { apiClient } from '@/lib/api-client'

export interface Reservation {
  id: string
  vehicle_id: string
  driver_id: string
  start_date: string
  end_date: string
  purpose: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'active' | 'completed'
  outlook_event_id?: string
  created_at: string
  updated_at: string
  // Joined data
  vehicle_name?: string
  driver_name?: string
  driver_email?: string
}

export interface CreateReservationInput {
  vehicle_id: string
  driver_id: string
  start_date: string
  end_date: string
  purpose: string
}

export interface UpdateReservationInput {
  start_date?: string
  end_date?: string
  purpose?: string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
}

// Query keys
export const reservationKeys = {
  all: ['reservations'] as const,
  lists: () => [...reservationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...reservationKeys.lists(), filters] as const,
  details: () => [...reservationKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservationKeys.details(), id] as const,
  user: (userId: string) => [...reservationKeys.all, 'user', userId] as const,
  vehicle: (vehicleId: string) => [...reservationKeys.all, 'vehicle', vehicleId] as const,
}

/**
 * Hook to fetch all reservations
 */
export function useReservations(filters?: {
  status?: string
  vehicle_id?: string
  driver_id?: string
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: reservationKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        reservations: Reservation[]
      }>('/api/reservations', filters)

      return response.reservations
    },
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single reservation
 */
export function useReservation(reservationId: string | null) {
  return useQuery({
    queryKey: reservationKeys.detail(reservationId!),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        reservation: Reservation
      }>(`/api/reservations/${reservationId}`)

      return response.reservation
    },
    enabled: !!reservationId,
    staleTime: 30000,
  })
}

/**
 * Hook to fetch reservations for a specific user
 */
export function useUserReservations(userId: string | null) {
  return useQuery({
    queryKey: reservationKeys.user(userId!),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        reservations: Reservation[]
      }>(`/api/reservations/user/${userId}`)

      return response.reservations
    },
    enabled: !!userId,
    staleTime: 30000,
  })
}

/**
 * Hook to create a new reservation
 */
export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      // Create reservation in database
      const response = await apiClient.post<{
        success: boolean
        reservation: Reservation
      }>('/api/reservations', input)

      return response.reservation
    },
    onSuccess: async (reservation) => {
      // Invalidate and refetch reservations
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })

      // NOTE: Calendar event creation feature coming in next release
      // This will automatically create Outlook calendar events for reservations

      toast.success('Reservation created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create reservation')
    }
  })
}

/**
 * Hook to update a reservation
 */
export function useUpdateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateReservationInput }) => {
      const response = await apiClient.patch<{
        success: boolean
        reservation: Reservation
      }>(`/api/reservations/${id}`, updates)

      return response.reservation
    },
    onSuccess: (reservation) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      queryClient.invalidateQueries({ queryKey: reservationKeys.detail(reservation.id) })

      toast.success('Reservation updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update reservation')
    }
  })
}

/**
 * Hook to approve a reservation
 */
export function useApproveReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const response = await apiClient.post<{
        success: boolean
        reservation: Reservation
      }>(`/api/reservations/${reservationId}/approve`, {})

      return response.reservation
    },
    onSuccess: async (reservation) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })

      // NOTE: Email confirmation and calendar event creation coming in next release
      // This will automatically send confirmation emails and create Outlook calendar events

      toast.success('Reservation approved!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve reservation')
    }
  })
}

/**
 * Hook to reject a reservation
 */
export function useRejectReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const response = await apiClient.post<{
        success: boolean
        reservation: Reservation
      }>(`/api/reservations/${reservationId}/reject`, {})

      return response.reservation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      toast.success('Reservation rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject reservation')
    }
  })
}

/**
 * Hook to cancel a reservation
 */
export function useCancelReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservationId: string) => {
      const response = await apiClient.post<{
        success: boolean
        reservation: Reservation
      }>(`/api/reservations/${reservationId}/cancel`, {})

      return response.reservation
    },
    onSuccess: async (reservation) => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })

      // NOTE: Calendar event deletion feature coming in next release
      // This will automatically delete Outlook calendar events when reservations are cancelled

      toast.success('Reservation cancelled')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel reservation')
    }
  })
}

/**
 * Hook to delete a reservation
 */
export function useDeleteReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reservationId: string) => {
      await apiClient.delete(`/api/reservations/${reservationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservationKeys.all })
      toast.success('Reservation deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete reservation')
    }
  })
}

// Export all hooks
export default useReservations
