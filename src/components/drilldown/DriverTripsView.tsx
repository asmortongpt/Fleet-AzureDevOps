/**
 * DriverTripsView - Level 4 drilldown for driver trip details with incidents
 * Shows individual trips with performance data and safety incidents
 */

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useSWR from 'swr'
import {
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Fuel,
  Route,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DriverTripsViewProps {
  driverId: string
  driverName?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DriverTripsView({ driverId, driverName }: DriverTripsViewProps) {
  const { data: trips, error, isLoading, mutate } = useSWR(
    `/api/drivers/${driverId}/trips`,
    fetcher
  )

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'success' as const, label: 'Excellent' }
    if (score >= 70) return { variant: 'warning' as const, label: 'Good' }
    return { variant: 'destructive' as const, label: 'Poor' }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {trips && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold">
              Trip History {driverName && `for ${driverName}`}
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
              {trips.map((trip: any) => {
                const scoreBadge = getScoreBadge(trip.performance_score || 0)
                return (
                  <Card key={trip.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {/* Trip Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={trip.status === 'completed' ? 'success' : 'default'}>
                                {trip.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Trip #{trip.id.slice(0, 8)}
                              </span>
                            </div>
                            {trip.vehicle_name && (
                              <p className="text-sm font-medium">{trip.vehicle_name}</p>
                            )}
                          </div>
                          <Badge variant={scoreBadge.variant}>
                            {trip.performance_score || 0}% - {scoreBadge.label}
                          </Badge>
                        </div>

                        {/* Time & Date */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {trip.start_time
                                ? new Date(trip.start_time).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{trip.duration || 'N/A'}</span>
                          </div>
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

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
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
                            <p className="text-xs text-muted-foreground">Fuel</p>
                            <p className="font-medium">
                              {trip.fuel_used ? `${trip.fuel_used.toFixed(1)} gal` : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Incidents */}
                        {trip.incidents && trip.incidents.length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                              <span className="text-sm font-medium text-destructive">
                                {trip.incidents.length} Incident{trip.incidents.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <ul className="space-y-2">
                              {trip.incidents.map((incident: any, idx: number) => (
                                <li
                                  key={idx}
                                  className="text-xs p-2 rounded bg-destructive/10 flex items-start gap-2"
                                >
                                  <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium">{incident.type}</p>
                                    {incident.severity && (
                                      <p className="text-muted-foreground">
                                        Severity: {incident.severity}
                                      </p>
                                    )}
                                    {incident.timestamp && (
                                      <p className="text-muted-foreground">
                                        {new Date(incident.timestamp).toLocaleTimeString()}
                                      </p>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Performance Highlights */}
                        {trip.highlights && trip.highlights.length > 0 && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Highlights</span>
                            </div>
                            <ul className="space-y-1">
                              {trip.highlights.map((highlight: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="text-xs flex items-center gap-2 text-green-600"
                                >
                                  <TrendingUp className="h-3 w-3 flex-shrink-0" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Timestamp */}
                        {trip.start_time && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            {formatDistanceToNow(new Date(trip.start_time), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
