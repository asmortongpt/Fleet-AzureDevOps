import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  Building2,
  AlertCircle,
  Grid
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import { toast, ToastOptions } from "react-hot-toast"

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
import { swrFetcher } from "@/lib/fetcher"
import { cn } from "@/lib/utils"

// Facility Panel Component
const FacilityPanel = ({ facilities, onFacilitySelect }: { facilities: Facility[]; onFacilitySelect: (facility: Facility) => void }) => {
  if (!facilities || facilities.length === 0) {
    return (
      <div className="p-2 text-center text-muted-foreground">
        No facilities available
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
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
      <div className="p-2 text-center text-muted-foreground">
        Select a vehicle on the map to view maintenance details
      </div>
    )
  }

  const daysUntilService = vehicle.nextService
    ? Math.floor(((Number(vehicle.nextService) - (vehicle.mileage || 0)) || 0) / 50)
    : null

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {/* Vehicle Header */}
        <div>
          <h3 className="text-sm font-semibold">
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
                      {(Number(vehicle.nextService) - (vehicle.mileage || 0)) || 0} mi
                    </span>
                  </div>
                  <Progress
                    value={Number(vehicle.nextService) > 0 ? ((vehicle.mileage || 0) / Number(vehicle.nextService)) * 100 : 0}
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
  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-800" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-700" />
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
      <div className="p-2 space-y-2">
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
          <div className="text-center text-muted-foreground py-3">
            No work orders available
          </div>
        )}

        <Button className="w-full mt-2">
          <Wrench className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>
      </div>
    </ScrollArea>
  )
}

// Mock parts data
interface Part {
  id: string
  name: string
  partNumber: string
  quantity: number
  reorderPoint: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order'
  location: string
  lastUsed?: string
}

interface Technician {
  id: string
  name: string
  status: 'available' | 'busy' | 'break' | 'off'
  currentTask?: string
  completedToday: number
}

// Parts Inventory Panel
const PartsPanel = ({ parts, technicians }: { parts: Part[]; technicians: Technician[] }) => {
  const getStatusColor = (status: Part['status']) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500'
      case 'low_stock': return 'bg-yellow-500'
      case 'out_of_stock': return 'bg-red-500'
      case 'on_order': return 'bg-blue-500'
    }
  }

  const getStatusLabel = (status: Part['status']) => {
    switch (status) {
      case 'in_stock': return 'In Stock'
      case 'low_stock': return 'Low Stock'
      case 'out_of_stock': return 'Out of Stock'
      case 'on_order': return 'On Order'
    }
  }

  const getTechStatusColor = (status: Technician['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'busy': return 'bg-yellow-500'
      case 'break': return 'bg-orange-500'
      case 'off': return 'bg-gray-500'
    }
  }

  const partsOnOrder = parts.filter(p => p.status === 'on_order').length
  const lowStockItems = parts.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock').length
  const availableTechs = technicians.filter(t => t.status === 'available').length

  const lowStockParts = parts
    .filter(p => p.status === 'low_stock' || p.status === 'out_of_stock')
    .slice(0, 6)

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        <h3 className="font-semibold mb-3">Parts Inventory</h3>

        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-muted-foreground">Low Stock</div>
              <div className="text-lg font-semibold text-yellow-600">{lowStockItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-muted-foreground">On Order</div>
              <div className="text-lg font-semibold text-blue-600">{partsOnOrder}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-muted-foreground">Total Parts</div>
              <div className="text-lg font-semibold">{parts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-muted-foreground">Techs Available</div>
              <div className="text-lg font-semibold text-emerald-700">{availableTechs}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Low Stock Parts</h4>
          <div className="space-y-2">
            {lowStockParts.length === 0 && (
              <div className="text-xs text-muted-foreground">No low stock parts</div>
            )}
            {lowStockParts.map(part => (
              <Card key={part.id}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{part.name}</div>
                      <div className="text-xs text-muted-foreground">{part.partNumber}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {part.quantity} on hand
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Technicians</h4>
          <div className="space-y-2">
            {technicians.length === 0 && (
              <div className="text-xs text-muted-foreground">No technicians found</div>
            )}
            {technicians.map(tech => (
              <Card key={tech.id}>
                <CardContent className="p-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{tech.name}</div>
                    <div className="text-xs text-muted-foreground">{tech.currentTask || 'No active task'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getTechStatusColor(tech.status)}`} />
                    <span className="text-xs capitalize">{tech.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
  const { data: partsResponse } = useSWR<{ data: any[] }>('/api/parts?limit=200', swrFetcher)
  const { data: usersResponse } = useSWR<{ data: any[] }>('/api/users?limit=500', swrFetcher)

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

  const workOrderList = Array.isArray(workOrders) ? workOrders : ((workOrders as any)?.data || [])

  const parts: Part[] = useMemo(() => {
    return (partsResponse?.data || []).map((part: any) => {
      const quantity = Number(part.quantity_on_hand ?? part.quantity ?? 0)
      const reorderPoint = Number(part.reorder_point ?? part.reorderPoint ?? 0)
      let status: Part['status'] = 'in_stock'
      if (part.metadata?.on_order) status = 'on_order'
      if (quantity <= 0) status = 'out_of_stock'
      else if (quantity <= reorderPoint) status = 'low_stock'

      return {
        id: part.id,
        name: part.name,
        partNumber: part.part_number || part.partNumber || '',
        quantity,
        reorderPoint,
        status,
        location: part.location_in_warehouse || part.location || 'Warehouse',
        lastUsed: part.updated_at || part.created_at
      }
    })
  }, [partsResponse])

  const technicians: Technician[] = useMemo(() => {
    const users = usersResponse?.data || []
    return users
      .filter((user: any) => user.role === 'Mechanic')
      .map((user: any) => {
        const assigned = workOrderList.find((order: any) =>
          order.assigned_to_id === user.id && order.status !== 'completed'
        )
        const completedToday = workOrderList.filter((order: any) => {
          if (order.assigned_to_id !== user.id || !order.actual_end_date) return false
          const endDate = new Date(order.actual_end_date)
          const today = new Date()
          return endDate.toDateString() === today.toDateString()
        }).length

        return {
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          status: assigned ? 'busy' : 'available',
          currentTask: assigned?.title,
          completedToday
        }
      })
  }, [usersResponse, workOrderList])

  // Filter vehicles that need maintenance
  const maintenanceVehicles = useMemo(() => {
    return (displayVehicles as unknown as Vehicle[]).filter((v: Vehicle) => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'service') return v.status === 'service'
      if (filterStatus === 'alerts') return v.alerts && v.alerts.length > 0
      if (filterStatus === 'due') {
        return v.nextService && (Number(v.nextService) - (v.mileage || 0)) < 500
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
      v.nextService && (Number(v.nextService) - (v.mileage || 0)) < 500
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
        />

        {/* Maintenance Status Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur rounded-lg shadow-sm z-10 flex gap-2">
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
        <div className="absolute bottom-4 left-4 right-[420px] bg-background/95 backdrop-blur rounded-lg shadow-sm p-3 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
              facilities={facilities as unknown as Facility[]}
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
            <PartsPanel parts={parts} technicians={technicians} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
