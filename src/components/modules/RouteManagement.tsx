import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapTrifold,
  Plus,
  MapPin,
  Clock,
  Path,
  TrendUp,
  Warning,
  CheckCircle
} from "@phosphor-icons/react"
import { UniversalMap } from "@/components/UniversalMap"
import { MetricCard } from "@/components/MetricCard"
import { useFleetData } from "@/hooks/use-fleet-data"
import { toast } from "sonner"

interface Route {
  id: string
  name: string
  vehicleId: string
  vehicleNumber: string
  driver: string
  startLocation: string
  endLocation: string
  waypoints: string[]
  distance: number
  estimatedTime: number
  status: "planned" | "active" | "completed" | "cancelled"
  scheduledStart: string
  scheduledEnd: string
  actualStart?: string
  actualEnd?: string
  efficiency: number
}

interface RouteManagementProps {
  data: ReturnType<typeof useFleetData>
}

export function RouteManagement({ data }: RouteManagementProps) {
  const fleetData = useFleetData()
  const allVehicles = fleetData.vehicles || []
  const facilities = fleetData.facilities || []

  const [routes, setRoutes] = useState<Route[]>([])
  const [activeTab, setActiveTab] = useState<string>("active")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [routeName, setRouteName] = useState("")
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [driver, setDriver] = useState("")
  const [startLocation, setStartLocation] = useState("")
  const [endLocation, setEndLocation] = useState("")
  const [scheduledStart, setScheduledStart] = useState("")

  const vehicles = data.vehicles || []
  const drivers = data.drivers || []

  const metrics = useMemo(() => {
    const routeList = routes || []
    const activeRoutes = routeList.filter(r => r.status === "active")
    const completedToday = routeList.filter(r => 
      r.status === "completed" && 
      r.actualEnd && 
      new Date(r.actualEnd).toDateString() === new Date().toDateString()
    )
    const totalDistance = routeList.reduce((sum, r) => sum + r.distance, 0)
    const avgEfficiency = routeList.length > 0 
      ? routeList.reduce((sum, r) => sum + r.efficiency, 0) / routeList.length 
      : 0

    return {
      active: activeRoutes.length,
      completedToday: completedToday.length,
      totalDistance: Math.round(totalDistance),
      avgEfficiency: Math.round(avgEfficiency)
    }
  }, [routes])

  const handleCreateRoute = () => {
    if (!routeName || !selectedVehicle || !driver || !startLocation || !endLocation || !scheduledStart) {
      toast.error("Please fill in all required fields")
      return
    }

    const vehicle = vehicles.find(v => v.id === selectedVehicle)
    if (!vehicle) return

    const distance = Math.floor(Math.random() * 150 + 20)
    const estimatedTime = Math.floor(distance / 45 * 60)

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: routeName,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.number,
      driver,
      startLocation,
      endLocation,
      waypoints: [],
      distance,
      estimatedTime,
      status: "planned",
      scheduledStart,
      scheduledEnd: new Date(new Date(scheduledStart).getTime() + estimatedTime * 60000).toISOString(),
      efficiency: 95
    }

    setRoutes(current => [...(current || []), newRoute])
    toast.success("Route created successfully")

    setDialogOpen(false)
    setRouteName("")
    setSelectedVehicle("")
    setDriver("")
    setStartLocation("")
    setEndLocation("")
    setScheduledStart("")
  }

  const handleUpdateStatus = (id: string, status: Route["status"]) => {
    setRoutes(current => 
      (current || []).map(r => {
        if (r.id === id) {
          const updates: Partial<Route> = { status }
          if (status === "active" && !r.actualStart) {
            updates.actualStart = new Date().toISOString()
          }
          if (status === "completed" && !r.actualEnd) {
            updates.actualEnd = new Date().toISOString()
          }
          return { ...r, ...updates }
        }
        return r
      })
    )
    toast.success(`Route ${status}`)
  }

  const getStatusColor = (status: Route["status"]) => {
    const colors = {
      planned: "bg-muted text-muted-foreground",
      active: "bg-accent/10 text-accent border-accent/20",
      completed: "bg-success/10 text-success border-success/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20"
    }
    return colors[status]
  }

  const filteredRoutes = useMemo(() => {
    const routeList = routes || []
    switch (activeTab) {
      case "active":
        return routeList.filter(r => r.status === "active")
      case "planned":
        return routeList.filter(r => r.status === "planned")
      case "completed":
        return routeList.filter(r => r.status === "completed")
      case "all":
      default:
        return routeList
    }
  }, [routes, activeTab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Route Management</h1>
          <p className="text-muted-foreground mt-1">Plan, optimize, and track delivery routes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Route</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Route Name</Label>
                  <Input 
                    placeholder="e.g., Downtown Delivery Route" 
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.number} - {v.make} {v.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Driver</Label>
                  <Select value={driver} onValueChange={setDriver}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheduled Start</Label>
                  <Input 
                    type="datetime-local" 
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Start Location</Label>
                <Input 
                  placeholder="Starting address" 
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Location</Label>
                <Input 
                  placeholder="Destination address" 
                  value={endLocation}
                  onChange={(e) => setEndLocation(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRoute}>
                  Create Route
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Routes"
          value={metrics.active}
          subtitle="in progress"
          icon={<Path className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Completed Today"
          value={metrics.completedToday}
          subtitle="routes finished"
          icon={<CheckCircle className="w-5 h-5" />}
          status="success"
        />
        <MetricCard
          title="Total Distance"
          value={`${metrics.totalDistance}mi`}
          subtitle="all routes"
          icon={<MapPin className="w-5 h-5" />}
          status="info"
        />
        <MetricCard
          title="Avg Efficiency"
          value={`${metrics.avgEfficiency}%`}
          subtitle="route completion"
          icon={<TrendUp className="w-5 h-5" />}
          status="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Visualization</CardTitle>
          <CardDescription>
            View routes and vehicle locations on map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <UniversalMap
              vehicles={allVehicles}
              facilities={facilities}
              showVehicles={true}
              showFacilities={true}
              showRoutes={true}
              mapStyle="road"
              className="w-full h-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="planned">Planned</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Routes</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {(filteredRoutes || []).length === 0 ? (
            <div className="text-center py-12">
              <MapTrifold className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No routes found. Create your first route to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(filteredRoutes || []).map(route => (
                <div 
                  key={route.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{route.name}</h3>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vehicle: {route.vehicleNumber}</p>
                        <p className="text-muted-foreground">Driver: {route.driver}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Distance: {route.distance} mi</p>
                        <p className="text-muted-foreground">Est. Time: {route.estimatedTime} min</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {route.startLocation} → {route.endLocation}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {route.status === "planned" && (
                      <Button size="sm" onClick={() => handleUpdateStatus(route.id, "active")}>
                        Start Route
                      </Button>
                    )}
                    {route.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(route.id, "completed")}>
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
