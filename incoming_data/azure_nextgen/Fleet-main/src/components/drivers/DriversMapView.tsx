import {
  User,
  Activity,
  Phone,
  Mail,
  Clock,
  Award,
  Truck,
  Moon
} from "lucide-react"
import { useState, useMemo } from "react"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { MapFirstLayout } from "@/components/layout/MapFirstLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Driver, Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"

interface DriversMapViewProps {
  drivers: Driver[]
  vehicles: Vehicle[]
  onDriverSelect?: (driver: Driver) => void
}

export function DriversMapView({ drivers, vehicles, onDriverSelect }: DriversMapViewProps) {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [_activeTab, _setActiveTab] = useState("overview")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Filter drivers by status
  const filteredDrivers = useMemo(() => {
    if (statusFilter === "all") return drivers
    return drivers.filter(d => d.status === statusFilter)
  }, [drivers, statusFilter])

  // Driver statistics
  const stats = useMemo(() => {
    const activeDrivers = drivers.filter(d => d.status === "active")
    const offDutyDrivers = drivers.filter(d => d.status === "off-duty")
    const onLeaveDrivers = drivers.filter(d => d.status === "on-leave")
    const avgSafetyScore = drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length

    return {
      active: activeDrivers.length,
      offDuty: offDutyDrivers.length,
      onLeave: onLeaveDrivers.length,
      avgSafetyScore: Math.round(avgSafetyScore)
    }
  }, [drivers])

  // Get vehicles with assigned drivers for map display
  const vehiclesWithDrivers = useMemo(() => {
    return vehicles.filter(v => {
      const driver = drivers.find(d => d.assignedVehicle === v.id || v.assignedDriver === d.id)
      return driver && driver.status === "active"
    })
  }, [vehicles, drivers])

  // Get driver assignment info for selected driver
  const selectedDriverVehicle = useMemo(() => {
    if (!selectedDriver?.assignedVehicle) return null
    return vehicles.find(v => v.id === selectedDriver.assignedVehicle)
  }, [selectedDriver, vehicles])

  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver)
    onDriverSelect?.(driver)
  }

  const getStatusIcon = (status: Driver["status"]) => {
    switch (status) {
      case "active":
        return <Activity className="h-3 w-3 text-green-500" />
      case "off-duty":
        return <Clock className="h-3 w-3 text-gray-500" />
      case "on-leave":
        return <Moon className="h-3 w-3 text-blue-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: Driver["status"]) => {
    switch (status) {
      case "active":
        return "default"
      case "off-duty":
        return "secondary"
      case "on-leave":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getSafetyScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  // Map component with driver locations
  const mapComponent = (
    <div className="relative h-full">
      <ProfessionalFleetMap
        vehicles={vehiclesWithDrivers}
        facilities={[]}
        height="100%"
        onVehicleSelect={(vehicleId) => {
          const vehicle = vehicles.find(v => v.id === vehicleId)
          if (vehicle?.assignedDriver) {
            const driver = drivers.find(d => d.id === vehicle.assignedDriver)
            if (driver) handleDriverSelect(driver)
          }
        }}
        showLegend={true}
        enableRealTime={true}
      />

      {/* Stats Overlay */}
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm">
              <span className="font-semibold">{stats.active}</span> Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
            <span className="text-sm">
              <span className="font-semibold">{stats.offDuty}</span> Off-Duty
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full" />
            <span className="text-sm">
              <span className="font-semibold">{stats.onLeave}</span> On Leave
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-3 w-3 text-yellow-500" />
            <span className="text-sm">
              <span className="font-semibold">{stats.avgSafetyScore}</span> Avg Score
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  // Side panel with driver details
  const sidePanel = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Drivers</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="off-duty">Off-Duty</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Driver Details */}
      {selectedDriver ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{selectedDriver.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedDriver.employeeId}</p>
              </div>
              <Badge variant={getStatusBadgeVariant(selectedDriver.status)}>
                {selectedDriver.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Department</div>
                <div className="text-sm font-medium">{selectedDriver.department}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">License Type</div>
                <div className="text-sm font-medium">{selectedDriver.licenseType}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Safety Score</div>
                <div className={cn("text-2xl font-bold", getSafetyScoreColor(selectedDriver.safetyScore))}>
                  {selectedDriver.safetyScore}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">License Expiry</div>
                <div className="text-sm font-medium">{selectedDriver.licenseExpiry}</div>
              </div>
            </div>

            {selectedDriver.certifications.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Certifications</div>
                <div className="flex flex-wrap gap-1">
                  {selectedDriver.certifications.map(cert => (
                    <Badge key={cert} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedDriverVehicle && (
              <div className="pt-3 border-t space-y-2">
                <div className="text-xs text-muted-foreground">Assigned Vehicle</div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {selectedDriverVehicle.year} {selectedDriverVehicle.make} {selectedDriverVehicle.model}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedDriverVehicle.licensePlate} • {selectedDriverVehicle.number}
                </div>
              </div>
            )}

            <div className="pt-3 space-y-2">
              <Button className="w-full" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Message Driver
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call {selectedDriver.phone}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a driver to view details</p>
          </CardContent>
        </Card>
      )}

      {/* Driver List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            All Drivers ({filteredDrivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-3">
              {filteredDrivers.map(driver => (
                <div
                  key={driver.id}
                  className={cn(
                    "p-2 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    selectedDriver?.id === driver.id && "bg-accent"
                  )}
                  onClick={() => handleDriverSelect(driver)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(driver.status)}
                      <div>
                        <div className="text-sm font-medium">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {driver.department}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-semibold", getSafetyScoreColor(driver.safetyScore))}>
                        {driver.safetyScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="h-[calc(100vh-8rem)]">
      <MapFirstLayout
        mapComponent={mapComponent}
        sidePanel={sidePanel}
      />
    </div>
  )
}