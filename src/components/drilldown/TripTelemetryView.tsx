/**
 * TripTelemetryView - Level 4 drilldown for detailed trip telemetry
 * Shows GPS points, speed, fuel consumption, and other telemetry data
 */

import React, { useState } from 'react'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useSWR from 'swr'
import {
  MapPin,
  Activity,
  Fuel,
  Gauge,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface TripTelemetryViewProps {
  tripId: string
  trip?: any
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function TripTelemetryView({ tripId, trip }: TripTelemetryViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: telemetry, error, isLoading, mutate } = useSWR(
    `/api/trips/${tripId}/telemetry`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {telemetry && (
        <div className="space-y-6">
          {/* Trip Summary */}
          <div>
            <h3 className="text-lg font-semibold">Trip Telemetry</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed data for trip #{tripId.slice(0, 8)}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="gps">GPS</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="fuel">Fuel</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      GPS Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {telemetry.gps_points?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recorded locations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {telemetry.duration || trip?.duration || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total trip time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      Max Speed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {telemetry.max_speed ? `${telemetry.max_speed.toFixed(0)} mph` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Peak velocity
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      Fuel Economy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {telemetry.fuel_economy
                        ? `${telemetry.fuel_economy.toFixed(1)} mpg`
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Average MPG
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Idle Time</span>
                    <span className="font-medium">
                      {telemetry.idle_time || '0 min'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hard Braking Events</span>
                    <span className="font-medium">{telemetry.hard_braking || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rapid Acceleration</span>
                    <span className="font-medium">
                      {telemetry.rapid_acceleration || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speeding Incidents</span>
                    <span className="font-medium">{telemetry.speeding || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GPS Tab */}
            <TabsContent value="gps" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>GPS Tracking Points</CardTitle>
                </CardHeader>
                <CardContent>
                  {telemetry.gps_points && telemetry.gps_points.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {telemetry.gps_points.map((point: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">
                              {point.lat?.toFixed(6)}, {point.lng?.toFixed(6)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {point.timestamp
                              ? new Date(point.timestamp).toLocaleTimeString()
                              : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No GPS data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Speed Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Speed</span>
                      <span className="font-medium">
                        {telemetry.avg_speed
                          ? `${telemetry.avg_speed.toFixed(0)} mph`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Maximum Speed</span>
                      <span className="font-medium flex items-center gap-1">
                        {telemetry.max_speed
                          ? `${telemetry.max_speed.toFixed(0)} mph`
                          : 'N/A'}
                        {telemetry.max_speed > 80 && (
                          <TrendingUp className="h-4 w-4 text-destructive" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Top Speed Location</span>
                      <span className="text-xs text-muted-foreground">
                        {telemetry.max_speed_location || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driving Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {telemetry.events && telemetry.events.length > 0 ? (
                    telemetry.events.map((event: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded bg-muted/50"
                      >
                        <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.timestamp
                              ? new Date(event.timestamp).toLocaleString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No events recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Fuel Tab */}
            <TabsContent value="fuel" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Fuel Consumption</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Used</p>
                      <p className="text-2xl font-bold">
                        {telemetry.fuel_used
                          ? `${telemetry.fuel_used.toFixed(2)} gal`
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Economy</p>
                      <p className="text-2xl font-bold">
                        {telemetry.fuel_economy
                          ? `${telemetry.fuel_economy.toFixed(1)} mpg`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Start Level</span>
                      <span className="font-medium">
                        {telemetry.fuel_start ? `${telemetry.fuel_start}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">End Level</span>
                      <span className="font-medium">
                        {telemetry.fuel_end ? `${telemetry.fuel_end}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Cost</span>
                      <span className="font-medium">
                        {telemetry.fuel_cost
                          ? `$${telemetry.fuel_cost.toFixed(2)}`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}
