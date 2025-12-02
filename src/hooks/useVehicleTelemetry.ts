/**
 * Real-time Vehicle Telemetry Hook
 * Connects to the emulator WebSocket for live vehicle data updates
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useWebSocket, WebSocketMessage } from './useWebSocket'
import { Vehicle } from '@/lib/types'
import logger from '@/utils/logger'

// CRITICAL: Preserve native Map before Leaflet pollutes global namespace
const NativeMap = globalThis.Map;

export interface TelemetryUpdate {
  vehicleId: string
  timestamp: Date
  gps?: {
    latitude: number
    longitude: number
    speed: number
    heading: number
    accuracy: number
  }
  obd?: {
    rpm: number
    speed: number
    fuelLevel: number
    engineTemp: number
    batteryVoltage: number
    dtcCodes: string[]
  }
  driver?: {
    harshBraking: boolean
    harshAcceleration: boolean
    speeding: boolean
    idling: boolean
  }
  fuel?: {
    level: number
    consumption: number
    efficiency: number
  }
}

export interface EmulatorStats {
  totalVehicles: number
  activeVehicles: number
  totalEvents: number
  eventsPerSecond: number
  uptime: number
}

interface UseVehicleTelemetryOptions {
  /** Enable/disable real-time updates */
  enabled?: boolean
  /** Initial vehicles to populate before real-time data arrives */
  initialVehicles?: Vehicle[]
  /** Callback when vehicle data is updated */
  onVehicleUpdate?: (vehicleId: string, update: TelemetryUpdate) => void
  /** Callback for emulator events */
  onEmulatorEvent?: (event: WebSocketMessage) => void
}

