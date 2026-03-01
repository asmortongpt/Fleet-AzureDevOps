import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  AlertCircle,
  Grid
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { GlowCard } from "@/components/ui/glow-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useVehicles, useFacilities, useWorkOrders, useMaintenanceSchedules } from "@/hooks/use-api"
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry"
import { apiFetcher } from "@/lib/api-fetcher"
import { Vehicle, Facility, WorkOrder } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { formatEnum } from "@/utils/format-enum"
import { formatNumber } from "@/utils/format-helpers"
import { formatVehicleName } from "@/utils/vehicle-display"

/** Safely extract an array from an API response that may be nested as { data: [...] } or { data: { data: [...] } } */
const safeArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object') {
    const inner = (value as Record<string, unknown>).data
    if (Array.isArray(inner)) return inner as T[]
    if (inner && typeof inner === 'object') {
      const nested = (inner as Record<string, unknown>).data
      if (Array.isArray(nested)) return nested as T[]
    }
  }
  return []
}

// Facility Panel Component
const FacilityPanel = ({ facilities, onFacilitySelect }: { facilities: Facility[]; onFacilitySelect: (facility: Facility) => void }) => {
  if (!facilities || facilities.length === 0) {
    return (
      <div className="p-2 text-center text-[var(--text-secondary)]">
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
            className="cursor-pointer hover:bg-[var(--surface-glass-hover)] transition-colors"
            onClick={() => onFacilitySelect(facility)}
            data-testid={`facility-card-${facility.id}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--text-secondary)]" />
                    <span className="font-medium">{facility.name}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">{facility.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={facility.status === 'operational' ? 'default' : 'destructive'}>
                      {facility.status}
                    </Badge>
                    <span className="text-xs text-[var(--text-secondary)]">
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
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduleType, setScheduleType] = useState<'preventive' | 'corrective'>('preventive')
  if (!vehicle) {
    return (
      <div className="p-2 text-center text-[var(--text-secondary)]">
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
            {formatVehicleName(vehicle)}
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
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
              <span className="font-medium">{formatNumber(vehicle.mileage ?? 0)} mi</span>
            </div>

            {vehicle.nextService && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Next Service</span>
                  <span className="font-medium">{formatNumber(Number(vehicle.nextService))} mi</span>
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
                {(Array.isArray(vehicle.alerts) ? vehicle.alerts : []).map((alert: string) => (
                  <div key={alert} className="flex items-start gap-2 text-sm">
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
          <Button className="w-full" onClick={() => { setScheduleType('preventive'); setScheduleOpen(true) }}>
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Service
          </Button>
          <Button
            variant="outline"
            className="w-full hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors"
            onClick={() => { setScheduleType('corrective'); setScheduleOpen(true) }}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Request Maintenance
          </Button>
        </div>

        {/* Schedule/Request Dialog */}
        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{scheduleType === 'preventive' ? 'Schedule Service' : 'Request Maintenance'}</DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <div className="text-sm text-[var(--text-secondary)]">
                Vehicle: <strong>{vehicle ? formatVehicleName(vehicle) : '-'}</strong>
              </div>
              <div>
                <Label htmlFor="svc-type">Service Type</Label>
                <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as 'preventive' | 'corrective')}>
                  <SelectTrigger id="svc-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                    <SelectItem value="corrective">Corrective / Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                setScheduleOpen(false)
                toast.success(`${scheduleType === 'preventive' ? 'Service scheduled' : 'Maintenance requested'} for ${vehicle ? formatVehicleName(vehicle) : 'vehicle'}`)
              }}>Submit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

// Work Orders Panel
const WorkOrdersPanel = ({ workOrders: workOrdersProp, onWorkOrderSelect }: { workOrders: WorkOrder[]; onWorkOrderSelect: (order: WorkOrder) => void }) => {
  const workOrders = Array.isArray(workOrdersProp) ? workOrdersProp : safeArray<WorkOrder>(workOrdersProp)
  const [createOpen, setCreateOpen] = useState(false)
  const [newWO, setNewWO] = useState({ title: '', description: '', priority: 'medium', vehicleId: '' })

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-emerald-400" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-[var(--text-tertiary)]" />
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
              className="cursor-pointer hover:bg-[var(--surface-glass-hover)] transition-colors"
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
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {order.vehicleId && `Vehicle: ${order.vehicleId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                      <Badge variant="outline">
                        {formatEnum(order.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center text-[var(--text-secondary)] py-3">
            No work orders available
          </div>
        )}

        <Button className="w-full mt-2" onClick={() => {
            setNewWO({ title: '', description: '', priority: 'medium', vehicleId: '' })
            setCreateOpen(true)
          }}>
          <Wrench className="h-4 w-4 mr-2" />
          Create Work Order
        </Button>

        {/* Create Work Order Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Work Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="new-wo-title">Title</Label>
                <Input id="new-wo-title" placeholder="e.g., Oil Change - Unit 42" value={newWO.title} onChange={(e) => setNewWO(w => ({ ...w, title: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="new-wo-vehicle">Vehicle ID</Label>
                <Input id="new-wo-vehicle" placeholder="Vehicle ID or Unit #" value={newWO.vehicleId} onChange={(e) => setNewWO(w => ({ ...w, vehicleId: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="new-wo-priority">Priority</Label>
                <Select value={newWO.priority} onValueChange={(v) => setNewWO(w => ({ ...w, priority: v }))}>
                  <SelectTrigger id="new-wo-priority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-wo-desc">Description</Label>
                <Textarea id="new-wo-desc" placeholder="Describe the maintenance needed..." value={newWO.description} onChange={(e) => setNewWO(w => ({ ...w, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                if (!newWO.title.trim()) {
                  toast.error('Please enter a title for the work order')
                  return
                }
                toast.success(`Work order "${newWO.title}" created successfully`)
                setCreateOpen(false)
              }}>Create Work Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

// Parts data
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
const PartsPanel = ({ parts: partsProp, technicians: techniciansProp }: { parts: Part[]; technicians: Technician[] }) => {
  const parts = Array.isArray(partsProp) ? partsProp : []
  const technicians = Array.isArray(techniciansProp) ? techniciansProp : []

  const getStatusColor = (status: Part['status']) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500'
      case 'low_stock': return 'bg-yellow-500'
      case 'out_of_stock': return 'bg-red-500'
      case 'on_order': return 'bg-emerald-500'
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
      case 'off': return 'bg-white/[0.2]'
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
              <div className="text-xs text-[var(--text-secondary)]">Low Stock</div>
              <div className="text-lg font-semibold text-yellow-600">{lowStockItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-[var(--text-secondary)]">On Order</div>
              <div className="text-lg font-semibold text-emerald-400">{partsOnOrder}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-[var(--text-secondary)]">Total Parts</div>
              <div className="text-lg font-semibold">{parts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2">
              <div className="text-xs text-[var(--text-secondary)]">Techs Available</div>
              <div className="text-lg font-semibold text-emerald-700">{availableTechs}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Low Stock Parts</h4>
          <div className="space-y-2">
            {lowStockParts.length === 0 && (
              <div className="text-xs text-[var(--text-secondary)]">No low stock parts</div>
            )}
            {lowStockParts.map(part => (
              <Card key={part.id}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{part.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{part.partNumber}</div>
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
              <div className="text-xs text-[var(--text-secondary)]">No technicians found</div>
            )}
            {technicians.map(tech => (
              <Card key={tech.id}>
                <CardContent className="p-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{tech.name}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{tech.currentTask || 'No active task'}</div>
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
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    return key && key.length > 10 && !key.includes('YOUR_KEY')
  }, [])

  const [viewMode, setViewMode] = useState<'map' | 'tactical'>(hasApiKey ? 'map' : 'tactical')

  // API hooks
  const { data: vehicles = [] } = useVehicles()
  const { data: facilities = [] } = useFacilities()
  const { data: workOrders = [] } = useWorkOrders()
  const { data: _maintenanceSchedule = [] } = useMaintenanceSchedules()
  const { data: partsResponse } = useSWR<any[]>('/api/parts?limit=200', apiFetcher)
  const { data: usersResponse } = useSWR<any[]>('/api/users?limit=500', apiFetcher)

  // Real-time telemetry
  const {
    vehicles: realtimeVehicles,
    isConnected: isRealtimeConnected,
  } = useVehicleTelemetry({
    enabled: true,
    initialVehicles: vehicles as unknown as Vehicle[],
  })

  // Use real-time vehicles if available, otherwise use static data
  const safeRealtimeVehicles = Array.isArray(realtimeVehicles) ? realtimeVehicles : []
  const safeVehicles = Array.isArray(vehicles) ? vehicles : safeArray<Vehicle>(vehicles)
  const displayVehicles = safeRealtimeVehicles.length > 0 ? safeRealtimeVehicles : safeVehicles

  const workOrderList: any[] = Array.isArray(workOrders) ? workOrders : safeArray<any>(workOrders)

  const parts: Part[] = useMemo(() => {
    const rawParts = safeArray<any>(partsResponse)
    return rawParts.map((part: any) => {
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
        location: part.location_in_warehouse || part.location || '',
        lastUsed: part.updated_at || part.created_at
      }
    })
  }, [partsResponse])

  const technicians: Technician[] = useMemo(() => {
    const users = safeArray<any>(usersResponse)
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
    const safeDisplay: Vehicle[] = Array.isArray(displayVehicles) ? displayVehicles as Vehicle[] : []
    return safeDisplay.filter((v: Vehicle) => {
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
    const safeDisplay: Vehicle[] = Array.isArray(displayVehicles) ? displayVehicles as Vehicle[] : []
    const vehicle = safeDisplay.find((v: Vehicle) => v.id === vehicleId)
    if (vehicle) {
      setSelectedEntity({ type: 'vehicle', data: vehicle })
      setActivePanel('vehicle')
    }
  }, [displayVehicles])

  // Stats
  const stats = useMemo(() => {
    const safeDisplay: Vehicle[] = Array.isArray(displayVehicles) ? displayVehicles as Vehicle[] : []
    const safeWO: any[] = Array.isArray(workOrders) ? workOrders : []
    const openWOs = safeWO.filter((w: WorkOrder) => w.status !== 'completed' && w.status !== 'cancelled')
    const urgentWOs = safeWO.filter((w: WorkOrder) => w.priority === 'emergency' || w.priority === 'urgent')
    return {
      inService: safeDisplay.filter((v: Vehicle) => v.status === 'active' || v.status === 'service' || v.status === 'in_service').length,
      alertsPending: urgentWOs.length,
      serviceDue: openWOs.filter((w: any) => w.priority === 'high' || w.scheduled_date).length,
      workOrdersPending: safeWO.filter((w: WorkOrder) => w.status === 'pending').length
    }
  }, [displayVehicles, workOrders])

  const safeWorkOrders: any[] = Array.isArray(workOrders) ? workOrders : safeArray<any>(workOrders)
  const completedWOs = safeWorkOrders.filter((w: any) => w.status === 'completed').length
  const avgCompletionDays = useMemo(() => {
    const completed = safeWorkOrders.filter((w: any) => w.status === 'completed' && w.actual_end_date && w.created_at)
    if (completed.length === 0) return null
    const totalDays = completed.reduce((sum: number, w: any) => {
      const start = new Date(w.created_at).getTime()
      const end = new Date(w.actual_end_date).getTime()
      return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24))
    }, 0)
    return Math.round(totalDays / completed.length)
  }, [safeWorkOrders])

  const totalFacilityCapacity = useMemo(() => {
    const safeFac = Array.isArray(facilities) ? facilities : []
    return safeFac.reduce((sum: number, f: any) => sum + (f.capacity || 0), 0)
  }, [facilities])

  // Work order cost breakdown by type
  const woCostBreakdown = useMemo(() => {
    const costMap = new Map<string, number>()
    safeWorkOrders.forEach((wo: any) => {
      const type = formatEnum(wo.type || wo.priority || 'general')
      const cost = Number(wo.total_cost || wo.cost || 0)
      costMap.set(type, (costMap.get(type) || 0) + cost)
    })
    return Array.from(costMap.entries())
      .map(([name, cost]) => ({ name, cost }))
      .filter(d => d.cost > 0)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6)
  }, [safeWorkOrders])

  const woCostMax = woCostBreakdown.length > 0 ? woCostBreakdown[0].cost : 1

  // Work order status distribution for donut
  const woStatusDistribution = useMemo(() => {
    const statusMap = new Map<string, number>()
    safeWorkOrders.forEach((wo: any) => {
      const status = wo.status || 'pending'
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })
    return Array.from(statusMap.entries())
      .map(([status, count]) => ({ name: formatEnum(status), value: count }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [safeWorkOrders])

  return (
    <div className="h-screen flex flex-col" data-testid="maintenance-workspace">
      {/* Hero Metrics Strip — Premium */}
      <div className="flex-shrink-0 border-b border-white/[0.08] bg-[#111]">
        <div className="flex items-stretch">
          {[
            { icon: Wrench, label: 'In Service', value: stats.inService, color: '#10b981', trend: stats.inService > 0 ? '\u2191' : undefined, trendColor: 'text-emerald-400' },
            { icon: AlertTriangle, label: 'Alerts', value: stats.alertsPending, color: '#f59e0b', trend: stats.alertsPending > 0 ? `\u2193${stats.alertsPending}` : undefined, trendColor: 'text-rose-400' },
            { icon: Calendar, label: 'Due Soon', value: stats.serviceDue, color: '#ef4444', trend: stats.serviceDue > 0 ? '\u26A0' : undefined, trendColor: 'text-amber-400' },
            { icon: CheckCircle2, label: 'Work Orders', value: safeWorkOrders.length, color: '#10b981', trend: completedWOs > 0 ? `${completedWOs} done` : undefined, trendColor: 'text-emerald-400/60' },
            { icon: Building2, label: 'Facilities', value: (Array.isArray(facilities) ? facilities : []).length, color: '#6b7280' },
            { icon: Clock, label: 'Avg Turnaround', value: avgCompletionDays !== null ? `${avgCompletionDays}d` : '\u2014', color: '#6b7280' },
            { icon: Truck, label: 'Bay Capacity', value: formatNumber(totalFacilityCapacity), color: '#6b7280', trend: totalFacilityCapacity > 0 ? 'bays' : undefined, trendColor: 'text-white/25' },
          ].map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className={cn('flex-1 flex items-center gap-3 px-4 py-3 relative overflow-hidden', i > 0 && 'border-l border-white/[0.06]')}>
                <div className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full" style={{ background: m.color, boxShadow: `0 0 12px ${m.color}80, 0 0 4px ${m.color}40` }} />
                <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: `${m.color}12`, border: `1px solid ${m.color}25` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: m.color }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/40 leading-none mb-0.5">{m.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[18px] font-bold leading-none tabular-nums text-white/95">{m.value}</span>
                    {m.trend && <span className={`text-[10px] font-medium ${m.trendColor || 'text-white/30'}`}>{m.trend}</span>}
                  </div>
                </div>
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ background: `linear-gradient(135deg, ${m.color} 0%, transparent 60%)` }} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_400px]">
        {/* Map Section */}
        <div className="flex flex-col h-full">
          <div className="relative flex-1 min-h-0">
            <ProfessionalFleetMap
              vehicles={maintenanceVehicles as Vehicle[]}
              facilities={facilities as unknown as import('@/lib/types').GISFacility[]}
              height="100%"
              onVehicleSelect={handleVehicleSelect}
              showLegend={true}
              enableRealTime={isRealtimeConnected}
              forceSimulatedView={viewMode === 'tactical'}
            />

            {/* Maintenance Status Overlay */}
            <div className="absolute top-4 left-4 bg-[#111] border border-white/[0.08] rounded-lg z-10 flex gap-2">
              {/* View Mode Toggle */}
              <div className="p-1 bg-white/[0.04] rounded-md flex">
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
          </div>

          {/* Cost Breakdown */}
          {woCostBreakdown.length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-white/[0.08] bg-[#111]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Cost Breakdown</span>
                <span className="text-[10px] text-white/25">By work order type</span>
              </div>
              <div className="space-y-2">
                {woCostBreakdown.map((item, idx) => {
                  const colors = ['#10b981', '#14b8a6', '#f59e0b', '#a855f7', '#3b82f6', '#ef4444']
                  const color = colors[idx % colors.length]
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 4px ${color}60` }} />
                      <span className="text-[11px] text-white/50 w-20 truncate shrink-0">{item.name}</span>
                      <div className="flex-1 h-4 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.max((item.cost / woCostMax) * 100, 3)}%`,
                            background: `linear-gradient(90deg, ${color}90 0%, ${color}30 100%)`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold w-16 text-right tabular-nums shrink-0" style={{ color: `${color}cc` }}>${formatNumber(Math.round(item.cost))}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="border-l border-white/[0.08] h-full flex flex-col">
          {/* WO Distribution Donut */}
          {woStatusDistribution.length > 0 && (
            <div className="px-4 py-3 border-b border-white/[0.08] flex-shrink-0">
              <GlowCard accent="#10b981">
              <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Work Orders</span>
                <span className="text-[10px] text-white/25">{safeWorkOrders.length} total</span>
              </div>
              <div className="flex items-center gap-3">
                <ResponsiveContainer width={80} height={80}>
                  <RechartsPieChart>
                    <Pie
                      data={woStatusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={22}
                      outerRadius={36}
                      dataKey="value"
                      stroke="none"
                    >
                      {woStatusDistribution.map((_, idx) => (
                        <Cell key={idx} fill={['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#14b8a6'][idx % 5]} opacity={0.7} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5">
                  {woStatusDistribution.slice(0, 4).map((item, idx) => {
                    const color = ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#14b8a6'][idx % 5]
                    return (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                        <span className="text-[10px] text-white/50 truncate flex-1">{item.name}</span>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: `${color}cc` }}>{item.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              </div>
              </GlowCard>
            </div>
          )}
        <Tabs defaultValue="facility" value={activePanel} onValueChange={setActivePanel} className="w-full flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="facility">Facilities</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            <TabsTrigger value="work">Work Orders</TabsTrigger>
            <TabsTrigger value="parts">Parts</TabsTrigger>
          </TabsList>
          <TabsContent value="facility" className="h-[calc(100vh-100px)] mt-0">
            <FacilityPanel
              facilities={facilities as unknown as Facility[]}
              onFacilitySelect={(facility) => {
                setSelectedEntity({ type: 'facility', data: facility });
                setActivePanel('facility');
              }}
            />
          </TabsContent>
          <TabsContent value="vehicle" className="h-[calc(100vh-100px)] mt-0">
            <VehicleMaintenancePanel
              vehicle={selectedEntity?.type === 'vehicle' ? selectedEntity.data as Vehicle : null}
              _maintenanceHistory={null}
            />
          </TabsContent>
          <TabsContent value="work" className="h-[calc(100vh-100px)] mt-0">
            <WorkOrdersPanel
              workOrders={workOrders as unknown as WorkOrder[]}
              onWorkOrderSelect={(order) => {
                setSelectedEntity({ type: 'workOrder', data: order });
                setActivePanel('work');
              }}
            />
          </TabsContent>
          <TabsContent value="parts" className="h-[calc(100vh-100px)] mt-0">
            <PartsPanel parts={parts} technicians={technicians} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  )
}
