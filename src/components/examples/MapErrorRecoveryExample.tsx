/**
 * Map Error Recovery Example Component
 *
 * Demonstrates comprehensive usage of the error recovery system:
 * - EnhancedUniversalMap with all recovery features
 * - MapHealthDashboard for monitoring
 * - Error simulation for testing
 * - Recovery controls
 */

import { useState } from 'react'
import { EnhancedUniversalMap } from '../EnhancedUniversalMap'
import { MapHealthDashboard } from '../MapHealthDashboard'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '../ui/alert'
import type { Vehicle, GISFacility, TrafficCamera } from '@/lib/types'
import type { MapProvider } from '../UniversalMap'

// ============================================================================
// Demo Data
// ============================================================================

const demoVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Fleet-001',
    status: 'active',
    location: { lat: 30.4383, lng: -84.2807 },
    speed: 45,
    heading: 90,
  },
  {
    id: '2',
    name: 'Fleet-002',
    status: 'idle',
    location: { lat: 30.4483, lng: -84.2907 },
    speed: 0,
    heading: 0,
  },
]

const demoFacilities: GISFacility[] = [
  {
    id: 'f1',
    name: 'Main Depot',
    type: 'depot',
    location: { lat: 30.4283, lng: -84.2707 },
  },
]

const demoCameras: TrafficCamera[] = [
  {
    id: 'c1',
    name: 'Camera-001',
    location: { lat: 30.4383, lng: -84.2607 },
    status: 'online',
  },
]

// ============================================================================
// Main Component
// ============================================================================

