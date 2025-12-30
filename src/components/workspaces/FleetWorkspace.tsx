import {
  Truck,
  Battery,
  Fuel,
  Wrench,
  Activity,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Box,
  Gauge,
  ThermometerSun
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useVehicles, useFacilities, useDrivers, useVehicleMutations } from "@/hooks/use-api"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { cn } from "@/lib/utils"

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  licensePlate: string;
  status: string;
  fuelType: string;
  fuelLevel: number;
  mileage: number;
  driver?: string;
  department?: string;
  schedule?: string;
  nextServiceMiles: number;
  lastServiceDate?: string;
  maintenanceAlerts?: string[];
  location?: string;
}

interface Telemetry {
  speed?: number;
  rpm?: number;
  engineTemp?: number;
  location?: string;
}

// Vehicle Telemetry Panel
const VehicleTelemetryPanel = ({ vehicle, telemetry }: { vehicle: Vehicle | null; telemetry: Telemetry | null }) => {
  if (!vehicle) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a vehicle to view telemetry data
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Vehicle Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">
              VIN: {vehicle.vin} • Plate: {vehicle.licensePlate}
            </p>
          </div>
          <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
            {vehicle.status}
          </Badge>
        </div>

        {/* Real-time Telemetry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Real-Time Telemetry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Gauge className="h-3 w-3 mr-1" />
                  Speed
                </div>
                <div className="text-xl font-semibold">{telemetry?.speed || 0} mph</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Activity className="h-3 w-3 mr-1" />
                  RPM
                </div>
                <div className="text-xl font-semibold">{telemetry?.rpm || 0}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <ThermometerSun className="h-3 w-3 mr-1" />
                  Engine Temp
                </div>
                <div className="text-xl font-semibold">{telemetry?.engineTemp || 0}°F</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location
                </div>
                <div className="text-sm font-medium truncate">{telemetry?.location || "Unknown"}</div>
              </div>
            </div>

            <Separator />

            {/* Fuel/Battery Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  {vehicle.fuelType === 'electric' ? (
                    <Battery className="h-3 w-3 mr-1" />
                  ) : (
                    <Fuel className="h-3 w-3 mr-1" />
                  )}
                  {vehicle.fuelType === 'electric' ? 'Battery' : 'Fuel'} Level
                </span>
                <span className="font-medium">{vehicle.fuelLevel}%</span>
              </div>
              <Progress value={vehicle.fuelLevel} className="h-2" />
            </div>

            {/* Odometer */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Odometer</span>
              <span className="font-medium">{vehicle.mileage?.toLocaleString()} miles</span>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Assignment */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Driver</span>
              </div>
              <span className="text-sm font-medium">
                {vehicle.driver || "Unassigned"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Department</span>
              </div>
              <span className="text-sm font-medium">
                {vehicle.department || "General Fleet"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Schedule</span>
              </div>
              <span className="text-sm font-medium">
                {vehicle.schedule || "24/7 Available"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Next Service</span>
              <Badge variant="outline">
                {vehicle.nextServiceMiles - vehicle.mileage} miles
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Last Service</span>
              <span className="text-sm text-muted-foreground">
                {vehicle.lastServiceDate || "N/A"}
              </span>
            </div>
            {vehicle.maintenanceAlerts && vehicle.maintenanceAlerts.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <div className="space-y-1">
                  {vehicle.maintenanceAlerts.map((alert: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                      <span>{alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full">View Full Details</Button>
          <Button variant="outline" className="w-full">View 3D Model</Button>
          <Button variant="outline" className="w-full">Schedule Maintenance</Button>
          <Button variant="outline" className="w-full">View History</Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Vehicle Inventory Panel
const VehicleInventoryPanel = ({ vehicles, onVehicleSelect }: { vehicles: Vehicle[]; onVehicleSelect: (vehicle: Vehicle) => void }) => {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('status')

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles || []

    if (filter !== 'all') {
      filtered = filtered.filter((v: Vehicle) => v.status === filter)
    }

    // Sort vehicles
    filtered.sort((a: Vehicle, b: Vehicle) => {
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      } else if (sortBy === 'fuel') {
        return a.fuelLevel - b.fuelLevel
      } else if (sortBy === 'mileage') {
        return b.mileage - a.mileage
      }
      return 0
    })

    return filtered
  }, [vehicles, filter, sortBy])

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'maintenance': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Sort by Status</SelectItem>
              <SelectItem value="fuel">Sort by Fuel</SelectItem>
              <SelectItem value="mileage">Sort by Mileage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle List */}
        <div className="space-y-2">
          {filteredVehicles.map((vehicle: Vehicle) => (
            <Card
              key={vehicle.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onVehicleSelect(vehicle)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", getStatusColor(vehicle.status))} />
                    <div>
                      <div className="font-medium">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.licensePlate} • {vehicle.department}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{vehicle.fuelLevel}%</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.fuelType === 'electric' ? 'Battery' : 'Fuel'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(vehicle.mileage / 1000).toFixed(1)}k</div>
                      <div className="text-xs text-muted-foreground">Miles</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Main Fleet Workspace Component
export function FleetWorkspace({ _data }: { _data?: unknown }) {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [activeView, setActiveView] = useState('map')
  const [activePanel, setActivePanel] = useState('telemetry')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: _facilities = [] } = useFacilities()
  const { data: _drivers = [] } = useDrivers()
  const { updateVehicle: _updateVehicle } = useVehicleMutations()

  // Real-time telemetry for all vehicles
  const {
    vehicles: realtimeVehicles,
    isConnected: isRealtimeConnected,
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles: vehicles as Vehicle[],
  })

  // Use real-time vehicles if available, otherwise use static data
  const displayVehicles = realtimeVehicles.length > 0 ? realtimeVehicles : vehicles

  // Drilldown navigation
  const { push: _push } = useDrilldown()

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    const vehicle = (displayVehicles as Vehicle[]).find((v: Vehicle) => v.id === vehicleId)
    if (vehicle) {
      setSelectedVehicle(vehicle)
      setActivePanel('telemetry')
    }
  }, [displayVehicles])

  // Stats overlay data
  const stats = useMemo(() => ({
    active: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.status === 'active').length,
    idle: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.status === 'idle').length,
    service: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.status === 'service').length,
    offline: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.status === 'offline').length
  }), [displayVehicles])

  return (
    <div className="h-screen flex flex-col" data-testid="fleet-workspace">
      {/* View Switcher */}
      <div className="border-b px-4 py-2">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList data-testid="fleet-view-tabs">
            <TabsTrigger value="map" data-testid="fleet-tab-map">Map View</TabsTrigger>
            <TabsTrigger value="grid" data-testid="fleet-tab-grid">Grid View</TabsTrigger>
            <TabsTrigger value="3d" data-testid="fleet-tab-3d">3D Garage</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-[1fr_400px]">
        {/* Main view content will be added here */}
      </div>
    </div>
  )
}