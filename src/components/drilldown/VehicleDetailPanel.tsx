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
  User,
  MapPin,
  Pencil,
  UserCheck,
} from 'lucide-react'
import { useState, useMemo } from 'react'
import useSWR from 'swr'

import { MetricCard } from './MetricCard'

import { EditVehicleDialog } from '@/components/dialogs/EditVehicleDialog'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { apiFetcher } from '@/lib/api-fetcher'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'
import {
  ASSET_CATEGORY_LABELS,
  ASSET_TYPE_LABELS,
  POWER_TYPE_LABELS,
  OPERATIONAL_STATUS_LABELS,
  AssetCategory, AssetType, PowerType, OperationalStatus
} from '@/types/asset.types'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime, formatCurrency, formatNumber } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'

interface VehicleDetailPanelProps {
  vehicleId: string
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadgeVariant(status: string) {
  switch (status) {
    case 'active':
    case 'available':
    case 'completed':
      return 'success' as const
    case 'in_progress':
    case 'in_use':
    case 'in_service':
      return 'info' as const
    case 'pending':
    case 'scheduled':
      return 'warning' as const
    case 'inactive':
    case 'out_of_service':
    case 'cancelled':
    case 'failed':
      return 'destructive' as const
    default:
      return 'outline' as const
  }
}

function severityBadgeVariant(severity: string) {
  switch (severity) {
    case 'critical':
      return 'destructive' as const
    case 'high':
      return 'destructive-subtle' as const
    case 'medium':
      return 'warning' as const
    case 'low':
      return 'outline' as const
    default:
      return 'outline' as const
  }
}

function inspectionResultVariant(result: string) {
  switch (result) {
    case 'passed':
      return 'success' as const
    case 'failed':
      return 'destructive' as const
    case 'warning':
      return 'warning' as const
    default:
      return 'outline' as const
  }
}

function healthScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-rose-400'
}

function healthScoreBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-rose-500'
}

function fuelBarColor(level: number) {
  if (level >= 50) return 'bg-emerald-500'
  if (level >= 25) return 'bg-amber-500'
  return 'bg-rose-500'
}

