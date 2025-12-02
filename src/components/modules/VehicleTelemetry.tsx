import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  MagnifyingGlass,
  Engine,
  Gauge,
  Warning,
  CheckCircle,
  LockKey,
  BatteryCharging,
  ThermometerSimple,
  Drop,
  Speedometer,
  CarProfile
} from "@phosphor-icons/react"
import { UniversalMap } from "@/components/UniversalMap"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useInspect } from "@/services/inspect/InspectContext"
import { toast } from "sonner"

interface VehicleTelemetry {
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  make: string
  model: string
  year: number
  vin: string
  dataSource: "obd-ii" | "smartcar" | "integrated"
  connected: boolean
  lastUpdate: string
  liveData: {
    odometer: number // miles
    speed: number // mph
    rpm: number
    fuelLevel: number // %
    batteryVoltage: number
    engineTemp: number // °F
    coolantTemp: number // °F
    oilPressure: number // psi
    tirePressure: {
      fl: number // front left
      fr: number
      rl: number
      rr: number
    }
    stateOfCharge?: number // % for EVs
    range?: number // miles
    location?: {
      lat: number
      lng: number
    }
  }
  dtcCodes: {
    code: string
    description: string
    severity: "info" | "warning" | "critical"
    timestamp: string
    cleared: boolean
  }[]
  smartcarCapabilities?: {
    canLock: boolean
    canUnlock: boolean
    canStartCharge: boolean
    canStopCharge: boolean
    canGetLocation: boolean
    canGetOdometer: boolean
    canGetBattery: boolean
  }
  consentStatus: {
    granted: boolean
    grantedAt?: string
    expiresAt?: string
    scopes: string[]
  }
}

