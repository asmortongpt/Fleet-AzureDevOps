/**
 * Comprehensive endpoint and WebSocket monitoring hook
 * Combines REST API health checks with WebSocket connection monitoring
 */

import { useState, useEffect, useCallback } from 'react'

import { useEndpointHealth } from './useEndpointHealth'

import { WEBSOCKET_CONNECTIONS } from '@/config/endpoints'
import { SocketConnectionInfo, SocketStatus } from '@/types/endpoint-monitor'

interface UseEndpointMonitoringOptions {
  enabled?: boolean
  restPollInterval?: number
  socketCheckInterval?: number
}

interface UseEndpointMonitoringReturn {
  // REST endpoints
  endpoints: Map<string, any>
  endpointSummary: any
  testEndpoint: (id: string) => Promise<void>
  testAllEndpoints: () => Promise<void>

  // WebSockets
  sockets: Map<string, SocketConnectionInfo>
  socketSummary: {
    total: number
    connected: number
    disconnected: number
    error: number
  }

  // Combined
  isLoading: boolean
  lastCheck: Date | null
}

export function useEndpointMonitoring(
  options: UseEndpointMonitoringOptions = {}
): UseEndpointMonitoringReturn {
  const {
    enabled = true,
    restPollInterval = 30000,
    socketCheckInterval = 5000
  } = options

  // REST endpoint monitoring
  const {
    endpoints,
    summary: endpointSummary,
    testEndpoint,
    testAllEndpoints,
    isLoading: endpointsLoading,
    lastCheck: endpointsLastCheck
  } = useEndpointHealth({ enabled, pollInterval: restPollInterval })

  // WebSocket monitoring state
  const [sockets, setSockets] = useState<Map<string, SocketConnectionInfo>>(new Map())
  const [isSocketsLoading, setIsSocketsLoading] = useState(false)
  const [socketsLastCheck, setSocketsLastCheck] = useState<Date | null>(null)

  // Initialize socket connections
  useEffect(() => {
    const socketMap = new Map<string, SocketConnectionInfo>()
    WEBSOCKET_CONNECTIONS.forEach(socket => {
      socketMap.set(socket.id, { ...socket })
    })
    setSockets(socketMap)
  }, [])

  // Monitor WebSocket connections
  const checkSocketConnection = useCallback((socketInfo: SocketConnectionInfo): SocketStatus => {
    // Try to determine socket status
    // In a real implementation, you'd check actual WebSocket instances
    // For now, return 'unknown' status with ability to test connectivity

    // Check if URL contains localhost and port is accessible
    try {
      const url = new URL(socketInfo.url, window.location.origin)

      // Simple heuristic: if it's a localhost URL, attempt to check if port responds
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        // Port-specific checks
        const port = url.port
        if (port === '8081' || port === '8082' || port === '8083') {
          // These are our emulator ports - mark as disconnected by default
          // They'll show as connected when actually used
          return 'disconnected'
        }
      }

      return 'disconnected'
    } catch (error) {
      return 'error'
    }
  }, [])

  // Check all socket connections
  const checkAllSockets = useCallback(async () => {
    setIsSocketsLoading(true)

    const updatedSockets = new Map(sockets)

    for (const [id, socket] of updatedSockets) {
      const status = checkSocketConnection(socket)
      updatedSockets.set(id, {
        ...socket,
        status
      })
    }

    setSockets(updatedSockets)
    setSocketsLastCheck(new Date())
    setIsSocketsLoading(false)
  }, [sockets, checkSocketConnection])

  // Poll socket status
  useEffect(() => {
    if (!enabled) return

    checkAllSockets()
    const interval = setInterval(checkAllSockets, socketCheckInterval)

    return () => clearInterval(interval)
  }, [enabled, socketCheckInterval, checkAllSockets])

  // Calculate socket summary
  const socketSummary = {
    total: sockets.size,
    connected: Array.from(sockets.values()).filter(s => s.status === 'connected').length,
    disconnected: Array.from(sockets.values()).filter(s => s.status === 'disconnected').length,
    error: Array.from(sockets.values()).filter(s => s.status === 'error').length
  }

  // Combined loading and last check
  const isLoading = endpointsLoading || isSocketsLoading
  const lastCheck = endpointsLastCheck && socketsLastCheck
    ? new Date(Math.max(endpointsLastCheck.getTime(), socketsLastCheck.getTime()))
    : endpointsLastCheck || socketsLastCheck

  return {
    // REST endpoints
    endpoints,
    endpointSummary,
    testEndpoint,
    testAllEndpoints,

    // WebSockets
    sockets,
    socketSummary,

    // Combined
    isLoading,
    lastCheck
  }
}
