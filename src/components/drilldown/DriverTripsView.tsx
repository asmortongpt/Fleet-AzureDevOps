/**
 * DriverTripsView - Level 4 drilldown for driver trip details with incidents
 * Shows individual trips with performance data and safety incidents
 */

import { formatDistanceToNow } from 'date-fns'
import {
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Route,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatTime } from '@/utils/format-helpers'

interface DriverTripsViewProps {
  driverId: string
  driverName?: string
}

interface Trip {
  id: string
  status: string
  vehicle_name?: string
  performance_score?: number
  start_time?: string
  duration?: string
  start_location?: string
  end_location?: string
  distance?: number
  avg_speed?: number
  fuel_used?: number
  incidents?: Array<{
    type: string
    severity?: string
    timestamp?: string
  }>
  highlights?: string[]
}

export function DriverTripsView({ driverId, driverName }: DriverTripsViewProps) {
  const { data: trips, error, isLoading, mutate } = useSWR(
    `/api/drivers/${driverId}/trips`,
    apiFetcher
  )

  const tripsArr = Array.isArray(trips) ? trips : []

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'default' as const, label: 'Excellent' }
    if (score >= 70) return { variant: 'secondary' as const, label: 'Good' }
    return { variant: 'destructive' as const, label: 'Poor' }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {trips !== undefined && (
        <div className="space-y-2">
          {/* Header */}
          <div>
            <h3 className="text-sm font-semibold">
              Trip History {driverName && `for ${driverName}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tripsArr.length} trip{tripsArr.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {/* Trip List */}
          {tripsArr.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Route className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No trips recorded</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tripsArr.map((trip: Trip) => {
                const scoreBadge = getScoreBadge(trip.performance_score || 0)
                return (
                  <Card key={trip.id} className="hover:border-white/[0.12] transition-colors">
                    <CardContent className="p-2">
                      <div className="space-y-2">
                        {/* Trip Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={trip.status === 'completed' ? 'default' : 'default'}>
                                {formatEnum(trip.status)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Trip #{String(trip.id).slice(0, 8)}
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
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(trip.start_time)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{trip.duration || '—'}</span>
                          </div>
                        </div>

                        {/* Route */}
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">From:</span>
                              <span className="text-muted-foreground truncate">
                                {trip.start_location || '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">To:</span>
                              <span className="text-muted-foreground truncate">
                                {trip.end_location || '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Distance</p>
                            <p className="font-medium">
                              {trip.distance ? `${trip.distance.toFixed(1)} mi` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Speed</p>
                            <p className="font-medium">
                              {trip.avg_speed ? `${trip.avg_speed.toFixed(0)} mph` : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Fuel</p>
                            <p className="font-medium">
                              {trip.fuel_used ? `${trip.fuel_used.toFixed(1)} gal` : '—'}
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
                              {trip.incidents.map((incident, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs p-2 rounded bg-destructive/10 flex items-start gap-2"
                                >
                                  <AlertTriangle className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="font-medium">{formatEnum(incident.type)}</p>
                                    {incident.severity && (
                                      <p className="text-muted-foreground">
                                        Severity: {formatEnum(incident.severity)}
                                      </p>
                                    )}
                                    {incident.timestamp && (
                                      <p className="text-muted-foreground">
                                        {formatTime(incident.timestamp)}
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
                              {trip.highlights.map((highlight, idx) => (
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