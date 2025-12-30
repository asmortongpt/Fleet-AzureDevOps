import {
  Plus,
  MagnifyingGlass,
  Warning,
  CheckCircle,
  CarProfile,
  MapPin,
  ClipboardText
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import logger from '@/utils/logger'

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

interface ApiResponse<T> {
  incidents?: T[]
  incident?: T
  corrective_actions?: CorrectiveAction[]
  timeline?: TimelineEvent[]
}

export function IncidentManagement() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [_loading, setLoading] = useState(true)
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

      const response = await apiClient.get<ApiResponse<Incident>>(`/api/incident-management?${params.toString()}`)
      setIncidents(response.data?.incidents || [])
    } catch (error) {
      logger.error("Error fetching incidents:", error)
      toast.error("Failed to load incidents")
    } finally {
      setLoading(false)
    }
  }

  const fetchIncidentDetails = async (incidentId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<Incident>>(`/api/incident-management/${incidentId}`)
      setCorrectiveActions(response.data?.corrective_actions || [])
      setTimeline(response.data?.timeline || [])
    } catch (error) {
      logger.error("Error fetching incident details:", error)
    }
  }

  const handleAddIncident = async () => {
    if (!newIncident.incident_title || !newIncident.incident_date) {
      toast.error("Please fill in required fields")
      return
    }

    try {
      const response = await apiClient.post<ApiResponse<Incident>>("/api/incident-management", newIncident)
      setIncidents(current => [...current, response.data?.incident as Incident])
      toast.success("Incident reported successfully")
      setIsAddDialogOpen(false)
      resetNewIncident()
    } catch (error) {
      logger.error("Error creating incident:", error)
      toast.error("Failed to report incident")
    }
  }

  const _handleUpdateIncident = async (incidentId: string, updates: Partial<Incident>) => {
    try {
      const response = await apiClient.put<ApiResponse<Incident>>(`/api/incident-management/${incidentId}`, updates)
      setIncidents(current =>
        current.map(i => (i.id === incidentId ? response.data?.incident as Incident : i))
      )
      toast.success("Incident updated successfully")
    } catch (error) {
      logger.error("Error updating incident:", error)
      toast.error("Failed to update incident")
    }
  }

  const handleAddAction = async () => {
    if (!selectedIncident || !newAction.action_description) {
      toast.error("Please provide action details")
      return
    }

    try {
      await apiClient.post(`/api/incident-management/${selectedIncident.id}/actions`, newAction)
      fetchIncidentDetails(selectedIncident.id)
      setNewAction({
        action_description: "",
        action_type: "corrective",
        assigned_to: "",
        due_date: ""
      })
      toast.success("Corrective action added")
    } catch (error) {
      logger.error("Error adding action:", error)
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
      await apiClient.post(`/api/incident-management/${selectedIncident.id}/close`, closureData)
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
      logger.error("Error closing incident:", error)
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
                  <Label htmlFor="vehicle">V
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}