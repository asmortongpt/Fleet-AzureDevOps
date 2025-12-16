import { useMemo, useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" // DialogDescription available
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AddVehicleDialog } from "@/components/dialogs/AddVehicleDialog"
import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import {
  Car,
  BatteryMedium,
  MapPin,
  MagnifyingGlass,
  FunnelSimple,
  X,
  Broadcast,
  Circle,
  Layout,
  List,
  ChartBar,
  Wrench,
  BatteryLow,
  Warning
} from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { useSystemStatus } from "@/hooks/useSystemStatus"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useInspect } from "@/services/inspect/InspectContext"
import apiClient from "@/lib/api-client"

import logger from '@/utils/logger';
type LayoutMode = "split-50-50" | "split-70-30" | "tabs" | "top-bottom" | "map-drawer" | "quad-grid" | "fortune-glass" | "fortune-dark" | "fortune-nordic" | "fortune-ultimate"

interface FleetDashboardProps {
  data: ReturnType<typeof useFleetData>
}

interface AdvancedFilterCriteria {
  vehicleStatus: string[]
  departments: string[]
  regions: string[]
  fuelLevelRange: [number, number]
  mileageRange: { min: number | null; max: number | null }
  alertStatus: string[]
  driverAssigned: string
  vehicleTypes: string[]
  yearRange: { from: number | null; to: number | null }
  lastMaintenance: string
}

const defaultFilterCriteria: AdvancedFilterCriteria = {
  vehicleStatus: [],
  departments: [],
  regions: [],
  fuelLevelRange: [0, 100],
  mileageRange: { min: null, max: null },
  alertStatus: [],
  driverAssigned: "all",
  vehicleTypes: [],
  yearRange: { from: null, to: null },
  lastMaintenance: "all"
}

