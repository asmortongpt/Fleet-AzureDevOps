/**
 * Sample Frontend Integration
 * Copy this code into your React app to display live vehicle data
 */

import { useEffect, useState } from 'react'

// Types
interface Vehicle {
  id: string
  name: string
  type: string
  status: 'idle' | 'active' | 'responding' | 'maintenance'
  location: {
    latitude: number
    longitude: number
    speed: number
    heading: number
  }
  telemetry: {
    rpm: number
    speed: number
    fuelLevel: number
    coolantTemp: number
    batteryVoltage: number
    engineLoad: number
    odometer: number
  }
  driver: {
    name: string
    badge: string
    shift: string
  } | null
}

// Hook for WebSocket connection
function useFleetEmulator() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3003')

    ws.onopen = () => {
      console.log('Connected to fleet emulator')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'init') {
        setVehicles(message.vehicles)
      }

      if (message.type === 'vehicle-update') {
        setVehicles(prev => {
          const existing = prev.find(v => v.id === message.data.vehicleId)

          if (existing) {
            return prev.map(v =>
              v.id === message.data.vehicleId
                ? {
                    ...v,
                    location: message.data.location,
                    telemetry: message.data.telemetry,
                    status: message.data.status,
                    driver: message.data.driver
                  }
                : v
            )
          }

          return prev
        })
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('Disconnected from fleet emulator')
      setIsConnected(false)
    }

    return () => ws.close()
  }, [])

  return { vehicles, isConnected }
}

// Component 1: Vehicle List
export function VehicleList() {
  const { vehicles, isConnected } = useFleetEmulator()

  if (!isConnected) {
    return <div>Connecting to fleet emulator...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Live Fleet ({vehicles.length} vehicles)</h2>

      {vehicles.map(vehicle => (
        <div key={vehicle.id} className="border rounded-lg p-4 shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{vehicle.name}</h3>
              <p className="text-gray-600">{vehicle.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
              vehicle.status === 'responding' ? 'bg-red-100 text-red-800' :
              vehicle.status === 'idle' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {vehicle.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Speed</p>
              <p className="text-xl font-semibold">{vehicle.location.speed.toFixed(1)} mph</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fuel</p>
              <p className="text-xl font-semibold">{vehicle.telemetry.fuelLevel.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RPM</p>
              <p className="text-xl font-semibold">{vehicle.telemetry.rpm.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Odometer</p>
              <p className="text-xl font-semibold">{vehicle.telemetry.odometer.toFixed(0)} mi</p>
            </div>
          </div>

          {vehicle.driver && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Driver</p>
              <p className="font-medium">{vehicle.driver.name}</p>
              <p className="text-sm text-gray-500">{vehicle.driver.shift}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Component 2: Vehicle Map Markers (for Google Maps / Leaflet)
export function VehicleMapMarkers() {
  const { vehicles, isConnected } = useFleetEmulator()

  useEffect(() => {
    // Update map markers when vehicle positions change
    vehicles.forEach(vehicle => {
      updateMapMarker(vehicle.id, {
        lat: vehicle.location.latitude,
        lng: vehicle.location.longitude,
        heading: vehicle.location.heading,
        status: vehicle.status
      })
    })
  }, [vehicles])

  return null // Map markers are rendered directly on the map
}

// Helper function to update map markers (implement based on your map library)
function updateMapMarker(
  vehicleId: string,
  position: { lat: number; lng: number; heading: number; status: string }
) {
  // Example for Google Maps:
  // const marker = markers[vehicleId]
  // marker.setPosition({ lat: position.lat, lng: position.lng })
  // marker.setIcon(getIconForStatus(position.status))

  // Example for Leaflet:
  // const marker = markers[vehicleId]
  // marker.setLatLng([position.lat, position.lng])
  // marker.setRotationAngle(position.heading)

  console.log(`Update marker ${vehicleId} to`, position)
}

// Component 3: Telemetry Dashboard
export function TelemetryDashboard() {
  const { vehicles, isConnected } = useFleetEmulator()

  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
    responding: vehicles.filter(v => v.status === 'responding').length,
    avgSpeed: vehicles.reduce((sum, v) => sum + v.location.speed, 0) / vehicles.length || 0,
    avgFuel: vehicles.reduce((sum, v) => sum + v.telemetry.fuelLevel, 0) / vehicles.length || 0,
    lowFuel: vehicles.filter(v => v.telemetry.fuelLevel < 20).length
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Total Vehicles</p>
        <p className="text-3xl font-bold">{stats.total}</p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Active</p>
        <p className="text-3xl font-bold text-green-700">{stats.active}</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Avg Speed</p>
        <p className="text-3xl font-bold text-blue-700">{stats.avgSpeed.toFixed(1)} mph</p>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Low Fuel</p>
        <p className="text-3xl font-bold text-yellow-700">{stats.lowFuel}</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Idle</p>
        <p className="text-3xl font-bold text-gray-700">{stats.idle}</p>
      </div>

      <div className="bg-red-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Responding</p>
        <p className="text-3xl font-bold text-red-700">{stats.responding}</p>
      </div>

      <div className="bg-purple-50 p-6 rounded-lg shadow">
        <p className="text-sm text-gray-600">Avg Fuel</p>
        <p className="text-3xl font-bold text-purple-700">{stats.avgFuel.toFixed(1)}%</p>
      </div>

      <div className={`p-6 rounded-lg shadow ${isConnected ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className="text-sm text-gray-600">Connection</p>
        <p className={`text-xl font-bold ${isConnected ? 'text-green-700' : 'text-red-700'}`}>
          {isConnected ? 'Live' : 'Offline'}
        </p>
      </div>
    </div>
  )
}

// Component 4: Vehicle Detail Panel
export function VehicleDetail({ vehicleId }: { vehicleId: string }) {
  const { vehicles } = useFleetEmulator()
  const vehicle = vehicles.find(v => v.id === vehicleId)

  if (!vehicle) {
    return <div>Vehicle not found</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{vehicle.name}</h2>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono">{vehicle.location.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono">{vehicle.location.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Speed:</span>
              <span className="ml-2">{vehicle.location.speed.toFixed(1)} mph</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Heading:</span>
              <span className="ml-2">{vehicle.location.heading.toFixed(0)}°</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Telemetry</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm text-gray-600">RPM:</span>
              <span className="ml-2">{vehicle.telemetry.rpm.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Fuel:</span>
              <span className="ml-2">{vehicle.telemetry.fuelLevel.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Coolant:</span>
              <span className="ml-2">{vehicle.telemetry.coolantTemp.toFixed(0)}°F</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Battery:</span>
              <span className="ml-2">{vehicle.telemetry.batteryVoltage.toFixed(1)}V</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Load:</span>
              <span className="ml-2">{vehicle.telemetry.engineLoad.toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Odometer:</span>
              <span className="ml-2">{vehicle.telemetry.odometer.toFixed(0)} mi</span>
            </div>
          </div>
        </div>

        {vehicle.driver && (
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Driver</h3>
            <p>{vehicle.driver.name}</p>
            <p className="text-sm text-gray-600">{vehicle.driver.badge}</p>
            <p className="text-sm text-gray-600">{vehicle.driver.shift}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Full App Example
export default function FleetDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">Fleet Management Dashboard</h1>

      <div className="mb-8">
        <TelemetryDashboard />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <VehicleList />
        <div>
          {/* Add your map component here */}
          <div className="bg-white rounded-lg shadow p-4 h-96">
            <p className="text-gray-500">Map view goes here</p>
            <VehicleMapMarkers />
          </div>
        </div>
      </div>
    </div>
  )
}
