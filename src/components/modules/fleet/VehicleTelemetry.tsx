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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useDrilldown } from "@/contexts/DrilldownContext"
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
  const { push } = useDrilldown()

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

  // StatusChip component for semantic status
  const StatusChip: React.FC<{status: 'good'|'warn'|'bad'|'info'; label?: string}> = ({status, label}) => {
    const colorMap = {
      good: '#10b981',
      warn: '#f59e0b',
      bad: '#ef4444',
      info: '#60a5fa'
    }
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:8,
        padding:'6px 10px', borderRadius:999,
        border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)',
        color: colorMap[status], fontSize:12
      }}>
        ● {label ?? status.toUpperCase()}
      </span>
    )
  }

  return (
    <div style={{
      padding: 24,
      background: 'var(--bg, #0f172a)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <h2 style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text, #f1f5f9)',
              marginBottom: 8
            }}>Vehicle Telemetry</h2>
            <p style={{
              fontSize: 14,
              color: 'var(--muted, #94a3b8)'
            }}>Professional telemetry management with table-first navigation</p>
          </div>
          <button
            onClick={handleRefreshAll}
            style={{
              padding: '10px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(96,165,250,0.15)',
              color: 'var(--text, #f1f5f9)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Engine className="w-4 h-4" />
            Refresh All
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Total Vehicles</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text, #f1f5f9)' }}>{totalVehicles}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CarProfile className="w-3 h-3" />
            Monitored
          </div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Connected</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{connectedVehicles}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle className="w-3 h-3" />
            Live data
          </div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Active DTCs</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{activeDTCs}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Warning className="w-3 h-3" />
            Diagnostic codes
          </div>
        </div>

        <div style={{
          padding: 20,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)'
        }}>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Smartcar Enabled</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#a855f7' }}>{smartcarEnabled}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <LockKey className="w-3 h-3" />
            Remote control
          </div>
        </div>
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

      {/* Vehicle Locations Map */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
        marginBottom: 24
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #f1f5f9)', marginBottom: 4 }}>Vehicle Locations</div>
          <div style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>Real-time telemetry and location tracking on map</div>
        </div>
        <div style={{ height: 400 }}>
          <UniversalMap
            vehicles={fleetVehicles as UniversalMapProps['vehicles']}
            facilities={facilities as UniversalMapProps['facilities']}
            showVehicles={true}
            showFacilities={true}
            mapStyle="road"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Telemetry Table - Professional Design */}
      <div style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #f1f5f9)', marginBottom: 4 }}>
            Live Vehicle Data ({filteredVehicles.length})
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>Real-time telemetry from OBD-II and Smartcar API</div>
        </div>
        <table style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0
        }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Vehicle</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Source</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Odometer</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Fuel/SOC</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>DTCs</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--muted, #94a3b8)', fontSize: 14 }}>
                  No vehicles found. Connect OBD-II devices or authorize Smartcar access.
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle, idx) => (
                <tr
                  key={vehicle.id}
                  style={{
                    cursor: 'pointer',
                    borderBottom: idx < filteredVehicles.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}
                  onClick={() => push({ type: 'vehicle', label: vehicle.vehicleNumber, data: { vehicleId: vehicle.vehicleId, vehicleNumber: vehicle.vehicleNumber } })}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text, #f1f5f9)' }}>{vehicle.vehicleNumber}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 2 }}>
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </div>
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    {getDataSourceBadge(vehicle.dataSource)}
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <StatusChip
                      status={vehicle.connected ? 'good' : 'bad'}
                      label={vehicle.connected ? 'CONNECTED' : 'DISCONNECTED'}
                    />
                  </td>
                  <td style={{ padding: 16, fontSize: 14, color: 'var(--text, #f1f5f9)' }}>
                    {vehicle.liveData.odometer.toLocaleString()} mi
                  </td>
                  <td style={{ padding: 16, fontSize: 14, color: 'var(--text, #f1f5f9)' }}>
                    {vehicle.liveData.stateOfCharge !== undefined
                      ? `${vehicle.liveData.stateOfCharge}% SOC`
                      : `${vehicle.liveData.fuelLevel}% Fuel`}
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    {vehicle.dtcCodes.length > 0 ? (
                      <StatusChip
                        status={vehicle.dtcCodes[0].severity === 'critical' ? 'bad' : vehicle.dtcCodes[0].severity === 'warning' ? 'warn' : 'info'}
                        label={`${vehicle.dtcCodes.length} Code${vehicle.dtcCodes.length > 1 ? 's' : ''}`}
                      />
                    ) : (
                      <StatusChip status="good" label="NO ISSUES" />
                    )}
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewDetails(vehicle)
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(96,165,250,0.15)',
                        color: 'var(--text, #f1f5f9)',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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