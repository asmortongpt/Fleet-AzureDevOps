import {
  Plus,
  CheckCircle,
  Clock,
  Wrench,
  Car
} from "@phosphor-icons/react"
import { useState } from "react"
import { toast } from "sonner"

import { MaintenanceRequestDialog } from "./MaintenanceRequestDialog"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFleetData } from "@/hooks/use-fleet-data"
import { MaintenanceSchedule } from "@/lib/types"


interface MaintenanceRequestProps {
  data: ReturnType<typeof useFleetData>
}

export function MaintenanceRequest({ data }: MaintenanceRequestProps) {
  const [dialogOpen, setDialogOpen] = useState(false)


  const handleStatusChange = (id: string, status: MaintenanceSchedule["status"]) => {
    data.updateMaintenanceRequest(id, { status })
    toast.success(`Request ${status}`)
  }

  const getPriorityColor = (priority: MaintenanceSchedule["priority"]) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-accent/10 text-accent border-accent/20",
      high: "bg-warning/10 text-warning border-warning/20",
      urgent: "bg-destructive/10 text-destructive border-destructive/20"
    }
    return colors[priority]
  }

  const getStatusColor = (status: MaintenanceSchedule["status"]) => {
    const colors: Record<MaintenanceSchedule["status"], string> = {
      scheduled: "bg-muted text-muted-foreground",
      due: "bg-warning/10 text-warning border-warning/20",
      overdue: "bg-destructive/10 text-destructive border-destructive/20",
      completed: "bg-success/10 text-success border-success/20"
    }
    return colors[status]
  }

  const requests = data.maintenanceRequests || []
  const vehicles = data.vehicles || []

  const scheduledCount = requests.filter(r => r.status === "scheduled").length
  const dueCount = requests.filter(r => r.status === "due").length
  const overdueCount = requests.filter(r => r.status === "overdue").length


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Maintenance Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit and track vehicle maintenance requests</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
        <MaintenanceRequestDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          data={data}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-muted rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-semibold metric-number">{scheduledCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 text-warning rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due</p>
                <p className="text-2xl font-semibold metric-number">{dueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold metric-number">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No maintenance requests yet</p>
              <p className="text-sm text-muted-foreground">Create your first request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{request.vehicleNumber}</h4>
                        <p className="text-sm text-muted-foreground">{request.serviceType}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={getPriorityColor(request.priority)}>
                        {request.priority}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm mb-3">{request.notes || "No notes"}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Scheduled for {request.nextDue}
                    </div>
                    {request.status === "due" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "completed")}>
                        Complete
                      </Button>
                    )}
                    {request.status === "overdue" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(request.id, "completed")}>
                          Complete Overdue
                        </Button>
                      </div>
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
