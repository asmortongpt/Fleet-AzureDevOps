import React, { useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Truck,
  Building2,
  Settings,
  AlertCircle
} from "lucide-react"
import { useVehicles, useFacilities, useWorkOrders, useMaintenanceSchedules } from "@/hooks/use-api"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Vehicle } from "@/lib/types"
import { cn } from "@/lib/utils"

// Facility Panel Component
const FacilityPanel = ({ facilities, onFacilitySelect }) => {
  if (!facilities || facilities.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No facilities available
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Maintenance Facilities</h3>
        {facilities.map(facility => (
          <Card
            key={facility.id}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => onFacilitySelect(facility)}
            data-testid={`facility-card-${facility.id}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{facility.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{facility.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={facility.status === 'operational' ? 'default' : 'destructive'}>
                      {facility.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Capacity: {facility.capacity} vehicles
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}

// Vehicle Maintenance Panel
const VehicleMaintenancePanel = ({ vehicle, maintenanceHistory }) => {
  if (!vehicle) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a vehicle on the map to view maintenance details
      </div>
    )
  }

  const daysUntilService = vehicle.nextServiceMiles
    ? Math.floor((vehicle.nextServiceMiles - vehicle.mileage) / 50)
    : null

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Vehicle Header */}
        <div>
          <h3 className="text-lg font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-sm text-muted-foreground">
            {vehicle.licensePlate} • {vehicle.vin}
          </p>
        </div>

        {/* Maintenance Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Maintenance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Mileage</span>
              <span className="font-medium">{vehicle.mileage?.toLocaleString()} mi</span>
            </div>

            {vehicle.nextServiceMiles && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Service</span>
                  <span className="font-medium">{vehicle.nextServiceMiles.toLocaleString()} mi</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Service Due In</span>
                    <span className={cn(
                      "font-medium",
                      daysUntilService && daysUntilService < 7 ? "text-red-500" : "text-green-500"
                    )}>
                      {vehicle.nextServiceMiles - vehicle.mileage} mi
                    </span>
                  </div>
                  <Progress
                    value={(vehicle.mileage / vehicle.nextServiceMiles) * 100}
                    className="h-2"
                  />
                </div>
              </>
            )}

            {vehicle.maintenanceAlerts && vehicle.maintenanceAlerts.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Active Alerts
                </h4>
                {vehicle.maintenanceAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
          <Button variant="outline" className="w-full">
            <Wrench className="h-4 w-4 mr-2" />
            Request Maintenance
          </Button>
          <Button variant="outline" className="w-full">
            View Service History
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// Work Orders Panel
const WorkOrdersPanel = ({ workOrders, onWorkOrderSelect }) => {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h3 className="font-semibold mb-3">Work Orders</h3>
        {workOrders && workOrders.length > 0 ? (
          workOrders.map(order => (
            <Card
              key={order.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onWorkOrderSelect(order)}
              data-testid={`work-order-${order.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="font-medium">{order.title || order.description}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.vehicleId && `Vehicle: ${order.vehicleId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge variant="outline">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No work orders available
          </div>
        )}

        <Button className="w-full mt-4">
          <Wrench className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>
      </div>
    </ScrollArea>
  )
}

// Parts Inventory Panel
const PartsPanel = ({ parts }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <h3 className="font-semibold mb-3">Parts Inventory</h3>
        <div className="text-center text-muted-foreground py-8">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Parts inventory management</p>
          <p className="text-sm">Coming soon</p>
        </div>
      </div>
    </ScrollArea>
  )
}

// Main Maintenance Workspace Component
export function MaintenanceWorkspace({ data }: { data?: any }) {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: any } | null>(null)
  const [activePanel, setActivePanel] = useState('facility')
  const [filterStatus, setFilterStatus] = useState('all')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: facilities = [] } = useFacilities()
  const { data: workOrders = [] } = useWorkOrders()
  const { data: maintenanceSchedule = [] } = useMaintenanceSchedules()

  // Real-time telemetry
  const {
    vehicles: realtimeVehicles,
    isConnected: isRealtimeConnected,
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles: vehicles as Vehicle[],
  })

  // Use real-time vehicles if available, otherwise use static data
  const displayVehicles = realtimeVehicles.length > 0 ? realtimeVehicles : vehicles

  // Filter vehicles that need maintenance
  const maintenanceVehicles = useMemo(() => {
    return displayVehicles.filter((v: Vehicle) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'service') return v.status === 'service'
      if (filterStatus === 'alerts') return v.maintenanceAlerts && v.maintenanceAlerts.length > 0
      if (filterStatus === 'due') {
        return v.nextServiceMiles && (v.nextServiceMiles - v.mileage) < 500
      }
      return true
    })
  }, [displayVehicles, filterStatus])

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    const vehicle = displayVehicles.find((v: Vehicle) => v.id === vehicleId)
    if (vehicle) {
      setSelectedEntity({ type: 'vehicle', data: vehicle })
      setActivePanel('vehicle')
    }
  }, [displayVehicles])

  // Stats
  const stats = useMemo(() => ({
    inService: displayVehicles.filter((v: Vehicle) => v.status === 'service').length,
    alertsPending: displayVehicles.filter((v: Vehicle) => v.maintenanceAlerts && v.maintenanceAlerts.length > 0).length,
    serviceDue: displayVehicles.filter((v: Vehicle) =>
      v.nextServiceMiles && (v.nextServiceMiles - v.mileage) < 500
    ).length,
    workOrdersPending: workOrders.filter((w: any) => w.status === 'pending').length
  }), [displayVehicles, workOrders])

  return (
    <div className="h-screen grid grid-cols-[1fr_400px]" data-testid="maintenance-workspace">
      {/* Map Section */}
      <div className="relative h-full">
        <ProfessionalFleetMap
          vehicles={maintenanceVehicles as Vehicle[]}
          facilities={facilities}
          height="100vh"
          onVehicleSelect={handleVehicleSelect}
          showLegend={true}
          enableRealTime={isRealtimeConnected}
        />

        {/* Maintenance Status Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg z-10">
          <div className="p-3 space-y-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48" data-testid="maint-filter">
                <SelectValue placeholder="Filter vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                <SelectItem value="service">In Service</SelectItem>
                <SelectItem value="alerts">With Alerts</SelectItem>
                <SelectItem value="due">Service Due Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="absolute bottom-4 left-4 right-[420px] bg-background/95 backdrop-blur rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-2" data-testid="maint-stat-service">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.inService}</span> in service
                </span>
              </div>
              <div className="flex items-center gap-2" data-testid="maint-stat-alerts">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.alertsPending}</span> alerts
                </span>
              </div>
              <div className="flex items-center gap-2" data-testid="maint-stat-due">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.serviceDue}</span> service due
                </span>
              </div>
              <div className="flex items-center gap-2" data-testid="maint-stat-orders">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="font-semibold">{stats.workOrdersPending}</span> pending orders
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
      <div className="border-l bg-background" data-testid="maint-contextual-panel">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="h-full flex flex-col">
          <TabsList className="w-full rounded-none justify-start px-2">
            <TabsTrigger value="facility" className="flex-1" data-testid="maint-tab-facility">
              <Building2 className="h-4 w-4 mr-2" />
              Facilities
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="flex-1" data-testid="maint-tab-vehicle">
              <Truck className="h-4 w-4 mr-2" />
              Vehicle
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex-1" data-testid="maint-tab-orders">
              <Settings className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex-1" data-testid="maint-tab-parts">
              <Package className="h-4 w-4 mr-2" />
              Parts
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="facility" className="h-full m-0" data-testid="maint-panel-facility">
              <FacilityPanel
                facilities={facilities}
                onFacilitySelect={(facility) => setSelectedEntity({ type: 'facility', data: facility })}
              />
            </TabsContent>

            <TabsContent value="vehicle" className="h-full m-0" data-testid="maint-panel-vehicle">
              <VehicleMaintenancePanel
                vehicle={selectedEntity?.type === 'vehicle' ? selectedEntity.data : null}
                maintenanceHistory={null}
              />
            </TabsContent>

            <TabsContent value="orders" className="h-full m-0" data-testid="maint-panel-orders">
              <WorkOrdersPanel
                workOrders={workOrders}
                onWorkOrderSelect={(order) => setSelectedEntity({ type: 'workOrder', data: order })}
              />
            </TabsContent>

            <TabsContent value="parts" className="h-full m-0" data-testid="maint-panel-parts">
              <PartsPanel parts={[]} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
