/**
 * useOBD2Emulator Hook
 *
 * Custom React hook for managing OBD2 emulator connections and data streaming.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface OBD2Data {
  timestamp: string
  sessionId: string
  vehicleId: number
  adapterId: number
  engineRpm: number
  vehicleSpeed: number
  throttlePosition: number
  engineLoad: number
  engineCoolantTemp: number
  intakeAirTemp: number
  fuelLevel: number
  batteryVoltage: number
  estimatedMpg: number
  distanceTraveled: number
  tripTime: number
  location?: {
    latitude: number
    longitude: number
    speed: number
    heading: number
  }
}

interface EmulatorConfig {
  vehicleId?: number
  profile?: 'sedan' | 'truck' | 'electric' | 'diesel' | 'sports'
  scenario?: 'idle' | 'city' | 'highway' | 'aggressive'
  updateIntervalMs?: number
}

interface UseOBD2EmulatorReturn {
  // State
  isConnected: boolean
  isLoading: boolean
  error: string | null
  sessionId: string | null
  data: OBD2Data | null

  // Actions
  startEmulator: (config?: EmulatorConfig) => Promise<void>
  stopEmulator: () => Promise<void>
  disconnect: () => void

  // Data history
  dataHistory: OBD2Data[]
}

export function useOBD2Emulator(autoConnect: boolean = false): UseOBD2EmulatorReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [data, setData] = useState<OBD2Data | null>(null)
  const [dataHistory, setDataHistory] = useState<OBD2Data[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to WebSocket
  const connectWebSocket = useCallback((sid: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = API_BASE.replace(/^https?:\/\//, '')
    const wsUrl = `${wsProtocol}//${wsHost}/ws/obd2/${sid}`

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === 'obd2_data' && message.data) {
          setData(message.data)
          setDataHistory(prev => [...prev.slice(-99), message.data])
        } else if (message.type === 'error') {
          setError(message.message)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (sessionId) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(sid)
        }, 3000)
      }
    }

    ws.onerror = () => {
      setError('WebSocket connection error')
    }

    wsRef.current = ws
  }, [sessionId])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Start emulator
  const startEmulator = useCallback(async (config: EmulatorConfig = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/obd2-emulator/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: config.vehicleId || 1,
          profile: config.profile || 'sedan',
          scenario: config.scenario || 'city',
          updateIntervalMs: config.updateIntervalMs || 1000
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start emulator')
      }

      const result = await response.json()
      setSessionId(result.sessionId)
      setDataHistory([])
      connectWebSocket(result.sessionId)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [connectWebSocket])

  // Stop emulator
  const stopEmulator = useCallback(async () => {
    if (!sessionId) return

    try {
      await fetch(`${API_BASE}/api/obd2-emulator/stop/${sessionId}`, {
        method: 'POST'
      })
      disconnect()
      setSessionId(null)
      setData(null)
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }, [sessionId, disconnect])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      startEmulator()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect])

  return {
    isConnected,
    isLoading,
    error,
    sessionId,
    data,
    startEmulator,
    stopEmulator,
    disconnect,
    dataHistory
  }
}

export default useOBD2Emulator