// Skeleton placeholder for loading states within tabs
function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.08] p-3">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-2.5 w-48 bg-white/[0.04] rounded animate-pulse" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse ml-auto" />
              <div className="h-2.5 w-20 bg-white/[0.04] rounded animate-pulse ml-auto" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-8 w-8 text-white/20 mb-2" />
      <p className="text-sm text-white/40">No records found</p>
      <p className="text-xs text-white/25 mt-0.5">{message}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VehicleDetailPanel({ vehicleId }: VehicleDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: vehicle, error, isLoading, mutate } = useSWR(
    `/api/vehicles/${vehicleId}`,
    apiFetcher
  )

  const { data: maintenanceHistory, isLoading: maintenanceLoading } = useSWR<MaintenanceRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/maintenance` : null,
    apiFetcher
  )

  const { data: incidents, isLoading: incidentsLoading } = useSWR<IncidentRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/incidents` : null,
    apiFetcher
  )

  const { data: trips, isLoading: tripsLoading } = useSWR<TripRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/trips` : null,
    apiFetcher
  )

  const { data: inspections, isLoading: inspectionsLoading } = useSWR<InspectionRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/inspections` : null,
    apiFetcher
  )

  const { data: fuelRecords, isLoading: fuelLoading } = useSWR<FuelRecord[]>(
    vehicleId ? `/api/vehicles/${vehicleId}/fuel` : null,
    apiFetcher
  )

  const { data: schedules } = useSWR<any[]>(
    vehicleId ? `/api/maintenance-schedules?vehicle_id=${vehicleId}&status=active&limit=5` : null,
    apiFetcher,
    { shouldRetryOnError: false }
  )

  const { data: currentAssignment } = useSWR(
    vehicleId ? `/api/vehicle-assignments?vehicle_id=${vehicleId}&lifecycle_state=active&limit=1` : null,
    apiFetcher,
    { shouldRetryOnError: false }
  )

  const nextPm = useMemo(() => {
    if (!Array.isArray(schedules) || schedules.length === 0) return null
    const sorted = schedules
      .filter((s: any) => s.next_service_date || s.next_due_date || s.nextDueDate)
      .sort((a: any, b: any) =>
        new Date(a.next_service_date || a.next_due_date || a.nextDueDate).getTime() -
        new Date(b.next_service_date || b.next_due_date || b.nextDueDate).getTime()
      )
    return sorted[0] || null
  }, [schedules])

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

  const maintenanceArr = Array.isArray(maintenanceHistory) ? maintenanceHistory : []
  const incidentsArr = Array.isArray(incidents) ? incidents : []
  const tripsArr = Array.isArray(trips) ? trips : []
  const inspectionsArr = Array.isArray(inspections) ? inspections : []
  const fuelArr = Array.isArray(fuelRecords) ? fuelRecords : []

  const totalMaintenanceCost = maintenanceArr.reduce((sum, record) => sum + (record.cost || 0), 0)
  const totalIncidentCost = incidentsArr.reduce((sum, record) => sum + (record.cost || 0), 0)
  const totalTrips = tripsArr.length
  const totalDistance = tripsArr.reduce((sum, trip) => sum + (trip.distance || 0), 0)

  const healthScore = vehicle?.health_score ?? 0
  const fuelLevel = vehicle?.fuel_level ?? 0
  const odometer = vehicle?.mileage ?? vehicle?.odometer ?? 0
  const uptime = vehicle?.uptime ?? 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {vehicle && (
        <div className="space-y-3">
          {/* ---------------------------------------------------------------- */}
          {/* Header: compact, data-dense                                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Line 1: name + edit button */}
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {formatVehicleName(vehicle)}
                  </h3>
                  <button
                    onClick={() => setEditDialogOpen(true)}
                    className="shrink-0 p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                    title="Edit vehicle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Line 2: status badge + assigned driver */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge variant={statusBadgeVariant(vehicle.status)} size="sm">
                    {formatEnum(vehicle.status)}
                  </Badge>
                  {vehicle.assigned_to && (
                    <span className="inline-flex items-center gap-1 text-xs text-white/50">
                      <User className="h-3 w-3" />
                      {vehicle.assigned_to}
                    </span>
                  )}
                </div>

                {/* Line 3: VIN + license plate */}
                <div className="flex items-center gap-4 mt-2">
                  {vehicle.vin && (
                    <span className="text-xs text-white/40">
                      VIN{' '}
                      <span className="font-mono text-white/60">{vehicle.vin}</span>
                    </span>
                  )}
                  {vehicle.license_plate && (
                    <span className="inline-flex items-center gap-1 rounded bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-xs font-semibold text-white/80 tracking-wide">
                      {vehicle.license_plate}
                    </span>
                  )}
                </div>
                {/* Next PM due */}
                {nextPm && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-white/50">
                    <Wrench className="h-3 w-3" />
                    <span>Next PM: <span className="font-semibold text-white/70">{formatDate(nextPm.next_service_date || nextPm.next_due_date || nextPm.nextDueDate)}</span></span>
                    {(nextPm.name || nextPm.description) && <span className="text-white/30">({nextPm.name || nextPm.description})</span>}
                  </div>
                )}
              </div>
              <Car className="h-8 w-8 text-white/20 shrink-0 mt-0.5" />
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Quick Stats: 4 cards, single horizontal row                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="grid grid-cols-4 gap-2">
            {/* Health Score */}
            <button
              onClick={() => push({
                id: `health-breakdown-${vehicleId}`,
                type: 'health-breakdown',
                label: 'Health Score',
                data: { vehicleId, healthScore }
              })}
              className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5 text-left hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[11px] text-white/40 font-medium">Health</span>
              </div>
              <div className={cn('text-lg font-bold leading-tight', healthScoreColor(healthScore))}>
                {healthScore}%
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                <div
                  className={cn('h-full rounded-full', healthScoreBarColor(healthScore))}
                  style={{ width: `${Math.min(healthScore, 100)}%` }}
                />
              </div>
            </button>

            {/* Fuel Level */}
            <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Fuel className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[11px] text-white/40 font-medium">Fuel</span>
              </div>
              <div className="text-lg font-bold text-white leading-tight">
                {fuelLevel}%
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                <div
                  className={cn('h-full rounded-full', fuelBarColor(fuelLevel))}
                  style={{ width: `${Math.min(fuelLevel, 100)}%` }}
                />
              </div>
            </div>

            {/* Odometer */}
            <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Gauge className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[11px] text-white/40 font-medium">Odometer</span>
              </div>
              <div className="text-lg font-bold text-white leading-tight">
                {formatNumber(odometer)}
              </div>
              <div className="text-[10px] text-white/30 mt-0.5">miles</div>
            </div>

            {/* Uptime */}
            <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-white/40" />
                <span className="text-[11px] text-white/40 font-medium">Uptime</span>
              </div>
              <div className="text-lg font-bold text-white leading-tight">
                {uptime}%
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] mt-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${Math.min(uptime, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Tabbed Content                                                    */}
          {/* ---------------------------------------------------------------- */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance ({maintenanceHistory?.length || 0})</TabsTrigger>
              <TabsTrigger value="incidents">Incidents ({incidents?.length || 0})</TabsTrigger>
              <TabsTrigger value="trips">Trips ({trips?.length || 0})</TabsTrigger>
              <TabsTrigger value="inspections">Inspections</TabsTrigger>
              <TabsTrigger value="fuel">Fuel</TabsTrigger>
            </TabsList>

            {/* ============================================================= */}
            {/* Overview Tab                                                   */}
            {/* ============================================================= */}
            <TabsContent value="overview" className="space-y-2 mt-2">
              {/* Vehicle Information */}
              <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[11px] text-white/40">VIN</p>
                    <p className="text-sm font-mono text-white/80">{vehicle.vin || '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">License Plate</p>
                    <p className="text-sm font-semibold text-white/80">{vehicle.license_plate || '\u2014'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">Type</p>
                    <p className="text-sm text-white/80">{formatEnum(vehicle.type)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/40">Department</p>
                    <p className="text-sm text-white/80">{formatEnum(vehicle.department)}</p>
                  </div>
                </div>
              </div>

              {/* Asset Classification */}
              {(vehicle.asset_category || vehicle.asset_type || vehicle.power_type) && (
                <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5" />
                    Asset Classification
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {vehicle.asset_category && (
                      <div>
                        <p className="text-[11px] text-white/40">Category</p>
                        <p className="text-sm text-white/80">
                          {ASSET_CATEGORY_LABELS[vehicle.asset_category as AssetCategory] || formatEnum(vehicle.asset_category)}
                        </p>
                      </div>
                    )}
                    {vehicle.asset_type && (
                      <div>
                        <p className="text-[11px] text-white/40">Type</p>
                        <p className="text-sm text-white/80">
                          {ASSET_TYPE_LABELS[vehicle.asset_type as AssetType] || formatEnum(vehicle.asset_type)}
                        </p>
                      </div>
                    )}
                    {vehicle.power_type && (
                      <div>
                        <p className="text-[11px] text-white/40">Power Type</p>
                        <p className="text-sm text-white/80">
                          {POWER_TYPE_LABELS[vehicle.power_type as PowerType] || formatEnum(vehicle.power_type)}
                        </p>
                      </div>
                    )}
                    {vehicle.operational_status && (
                      <div>
                        <p className="text-[11px] text-white/40">Operational Status</p>
                        <Badge variant={statusBadgeVariant(vehicle.operational_status.toLowerCase())} size="sm" className="mt-0.5">
                          {OPERATIONAL_STATUS_LABELS[vehicle.operational_status as OperationalStatus] || formatEnum(vehicle.operational_status)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Current Assignment */}
              <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  Current Assignment
                </h4>
                {(() => {
                  const assignments = Array.isArray(currentAssignment) ? currentAssignment : currentAssignment?.assignments ?? []
                  const active = assignments[0]
                  if (!active) return (
                    <p className="text-xs text-white/40">No active assignment</p>
                  )
                  return (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">
                          {active.driver_first_name} {active.driver_last_name}
                        </p>
                        <p className="text-[11px] text-white/40">
                          {formatEnum(active.assignment_type)} · {active.department_name || 'No department'}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">{formatEnum(active.lifecycle_state)}</Badge>
                    </div>
                  )
                })()}
              </div>

              {/* Multi-Metric Tracking */}
              {(vehicle.primary_metric ||
                vehicle.engine_hours ||
                vehicle.pto_hours ||
                vehicle.aux_hours ||
                vehicle.cycle_count) && (
                <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Usage Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {(vehicle.odometer || vehicle.mileage) && (
                      <MetricCard
                        label="Odometer"
                        value={vehicle.odometer || vehicle.mileage}
                        unit="mi"
                        isPrimary={vehicle.primary_metric === 'ODOMETER'}
                        icon={<Gauge className="h-4 w-4" />}
                      />
                    )}
                    {vehicle.engine_hours !== undefined && vehicle.engine_hours > 0 && (
                      <MetricCard
                        label="Engine Hours"
                        value={vehicle.engine_hours}
                        unit="hrs"
                        isPrimary={vehicle.primary_metric === 'ENGINE_HOURS'}
                        icon={<Timer className="h-4 w-4" />}
                      />
                    )}
                    {vehicle.pto_hours !== undefined && vehicle.pto_hours > 0 && (
                      <MetricCard
                        label="PTO Hours"
                        value={vehicle.pto_hours}
                        unit="hrs"
                        isPrimary={vehicle.primary_metric === 'PTO_HOURS'}
                        icon={<Zap className="h-4 w-4" />}
                      />
                    )}
                    {vehicle.aux_hours !== undefined && vehicle.aux_hours > 0 && (
                      <MetricCard
                        label="Aux Hours"
                        value={vehicle.aux_hours}
                        unit="hrs"
                        isPrimary={vehicle.primary_metric === 'AUX_HOURS'}
                        icon={<Clock className="h-4 w-4" />}
                      />
                    )}
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
                    <p className="text-[10px] text-white/30 mt-2">
                      Last updated: {formatDateTime(vehicle.last_metric_update)}
                    </p>
                  )}
                </div>
              )}

              {/* Equipment Specifications (for HEAVY_EQUIPMENT) */}
              {vehicle.asset_category === 'HEAVY_EQUIPMENT' &&
                (vehicle.capacity_tons ||
                  vehicle.lift_height_feet ||
                  vehicle.max_reach_feet ||
                  vehicle.bucket_capacity_yards ||
                  vehicle.operating_weight_lbs) && (
                <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                  <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Equipment Specifications
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                    {vehicle.capacity_tons && (
                      <div>
                        <p className="text-[11px] text-white/40">Capacity</p>
                        <p className="text-sm text-white/80">
                          {formatNumber(vehicle.capacity_tons)} <span className="text-white/40">tons</span>
                        </p>
                      </div>
                    )}
                    {vehicle.lift_height_feet && (
                      <div>
                        <p className="text-[11px] text-white/40">Lift Height</p>
                        <p className="text-sm text-white/80">
                          {formatNumber(vehicle.lift_height_feet)} <span className="text-white/40">ft</span>
                        </p>
                      </div>
                    )}
                    {vehicle.max_reach_feet && (
                      <div>
                        <p className="text-[11px] text-white/40">Max Reach</p>
                        <p className="text-sm text-white/80">
                          {formatNumber(vehicle.max_reach_feet)} <span className="text-white/40">ft</span>
                        </p>
                      </div>
                    )}
                    {vehicle.bucket_capacity_yards && (
                      <div>
                        <p className="text-[11px] text-white/40">Bucket Capacity</p>
                        <p className="text-sm text-white/80">
                          {formatNumber(vehicle.bucket_capacity_yards)} <span className="text-white/40">yd3</span>
                        </p>
                      </div>
                    )}
                    {vehicle.operating_weight_lbs && (
                      <div>
                        <p className="text-[11px] text-white/40">Operating Weight</p>
                        <p className="text-sm text-white/80">
                          {formatNumber(vehicle.operating_weight_lbs)} <span className="text-white/40">lbs</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cost Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Wrench className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[11px] text-white/40 font-medium">Total Maintenance</span>
                  </div>
                  <div className="text-sm font-bold text-white">{formatCurrency(totalMaintenanceCost)}</div>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {maintenanceHistory?.length || 0} records
                  </p>
                </div>
                <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-white/40" />
                    <span className="text-[11px] text-white/40 font-medium">Total Incidents</span>
                  </div>
                  <div className="text-sm font-bold text-rose-400">{formatCurrency(totalIncidentCost)}</div>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {incidents?.length || 0} incidents
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* ============================================================= */}
            {/* Maintenance Tab                                                */}
            {/* ============================================================= */}
            <TabsContent value="maintenance" className="mt-2">
              {maintenanceLoading ? (
                <TableSkeleton />
              ) : maintenanceArr.length > 0 ? (
                <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[#242424] border-b border-white/[0.08]">
                        <tr>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Work Order</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Type</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Status</th>
                          <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Cost</th>
                          <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {maintenanceArr.map((record) => (
                          <tr
                            key={record.id}
                            className="cursor-pointer hover:bg-white/[0.03]"
                            onClick={() => handleViewWorkOrder(record.id, record.work_order_number)}
                          >
                            <td className="px-3 py-2">
                              <span className="font-medium text-white/80">WO #{record.work_order_number}</span>
                              {record.description && (
                                <p className="text-[11px] text-white/40 truncate max-w-[180px]">{record.description}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" size="sm">{formatEnum(record.type)}</Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={statusBadgeVariant(record.status)} size="sm">
                                {formatEnum(record.status)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-white/70 tabular-nums">
                              {formatCurrency(record.cost)}
                            </td>
                            <td className="px-3 py-2 text-right text-white/50 text-xs">
                              {formatDate(record.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Wrench} message="No maintenance records for this vehicle" />
              )}
            </TabsContent>

            {/* ============================================================= */}
            {/* Incidents Tab                                                  */}
            {/* ============================================================= */}
            <TabsContent value="incidents" className="mt-2">
              {incidentsLoading ? (
                <TableSkeleton />
              ) : incidentsArr.length > 0 ? (
                <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[#242424] border-b border-white/[0.08]">
                        <tr>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Incident</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Severity</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Type</th>
                          <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Cost</th>
                          <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {incidentsArr.map((incident) => (
                          <tr
                            key={incident.id}
                            className="cursor-pointer hover:bg-white/[0.03]"
                            onClick={() => handleViewIncident(incident.id, incident.incident_number)}
                          >
                            <td className="px-3 py-2">
                              <span className="font-medium text-white/80">#{incident.incident_number}</span>
                              {incident.description && (
                                <p className="text-[11px] text-white/40 truncate max-w-[180px]">{incident.description}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={severityBadgeVariant(incident.severity)} size="sm">
                                {formatEnum(incident.severity)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" size="sm">{formatEnum(incident.type)}</Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-rose-400 tabular-nums">
                              {incident.cost != null ? formatCurrency(incident.cost) : '\u2014'}
                            </td>
                            <td className="px-3 py-2 text-right text-white/50 text-xs">
                              {formatDate(incident.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState icon={AlertTriangle} message="No incidents recorded for this vehicle" />
              )}
            </TabsContent>

            {/* ============================================================= */}
            {/* Trips Tab                                                      */}
            {/* ============================================================= */}
            <TabsContent value="trips" className="space-y-2 mt-2">
              {tripsLoading ? (
                <TableSkeleton />
              ) : tripsArr.length > 0 ? (
                <>
                  {/* Summary strip */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
                      <p className="text-[11px] text-white/40">Total Trips</p>
                      <p className="text-sm font-bold text-white">{formatNumber(totalTrips)}</p>
                    </div>
                    <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
                      <p className="text-[11px] text-white/40">Total Distance</p>
                      <p className="text-sm font-bold text-white">{formatNumber(totalDistance, 1)} mi</p>
                    </div>
                  </div>

                  {/* Trips table */}
                  <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-[#242424] border-b border-white/[0.08]">
                          <tr>
                            <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Route</th>
                            <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Driver</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Distance</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Duration</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Start</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {tripsArr.map((trip) => (
                            <tr key={trip.id} className="hover:bg-white/[0.03]">
                              <td className="px-3 py-2">
                                {trip.start_location && trip.end_location ? (
                                  <span className="flex items-center gap-1 text-white/70">
                                    <MapPin className="h-3 w-3 text-white/30 shrink-0" />
                                    <span className="truncate max-w-[140px]">
                                      {trip.start_location} &rarr; {trip.end_location}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-white/40">{'\u2014'}</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-white/70">{trip.driver_name || '\u2014'}</td>
                              <td className="px-3 py-2 text-right text-white/70 tabular-nums">
                                {formatNumber(trip.distance, 1)} mi
                              </td>
                              <td className="px-3 py-2 text-right text-white/50 text-xs tabular-nums">
                                {trip.duration_minutes != null
                                  ? `${Math.floor(trip.duration_minutes / 60)}h ${trip.duration_minutes % 60}m`
                                  : '\u2014'}
                              </td>
                              <td className="px-3 py-2 text-right text-white/50 text-xs">
                                {formatDateTime(trip.start_time)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState icon={Route} message="No trips recorded for this vehicle" />
              )}
            </TabsContent>

            {/* ============================================================= */}
            {/* Inspections Tab                                                */}
            {/* ============================================================= */}
            <TabsContent value="inspections" className="mt-2">
              {inspectionsLoading ? (
                <TableSkeleton />
              ) : inspectionsArr.length > 0 ? (
                <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-[#242424] border-b border-white/[0.08]">
                        <tr>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Inspection</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Result</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Type</th>
                          <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Inspector</th>
                          <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {inspectionsArr.map((inspection) => (
                          <tr key={inspection.id} className="hover:bg-white/[0.03]">
                            <td className="px-3 py-2">
                              <span className="font-medium text-white/80">#{inspection.inspection_number}</span>
                              {inspection.notes && (
                                <p className="text-[11px] text-white/40 truncate max-w-[160px]">{inspection.notes}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant={inspectionResultVariant(inspection.result)} size="sm">
                                {formatEnum(inspection.result)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline" size="sm">{formatEnum(inspection.type)}</Badge>
                            </td>
                            <td className="px-3 py-2 text-white/60 text-xs">{inspection.inspector_name || '\u2014'}</td>
                            <td className="px-3 py-2 text-right text-white/50 text-xs">
                              {formatDate(inspection.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState icon={FileText} message="No inspections recorded for this vehicle" />
              )}
            </TabsContent>

            {/* ============================================================= */}
            {/* Fuel Tab                                                       */}
            {/* ============================================================= */}
            <TabsContent value="fuel" className="space-y-2 mt-2">
              {fuelLoading ? (
                <TableSkeleton />
              ) : fuelArr.length > 0 ? (
                <>
                  {/* Fuel summary strip */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
                      <p className="text-[11px] text-white/40">Total Fuel</p>
                      <p className="text-sm font-bold text-white">
                        {formatNumber(fuelArr.reduce((sum, r) => sum + r.gallons, 0), 1)} gal
                      </p>
                    </div>
                    <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-2.5">
                      <p className="text-[11px] text-white/40">Total Cost</p>
                      <p className="text-sm font-bold text-white">
                        {formatCurrency(fuelArr.reduce((sum, r) => sum + r.cost, 0))}
                      </p>
                    </div>
                  </div>

                  {/* Fuel table */}
                  <div className="rounded-lg border border-white/[0.08] overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-[#242424] border-b border-white/[0.08]">
                          <tr>
                            <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Gallons</th>
                            <th className="text-left text-[11px] text-white/50 font-medium px-3 py-2">Location</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Odometer</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Cost</th>
                            <th className="text-right text-[11px] text-white/50 font-medium px-3 py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {fuelArr.map((record) => (
                            <tr key={record.id} className="hover:bg-white/[0.03]">
                              <td className="px-3 py-2 text-white/80 tabular-nums">
                                {formatNumber(record.gallons, 2)} gal
                              </td>
                              <td className="px-3 py-2 text-white/60 text-xs truncate max-w-[140px]">
                                {record.location || '\u2014'}
                              </td>
                              <td className="px-3 py-2 text-right text-white/60 tabular-nums text-xs">
                                {record.odometer ? `${formatNumber(record.odometer)} mi` : '\u2014'}
                              </td>
                              <td className="px-3 py-2 text-right text-white/70 tabular-nums">
                                {formatCurrency(record.cost)}
                              </td>
                              <td className="px-3 py-2 text-right text-white/50 text-xs">
                                {formatDate(record.date)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState icon={Fuel} message="No fuel records for this vehicle" />
              )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button onClick={handleViewMaintenance} className="w-full" size="sm">
              <Wrench className="h-4 w-4 mr-1.5" />
              Full Maintenance History
            </Button>
            <Button onClick={handleViewTrips} variant="outline" className="w-full" size="sm">
              <Route className="h-4 w-4 mr-1.5" />
              All Trips
            </Button>
          </div>
        </div>
      )}
      <EditVehicleDialog
        vehicleId={vehicleId}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSaved={() => mutate()}
      />
    </DrilldownContent>
  )
}
