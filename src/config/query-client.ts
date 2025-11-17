import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * Default options for TanStack Query
 * These settings optimize caching, error handling, and retry logic
 */
const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 5 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes

    // Cache data for 10 minutes after it becomes unused
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)

    // Retry failed requests up to 3 times with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          return false
        }
      }
      return failureCount < 3
    },

    // Exponential backoff delay
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus in production for data freshness
    refetchOnWindowFocus: import.meta.env.PROD,

    // Don't refetch on component mount if data is still fresh
    refetchOnMount: false,

    // Refetch on reconnect to get latest data
    refetchOnReconnect: true,

    // Network mode - fail queries when offline
    networkMode: 'online',
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,

    // Network mode for mutations
    networkMode: 'online',

    // Global error handler for mutations (can be overridden per mutation)
    onError: (error) => {
      console.error('Mutation error:', error)
      // You can add toast notifications here if desired
      // toast.error('An error occurred. Please try again.')
    },
  },
}

/**
 * Create and configure the QueryClient instance
 * This client is used throughout the application for data fetching and caching
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

/**
 * Query key factory for consistent key generation
 * This helps prevent key typos and makes refactoring easier
 */
export const queryKeys = {
  // Fleet data keys
  fleet: {
    all: ['fleet'] as const,
    lists: () => [...queryKeys.fleet.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.fleet.lists(), filters] as const,
    details: () => [...queryKeys.fleet.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.fleet.details(), id] as const,
  },

  // Vehicles keys
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.vehicles.lists(), filters] as const,
    details: () => [...queryKeys.vehicles.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.vehicles.details(), id] as const,
  },

  // Drivers keys
  drivers: {
    all: ['drivers'] as const,
    lists: () => [...queryKeys.drivers.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.drivers.lists(), filters] as const,
    details: () => [...queryKeys.drivers.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.drivers.details(), id] as const,
  },

  // Maintenance keys
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.maintenance.lists(), filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.maintenance.details(), id] as const,
    schedule: () => [...queryKeys.maintenance.all, 'schedule'] as const,
  },

  // Facilities keys
  facilities: {
    all: ['facilities'] as const,
    lists: () => [...queryKeys.facilities.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.facilities.lists(), filters] as const,
    details: () => [...queryKeys.facilities.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.facilities.details(), id] as const,
  },

  // Routes keys
  routes: {
    all: ['routes'] as const,
    lists: () => [...queryKeys.routes.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.routes.lists(), filters] as const,
    details: () => [...queryKeys.routes.all, 'detail'] as const,
    detail: (id: string | number) => [...queryKeys.routes.details(), id] as const,
  },

  // Add more query key factories as needed
} as const
