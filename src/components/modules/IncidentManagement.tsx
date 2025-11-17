import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  CarProfile,
  User,
  CalendarDots,
  MapPin,
  ClipboardText,
  ChartLine
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface Incident {
  id: string
  incident_title: string
  incident_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  incident_date: string
  incident_time?: string
  location?: string
  description?: string
  vehicle_id?: string
  vehicle_involved?: string
  driver_id?: string
  driver_name?: string
  reported_by_name?: string
  assigned_to_name?: string
  injuries_reported?: boolean
  injury_details?: string
  property_damage?: boolean
  damage_estimate?: number
  weather_conditions?: string
  road_conditions?: string
  police_report_number?: string
  resolution_notes?: string
  root_cause?: string
  preventive_measures?: string
  action_count?: number
  photo_count?: number
  created_at?: string
  closed_date?: string
}

interface CorrectiveAction {
  id: string
  action_type: string
  action_description: string
  assigned_to_name?: string
  due_date?: string
  completed_date?: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  performed_by_name?: string
  timestamp: string
}

export function IncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([])
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])

  const [newIncident, setNewIncident] = useState<Partial<Incident>>({
    incident_title: "",
    incident_type: "accident",
    severity: "medium",
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: "",
    location: "",
    description: "",
    vehicle_id: "",
    driver_id: "",
    injuries_reported: false,
    property_damage: false,
    weather_conditions: "",
    road_conditions: ""
  })

  const [closureData, setClosureData] = useState({
    resolution_notes: "",
    root_cause: "",
    preventive_measures: ""
  })

  const [newAction, setNewAction] = useState({
    action_description: "",
    action_type: "corrective",
    assigned_to: "",
    due_date: ""
  })

  // Fetch incidents on component mount
  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterSeverity !== "all") params.append("severity", filterSeverity)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const response = await apiClient.get(`/api/incident-management?${params.toString()}`)
      setIncidents(response.incidents || [])
    } catch (error) {
      console.error("Error fetching incidents:", error)
      toast.error("Failed to load incidents")
    } finally {
      setLoading(false)
    }
  }

  const fetchIncidentDetails = async (incidentId: string) => {
    try {
      const response = await apiClient.get(`/api/incident-management/${incidentId}`)
      setCorrectiveActions(response.corrective_actions || [])
      setTimeline(response.timeline || [])
    } catch (error) {
      console.error("Error fetching incident details:", error)
    }
  }

  const handleAddIncident = async () => {
    if (!newIncident.incident_title || !newIncident.incident_date) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const response = await apiClient.get("/api/incident-management", {
        method: "POST",
        body: JSON.stringify(newIncident)
      })

      setIncidents(current => [...current, response.incident])
      toast.success("Incident reported successfully")
      setIsAddDialogOpen(false)
      resetNewIncident()
    } catch (error) {
      console.error("Error creating incident:", error)
      toast.error("Failed to report incident")
    }
  }

  const handleUpdateIncident = async (incidentId: string, updates: Partial<Incident>) => {
    try {
      const response = await apiClient.get(`/api/incident-management/${incidentId}`, {
        method: "PUT",
        body: JSON.stringify(updates)
      })

      setIncidents(current =>
        current.map(i => (i.id === incidentId ? response.incident : i))
      )
      toast.success("Incident updated successfully")
    } catch (error) {
      console.error("Error updating incident:", error)
      toast.error("Failed to update incident")
    }
  }

  const handleAddAction = async () => {
    if (!selectedIncident || !newAction.action_description) {
      toast.error("Please provide action details")
      return
    }

    try {
      await apiClient.get(`/api/incident-management/${selectedIncident.id}/actions`, {
        method: "POST",
        body: JSON.stringify(newAction)
      })

      fetchIncidentDetails(selectedIncident.id)
      setNewAction({
        action_description: "",
        action_type: "corrective",
        assigned_to: "",
        due_date: ""
      })
      toast.success("Corrective action added")
    } catch (error) {
      console.error("Error adding action:", error)
      toast.error("Failed to add action")
    }
  }

  const handleCloseIncident = async () => {
    if (!selectedIncident) return

    if (!closureData.resolution_notes || !closureData.root_cause) {
      toast.error("Please provide resolution details and root cause")
      return
    }

    try {
      await apiClient.get(`/api/incident-management/${selectedIncident.id}/close`, {
        method: "POST",
        body: JSON.stringify(closureData)
      })

      fetchIncidents()
      setIsCloseDialogOpen(false)
      setIsDetailsDialogOpen(false)
      toast.success("Incident closed successfully")
      setClosureData({
        resolution_notes: "",
        root_cause: "",
        preventive_measures: ""
      })
    } catch (error) {
      console.error("Error closing incident:", error)
      toast.error("Failed to close incident")
    }
  }

  const resetNewIncident = () => {
    setNewIncident({
      incident_title: "",
      incident_type: "accident",
      severity: "medium",
      incident_date: new Date().toISOString().split('T')[0],
      incident_time: "",
      location: "",
      description: "",
      vehicle_id: "",
      driver_id: "",
      injuries_reported: false,
      property_damage: false,
      weather_conditions: "",
      road_conditions: ""
    })
  }

  const filteredIncidents = (incidents || []).filter(incident => {
    const matchesSearch =
      incident.incident_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesSeverity = filterSeverity === "all" || incident.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || incident.status === filterStatus

    return matchesSearch && matchesSeverity && matchesStatus
  })

  // Statistics
  const totalIncidents = incidents.length
  const openIncidents = (incidents || []).filter(i => i.status === 'open' || i.status === 'investigating').length
  const criticalIncidents = (incidents || []).filter(i => i.severity === 'critical').length
  const resolvedIncidents = (incidents || []).filter(i => i.status === 'resolved' || i.status === 'closed').length

  const getSeverityColor = (severity: Incident['severity']) => {
    const colors = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700"
    }
    return colors[severity]
  }

  const getStatusColor = (status: Incident['status']) => {
    const colors = {
      open: "bg-yellow-100 text-yellow-700",
      investigating: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-700"
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Incident Management</h2>
          <p className="text-muted-foreground">Track and investigate fleet incidents and safety events</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report New Incident</DialogTitle>
              <DialogDescription>
                Document an incident for investigation and resolution
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-title">Incident Title *</Label>
                  <Input
                    id="incident-title"
                    value={newIncident.incident_title}
                    onChange={e => setNewIncident({ ...newIncident, incident_title: e.target.value })}
                    placeholder="Vehicle collision on I-95"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-type">Incident Type *</Label>
                  <Select
                    value={newIncident.incident_type}
                    onValueChange={value => setNewIncident({ ...newIncident, incident_type: value })}
                  >
                    <SelectTrigger id="incident-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accident">Vehicle Accident</SelectItem>
                      <SelectItem value="injury">Employee Injury</SelectItem>
                      <SelectItem value="property_damage">Property Damage</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="safety_violation">Safety Violation</SelectItem>
                      <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={newIncident.severity}
                    onValueChange={value => setNewIncident({ ...newIncident, severity: value as Incident['severity'] })}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incident-date">Incident Date *</Label>
                  <Input
                    id="incident-date"
                    type="date"
                    value={newIncident.incident_date}
                    onChange={e => setNewIncident({ ...newIncident, incident_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="incident-time">Time</Label>
                  <Input
                    id="incident-time"
                    type="time"
                    value={newIncident.incident_time}
                    onChange={e => setNewIncident({ ...newIncident, incident_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newIncident.location}
                    onChange={e => setNewIncident({ ...newIncident, location: e.target.value })}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIncident.description}
                  onChange={e => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Detailed description of what happened..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle Involved</Label>
                  <Select
                    value={newIncident.vehicle_id}
                    onValueChange={value => setNewIncident({ ...newIncident, vehicle_id: value })}
                  >
                    <SelectTrigger id="vehicle">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle-1">Fleet-001</SelectItem>
                      <SelectItem value="vehicle-2">Fleet-002</SelectItem>
                      <SelectItem value="vehicle-3">Fleet-003</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driver">Driver Involved</Label>
                  <Select
                    value={newIncident.driver_id}
                    onValueChange={value => setNewIncident({ ...newIncident, driver_id: value })}
                  >
                    <SelectTrigger id="driver">
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver-1">John Doe</SelectItem>
                      <SelectItem value="driver-2">Jane Smith</SelectItem>
                      <SelectItem value="driver-3">Bob Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weather">Weather Conditions</Label>
                  <Select
                    value={newIncident.weather_conditions}
                    onValueChange={value => setNewIncident({ ...newIncident, weather_conditions: value })}
                  >
                    <SelectTrigger id="weather">
                      <SelectValue placeholder="Select weather" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="cloudy">Cloudy</SelectItem>
                      <SelectItem value="rain">Rain</SelectItem>
                      <SelectItem value="snow">Snow</SelectItem>
                      <SelectItem value="fog">Fog</SelectItem>
                      <SelectItem value="ice">Ice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="road">Road Conditions</Label>
                  <Select
                    value={newIncident.road_conditions}
                    onValueChange={value => setNewIncident({ ...newIncident, road_conditions: value })}
                  >
                    <SelectTrigger id="road">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dry">Dry</SelectItem>
                      <SelectItem value="wet">Wet</SelectItem>
                      <SelectItem value="snow">Snow</SelectItem>
                      <SelectItem value="ice">Ice</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="injuries"
                    checked={newIncident.injuries_reported}
                    onChange={e => setNewIncident({ ...newIncident, injuries_reported: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="injuries">Injuries Reported</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="damage"
                    checked={newIncident.property_damage}
                    onChange={e => setNewIncident({ ...newIncident, property_damage: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="damage">Property Damage</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddIncident}>Report Incident</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ClipboardText className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open/Investigating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{openIncidents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" />
              Active cases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalIncidents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Warning className="w-3 h-3" weight="fill" />
              High priority
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedIncidents}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3" />
              {totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0}% closed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
          <CardDescription>Track and manage all fleet incidents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No incidents found. Report your first incident to track and manage safety events.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncidents.map(incident => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{incident.incident_title}</div>
                        <div className="text-xs text-muted-foreground">
                          Reported by {incident.reported_by_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{incident.incident_type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(incident.incident_date).toLocaleDateString()}
                      </div>
                      {incident.incident_time && (
                        <div className="text-xs text-muted-foreground">{incident.incident_time}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {incident.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-32">{incident.location}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {incident.vehicle_involved ? (
                        <div className="flex items-center gap-1 text-sm">
                          <CarProfile className="w-3 h-3 text-muted-foreground" />
                          {incident.vehicle_involved}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(incident.severity)} variant="secondary">
                        {incident.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(incident.status)} variant="secondary">
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedIncident(incident)
                          fetchIncidentDetails(incident.id)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Incident Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incident Details</DialogTitle>
            <DialogDescription>
              {selectedIncident?.incident_title}
            </DialogDescription>
          </DialogHeader>
          {selectedIncident && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="actions">
                  Actions ({correctiveActions.length})
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  Timeline ({timeline.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Incident Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span>
                        <p className="font-medium">{selectedIncident.incident_title}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium capitalize">
                          {selectedIncident.incident_type.replace('_', ' ')}
                        </p>
                      </div>
                      {selectedIncident.description && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="font-medium">{selectedIncident.description}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Severity:</span>
                        <Badge className={getSeverityColor(selectedIncident.severity)} variant="secondary">
                          {selectedIncident.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(selectedIncident.status)} variant="secondary">
                          {selectedIncident.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Incident Details</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">
                          {new Date(selectedIncident.incident_date).toLocaleDateString()}
                          {selectedIncident.incident_time && ` at ${selectedIncident.incident_time}`}
                        </p>
                      </div>
                      {selectedIncident.location && (
                        <div>
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-medium">{selectedIncident.location}</p>
                        </div>
                      )}
                      {selectedIncident.vehicle_involved && (
                        <div>
                          <span className="text-muted-foreground">Vehicle:</span>
                          <p className="font-medium">{selectedIncident.vehicle_involved}</p>
                        </div>
                      )}
                      {selectedIncident.driver_name && (
                        <div>
                          <span className="text-muted-foreground">Driver:</span>
                          <p className="font-medium">{selectedIncident.driver_name}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Reported By:</span>
                        <p className="font-medium">{selectedIncident.reported_by_name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedIncident.status !== 'closed' && (
                  <div className="pt-4">
                    <Button onClick={() => {
                      setIsCloseDialogOpen(true)
                      setIsDetailsDialogOpen(false)
                    }}>
                      Close Incident
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-4">
                  {correctiveActions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No corrective actions yet. Add actions to track resolution.
                    </div>
                  ) : (
                    correctiveActions.map(action => (
                      <Card key={action.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">{action.action_description}</CardTitle>
                            <Badge variant={action.status === 'completed' ? 'default' : 'secondary'}>
                              {action.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <span className="ml-2 capitalize">{action.action_type}</span>
                            </div>
                            {action.assigned_to_name && (
                              <div>
                                <span className="text-muted-foreground">Assigned To:</span>
                                <span className="ml-2">{action.assigned_to_name}</span>
                              </div>
                            )}
                            {action.due_date && (
                              <div>
                                <span className="text-muted-foreground">Due:</span>
                                <span className="ml-2">
                                  {new Date(action.due_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <Label>Add Corrective Action</Label>
                  <Textarea
                    value={newAction.action_description}
                    onChange={e => setNewAction({ ...newAction, action_description: e.target.value })}
                    placeholder="Describe the corrective action..."
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newAction.action_type}
                      onValueChange={value => setNewAction({ ...newAction, action_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrective">Corrective</SelectItem>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="policy_update">Policy Update</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={newAction.due_date}
                      onChange={e => setNewAction({ ...newAction, due_date: e.target.value })}
                      placeholder="Due date"
                    />
                  </div>
                  <Button onClick={handleAddAction}>Add Action</Button>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <div className="space-y-4">
                  {timeline.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No timeline events yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-muted-foreground/20 pl-6 space-y-4">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-background" />
                          <div className="text-xs text-muted-foreground mb-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                          <div className="font-medium capitalize">
                            {event.event_type.replace('_', ' ')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.description}
                          </div>
                          {event.performed_by_name && (
                            <div className="text-xs text-muted-foreground mt-1">
                              By {event.performed_by_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Incident Dialog */}
      <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Incident</DialogTitle>
            <DialogDescription>
              Provide resolution details to close this incident
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes *</Label>
              <Textarea
                id="resolution"
                value={closureData.resolution_notes}
                onChange={e => setClosureData({ ...closureData, resolution_notes: e.target.value })}
                placeholder="How was this incident resolved?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="root-cause">Root Cause *</Label>
              <Textarea
                id="root-cause"
                value={closureData.root_cause}
                onChange={e => setClosureData({ ...closureData, root_cause: e.target.value })}
                placeholder="What caused this incident?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preventive">Preventive Measures</Label>
              <Textarea
                id="preventive"
                value={closureData.preventive_measures}
                onChange={e => setClosureData({ ...closureData, preventive_measures: e.target.value })}
                placeholder="What steps will prevent this from happening again?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCloseIncident}>Close Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
