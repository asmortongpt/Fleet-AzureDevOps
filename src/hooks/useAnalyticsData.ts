/**
 * useAnalyticsData - Custom hook for analytics data with caching and real-time updates
 * Features: Redis caching, automatic refresh, data aggregation
 */

import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import type { CostDataPoint } from '@/components/analytics/CostAnalyticsChart'
import type { EfficiencyDataPoint } from '@/components/analytics/EfficiencyMetricsChart'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Cache configuration
const CACHE_TIME = 5 * 60 * 1000 // 5 minutes
const STALE_TIME = 2 * 60 * 1000 // 2 minutes
const REFETCH_INTERVAL = 30 * 1000 // 30 seconds

export interface AnalyticsFilters {
    startDate?: string
    endDate?: string
    vehicleIds?: string[]
    departmentIds?: string[]
    categoryIds?: string[]
}

export interface AnalyticsResponse<T> {
    data: T
    metadata: {
        total: number
        filtered: number
        cached: boolean
        cacheExpiry?: number
        generatedAt: string
    }
}

// Cost Analytics Hook
export function useCostAnalytics(filters?: AnalyticsFilters, options?: UseQueryOptions<AnalyticsResponse<CostDataPoint[]>>) {
    const queryClient = useQueryClient()

    const queryKey = ['analytics', 'cost', filters]

    const query = useQuery<AnalyticsResponse<CostDataPoint[]>>({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.startDate) params.append('startDate', filters.startDate)
            if (filters?.endDate) params.append('endDate', filters.endDate)
            if (filters?.vehicleIds) params.append('vehicleIds', filters.vehicleIds.join(','))

            const response = await fetch(`${API_BASE_URL}/analytics/cost?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch cost analytics')
            }
            return response.json()
        },
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchIntervalInBackground: false,
        ...options,
    })

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey })
    }, [queryClient, queryKey])

    const refetch = useCallback(() => {
        return query.refetch()
    }, [query])

    return {
        ...query,
        invalidate,
        refetch,
    }
}

// Efficiency Analytics Hook
export function useEfficiencyAnalytics(filters?: AnalyticsFilters, options?: UseQueryOptions<AnalyticsResponse<EfficiencyDataPoint[]>>) {
    const queryClient = useQueryClient()

    const queryKey = ['analytics', 'efficiency', filters]

    const query = useQuery<AnalyticsResponse<EfficiencyDataPoint[]>>({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.startDate) params.append('startDate', filters.startDate)
            if (filters?.endDate) params.append('endDate', filters.endDate)
            if (filters?.vehicleIds) params.append('vehicleIds', filters.vehicleIds.join(','))

            const response = await fetch(`${API_BASE_URL}/analytics/efficiency?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch efficiency analytics')
            }
            return response.json()
        },
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchIntervalInBackground: false,
        ...options,
    })

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey })
    }, [queryClient, queryKey])

    const refetch = useCallback(() => {
        return query.refetch()
    }, [query])

    return {
        ...query,
        invalidate,
        refetch,
    }
}

// Fleet KPIs Hook
export interface FleetKPIs {
    totalVehicles: number
    activeVehicles: number
    utilization: number
    avgMPG: number
    totalCost: number
    costPerMile: number
    safetyScore: number
    onTimeRate: number
}

export function useFleetKPIs(filters?: AnalyticsFilters, options?: UseQueryOptions<AnalyticsResponse<FleetKPIs>>) {
    const queryClient = useQueryClient()

    const queryKey = ['analytics', 'kpis', filters]

    const query = useQuery<AnalyticsResponse<FleetKPIs>>({
        queryKey,
        queryFn: async () => {
            const params = new URLSearchParams()
            if (filters?.startDate) params.append('startDate', filters.startDate)
            if (filters?.endDate) params.append('endDate', filters.endDate)

            const response = await fetch(`${API_BASE_URL}/analytics/kpis?${params}`)
            if (!response.ok) {
                throw new Error('Failed to fetch fleet KPIs')
            }
            return response.json()
        },
        staleTime: STALE_TIME,
        gcTime: CACHE_TIME,
        refetchInterval: REFETCH_INTERVAL,
        refetchIntervalInBackground: false,
        ...options,
    })

    const invalidate = useCallback(() => {
        queryClient.invalidateQueries({ queryKey })
    }, [queryClient, queryKey])

    return {
        ...query,
        invalidate,
    }
}

