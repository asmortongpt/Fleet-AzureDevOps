import {
  Plus,
  Search,
  Zap,
  BatteryCharging,
  DollarSign,
  CheckCircle,
  Leaf
} from "lucide-react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { usePolicies } from "@/contexts/PolicyContext"
import {
  enforceEVChargingPolicy,
  shouldBlockAction,
  getApprovalRequirements
} from "@/lib/policy-engine/policy-enforcement"


interface ChargingStation {
  id: string
  tenantId: string
  name: string
  location: {
    address: string
    lat: number
    lng: number
  }
  stationType: "depot" | "public" | "home"
  networkProvider?: string
  chargerType: "level-1" | "level-2" | "dc-fast"
  powerOutput: number // kW
  connectorType: string[]
  available: boolean
  occupied: boolean
  currentSession?: string
  totalSessions: number
  totalEnergyDelivered: number // kWh
  status: "online" | "offline" | "maintenance"
}

interface ChargingSession {
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  driverId?: string
  driverName?: string
  stationId: string
  stationName: string
  startTime: string
  endTime?: string
  duration?: number // minutes
  energyDelivered: number // kWh
  cost: number
  startSOC: number // % state of charge
  endSOC?: number // %
  peakDemandCharge: number
  status: "active" | "completed" | "interrupted" | "scheduled"
  scheduledFor?: string
  smartCharging: boolean
  tariffType: "tou" | "flat" | "demand"
  carbonOffset: number // kg CO2
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((r) => r.json())
    .then((data) => data?.data?.data ?? data?.data ?? data)

export function EVChargingManagement() {
  const { policies } = usePolicies()
  const { data: rawStations, mutate: mutateStations } = useSWR<any[]>(
    "/api/charging-stations?limit=200",
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: rawSessions, mutate: mutateSessions } = useSWR<any[]>(
    "/api/charging-sessions?limit=200",
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: vehicles = [] } = useSWR<any[]>(
    "/api/vehicles?limit=200",
    fetcher,
    { shouldRetryOnError: false }
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddStationOpen, setIsAddStationOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null)
  const [isStartingSession, setIsStartingSession] = useState(false)

  const [newStation, setNewStation] = useState<Partial<ChargingStation>>({
    name: "",
    stationType: "depot",
    location: { address: "", lat: 0, lng: 0 },
    chargerType: "level-2",
    powerOutput: 7.2,
    connectorType: ["J1772"],
    available: true,
    occupied: false,
    status: "online"
  })

  const sessions = useMemo<ChargingSession[]>(() => {
    return (rawSessions || []).map((session: any) => {
      const metadata = session.metadata || {}
      const status = session.status === "in_progress" ? "active" : session.status
      return {
        id: session.id,
        tenantId: session.tenant_id,
        vehicleId: session.vehicle_id,
        vehicleNumber: session.vehicle_number || `${session.make || ''} ${session.model || ''}`.trim() || session.vehicle_id,
        driverId: session.driver_id,
        driverName: session.first_name ? `${session.first_name} ${session.last_name || ''}`.trim() : undefined,
        stationId: session.station_id,
        stationName: session.station_name || "Charging Station",
        startTime: session.start_time,
        endTime: session.end_time || undefined,
        duration: session.duration_minutes ?? undefined,
        energyDelivered: Number(session.energy_delivered_kwh || 0),
        cost: Number(session.cost || 0),
        startSOC: Number(session.start_soc_percent || 0),
        endSOC: session.end_soc_percent != null ? Number(session.end_soc_percent) : undefined,
        status: status || "active",
        smartCharging: Boolean(metadata.smart_charging),
        tariffType: metadata.tariff_type || "flat",
        peakDemandCharge: Number(metadata.peak_demand_charge || 0),
        carbonOffset: Number(metadata.carbon_offset || (session.energy_delivered_kwh || 0) * 0.45)
      } as ChargingSession
    })
  }, [rawSessions])

  const stations = useMemo<ChargingStation[]>(() => {
    return (rawStations || []).map((station: any) => {
      const metadata = station.metadata || {}
      const numberOfPorts = Number(station.number_of_ports || 0)
      const availablePorts = Number(station.available_ports ?? station.number_of_ports ?? 0)
      const stationSessions = sessions.filter(s => s.stationId === station.id)
      const totalEnergyDelivered = stationSessions.reduce((sum, s) => sum + s.energyDelivered, 0)
      const chargerType =
        metadata.charger_type ||
        (station.max_power_kw >= 50 ? "dc-fast" : station.max_power_kw >= 7 ? "level-2" : "level-1")

      return {
        id: station.id,
        tenantId: station.tenant_id,
        name: station.name,
        location: {
          address: station.address || "",
          lat: Number(station.latitude),
          lng: Number(station.longitude)
        },
        stationType: station.type || "depot",
        networkProvider: metadata.network_provider,
        chargerType,
        powerOutput: Number(station.max_power_kw || 0),
        connectorType: metadata.connector_type || ["J1772"],
        available: availablePorts > 0,
        occupied: numberOfPorts > 0 ? availablePorts < numberOfPorts : false,
        currentSession: stationSessions.find(s => s.status === "active")?.id,
        totalSessions: stationSessions.length,
        totalEnergyDelivered,
        status: station.status === "active" ? "online" : station.status || "online"
      } as ChargingStation
    })
  }, [rawStations, sessions])

  const filteredSessions = (sessions || []).filter(session => {
    const matchesSearch =
      session.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.stationName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || session.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleSaveStation = async () => {
    const hasCoords =
      Number.isFinite(newStation.location?.lat) &&
      Number.isFinite(newStation.location?.lng)

    if (!newStation.name || !newStation.location?.address || !hasCoords) {
      toast.error("Please fill in required fields")
      return
    }

    const payload = {
      name: newStation.name,
      type: newStation.stationType,
      latitude: newStation.location?.lat,
      longitude: newStation.location?.lng,
      address: newStation.location?.address,
      number_of_ports: newStation.occupied ? 0 : 1,
      available_ports: newStation.available === false ? 0 : 1,
      max_power_kw: newStation.powerOutput || 7.2,
      is_public: newStation.stationType === "public",
      status: newStation.status || "online",
      metadata: {
        charger_type: newStation.chargerType,
        connector_type: newStation.connectorType,
        network_provider: newStation.networkProvider
      }
    }

    try {
      const response = await fetch(
        selectedStation ? `/api/charging-stations/${selectedStation.id}` : "/api/charging-stations",
        {
          method: selectedStation ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error("Failed to save station")
      }

      toast.success(selectedStation ? "Station updated successfully" : "Station added successfully")
      setIsAddStationOpen(false)
      resetForm()
      mutateStations()
    } catch {
      toast.error("Failed to save station")
    }
  }

  // Handler for starting charging sessions with policy enforcement
  const handleStartChargingSession = async (stationId: string) => {
    setIsStartingSession(true)

    try {
      const vehicle =
        vehicles.find((v: any) => v.fuelType === "electric" || v.fuel_type === "electric") || vehicles[0]

      if (!vehicle) {
        toast.error("No vehicles available to start a session")
        setIsStartingSession(false)
        return
      }

      const chargingData = {
        vehicleId: vehicle.id,
        batteryLevel: Number(vehicle.fuelLevel ?? vehicle.fuel_level ?? 50),
        chargingStationId: stationId,
        requestedPower: 50
      }

      // Enforce EV charging policy before allowing session start
      const result = await enforceEVChargingPolicy(policies, chargingData)

      // Check if action should be blocked
      if (shouldBlockAction(result)) {
        toast.error("Policy Violation", {
          description: "This charging session cannot be started without resolving policy violations"
        })
        setIsStartingSession(false)
        return
      }

      // Check if approval is required
      const approvalReq = getApprovalRequirements(result)
      if (approvalReq.required) {
        toast.warning(`${approvalReq.level?.toUpperCase()} Approval Required`, {
          description: approvalReq.reason
        })
        // In real implementation, route to approval workflow
      }

      // If we reach here, either policy allows it or requires approval
      if (result.allowed) {
        toast.success("Charging Session Started", {
          description: approvalReq.required
            ? "Session submitted for approval"
            : "Charging session started successfully"
        })
        await fetch("/api/charging-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            vehicle_id: vehicle.id,
            driver_id: vehicle.assignedDriverId || null,
            station_id: stationId,
            start_time: new Date().toISOString(),
            start_soc_percent: chargingData.batteryLevel,
            energy_delivered_kwh: 0,
            cost: 0,
            status: "in_progress",
            metadata: {
              smart_charging: true,
              tariff_type: "flat"
            }
          })
        })
        mutateSessions()
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to validate charging session against policies"
      })
    } finally {
      setIsStartingSession(false)
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId)
      if (!session) return

      await fetch(`/api/charging-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          end_time: new Date().toISOString(),
          duration_minutes: session.duration || 60,
          end_soc_percent: Math.min(100, (session.startSOC || 0) + 70),
          status: "completed",
          energy_delivered_kwh: session.energyDelivered || 0,
          cost: session.cost || 0
        })
      })
      toast.success("Charging session completed")
      mutateSessions()
    } catch {
      toast.error("Failed to complete session")
    }
  }

  const resetForm = () => {
    setSelectedStation(null)
    setNewStation({
      name: "",
      stationType: "depot",
      location: { address: "", lat: 0, lng: 0 },
      chargerType: "level-2",
      powerOutput: 7.2,
      connectorType: ["J1772"],
      available: true,
      occupied: false,
      status: "online"
    })
  }

  const getChargerTypeLabel = (type: ChargingStation["chargerType"]) => {
    const labels = {
      "level-1": "Level 1 (120V)",
      "level-2": "Level 2 (240V)",
      "dc-fast": "DC Fast Charge"
    }
    return labels[type]
  }

  const getStatusColor = (status: ChargingStation["status"]) => {
    const colors = {
      online: "bg-green-100 text-green-700",
      offline: "bg-gray-100 text-gray-700",
      maintenance: "bg-yellow-100 text-yellow-700"
    }
    return colors[status]
  }

  const getSessionStatusColor = (status: ChargingSession["status"]) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      completed: "bg-blue-100 text-blue-700",
      interrupted: "bg-red-100 text-red-700",
      scheduled: "bg-yellow-100 text-yellow-700"
    }
    return colors[status]
  }

  const totalStations = (stations || []).length
  const availableStations = (stations || []).filter(s => s.available && !s.occupied && s.status === "online").length
  const activeSessions = (sessions || []).filter(s => s.status === "active").length
  const totalEnergy = (sessions || []).filter(s => s.status === "completed").reduce((sum, s) => sum + s.energyDelivered, 0)
  const totalCost = (sessions || []).filter(s => s.status === "completed").reduce((sum, s) => sum + s.cost, 0)
  const totalCarbon = (sessions || []).filter(s => s.status === "completed").reduce((sum, s) => sum + s.carbonOffset, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">EV Charging Management</h2>
          <p className="text-muted-foreground">
            Smart charging with OCPP protocol, tariff optimization, and carbon tracking
          </p>
        </div>
        <Dialog open={isAddStationOpen} onOpenChange={setIsAddStationOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Station
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Charging Station</DialogTitle>
              <DialogDescription>
                Register a new EV charging station for your fleet
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="station-name">Station Name *</Label>
                  <Input
                    id="station-name"
                    value={newStation.name}
                    onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                    placeholder="Main Depot - Station 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="station-type">Station Type</Label>
                  <Select
                    value={newStation.stationType}
                    onValueChange={value =>
                      setNewStation({ ...newStation, stationType: value as ChargingStation["stationType"] })
                    }
                  >
                    <SelectTrigger id="station-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="depot">Depot</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Location Address *</Label>
                <Input
                  id="address"
                  value={newStation.location?.address}
                  onChange={e =>
                    setNewStation({
                      ...newStation,
                      location: { ...newStation.location!, address: e.target.value }
                    })
                  }
                  placeholder="123 Fleet St, Tampa, FL"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    value={newStation.location?.lat}
                    onChange={e =>
                      setNewStation({
                        ...newStation,
                        location: {
                          ...newStation.location!,
                          lat: parseFloat(e.target.value)
                        }
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={newStation.location?.lng}
                    onChange={e =>
                      setNewStation({
                        ...newStation,
                        location: {
                          ...newStation.location!,
                          lng: parseFloat(e.target.value)
                        }
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="charger-type">Charger Type</Label>
                  <Select
                    value={newStation.chargerType}
                    onValueChange={value =>
                      setNewStation({ ...newStation, chargerType: value as ChargingStation["chargerType"] })
                    }
                  >
                    <SelectTrigger id="charger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="level-1">Level 1</SelectItem>
                      <SelectItem value="level-2">Level 2</SelectItem>
                      <SelectItem value="dc-fast">DC Fast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power-output">Power (kW)</Label>
                  <Input
                    id="power-output"
                    type="number"
                    step="0.1"
                    value={newStation.powerOutput}
                    onChange={e => setNewStation({ ...newStation, powerOutput: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">Network Provider</Label>
                  <Input
                    id="network"
                    value={newStation.networkProvider}
                    onChange={e => setNewStation({ ...newStation, networkProvider: e.target.value })}
                    placeholder="ChargePoint"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="available">Available for Use</Label>
                <Switch
                  id="available"
                  checked={newStation.available !== false}
                  onCheckedChange={checked => setNewStation({ ...newStation, available: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddStationOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStation}>Add Station</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{totalStations}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Zap className="w-3 h-3" />
              Registered
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-green-600">{availableStations}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3" />
              Ready to charge
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-blue-800">{activeSessions}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <BatteryCharging className="w-3 h-3" />
              Charging now
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Carbon Offset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-green-600">{totalCarbon.toFixed(1)} kg</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Leaf className="w-3 h-3" />
              CO2 saved
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>Charging Stations</CardTitle>
            <CardDescription>Fleet charging infrastructure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stations || []).map(station => (
                <div key={station.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-800" />
                      <span className="font-medium">{station.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getChargerTypeLabel(station.chargerType)} • {station.powerOutput} kW
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge className={getStatusColor(station.status)} variant="secondary">
                      {station.status}
                    </Badge>
                    {station.occupied ? (
                      <div className="text-xs text-muted-foreground mt-1">In use</div>
                    ) : station.available && station.status === "online" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs mt-1"
                        onClick={() => handleStartChargingSession(station.id)}
                        disabled={isStartingSession}
                      >
                        <BatteryCharging className="w-3 h-3 mr-1" />
                        {isStartingSession ? "Checking..." : "Start Charging"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
              {(stations || []).length === 0 && (
                <div className="text-center text-muted-foreground py-3">
                  No charging stations registered. Add your first station to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy & Cost Summary</CardTitle>
            <CardDescription>Completed charging sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-3 h-3 text-blue-800" />
                  <span className="text-sm font-medium">Total Energy Delivered</span>
                </div>
                <span className="text-sm font-bold">{totalEnergy.toFixed(1)} kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-green-600" />
                  <span className="text-sm font-medium">Total Cost</span>
                </div>
                <span className="text-sm font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-3 h-3 text-green-600" />
                  <span className="text-sm font-medium">Carbon Offset</span>
                </div>
                <span className="text-sm font-bold">{totalCarbon.toFixed(1)} kg CO2</span>
              </div>
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground">Average cost per kWh</div>
                <div className="text-sm font-medium">
                  ${totalEnergy > 0 ? (totalCost / totalEnergy).toFixed(2) : "0.00"}/kWh
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Charging Sessions ({filteredSessions.length})</CardTitle>
          <CardDescription>Active and historical charging activity</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle / Driver</TableHead>
                <TableHead>Station</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Energy</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-3">
                    No charging sessions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{session.vehicleNumber}</div>
                        <div className="text-sm text-muted-foreground">{session.driverName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{session.stationName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(session.startTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 text-blue-800" />
                        <span className="text-sm">{session.energyDelivered.toFixed(1)} kWh</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">${session.cost.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSessionStatusColor(session.status)} variant="secondary">
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEndSession(session.id)}
                        >
                          End
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default EVChargingManagement;
