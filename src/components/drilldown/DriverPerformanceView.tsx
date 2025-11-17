/**
 * DriverPerformanceView - Level 3 drilldown for driver performance metrics
 * Shows detailed performance analysis with charts and trends
 */

import React from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useSWR from 'swr'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Fuel,
  Activity,
} from 'lucide-react'

interface DriverPerformanceViewProps {
  driverId: string
  driverName?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function DriverPerformanceView({
  driverId,
  driverName,
}: DriverPerformanceViewProps) {
  const { push } = useDrilldown()
  const { data: performance, error, isLoading, mutate } = useSWR(
    `/api/drivers/${driverId}/performance`,
    fetcher
  )

  const handleViewTrips = () => {
    push({
      id: `driver-trips-${driverId}`,
      type: 'driver-trips',
      label: 'Trip History',
      data: { driverId, driverName },
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreVariant = (score: number): 'success' | 'warning' | 'destructive' => {
    if (score >= 90) return 'success'
    if (score >= 70) return 'warning'
    return 'destructive'
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {performance && (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold">
              Performance Metrics {driverName && `for ${driverName}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {performance.last_updated ? new Date(performance.last_updated).toLocaleString() : 'N/A'}
            </p>
          </div>

          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Performance Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-4xl font-bold ${getScoreColor(performance.overall_score || 0)}`}>
                    {performance.overall_score || 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {performance.overall_score >= 90
                      ? 'Excellent'
                      : performance.overall_score >= 70
                      ? 'Good'
                      : 'Needs Improvement'}
                  </p>
                </div>
                {performance.overall_score >= 90 ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                )}
              </div>
              <Progress value={performance.overall_score || 0} />
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Safety Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(performance.safety_score || 0)}`}>
                  {performance.safety_score || 0}%
                </div>
                <Progress value={performance.safety_score || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(performance.efficiency_score || 0)}`}>
                  {performance.efficiency_score || 0}%
                </div>
                <Progress value={performance.efficiency_score || 0} className="mt-2" />
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
                <div className={`text-2xl font-bold ${getScoreColor(performance.fuel_score || 0)}`}>
                  {performance.fuel_score || 0}%
                </div>
                <Progress value={performance.fuel_score || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  On-Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getScoreColor(performance.punctuality_score || 0)}`}>
                  {performance.punctuality_score || 0}%
                </div>
                <Progress value={performance.punctuality_score || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Tabs defaultValue="safety">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
            </TabsList>

            <TabsContent value="safety" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Safety Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hard Braking Events</span>
                    <span className="font-medium">{performance.hard_braking || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Rapid Acceleration</span>
                    <span className="font-medium">
                      {performance.rapid_acceleration || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Speeding Incidents</span>
                    <span className="font-medium">{performance.speeding || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Distracted Driving</span>
                    <span className="font-medium">
                      {performance.distracted_driving || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Seatbelt Violations</span>
                    <span className="font-medium">
                      {performance.seatbelt_violations || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="efficiency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Efficiency Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Avg Fuel Economy</span>
                    <span className="font-medium">
                      {performance.avg_mpg ? `${performance.avg_mpg.toFixed(1)} mpg` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Idle Time</span>
                    <span className="font-medium">
                      {performance.idle_time ? `${performance.idle_time} hrs` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Route Adherence</span>
                    <span className="font-medium">
                      {performance.route_adherence || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">On-Time Deliveries</span>
                    <span className="font-medium">
                      {performance.on_time_deliveries || 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="violations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Violations</CardTitle>
                </CardHeader>
                <CardContent>
                  {performance.violations && performance.violations.length > 0 ? (
                    <ul className="space-y-2">
                      {performance.violations.map((violation: any, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2 rounded bg-destructive/10"
                        >
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{violation.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {violation.date
                                ? new Date(violation.date).toLocaleDateString()
                                : 'N/A'}
                            </p>
                            {violation.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {violation.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No violations recorded
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Button */}
          <Button onClick={handleViewTrips} className="w-full">
            View Trip Details
          </Button>
        </div>
      )}
    </DrilldownContent>
  )
}