// Aggregated Analytics Hook (combines multiple data sources)
export function useAggregatedAnalytics(filters?: AnalyticsFilters) {
    const costAnalytics = useCostAnalytics(filters)
    const efficiencyAnalytics = useEfficiencyAnalytics(filters)
    const kpis = useFleetKPIs(filters)

    const isLoading = costAnalytics.isLoading || efficiencyAnalytics.isLoading || kpis.isLoading
    const isError = costAnalytics.isError || efficiencyAnalytics.isError || kpis.isError
    const error = costAnalytics.error || efficiencyAnalytics.error || kpis.error

    const data = useMemo(() => {
        if (!costAnalytics.data || !efficiencyAnalytics.data || !kpis.data) {
            return null
        }

        return {
            cost: costAnalytics.data.data,
            efficiency: efficiencyAnalytics.data.data,
            kpis: kpis.data.data,
            metadata: {
                costMetadata: costAnalytics.data.metadata,
                efficiencyMetadata: efficiencyAnalytics.data.metadata,
                kpisMetadata: kpis.data.metadata,
            },
        }
    }, [costAnalytics.data, efficiencyAnalytics.data, kpis.data])

    const refetchAll = useCallback(() => {
        return Promise.all([
            costAnalytics.refetch(),
            efficiencyAnalytics.refetch(),
            kpis.refetch(),
        ])
    }, [costAnalytics, efficiencyAnalytics, kpis])

    return {
        data,
        isLoading,
        isError,
        error,
        refetchAll,
        cost: costAnalytics,
        efficiency: efficiencyAnalytics,
        kpis,
    }
}

// Real-time Analytics Hook (WebSocket-based)
export function useRealtimeAnalytics(enabled = true) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!enabled) return

        // Create WebSocket connection
        const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/analytics/realtime`)

        ws.onmessage = (event) => {
            try {
                const update = JSON.parse(event.data)

                // Update relevant queries based on update type
                switch (update.type) {
                    case 'cost':
                        queryClient.setQueryData(
                            ['analytics', 'cost'],
                            (old: AnalyticsResponse<CostDataPoint[]> | undefined) => {
                                if (!old) return old
                                return {
                                    ...old,
                                    data: [...old.data, update.data],
                                }
                            }
                        )
                        break
                    case 'efficiency':
                        queryClient.setQueryData(
                            ['analytics', 'efficiency'],
                            (old: AnalyticsResponse<EfficiencyDataPoint[]> | undefined) => {
                                if (!old) return old
                                return {
                                    ...old,
                                    data: [...old.data, update.data],
                                }
                            }
                        )
                        break
                    case 'kpis':
                        queryClient.setQueryData(['analytics', 'kpis'], (old: any) => {
                            if (!old) return old
                            return {
                                ...old,
                                data: { ...old.data, ...update.data },
                            }
                        })
                        break
                }
            } catch (error) {
                console.error('Error processing realtime analytics update:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
            console.log('WebSocket connection closed')
        }

        return () => {
            ws.close()
        }
    }, [enabled, queryClient])
}

// Export hook for prefetching analytics data
export function usePrefetchAnalytics() {
    const queryClient = useQueryClient()

    return useCallback(
        (filters?: AnalyticsFilters) => {
            queryClient.prefetchQuery({
                queryKey: ['analytics', 'cost', filters],
                queryFn: async () => {
                    const params = new URLSearchParams()
                    if (filters?.startDate) params.append('startDate', filters.startDate)
                    if (filters?.endDate) params.append('endDate', filters.endDate)

                    const response = await fetch(`${API_BASE_URL}/analytics/cost?${params}`)
                    return response.json()
                },
                staleTime: STALE_TIME,
            })

            queryClient.prefetchQuery({
                queryKey: ['analytics', 'efficiency', filters],
                queryFn: async () => {
                    const params = new URLSearchParams()
                    if (filters?.startDate) params.append('startDate', filters.startDate)
                    if (filters?.endDate) params.append('endDate', filters.endDate)

                    const response = await fetch(`${API_BASE_URL}/analytics/efficiency?${params}`)
                    return response.json()
                },
                staleTime: STALE_TIME,
            })
        },
        [queryClient]
    )
}
