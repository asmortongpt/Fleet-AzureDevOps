/**
 * React hooks for API data fetching using SWR
 * Provides caching, revalidation, and real-time updates
 */

import useSWR, { mutate } from 'swr'
import { apiClient, APIError } from '@/lib/api-client'
import { transformVehicles, transformDrivers, transformFacilities } from '@/lib/data-transformers'
import logger from '@/utils/logger'

interface UseAPIOptions {
  refreshInterval?: number
  revalidateOnFocus?: boolean
  dedupingInterval?: number
}

// Generic hook for GET requests with SWR
export function useAPI<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseAPIOptions = {}
) {
  const { data, error, isLoading, isValidating, mutate: revalidate } = useSWR<T, APIError>(
    key,
    fetcher,
    {
      refreshInterval: options.refreshInterval || 0,
      revalidateOnFocus: options.revalidateOnFocus !== false,
      dedupingInterval: options.dedupingInterval || 2000,
      onError: (error) => {
        logger.error('API Error:', { error })
      }
    }
  )

  return {
    data,
    isLoading,
    isValidating,
    error,
    refresh: revalidate
  }
}

// Vehicles hooks
export function useVehicles(params?: any) {
  return useAPI(
    '/api/vehicles',
    async () => {
      const data = await apiClient.vehicles.list(params)
      return transformVehicles(data)
    }
  )
}

export function useVehicle(id: string | null) {
  return useAPI(
    id ? `/api/vehicles/${id}` : null,
    () => apiClient.vehicles.get(id!)
  )
}

export function useVehicleMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.vehicles.create(data)
      mutate('/api/vehicles')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.vehicles.update(id, data)
      mutate('/api/vehicles')
      mutate(`/api/vehicles/${id}`)
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.vehicles.delete(id)
      mutate('/api/vehicles')
      return result
    }
  }
}

// Drivers hooks
export function useDrivers(params?: any) {
  return useAPI(
    '/api/drivers',
    async () => {
      const data = await apiClient.drivers.list(params)
      return transformDrivers(data)
    }
  )
}

export function useDriver(id: string | null) {
  return useAPI(
    id ? `/api/drivers/${id}` : null,
    () => apiClient.drivers.get(id!)
  )
}

export function useDriverMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.drivers.create(data)
      mutate('/api/drivers')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.drivers.update(id, data)
      mutate('/api/drivers')
      mutate(`/api/drivers/${id}`)
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.drivers.delete(id)
      mutate('/api/drivers')
      return result
    }
  }
}

// Work Orders hooks
export function useWorkOrders(params?: any) {
  return useAPI(
    '/api/work-orders',
    () => apiClient.workOrders.list(params),
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )
}

export function useWorkOrder(id: string | null) {
  return useAPI(
    id ? `/api/work-orders/${id}` : null,
    () => apiClient.workOrders.get(id!)
  )
}

export function useWorkOrderMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.workOrders.create(data)
      mutate('/api/work-orders')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.workOrders.update(id, data)
      mutate('/api/work-orders')
      mutate(`/api/work-orders/${id}`)
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.workOrders.delete(id)
      mutate('/api/work-orders')
      return result
    }
  }
}

// Fuel Transactions hooks
export function useFuelTransactions(params?: any) {
  return useAPI(
    '/api/fuel-transactions',
    () => apiClient.fuelTransactions.list(params)
  )
}

export function useFuelTransactionMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.fuelTransactions.create(data)
      mutate('/api/fuel-transactions')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.fuelTransactions.update(id, data)
      mutate('/api/fuel-transactions')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.fuelTransactions.delete(id)
      mutate('/api/fuel-transactions')
      return result
    }
  }
}

// Routes hooks
export function useRoutes(params?: any) {
  return useAPI(
    '/api/routes',
    () => apiClient.routes.list(params),
    { refreshInterval: 30000 } // Refresh every 30 seconds for live tracking
  )
}