export function useVehicleTelemetry(options: UseVehicleTelemetryOptions = {}) {
  const {
    enabled = true,
    initialVehicles = [],
    onVehicleUpdate,
    onEmulatorEvent
  } = options

  // Vehicle state with real-time updates
  const [vehicles, setVehicles] = useState<NativeMap<string, Vehicle>>(
    new NativeMap(initialVehicles.map(v => [v.id, v]))
  )
  const [telemetryHistory, setTelemetryHistory] = useState<NativeMap<string, TelemetryUpdate[]>>(new NativeMap())
  const [emulatorStats, setEmulatorStats] = useState<EmulatorStats | null>(null)
  const [isEmulatorRunning, setIsEmulatorRunning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [recentEvents, setRecentEvents] = useState<WebSocketMessage[]>([])

  const vehiclesRef = useRef(vehicles)
  vehiclesRef.current = vehicles

  // WebSocket URL for emulator
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/emulator/ws`

  const handleMessage = useCallback((message: WebSocketMessage) => {
    setLastUpdate(new Date())
    onEmulatorEvent?.(message)

    // Keep track of recent events (last 50)
    setRecentEvents(prev => [message, ...prev.slice(0, 49)])

    switch (message.type) {
      case 'vehicle:telemetry':
      case 'telemetry:update': {
        const { vehicleId, data } = message
        if (!vehicleId) return

        const update: TelemetryUpdate = {
          vehicleId,
          timestamp: new Date(message.timestamp || Date.now()),
          gps: data?.gps,
          obd: data?.obd,
          driver: data?.driver,
          fuel: data?.fuel
        }

        // Update vehicle in state
        setVehicles(prev => {
          const current = prev.get(vehicleId)
          if (current) {
            const updated = new Map(prev)
            updated.set(vehicleId, {
              ...current,
              location: data?.gps ? {
                lat: data.gps.latitude,
                lng: data.gps.longitude
              } : current.location,
              speed: data?.gps?.speed ?? data?.obd?.speed ?? current.speed,
              lastUpdated: new Date().toISOString(),
              status: determineVehicleStatus(current, data)
            })
            return updated
          }
          return prev
        })

        // Store telemetry history
        setTelemetryHistory(prev => {
          const history = prev.get(vehicleId) || []
          const updated = new Map(prev)
          updated.set(vehicleId, [...history.slice(-99), update]) // Keep last 100 updates
          return updated
        })

        onVehicleUpdate?.(vehicleId, update)
        break
      }

      case 'vehicle:position':
      case 'gps:update': {
        const { vehicleId, latitude, longitude, speed, heading } = message
        if (!vehicleId) return

        setVehicles(prev => {
          const current = prev.get(vehicleId)
          if (current) {
            const updated = new Map(prev)
            updated.set(vehicleId, {
              ...current,
              location: { lat: latitude, lng: longitude },
              speed: speed ?? current.speed,
              heading: heading ?? current.heading,
              lastUpdated: new Date().toISOString(),
              status: speed > 0 ? 'active' : (current.status === 'active' ? 'idle' : current.status)
            })
            return updated
          }
          return prev
        })
        break
      }

      case 'vehicle:alert':
      case 'alert': {
        const { vehicleId, alertType, severity } = message
        logger.warn(`Vehicle alert: ${vehicleId} - ${alertType} (${severity})`)

        if (vehicleId) {
          setVehicles(prev => {
            const current = prev.get(vehicleId)
            if (current && severity === 'critical') {
              const updated = new Map(prev)
              updated.set(vehicleId, {
                ...current,
                status: 'emergency'
              })
              return updated
            }
            return prev
          })
        }
        break
      }

      case 'emulator:stats': {
        setEmulatorStats(message.stats)
        break
      }

      case 'emulator:started': {
        setIsEmulatorRunning(true)
        logger.info('Emulator started')
        break
      }

      case 'emulator:stopped': {
        setIsEmulatorRunning(false)
        logger.info('Emulator stopped')
        break
      }

      case 'vehicle:registered': {
        const { vehicle } = message
        if (vehicle) {
          setVehicles(prev => {
            const updated = new Map(prev)
            updated.set(vehicle.id, vehicle)
            return updated
          })
        }
        break
      }

      case 'fuel:update': {
        const { vehicleId, fuelLevel, consumption } = message
        if (vehicleId) {
          setVehicles(prev => {
            const current = prev.get(vehicleId)
            if (current) {
              const updated = new Map(prev)
              updated.set(vehicleId, {
                ...current,
                fuelLevel: fuelLevel ?? current.fuelLevel
              })
              return updated
            }
            return prev
          })
        }
        break
      }

      case 'maintenance:alert': {
        const { vehicleId, maintenanceType, urgency } = message
        if (vehicleId && urgency === 'immediate') {
          setVehicles(prev => {
            const current = prev.get(vehicleId)
            if (current) {
              const updated = new Map(prev)
              updated.set(vehicleId, {
                ...current,
                status: 'service'
              })
              return updated
            }
            return prev
          })
        }
        break
      }

      case 'ev:charging':
      case 'charging:status': {
        const { vehicleId, isCharging, chargeLevel } = message
        if (vehicleId) {
          setVehicles(prev => {
            const current = prev.get(vehicleId)
            if (current) {
              const updated = new Map(prev)
              updated.set(vehicleId, {
                ...current,
                status: isCharging ? 'charging' : current.status,
                batteryLevel: chargeLevel ?? current.batteryLevel
              })
              return updated
            }
            return prev
          })
        }
        break
      }

      default:
        logger.debug(`Unhandled telemetry message type: ${message.type}`)
    }
  }, [onVehicleUpdate, onEmulatorEvent])

  const { isConnected, send, subscribe } = useWebSocket({
    url: enabled ? wsUrl : undefined,
    onMessage: handleMessage
  })

  // Subscribe to all vehicle events
  useEffect(() => {
    if (!enabled) return

    const unsubscribers = [
      subscribe('vehicle:telemetry', handleMessage),
      subscribe('telemetry:update', handleMessage),
      subscribe('vehicle:position', handleMessage),
      subscribe('gps:update', handleMessage),
      subscribe('vehicle:alert', handleMessage),
      subscribe('alert', handleMessage),
      subscribe('emulator:stats', handleMessage),
      subscribe('emulator:started', handleMessage),
      subscribe('emulator:stopped', handleMessage),
      subscribe('vehicle:registered', handleMessage),
      subscribe('fuel:update', handleMessage),
      subscribe('maintenance:alert', handleMessage),
      subscribe('ev:charging', handleMessage),
      subscribe('charging:status', handleMessage),
      subscribe('*', (msg) => logger.debug('WebSocket event:', msg.type))
    ]

    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [enabled, subscribe, handleMessage])

  // Sync initial vehicles
  useEffect(() => {
    if (initialVehicles.length > 0) {
      setVehicles(new Map(initialVehicles.map(v => [v.id, v])))
    }
  }, [initialVehicles])

  // Helper to get array of vehicles
  const vehicleArray = useCallback((): Vehicle[] => {
    return Array.from(vehicles.values())
  }, [vehicles])

  // Get telemetry for a specific vehicle
  const getVehicleTelemetry = useCallback((vehicleId: string) => {
    return telemetryHistory.get(vehicleId) || []
  }, [telemetryHistory])

  // Request emulator stats
  const requestStats = useCallback(() => {
    send({ type: 'emulator:getStats' })
  }, [send])

  // Start emulator
  const startEmulator = useCallback(() => {
    send({ type: 'emulator:start' })
  }, [send])

  // Stop emulator
  const stopEmulator = useCallback(() => {
    send({ type: 'emulator:stop' })
  }, [send])

  return {
    // Connection status
    isConnected,
    isEmulatorRunning,
    lastUpdate,

    // Vehicle data
    vehicles: vehicleArray(),
    vehicleMap: vehicles,
    getVehicle: (id: string) => vehicles.get(id),

    // Telemetry
    getVehicleTelemetry,
    recentEvents,

    // Stats
    emulatorStats,
    requestStats,

    // Controls
    startEmulator,
    stopEmulator,
    send
  }
}

/**
 * Determine vehicle status based on telemetry data
 */
function determineVehicleStatus(
  current: Vehicle,
  data: any
): Vehicle['status'] {
  // Check for emergency conditions
  if (data?.driver?.harshBraking && data?.driver?.harshAcceleration) {
    return 'emergency'
  }

  // Check for charging
  if (data?.ev?.isCharging) {
    return 'charging'
  }

  // Check for service needs
  if (data?.obd?.dtcCodes?.length > 0) {
    return 'service'
  }

  // Check for movement
  const speed = data?.gps?.speed ?? data?.obd?.speed ?? 0
  if (speed > 2) {
    return 'active'
  }

  // If was active but now stopped
  if (current.status === 'active' && speed < 2) {
    return 'idle'
  }

  // Keep current status
  return current.status
}

export default useVehicleTelemetry
