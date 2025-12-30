import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Building2,
  Settings,
  AlertCircle,
  Grid
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVehicles, useFacilities, useWorkOrders, useMaintenanceSchedules } from "@/hooks/use-api"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { Vehicle, Facility, WorkOrder } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast, ToastOptions } from "react-hot-toast"

// Facility Panel Component
const FacilityPanel = ({ facilities, onFacilitySelect }: { facilities: Facility[]; onFacilitySelect: (facility: Facility) => void }) => {
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
const VehicleMaintenancePanel = ({ vehicle, _maintenanceHistory }: { vehicle: Vehicle | null; _maintenanceHistory: unknown }) => {
  if (!vehicle) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a vehicle on the map to view maintenance details
      </div>
    )
  }

  const daysUntilService = vehicle.nextService
    ? Math.floor(((vehicle.nextService - (vehicle.mileage || 0)) || 0) / 50)
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

            {vehicle.nextService && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Service</span>
                  <span className="font-medium">{vehicle.nextService.toLocaleString()} mi</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Service Due In</span>
                    <span className={cn(
                      "font-medium",
                      daysUntilService && daysUntilService < 7 ? "text-red-500" : "text-green-500"
                    )}>
                      {(vehicle.nextService - (vehicle.mileage || 0)) || 0} mi
                    </span>
                  </div>
                  <Progress
                    value={(vehicle.mileage || 0) / vehicle.nextService * 100}
                    className="h-2"
                  />
                </div>
              </>
            )}

            {vehicle.alerts && vehicle.alerts.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Active Alerts
                </h4>
                {vehicle.alerts.map((alert: string, i: number) => (
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
          <Button
            variant="outline"
            className="w-full hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors"
            onClick={() => {
              toast.success('Maintenance request submitted', {
                duration: 3000,
                position: 'top-center'
              } as ToastOptions)
            }}
          >
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
const WorkOrdersPanel = ({ workOrders, onWorkOrderSelect }: { workOrders: WorkOrder[]; onWorkOrderSelect: (order: WorkOrder) => void }) => {
  const getStatusIcon = (status: string): JSX.Element => {
    switch (status) {
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

  const getPriorityColor = (priority: string): "destructive" | "default" | "secondary" | "outline" => {
    switch (priority) {
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
          workOrders.map((order: WorkOrder) => (
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
const PartsPanel = ({ _parts }: { _parts: unknown }) => {
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
export function MaintenanceWorkspace({ _data }: { _data?: unknown }) {
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; data: Vehicle | Facility | WorkOrder } | null>(null)
  const [activePanel, setActivePanel] = useState('facility')
  const [filterStatus, setFilterStatus] = useState('all')

  // Check for API key to set initial view mode
  const hasApiKey = useMemo(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    return key && key.length > 10 && !key.includes('YOUR_KEY')
  }, [])

  const [viewMode, setViewMode] = useState<'map' | 'tactical'>(hasApiKey ? 'map' : 'tactical')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: facilities = [] } = useFacilities()
  const { data: workOrders = [] } = useWorkOrders()
  const { data: _maintenanceSchedule = [] } = useMaintenanceSchedules()

  // Real-time telemetry
  const {
    vehicles: realtimeVehicles,
    isConnected: isRealtimeConnected,
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles: vehicles as unknown as Vehicle[],
  })

  // Use real-time vehicles if available, otherwise use static data
  const displayVehicles = realtimeVehicles.length > 0 ? realtimeVehicles : vehicles

  // Filter vehicles that need maintenance
  const maintenanceVehicles = useMemo(() => {
    return (displayVehicles as unknown as Vehicle[]).filter((v: Vehicle) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'service') return v.status === 'service'
      if (filterStatus === 'alerts') return v.alerts && v.alerts.length > 0
      if (filterStatus === 'due') {
        return v.nextService && (v.nextService - (v.mileage || 0)) < 500
      }
      return true
    })
  }, [displayVehicles, filterStatus])

  // Handle vehicle selection
  const handleVehicleSelect = useCallback((vehicleId: string) => {
    const vehicle = (displayVehicles as Vehicle[]).find((v: Vehicle) => v.id === vehicleId)
    if (vehicle) {
      setSelectedEntity({ type: 'vehicle', data: vehicle })
      setActivePanel('vehicle')
    }
  }, [displayVehicles])

  // Stats
  const stats = useMemo(() => ({
    inService: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.status === 'service').length,
    alertsPending: (displayVehicles as Vehicle[]).filter((v: Vehicle) => v.alerts && v.alerts.length > 0).length,
    serviceDue: (displayVehicles as Vehicle[]).filter((v: Vehicle) =>
      v.nextService && (v.nextService - (v.mileage || 0)) < 500
    ).length,
    workOrdersPending: (workOrders as unknown as WorkOrder[]).filter((w: WorkOrder) => w.status === 'pending').length
  }), [displayVehicles, workOrders])

  return (
    <div className="h-screen grid grid-cols-[1fr_400px]" data-testid="maintenance-workspace">
      {/* Map Section */}
      <div className="relative h-full">
        <ProfessionalFleetMap
          vehicles={maintenanceVehicles as Vehicle[]}
          facilities={facilities as unknown as import('@/lib/types').GISFacility[]}
          height="100vh"
          onVehicleSelect={handleVehicleSelect}
          showLegend={true}
          enableRealTime={isRealtimeConnected}
          forceSimulatedView={viewMode === 'tactical'}
        />

        {/* Maintenance Status Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-lg z-10 flex gap-2">
          {/* View Mode Toggle */}
          <div className="p-1 bg-muted rounded-md flex">
            <Button
              variant={viewMode === 'map' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('map')}
            >
              Map
            </Button>
            <Button
              variant={viewMode === 'tactical' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('tactical')}
            >
              <Grid className="h-4 w-4 mr-2" />
              Tactical
            </Button>
          </div>

          <div className="p-1">
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">In Service: {stats.inService}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Alerts: {stats.alertsPending}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                <span className="text-sm">Due Soon: {stats.serviceDue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Work Orders: {stats.workOrdersPending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="border-l h-full">
        <Tabs defaultValue="facility" value={activePanel} onValueChange={setActivePanel} className="w-full h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facility">Facilities</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="work">Work Orders</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
          </TabsList>
          <TabsContent value="facility" className="h-[calc(100vh-48px)] mt-0">
            <FacilityPanel
              facilities={facilities}
              onFacilitySelect={(facility) => {
                setSelectedEntity({ type: 'facility', data: facility });
                setActivePanel('facility');
              }}
            />
          </TabsContent>
          <TabsContent value="vehicle" className="h-[calc(100vh-48px)] mt-0">
            <VehicleMaintenancePanel
              vehicle={selectedEntity?.type === 'vehicle' ? selectedEntity.data as Vehicle : null}
              _maintenanceHistory={null}
            />
          </TabsContent>
          <TabsContent value="work" className="h-[calc(100vh-48px)] mt-0">
            <WorkOrdersPanel
              workOrders={workOrders as unknown as WorkOrder[]}
              onWorkOrderSelect={(order) => {
                setSelectedEntity({ type: 'workOrder', data: order });
                setActivePanel('work');
              }}
            />
          </TabsContent>
          <TabsContent value="parts" className="h-[calc(100vh-48px)] mt-0">
            <PartsPanel _parts={null} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}