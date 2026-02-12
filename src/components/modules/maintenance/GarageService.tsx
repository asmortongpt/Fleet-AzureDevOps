import {
  Wrench,
  User,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react"
import { useState } from "react"

import { MetricCard } from "@/components/MetricCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useFleetData } from "@/hooks/use-fleet-data"
import { useAuth } from "@/hooks/useAuth"
import { WorkOrder, ServiceBay, Technician } from "@/lib/types"

// Type guard to check if a facility is a ServiceBay
function isServiceBay(item: unknown): item is ServiceBay {
  return !!(
    item &&
    typeof item === 'object' &&
    'number' in item &&
    'status' in item &&
    ((item as any).status === 'occupied' || (item as any).status === 'available' || (item as any).status === 'maintenance')
  )
}

// Type guard to check if an item is a WorkOrder
function isWorkOrder(item: any): item is WorkOrder {
  return (
    item &&
    typeof item === 'object' &&
    'vehicleNumber' in item &&
    'serviceType' in item &&
    'priority' in item &&
    'status' in item
  )
}

// Type guard to check if an item is a Technician
function isTechnician(item: any): item is Technician {
  return (
    item &&
    typeof item === 'object' &&
    'name' in item &&
    'specialization' in item &&
    'availability' in item &&
    'efficiency' in item
  )
}

export function GarageService() {
  const { hasPermission } = useAuth()
  const data = useFleetData()
  const { push } = useDrilldown()

  // Filter and type-check data with safety
  const serviceBays = ((data.serviceBays || []) as unknown[]).filter(isServiceBay)
  const workOrders = ((data.workOrders || []) as unknown[]).filter(isWorkOrder)
  const technicians = ((data.technicians || []) as unknown[]).filter(isTechnician)

  const [activeTab, setActiveTab] = useState<string>("dashboard")

  const handleWorkOrderClick = (order: WorkOrder) => {
    push({
      type: 'workOrder',
      label: `WO #${order.id}`,
      data: { workOrderId: order.id, vehicleNumber: order.vehicleNumber, serviceType: order.serviceType }
    })
  }

  const handleTechnicianClick = (tech: Technician) => {
    push({
      type: 'technician',
      label: tech.name,
      data: { technicianId: tech.id, technicianName: tech.name }
    })
  }

  const handleServiceBayClick = (bay: ServiceBay) => {
    push({
      type: 'service-bay',
      label: bay.number,
      data: { bayId: bay.id, bayNumber: bay.number, status: bay.status }
    })
  }

  const metrics = {
    availableBays: serviceBays.filter(b => b.status === "operational").length,
    activeWorkOrders: workOrders.filter(w => w.status === "in-progress").length,
    availableTechs: technicians.filter(t => t.availability === "available").length,
    overdueJobs: workOrders.filter(w => w.status === "pending" && w.priority === "urgent").length
  }

  const getPriorityColor = (priority: WorkOrder["priority"]) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-accent/10 text-accent border-accent/20",
      high: "bg-warning/10 text-warning border-warning/20",
      urgent: "bg-destructive/10 text-destructive border-destructive/20"
    }
    return colors[priority]
  }

  const getStatusColor = (status: WorkOrder["status"]) => {
    const colors = {
      pending: "bg-warning/10 text-warning border-warning/20",
      "in-progress": "bg-accent/10 text-accent border-accent/20",
      completed: "bg-success/10 text-success border-success/20",
      cancelled: "bg-muted text-muted-foreground",
      open: "bg-primary/10 text-primary border-primary/20",
      review: "bg-info/10 text-info border-info/20",
      waiting_parts: "bg-warning/20 text-warning border-warning/40"
    }
    return colors[status] || colors.pending
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">

        <h1 className="text-base font-semibold tracking-tight">Garage & Service Center</h1>
        {hasPermission('work_order:create') && (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Work Order
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="service-bays">Service Bays</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <MetricCard
              title="Available Bays"
              value={metrics.availableBays}
              subtitle={`of ${serviceBays.length} total`}
              icon={<Wrench className="w-3 h-3" />}
              status="info"
            />
            <MetricCard
              title="Active Work Orders"
              value={metrics.activeWorkOrders}
              subtitle="in progress"
              icon={<Clock className="w-3 h-3" />}
              status="success"
            />
            <MetricCard
              title="Available Technicians"
              value={metrics.availableTechs}
              subtitle={`of ${technicians.length} total`}
              icon={<User className="w-3 h-3" />}
              status="info"
            />
            <MetricCard
              title="Overdue Maintenance"
              value={metrics.overdueJobs}
              subtitle="requires attention"
              icon={<AlertTriangle className="w-3 h-3" />}
              status={metrics.overdueJobs > 5 ? "warning" : "success"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Bay Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceBays.map(bay => (
                    <div
                      key={bay.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleServiceBayClick(bay as any)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleServiceBayClick(bay as any)}
                    >
                      <div>
                        <p className="font-medium">{bay.number}</p>
                        {bay.vehicle && (
                          <p className="text-sm text-muted-foreground">{bay.vehicle} • {bay.serviceType}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          bay.status === "operational"
                            ? "bg-success/10 text-success border-success/20"
                            : bay.status === "maintenance"
                              ? "bg-accent/10 text-accent border-accent/20"
                              : "bg-warning/10 text-warning border-warning/20"
                        }
                      >
                        {bay.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workOrders.slice(0, 6).map(order => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleWorkOrderClick(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleWorkOrderClick(order)}
                    >
                      <div>
                        <p className="font-medium">{order.vehicleNumber}</p>
                        <p className="text-sm text-muted-foreground">{order.serviceType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="service-bays">
          <Card>
            <CardHeader>
              <CardTitle>Service Bay Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {serviceBays.map(bay => (
                  <Card
                    key={bay.id}
                    className={
                      bay.status === "operational"
                        ? "border-success/50"
                        : bay.status === "maintenance"
                          ? "border-accent/50"
                          : "border-warning/50"
                    }
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-sm">{bay.number}</h3>
                          <Badge
                            variant="outline"
                            className={
                              bay.status === "operational"
                                ? "bg-success/10 text-success border-success/20 mt-2"
                                : bay.status === "maintenance"
                                  ? "bg-accent/10 text-accent border-accent/20 mt-2"
                                  : "bg-warning/10 text-warning border-warning/20 mt-2"
                            }
                          >
                            {bay.status}
                          </Badge>
                        </div>
                        {bay.status === "maintenance" && (
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {bay.status !== "closed" && bay.vehicle && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle:</span>
                            <span className="font-medium">{bay.vehicle}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Service:</span>
                            <span>{bay.serviceType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Technician:</span>
                            <span>{bay.technician}</span>
                          </div>
                          {bay.estimatedCompletion && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Est. Complete:</span>
                              <span>{new Date(bay.estimatedCompletion).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      )}
                      {bay.status === "operational" && !bay.vehicle && (
                        <p className="text-sm text-muted-foreground">Ready for service</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Work Order #</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Service Type</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost</th>
                    <th className="px-2 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {workOrders.map(order => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => handleWorkOrderClick(order)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleWorkOrderClick(order)}
                    >
                      <td className="px-2 py-3 text-sm font-medium">#{order.id}</td>
                      <td className="px-2 py-3 text-sm font-medium">{order.vehicleNumber}</td>
                      <td className="px-2 py-3 text-sm">{order.serviceType}</td>
                      <td className="px-2 py-3 text-sm">
                        <Badge variant="outline" className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-sm">
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">
                        {order.assignedTo || '-'}
                      </td>
                      <td className="px-2 py-3 text-sm text-muted-foreground">{order.createdDate}</td>
                      <td className="px-2 py-3 text-sm text-right font-semibold">
                        {order.cost ? `$${order.cost.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-2 py-3 text-sm text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleWorkOrderClick(order); }}>
                            View
                          </Button>

                          {/* Workflow Transitions */}
                          {order.status === 'open' && hasPermission('work_order:update') && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); /* handleTransition(order.id, 'in-progress') */ }}>
                              Start
                            </Button>
                          )}

                          {order.status === 'in-progress' && hasPermission('work_order:update') && (
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={(e) => { e.stopPropagation(); /* handleTransition(order.id, 'review') */ }}>
                              Complete
                            </Button>
                          )}

                          {order.status === 'review' && hasPermission('work_order:approve') && (
                            <Button size="sm" variant="outline" className="text-blue-800 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); /* handleTransition(order.id, 'completed') */ }}>
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle>Technician Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {technicians.map(tech => (
                  <Card
                    key={tech.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleTechnicianClick(tech as any)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleTechnicianClick(tech as any)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{tech.name}</h3>
                          <Badge
                            variant="outline"
                            className={
                              tech.availability === "available"
                                ? "bg-success/10 text-success border-success/20 mt-2"
                                : tech.availability === "busy"
                                  ? "bg-warning/10 text-warning border-warning/20 mt-2"
                                  : "bg-muted text-muted-foreground mt-2"
                            }
                          >
                            {tech.availability}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold">{tech.efficiency}%</p>
                          <p className="text-xs text-muted-foreground">Efficiency</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(tech.specialization) && tech.specialization.map((spec: string) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Work Orders: {tech.activeWorkOrders}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
