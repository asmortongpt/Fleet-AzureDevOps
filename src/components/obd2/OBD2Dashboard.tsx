/**
 * OBD2 Dashboard Component
 *
 * Real-time vehicle diagnostics dashboard with live data streaming
 * from OBD2 devices (physical or emulated).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'

// Types
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
  catalystTemperature: number
  engineOilTemp: number
  fuelLevel: number
  fuelPressure: number
  fuelConsumptionRate: number
  shortTermFuelTrim: number
  longTermFuelTrim: number
  mafAirFlowRate: number
  intakeManifoldPressure: number
  batteryVoltage: number
  controlModuleVoltage: number
  timingAdvance: number
  estimatedMpg: number
  distanceTraveled: number
  tripTime: number
  location?: {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    heading: number
  }
}

interface EmulatorSession {
  sessionId: string
  vehicleId: number
  adapterId: number
  profile: string
  currentData?: OBD2Data
}

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const OBD2Dashboard: React.FC = () => {
  // State
  const [sessions, setSessions] = useState<EmulatorSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [liveData, setLiveData] = useState<OBD2Data | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Emulator config
  const [selectedProfile, setSelectedProfile] = useState<string>('sedan')
  const [selectedScenario, setSelectedScenario] = useState<string>('city')
  const [vehicleId, setVehicleId] = useState<number>(1)

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch active sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/obd2-emulator/sessions`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    }
  }, [])

  // Start emulator session
  const startEmulator = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/api/obd2-emulator/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          profile: selectedProfile,
          scenario: selectedScenario,
          updateIntervalMs: 1000
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start emulator')
      }

      const data = await response.json()
      setActiveSession(data.sessionId)
      await fetchSessions()

      // Connect WebSocket
      connectWebSocket(data.sessionId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Stop emulator session
  const stopEmulator = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE}/api/obd2-emulator/stop/${sessionId}`, {
        method: 'POST'
      })

      if (sessionId === activeSession) {
        setActiveSession(null)
        setLiveData(null)
        disconnectWebSocket()
      }

      await fetchSessions()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Connect to WebSocket
  const connectWebSocket = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close()
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = API_BASE.replace(/^https?:\/\//, '')
    const wsUrl = `${wsProtocol}//${wsHost}/ws/obd2/${sessionId}`

    console.log('Connecting to WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setError(null)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'obd2_data') {
          setLiveData(message.data)
        } else if (message.type === 'error') {
          setError(message.message)
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err)
      }
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setIsConnected(false)

      // Attempt reconnection
      if (activeSession) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(sessionId)
        }, 3000)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      setError('WebSocket connection error')
    }

    wsRef.current = ws
  }, [activeSession])

  // Disconnect WebSocket
  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  // Initial load
  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [])

  // Format time
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          OBD2 Vehicle Diagnostics
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Real-time vehicle data streaming from OBD2 devices
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-6 flex items-center gap-4">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          isConnected
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-medium">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {activeSession && (
          <span className="text-sm text-gray-500">
            Session: {activeSession.slice(0, 8)}...
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Emulator Controls */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          OBD2 Emulator Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle Profile
            </label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={!!activeSession}
            >
              <option value="sedan">Standard Sedan</option>
              <option value="truck">Work Truck</option>
              <option value="electric">Electric Vehicle</option>
              <option value="diesel">Diesel Engine</option>
              <option value="sports">Sports Car</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Driving Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={!!activeSession}
            >
              <option value="idle">Idle</option>
              <option value="city">City Driving</option>
              <option value="highway">Highway Cruising</option>
              <option value="aggressive">Aggressive Driving</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vehicle ID
            </label>
            <input
              type="number"
              value={vehicleId}
              onChange={(e) => setVehicleId(parseInt(e.target.value) || 1)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              disabled={!!activeSession}
              min={1}
            />
          </div>

          <div className="flex items-end">
            {!activeSession ? (
              <button
                onClick={startEmulator}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Starting...' : 'Start Emulator'}
              </button>
            ) : (
              <button
                onClick={() => stopEmulator(activeSession)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Stop Emulator
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Data Display */}
      {liveData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Gauges */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Primary Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <GaugeCard
                label="Engine RPM"
                value={liveData.engineRpm}
                unit="RPM"
                max={8000}
                color="blue"
              />
              <GaugeCard
                label="Vehicle Speed"
                value={liveData.vehicleSpeed}
                unit="MPH"
                max={150}
                color="green"
              />
              <GaugeCard
                label="Throttle Position"
                value={liveData.throttlePosition}
                unit="%"
                max={100}
                color="orange"
              />
              <GaugeCard
                label="Engine Load"
                value={liveData.engineLoad}
                unit="%"
                max={100}
                color="purple"
              />
            </div>
          </div>

          {/* Temperature Readings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Temperature
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DataCard
                label="Coolant Temp"
                value={liveData.engineCoolantTemp}
                unit="°F"
                warning={liveData.engineCoolantTemp > 220}
              />
              <DataCard
                label="Oil Temp"
                value={liveData.engineOilTemp}
                unit="°F"
                warning={liveData.engineOilTemp > 250}
              />
              <DataCard
                label="Intake Air"
                value={liveData.intakeAirTemp}
                unit="°F"
              />
              <DataCard
                label="Catalyst"
                value={liveData.catalystTemperature}
                unit="°F"
              />
            </div>
          </div>

          {/* Fuel System */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Fuel System
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <GaugeCard
                label="Fuel Level"
                value={liveData.fuelLevel}
                unit="%"
                max={100}
                color="yellow"
              />
              <DataCard
                label="Fuel Pressure"
                value={liveData.fuelPressure}
                unit="PSI"
              />
              <DataCard
                label="Consumption"
                value={liveData.fuelConsumptionRate.toFixed(2)}
                unit="GPH"
              />
              <DataCard
                label="Est. MPG"
                value={liveData.estimatedMpg.toFixed(1)}
                unit="MPG"
              />
            </div>
          </div>

          {/* Electrical */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Electrical & Airflow
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <DataCard
                label="Battery"
                value={liveData.batteryVoltage.toFixed(1)}
                unit="V"
                warning={liveData.batteryVoltage < 12.0}
              />
              <DataCard
                label="Control Module"
                value={liveData.controlModuleVoltage.toFixed(1)}
                unit="V"
              />
              <DataCard
                label="MAF Rate"
                value={liveData.mafAirFlowRate.toFixed(2)}
                unit="g/s"
              />
              <DataCard
                label="MAP"
                value={liveData.intakeManifoldPressure}
                unit="kPa"
              />
            </div>
          </div>

          {/* Trip Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Trip Information
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <DataCard
                label="Distance"
                value={liveData.distanceTraveled.toFixed(2)}
                unit="miles"
              />
              <DataCard
                label="Trip Time"
                value={formatTime(liveData.tripTime)}
                unit=""
              />
              <DataCard
                label="Timing Advance"
                value={liveData.timingAdvance}
                unit="°"
              />
              {liveData.location && (
                <DataCard
                  label="Location"
                  value={`${liveData.location.latitude.toFixed(4)}, ${liveData.location.longitude.toFixed(4)}`}
                  unit=""
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions List */}
      {sessions.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Active Emulator Sessions
          </h3>
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  session.sessionId === activeSession
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div>
                  <span className="font-medium">
                    Vehicle {session.vehicleId} - {session.profile}
                  </span>
                  <span className="text-sm text-gray-500 ml-4">
                    {session.sessionId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex gap-2">
                  {session.sessionId !== activeSession && (
                    <button
                      onClick={() => {
                        setActiveSession(session.sessionId)
                        connectWebSocket(session.sessionId)
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Connect
                    </button>
                  )}
                  <button
                    onClick={() => stopEmulator(session.sessionId)}
                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Gauge Card Component
interface GaugeCardProps {
  label: string
  value: number
  unit: string
  max: number
  color: 'blue' | 'green' | 'orange' | 'purple' | 'yellow' | 'red'
}

const GaugeCard: React.FC<GaugeCardProps> = ({ label, value, unit, max, color }) => {
  const percentage = Math.min((value / max) * 100, 100)

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
        <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Data Card Component
interface DataCardProps {
  label: string
  value: number | string
  unit: string
  warning?: boolean
}

const DataCard: React.FC<DataCardProps> = ({ label, value, unit, warning }) => {
  return (
    <div className={`p-4 rounded-lg ${
      warning
        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        : 'bg-gray-50 dark:bg-gray-700'
    }`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold ${warning ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  )
}

export default OBD2Dashboard
