import React, { useState, useMemo, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Clock,
  Route,
  Truck,
  Package,
  Map as MapIcon,
  Filter,
  Settings
} from "lucide-react"
import { useVehicles, useDrivers, useTasks, useRoutes, useGeofences } from "@/hooks/use-api"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { cn } from "@/lib/utils"

// Map component placeholder (would integrate with Leaflet/Mapbox)
const MapView = ({ layers, onEntitySelect, selectedEntity }) => {
  return (
    <div className="relative h-full w-full bg-slate-100 dark:bg-slate-900">
      {/* Map implementation would go here */}
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <MapIcon className="h-12 w-12 mr-2" />
        <span>Map View Loading...</span>
      </div>

      {/* Layer controls */}
      <div className="absolute top-4 right-4 bg-background/95 backdrop-blur rounded-lg p-2 shadow-lg">
        <div className="flex flex-col gap-1">
          {Object.entries(layers).map(([key, layer]) => (
            <Button
              key={key}
              variant={layer.visible ? "default" : "outline"}
              size="sm"
              className="justify-start"
            >
              {key === 'vehicle' && <Truck className="h-4 w-4 mr-2" />}
              {key === 'route' && <Route className="h-4 w-4 mr-2" />}
              {key === 'geofence' && <MapPin className="h-4 w-4 mr-2" />}
              {key === 'event' && <AlertCircle className="h-4 w-4 mr-2" />}
              {key === 'traffic' && <Navigation className="h-4 w-4 mr-2" />}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Contextual panel for vehicle information
const VehiclePanel = ({ vehicle, telemetry }) => {
  const { push } = useDrilldown()

  if (!vehicle) {
    return (
      <div className="p-4 text-muted-foreground">
        Select a vehicle on the map to view details
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{vehicle.make} {vehicle.model}</h3>
          <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="flex items-center mt-1">
              {vehicle.status === 'active' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
              )}
              <span className="font-medium capitalize">{vehicle.status}</span>
            </div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Speed</div>
            <div className="font-medium">{telemetry?.speed || 0} mph</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Fuel</div>
            <div className="font-medium">{vehicle.fuelLevel}%</div>
          </Card>

          <Card className="p-3">
            <div className="text-sm text-muted-foreground">Location</div>
            <div className="font-medium truncate">{telemetry?.location || "Unknown"}</div>
          </Card>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            onClick={() => push({
              id: `vehicle-${vehicle.id}`,
              type: 'vehicle',
              label: `${vehicle.make} ${vehicle.model}`,
              data: vehicle
            })}
          >
            View Full Details
          </Button>
          <Button variant="outline" className="w-full">
            Assign Task
          </Button>
          <Button variant="outline" className="w-full">
            View Route History
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Task panel component
const TaskPanel = ({ tasks, onTaskSelect }) => {
  const getTaskIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />
      default: return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Active Tasks</h3>
        {tasks?.map(task => (
          <Card
            key={task.id}
            className="p-3 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onTaskSelect(task)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {getTaskIcon(task.status)}
                  <span className="font-medium">{task.title}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{task.priority}</Badge>
                  {task.assignedVehicle && (
                    <Badge variant="secondary">
                      <Truck className="h-3 w-3 mr-1" />
                      {task.assignedVehicle}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Route panel component
const RoutePanel = ({ routes, onRouteSelect }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Active Routes</h3>
        {routes?.map(route => (
          <Card
            key={route.id}
            className="p-3 cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onRouteSelect(route)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{route.name}</div>
                <div className="text-sm text-muted-foreground">
                  {route.stops} stops • {route.distance} miles
                </div>
              </div>
              <Badge variant={route.status === 'active' ? 'default' : 'secondary'}>
                {route.status}
              </Badge>
            </div>
          </Card>
        ))}

        <Button className="w-full mt-4">
          <Route className="h-4 w-4 mr-2" />
          Optimize Routes
        </Button>
      </div>
    </ScrollArea>
  )
}

// Main Operations Workspace Component
export function OperationsWorkspace({ data }) {
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [activePanel, setActivePanel] = useState('vehicle')
  const [mapLayers, setMapLayers] = useState({
    vehicle: { visible: true },
    route: { visible: true },
    geofence: { visible: true },
    event: { visible: true },
    traffic: { visible: false }
  })

  // API hooks
  const { data: vehicles } = useVehicles()
  const { data: tasks } = useTasks()
  const { data: routes } = useRoutes()
  const { data: drivers } = useDrivers()
  const { data: geofences } = useGeofences()

  // Real-time telemetry for selected vehicle
  const telemetry = useVehicleTelemetry(
    selectedEntity?.type === 'vehicle' ? selectedEntity?.data?.id : null
  )

  // Handle entity selection from map
  const handleEntitySelect = useCallback((entity) => {
    setSelectedEntity(entity)
    if (entity?.type === 'vehicle') {
      setActivePanel('vehicle')
    } else if (entity?.type === 'task') {
      setActivePanel('task')
    } else if (entity?.type === 'route') {
      setActivePanel('route')
    }
  }, [])

  // Toggle map layer visibility
  const toggleLayer = useCallback((layerKey) => {
    setMapLayers(prev => ({
      ...prev,
      [layerKey]: { ...prev[layerKey], visible: !prev[layerKey].visible }
    }))
  }, [])

  // Prepare map data
  const mapData = useMemo(() => ({
    vehicles: mapLayers.vehicle.visible ? vehicles : [],
    routes: mapLayers.route.visible ? routes : [],
    tasks: mapLayers.event.visible ? tasks : [],
    geofences: mapLayers.geofence.visible ? geofences : [],
    traffic: mapLayers.traffic.visible ? {} : null
  }), [vehicles, routes, tasks, geofences, mapLayers])

  return (
    <div className="h-screen grid grid-cols-[1fr_400px]">
      {/* Map Section */}
      <div className="relative h-full">
        <MapView
          layers={mapLayers}
          data={mapData}
          onEntitySelect={handleEntitySelect}
          selectedEntity={selectedEntity}
        />

        {/* Map Controls Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg">
          <div className="p-3 space-y-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search vehicles..."
              className="w-48"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{vehicles?.length || 0}</span> vehicles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{tasks?.filter(t => t.status === 'pending').length || 0}</span> pending tasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{routes?.filter(r => r.status === 'active').length || 0}</span> active routes
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Panel Section */}
      <div className="border-l bg-background">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="h-full flex flex-col">
          <TabsList className="w-full rounded-none justify-start px-2">
            <TabsTrigger value="vehicle" className="flex-1">
              <Truck className="h-4 w-4 mr-2" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="task" className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="route" className="flex-1">
              <Route className="h-4 w-4 mr-2" />
              Routes
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="vehicle" className="h-full m-0">
              <VehiclePanel
                vehicle={selectedEntity?.type === 'vehicle' ? selectedEntity.data : null}
                telemetry={telemetry}
              />
            </TabsContent>

            <TabsContent value="task" className="h-full m-0">
              <TaskPanel
                tasks={tasks}
                onTaskSelect={(task) => handleEntitySelect({ type: 'task', data: task })}
              />
            </TabsContent>

            <TabsContent value="route" className="h-full m-0">
              <RoutePanel
                routes={routes}
                onRouteSelect={(route) => handleEntitySelect({ type: 'route', data: route })}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}