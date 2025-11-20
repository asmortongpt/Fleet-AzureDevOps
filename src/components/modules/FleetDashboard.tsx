import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { MetricCard } from "@/components/MetricCard"
import { AddVehicleDialog } from "@/components/dialogs/AddVehicleDialog"
import { UniversalMap } from "@/components/UniversalMap"
import { AssetTypeFilter, FilterState as AssetFilterState } from "@/components/filters/AssetTypeFilter"
import {
  Car,
  Pulse,
  BatteryMedium,
  Wrench,
  Warning,
  Lightning,
  MapPin,
  Buildings,
  MagnifyingGlass,
  FunnelSimple,
  X
} from "@phosphor-icons/react"
import { Vehicle } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"

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
  const vehicles = data.vehicles || []
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>("all")
  const [regionFilter, setRegionFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Asset Type Filters state
  const [assetFilters, setAssetFilters] = useState<AssetFilterState>({})
  const [showAssetFilters, setShowAssetFilters] = useState(false)

  // Advanced filters state
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [filterCriteria, setFilterCriteria] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilterCriteria>(defaultFilterCriteria)

  // Sync asset filters with URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const newFilters: AssetFilterState = {}

    if (params.get('asset_category')) newFilters.asset_category = params.get('asset_category') as any
    if (params.get('asset_type')) newFilters.asset_type = params.get('asset_type') as any
    if (params.get('power_type')) newFilters.power_type = params.get('power_type') as any
    if (params.get('operational_status')) newFilters.operational_status = params.get('operational_status') as any
    if (params.get('primary_metric')) newFilters.primary_metric = params.get('primary_metric') as any
    if (params.get('is_road_legal')) newFilters.is_road_legal = params.get('is_road_legal') === 'true'

    if (Object.keys(newFilters).length > 0) {
      setAssetFilters(newFilters)
      setShowAssetFilters(true)
    }
  }, [])

  // Update URL parameters when asset filters change
  const handleAssetFilterChange = (newFilters: AssetFilterState) => {
    setAssetFilters(newFilters)

    // Update URL parameters
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, String(value))
      }
    })

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname
    window.history.replaceState({}, '', newUrl)

    // In a real implementation, you would fetch vehicles from API here:
    // fetchVehiclesWithFilters(newFilters)
  }

  const handleClearAssetFilters = () => {
    setAssetFilters({})
    window.history.replaceState({}, '', window.location.pathname)
    // In a real implementation, you would fetch all vehicles:
    // fetchVehiclesWithFilters({})
  }

  // Function to fetch vehicles from API with filters (for future use)
  const fetchVehiclesWithFilters = async (filters: AssetFilterState) => {
    try {
      const params: any = {}
      if (filters.asset_category) params.asset_category = filters.asset_category
      if (filters.asset_type) params.asset_type = filters.asset_type
      if (filters.power_type) params.power_type = filters.power_type
      if (filters.operational_status) params.operational_status = filters.operational_status
      if (filters.primary_metric) params.primary_metric = filters.primary_metric
      if (filters.is_road_legal !== undefined) params.is_road_legal = filters.is_road_legal

      // Uncomment when API is ready:
      // const response = await apiClient.vehicles.list(params)
      // Update vehicles state with response
      console.log('Fetching vehicles with filters:', params)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Basic filters
      const matchesType = vehicleTypeFilter === "all" || v.type === vehicleTypeFilter
      const matchesRegion = regionFilter === "all" || v.region === regionFilter
      const matchesStatus = statusFilter === "all" || v.status === statusFilter
      const matchesSearch = !searchQuery || searchQuery === "" ||
        v.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model.toLowerCase().includes(searchQuery.toLowerCase())

      // Asset type filters
      const matchesAssetCategory = !assetFilters.asset_category ||
        (v as any).asset_category === assetFilters.asset_category
      const matchesAssetType = !assetFilters.asset_type ||
        (v as any).asset_type === assetFilters.asset_type
      const matchesPowerType = !assetFilters.power_type ||
        (v as any).power_type === assetFilters.power_type
      const matchesOperationalStatus = !assetFilters.operational_status ||
        (v as any).operational_status === assetFilters.operational_status
      const matchesPrimaryMetric = !assetFilters.primary_metric ||
        (v as any).primary_metric === assetFilters.primary_metric
      const matchesRoadLegal = assetFilters.is_road_legal === undefined ||
        (v as any).is_road_legal === assetFilters.is_road_legal

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
        (appliedFilters.alertStatus.includes("has-alerts") && v.alerts.length > 0) ||
        (appliedFilters.alertStatus.includes("no-alerts") && v.alerts.length === 0) ||
        (appliedFilters.alertStatus.includes("critical") && v.alerts.some(a => a.toLowerCase().includes("critical")))
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

      return matchesType && matchesRegion && matchesStatus && matchesSearch &&
        matchesAssetCategory && matchesAssetType && matchesPowerType &&
        matchesOperationalStatus && matchesPrimaryMetric && matchesRoadLegal &&
        matchesAdvancedStatus && matchesDepartment && matchesAdvancedRegion &&
        matchesFuelLevel && matchesMileage && matchesAlertStatus &&
        matchesDriverAssignment && matchesAdvancedVehicleType &&
        matchesYearRange && matchesLastMaintenance
    })
  }, [vehicles, vehicleTypeFilter, regionFilter, statusFilter, searchQuery, assetFilters, appliedFilters])

  const metrics = useMemo(() => {
    const total = filteredVehicles.length
    const active = filteredVehicles.filter(v => v.status === "active").length
    const idle = filteredVehicles.filter(v => v.status === "idle").length
    const charging = filteredVehicles.filter(v => v.status === "charging").length
    const service = filteredVehicles.filter(v => v.status === "service").length
    const emergency = filteredVehicles.filter(v => v.status === "emergency").length
    const lowFuel = filteredVehicles.filter(v => v.fuelLevel < 25).length
    const alerts = filteredVehicles.filter(v => v.alerts.length > 0).length
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
    .filter(v => v.type === "emergency" || v.alerts.length > 0)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Fleet Dashboard</h1>
          <div className="flex gap-2">
            <AddVehicleDialog onAdd={data.addVehicle} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssetFilters(!showAssetFilters)}
              className={Object.keys(assetFilters).length > 0 ? "border-primary" : ""}
            >
              <FunnelSimple className="w-4 h-4 mr-2" />
              Asset Filters
              {Object.keys(assetFilters).length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {Object.keys(assetFilters).length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdvancedFiltersOpen(true)}
              className={hasActiveFilters ? "border-primary" : ""}
            >
              <FunnelSimple className="w-4 h-4 mr-2" />
              Advanced Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  Active
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Asset Type Filter Component */}
        {showAssetFilters && (
          <div className="mb-4">
            <AssetTypeFilter
              onFilterChange={handleAssetFilterChange}
              onClear={handleClearAssetFilters}
              activeFilters={assetFilters}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="charging">Charging</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {appliedFilters.vehicleStatus.map(status => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("vehicleStatus", status)}
                />
              </Badge>
            ))}
            {appliedFilters.departments.map(dept => (
              <Badge key={dept} variant="secondary" className="gap-1">
                Dept: {dept}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("departments", dept)}
                />
              </Badge>
            ))}
            {appliedFilters.regions.map(region => (
              <Badge key={region} variant="secondary" className="gap-1">
                Region: {region}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("regions", region)}
                />
              </Badge>
            ))}
            {appliedFilters.vehicleTypes.map(type => (
              <Badge key={type} variant="secondary" className="gap-1">
                Type: {type}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("vehicleTypes", type)}
                />
              </Badge>
            ))}
            {(appliedFilters.fuelLevelRange[0] !== 0 || appliedFilters.fuelLevelRange[1] !== 100) && (
              <Badge variant="secondary" className="gap-1">
                Fuel: {appliedFilters.fuelLevelRange[0]}-{appliedFilters.fuelLevelRange[1]}%
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("fuelLevelRange")}
                />
              </Badge>
            )}
            {(appliedFilters.mileageRange.min !== null || appliedFilters.mileageRange.max !== null) && (
              <Badge variant="secondary" className="gap-1">
                Mileage: {appliedFilters.mileageRange.min ?? 0}-{appliedFilters.mileageRange.max ?? "\u221E"}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("mileageRange")}
                />
              </Badge>
            )}
            {appliedFilters.alertStatus.map(alert => (
              <Badge key={alert} variant="secondary" className="gap-1">
                Alert: {alert}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("alertStatus", alert)}
                />
              </Badge>
            ))}
            {appliedFilters.driverAssigned !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Driver: {appliedFilters.driverAssigned}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("driverAssigned")}
                />
              </Badge>
            )}
            {(appliedFilters.yearRange.from !== null || appliedFilters.yearRange.to !== null) && (
              <Badge variant="secondary" className="gap-1">
                Year: {appliedFilters.yearRange.from ?? ""}-{appliedFilters.yearRange.to ?? ""}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("yearRange")}
                />
              </Badge>
            )}
            {appliedFilters.lastMaintenance !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Maintenance: {appliedFilters.lastMaintenance}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFilter("lastMaintenance")}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-6 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Vehicles"
          value={metrics.total}
          subtitle={`${metrics.active} active now`}
          icon={<Car className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Active Vehicles"
          value={metrics.active}
          change={5.2}
          trend="up"
          subtitle="on the road"
          icon={<Pulse className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Avg Fuel Level"
          value={`${metrics.avgFuelLevel}%`}
          change={metrics.lowFuel > 5 ? 3.1 : 0}
          trend={metrics.lowFuel > 5 ? "down" : "neutral"}
          subtitle={`${metrics.lowFuel} low fuel`}
          icon={<BatteryMedium className="w-5 h-5" />}
          status={metrics.lowFuel > 5 ? "warning" : "success"}
        />
        <MetricCard
          title="Service Required"
          value={metrics.service}
          change={metrics.alerts > 10 ? 12 : 0}
          trend={metrics.alerts > 10 ? "up" : "neutral"}
          subtitle={`${metrics.alerts} alerts`}
          icon={<Wrench className="w-5 h-5" />}
          status={metrics.service > 5 ? "warning" : "info"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Pulse className="w-4 h-4" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {metrics.active}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Idle</span>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                {metrics.idle}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Charging</span>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                {metrics.charging}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Service</span>
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {metrics.service}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Emergency</span>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                {metrics.emergency}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {regions.map(region => {
              const count = filteredVehicles.filter(v => v.region === region).length
              return (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{region}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warning className="w-4 h-4" />
              Priority Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {priorityVehicles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No priority vehicles
              </p>
            ) : (
              <div className="space-y-3">
                {priorityVehicles.map(vehicle => (
                  <div key={vehicle.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{vehicle.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                    <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Interactive Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: '500px' }}>
            <UniversalMap
              vehicles={filteredVehicles}
              showVehicles={true}
              showFacilities={false}
              className="rounded-lg overflow-hidden"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredVehicles.slice(0, 10).map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(vehicle.status)}`}>
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{vehicle.region}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.department}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BatteryMedium className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{vehicle.fuelLevel}%</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                    {vehicle.status}
                  </Badge>
                </div>
              </div>
            ))}
            {filteredVehicles.length > 10 && (
              <p className="text-sm text-muted-foreground text-center pt-4">
                Showing 10 of {filteredVehicles.length} vehicles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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
