import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Route,
  Truck,
  Package
} from "lucide-react"
import React, { useState, useMemo, useCallback } from "react"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useVehicles, useDrivers, useRoutes, useFacilities, useWorkOrders } from "@/hooks/use-api"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { Vehicle } from "@/lib/types"

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
export function OperationsWorkspace({ data }: { data?: any }) {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null)
  const [activePanel, setActivePanel] = useState('vehicle')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: tasks = [] } = useWorkOrders() // Using work orders as tasks
  const { data: routes = [] } = useRoutes()
  const { data: drivers = [] } = useDrivers()
  const { data: facilities = [] } = useFacilities()
  // Note: Geofences not implemented in use-api yet, using empty array
  const geofences: any[] = []

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

  // Filter vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    return displayVehicles.filter((v: Vehicle) => {
      const matchesSearch = !searchQuery ||
        v.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || v.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [displayVehicles, searchQuery, statusFilter])

  // Handle vehicle selection from map
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    const vehicle = displayVehicles.find((v: Vehicle) => v.id === vehicleId)
    if (vehicle) {
      setSelectedEntity({ type: 'vehicle', data: vehicle })
      setActivePanel('vehicle')
    }
  }, [displayVehicles])

  // Handle entity selection
  const handleEntitySelect = useCallback((entity: { type: string; data: any }) => {
    setSelectedEntity(entity)
    if (entity?.type === 'vehicle') {
      setActivePanel('vehicle')
    } else if (entity?.type === 'task') {
      setActivePanel('task')
    } else if (entity?.type === 'route') {
      setActivePanel('route')
    }
  }, [])

  return (
    <div className="h-screen grid grid-cols-[1fr_400px]" data-testid="operations-workspace">
      {/* Map Section */}
      <div className="relative h-full">
        <ProfessionalFleetMap
          vehicles={filteredVehicles as Vehicle[]}
          facilities={facilities}
          height="100vh"
          onVehicleSelect={handleVehicleSelect}
          showLegend={true}
          enableRealTime={isRealtimeConnected}
        />

        {/* Map Controls Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg z-10">
          <div className="p-3 space-y-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="ops-status-filter">
                <SelectValue placeholder="Filter vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="service">In Maintenance</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search vehicles..."
              className="w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="ops-search-input"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-4 left-4 right-[420px] bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-2" data-testid="ops-vehicle-count">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{displayVehicles?.length || 0}</span> vehicles
                </span>
              </div>
              <div className="flex items-center gap-2" data-testid="ops-task-count">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{tasks?.filter((t: any) => t.status === 'pending').length || 0}</span> pending tasks
                </span>
              </div>
              <div className="flex items-center gap-2" data-testid="ops-route-count">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{routes?.filter((r: any) => r.status === 'active').length || 0}</span> active routes
                </span>
              </div>
            </div>

            {isRealtimeConnected && (
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Data
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Panel Section */}
      <div className="border-l bg-background" data-testid="ops-contextual-panel">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="h-full flex flex-col">
          <TabsList className="w-full rounded-none justify-start px-2">
            <TabsTrigger value="vehicle" className="flex-1" data-testid="ops-tab-vehicle">
              <Truck className="h-4 w-4 mr-2" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="task" className="flex-1" data-testid="ops-tab-task">
              <Package className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="route" className="flex-1" data-testid="ops-tab-route">
              <Route className="h-4 w-4 mr-2" />
              Routes
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="vehicle" className="h-full m-0" data-testid="ops-panel-vehicle">
              <VehiclePanel
                vehicle={selectedEntity?.type === 'vehicle' ? selectedEntity.data : null}
                telemetry={null}
              />
            </TabsContent>

            <TabsContent value="task" className="h-full m-0" data-testid="ops-panel-task">
              <TaskPanel
                tasks={tasks}
                onTaskSelect={(task: any) => handleEntitySelect({ type: 'task', data: task })}
              />
            </TabsContent>

            <TabsContent value="route" className="h-full m-0" data-testid="ops-panel-route">
              <RoutePanel
                routes={routes}
                onRouteSelect={(route: any) => handleEntitySelect({ type: 'route', data: route })}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}