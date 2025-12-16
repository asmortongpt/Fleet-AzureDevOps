/**
 * Emulator Enhancement Hook
 * Optionally enhances demo data with live emulator telemetry when available
 * Site works perfectly without emulator - enhancement is graceful
 */

import { useEffect, useState, useCallback } from 'react'
import type { Vehicle } from '@/lib/types'

interface EmulatorStatus {
  connected: boolean
  vehicleCount: number
  lastUpdate: Date | null
}

interface EmulatorTelemetry {
  vehicleId: string
  speed: number
  fuel: number
  battery?: number
  location: {
    lat: number
    lng: number
  }
  status: Vehicle['status']
  timestamp: string
}

const EMULATOR_API_BASE = 'http://localhost:3002/api/emulator'
const EMULATOR_WS = 'ws://localhost:3003'

export function useEmulatorEnhancement() {
  const [status, setStatus] = useState<EmulatorStatus>({
    connected: false,
    vehicleCount: 0,
    lastUpdate: null
  })
  const [liveData, setLiveData] = useState<Map<string, EmulatorTelemetry>>(new Map())
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Try to connect to emulator - silently fail if not available
  const checkEmulatorAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${EMULATOR_API_BASE}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000) // 2 second timeout
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.running) {
          if (typeof window !== 'undefined' && localStorage.getItem('debug_fleet_data') === 'true') {
            console.log('✅ Emulator detected - enhancing with live data')
          }
          return true
        }
      }
    } catch (error) {
      // Silently fail - emulator not available, site works fine without it
    }
    return false
  }, [])

  // Connect to WebSocket for live telemetry updates
  const connectWebSocket = useCallback(() => {
    try {
      const websocket = new WebSocket(EMULATOR_WS)

      websocket.onopen = () => {
        if (typeof window !== 'undefined' && localStorage.getItem('debug_fleet_data') === 'true') {
          console.log('🔗 Connected to emulator WebSocket')
        }
        setStatus(prev => ({ ...prev, connected: true }))
      }

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'telemetry') {
            const telemetry = message.data as EmulatorTelemetry
            setLiveData(prev => {
              const next = new Map(prev)
              next.set(telemetry.vehicleId, telemetry)
              return next
            })
            setStatus(prev => ({
              ...prev,
              vehicleCount: prev.vehicleCount + 1,
              lastUpdate: new Date()
            }))
          }
        } catch (error) {
          // Ignore malformed WebSocket messages
        }
      }

      websocket.onerror = () => {
        // WebSocket connection failed - silently fall back to demo data
        setStatus(prev => ({ ...prev, connected: false }))
      }

      websocket.onclose = () => {
        if (typeof window !== 'undefined' && localStorage.getItem('debug_fleet_data') === 'true') {
          console.log('🔌 WebSocket disconnected')
        }
        setStatus(prev => ({ ...prev, connected: false }))
        setWs(null)
      }

      setWs(websocket)
    } catch (error) {
      // Could not connect to emulator WebSocket - silent fallback
    }
  }, [])

  // Initialize emulator connection if available
  useEffect(() => {
    const initEmulator = async () => {
      const available = await checkEmulatorAvailability()
      if (available) {
        connectWebSocket()
      }
    }

    initEmulator()

    // Cleanup on unmount
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [checkEmulatorAvailability, connectWebSocket])

  /**
   * Enhances a vehicle with live emulator data if available
   * Returns original vehicle if emulator data not available
   */
  const enhanceVehicle = useCallback((vehicle: Vehicle): Vehicle => {
    const live = liveData.get(vehicle.id)
    if (!live) {
      return vehicle // Return unchanged if no live data
    }

    // Merge live telemetry with vehicle data
    return {
      ...vehicle,
      speed: live.speed,
      fuel: live.fuel,
      battery: live.battery ?? vehicle.battery,
      location: live.location,
      status: live.status,
      // Add visual indicator that this is live data
      _isLive: true as any,
      _lastUpdate: live.timestamp
    }
  }, [liveData])

  /**
   * Enhances an array of vehicles with live emulator data
   * Only enhances vehicles that have live data available
   */
  const enhanceVehicles = useCallback((vehicles: Vehicle[]): Vehicle[] => {
    if (liveData.size === 0) {
      return vehicles // No live data, return unchanged
    }

    return vehicles.map(enhanceVehicle)
  }, [enhanceVehicle, liveData.size])

  return {
    status,
    enhanceVehicle,
    enhanceVehicles,
    hasLiveData: liveData.size > 0
  }
}
