/**
 * TelematicsPanel - Real-time telematics data integration for heavy equipment
 * Features:
 * - Live engine diagnostics
 * - GPS tracking and geofencing
 * - Fuel consumption monitoring
 * - Performance metrics
 * - Alert notifications
 */

import { useState, useEffect } from 'react'
import {
  GaugeIcon,
  MapPin,
  Fuel,
  AlertTriangle,
  Activity,
  TrendingUp
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api-client'
import { isSuccessResponse } from '@/lib/schemas/responses'
import type { ApiResponse } from '@/lib/schemas/responses'
import logger from '@/utils/logger'

interface TelematicsData {
  equipment_id: string
  timestamp: string
  engine_hours: number
  engine_rpm: number
  engine_temp_celsius: number
  fuel_level_percent: number
  fuel_consumption_rate: number
  latitude: number
  longitude: number
  speed_mph: number
  altitude_feet: number
  hydraulic_pressure_psi: number
  battery_voltage: number
  diagnostic_codes: string[]
  alerts: TelematicsAlert[]
}

interface TelematicsAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  acknowledged: boolean
}

interface TelematicsPanelProps {
  equipmentId: string
}

export function TelematicsPanel({ equipmentId }: TelematicsPanelProps) {
  const [telematicsData, setTelematicsData] = useState<TelematicsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchTelematicsData()

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchTelematicsData()
    }, 10000)

    return () => clearInterval(interval)
  }, [equipmentId])

  const fetchTelematicsData = async () => {
    try {
      const response = await apiClient.get<ApiResponse<{ telemetrics: TelematicsData }>>(
        `/api/heavy-equipment/${equipmentId}/telemetrics`
      )

      if (isSuccessResponse(response) && response.data?.telemetrics) {
        setTelematicsData(response.data.telemetrics)
        setLastUpdate(new Date())
      }
    } catch (error) {
      logger.error('Error fetching telematics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatus = () => {
    if (!telematicsData) return { status: 'unknown', color: 'gray' }

    const hasWarnings = telematicsData.alerts.some(a => a.severity === 'warning' && !a.acknowledged)
    const hasCritical = telematicsData.alerts.some(a => a.severity === 'critical' && !a.acknowledged)

    if (hasCritical) return { status: 'critical', color: 'red' }
    if (hasWarnings) return { status: 'warning', color: 'yellow' }
    return { status: 'healthy', color: 'green' }
  }

  const health = getHealthStatus()

  if (loading || !telematicsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Live Telematics
              </CardTitle>
              <CardDescription>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </CardDescription>
            </div>
            <Badge variant={health.color === 'green' ? 'default' : health.color === 'yellow' ? 'secondary' : 'destructive'}>
              {health.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engine">Engine</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GaugeIcon className="w-4 h-4" />
                  Engine Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{telematicsData.engine_hours.toFixed(1)}</div>
                <Progress value={(telematicsData.engine_hours % 100)} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Fuel Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{telematicsData.fuel_level_percent}%</div>
                <Progress value={telematicsData.fuel_level_percent} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Engine RPM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{telematicsData.engine_rpm}</div>
                <p className="text-xs text-muted-foreground mt-2">Current speed</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engine Tab */}
        <TabsContent value="engine" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engine Diagnostics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Temperature</span>
                  <span className="font-semibold">{telematicsData.engine_temp_celsius}°C</span>
                </div>
                <Progress
                  value={(telematicsData.engine_temp_celsius / 120) * 100}
                  className="h-2"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Hydraulic Pressure</span>
                  <span className="font-semibold">{telematicsData.hydraulic_pressure_psi} PSI</span>
                </div>
                <Progress
                  value={(telematicsData.hydraulic_pressure_psi / 3000) * 100}
                  className="h-2"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Battery Voltage</span>
                  <span className="font-semibold">{telematicsData.battery_voltage}V</span>
                </div>
                <Progress
                  value={(telematicsData.battery_voltage / 24) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Fuel Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Rate</span>
                    <span className="font-semibold">{telematicsData.fuel_consumption_rate.toFixed(2)} gal/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fuel Level</span>
                    <span className="font-semibold">{telematicsData.fuel_level_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Estimated Range</span>
                    <span className="font-semibold">
                      {telematicsData.fuel_consumption_rate > 0
                        ? ((telematicsData.fuel_level_percent / 100) / telematicsData.fuel_consumption_rate).toFixed(1)
                        : '∞'
                      } hours
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diagnostic Codes */}
          {telematicsData.diagnostic_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Diagnostic Trouble Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {telematicsData.diagnostic_codes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                      <Badge variant="secondary">{code}</Badge>
                      <span className="text-sm">Active diagnostic code</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Current Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Latitude</span>
                <span className="font-mono">{telematicsData.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Longitude</span>
                <span className="font-mono">{telematicsData.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Altitude</span>
                <span className="font-semibold">{telematicsData.altitude_feet} ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Speed</span>
                <span className="font-semibold">{telematicsData.speed_mph} mph</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {telematicsData.alerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No active alerts
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {telematicsData.alerts.map((alert) => (
                <Card key={alert.id} className={
                  alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          alert.severity === 'critical' ? 'text-red-600' :
                          alert.severity === 'warning' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'warning' ? 'secondary' :
                        'default'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
