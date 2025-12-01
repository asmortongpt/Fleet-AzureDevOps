import { useMemo, useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  Circle
} from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { useSystemStatus } from "@/hooks/useSystemStatus"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useInspect } from "@/services/inspect/InspectContext"
import apiClient from "@/lib/api-client"

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

  // Drilldown navigation for deep data exploration
  const { push: drilldownPush } = useDrilldown()

  // Inspect drawer for detailed entity views
  const { openInspect } = useInspect()

  // Real-time telemetry integration
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
      console.debug(`[FleetDashboard] Real-time update for ${vehicleId}`, update)
    }
  })

  // Unified system status (all emulators + AI services)
  const systemStatus = useSystemStatus({
    enabled: true,
    pollInterval: 5000
  })

  // Drilldown handlers for deep navigation to original records
  const handleVehicleDrilldown = useCallback((vehicle: Vehicle) => {
    // Open inspect drawer for detailed view
    openInspect({ type: 'vehicle', id: vehicle.id })

    // Also maintain drilldown breadcrumb navigation
    drilldownPush({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle',
      label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
      data: { vehicleId: vehicle.id, vehicle }
    })
  }, [drilldownPush, openInspect])

  const handleStatusDrilldown = useCallback((status: string, count: number) => {
    drilldownPush({
      id: `status-${status}`,
      type: 'vehicle-list',
      label: `${status.charAt(0).toUpperCase() + status.slice(1)} Vehicles (${count})`,
      data: { filterStatus: status, count }
    })
  }, [drilldownPush])

  const handleRegionDrilldown = useCallback((region: string, count: number) => {
    drilldownPush({
      id: `region-${region}`,
      type: 'vehicle-list',
      label: `${region} Region (${count} vehicles)`,
      data: { filterRegion: region, count }
    })
  }, [drilldownPush])

  const handleMetricDrilldown = useCallback((metricType: string, value: number | string, label: string) => {
    drilldownPush({
      id: `metric-${metricType}`,
      type: 'metric-detail',
      label: `${label} - ${value}`,
      data: { metricType, value, label }
    })
  }, [drilldownPush])

  // Merge initial vehicles with real-time updates
  const vehicles = useMemo(() => {
    if (realtimeVehicles.length > 0) {
      // Create a map of initial vehicles for quick lookup
      const initialMap = new Map(initialVehicles.map(v => [v.id, v]))

      // Merge: prefer real-time data, fall back to initial
      const merged = new Map<string, Vehicle>()

      // Add all initial vehicles
      initialVehicles.forEach(v => merged.set(v.id, v))

      // Override with real-time data
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

  // Advanced filters state
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Basic filters
      const matchesStatus = statusFilter === "all" || v.status === statusFilter
      const matchesSearch = !searchQuery || searchQuery === "" ||
        v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())

      // Advanced filters
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

  // Helper functions for advanced filters
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

  const priorityVehicles = filteredVehicles
    .filter(v => v.type === "emergency" || (v.alerts?.length || 0) > 0)
    .slice(0, 5)

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

  return (
    <div className="h-full flex flex-col gap-3 p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Fleet Dashboard</h1>
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isRealtimeConnected
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              <Circle
                className={`w-1.5 h-1.5 ${isRealtimeConnected ? 'fill-green-500 animate-pulse' : 'fill-gray-400'}`}
                weight="fill"
              />
              {isRealtimeConnected ? 'Live' : 'Offline'}
            </div>
            {isEmulatorRunning && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <Broadcast className="w-2.5 h-2.5 animate-pulse" />
                Emulator
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
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
        <Badge variant="outline" className="text-xs">Total: {metrics.total}</Badge>
        <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">Active: {metrics.active}</Badge>
        <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">Service: {metrics.service}</Badge>
        <Badge variant="outline" className="text-xs">Avg Fuel: {metrics.avgFuelLevel}%</Badge>
        {metrics.lowFuel > 0 && (
          <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">
            Low Fuel: {metrics.lowFuel}
          </Badge>
        )}
      </div>

      {/* Main Split Screen: Map LEFT, Table RIGHT */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* LEFT: Map */}
        <div className="border rounded-lg overflow-hidden flex flex-col">
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

        {/* RIGHT: Vehicle Table */}
        <div className="border rounded-lg overflow-hidden flex flex-col">
          {/* Table Header - Fixed */}
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

          {/* Table Content - Scrollable */}
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
                      onClick={() => handleVehicleDrilldown(vehicle)}
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
                        <Badge variant={getStatusVariant(vehicle.status)} className="text-xs">
                          {vehicle.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-sm">{vehicle.assignedDriver || '-'}</td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-1">
                          <BatteryMedium className="w-3 h-3 text-muted-foreground" />
                          <span className={vehicle.fuelLevel < 25 ? 'text-warning font-medium' : ''}>
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
      </div>

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

            {/* Mileage Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Mileage Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage-min">Min Mileage</Label>
                  <Input
                    id="mileage-min"
                    type="number"
                    placeholder="0"
                    value={filterCriteria.mileageRange.min ?? ""}
                    onChange={(e) => {
                      setFilterCriteria({
                        ...filterCriteria,
                        mileageRange: {
                          ...filterCriteria.mileageRange,
                          min: e.target.value ? parseInt(e.target.value) : null
                        }
                      })
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage-max">Max Mileage</Label>
                  <Input
                    id="mileage-max"
                    type="number"
                    placeholder="No limit"
                    value={filterCriteria.mileageRange.max ?? ""}
                    onChange={(e) => {
                      setFilterCriteria({
                        ...filterCriteria,
                        mileageRange: {
                          ...filterCriteria.mileageRange,
                          max: e.target.value ? parseInt(e.target.value) : null
                        }
                      })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Alert Status */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Alert Status</Label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "has-alerts", label: "Has Alerts" },
                  { value: "no-alerts", label: "No Alerts" },
                  { value: "critical", label: "Critical Only" }
                ].map((alert) => (
                  <div key={alert.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`alert-${alert.value}`}
                      checked={filterCriteria.alertStatus.includes(alert.value)}
                      onCheckedChange={(checked) => {
                        setFilterCriteria({
                          ...filterCriteria,
                          alertStatus: checked
                            ? [...filterCriteria.alertStatus, alert.value]
                            : filterCriteria.alertStatus.filter(a => a !== alert.value)
                        })
                      }}
                    />
                    <Label htmlFor={`alert-${alert.value}`} className="cursor-pointer">
                      {alert.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Driver Assigned */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Driver Assignment</Label>
              <Select
                value={filterCriteria.driverAssigned}
                onValueChange={(value) => {
                  setFilterCriteria({ ...filterCriteria, driverAssigned: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Vehicle Type</Label>
              <div className="flex flex-wrap gap-3">
                {["sedan", "suv", "truck", "van", "emergency", "specialty"].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filterCriteria.vehicleTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        setFilterCriteria({
                          ...filterCriteria,
                          vehicleTypes: checked
                            ? [...filterCriteria.vehicleTypes, type]
                            : filterCriteria.vehicleTypes.filter(t => t !== type)
                        })
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                      {type}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Year Range */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Year Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year-from">From Year</Label>
                  <Select
                    value={filterCriteria.yearRange.from?.toString() ?? "all"}
                    onValueChange={(value) => {
                      setFilterCriteria({
                        ...filterCriteria,
                        yearRange: {
                          ...filterCriteria.yearRange,
                          from: value === "all" ? null : parseInt(value)
                        }
                      })
                    }}
                  >
                    <SelectTrigger id="year-from">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Year</SelectItem>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year-to">To Year</Label>
                  <Select
                    value={filterCriteria.yearRange.to?.toString() ?? "all"}
                    onValueChange={(value) => {
                      setFilterCriteria({
                        ...filterCriteria,
                        yearRange: {
                          ...filterCriteria.yearRange,
                          to: value === "all" ? null : parseInt(value)
                        }
                      })
                    }}
                  >
                    <SelectTrigger id="year-to">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Year</SelectItem>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Last Maintenance */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Last Maintenance</Label>
              <Select
                value={filterCriteria.lastMaintenance}
                onValueChange={(value) => {
                  setFilterCriteria({ ...filterCriteria, lastMaintenance: value })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="60days">Last 60 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                  <SelectItem value="overdue">Overdue Maintenance</SelectItem>
                </SelectContent>
              </Select>
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
