/**
 * VehicleDetailPanel - Level 2 drilldown for vehicle details
 * Shows comprehensive vehicle information with action buttons
 */

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
  Zap,
  Timer,
  RotateCw,
  Settings,
  Link2,
  History,
  Play,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { AssetRelationshipsList } from './AssetRelationshipsList'
import { MetricCard } from './MetricCard'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TripPlayback } from '@/components/vehicle/TripPlayback'
import { VehicleHistoryTrail } from '@/components/vehicle/VehicleHistoryTrail'
import { useDrilldown } from '@/contexts/DrilldownContext'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  OPERATIONAL_STATUS_LABELS,
} from '@/types/asset.types'
import logger from '@/utils/logger'
import { AssetCategory, AssetType, PowerType, OperationalStatus } from '@/types/asset.types'

interface VehicleDetailPanelProps {
  vehicleId: string
}

interface PrimaryMetric {
  ODOMETER: 'ODOMETER'
  ENGINE_HOURS: 'ENGINE_HOURS'
  PTO_HOURS: 'PTO_HOURS'
  AUX_HOURS: 'AUX_HOURS'
  CYCLES: 'CYCLES'
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function VehicleDetailPanel({ vehicleId }: VehicleDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: vehicle, error, isLoading, mutate } = useSWR(
    `/api/vehicles/${vehicleId}`,
    fetcher
  )

  // State for location history
  const [showLocationHistory, setShowLocationHistory] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
    endDate: new Date().toISOString()
  })

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

  const handleToggleLocationHistory = () => {
    setShowLocationHistory(!showLocationHistory)
  }

  const handleDateRangeChange = (range: 'day' | 'week' | 'month') => {
    const now = new Date()
    const daysMap = { day: 1, week: 7, month: 30 }
    const startDate = new Date(now.getTime() - daysMap[range] * 24 * 60 * 60 * 1000)
    setDateRange({
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
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
                <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
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

          {/* Asset Classification */}
          {(vehicle.asset_category || vehicle.asset_type || vehicle.power_type) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Asset Classification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {vehicle.asset_category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">
                        {ASSET_CATEGORY_LABELS[vehicle.asset_category as AssetCategory] || vehicle.asset_category}
                      </p>
                    </div>
                  )}
                  {vehicle.asset_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {ASSET_TYPE_LABELS[vehicle.asset_type as AssetType] || vehicle.asset_type}
                      </p>
                    </div>
                  )}
                  {vehicle.power_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Power Type</p>
                      <p className="font-medium">
                        {POWER_TYPE_LABELS[vehicle.power_type as PowerType] || vehicle.power_type}
                      </p>
                    </div>
                  )}
                  {vehicle.operational_status && (
                    <div>
                      <p className="text-sm text-muted-foreground">Operational Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            vehicle.operational_status === 'AVAILABLE'
                              ? 'default'
                              : vehicle.operational_status === 'IN_USE'
                              ? 'secondary'
                              : vehicle.operational_status === 'MAINTENANCE'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {OPERATIONAL_STATUS_LABELS[vehicle.operational_status as OperationalStatus] ||
                            vehicle.operational_status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Metric Tracking */}
          {(vehicle.primary_metric ||
            vehicle.engine_hours ||
            vehicle.pto_hours ||
            vehicle.aux_hours ||
            vehicle.cycle_count) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Usage Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Odometer (from existing mileage field) */}
                  {(vehicle.odometer || vehicle.mileage) && (
                    <MetricCard
                      label="Odometer"
                      value={vehicle.odometer || vehicle.mileage}
                      unit="mi"
                      isPrimary={vehicle.primary_metric === 'ODOMETER'}
                      icon={<Gauge className="h-4 w-4" />}
                    />
                  )}

                  {/* Engine Hours */}
                  {vehicle.engine_hours !== undefined && vehicle.engine_hours > 0 && (
                    <MetricCard
                      label="Engine Hours"
                      value={vehicle.engine_hours}
                      unit="hrs"
                      isPrimary={vehicle.primary_metric === 'ENGINE_HOURS'}
                      icon={<Timer className="h-4 w-4" />}
                    />
                  )}

                  {/* PTO Hours */}
                  {vehicle.pto_hours !== undefined && vehicle.pto_hours > 0 && (
                    <MetricCard
                      label="PTO Hours"
                      value={vehicle.pto_hours}
                      unit="hrs"
                      isPrimary={vehicle.primary_metric === 'PTO_HOURS'}
                      icon={<Zap className="h-4 w-4" />}
                    />
                  )}

                  {/* Auxiliary Hours */}
                  {vehicle.aux_hours !== undefined && vehicle.aux_hours > 0 && (
                    <MetricCard
                      label="Aux Hours"
                      value={vehicle.aux_hours}
                      unit="hrs"
                      isPrimary={vehicle.primary_metric === 'AUX_HOURS'}
                      icon={<Clock className="h-4 w-4" />}
                    />
                  )}

                  {/* Cycle Count */}
                  {vehicle.cycle_count !== undefined && vehicle.cycle_count > 0 && (
                    <MetricCard
                      label="Cycles"
                      value={vehicle.cycle_count}
                      unit="cycles"
                      isPrimary={vehicle.primary_metric === 'CYCLES'}
                      icon={<RotateCw className="h-4 w-4" />}
                    />
                  )}
                </div>

                {vehicle.last_metric_update && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Last updated:{' '}
                    {new Date(vehicle.last_metric_update).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equipment Specifications (for HEAVY_EQUIPMENT) */}
          {vehicle.asset_category === 'HEAVY_EQUIPMENT' &&
            (vehicle.capacity_tons ||
              vehicle.lift_height_feet ||
              vehicle.max_reach_feet ||
              vehicle.bucket_capacity_yards ||
              vehicle.operating_weight_lbs) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Equipment Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {vehicle.capacity_tons && (
                      <div>
                        <p className="text-sm text-muted-foreground">Capacity</p>
                        <p className="font-medium text-lg">
                          {vehicle.capacity_tons} <span className="text-sm">tons</span>
                        </p>
                      </div>
                    )}
                    {vehicle.lift_height_feet && (
                      <div>
                        <p className="text-sm text-muted-foreground">Lift Height</p>
                        <p className="font-medium text-lg">
                          {vehicle.lift_height_feet} <span className="text-sm">ft</span>
                        </p>
                      </div>
                    )}
                    {vehicle.max_reach_feet && (
                      <div>
                        <p className="text-sm text-muted-foreground">Max Reach</p>
                        <p className="font-medium text-lg">
                          {vehicle.max_reach_feet} <span className="text-sm">ft</span>
                        </p>
                      </div>
                    )}
                    {vehicle.bucket_capacity_yards && (
                      <div>
                        <p className="text-sm text-muted-foreground">Bucket Capacity</p>
                        <p className="font-medium text-lg">
                          {vehicle.bucket_capacity_yards} <span className="text-sm">yd³</span>
                        </p>
                      </div>
                    )}
                    {vehicle.operating_weight_lbs && (
                      <div>
                        <p className="text-sm text-muted-foreground">Operating Weight</p>
                        <p className="font-medium text-lg">
                          {vehicle.operating_weight_lbs} <span className="text-sm">lbs</span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}
    </DrilldownContent>
  )
}