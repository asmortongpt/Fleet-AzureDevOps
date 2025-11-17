import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, 
  Warning, 
  CheckCircle, 
  Clock,
  Wrench,
  Car
} from "@phosphor-icons/react"
import { MaintenanceRequest as MaintenanceRequestType } from "@/lib/types"
import { useFleetData } from "@/hooks/use-fleet-data"
import { toast } from "sonner"

interface MaintenanceRequestProps {
  data: ReturnType<typeof useFleetData>
}

export function MaintenanceRequest({ data }: MaintenanceRequestProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState("")
  const [issueType, setIssueType] = useState("")
  const [priority, setPriority] = useState<MaintenanceRequestType["priority"]>("medium")
  const [description, setDescription] = useState("")
  const [requestedBy, setRequestedBy] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedVehicle) newErrors.selectedVehicle = "Vehicle is required"
    if (!issueType) newErrors.issueType = "Issue type is required"
    if (!description) newErrors.description = "Description is required"
    else if (description.length < 10) newErrors.description = "Description must be at least 10 characters"
    if (!requestedBy) newErrors.requestedBy = "Requester name is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      const missingFields = Object.keys(errors).map(key =>
        key.replace(/([A-Z])/g, ' $1').trim()
      ).join(', ')
      toast.error(`Missing or invalid fields: ${missingFields}`)
      return
    }

    const vehicle = data.vehicles?.find(v => v.id === selectedVehicle)
    if (!vehicle) return

    const newRequest: MaintenanceRequestType = {
      id: `mr-${Date.now()}`,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.number,
      issueType,
      priority,
      description,
      requestedBy,
      requestDate: new Date().toISOString().split('T')[0],
      status: "pending"
    }

    data.addMaintenanceRequest(newRequest)
    toast.success("Maintenance request submitted")

    setDialogOpen(false)
    setSelectedVehicle("")
    setIssueType("")
    setPriority("medium")
    setDescription("")
    setRequestedBy("")
    setErrors({})
  }

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

  const getStatusColor = (status: MaintenanceRequestType["status"]) => {
    const colors = {
      pending: "bg-warning/10 text-warning border-warning/20",
      approved: "bg-accent/10 text-accent border-accent/20",
      "in-progress": "bg-accent/10 text-accent border-accent/20",
      completed: "bg-success/10 text-success border-success/20"
    }
    return colors[status]
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {(vehicles || []).map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.number} - {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="issue-type">Issue Type</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger id="issue-type">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engine">Engine</SelectItem>
                    <SelectItem value="Brakes">Brakes</SelectItem>
                    <SelectItem value="Transmission">Transmission</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Tires">Tires</SelectItem>
                    <SelectItem value="AC/Heating">AC/Heating</SelectItem>
                    <SelectItem value="Suspension">Suspension</SelectItem>
                    <SelectItem value="Body/Paint">Body/Paint</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as MaintenanceRequestType["priority"])}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requested-by">Requested By</Label>
                <Input
                  id="requested-by"
                  placeholder="Your name"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
