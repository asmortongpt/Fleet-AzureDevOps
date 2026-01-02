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
import { useState } from "react"
import { toast } from "sonner"

import { UniversalMap, UniversalMapProps } from "@/components/UniversalMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useInspect } from "@/services/inspect/InspectContext"

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

  const handleSmartcarCommand = (_vehicleId: string, command: string) => {
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
              vehicles={fleetVehicles as UniversalMapProps['vehicles']}
              facilities={facilities as UniversalMapProps['facilities']}
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
                      <div className="font-medium">{vehicle.vehicleNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </div>
                    </TableCell>
                    <TableCell>{getDataSourceBadge(vehicle.dataSource)}</TableCell>
                    <TableCell>
                      {vehicle.connected ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">
                          Disconnected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{vehicle.liveData.odometer.toLocaleString()} mi</TableCell>
                    <TableCell>
                      {vehicle.liveData.stateOfCharge !== undefined
                        ? `${vehicle.liveData.stateOfCharge}% SOC`
                        : `${vehicle.liveData.fuelLevel}% Fuel`}
                    </TableCell>
                    <TableCell>
                      {vehicle.dtcCodes.length > 0 ? (
                        <Badge variant="secondary" className={getDTCSeverityColor(vehicle.dtcCodes[0].severity)}>
                          {vehicle.dtcCodes.length} Code{vehicle.dtcCodes.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          No Issues
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(vehicle)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Vehicle Telemetry Details</DialogTitle>
            <DialogDescription>
              Detailed live data for {selectedVehicle?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Number:</span> {selectedVehicle.vehicleNumber}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Make/Model:</span> {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                      </div>
                      <div>
                        <span className="text-muted-foreground">VIN:</span> {selectedVehicle.vin}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Data Source:</span> {selectedVehicle.dataSource}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Update:</span> {new Date(selectedVehicle.lastUpdate).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Speedometer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Speed:</span> {selectedVehicle.liveData.speed} mph
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Odometer:</span> {selectedVehicle.liveData.odometer.toLocaleString()} mi
                      </div>
                      <div className="flex items-center gap-2">
                        <Drop className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Fuel:</span> {selectedVehicle.liveData.fuelLevel}%
                      </div>
                      {selectedVehicle.liveData.stateOfCharge !== undefined && (
                        <div className="flex items-center gap-2">
                          <BatteryCharging className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">SOC:</span> {selectedVehicle.liveData.stateOfCharge}%
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <ThermometerSimple className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Engine Temp:</span> {selectedVehicle.liveData.engineTemp}°F
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedVehicle.dtcCodes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Diagnostic Trouble Codes ({selectedVehicle.dtcCodes.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVehicle.dtcCodes.map(dtc => (
                          <TableRow key={dtc.code}>
                            <TableCell>{dtc.code}</TableCell>
                            <TableCell>{dtc.description}</TableCell>
                            <TableCell>
                              <Badge className={getDTCSeverityColor(dtc.severity)} variant="secondary">
                                {dtc.severity.charAt(0).toUpperCase() + dtc.severity.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(dtc.timestamp).toLocaleString()}</TableCell>
                            <TableCell>
                              {!dtc.cleared ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClearDTC(selectedVehicle.id, dtc.code)}
                                >
                                  Clear
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-sm">Cleared</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {selectedVehicle.dataSource === "smartcar" && selectedVehicle.smartcarCapabilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Smartcar Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {selectedVehicle.smartcarCapabilities.canLock && (
                        <Button
                          variant="outline"
                          onClick={() => handleSmartcarCommand(selectedVehicle.id, "lock")}
                        >
                          <LockKey className="w-4 h-4 mr-2" />
                          Lock
                        </Button>
                      )}
                      {selectedVehicle.smartcarCapabilities.canUnlock && (
                        <Button
                          variant="outline"
                          onClick={() => handleSmartcarCommand(selectedVehicle.id, "unlock")}
                        >
                          <LockKey className="w-4 h-4 mr-2" />
                          Unlock
                        </Button>
                      )}
                      {selectedVehicle.smartcarCapabilities.canStartCharge && (
                        <Button
                          variant="outline"
                          onClick={() => handleSmartcarCommand(selectedVehicle.id, "start charge")}
                        >
                          <BatteryCharging className="w-4 h-4 mr-2" />
                          Start Charge
                        </Button>
                      )}
                      {selectedVehicle.smartcarCapabilities.canStopCharge && (
                        <Button
                          variant="outline"
                          onClick={() => handleSmartcarCommand(selectedVehicle.id, "stop charge")}
                        >
                          <BatteryCharging className="w-4 h-4 mr-2" />
                          Stop Charge
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
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