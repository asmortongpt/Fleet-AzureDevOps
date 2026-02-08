/**
 * VehicleDetailPanel - Level 2 drilldown for vehicle details
 * Shows comprehensive vehicle information with full maintenance history, incidents, trips, and complete records
 */

import {
  Car,
  Gauge,
  Fuel,
  Activity,
  Clock,
  Route,
  AlertTriangle,
  Zap,
  Timer,
  RotateCw,
  Settings,
  Wrench,
  FileText,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { MetricCard } from './MetricCard'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  OPERATIONAL_STATUS_LABELS,
  AssetCategory, AssetType, PowerType, OperationalStatus
} from '@/types/asset.types'

const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { credentials: 'include', ...init })

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

interface MaintenanceRecord {
  id: string
  work_order_number: string
  date: string
  type: string
  description: string
  cost: number
  status: string
  mileage?: number
}

interface IncidentRecord {
  id: string
  incident_number: string
  date: string
  type: string
  severity: string
  description: string
  cost?: number
  status: string
}

interface TripRecord {
  id: string
  start_time: string
  end_time: string
  distance: number
  driver_name?: string
  start_location?: string
  end_location?: string
  duration_minutes?: number
}

interface InspectionRecord {
  id: string
  inspection_number: string
  date: string
  type: string
  result: 'passed' | 'failed' | 'warning'
  inspector_name?: string
  notes?: string
}

interface FuelRecord {
  id: string
  date: string
  gallons: number
  cost: number
  location?: string
  odometer?: number
}

const fetcher = (url: string) => authFetch(url).then((r) => r.json())