export function MapErrorRecoveryExample() {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  const [selectedProvider, setSelectedProvider] = useState<MapProvider>('leaflet')
  const [showHealthDashboard, setShowHealthDashboard] = useState(false)
  const [errorSimulation, setErrorSimulation] = useState<string | null>(null)
  const [eventLog, setEventLog] = useState<Array<{ time: string; message: string; type: string }>>([])

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const time = new Date().toLocaleTimeString()
    setEventLog(prev => [{ time, message, type }, ...prev].slice(0, 20))
  }

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleMapReady = (provider: MapProvider) => {
    addLog(`Map ready: ${provider}`, 'success')
  }

  const handleMapError = (error: Error, provider: MapProvider) => {
    addLog(`Map error in ${provider}: ${error.message}`, 'error')
  }

  const handleRecoverySuccess = () => {
    addLog('Recovery successful', 'success')
  }

  const handleProviderSwitch = (from: MapProvider, to: MapProvider) => {
    addLog(`Switched provider: ${from} → ${to}`, 'info')
    setSelectedProvider(to)
  }

  const handleHealthProviderSelect = (provider: MapProvider) => {
    addLog(`Health check for ${provider}`, 'info')
  }

  const simulateError = (errorType: string) => {
    setErrorSimulation(errorType)
    addLog(`Simulating ${errorType} error...`, 'info')

    // Reset after a delay
    setTimeout(() => {
      setErrorSimulation(null)
      addLog('Error simulation ended', 'info')
    }, 5000)
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Map Error Recovery System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive demonstration of advanced error recovery, retry logic, and health monitoring
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info Alert */}
          <Alert>
            <AlertTitle>Interactive Demo</AlertTitle>
            <AlertDescription>
              Use the controls below to test error recovery, circuit breaker patterns, and automatic
              failover. All recovery actions are logged in real-time.
            </AlertDescription>
          </Alert>

          {/* Map Container */}
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <EnhancedUniversalMap
                vehicles={demoVehicles}
                facilities={demoFacilities}
                cameras={demoCameras}
                showVehicles={true}
                showFacilities={true}
                showCameras={true}
                center={[30.4383, -84.2807]}
                zoom={13}
                enableErrorRecovery={true}
                enableHealthMonitoring={true}
                enableOfflineDetection={true}
                showHealthStatus={true}
                showRecoveryControls={true}
                forceProvider={selectedProvider}
                onMapReady={handleMapReady}
                onMapError={handleMapError}
                onRecoverySuccess={handleRecoverySuccess}
                onProviderSwitch={handleProviderSwitch}
              />
            </CardContent>
          </Card>
        </div>

        {/* Control Panel (1/3 width) */}
        <div className="space-y-4">
          {/* Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={selectedProvider === 'leaflet' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedProvider('leaflet')}
              >
                OpenStreetMap (Free)
              </Button>
              <Button
                variant={selectedProvider === 'google' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => setSelectedProvider('google')}
              >
                Google Maps (API Key)
              </Button>
            </CardContent>
          </Card>

          {/* Error Simulation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => simulateError('network')}
                disabled={errorSimulation !== null}
              >
                Network Error
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => simulateError('timeout')}
                disabled={errorSimulation !== null}
              >
                Timeout Error
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => simulateError('rate-limit')}
                disabled={errorSimulation !== null}
              >
                Rate Limit
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => simulateError('api-error')}
                disabled={errorSimulation !== null}
              >
                API Error
              </Button>
              {errorSimulation && (
                <Badge variant="destructive" className="w-full justify-center">
                  Simulating: {errorSimulation}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Health Dashboard Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowHealthDashboard(!showHealthDashboard)}
              >
                {showHealthDashboard ? 'Hide' : 'Show'} Health Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card className="max-h-[300px] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Event Log</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEventLog([])}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-[200px] overflow-y-auto text-xs font-mono">
                {eventLog.length === 0 ? (
                  <div className="text-gray-500 italic">No events yet...</div>
                ) : (
                  eventLog.map((log, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${
                        log.type === 'error'
                          ? 'text-red-600'
                          : log.type === 'success'
                          ? 'text-green-600'
                          : 'text-gray-600'
                      }`}
                    >
                      <span className="text-gray-400">{log.time}</span>
                      <span>{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Health Dashboard */}
      {showHealthDashboard && (
        <MapHealthDashboard
          providers={['google', 'leaflet']}
          showDetails={true}
          enableManualCheck={true}
          onProviderSelect={handleHealthProviderSelect}
        />
      )}

      {/* Features Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Error Recovery Features</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="retry">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="retry">Retry Logic</TabsTrigger>
              <TabsTrigger value="circuit">Circuit Breaker</TabsTrigger>
              <TabsTrigger value="health">Health Checks</TabsTrigger>
              <TabsTrigger value="fallback">Fallbacks</TabsTrigger>
            </TabsList>

            <TabsContent value="retry" className="space-y-2">
              <h3 className="font-semibold">Exponential Backoff Retry</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Automatic retry with exponential backoff (1s, 2s, 4s, ...)</li>
                <li>Maximum 3 retry attempts by default</li>
                <li>Jitter to prevent thundering herd</li>
                <li>Request deduplication for in-flight requests</li>
                <li>Timeout handling with abort controller</li>
              </ul>
            </TabsContent>

            <TabsContent value="circuit" className="space-y-2">
              <h3 className="font-semibold">Circuit Breaker Pattern</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>CLOSED: Normal operation, requests allowed</li>
                <li>OPEN: Too many failures, requests rejected</li>
                <li>HALF_OPEN: Testing recovery, limited requests</li>
                <li>Automatic state transitions based on failure threshold</li>
                <li>Configurable recovery timeout (default: 60s)</li>
              </ul>
            </TabsContent>

            <TabsContent value="health" className="space-y-2">
              <h3 className="font-semibold">Health Monitoring</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Periodic health checks every 60 seconds</li>
                <li>Response time tracking and averaging</li>
                <li>Uptime percentage calculation</li>
                <li>Rate limit detection and handling</li>
                <li>Automatic provider recommendation</li>
              </ul>
            </TabsContent>

            <TabsContent value="fallback" className="space-y-2">
              <h3 className="font-semibold">Fallback Strategies</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Automatic fallback from Google Maps to OpenStreetMap</li>
                <li>Offline mode detection and handling</li>
                <li>Error categorization (network, API, timeout, etc.)</li>
                <li>User-friendly error messages with actionable steps</li>
                <li>Error reporting to monitoring services</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default MapErrorRecoveryExample
