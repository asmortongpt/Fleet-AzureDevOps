/**
 * Calendar Integration Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CalendarEvent } from '@/types/microsoft'
import { toast } from 'sonner'

const calendarKeys = {
  all: ['calendar'] as const,
  events: (params?: any) => [...calendarKeys.all, 'events', params] as const,
  event: (eventId: string) => [...calendarKeys.all, 'event', eventId] as const,
}

export function useCalendarEvents(params?: {
  startDate?: string
  endDate?: string
  top?: number
}) {
  return useQuery({
    queryKey: calendarKeys.events(params),
    queryFn: async () => {
      const queryParams: any = { $orderby: 'start/dateTime' }
      if (params?.startDate) queryParams.$filter = `start/dateTime ge '${params.startDate}'`
      if (params?.endDate) {
        queryParams.$filter = queryParams.$filter
          ? `${queryParams.$filter} and end/dateTime le '${params.endDate}'`
          : `end/dateTime le '${params.endDate}'`
      }
      if (params?.top) queryParams.$top = params.top

      const response: any = await apiClient.calendar.listEvents(queryParams)
      return (response.value || []) as CalendarEvent[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (event: any) => await apiClient.calendar.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
      toast.success('Event created')
    },
    onError: () => toast.error('Failed to create event'),
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, data }: { eventId: string; data: any }) =>
      await apiClient.calendar.updateEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
      toast.success('Event updated')
    },
    onError: () => toast.error('Failed to update event'),
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (eventId: string) => await apiClient.calendar.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
      toast.success('Event deleted')
    },
    onError: () => toast.error('Failed to delete event'),
  })
}