export function VehicleDetailPanel({ vehicleId }: VehicleDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: vehicle, error, isLoading, mutate } = useSWR(
    `/api/vehicles/${vehicleId}`,
    fetcher
  )

  // Maintenance history
  const { data: maintenanceHistory } = useSWR<MaintenanceRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/maintenance` : null,
    fetcher
  )

  // Incident history
  const { data: incidents } = useSWR<IncidentRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/incidents` : null,
    fetcher
  )

  // Recent trips
  const { data: trips } = useSWR<TripRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/trips` : null,
    fetcher
  )

  // Inspections
  const { data: inspections } = useSWR<InspectionRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/inspections` : null,
    fetcher
  )

  // Fuel records
  const { data: fuelRecords } = useSWR<FuelRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/fuel` : null,
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

  const handleViewWorkOrder = (workOrderId: string, workOrderNumber: string) => {
    push({
      id: `work-order-${workOrderId}`,
      type: 'work-order',
      label: `WO #${workOrderNumber}`,
      data: { workOrderId },
    })
  }

  const handleViewIncident = (incidentId: string, incidentNumber: string) => {
    push({
      id: `incident-${incidentId}`,
      type: 'incident',
      label: `Incident #${incidentNumber}`,
      data: { incidentId },
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

  const totalMaintenanceCost = maintenanceHistory?.reduce((sum, record) => sum + record.cost, 0) || 0
  const totalIncidentCost = incidents?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0
  const totalTrips = trips?.length || 0
  const totalDistance = trips?.reduce((sum, trip) => sum + trip.distance, 0) || 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {vehicle && (
        <div className="space-y-2">
          {/* Vehicle Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">{vehicle.name}</h3>
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
            <Car className="h-9 w-12 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Mileage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
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
                <div className="text-sm font-bold">{vehicle.fuel_level || 0}%</div>
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
                <div className="text-sm font-bold">{vehicle.health_score || 0}%</div>
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
                <div className="text-sm font-bold">{vehicle.uptime || 0}%</div>
                <Progress value={vehicle.uptime || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({maintenanceHistory?.length || 0})</TabsTrigger>
              <TabsTrigger value="incidents">Incidents ({incidents?.length || 0})</TabsTrigger>
              <TabsTrigger value="trips">Trips ({trips?.length || 0})</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="fuel">Fuel</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
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
                    <div className="grid grid-cols-2 gap-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
                        <p className="text-xs text-muted-foreground mt-2">
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
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {vehicle.capacity_tons && (
                          <div>
                            <p className="text-sm text-muted-foreground">Capacity</p>
                            <p className="font-medium text-sm">
                              {vehicle.capacity_tons} <span className="text-sm">tons</span>
                            </p>
                          </div>
                        )}
                        {vehicle.lift_height_feet && (
                          <div>
                            <p className="text-sm text-muted-foreground">Lift Height</p>
                            <p className="font-medium text-sm">
                              {vehicle.lift_height_feet} <span className="text-sm">ft</span>
                            </p>
                          </div>
                        )}
                        {vehicle.max_reach_feet && (
                          <div>
                            <p className="text-sm text-muted-foreground">Max Reach</p>
                            <p className="font-medium text-sm">
                              {vehicle.max_reach_feet} <span className="text-sm">ft</span>
                            </p>
                          </div>
                        )}
                        {vehicle.bucket_capacity_yards && (
                          <div>
                            <p className="text-sm text-muted-foreground">Bucket Capacity</p>
                            <p className="font-medium text-sm">
                              {vehicle.bucket_capacity_yards} <span className="text-sm">yd³</span>
                            </p>
                          </div>
                        )}
                        {vehicle.operating_weight_lbs && (
                          <div>
                            <p className="text-sm text-muted-foreground">Operating Weight</p>
                            <p className="font-medium text-sm">
                              {vehicle.operating_weight_lbs} <span className="text-sm">lbs</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Cost Summary */}
              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Total Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold">${totalMaintenanceCost.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {maintenanceHistory?.length || 0} records
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Total Incidents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm font-bold text-destructive">
                      ${totalIncidentCost.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {incidents?.length || 0} incidents
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-2">
              {maintenanceHistory && maintenanceHistory.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceHistory.map((record) => (
                    <Card
                      key={record.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewWorkOrder(record.id, record.work_order_number)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">WO #{record.work_order_number}</p>
                              <Badge variant="outline" className="capitalize">
                                {record.type}
                              </Badge>
                              <Badge
                                variant={
                                  record.status === 'completed'
                                    ? 'default'
                                    : record.status === 'in_progress'
                                      ? 'secondary'
                                      : 'outline'
                                }
                              >
                                {record.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{record.description}</p>
                            {record.mileage && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Mileage: {record.mileage.toLocaleString()} mi
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-sm font-medium">${record.cost.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Wrench className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No maintenance records</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Incidents Tab */}
            <TabsContent value="incidents" className="space-y-2">
              {incidents && incidents.length > 0 ? (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <Card
                      key={incident.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewIncident(incident.id, incident.incident_number)}
                    >
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">#{incident.incident_number}</p>
                              <Badge
                                variant={
                                  incident.severity === 'critical' || incident.severity === 'high'
                                    ? 'destructive'
                                    : incident.severity === 'medium'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {incident.severity}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {incident.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{incident.description}</p>
                          </div>
                          <div className="text-right ml-2">
                            {incident.cost !== undefined && (
                              <p className="text-sm font-medium text-destructive">
                                ${incident.cost.toFixed(2)}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(incident.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No incidents recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Trips Tab */}
            <TabsContent value="trips" className="space-y-2">
              {trips && trips.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Card>
                      <CardContent className="pt-3">
                        <div className="text-sm text-muted-foreground">Total Trips</div>
                        <div className="text-sm font-bold">{totalTrips}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-3">
                        <div className="text-sm text-muted-foreground">Total Distance</div>
                        <div className="text-sm font-bold">{totalDistance.toFixed(1)} mi</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    {trips.slice(0, 10).map((trip) => (
                      <Card key={trip.id}>
                        <CardContent className="p-2">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                {trip.driver_name && (
                                  <p className="font-medium">{trip.driver_name}</p>
                                )}
                                {trip.start_location && trip.end_location && (
                                  <p className="text-sm text-muted-foreground">
                                    {trip.start_location} → {trip.end_location}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{trip.distance.toFixed(1)} mi</p>
                                {trip.duration_minutes && (
                                  <p className="text-xs text-muted-foreground">
                                    {Math.floor(trip.duration_minutes / 60)}h{' '}
                                    {trip.duration_minutes % 60}m
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              {new Date(trip.start_time).toLocaleString()} -{' '}
                              {new Date(trip.end_time).toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {trips.length > 10 && (
                      <p className="text-sm text-center text-muted-foreground">
                        +{trips.length - 10} more trips
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Route className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No trips recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inspections Tab */}
            <TabsContent value="inspections" className="space-y-2">
              {inspections && inspections.length > 0 ? (
                <div className="space-y-3">
                  {inspections.map((inspection) => (
                    <Card key={inspection.id}>
                      <CardContent className="p-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">#{inspection.inspection_number}</p>
                              <Badge
                                variant={
                                  inspection.result === 'passed'
                                    ? 'default'
                                    : inspection.result === 'failed'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {inspection.result}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {inspection.type}
                              </Badge>
                            </div>
                            {inspection.inspector_name && (
                              <p className="text-sm text-muted-foreground">
                                Inspector: {inspection.inspector_name}
                              </p>
                            )}
                            {inspection.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {inspection.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs text-muted-foreground">
                              {new Date(inspection.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No inspections recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Fuel Tab */}
            <TabsContent value="fuel" className="space-y-2">
              {fuelRecords && fuelRecords.length > 0 ? (
                <>
                  <Card>
                    <CardContent className="pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Fuel</p>
                          <p className="text-sm font-bold">
                            {fuelRecords.reduce((sum, record) => sum + record.gallons, 0).toFixed(1)} gal
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-sm font-bold">
                            ${fuelRecords.reduce((sum, record) => sum + record.cost, 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    {fuelRecords.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{record.gallons.toFixed(2)} gallons</p>
                              {record.location && (
                                <p className="text-sm text-muted-foreground">{record.location}</p>
                              )}
                              {record.odometer && (
                                <p className="text-xs text-muted-foreground">
                                  Odometer: {record.odometer.toLocaleString()} mi
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">${record.cost.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Fuel className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No fuel records</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewMaintenance} className="w-full">
              <Wrench className="h-4 w-4 mr-2" />
              Full Maintenance History
            </Button>
            <Button onClick={handleViewTrips} variant="outline" className="w-full">
              <Route className="h-4 w-4 mr-2" />
              All Trips
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