export function FleetDashboard({ data }: FleetDashboardProps) {
  const initialVehicles = data.vehicles || []

  // Drilldown navigation
  const { push: drilldownPush } = useDrilldown()
  const { openInspect } = useInspect()

  // Real-time telemetry
  const {
    isConnected: isRealtimeConnected,
    isEmulatorRunning,
    lastUpdate: lastTelemetryUpdate,
    vehicles: realtimeVehicles,
    vehicleMap,
    emulatorStats,
    recentEvents
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles,
    onVehicleUpdate: (vehicleId, update) => {
      logger.debug(`[FleetDashboard] Real-time update for ${vehicleId}`, update)
    }
  })

  const systemStatus = useSystemStatus({
    enabled: true,
    pollInterval: 5000
  })

  // Drilldown handlers
  const handleVehicleDrilldown = useCallback((vehicle: Vehicle) => {
    openInspect({ type: 'vehicle', id: vehicle.id })
    drilldownPush({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
      data: { vehicleId: vehicle.id, vehicle }
    })
  }, [drilldownPush, openInspect])

  const handleMetricDrilldown = useCallback((metricType: string, filter: any, label: string) => {
    const filteredList = metricType === 'total'
      ? filteredVehicles
      : metricType === 'lowFuel'
      ? filteredVehicles.filter(v => v.fuelLevel < 25)
      : metricType === 'alerts'
      ? filteredVehicles.filter(v => (v.alerts?.length || 0) > 0)
      : filteredVehicles.filter(v => v.status === filter.status)

    drilldownPush({
      id: `metric-${metricType}`,
      type: 'vehicle-list',
      label: label,
      data: { filter, count: filteredList.length, vehicles: filteredList }
    })

    openInspect({
      type: 'vehicle-list',
      id: `metric-${metricType}`,
      data: { filter, vehicles: filteredList }
    })
  }, [drilldownPush, openInspect, filteredVehicles])

  const handleStatusDrilldown = useCallback((e: React.MouseEvent, status: string) => {
    e.stopPropagation()
    const statusVehicles = filteredVehicles.filter(v => v.status === status)
    const count = statusVehicles.length

    drilldownPush({
      id: `status-${status}`,
      type: 'vehicle-list',
      label: `${status.charAt(0).toUpperCase() + status.slice(1)} Vehicles (${count})`,
      data: { filterStatus: status, count, vehicles: statusVehicles }
    })

    openInspect({
      type: 'vehicle-list',
      id: `status-${status}`,
      data: { filter: { status }, vehicles: statusVehicles }
    })
  }, [drilldownPush, openInspect, filteredVehicles])

  const handleFuelDrilldown = useCallback((e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation()

    drilldownPush({
      id: `fuel-${vehicle.id}`,
      type: 'fuel-history',
      label: `Fuel History - ${vehicle.number}`,
      data: { vehicleId: vehicle.id, vehicle, fuelLevel: vehicle.fuelLevel }
    })

    openInspect({
      type: 'fuel-history',
      id: vehicle.id,
      data: { vehicle, fuelLevel: vehicle.fuelLevel }
    })
  }, [drilldownPush, openInspect])

  const handleDriverDrilldown = useCallback((e: React.MouseEvent, driverName: string, vehicle: Vehicle) => {
    e.stopPropagation()

    const driverVehicles = filteredVehicles.filter(v => v.assignedDriver === driverName)

    drilldownPush({
      id: `driver-${driverName}`,
      type: 'driver',
      label: `Driver: ${driverName}`,
      data: { driverName, assignedVehicles: driverVehicles, currentVehicle: vehicle }
    })

    openInspect({
      type: 'driver',
      id: driverName,
      data: { driverName, assignedVehicles: driverVehicles, currentVehicle: vehicle }
    })
  }, [drilldownPush, openInspect, filteredVehicles])

  const handleEventDrilldown = useCallback((e: React.MouseEvent, event: any) => {
    e.stopPropagation()

    drilldownPush({
      id: `event-${event.vehicleId}-${event.timestamp}`,
      type: 'event',
      label: `Event: ${event.message}`,
      data: { event, vehicleId: event.vehicleId }
    })

    openInspect({
      type: 'event',
      id: `${event.vehicleId}-${event.timestamp}`,
      data: { event, vehicleId: event.vehicleId }
    })
  }, [drilldownPush, openInspect])

  const handleRealtimeDrilldown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    drilldownPush({
      id: 'realtime-stats',
      type: 'realtime',
      label: 'Real-time Connection Stats',
      data: {
        isConnected: isRealtimeConnected,
        isEmulatorRunning,
        lastUpdate: lastTelemetryUpdate,
        emulatorStats,
        vehicleCount: realtimeVehicles.length
      }
    })

    openInspect({
      type: 'realtime-stats',
      id: 'connection',
      data: {
        isConnected: isRealtimeConnected,
        isEmulatorRunning,
        lastUpdate: lastTelemetryUpdate,
        emulatorStats,
        vehicleCount: realtimeVehicles.length
      }
    })
  }, [drilldownPush, openInspect, isRealtimeConnected, isEmulatorRunning, lastTelemetryUpdate, emulatorStats, realtimeVehicles])

  const handleRegionDrilldown = useCallback((region: string, count: number) => {
    drilldownPush({
      id: `region-${region}`,
      type: 'vehicle-list',
      label: `${region} Region (${count} vehicles)`,
      data: { filterRegion: region, count }
    })
  }, [drilldownPush])

  // Merge initial vehicles with real-time updates
  const vehicles = useMemo(() => {
    if (realtimeVehicles.length > 0) {
      const initialMap = new Map(initialVehicles.map(v => [v.id, v]))
      const merged = new Map<string, Vehicle>()

      initialVehicles.forEach(v => merged.set(v.id, v))
      realtimeVehicles.forEach(v => {
        const existing = merged.get(v.id)
        if (existing) {
          merged.set(v.id, { ...existing, ...v })
        } else {
          merged.set(v.id, v)
        }
      })

      return Array.from(merged.values())
    }
    return initialVehicles
  }, [initialVehicles, realtimeVehicles])

  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split-50-50")
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Advanced filters state
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchesStatus = statusFilter === "all" || v.status === statusFilter
      const matchesSearch = !searchQuery || searchQuery === "" ||
        v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesAdvancedStatus = appliedFilters.vehicleStatus.length === 0 ||
        appliedFilters.vehicleStatus.includes(v.status)
      const matchesDepartment = appliedFilters.departments.length === 0 ||
        appliedFilters.departments.includes(v.department)
      const matchesAdvancedRegion = appliedFilters.regions.length === 0 ||
        appliedFilters.regions.includes(v.region)
      const matchesFuelLevel = v.fuelLevel >= appliedFilters.fuelLevelRange[0] &&
        v.fuelLevel <= appliedFilters.fuelLevelRange[1]
      const matchesMileage =
        (appliedFilters.mileageRange.min === null || v.mileage >= appliedFilters.mileageRange.min) &&
        (appliedFilters.mileageRange.max === null || v.mileage <= appliedFilters.mileageRange.max)
      const matchesAlertStatus = appliedFilters.alertStatus.length === 0 || (
        (appliedFilters.alertStatus.includes("has-alerts") && v.alerts && v.alerts.length > 0) ||
        (appliedFilters.alertStatus.includes("no-alerts") && (!v.alerts || v.alerts.length === 0)) ||
        (appliedFilters.alertStatus.includes("critical") && v.alerts && v.alerts.some(a => a.toLowerCase().includes("critical")))
      )
      const matchesDriverAssignment =
        appliedFilters.driverAssigned === "all" ||
        (appliedFilters.driverAssigned === "assigned" && v.assignedDriver) ||
        (appliedFilters.driverAssigned === "unassigned" && !v.assignedDriver)
      const matchesAdvancedVehicleType = appliedFilters.vehicleTypes.length === 0 ||
        appliedFilters.vehicleTypes.includes(v.type)
      const matchesYearRange =
        (appliedFilters.yearRange.from === null || v.year >= appliedFilters.yearRange.from) &&
        (appliedFilters.yearRange.to === null || v.year <= appliedFilters.yearRange.to)
      const matchesLastMaintenance = appliedFilters.lastMaintenance === "all" || (() => {
        const lastServiceDate = new Date(v.lastService)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (appliedFilters.lastMaintenance) {
          case "7days": return daysDiff <= 7
          case "30days": return daysDiff <= 30
          case "60days": return daysDiff <= 60
          case "90days": return daysDiff <= 90
          case "overdue": {
            const nextServiceDate = new Date(v.nextService)
            return nextServiceDate < now
          }
          default: return true
        }
      })()

      return matchesStatus && matchesSearch &&
        matchesAdvancedStatus && matchesDepartment && matchesAdvancedRegion &&
        matchesFuelLevel && matchesMileage && matchesAlertStatus &&
        matchesDriverAssignment && matchesAdvancedVehicleType &&
        matchesYearRange && matchesLastMaintenance
    })
  }, [vehicles, statusFilter, searchQuery, appliedFilters])

  const metrics = useMemo(() => {
    const total = filteredVehicles.length
    const active = filteredVehicles.filter(v => v.status === "active").length
    const idle = filteredVehicles.filter(v => v.status === "idle").length
    const charging = filteredVehicles.filter(v => v.status === "charging").length
    const service = filteredVehicles.filter(v => v.status === "service").length
    const emergency = filteredVehicles.filter(v => v.status === "emergency").length
    const lowFuel = filteredVehicles.filter(v => v.fuelLevel < 25).length
    const alerts = filteredVehicles.filter(v => (v.alerts?.length || 0) > 0).length
    const avgFuelLevel = total > 0
      ? Math.round(filteredVehicles.reduce((sum, v) => sum + v.fuelLevel, 0) / total)
      : 0

    return { total, active, idle, charging, service, emergency, lowFuel, alerts, avgFuelLevel }
  }, [filteredVehicles])

  const regions = Array.from(new Set(vehicles.map(v => v.region))) as string[]
  const types = Array.from(new Set(vehicles.map(v => v.type))) as string[]
  const departments = Array.from(new Set(vehicles.map(v => v.department))) as string[]

  const handleApplyFilters = () => {
    setAppliedFilters(filterCriteria)
    setIsAdvancedFiltersOpen(false)
  }

  const handleResetFilters = () => {
    setFilterCriteria(defaultFilterCriteria)
    setAppliedFilters(defaultFilterCriteria)
  }

  const removeFilter = (filterType: keyof AdvancedFilterCriteria, value?: string) => {
    const newFilters = { ...appliedFilters }

    if (filterType === "vehicleStatus" || filterType === "departments" ||
      filterType === "regions" || filterType === "vehicleTypes" || filterType === "alertStatus") {
      newFilters[filterType] = value
        ? newFilters[filterType].filter(v => v !== value)
        : []
    } else if (filterType === "fuelLevelRange") {
      newFilters.fuelLevelRange = [0, 100]
    } else if (filterType === "mileageRange") {
      newFilters.mileageRange = { min: null, max: null }
    } else if (filterType === "yearRange") {
      newFilters.yearRange = { from: null, to: null }
    } else if (filterType === "driverAssigned") {
      newFilters.driverAssigned = "all"
    } else if (filterType === "lastMaintenance") {
      newFilters.lastMaintenance = "all"
    }

    setAppliedFilters(newFilters)
    setFilterCriteria(newFilters)
  }

  const hasActiveFilters = useMemo(() => {
    return appliedFilters.vehicleStatus.length > 0 ||
      appliedFilters.departments.length > 0 ||
      appliedFilters.regions.length > 0 ||
      appliedFilters.fuelLevelRange[0] !== 0 ||
      appliedFilters.fuelLevelRange[1] !== 100 ||
      appliedFilters.mileageRange.min !== null ||
      appliedFilters.mileageRange.max !== null ||
      appliedFilters.alertStatus.length > 0 ||
      appliedFilters.driverAssigned !== "all" ||
      appliedFilters.vehicleTypes.length > 0 ||
      appliedFilters.yearRange.from !== null ||
      appliedFilters.yearRange.to !== null ||
      appliedFilters.lastMaintenance !== "all"
  }, [appliedFilters])

  const getStatusColor = (status: Vehicle["status"]) => {
    const colors = {
      active: "bg-success/10 text-success border-success/20",
      idle: "bg-muted text-muted-foreground border-border",
      charging: "bg-accent/10 text-accent border-accent/20",
      service: "bg-warning/10 text-warning border-warning/20",
      emergency: "bg-destructive/10 text-destructive border-destructive/20",
      offline: "bg-muted text-muted-foreground border-border"
    }
    return colors[status]
  }

  const getStatusVariant = (status: Vehicle["status"]) => {
    const variants: Record<Vehicle["status"], "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      idle: "secondary",
      charging: "default",
      service: "destructive",
      emergency: "destructive",
      offline: "secondary"
    }
    return variants[status] || "default"
  }

  // Reusable Map Component
  const MapPanel = ({ height = "100%" }: { height?: string }) => (
    <div className="border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Fleet Map
          {isRealtimeConnected && (
            <Badge variant="outline" className="text-[10px] h-5 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              Live
            </Badge>
          )}
        </h3>
        <span className="text-xs text-muted-foreground">{filteredVehicles.length} vehicles</span>
      </div>
      <div className="flex-1">
        <ProfessionalFleetMap
          vehicles={filteredVehicles}
          facilities={data.facilities}
          height={height}
          onVehicleSelect={(vehicleId) => {
            const vehicle = filteredVehicles.find(v => v.id === vehicleId)
            if (vehicle) handleVehicleDrilldown(vehicle)
          }}
          showLegend={true}
          enableRealTime={isRealtimeConnected}
        />
      </div>
    </div>
  )

  // Reusable Table Component
  const VehicleTable = () => (
    <div className="border rounded-lg overflow-hidden flex flex-col h-full">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Car className="w-4 h-4 text-primary" />
          Fleet Vehicles
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-xs w-[150px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[100px] h-7 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-muted/30 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">ID</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Vehicle</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Driver</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Fuel</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredVehicles.map(vehicle => {
              const wasRecentlyUpdated = vehicle.lastUpdated &&
                (new Date().getTime() - new Date(vehicle.lastUpdated).getTime()) < 5000

              return (
                <tr
                  key={vehicle.id}
                  className={`hover:bg-muted/30 cursor-pointer ${
                    wasRecentlyUpdated ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() =>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a> handleVehicleDrilldown(vehicle)}
                >
                  <td className="px-3 py-2 text-sm font-medium">
                    <div className="flex items-center gap-1">
                      {vehicle.number}
                      {wasRecentlyUpdated && (
                        <Circle className="w-1.5 h-1.5 fill-blue-500 animate-pulse" weight="fill" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                      <p className="text-[10px] text-muted-foreground">{vehicle.year} • {vehicle.type}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <Badge
                      variant={getStatusVariant(vehicle.status)}
                      className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                      title={`Click to view all ${vehicle.status} vehicles`}
                    >
                      {vehicle.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    {vehicle.assignedDriver ? (
                      <span
                        className="cursor-pointer hover:underline text-blue-600 dark:text-blue-400"
                        onClick={(e) => handleDriverDrilldown(e, vehicle.assignedDriver, vehicle)}
                        title={`Click to view driver details: ${vehicle.assignedDriver}`}
                      >
                        {vehicle.assignedDriver}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex items-center gap-1">
                      <BatteryMedium className="w-3 h-3 text-muted-foreground" />
                      <span
                        className={`${vehicle.fuelLevel < 25 ? 'text-warning font-medium' : ''} cursor-pointer hover:underline`}
                        onClick={(e) => handleFuelDrilldown(e, vehicle)}
                        title="Click to view fuel history"
                      >
                        {vehicle.fuelLevel}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-muted-foreground truncate max-w-[150px]">
                    {vehicle.location?.address || 'Unknown'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  // Status Chart Component for Quad Grid
  const StatusChart = () => {
    const statusData = [
      { status: 'Active', count: metrics.active, color: 'bg-green-500' },
      { status: 'Idle', count: metrics.idle, color: 'bg-gray-400' },
      { status: 'Service', count: metrics.service, color: 'bg-orange-500' },
      { status: 'Emergency', count: metrics.emergency, color: 'bg-red-500' }
    ]

    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ChartBar className="w-4 h-4" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {statusData.map(item => (
            <div key={item.status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${item.color}`} />
              <span className="text-xs flex-1">{item.status}</span>
              <span className="text-xs font-semibold">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Alerts Component for Quad Grid
  const RecentAlerts = () => {
    const vehiclesWithAlerts = filteredVehicles
      .filter(v => v.alerts && v.alerts.length > 0)
      .slice(0, 5)

    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {vehiclesWithAlerts.length > 0 ? (
            vehiclesWithAlerts.map(vehicle => (
              <div key={vehicle.id} className="text-xs text-muted-foreground">
                • {vehicle.alerts![0]} - {vehicle.number}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground">No active alerts</div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Reusable Metric Card Component
  interface MetricCardProps {
    label: string
    value: number
    icon: React.ComponentType<any>
    color?: 'gray' | 'green' | 'orange' | 'red' | 'amber'
    onClick?: () => void
    title?: string
  }

  const MetricCard = ({ label, value, icon: Icon, color = 'gray', onClick, title }: MetricCardProps) => {
    const colorClasses = {
      gray: 'text-gray-600',
      green: 'text-green-600',
      orange: 'text-orange-600',
      red: 'text-red-600',
      amber: 'text-amber-600'
    }

    return (
      <div
        className={`flex-1 bg-white border border-gray-200 rounded-lg p-2 shadow-sm transition-all ${
          onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300 hover:scale-[1.02]' : ''
        }`}
        onClick={onClick}
        title={title}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className={`w-5 h-5 ${colorClasses[color]}`} weight="duotone" />
        </div>
      </div>
    )
  }

  // Live Badge Component
  const LiveBadge = () => (
    isRealtimeConnected ? (
      <Badge variant="outline" className="text-[10px] h-5 bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
        <Circle className="w-1.5 h-1.5 fill-green-500 animate-pulse mr-1" weight="fill" />
        Live
      </Badge>
    ) : null
  )

  // Compact Vehicle Table Component
  interface CompactVehicleTableProps {
    vehicles: Vehicle[]
    columns: string[]
    maxRows: number
  }

  const CompactVehicleTable = ({ vehicles, columns, maxRows }: CompactVehicleTableProps) => (
    <table className="w-full text-xs">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          {columns.includes('id') && <th className="px-2 py-1.5 text-left font-semibold text-gray-700 uppercase">ID</th>}
          {columns.includes('vehicle') && <th className="px-2 py-1.5 text-left font-semibold text-gray-700 uppercase">Vehicle</th>}
          {columns.includes('status') && <th className="px-2 py-1.5 text-left font-semibold text-gray-700 uppercase">Status</th>}
          {columns.includes('fuel') && <th className="px-2 py-1.5 text-left font-semibold text-gray-700 uppercase">Fuel</th>}
        </tr>
      </thead>
      <tbody>
        {vehicles.slice(0, maxRows).map((vehicle, index) => {
          const wasRecentlyUpdated = vehicle.lastUpdated &&
            (new Date().getTime() - new Date(vehicle.lastUpdated).getTime()) < 5000

          return (
            <tr
              key={vehicle.id}
              className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
              } ${wasRecentlyUpdated ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
              onClick={() => handleVehicleDrilldown(vehicle)}
            >
              {columns.includes('id') && (
                <td className="px-2 py-1.5 font-medium text-gray-900">
                  <div className="flex items-center gap-1">
                    {vehicle.number}
                    {wasRecentlyUpdated && (
                      <Circle className="w-1.5 h-1.5 fill-blue-500 animate-pulse" weight="fill" />
                    )}
                  </div>
                </td>
              )}
              {columns.includes('vehicle') && (
                <td className="px-2 py-1.5">
                  <div className="text-gray-900 font-medium">{vehicle.make} {vehicle.model}</div>
                  <div className="text-[10px] text-gray-500">{vehicle.year}</div>
                </td>
              )}
              {columns.includes('status') && (
                <td className="px-2 py-1.5">
                  <Badge
                    variant={getStatusVariant(vehicle.status)}
                    className="text-[10px] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                    title={`Click to view all ${vehicle.status} vehicles`}
                  >
                    {vehicle.status}
                  </Badge>
                </td>
              )}
              {columns.includes('fuel') && (
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1">
                    <BatteryMedium className="w-3 h-3 text-gray-400" />
                    <span
                      className={`${vehicle.fuelLevel < 25 ? 'text-red-600 font-semibold' : 'text-gray-700'} cursor-pointer hover:underline`}
                      onClick={(e) => handleFuelDrilldown(e, vehicle)}
                      title="Click to view fuel history"
                    >
                      {vehicle.fuelLevel}%
                    </span>
                  </div>
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  // Render different layouts
  const renderLayout = () => {
    switch (layoutMode) {
      case "split-50-50":
        return (
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            <MapPanel height="100%" />
            <VehicleTable />
          </div>
        )

      case "split-70-30":
        return (
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            {/* Compact Metrics Row */}
            <div className="flex gap-2">
              <MetricCard
                label="Total"
                value={metrics.total}
                icon={Car}
                onClick={() => handleMetricDrilldown('total', { status: 'all' }, `All Vehicles (${metrics.total})`)}
                title="Click to view all vehicles"
              />
              <MetricCard
                label="Active"
                value={metrics.active}
                icon={Circle}
                color="green"
                onClick={() => handleMetricDrilldown('active', { status: 'active' }, `Active Vehicles (${metrics.active})`)}
                title="Click to view active vehicles"
              />
              <MetricCard
                label="Service"
                value={metrics.service}
                icon={Wrench}
                color="orange"
                onClick={() => handleMetricDrilldown('service', { status: 'service' }, `Service Vehicles (${metrics.service})`)}
                title="Click to view vehicles in service"
              />
              <MetricCard
                label="Low Fuel"
                value={metrics.lowFuel}
                icon={BatteryLow}
                color="red"
                onClick={() => handleMetricDrilldown('lowFuel', { fuelLevel: '<25' }, `Low Fuel Vehicles (${metrics.lowFuel})`)}
                title="Click to view vehicles with low fuel"
              />
              <MetricCard
                label="Alerts"
                value={metrics.alerts}
                icon={Warning}
                color="amber"
                onClick={() => handleMetricDrilldown('alerts', { hasAlerts: true }, `Vehicles with Alerts (${metrics.alerts})`)}
                title="Click to view vehicles with alerts"
              />
            </div>

            {/* 70/30 Split: Map + Table */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[70%_30%] gap-3">
              {/* Left: Map (70%) */}
              <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-white px-3 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">Fleet Map</h3>
                    <LiveBadge />
                  </div>
                  <span className="text-xs text-muted-foreground">{filteredVehicles.length} vehicles</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ProfessionalFleetMap
                    vehicles={filteredVehicles}
                    facilities={data.facilities}
                    height="100%"
                    onVehicleSelect={(vehicleId) => {
                      const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                      if (vehicle) handleVehicleDrilldown(vehicle)
                    }}
                    showLegend={true}
                    enableRealTime={isRealtimeConnected}
                  />
                </div>
              </div>

              {/* Right: Condensed Table (30%) */}
              <div className="border rounded-lg overflow-hidden flex flex-col">
                <div className="bg-white px-3 py-2 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-semibold">Vehicles</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{filteredVehicles.length}</span>
                  </div>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 h-7 text-xs"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <CompactVehicleTable
                    vehicles={filteredVehicles}
                    columns={['id', 'vehicle', 'status', 'fuel']}
                    maxRows={20}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case "tabs":
        return (
          <Tabs defaultValue="map" className="flex-1 flex flex-col min-h-0">
            <TabsList className="w-fit">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
            </TabsList>
            <TabsContent value="map" className="flex-1 min-h-0 mt-3">
              <MapPanel height="100%" />
            </TabsContent>
            <TabsContent value="table" className="flex-1 min-h-0 mt-3">
              <VehicleTable />
            </TabsContent>
          </Tabs>
        )

      case "top-bottom":
        return (
          <div className="grid grid-rows-[40%_60%] gap-4 flex-1 min-h-0">
            <MapPanel height="100%" />
            <VehicleTable />
          </div>
        )

      case "map-drawer":
        return (
          <div className="flex-1 min-h-0 relative">
            <MapPanel height="100%" />
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  className="absolute top-4 right-4 shadow-lg"
                  size="sm"
                  variant="secondary"
                >
                  <List className="w-4 h-4 mr-2" />
                  Vehicle List
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[600px] sm:w-[600px]">
                <SheetHeader>
                  <SheetTitle>Fleet Vehicles</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-[calc(100vh-100px)]">
                  <VehicleTable />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )

      case "quad-grid":
        return (
          <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
            <MapPanel height="100%" />
            <StatusChart />
            <VehicleTable />
            <RecentAlerts />
          </div>
        )

      case "fortune-glass":
        return <FortuneGlassLayout />

      case "fortune-dark":
        return <FortuneDarkLayout />

      case "fortune-nordic":
        return <FortuneNordicLayout />

      case "fortune-ultimate":
        return <FortuneUltimateLayout />

      default:
        return null
    }
  }

  // Fortune 50 Design 1: Minimalist Glass-morphism
  const FortuneGlassLayout = () => (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Compact Metrics Row */}
      <div className="flex flex-wrap gap-1.5">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('total', { status: 'all' }, `All Vehicles (${metrics.total})`)}
          title="Click to view all vehicles"
        >
          <Car className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-medium text-slate-700">Total</span>
          <span className="text-sm font-bold text-slate-900">{metrics.total}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('active', { status: 'active' }, `Active Vehicles (${metrics.active})`)}
          title="Click to view active vehicles"
        >
          <Circle className="w-2 h-2 fill-green-500" weight="fill" />
          <span className="text-xs font-medium text-slate-700">Active</span>
          <span className="text-sm font-bold text-green-600">{metrics.active}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('service', { status: 'service' }, `Service Vehicles (${metrics.service})`)}
          title="Click to view vehicles in service"
        >
          <Circle className="w-2 h-2 fill-orange-500" weight="fill" />
          <span className="text-xs font-medium text-slate-700">Service</span>
          <span className="text-sm font-bold text-orange-600">{metrics.service}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('lowFuel', { fuelLevel: '<25' }, `Low Fuel Vehicles (${metrics.lowFuel})`)}
          title="Click to view vehicles with low fuel"
        >
          <BatteryMedium className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-medium text-slate-700">Low Fuel</span>
          <span className="text-sm font-bold text-red-600">{metrics.lowFuel}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('alerts', { hasAlerts: true }, `Vehicles with Alerts (${metrics.alerts})`)}
          title="Click to view vehicles with alerts"
        >
          <Broadcast className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-medium text-slate-700">Alerts</span>
          <span className="text-sm font-bold text-indigo-600">{metrics.alerts}</span>
        </div>
      </div>

      {/* Main Content: 60% Map / 40% Table */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[60%_40%] gap-3">
        {/* Map Panel */}
        <div className="rounded-xl overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg flex flex-col">
          <div className="px-3 py-2 border-b border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700">Fleet Map</span>
              {isRealtimeConnected && (
                <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">Live</span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">{filteredVehicles.length} vehicles</span>
          </div>
          <div className="flex-1 min-h-0">
            <ProfessionalFleetMap
              vehicles={filteredVehicles}
              facilities={data.facilities}
              height="100%"
              onVehicleSelect={(vehicleId) => {
                const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                if (vehicle) handleVehicleDrilldown(vehicle)
              }}
              showLegend={true}
              enableRealTime={isRealtimeConnected}
            />
          </div>
        </div>

        {/* Compact Vehicle Table */}
        <div className="rounded-xl overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-lg flex flex-col">
          <div className="px-3 py-2 border-b border-slate-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-slate-700">Vehicles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <MagnifyingGlass className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-5 h-5 text-[10px] w-[100px] border-slate-200/50 bg-white/50"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50/80 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Vehicle</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Fuel</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVehicles.slice(0, 20).map(vehicle => (
                  <tr
                    key={vehicle.id}
                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                    onClick={() => handleVehicleDrilldown(vehicle)}
                  >
                    <td className="px-2 py-1.5 font-medium text-slate-900">{vehicle.number}</td>
                    <td className="px-2 py-1.5">
                      <div className="text-slate-900 font-medium">{vehicle.make}</div>
                      <div className="text-[9px] text-slate-500">{vehicle.model}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          vehicle.status === 'active' ? 'bg-green-100 text-green-700' :
                          vehicle.status === 'service' ? 'bg-orange-100 text-orange-700' :
                          'bg-slate-100 text-slate-700'
                        }`}
                        onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                        title={`Click to view all ${vehicle.status} vehicles`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <span
                        className={`${vehicle.fuelLevel < 25 ? 'text-red-600 font-semibold' : 'text-slate-700'} cursor-pointer hover:underline`}
                        onClick={(e) => handleFuelDrilldown(e, vehicle)}
                        title="Click to view fuel history"
                      >
                        {vehicle.fuelLevel}%
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 px-1.5 text-[9px]"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVehicleDrilldown(vehicle)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  // Fortune 50 Design 2: Dark Mode Enterprise
  const FortuneDarkLayout = () => (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      {/* Compact Metrics Strip */}
      <div className="flex flex-wrap gap-1.5">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('total', { status: 'all' }, `All Vehicles (${metrics.total})`)}
          title="Click to view all vehicles"
        >
          <Car className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-slate-300">Total</span>
          <span className="text-sm font-bold text-cyan-400">{metrics.total}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('active', { status: 'active' }, `Active Vehicles (${metrics.active})`)}
          title="Click to view active vehicles"
        >
          <Circle className="w-2 h-2 fill-green-400" weight="fill" />
          <span className="text-xs font-medium text-slate-300">Active</span>
          <span className="text-sm font-bold text-green-400">{metrics.active}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('service', { status: 'service' }, `Service Vehicles (${metrics.service})`)}
          title="Click to view vehicles in service"
        >
          <Circle className="w-2 h-2 fill-orange-400" weight="fill" />
          <span className="text-xs font-medium text-slate-300">Service</span>
          <span className="text-sm font-bold text-orange-400">{metrics.service}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('lowFuel', { fuelLevel: '<25' }, `Low Fuel Vehicles (${metrics.lowFuel})`)}
          title="Click to view vehicles with low fuel"
        >
          <BatteryMedium className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-slate-300">Low Fuel</span>
          <span className="text-sm font-bold text-red-400">{metrics.lowFuel}</span>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.15)] cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('alerts', { hasAlerts: true }, `Vehicles with Alerts (${metrics.alerts})`)}
          title="Click to view vehicles with alerts"
        >
          <Broadcast className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-slate-300">Alerts</span>
          <span className="text-sm font-bold text-cyan-400">{metrics.alerts}</span>
        </div>
      </div>

      {/* Main Content: 55% Map / 45% Tabbed Panel */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-2">
        {/* Map Panel */}
        <div className="rounded-lg overflow-hidden bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] flex flex-col">
          <div className="px-3 py-2 border-b border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-100">Fleet Map</span>
              {isRealtimeConnected && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-400 text-[10px] font-medium">Live</span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">{filteredVehicles.length} vehicles</span>
          </div>
          <div className="flex-1 min-h-0">
            <ProfessionalFleetMap
              vehicles={filteredVehicles}
              facilities={data.facilities}
              height="100%"
              onVehicleSelect={(vehicleId) => {
                const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                if (vehicle) handleVehicleDrilldown(vehicle)
              }}
              showLegend={true}
              enableRealTime={isRealtimeConnected}
            />
          </div>
        </div>

        {/* Tabbed Data Panel */}
        <div className="rounded-lg overflow-hidden bg-[#0a0e27] border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)] flex flex-col">
          <Tabs defaultValue="vehicles" className="flex flex-col h-full">
            <div className="px-3 py-2 border-b border-cyan-500/20">
              <TabsList className="bg-transparent h-7 p-0 gap-1">
                <TabsTrigger
                  value="vehicles"
                  className="text-[10px] h-6 px-3 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-slate-400"
                >
                  Vehicles
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="text-[10px] h-6 px-3 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-slate-400"
                >
                  Alerts
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="text-[10px] h-6 px-3 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-slate-400"
                >
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="vehicles" className="flex-1 min-h-0 overflow-y-auto m-0 p-0">
              <table className="w-full text-[10px]">
                <thead className="bg-[#0f1535] sticky top-0">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold text-cyan-400">ID</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-cyan-400">Vehicle</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-cyan-400">Status</th>
                    <th className="px-2 py-1.5 text-left font-semibold text-cyan-400">Fuel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {filteredVehicles.slice(0, 20).map(vehicle => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-cyan-400/10 cursor-pointer transition-colors"
                      onClick={() => handleVehicleDrilldown(vehicle)}
                    >
                      <td className="px-2 py-1.5 font-medium text-slate-100">{vehicle.number}</td>
                      <td className="px-2 py-1.5">
                        <div className="text-slate-100 font-medium">{vehicle.make}</div>
                        <div className="text-[9px] text-slate-400">{vehicle.model}</div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                            vehicle.status === 'active' ? 'bg-green-400/20 text-green-400 border border-green-400/30' :
                            vehicle.status === 'service' ? 'bg-orange-400/20 text-orange-400 border border-orange-400/30' :
                            'bg-slate-400/20 text-slate-400 border border-slate-400/30'
                          }`}
                          onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                          title={`Click to view all ${vehicle.status} vehicles`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span
                          className={`${vehicle.fuelLevel < 25 ? 'text-red-400 font-semibold' : 'text-slate-300'} cursor-pointer hover:underline`}
                          onClick={(e) => handleFuelDrilldown(e, vehicle)}
                          title="Click to view fuel history"
                        >
                          {vehicle.fuelLevel}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>

            <TabsContent value="alerts" className="flex-1 min-h-0 overflow-y-auto m-0 p-3">
              <div className="space-y-2">
                {filteredVehicles.filter(v => v.alerts && v.alerts.length > 0).slice(0, 10).map(vehicle => (
                  <div
                    key={vehicle.id}
                    className="p-2 rounded border border-cyan-500/20 bg-cyan-400/5 hover:bg-cyan-400/10 cursor-pointer transition-colors"
                    onClick={() => handleVehicleDrilldown(vehicle)}
                  >
                    <div className="text-[10px] font-semibold text-cyan-400">{vehicle.number}</div>
                    <div className="text-[9px] text-slate-300 mt-0.5">{vehicle.alerts![0]}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 min-h-0 overflow-y-auto m-0 p-3">
              <div className="space-y-3">
                <div className="p-2 rounded border border-cyan-500/20 bg-cyan-400/5">
                  <div className="text-[9px] text-slate-400 mb-1">Fleet Utilization</div>
                  <div className="text-lg font-bold text-cyan-400">{Math.round((metrics.active / metrics.total) * 100)}%</div>
                </div>
                <div className="p-2 rounded border border-cyan-500/20 bg-cyan-400/5">
                  <div className="text-[9px] text-slate-400 mb-1">Avg Fuel Level</div>
                  <div className="text-lg font-bold text-cyan-400">{metrics.avgFuelLevel}%</div>
                </div>
                <div className="p-2 rounded border border-cyan-500/20 bg-cyan-400/5">
                  <div className="text-[9px] text-slate-400 mb-1">Vehicles in Service</div>
                  <div className="text-lg font-bold text-orange-400">{metrics.service}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )

  // Fortune 50 Design 3: Scandinavian Clean
  const FortuneNordicLayout = () => (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Horizontal Metrics Ribbon */}
      <div className="flex flex-wrap gap-2">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('total', { status: 'all' }, `All Vehicles (${metrics.total})`)}
          title="Click to view all vehicles"
        >
          <Car className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[9px] text-gray-500 font-medium">Total Fleet</div>
            <div className="text-sm font-bold text-gray-800">{metrics.total}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('active', { status: 'active' }, `Active Vehicles (${metrics.active})`)}
          title="Click to view active vehicles"
        >
          <Circle className="w-3 h-3 fill-emerald-500" weight="fill" />
          <div>
            <div className="text-[9px] text-gray-500 font-medium">Active</div>
            <div className="text-sm font-bold text-emerald-600">{metrics.active}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('service', { status: 'service' }, `Service Vehicles (${metrics.service})`)}
          title="Click to view vehicles in service"
        >
          <Circle className="w-3 h-3 fill-sky-500" weight="fill" />
          <div>
            <div className="text-[9px] text-gray-500 font-medium">Service</div>
            <div className="text-sm font-bold text-sky-600">{metrics.service}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('lowFuel', { fuelLevel: '<25' }, `Low Fuel Vehicles (${metrics.lowFuel})`)}
          title="Click to view vehicles with low fuel"
        >
          <BatteryMedium className="w-4 h-4 text-sky-500" />
          <div>
            <div className="text-[9px] text-gray-500 font-medium">Low Fuel</div>
            <div className="text-sm font-bold text-red-600">{metrics.lowFuel}</div>
          </div>
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
          onClick={() => handleMetricDrilldown('alerts', { hasAlerts: true }, `Vehicles with Alerts (${metrics.alerts})`)}
          title="Click to view vehicles with alerts"
        >
          <Broadcast className="w-4 h-4 text-emerald-500" />
          <div>
            <div className="text-[9px] text-gray-500 font-medium">Alerts</div>
            <div className="text-sm font-bold text-gray-800">{metrics.alerts}</div>
          </div>
        </div>
      </div>

      {/* Main Content: 50/50 Split */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Map Panel */}
        <div className="rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-semibold text-gray-800">Fleet Map</span>
              {isRealtimeConnected && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-medium">Live</span>
              )}
            </div>
            <span className="text-xs text-gray-500">{filteredVehicles.length} vehicles</span>
          </div>
          <div className="flex-1 min-h-0">
            <ProfessionalFleetMap
              vehicles={filteredVehicles}
              facilities={data.facilities}
              height="100%"
              onVehicleSelect={(vehicleId) => {
                const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                if (vehicle) handleVehicleDrilldown(vehicle)
              }}
              showLegend={true}
              enableRealTime={isRealtimeConnected}
            />
          </div>
        </div>

        {/* Vehicle Table with Alternating Rows */}
        <div className="rounded-lg overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-semibold text-gray-800">Vehicles</span>
            </div>
            <div className="relative">
              <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-6 h-6 text-xs w-[120px] border-gray-200"
              />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Vehicle</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Fuel</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.slice(0, 20).map((vehicle, index) => (
                  <tr
                    key={vehicle.id}
                    className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => handleVehicleDrilldown(vehicle)}
                  >
                    <td className="px-3 py-2 font-medium text-gray-900">{vehicle.number}</td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900 font-medium">{vehicle.make}</div>
                      <div className="text-[10px] text-gray-500">{vehicle.model}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          vehicle.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          vehicle.status === 'service' ? 'bg-sky-100 text-sky-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                        onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                        title={`Click to view all ${vehicle.status} vehicles`}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`${vehicle.fuelLevel < 25 ? 'text-red-600 font-semibold' : 'text-gray-700'} cursor-pointer hover:underline`}
                        onClick={(e) => handleFuelDrilldown(e, vehicle)}
                        title="Click to view fuel history"
                      >
                        {vehicle.fuelLevel}%
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVehicleDrilldown(vehicle)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  // Fortune 50 Design 4: Command Center Pro - Ultimate Bloomberg Terminal Style
  const FortuneUltimateLayout = () => {
    // Compact Metric Card for ultra-dense display
    const MetricCardCompact = ({ icon: Icon, value, label, color = 'gray' }: { icon: any, value: string | number, label: string, color?: 'gray' | 'green' | 'orange' | 'red' | 'amber' | 'blue' }) => {
      const colors = {
        gray: 'text-gray-700 dark:text-gray-300',
        green: 'text-green-600 dark:text-green-400',
        orange: 'text-orange-600 dark:text-orange-400',
        red: 'text-red-600 dark:text-red-400',
        amber: 'text-amber-600 dark:text-amber-400',
        blue: 'text-blue-600 dark:text-blue-400'
      }

      return (
        <div className="flex items-center gap-2 px-2">
          <Icon className={`w-4 h-4 ${colors[color]}`} weight="duotone" />
          <div>
            <div className="text-lg font-bold leading-none dark:text-white">{value}</div>
            <div className="text-[9px] uppercase text-gray-500 dark:text-gray-400 leading-none mt-0.5">{label}</div>
          </div>
        </div>
      )
    }

    // Live Badge Component
    const LiveBadgeCompact = ({ showText = false }: { showText?: boolean }) => (
      <div
        className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-md cursor-pointer hover:bg-green-500/30 transition-colors"
        onClick={handleRealtimeDrilldown}
        title="Click to view real-time connection details"
      >
        <Circle className="w-2 h-2 fill-green-500 animate-pulse" weight="fill" />
        {showText && <span className="text-[10px] font-semibold text-green-700 dark:text-green-300">LIVE</span>}
      </div>
    )

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-950">
        {/* Header Bar - 40px */}
        <div className="h-10 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 flex items-center justify-between shadow-lg">
          <h1 className="text-sm font-semibold tracking-wide">Fleet Command Center</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <MagnifyingGlass className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search vehicles..."
                className="pl-7 pr-3 py-1 text-xs rounded bg-slate-800 border border-slate-700 focus:border-blue-500 w-[200px] h-7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" className="h-7 text-xs">
              <FunnelSimple className="w-3 h-3 mr-1" />
              Filters
            </Button>
            <LiveBadgeCompact />
          </div>
        </div>

        {/* Metrics Bar - 50px */}
        <div className="h-[50px] bg-gray-50 dark:bg-gray-900 border-b px-4 flex items-center gap-4 overflow-x-auto">
          <MetricCardCompact icon={Car} value={metrics.total} label="Total Fleet" />
          <MetricCardCompact icon={Circle} value={metrics.active} label="Active Now" color="green" />
          <MetricCardCompact icon={Wrench} value={metrics.service} label="In Service" color="orange" />
          <MetricCardCompact icon={Warning} value={metrics.emergency} label="Emergency" color="red" />
          <MetricCardCompact icon={BatteryLow} value={metrics.lowFuel} label="Low Fuel" color="amber" />
          <MetricCardCompact icon={BatteryMedium} value={metrics.avgFuelLevel + "%"} label="Avg Fuel" color="blue" />
          <div className="flex-1" /> {/* Spacer */}
          <AddVehicleDialog onAdd={data.addVehicle} />
        </div>

        {/* Main Content - flex-1 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[70%_30%] min-h-0">
          {/* Map Panel */}
          <div className="relative border-r dark:border-gray-800">
            <ProfessionalFleetMap
              vehicles={filteredVehicles}
              facilities={data.facilities}
              height="100%"
              onVehicleSelect={(vehicleId) => {
                const vehicle = filteredVehicles.find(v => v.id === vehicleId)
                if (vehicle) handleVehicleDrilldown(vehicle)
              }}
              showLegend={false}
              enableRealTime={isRealtimeConnected}
            />
            <div className="absolute top-3 right-3">
              <LiveBadgeCompact showText />
            </div>
          </div>

          {/* Table Panel */}
          <div className="flex flex-col bg-white dark:bg-gray-950">
            {/* Table Header - Sticky */}
            <div className="bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-800 px-3 py-2 flex items-center justify-between sticky top-0 z-10">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {filteredVehicles.length} Vehicles
              </span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-6 text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr className="border-b dark:border-gray-800">
                    <th className="px-3 py-2 text-left font-medium text-[10px] uppercase text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-3 py-2 text-left font-medium text-[10px] uppercase text-gray-500 dark:text-gray-400">Vehicle</th>
                    <th className="px-3 py-2 text-left font-medium text-[10px] uppercase text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-3 py-2 text-right font-medium text-[10px] uppercase text-gray-500 dark:text-gray-400">Fuel</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.slice(0, 20).map((vehicle, idx) => {
                    const wasRecentlyUpdated = vehicle.lastUpdated &&
                      (new Date().getTime() - new Date(vehicle.lastUpdated).getTime()) < 5000

                    return (
                      <tr
                        key={vehicle.id}
                        className={`h-9 border-b dark:border-gray-800 cursor-pointer transition-colors ${
                          idx % 2 === 0 ? 'bg-white dark:bg-gray-950' : 'bg-gray-50 dark:bg-gray-900'
                        } hover:bg-blue-50 dark:hover:bg-blue-950 ${
                          wasRecentlyUpdated ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                        }`}
                        onClick={() => handleVehicleDrilldown(vehicle)}
                      >
                        <td className="px-3 py-2 font-mono font-medium dark:text-white">
                          <div className="flex items-center gap-1">
                            {vehicle.number}
                            {wasRecentlyUpdated && (
                              <Circle className="w-1.5 h-1.5 fill-blue-500 animate-pulse" weight="fill" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="truncate dark:text-white">
                            {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{vehicle.year}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={getStatusVariant(vehicle.status)}
                            className="text-[9px] h-4 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => handleStatusDrilldown(e, vehicle.status)}
                            title={`Click to view all ${vehicle.status} vehicles`}
                          >
                            {vehicle.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          <span
                            className={`${vehicle.fuelLevel < 25 ? 'text-red-600 dark:text-red-400' : 'dark:text-white'} cursor-pointer hover:underline`}
                            onClick={(e) => handleFuelDrilldown(e, vehicle)}
                            title="Click to view fuel history"
                          >
                            {vehicle.fuelLevel}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Activity Feed - 35px */}
        <div className="h-[35px] bg-blue-50 dark:bg-blue-950 border-t dark:border-gray-800 px-4 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold text-blue-900 dark:text-blue-100 whitespace-nowrap flex items-center gap-1">
            <Broadcast className="w-3 h-3" weight="fill" />
            LIVE ACTIVITY:
          </span>
          <div className="flex items-center gap-2">
            {(recentEvents || []).slice(0, 5).map((event, i) => (
              <div
                key={i}
                className="px-2 py-0.5 bg-white dark:bg-blue-900 rounded-full text-[10px] whitespace-nowrap shadow-sm dark:text-blue-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={(e) => handleEventDrilldown(e, event)}
                title="Click to view event details"
              >
                {event?.message || event?.type || 'Event'}
              </div>
            ))}
            {(!recentEvents || recentEvents.length === 0) && (
              <div className="px-2 py-0.5 bg-white dark:bg-blue-900 rounded-full text-[10px] whitespace-nowrap shadow-sm dark:text-blue-100">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-3 p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Fleet Dashboard</h1>
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-1.5">
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer transition-colors ${
                isRealtimeConnected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              onClick={handleRealtimeDrilldown}
              title="Click to view real-time connection details"
            >
              <Circle
                className={`w-1.5 h-1.5 ${isRealtimeConnected ? 'fill-green-500 animate-pulse' : 'fill-gray-400'}`}
                weight="fill"
              />
              {isRealtimeConnected ? 'Live' : 'Offline'}
            </div>
            {isEmulatorRunning && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                onClick={handleRealtimeDrilldown}
                title="Click to view emulator details"
              >
                <Broadcast className="w-2.5 h-2.5 animate-pulse" />
                Emulator
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          <Select value={layoutMode} onValueChange={(v) => setLayoutMode(v as LayoutMode)}>
            <SelectTrigger className="w-[200px] h-8 text-xs font-medium">
              <Layout className="w-3.5 h-3.5 mr-2" />
              <SelectValue placeholder="Choose Layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-semibold text-gray-500">Quick Views</SelectLabel>
                <SelectItem value="split-50-50">📊 50/50 Split</SelectItem>
                <SelectItem value="split-70-30">🗺️ 70/30 Map Focus</SelectItem>
                <SelectItem value="tabs">🗂️ Tabbed View</SelectItem>
                <SelectItem value="top-bottom">📐 Top/Bottom</SelectItem>
                <SelectItem value="map-drawer">📋 Map + Drawer</SelectItem>
                <SelectItem value="quad-grid">⊞ 4-Quadrant</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-semibold text-gray-500">Fortune 50 Designs</SelectLabel>
                <SelectItem value="fortune-glass">✨ Glass-morphism</SelectItem>
                <SelectItem value="fortune-dark">🌙 Dark Enterprise</SelectItem>
                <SelectItem value="fortune-nordic">🌿 Nordic Clean</SelectItem>
                <SelectItem value="fortune-ultimate">🏆 Command Center Pro</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <AddVehicleDialog onAdd={data.addVehicle} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedFiltersOpen(true)}
            className={hasActiveFilters ? "border-primary h-7 text-xs" : "h-7 text-xs"}
          >
            <FunnelSimple className="w-3 h-3 mr-1.5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                On
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex gap-2">
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => handleMetricDrilldown('total', { status: 'all' }, `All Vehicles (${metrics.total})`)}
          title="Click to view all vehicles"
        >
          Total: {metrics.total}
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-success/10 text-success border-success/20 cursor-pointer hover:bg-success/20 transition-colors"
          onClick={() => handleMetricDrilldown('active', { status: 'active' }, `Active Vehicles (${metrics.active})`)}
          title="Click to view active vehicles"
        >
          Active: {metrics.active}
        </Badge>
        <Badge
          variant="outline"
          className="text-xs bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors"
          onClick={() => handleMetricDrilldown('service', { status: 'service' }, `Service Vehicles (${metrics.service})`)}
          title="Click to view vehicles in service"
        >
          Service: {metrics.service}
        </Badge>
        <Badge variant="outline" className="text-xs">Avg Fuel: {metrics.avgFuelLevel}%</Badge>
        {metrics.lowFuel > 0 && (
          <Badge
            variant="outline"
            className="text-xs bg-destructive/10 text-destructive border-destructive/20 cursor-pointer hover:bg-destructive/20 transition-colors"
            onClick={() => handleMetricDrilldown('lowFuel', { fuelLevel: '<25' }, `Low Fuel Vehicles (${metrics.lowFuel})`)}
            title="Click to view vehicles with low fuel"
          >
            Low Fuel: {metrics.lowFuel}
          </Badge>
        )}
      </div>

      {/* Dynamic Layout Content */}
      {renderLayout()}

      {/* Advanced Filters Dialog */}
      <Dialog open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vehicle Status */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Vehicle Status</Label>
              <div className="flex flex-wrap gap-3">
                {["active", "idle", "charging", "service", "emergency", "offline"].map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filterCriteria.vehicleStatus.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilterCriteria({
                          ...filterCriteria,
                          vehicleStatus: checked
                            ? [...filterCriteria.vehicleStatus, status]
                            : filterCriteria.vehicleStatus.filter(s => s !== status)
                        })
                      }}
                    />
                    <Label htmlFor={`status-${status}`} className="capitalize cursor-pointer">
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Department */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Department</Label>
              <div className="flex flex-wrap gap-3">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={filterCriteria.departments.includes(dept)}
                      onCheckedChange={(checked) => {
                        setFilterCriteria({
                          ...filterCriteria,
                          departments: checked
                            ? [...filterCriteria.departments, dept]
                            : filterCriteria.departments.filter(d => d !== dept)
                        })
                      }}
                    />
                    <Label htmlFor={`dept-${dept}`} className="cursor-pointer">
                      {dept}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Region */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Region</Label>
              <div className="flex flex-wrap gap-3">
                {regions.map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={filterCriteria.regions.includes(region)}
                      onCheckedChange={(checked) => {
                        setFilterCriteria({
                          ...filterCriteria,
                          regions: checked
                            ? [...filterCriteria.regions, region]
                            : filterCriteria.regions.filter(r => r !== region)
                        })
                      }}
                    />
                    <Label htmlFor={`region-${region}`} className="cursor-pointer">
                      {region}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fuel Level Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Fuel Level: {filterCriteria.fuelLevelRange[0]}% - {filterCriteria.fuelLevelRange[1]}%
              </Label>
              <Slider
                min={0}
                max={100}
                step={5}
                value={filterCriteria.fuelLevelRange}
                onValueChange={(value) => {
                  setFilterCriteria({
                    ...filterCriteria,
                    fuelLevelRange: value as [number, number]
                  })
                }}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleResetFilters}>
              Reset Filters
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FleetDashboard;