export function useRoute(id: string | null) {
  return useAPI(
    id ? `/api/routes/${id}` : null,
    () => apiClient.routes.get(id!)
  )
}

export function useRouteMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.routes.create(data)
      mutate('/api/routes')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.routes.update(id, data)
      mutate('/api/routes')
      mutate(`/api/routes/${id}`)
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.routes.delete(id)
      mutate('/api/routes')
      return result
    }
  }
}

// Maintenance Schedules hooks
export function useMaintenanceSchedules(params?: any) {
  return useAPI(
    '/api/maintenance-schedules',
    () => apiClient.maintenanceSchedules.list(params),
    { refreshInterval: 60000 } // Refresh every minute
  )
}

export function useMaintenanceScheduleMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.maintenanceSchedules.create(data)
      mutate('/api/maintenance-schedules')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.maintenanceSchedules.update(id, data)
      mutate('/api/maintenance-schedules')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.maintenanceSchedules.delete(id)
      mutate('/api/maintenance-schedules')
      return result
    }
  }
}

// Facilities hooks
export function useFacilities(params?: any) {
  return useAPI(
    '/api/facilities',
    async () => {
      const data = await apiClient.facilities.list(params)
      return transformFacilities(data)
    }
  )
}

export function useFacilityMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.facilities.create(data)
      mutate('/api/facilities')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.facilities.update(id, data)
      mutate('/api/facilities')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.facilities.delete(id)
      mutate('/api/facilities')
      return result
    }
  }
}

// Inspections hooks
export function useInspections(params?: any) {
  return useAPI(
    '/api/inspections',
    () => apiClient.inspections.list(params)
  )
}

export function useInspectionMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.inspections.create(data)
      mutate('/api/inspections')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.inspections.update(id, data)
      mutate('/api/inspections')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.inspections.delete(id)
      mutate('/api/inspections')
      return result
    }
  }
}

// Safety Incidents hooks
export function useSafetyIncidents(params?: any) {
  return useAPI(
    '/api/safety-incidents',
    () => apiClient.safetyIncidents.list(params)
  )
}

export function useSafetyIncidentMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.safetyIncidents.create(data)
      mutate('/api/safety-incidents')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.safetyIncidents.update(id, data)
      mutate('/api/safety-incidents')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.safetyIncidents.delete(id)
      mutate('/api/safety-incidents')
      return result
    }
  }
}

// Charging Stations hooks
export function useChargingStations(params?: any) {
  return useAPI(
    '/api/charging-stations',
    () => apiClient.chargingStations.list(params)
  )
}

export function useChargingStationMutations() {
  return {
    create: async (data: any) => {
      const result = await apiClient.chargingStations.create(data)
      mutate('/api/charging-stations')
      return result
    },
    update: async (id: string, data: any) => {
      const result = await apiClient.chargingStations.update(id, data)
      mutate('/api/charging-stations')
      return result
    },
    delete: async (id: string) => {
      const result = await apiClient.chargingStations.delete(id)
      mutate('/api/charging-stations')
      return result
    }
  }
}

// Telemetry hook (for real-time GPS tracking)
export function useTelemetry(params?: any) {
  return useAPI(
    '/api/telemetry',
    () => apiClient.telemetry.list(params),
    { refreshInterval: 5000 } // Refresh every 5 seconds for real-time tracking
  )
}

// AI hooks
export function useAIQuery() {
  return {
    query: async (query: string) => {
      return await apiClient.ai.query(query)
    }
  }
}

export function useAIAssistant() {
  return {
    chat: async (messages: any[]) => {
      return await apiClient.ai.assistant(messages)
    }
  }
}

// Authentication hooks
export function useAuth() {
  return {
    login: async (email: string, password: string) => {
      return await apiClient.login(email, password)
    },
    register: async (data: any) => {
      return await apiClient.register(data)
    },
    logout: async () => {
      await apiClient.logout()
      // Clear all SWR cache
      mutate(() => true, undefined, { revalidate: false })
    }
  }
}
