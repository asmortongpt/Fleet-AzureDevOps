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
  const probeWebSocket = useCallback(async (socketInfo: SocketConnectionInfo): Promise<SocketStatus> => {
    try {
      const base = window.location.origin
      const resolved = new URL(socketInfo.url, base)
      const wsUrl = new URL(resolved.toString())
      wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'

      // Probe with a short-lived connection.
      // If the server accepts WS upgrade, we consider it "connected".
      await new Promise<void>((resolve, reject) => {
        let done = false
        const timeout = window.setTimeout(() => {
          if (done) return
          done = true
          reject(new Error('timeout'))
        }, 2000)

        const ws = new WebSocket(wsUrl.toString())
        ws.onopen = () => {
          if (done) return
          done = true
          window.clearTimeout(timeout)
          try { ws.close() } catch { /* ignore */ }
          resolve()
        }
        ws.onerror = () => {
          if (done) return
          done = true
          window.clearTimeout(timeout)
          try { ws.close() } catch { /* ignore */ }
          reject(new Error('error'))
        }
      })

      return 'connected'
    } catch {
      return 'disconnected'
    }
  }, [])

  // Check all socket connections
  const checkAllSockets = useCallback(async () => {
    setIsSocketsLoading(true)

    const updatedSockets = new Map(sockets)

    const entries = Array.from(updatedSockets.entries())
    const results = await Promise.all(entries.map(async ([id, socket]) => {
      const status = await probeWebSocket(socket)
      return [id, { ...socket, status }] as const
    }))
    for (const [id, socket] of results) updatedSockets.set(id, socket)

    setSockets(updatedSockets)
    setSocketsLastCheck(new Date())
    setIsSocketsLoading(false)
  }, [sockets, probeWebSocket])

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
