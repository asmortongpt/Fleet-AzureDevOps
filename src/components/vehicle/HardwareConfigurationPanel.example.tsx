/**
 * HardwareConfigurationPanel Example Usage
 *
 * This file demonstrates various ways to use the HardwareConfigurationPanel component
 * in different scenarios within the Fleet Management System.
 */

import React, { useState } from 'react'
import { HardwareConfigurationPanel } from './HardwareConfigurationPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import logger from '@/utils/logger';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================

export function BasicExample() {
  return (
    <div className="p-3 space-y-2">
      <h2 className="text-sm font-bold">Basic Hardware Configuration</h2>
      <HardwareConfigurationPanel vehicleId={123} />
    </div>
  )
}

// ============================================================================
// Example 2: With Event Handlers
// ============================================================================

export function WithEventHandlersExample() {
  const [providerCount, setProviderCount] = useState(0)
  const [activityLog, setActivityLog] = useState<string[]>([])

  const handleProviderAdded = (provider: string) => {
    const message = `Added ${provider} provider at ${new Date().toLocaleTimeString()}`
    setProviderCount(prev => prev + 1)
    setActivityLog(prev => [message, ...prev].slice(0, 10))
    toast.success(`${provider} provider added successfully!`, {
      description: 'Vehicle is now collecting telemetry data'
    })
  }

  const handleProviderRemoved = (provider: string) => {
    const message = `Removed ${provider} provider at ${new Date().toLocaleTimeString()}`
    setProviderCount(prev => prev - 1)
    setActivityLog(prev => [message, ...prev].slice(0, 10))
    toast(`${provider} provider removed`, {
      description: 'Telemetry data collection has stopped'
    })
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Hardware Configuration with Events</h2>
        <Badge variant="secondary">
          {providerCount} {providerCount === 1 ? 'Provider' : 'Providers'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <HardwareConfigurationPanel
            vehicleId={456}
            onProviderAdded={handleProviderAdded}
            onProviderRemoved={handleProviderRemoved}
          />
        </div>

        {/* Activity Log Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Activity Log</CardTitle>
            <CardDescription>Recent provider changes</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <ul className="space-y-2">
                {activityLog.map((log, index) => (
                  <li key={index} className="text-sm border-l-2 border-primary pl-3 py-1">
                    {log}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Example 3: In Vehicle Details Page
// ============================================================================

export function VehicleDetailsPageExample() {
  const [vehicleId] = useState(789)

  return (
    <div className="p-3">
      <div className="mb-3">
        <h1 className="text-base font-bold">Vehicle #789</h1>
        <p className="text-muted-foreground">2024 Ford F-150 • VIN: 1FTFW1E84NFA12345</p>
      </div>

      <Tabs defaultValue="hardware">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-3">
              <p>Vehicle overview content...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hardware">
          <HardwareConfigurationPanel
            vehicleId={vehicleId}
            onProviderAdded={(provider) => {
              logger.info('Provider added:', provider)
              // Update analytics, refresh dashboard, etc.
            }}
            onProviderRemoved={(provider) => {
              logger.info('Provider removed:', provider)
              // Update analytics, refresh dashboard, etc.
            }}
          />
        </TabsContent>

        <TabsContent value="telemetry">
          <Card>
            <CardContent className="p-3">
              <p>Telemetry data content...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardContent className="p-3">
              <p>Maintenance records content...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================================
// Example 4: Multi-Vehicle Management
// ============================================================================

interface Vehicle {
  id: number
  name: string
  vin: string
}

export function MultiVehicleManagementExample() {
  const [vehicles] = useState<Vehicle[]>([
    { id: 101, name: 'Vehicle A', vin: '1HGBH41JXMN109186' },
    { id: 102, name: 'Vehicle B', vin: '2HGBH41JXMN109187' },
    { id: 103, name: 'Vehicle C', vin: '3HGBH41JXMN109188' }
  ])
  const [selectedVehicleId, setSelectedVehicleId] = useState<number>(vehicles[0].id)

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)

  return (
    <div className="p-3">
      <h2 className="text-sm font-bold mb-3">Multi-Vehicle Hardware Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        {/* Vehicle Selector Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Vehicles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => setSelectedVehicleId(vehicle.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedVehicleId === vehicle.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/70'
                }`}
              >
                <div className="font-medium">{vehicle.name}</div>
                <div className="text-xs opacity-70 truncate">{vehicle.vin}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Hardware Configuration Panel */}
        <div className="lg:col-span-3">
          {selectedVehicle && (
            <>
              <div className="mb-2">
                <h3 className="text-base font-semibold">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">VIN: {selectedVehicle.vin}</p>
              </div>
              <HardwareConfigurationPanel
                key={selectedVehicleId} // Force re-mount on vehicle change
                vehicleId={selectedVehicleId}
                onProviderAdded={(provider) => {
                  toast.success(`${provider} added to ${selectedVehicle.name}`)
                }}
                onProviderRemoved={(provider) => {
                  toast(`${provider} removed from ${selectedVehicle.name}`)
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Example 5: Read-Only View
// ============================================================================

export function ReadOnlyViewExample() {
  // In a real implementation, you might wrap the component with a read-only context
  // or pass a readOnly prop. For now, we'll demonstrate with a note.

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold">Hardware Configuration (View Only)</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to modify hardware configurations
          </p>
        </div>
        <Badge variant="outline">Read Only</Badge>
      </div>

      {/*
        Note: In a real implementation, you would:
        1. Add a readOnly prop to the component
        2. Disable all action buttons
        3. Hide the "Add Provider" button
        4. Show view-only indicators
      */}
      <HardwareConfigurationPanel vehicleId={999} />
    </div>
  )
}

// ============================================================================
// Example 6: Integration with Telemetry Dashboard
// ============================================================================

export function TelemetryIntegrationExample() {
  const [hasProviders, setHasProviders] = useState(false)
  const [providerTypes, setProviderTypes] = useState<string[]>([])

  const handleProviderAdded = (provider: string) => {
    setHasProviders(true)
    setProviderTypes(prev => [...new Set([...prev, provider])])
    toast.success('Provider added! Telemetry data will begin streaming shortly.')
  }

  const handleProviderRemoved = (provider: string) => {
    setProviderTypes(prev => prev.filter(p => p !== provider))
    if (providerTypes.length <= 1) {
      setHasProviders(false)
    }
  }

  return (
    <div className="p-3 space-y-2">
      <h2 className="text-sm font-bold">Telemetry Dashboard</h2>

      {/* Telemetry Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Telemetry Status</CardTitle>
          <CardDescription>
            {hasProviders
              ? `Collecting data from ${providerTypes.join(', ')}`
              : 'No hardware providers configured'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasProviders ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="text-center">
                <div className="text-sm font-bold">98%</div>
                <div className="text-xs text-muted-foreground">GPS Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">45 mph</div>
                <div className="text-xs text-muted-foreground">Current Speed</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">127 mi</div>
                <div className="text-xs text-muted-foreground">Today's Mileage</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">2.5 hrs</div>
                <div className="text-xs text-muted-foreground">Engine Hours</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-3">
              <p>Configure hardware providers to start collecting telemetry data</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hardware Configuration */}
      <HardwareConfigurationPanel
        vehicleId={1234}
        onProviderAdded={handleProviderAdded}
        onProviderRemoved={handleProviderRemoved}
      />
    </div>
  )
}

// ============================================================================
// Export All Examples
// ============================================================================

export default function HardwareConfigurationExamples() {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="events">With Events</TabsTrigger>
        <TabsTrigger value="details">Vehicle Details</TabsTrigger>
        <TabsTrigger value="multi">Multi-Vehicle</TabsTrigger>
        <TabsTrigger value="readonly">Read Only</TabsTrigger>
        <TabsTrigger value="telemetry">Telemetry Integration</TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <BasicExample />
      </TabsContent>
      <TabsContent value="events">
        <WithEventHandlersExample />
      </TabsContent>
      <TabsContent value="details">
        <VehicleDetailsPageExample />
      </TabsContent>
      <TabsContent value="multi">
        <MultiVehicleManagementExample />
      </TabsContent>
      <TabsContent value="readonly">
        <ReadOnlyViewExample />
      </TabsContent>
      <TabsContent value="telemetry">
        <TelemetryIntegrationExample />
      </TabsContent>
    </Tabs>
  )
}
