/**
 * VehicleTripsList - Level 3 drilldown for vehicle trip history
 * Shows list of trips with ability to drill into individual trip telemetry
 */

import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useSWR from 'swr'
import {
  MapPin,
  Clock,
  Route,
  User,
  Calendar,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface VehicleTripsListProps {
  vehicleId: string
  vehicleName?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function VehicleTripsList({ vehicleId, vehicleName }: VehicleTripsListProps) {
  const { push } = useDrilldown()
  const { data: trips, error, isLoading, mutate } = useSWR(
    `/api/vehicles/${vehicleId}/trips`,
    fetcher
  )

  const handleViewTelemetry = (trip: any) => {
    push({
      id: `trip-telemetry-${trip.id}`,
      type: 'trip-telemetry',
      label: `Trip ${trip.id.slice(0, 8)}`,
      data: { tripId: trip.id, trip },
    })
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {trips && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold">
              Trip History {vehicleName && `for ${vehicleName}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {trips.length} trip{trips.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Trip List */}
          {trips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No trips recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trips.map((trip: any) => (
                <Card
                  key={trip.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleViewTelemetry(trip)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Trip Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={trip.status === 'completed' ? 'success' : 'default'}>
                              {trip.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Trip #{trip.id.slice(0, 8)}
                            </span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>

                        {/* Driver */}
                        {trip.driver_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{trip.driver_name}</span>
                          </div>
                        )}

                        {/* Time */}
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {trip.start_time
                              ? new Date(trip.start_time).toLocaleDateString()
                              : 'N/A'}
                          </span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                          <span>{trip.duration || 'N/A'}</span>
                        </div>

                        {/* Route */}
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">From:</span>
                              <span className="text-muted-foreground truncate">
                                {trip.start_location || 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">To:</span>
                              <span className="text-muted-foreground truncate">
                                {trip.end_location || 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="font-medium">
                              {trip.distance ? `${trip.distance.toFixed(1)} mi` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Speed</p>
                            <p className="font-medium">
                              {trip.avg_speed ? `${trip.avg_speed.toFixed(0)} mph` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fuel Used</p>
                            <p className="font-medium">
                              {trip.fuel_used ? `${trip.fuel_used.toFixed(1)} gal` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Recent timestamp */}
                        {trip.start_time && (
                          <p className="text-xs text-muted-foreground pt-2">
                            {formatDistanceToNow(new Date(trip.start_time), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {trips.length > 0 && trips.length % 20 === 0 && (
            <Button variant="outline" className="w-full">
              Load More Trips
            </Button>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
