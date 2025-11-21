import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/MetricCard"
import { 
  Wrench, 
  User, 
  Clock, 
  CurrencyDollar,
  CheckCircle,
  Warning,
  Plus
} from "@phosphor-icons/react"
import { ServiceBay, WorkOrder, Technician } from "@/lib/types"
import { useState } from "react"
import { useFleetData } from "@/hooks/use-fleet-data"

interface GarageServiceProps {
  data?: any
  data: ReturnType<typeof useFleetData>
}

export function GarageService({ data }: GarageServiceProps) {
  const serviceBays = data.serviceBays || []
  const workOrders = data.workOrders || []
  const technicians = data.technicians || []
  const [activeTab, setActiveTab] = useState<string>("dashboard")

  const metrics = {
    availableBays: serviceBays.filter(b => b.status === "available").length,
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
      cancelled: "bg-muted text-muted-foreground"
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Garage & Service Center</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Work Order
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="service-bays">Service Bays</TabsTrigger>
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Available Bays"
              value={metrics.availableBays}
              subtitle={`of ${serviceBays.length} total`}
              icon={<Wrench className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Active Work Orders"
              value={metrics.activeWorkOrders}
              subtitle="in progress"
              icon={<Clock className="w-5 h-5" />}
              status="success"
            />
            <MetricCard
              title="Available Technicians"
              value={metrics.availableTechs}
              subtitle={`of ${technicians.length} total`}
              icon={<User className="w-5 h-5" />}
              status="info"
            />
            <MetricCard
              title="Overdue Maintenance"
              value={metrics.overdueJobs}
              subtitle="requires attention"
              icon={<Warning className="w-5 h-5" />}
              status={metrics.overdueJobs > 5 ? "warning" : "success"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Bay Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceBays.map(bay => (
                    <div key={bay.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{bay.number}</p>
                        {bay.vehicle && (
                          <p className="text-sm text-muted-foreground">{bay.vehicle} • {bay.serviceType}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={bay.status === "available" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
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
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceBays.map(bay => (
                  <Card key={bay.id} className={bay.status === "available" ? "border-success/50" : "border-warning/50"}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{bay.number}</h3>
                          <Badge variant="outline" className={bay.status === "available" ? "bg-success/10 text-success border-success/20 mt-2" : "bg-warning/10 text-warning border-warning/20 mt-2"}>
                            {bay.status}
                          </Badge>
                        </div>
                        {bay.status === "occupied" && (
                          <Wrench className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      {bay.vehicle && (
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
                      {bay.status === "available" && (
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
          <Card>
            <CardHeader>
              <CardTitle>All Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium">{order.vehicleNumber}</p>
                        <Badge variant="outline" className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.serviceType}</p>
                      <p className="text-xs text-muted-foreground mt-1">Created: {order.createdDate}</p>
                    </div>
                    <div className="text-right">
                      {order.cost && (
                        <p className="font-semibold">${order.cost}</p>
                      )}
                      {order.assignedTo && (
                        <p className="text-sm text-muted-foreground">{order.assignedTo}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians">
          <Card>
            <CardHeader>
              <CardTitle>Technician Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicians.map(tech => (
                  <Card key={tech.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
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
                          <p className="text-2xl font-semibold">{tech.efficiency}%</p>
                          <p className="text-xs text-muted-foreground">Efficiency</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Specializations:</p>
                          <div className="flex flex-wrap gap-1">
                            {tech.specialization.map(spec => (
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

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure and manage recurring maintenance schedules, service intervals, and automatic work order generation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
