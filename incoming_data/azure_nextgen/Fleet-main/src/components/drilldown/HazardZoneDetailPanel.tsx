/**
 * HazardZoneDetailPanel - Detail view for hazard zones
 * Shows comprehensive hazard zone information with affected vehicles, restrictions, and timeline
 */

import {
  AlertTriangle,
  Calendar,
  MapPin,
  Car,
  Shield,
  Clock,
  ExternalLink,
  Navigation,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface HazardZoneDetailPanelProps {
  hazardZoneId: string
}

interface HazardZoneData {
  id: string
  name: string
  type: 'chemical' | 'physical' | 'biological' | 'ergonomic' | 'environmental'
  severity: 'high' | 'medium' | 'low'
  location: {
    lat: number
    lng: number
    address?: string
  }
  radius: number // meters
  restrictions: string[]
  activeFrom: string
  activeTo?: string
  description?: string
  createdBy?: string
  createdDate?: string
  lastUpdated?: string
}

interface AffectedVehicle {
  id: string
  vehicle_id: string
  vehicle_name: string
  driver_id?: string
  driver_name?: string
  last_entry: string
  entry_count: number
  total_time_in_zone: number // minutes
}

interface ZoneEvent {
  id: string
  event_type: 'entry' | 'exit' | 'violation' | 'update'
  description: string
  timestamp: string
  vehicle_id?: string
  vehicle_name?: string
  metadata?: Record<string, any>
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Demo data fallback
const getDemoHazardZone = (id: string): HazardZoneData => ({
  id,
  name: "Construction Zone - I-10 East",
  type: "physical",
  severity: "high",
  location: {
    lat: 30.4500,
    lng: -84.2700,
    address: "I-10 East at Exit 192, Tallahassee, FL"
  },
  radius: 500,
  restrictions: [
    "Speed limit 35 mph",
    "No lane changes within zone",
    "Increased following distance required",
    "Watch for construction equipment"
  ],
  activeFrom: "2025-12-01",
  activeTo: "2026-03-31",
  description: "Highway construction project with lane restrictions. Active Mon-Fri 7AM-6PM. Expect delays.",
  createdBy: "Safety Manager",
  createdDate: "2025-11-28",
  lastUpdated: "2025-12-15"
})

const getDemoAffectedVehicles = (): AffectedVehicle[] => [
  {
    id: "1",
    vehicle_id: "veh-demo-1001",
    vehicle_name: "Ford F-150 #1001",
    driver_id: "drv-001",
    driver_name: "John Smith",
    last_entry: "2025-12-15T14:30:00Z",
    entry_count: 12,
    total_time_in_zone: 45
  },
  {
    id: "2",
    vehicle_id: "veh-demo-1005",
    vehicle_name: "Chevrolet Silverado #1005",
    driver_id: "drv-005",
    driver_name: "Sarah Johnson",
    last_entry: "2025-12-15T09:15:00Z",
    entry_count: 8,
    total_time_in_zone: 32
  },
  {
    id: "3",
    vehicle_id: "veh-demo-1015",
    vehicle_name: "Mercedes Sprinter #1015",
    driver_id: "drv-010",
    driver_name: "Mike Davis",
    last_entry: "2025-12-14T16:45:00Z",
    entry_count: 5,
    total_time_in_zone: 20
  }
]

const getDemoZoneEvents = (): ZoneEvent[] => [
  {
    id: "1",
    event_type: "entry",
    description: "Vehicle entered hazard zone",
    timestamp: "2025-12-15T14:30:00Z",
    vehicle_id: "veh-demo-1001",
    vehicle_name: "Ford F-150 #1001"
  },
  {
    id: "2",
    event_type: "violation",
    description: "Speed limit exceeded in zone (42 mph in 35 mph zone)",
    timestamp: "2025-12-15T14:32:00Z",
    vehicle_id: "veh-demo-1001",
    vehicle_name: "Ford F-150 #1001",
    metadata: { speed: 42, limit: 35 }
  },
  {
    id: "3",
    event_type: "exit",
    description: "Vehicle exited hazard zone",
    timestamp: "2025-12-15T14:35:00Z",
    vehicle_id: "veh-demo-1001",
    vehicle_name: "Ford F-150 #1001"
  },
  {
    id: "4",
    event_type: "update",
    description: "Zone restrictions updated",
    timestamp: "2025-12-15T08:00:00Z",
    metadata: { updatedBy: "Safety Manager" }
  }
]

export function HazardZoneDetailPanel({ hazardZoneId }: HazardZoneDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Main hazard zone data
  const { data: zone, error, isLoading, mutate } = useSWR<HazardZoneData>(
    `/api/hazard-zones/${hazardZoneId}`,
    fetcher,
    {
      fallbackData: getDemoHazardZone(hazardZoneId),
      shouldRetryOnError: false
    }
  )

  // Affected vehicles
  const { data: affectedVehicles } = useSWR<AffectedVehicle[]>(
    hazardZoneId ? `/api/hazard-zones/${hazardZoneId}/affected-vehicles` : null,
    fetcher,
    {
      fallbackData: getDemoAffectedVehicles(),
      shouldRetryOnError: false
    }
  )

  // Zone events/timeline
  const { data: zoneEvents } = useSWR<ZoneEvent[]>(
    hazardZoneId ? `/api/hazard-zones/${hazardZoneId}/events` : null,
    fetcher,
    {
      fallbackData: getDemoZoneEvents(),
      shouldRetryOnError: false
    }
  )

  const handleViewVehicle = (vehicleId: string, vehicleName: string) => {
    push({
      id: `vehicle-${vehicleId}`,
      type: 'vehicle',
      label: vehicleName || 'Vehicle Details',
      data: { vehicleId },
    })
  }

  const handleViewLocation = () => {
    if (zone?.location.lat && zone?.location.lng) {
      window.open(
        `https://www.google.com/maps?q=${zone.location.lat},${zone.location.lng}`,
        '_blank'
      )
    }
  }

  const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chemical':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'physical':
        return <Shield className="h-5 w-5 text-blue-500" />
      case 'environmental':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'entry':
        return <Navigation className="h-4 w-4 text-blue-500" />
      case 'exit':
        return <Navigation className="h-4 w-4 text-green-500 rotate-180" />
      case 'violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'update':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {zone && (
        <div className="space-y-6">
          {/* Hazard Zone Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{zone.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {zone.type} Hazard Zone
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getSeverityColor(zone.severity)}>
                  {zone.severity} Severity
                </Badge>
                {zone.activeTo ? (
                  <Badge variant="outline">
                    Active until {new Date(zone.activeTo).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Badge variant="outline">Permanent</Badge>
                )}
              </div>
            </div>
            {getTypeIcon(zone.type)}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Radius
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{zone.radius}m</div>
                <p className="text-xs text-muted-foreground mt-1">coverage area</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{affectedVehicles?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">affected</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Active From
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {new Date(zone.activeFrom).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{zoneEvents?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">total events</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles ({affectedVehicles?.length || 0})</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    {zone.location.address && (
                      <p className="font-medium">{zone.location.address}</p>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      Coordinates: {zone.location.lat.toFixed(4)}, {zone.location.lng.toFixed(4)}
                    </div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm mt-2"
                      onClick={handleViewLocation}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on Map
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {zone.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{zone.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Zone Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Zone Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{zone.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                      <Badge variant={getSeverityColor(zone.severity)}>
                        {zone.severity}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{zone.createdBy || 'N/A'}</p>
                      {zone.createdDate && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(zone.createdDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {zone.lastUpdated ? new Date(zone.lastUpdated).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Restrictions Tab */}
            <TabsContent value="restrictions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Active Restrictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {zone.restrictions.map((restriction, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium text-sm mt-0.5">
                          {index + 1}
                        </div>
                        <span className="flex-1">{restriction}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="space-y-4">
              {affectedVehicles && affectedVehicles.length > 0 ? (
                <div className="space-y-3">
                  {affectedVehicles.map((vehicle) => (
                    <Card
                      key={vehicle.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewVehicle(vehicle.vehicle_id, vehicle.vehicle_name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div>
                              <p className="font-medium">{vehicle.vehicle_name}</p>
                              {vehicle.driver_name && (
                                <p className="text-sm text-muted-foreground">
                                  Driver: {vehicle.driver_name}
                                </p>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Last Entry</p>
                                <p className="font-medium">
                                  {new Date(vehicle.last_entry).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Entries</p>
                                <p className="font-medium">{vehicle.entry_count}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Time</p>
                                <p className="font-medium">{vehicle.total_time_in_zone} min</p>
                              </div>
                            </div>
                          </div>
                          <Car className="h-5 w-5 text-muted-foreground ml-4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No vehicles affected</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4">
              {zoneEvents && zoneEvents.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Event Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {zoneEvents.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 p-2">
                              {getEventIcon(event.event_type)}
                            </div>
                            {index < zoneEvents.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium capitalize">
                                  {event.event_type.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.description}
                                </p>
                                {event.vehicle_name && (
                                  <p className="text-sm text-muted-foreground">
                                    Vehicle: {event.vehicle_name}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No events recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewLocation} variant="outline" className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              View on Map
            </Button>
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Manage Restrictions
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
