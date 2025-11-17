/**
 * React Hook for Calendar Integration
 * Manages Google Calendar and Microsoft Calendar connections and syncing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  CalendarIntegration,
  CalendarSyncRequest,
  GoogleCalendarCallbackRequest
} from '@/types/scheduling'

// Query keys for cache management
export const calendarKeys = {
  all: ['calendar'] as const,
  integrations: () => [...calendarKeys.all, 'integrations'] as const,
  integration: (id: string) => [...calendarKeys.integrations(), id] as const,
  authUrl: (provider: string) => [...calendarKeys.all, 'auth-url', provider] as const,
}

// ============================================
// CALENDAR INTEGRATIONS
// ============================================

/**
 * Hook to fetch user's calendar integrations
 */
export function useCalendarIntegrations() {
  return useQuery({
    queryKey: calendarKeys.integrations(),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        integrations: CalendarIntegration[]
      }>('/api/scheduling/calendar/integrations')
      return response.integrations
    },
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to get Google Calendar authorization URL
 */
export function useGoogleCalendarAuthUrl() {
  return useQuery({
    queryKey: calendarKeys.authUrl('google'),
    queryFn: async () => {
      const response = await apiClient.get<{
        success: boolean
        authUrl: string
      }>('/api/scheduling/calendar/google/authorize')
      return response.authUrl
    },
    staleTime: 300000, // 5 minutes
    enabled: false, // Don't auto-fetch, trigger manually
  })
}

/**
 * Hook to connect Google Calendar
 * Handles the OAuth callback and stores the integration
 */
export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GoogleCalendarCallbackRequest) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        integration: CalendarIntegration
      }>('/api/scheduling/calendar/google/callback', data)
      return response.integration
    },
    onSuccess: (newIntegration) => {
      // Update the integrations list optimistically
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return [newIntegration]
          return [...old, newIntegration]
        }
      )

      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: calendarKeys.integrations() })
    },
  })
}

/**
 * Hook to disconnect/revoke a calendar integration
 */
export function useDisconnectCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiClient.delete<{
        success: boolean
        message: string
      }>(`/api/scheduling/calendar/integrations/${integrationId}`)
      return response
    },
    onMutate: async (integrationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: calendarKeys.integrations() })

      // Snapshot previous value
      const previousIntegrations = queryClient.getQueryData(calendarKeys.integrations())

      // Optimistically remove from list
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return old
          return old.filter(integration => integration.id !== integrationId)
        }
      )

      return { previousIntegrations }
    },
    onError: (err, integrationId, context) => {
      // Rollback on error
      if (context?.previousIntegrations) {
        queryClient.setQueryData(
          calendarKeys.integrations(),
          context.previousIntegrations
        )
      }
    },
    onSuccess: () => {
      // Ensure fresh data
      queryClient.invalidateQueries({ queryKey: calendarKeys.integrations() })
    },
  })
}

/**
 * Hook to manually trigger calendar sync
 */
export function useSyncCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CalendarSyncRequest) => {
      const response = await apiClient.post<{
        success: boolean
        message: string
        eventsCreated?: number
        eventsUpdated?: number
        eventsDeleted?: number
      }>('/api/scheduling/calendar/sync', data)
      return response
    },
    onMutate: async ({ integrationId }) => {
      // Update sync status optimistically
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return old
          return old.map(integration =>
            integration.id === integrationId
              ? { ...integration, sync_status: 'syncing' as const }
              : integration
          )
        }
      )
    },
    onSuccess: (result, { integrationId }) => {
      // Update sync status and last sync time
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return old
          return old.map(integration =>
            integration.id === integrationId
              ? {
                  ...integration,
                  sync_status: 'success' as const,
                  last_sync_at: new Date().toISOString()
                }
              : integration
          )
        }
      )

      // Invalidate scheduling data as it may have changed
      queryClient.invalidateQueries({ queryKey: ['scheduling'] })
    },
    onError: (err, { integrationId }) => {
      // Update sync status to failed
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return old
          return old.map(integration =>
            integration.id === integrationId
              ? { ...integration, sync_status: 'failed' as const }
              : integration
          )
        }
      )
    },
  })
}

/**
 * Hook to update calendar integration settings
 */
export function useUpdateCalendarIntegration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      integrationId,
      settings
    }: {
      integrationId: string
      settings: Partial<CalendarIntegration>
    }) => {
      const response = await apiClient.patch<{
        success: boolean
        integration: CalendarIntegration
      }>(`/api/scheduling/calendar/integrations/${integrationId}`, settings)
      return response.integration
    },
    onMutate: async ({ integrationId, settings }) => {
      await queryClient.cancelQueries({ queryKey: calendarKeys.integrations() })

      const previousIntegrations = queryClient.getQueryData(calendarKeys.integrations())

      // Optimistically update
      queryClient.setQueryData(
        calendarKeys.integrations(),
        (old: CalendarIntegration[] | undefined) => {
          if (!old) return old
          return old.map(integration =>
            integration.id === integrationId
              ? { ...integration, ...settings }
              : integration
          )
        }
      )

      return { previousIntegrations }
    },
    onError: (err, { integrationId }, context) => {
      // Rollback on error
      if (context?.previousIntegrations) {
        queryClient.setQueryData(
          calendarKeys.integrations(),
          context.previousIntegrations
        )
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.integrations() })
    },
  })
}

// ============================================
// COMBINED HOOK FOR CALENDAR INTEGRATION
// ============================================

/**
 * Main hook that provides all calendar integration functionality
 */
export function useCalendarIntegration() {
  const integrations = useCalendarIntegrations()
  const getAuthUrl = useGoogleCalendarAuthUrl()
  const connectGoogle = useConnectGoogleCalendar()
  const disconnect = useDisconnectCalendar()
  const sync = useSyncCalendar()
  const updateSettings = useUpdateCalendarIntegration()

  return {
    // Data
    integrations: integrations.data || [],
    isLoading: integrations.isLoading,
    error: integrations.error,

    // Actions
    getGoogleAuthUrl: () => getAuthUrl.refetch(),
    authUrl: getAuthUrl.data,

    connectGoogleCalendar: connectGoogle.mutate,
    connectGoogleCalendarAsync: connectGoogle.mutateAsync,
    isConnecting: connectGoogle.isPending,
    connectError: connectGoogle.error,

    disconnectCalendar: disconnect.mutate,
    disconnectCalendarAsync: disconnect.mutateAsync,
    isDisconnecting: disconnect.isPending,

    syncCalendar: sync.mutate,
    syncCalendarAsync: sync.mutateAsync,
    isSyncing: sync.isPending,
    syncResult: sync.data,

    updateIntegrationSettings: updateSettings.mutate,
    updateIntegrationSettingsAsync: updateSettings.mutateAsync,
    isUpdatingSettings: updateSettings.isPending,

    // Utility methods
    refresh: () => integrations.refetch(),
  }
}

// Export individual hooks for flexibility
export {
  useCalendarIntegrations,
  useGoogleCalendarAuthUrl,
  useConnectGoogleCalendar,
  useDisconnectCalendar,
  useSyncCalendar,
  useUpdateCalendarIntegration,
}
