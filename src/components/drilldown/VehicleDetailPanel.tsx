/**
 * VehicleDetailPanel - Level 2 drilldown for vehicle details
 * Shows comprehensive vehicle information with action buttons
 */

import React from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import {
  Car,
  Calendar,
  Gauge,
  Fuel,
  MapPin,
  Activity,
  Clock,
  Route,
  AlertTriangle,
} from 'lucide-react'

interface VehicleDetailPanelProps {
  vehicleId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function VehicleDetailPanel({ vehicleId }: VehicleDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: vehicle, error, isLoading, mutate } = useSWR(
    `/api/vehicles/${vehicleId}`,
    fetcher
  )

  const handleViewTrips = () => {
    push({
      id: `vehicle-trips-${vehicleId}`,
      type: 'vehicle-trips',
      label: 'Trip History',
      data: { vehicleId, vehicleName: vehicle?.name },
    })
  }

  const handleViewMaintenance = () => {
    push({
      id: `vehicle-maintenance-${vehicleId}`,
      type: 'vehicle-maintenance',
      label: 'Maintenance History',
      data: { vehicleId, vehicleName: vehicle?.name },
    })
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {vehicle && (
        <div className="space-y-6">
          {/* Vehicle Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={vehicle.status === 'active' ? 'success' : 'secondary'}>
                  {vehicle.status}
                </Badge>
                {vehicle.assigned_to && (
                  <Badge variant="outline">
                    Assigned to {vehicle.assigned_to}
                  </Badge>
                )}
              </div>
            </div>
            <Car className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Mileage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {vehicle.mileage?.toLocaleString() || '0'} mi
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-4 w-4" />
                  Fuel Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vehicle.fuel_level || 0}%</div>
                <Progress value={vehicle.fuel_level || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vehicle.health_score || 0}%</div>
                <Progress value={vehicle.health_score || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vehicle.uptime || 0}%</div>
                <Progress value={vehicle.uptime || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium">{vehicle.vin || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License Plate</p>
                  <p className="font-medium">{vehicle.license_plate || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{vehicle.type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{vehicle.department || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Location */}
          {vehicle.location && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Lat: {vehicle.location.lat?.toFixed(6)}, Lng:{' '}
                  {vehicle.location.lng?.toFixed(6)}
                </p>
                {vehicle.location.address && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {vehicle.location.address}
                  </p>
                )}
                {vehicle.location.last_update && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last updated: {new Date(vehicle.location.last_update).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {vehicle.alerts && vehicle.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Active Alerts ({vehicle.alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vehicle.alerts.map((alert: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded bg-destructive/10"
                    >
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.type}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewTrips} className="w-full">
              <Route className="h-4 w-4 mr-2" />
              View Trips
            </Button>
            <Button onClick={handleViewMaintenance} variant="outline" className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Maintenance
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
