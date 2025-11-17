import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  MagnifyingGlass,
  Lightning,
  BatteryCharging,
  MapPin,
  Clock,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Leaf
} from "@phosphor-icons/react"
import { toast } from "sonner"

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

export function EVChargingManagement() {
  const [stations, setStations] = useState<ChargingStation[]>([])
  const [sessions, setSessions] = useState<ChargingSession[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddStationOpen, setIsAddStationOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null)

  const [newStation, setNewStation] = useState<Partial<ChargingStation>>({
    name: "",
    stationType: "depot",
    chargerType: "level-2",
    powerOutput: 7.2,
    connectorType: ["J1772"],
    available: true,
    occupied: false,
    status: "online"
  })

  const filteredSessions = (sessions || []).filter(session => {
    const matchesSearch =
      session.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.stationName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || session.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const handleSaveStation = () => {
    if (!newStation.name || !newStation.location?.address) {
      toast.error("Please fill in required fields")
      return
    }

    const station: ChargingStation = {
      id: selectedStation?.id || `station-${Date.now()}`,
      tenantId: "tenant-demo",
      name: newStation.name,
      location: newStation.location as ChargingStation["location"],
      stationType: newStation.stationType as ChargingStation["stationType"],
      networkProvider: newStation.networkProvider,
      chargerType: newStation.chargerType as ChargingStation["chargerType"],
      powerOutput: newStation.powerOutput || 7.2,
      connectorType: newStation.connectorType || ["J1772"],
      available: newStation.available !== false,
      occupied: newStation.occupied || false,
      totalSessions: selectedStation?.totalSessions || 0,
      totalEnergyDelivered: selectedStation?.totalEnergyDelivered || 0,
      status: newStation.status as ChargingStation["status"]
    }

    if (selectedStation) {
      setStations(current => (current || []).map(s => (s.id === station.id ? station : s)))
      toast.success("Station updated successfully")
    } else {
      setStations(current => [...(current || []), station])
      toast.success("Station added successfully")
    }

    setIsAddStationOpen(false)
    resetForm()
  }

  const handleEndSession = (sessionId: string) => {
    setSessions(current =>
      (current || []).map(s =>
        s.id === sessionId
          ? {
              ...s,
              status: "completed" as const,
              endTime: new Date().toISOString(),
              endSOC: s.startSOC + 50,
              duration: 45
            }
          : s
      )
    )
    toast.success("Charging session completed")
  }

  const resetForm = () => {
    setSelectedStation(null)
    setNewStation({
      name: "",
      stationType: "depot",
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

  // Mock sample data
  const mockStations: ChargingStation[] = [
    {
      id: "st-1",
      tenantId: "tenant-demo",
      name: "Main Depot - Station 1",
      location: {
        address: "123 Fleet St, Tampa, FL",
        lat: 27.9506,
        lng: -82.4572
      },
      stationType: "depot",
      networkProvider: "ChargePoint",
      chargerType: "level-2",
      powerOutput: 7.2,
      connectorType: ["J1772", "CCS"],
      available: true,
      occupied: false,
      totalSessions: 145,
      totalEnergyDelivered: 2340,
      status: "online"
    },
    {
      id: "st-2",
      tenantId: "tenant-demo",
      name: "Main Depot - Station 2",
      location: {
        address: "123 Fleet St, Tampa, FL",
        lat: 27.9506,
        lng: -82.4572
      },
      stationType: "depot",
      networkProvider: "ChargePoint",
      chargerType: "dc-fast",
      powerOutput: 50,
      connectorType: ["CCS", "CHAdeMO"],
      available: true,
      occupied: true,
      currentSession: "ses-1",
      totalSessions: 89,
      totalEnergyDelivered: 1890,
      status: "online"
    }
  ]

  const mockSessions: ChargingSession[] = [
    {
      id: "ses-1",
      tenantId: "tenant-demo",
      vehicleId: "veh-ev1",
      vehicleNumber: "EV-1001",
      driverId: "drv-1",
      driverName: "John Smith",
      stationId: "st-2",
      stationName: "Main Depot - Station 2",
      startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      energyDelivered: 25.5,
      cost: 8.92,
      startSOC: 15,
      status: "active",
      smartCharging: true,
      tariffType: "tou",
      peakDemandCharge: 2.50,
      carbonOffset: 12.5
    },
    {
      id: "ses-2",
      tenantId: "tenant-demo",
      vehicleId: "veh-ev2",
      vehicleNumber: "EV-1002",
      driverId: "drv-2",
      driverName: "Sarah Johnson",
      stationId: "st-1",
      stationName: "Main Depot - Station 1",
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
      duration: 120,
      energyDelivered: 45.3,
      cost: 12.85,
      startSOC: 10,
      endSOC: 95,
      status: "completed",
      smartCharging: true,
      tariffType: "tou",
      peakDemandCharge: 0,
      carbonOffset: 22.3
    }
  ]

  // Initialize with mock data if empty
  if ((stations || []).length === 0 && mockStations.length > 0) {
    setStations(mockStations)
  }
  if ((sessions || []).length === 0 && mockSessions.length > 0) {
    setSessions(mockSessions)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">EV Charging Management</h2>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Stations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStations}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Lightning className="w-3 h-3" />
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
            <div className="text-2xl font-bold text-green-600">{availableStations}</div>
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
            <div className="text-2xl font-bold text-blue-600">{activeSessions}</div>
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
            <div className="text-2xl font-bold text-green-600">{totalCarbon.toFixed(1)} kg</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Leaf className="w-3 h-3" />
              CO2 saved
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
                      <Lightning className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">{station.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getChargerTypeLabel(station.chargerType)} • {station.powerOutput} kW
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(station.status)} variant="secondary">
                      {station.status}
                    </Badge>
                    {station.occupied && (
                      <div className="text-xs text-muted-foreground mt-1">In use</div>
                    )}
                  </div>
                </div>
              ))}
              {(stations || []).length === 0 && (
                <div className="text-center text-muted-foreground py-8">
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Total Energy Delivered</span>
                </div>
                <span className="text-lg font-bold">{totalEnergy.toFixed(1)} kWh</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CurrencyDollar className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Total Cost</span>
                </div>
                <span className="text-lg font-bold">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">Carbon Offset</span>
                </div>
                <span className="text-lg font-bold">{totalCarbon.toFixed(1)} kg CO2</span>
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

      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                        <BatteryCharging className="w-3 h-3 text-blue-600" />
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
