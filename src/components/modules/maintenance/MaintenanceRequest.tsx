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
import { MaintenanceRequest as MaintenanceRequestType } from "@/lib/types"


interface MaintenanceRequestProps {
  data: ReturnType<typeof useFleetData>
}

export function MaintenanceRequest({ data }: MaintenanceRequestProps) {
  const [dialogOpen, setDialogOpen] = useState(false)


  const handleStatusChange = (id: string, status: MaintenanceRequestType["status"]) => {
    data.updateMaintenanceRequest(id, { status })
    toast.success(`Request ${status}`)
  }

  const getPriorityColor = (priority: MaintenanceRequestType["priority"]) => {
    const colors = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-accent/10 text-accent border-accent/20",
      high: "bg-warning/10 text-warning border-warning/20",
      urgent: "bg-destructive/10 text-destructive border-destructive/20"
    }
    return colors[priority]
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-accent/10 text-accent border-accent/20",
      "in-progress": "bg-accent/10 text-accent border-accent/20",
      completed: "bg-success/10 text-success border-success/20",
      due: "bg-warning/10 text-warning border-warning/20",
      overdue: "bg-destructive/10 text-destructive border-destructive/20"
    }
    return colors[status] || "bg-muted text-muted-foreground"
  }

  const requests = data.maintenanceRequests || []
  const vehicles = data.vehicles || []

  const pendingCount = requests.filter(r => r.status === "pending").length
  const approvedCount = requests.filter(r => r.status === "approved").length
  const inProgressCount = requests.filter(r => r.status === "in-progress").length


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
              <div className="p-3 bg-warning/10 text-warning rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold metric-number">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 text-accent rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-semibold metric-number">{approvedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/10 text-accent rounded-lg">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold metric-number">{inProgressCount}</p>
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
                        <p className="text-sm text-muted-foreground">{request.issueType}</p>
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

                  <p className="text-sm mb-3">{request.description}</p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                      Requested by {request.requestedBy} on {request.requestDate}
                    </div>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "in-progress")}>
                          Start Work
                        </Button>
                      </div>
                    )}
                    {request.status === "approved" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "in-progress")}>
                        Start Work
                      </Button>
                    )}
                    {request.status === "in-progress" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(request.id, "completed")}>
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