export function VehicleTelemetry() {
  const fleetData = useFleetData()
  const fleetVehicles = fleetData.vehicles || []
  const facilities = fleetData.facilities || []
  const { openInspect } = useInspect()

  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSource, setFilterSource] = useState<string>("all")
  const [filterConnected, setFilterConnected] = useState<string>("all")
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTelemetry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const filteredVehicles = (vehicles || []).filter(vehicle => {
    const matchesSearch =
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = filterSource === "all" || vehicle.dataSource === filterSource
    const matchesConnected =
      filterConnected === "all" ||
      (filterConnected === "connected" && vehicle.connected) ||
      (filterConnected === "disconnected" && !vehicle.connected)

    return matchesSearch && matchesSource && matchesConnected
  })

  const handleSmartcarCommand = (vehicleId: string, command: string) => {
    toast.info(`Sending ${command} command to vehicle...`)
    setTimeout(() => {
      toast.success(`Command executed successfully`)
    }, 1500)
  }

  const handleRefreshAll = () => {
    toast.info('Refreshing telemetry data for all vehicles...')
    setTimeout(() => {
      toast.success(`Successfully refreshed data for ${vehicles.length} vehicles`)
    }, 1500)
  }

  const handleClearDTC = (vehicleId: string, dtcCode: string) => {
    setVehicles(current =>
      (current || []).map(v =>
        v.id === vehicleId
          ? {
              ...v,
              dtcCodes: v.dtcCodes.map(dtc =>
                dtc.code === dtcCode ? { ...dtc, cleared: true } : dtc
              )
            }
          : v
      )
    )
    toast.success("DTC code cleared")
  }

  const handleViewDetails = (vehicle: VehicleTelemetry) => {
    // Open inspect drawer with telemetry tab focused
    openInspect({
      type: 'vehicle',
      id: vehicle.vehicleId,
      tab: 'telemetry'
    })

    // Also maintain dialog state for legacy UI
    setSelectedVehicle(vehicle)
    setIsDetailsOpen(true)
  }

  const getDataSourceBadge = (source: VehicleTelemetry["dataSource"]) => {
    const styles = {
      "obd-ii": "bg-blue-100 text-blue-700",
      smartcar: "bg-purple-100 text-purple-700",
      integrated: "bg-green-100 text-green-700"
    }
    const labels = {
      "obd-ii": "OBD-II",
      smartcar: "Smartcar",
      integrated: "Integrated"
    }
    return (
      <Badge className={styles[source]} variant="secondary">
        {labels[source]}
      </Badge>
    )
  }

  const getDTCSeverityColor = (severity: "info" | "warning" | "critical") => {
    const colors = {
      info: "bg-blue-100 text-blue-700",
      warning: "bg-yellow-100 text-yellow-700",
      critical: "bg-red-100 text-red-700"
    }
    return colors[severity]
  }

  const totalVehicles = (vehicles || []).length
  const connectedVehicles = (vehicles || []).filter(v => v.connected).length
  const activeDTCs = (vehicles || []).reduce(
    (sum, v) => sum + v.dtcCodes.filter(dtc => !dtc.cleared).length,
    0
  )
  const smartcarEnabled = (vehicles || []).filter(v => v.dataSource === "smartcar" || v.dataSource === "integrated").length

  // Mock sample data
  const mockVehicles: VehicleTelemetry[] = [
    {
      id: "tel-1",
      tenantId: "tenant-demo",
      vehicleId: "veh-1",
      vehicleNumber: "FL-1001",
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      vin: "5YJ3E1EA8KF123456",
      dataSource: "smartcar",
      connected: true,
      lastUpdate: new Date().toISOString(),
      liveData: {
        odometer: 15432,
        speed: 0,
        rpm: 0,
        fuelLevel: 0,
        batteryVoltage: 13.8,
        engineTemp: 0,
        coolantTemp: 0,
        oilPressure: 0,
        tirePressure: { fl: 35, fr: 35, rl: 35, rr: 35 },
        stateOfCharge: 82,
        range: 235
      },
      dtcCodes: [],
      smartcarCapabilities: {
        canLock: true,
        canUnlock: true,
        canStartCharge: true,
        canStopCharge: true,
        canGetLocation: true,
        canGetOdometer: true,
        canGetBattery: true
      },
      consentStatus: {
        granted: true,
        grantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        scopes: ["read_vehicle_info", "read_location", "read_odometer", "read_charge", "control_charge"]
      }
    },
    {
      id: "tel-2",
      tenantId: "tenant-demo",
      vehicleId: "veh-2",
      vehicleNumber: "FL-1002",
      make: "Ford",
      model: "F-150",
      year: 2022,
      vin: "1FTFW1E84NFA12345",
      dataSource: "obd-ii",
      connected: true,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      liveData: {
        odometer: 28945,
        speed: 0,
        rpm: 0,
        fuelLevel: 45,
        batteryVoltage: 12.6,
        engineTemp: 195,
        coolantTemp: 192,
        oilPressure: 35,
        tirePressure: { fl: 32, fr: 32, rl: 34, rr: 34 },
        range: 180
      },
      dtcCodes: [
        {
          code: "P0128",
          description: "Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)",
          severity: "warning",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          cleared: false
        }
      ],
      consentStatus: {
        granted: false,
        scopes: []
      }
    },
    {
      id: "tel-3",
      tenantId: "tenant-demo",
      vehicleId: "veh-3",
      vehicleNumber: "FL-1003",
      make: "Chevrolet",
      model: "Silverado",
      year: 2021,
      vin: "1GCPYBEK8MZ123456",
      dataSource: "obd-ii",
      connected: false,
      lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      liveData: {
        odometer: 42103,
        speed: 0,
        rpm: 0,
        fuelLevel: 68,
        batteryVoltage: 12.4,
        engineTemp: 0,
        coolantTemp: 0,
        oilPressure: 0,
        tirePressure: { fl: 33, fr: 33, rl: 35, rr: 35 },
        range: 272
      },
      dtcCodes: [],
      consentStatus: {
        granted: false,
        scopes: []
      }
    }
  ]

  // Initialize with mock data if empty
  if ((vehicles || []).length === 0 && mockVehicles.length > 0) {
    setVehicles(mockVehicles)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Vehicle Telemetry</h2>
          <p className="text-muted-foreground">
            Live data from OBD-II devices and Smartcar API integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshAll}>
            <Engine className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CarProfile className="w-3 h-3" />
              Monitored
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{connectedVehicles}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              Live data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active DTCs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeDTCs}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Diagnostic codes
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Smartcar Enabled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{smartcarEnabled}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <LockKey className="w-3 h-3" />
              Remote control
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="obd-ii">OBD-II Only</SelectItem>
            <SelectItem value="smartcar">Smartcar Only</SelectItem>
            <SelectItem value="integrated">Integrated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterConnected} onValueChange={setFilterConnected}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="connected">Connected</SelectItem>
            <SelectItem value="disconnected">Disconnected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Locations</CardTitle>
          <CardDescription>
            Real-time telemetry and location tracking on map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <UniversalMap
              vehicles={fleetVehicles}
              facilities={facilities}
              showVehicles={true}
              showFacilities={true}
              mapStyle="road"
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live Vehicle Data ({filteredVehicles.length})</CardTitle>
          <CardDescription>Real-time telemetry from OBD-II and Smartcar API</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Fuel/SOC</TableHead>
                <TableHead>DTCs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No vehicles found. Connect OBD-II devices or authorize Smartcar access.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map(vehicle => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.vehicleNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getDataSourceBadge(vehicle.dataSource)}</TableCell>
                    <TableCell>
                      {vehicle.connected ? (
                        <Badge className="bg-green-100 text-green-700" variant="secondary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700" variant="secondary">
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{vehicle.liveData.odometer.toLocaleString()} mi</div>
                    </TableCell>
                    <TableCell>
                      {vehicle.liveData.stateOfCharge !== undefined ? (
                        <div className="flex items-center gap-1">
                          <BatteryCharging className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{vehicle.liveData.stateOfCharge}%</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Drop className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{vehicle.liveData.fuelLevel}%</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.dtcCodes.filter(dtc => !dtc.cleared).length > 0 ? (
                        <Badge className="bg-orange-100 text-orange-700" variant="secondary">
                          <Warning className="w-3 h-3 mr-1" />
                          {vehicle.dtcCodes.filter(dtc => !dtc.cleared).length}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(vehicle)}
                        >
                          Details
                        </Button>
                        {vehicle.smartcarCapabilities && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSmartcarCommand(vehicle.id, "refresh")}
                          >
                            Refresh
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Telemetry Details</DialogTitle>
            <DialogDescription>
              {selectedVehicle?.vehicleNumber} - {selectedVehicle?.year} {selectedVehicle?.make}{" "}
              {selectedVehicle?.model}
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Speedometer className="w-4 h-4" />
                      Speed & RPM
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedVehicle.liveData.speed} mph</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedVehicle.liveData.rpm} RPM
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <ThermometerSimple className="w-4 h-4" />
                      Temperature
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedVehicle.liveData.engineTemp}°F</div>
                    <div className="text-xs text-muted-foreground">
                      Coolant: {selectedVehicle.liveData.coolantTemp}°F
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Gauge className="w-4 h-4" />
                      Tire Pressure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>FL: {selectedVehicle.liveData.tirePressure.fl} psi</div>
                      <div>FR: {selectedVehicle.liveData.tirePressure.fr} psi</div>
                      <div>RL: {selectedVehicle.liveData.tirePressure.rl} psi</div>
                      <div>RR: {selectedVehicle.liveData.tirePressure.rr} psi</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedVehicle.dtcCodes.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Diagnostic Trouble Codes</h3>
                  <div className="space-y-2">
                    {selectedVehicle.dtcCodes.map((dtc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getDTCSeverityColor(dtc.severity)}
                              variant="secondary"
                            >
                              {dtc.code}
                            </Badge>
                            {dtc.cleared && (
                              <Badge variant="outline" className="text-xs">
                                Cleared
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{dtc.description}</p>
                        </div>
                        {!dtc.cleared && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleClearDTC(selectedVehicle.id, dtc.code)}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedVehicle.smartcarCapabilities && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Smartcar Remote Control</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVehicle.smartcarCapabilities.canLock && (
                      <Button
                        variant="outline"
                        onClick={() => handleSmartcarCommand(selectedVehicle.id, "lock")}
                      >
                        <LockKey className="w-4 h-4 mr-2" />
                        Lock Doors
                      </Button>
                    )}
                    {selectedVehicle.smartcarCapabilities.canUnlock && (
                      <Button
                        variant="outline"
                        onClick={() => handleSmartcarCommand(selectedVehicle.id, "unlock")}
                      >
                        <LockKey className="w-4 h-4 mr-2" />
                        Unlock Doors
                      </Button>
                    )}
                    {selectedVehicle.smartcarCapabilities.canStartCharge && (
                      <Button
                        variant="outline"
                        onClick={() => handleSmartcarCommand(selectedVehicle.id, "start-charge")}
                      >
                        <BatteryCharging className="w-4 h-4 mr-2" />
                        Start Charge
                      </Button>
                    )}
                    {selectedVehicle.smartcarCapabilities.canStopCharge && (
                      <Button
                        variant="outline"
                        onClick={() => handleSmartcarCommand(selectedVehicle.id, "stop-charge")}
                      >
                        <BatteryCharging className="w-4 h-4 mr-2" />
                        Stop Charge
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
