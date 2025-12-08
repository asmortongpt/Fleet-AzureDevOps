/**
 * Hook for monitoring endpoint health
 * Periodically pings endpoints and tracks their status
 */

import { useState, useEffect, useCallback, useRef } from 'react'

import { getAllEndpoints } from '@/config/endpoints'
import { EndpointHealth, EndpointStatus, HealthSummary, SocketConnectionInfo } from '@/types/endpoint-monitor'

interface UseEndpointHealthOptions {
  enabled?: boolean
  pollInterval?: number // milliseconds
  timeout?: number // milliseconds
}

interface UseEndpointHealthReturn {
  endpoints: Map<string, EndpointHealth>
  sockets: Map<string, SocketConnectionInfo>
  summary: HealthSummary
  testEndpoint: (endpointId: string) => Promise<void>
  testAllEndpoints: () => Promise<void>
  isLoading: boolean
  lastCheck: Date | null
}

const RESPONSE_TIME_WARNING_THRESHOLD = 1000 // ms
const RESPONSE_TIME_ERROR_THRESHOLD = 5000 // ms

export function useEndpointHealth(
  options: UseEndpointHealthOptions = {}
): UseEndpointHealthReturn {
  const {
    enabled = true,
    pollInterval = 30000, // 30 seconds
    timeout = 10000 // 10 seconds
  } = options

  const [endpoints, setEndpoints] = useState<Map<string, EndpointHealth>>(new Map())
  const [sockets, setSockets] = useState<Map<string, SocketConnectionInfo>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map())

  // Initialize endpoints
  useEffect(() => {
    const allEndpoints = getAllEndpoints()
    const endpointMap = new Map<string, EndpointHealth>()

    allEndpoints.forEach(endpoint => {
      endpointMap.set(endpoint.id, {
        ...endpoint,
        status: 'unknown',
        responseTime: null,
        lastChecked: null,
        requestCount: 0,
        successCount: 0,
        errorCount: 0
      })
    })

    setEndpoints(endpointMap)
  }, [])

  // Determine endpoint status based on response time and HTTP status
  const determineStatus = (
    httpStatus: number | null,
    responseTime: number | null,
    error?: string
  ): EndpointStatus => {
    if (error || httpStatus === null) return 'error'
    if (httpStatus >= 400) return 'error'
    if (responseTime && responseTime > RESPONSE_TIME_ERROR_THRESHOLD) return 'error'
    if (httpStatus >= 300 || (responseTime && responseTime > RESPONSE_TIME_WARNING_THRESHOLD)) return 'warning'
    if (httpStatus >= 200 && httpStatus < 300) return 'healthy'
    return 'unknown'
  }

  // Test a single endpoint
  const testEndpoint = useCallback(async (endpointId: string) => {
    const endpoint = endpoints.get(endpointId)
    if (!endpoint) return

    // Skip endpoints that require parameters (contain :id, etc.)
    if (endpoint.path.includes(':')) {
      setEndpoints(prev => {
        const updated = new Map(prev)
        const current = updated.get(endpointId)
        if (current) {
          updated.set(endpointId, {
            ...current,
            status: 'unknown',
            lastChecked: new Date(),
            errorMessage: 'Requires parameters'
          })
        }
        return updated
      })
      return
    }

    // Create abort controller for timeout
    const abortController = new AbortController()
    abortControllersRef.current.set(endpointId, abortController)

    const timeoutId = setTimeout(() => abortController.abort(), timeout)

    const startTime = performance.now()
    let httpStatus: number | null = null
    let errorMessage: string | undefined

    try {
      // Use HEAD for GET endpoints to minimize bandwidth, GET for others to check full path
      const method = endpoint.method === 'GET' ? 'HEAD' : endpoint.method

      // For non-GET endpoints, skip testing to avoid side effects
      if (endpoint.method !== 'GET' && endpoint.method !== 'HEAD') {
        setEndpoints(prev => {
          const updated = new Map(prev)
          const current = updated.get(endpointId)
          if (current) {
            updated.set(endpointId, {
              ...current,
              status: 'unknown',
              lastChecked: new Date(),
              errorMessage: 'Not tested (writes/deletes)'
            })
          }
          return updated
        })
        return
      }

      const response = await fetch(`${window.location.origin}${endpoint.path}`, {
        method,
        credentials: 'include',
        signal: abortController.signal
      })

      httpStatus = response.status
    } catch (error: any) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout'
      } else {
        errorMessage = error.message || 'Network error'
      }
    } finally {
      clearTimeout(timeoutId)
      abortControllersRef.current.delete(endpointId)
    }

    const responseTime = performance.now() - startTime
    const status = determineStatus(httpStatus, responseTime, errorMessage)

    setEndpoints(prev => {
      const updated = new Map(prev)
      const current = updated.get(endpointId)
      if (current) {
        updated.set(endpointId, {
          ...current,
          status,
          responseTime,
          lastChecked: new Date(),
          errorMessage,
          requestCount: current.requestCount + 1,
          successCount: current.successCount + (status === 'healthy' ? 1 : 0),
          errorCount: current.errorCount + (status === 'error' ? 1 : 0)
        })
      }
      return updated
    })
  }, [endpoints, timeout])

  // Test all endpoints
  const testAllEndpoints = useCallback(async () => {
    setIsLoading(true)
    const allEndpoints = Array.from(endpoints.keys())

    // Test in batches to avoid overwhelming the server
    const batchSize = 5
    for (let i = 0; i < allEndpoints.length; i += batchSize) {
      const batch = allEndpoints.slice(i, i + batchSize)
      await Promise.all(batch.map(id => testEndpoint(id)))
      // Small delay between batches
      if (i + batchSize < allEndpoints.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    setLastCheck(new Date())
    setIsLoading(false)
  }, [endpoints, testEndpoint])

  // Calculate summary statistics
  const summary: HealthSummary = (() => {
    const endpointArray = Array.from(endpoints.values())
    const total = endpointArray.length
    const healthyCount = endpointArray.filter(e => e.status === 'healthy').length
    const warningCount = endpointArray.filter(e => e.status === 'warning').length
    const errorCount = endpointArray.filter(e => e.status === 'error').length
    const unknownCount = endpointArray.filter(e => e.status === 'unknown').length

    // Health score: weighted average (healthy = 100, warning = 50, error/unknown = 0)
    const healthScore = total > 0
      ? Math.round(((healthyCount * 100 + warningCount * 50) / total))
      : 0

    return {
      totalEndpoints: total,
      healthyCount,
      warningCount,
      errorCount,
      unknownCount,
      healthScore
    }
  })()

  // Set up polling
  useEffect(() => {
    if (!enabled) return

    // Initial test
    testAllEndpoints()

    // Set up interval
    pollTimerRef.current = setInterval(() => {
      testAllEndpoints()
    }, pollInterval)

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
      }
      // Abort any pending requests
      abortControllersRef.current.forEach(controller => controller.abort())
      abortControllersRef.current.clear()
    }
  }, [enabled, pollInterval, testAllEndpoints])

  return {
    endpoints,
    sockets,
    summary,
    testEndpoint,
    testAllEndpoints,
    isLoading,
    lastCheck
  }
}
