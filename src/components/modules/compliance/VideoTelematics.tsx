import {
  Search,
  Video,
  AlertTriangle,
  Eye,
  Play,
  Download,
  Lock,
  ShieldCheck,
  Clock
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { getCsrfToken } from "@/hooks/use-api"


interface VideoEvent {
  id: string
  tenantId: string
  vehicleId: string
  vehicleNumber: string
  driverId?: string
  driverName?: string
  eventType: "distraction" | "phone-use" | "drowsiness" | "tailgating" | "harsh-braking" | "harsh-acceleration" | "speeding" | "collision" | "near-miss" | "seatbelt" | "rolling-stop" | "lane-departure"
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  location: {
    lat: number
    lng: number
    address: string
  }
  speed: number
  videoUrl?: string
  thumbnailUrl?: string
  duration: number // seconds
  aiConfidence: number // 0-1
  reviewed: boolean
  reviewedBy?: string
  reviewedAt?: string
  coaching: {
    assigned: boolean
    assignedTo?: string
    status: "pending" | "in-progress" | "completed"
    notes?: string
  }
  retained: boolean
  retentionDays: number
}

interface PrivacySettings {
  enableAudioRecording: boolean
  videoRetentionPeriod: number
  autoDeleteAfterRetention: boolean
  blurFaces: boolean
  blurLicensePlates: boolean
  restrictAccessByRole: {
    admin: boolean
    manager: boolean
    driver: boolean
  }
  enableDriverOptOut: boolean
  notifyDriversOfRecording: boolean
  enableVideoEncryption: boolean
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const mapVideoEvent = (row: any): VideoEvent => ({
  id: row.id,
  tenantId: row.tenant_id,
  vehicleId: row.vehicle_id,
  vehicleNumber: row.vehicle_number || row.vehicle_name || row.vehicle_id,
  driverId: row.driver_id,
  driverName: row.driver_name,
  eventType: row.event_type,
  severity: row.severity,
  timestamp: row.event_date || row.created_at,
  location: {
    lat: Number(row.latitude || 0),
    lng: Number(row.longitude || 0),
    address: row.address || ""
  },
  speed: Number(row.speed_mph || 0),
  videoUrl: row.video_url,
  thumbnailUrl: row.thumbnail_url,
  duration: Number(row.duration || 0),
  aiConfidence: Number(row.ai_confidence || 0),
  reviewed: Boolean(row.reviewed),
  reviewedBy: row.reviewed_by_name || row.reviewed_by,
  reviewedAt: row.reviewed_at,
  coaching: {
    assigned: Boolean(row.coaching_assigned),
    assignedTo: row.coaching_assigned_name || row.coaching_assigned_to,
    status: row.coaching_status || "pending",
    notes: row.coaching_notes
  },
  retained: Boolean(row.retained),
  retentionDays: Number(row.retention_days || 0)
})

export function VideoTelematics() {
  const [events, setEvents] = useState<VideoEvent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterReviewed, setFilterReviewed] = useState<string>("all")
  const [selectedEvent, setSelectedEvent] = useState<VideoEvent | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isPrivacySettingsDialogOpen, setIsPrivacySettingsDialogOpen] = useState(false)

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    enableAudioRecording: true,
    videoRetentionPeriod: 30,
    autoDeleteAfterRetention: true,
    blurFaces: false,
    blurLicensePlates: false,
    restrictAccessByRole: {
      admin: true,
      manager: true,
      driver: false
    },
    enableDriverOptOut: false,
    notifyDriversOfRecording: true,
    enableVideoEncryption: true
  })

  const { data: eventsRaw, mutate: refreshEvents } = useSWR<any[]>(
    "/api/video-events?limit=200",
    fetcher,
    { refreshInterval: 60000, shouldRetryOnError: false }
  )

  useEffect(() => {
    if (Array.isArray(eventsRaw)) {
      setEvents(eventsRaw.map(mapVideoEvent))
    }
  }, [eventsRaw])

  const filteredEvents = (events || []).filter(event => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      event.vehicleNumber.toLowerCase().includes(term) ||
      (event.driverName || "").toLowerCase().includes(term) ||
      (event.location?.address || "").toLowerCase().includes(term)
    const matchesType = filterType === "all" || event.eventType === filterType
    const matchesSeverity = filterSeverity === "all" || event.severity === filterSeverity
    const matchesReviewed = 
      filterReviewed === "all" || 
      (filterReviewed === "reviewed" && event.reviewed) ||
      (filterReviewed === "unreviewed" && !event.reviewed)

    return matchesSearch && matchesType && matchesSeverity && matchesReviewed
  })

  const handleReview = async (eventId: string) => {
    try {
      const csrf = await getCsrfToken()
      const response = await fetch(`/api/video-events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body: JSON.stringify({
          reviewed: true,
          reviewed_at: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error("Failed to mark reviewed")
      }

      toast.success("Event marked as reviewed")
      refreshEvents()
    } catch (error) {
      toast.error("Unable to update event status")
    }
  }

  const handleAssignCoaching = async (eventId: string) => {
    try {
      const csrf = await getCsrfToken()
      const response = await fetch(`/api/video-events/${eventId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        body: JSON.stringify({
          coaching_assigned: true,
          coaching_status: "pending",
          coaching_notes: "Driver coaching required"
        })
      })

      if (!response.ok) {
        throw new Error("Failed to assign coaching")
      }

      toast.success("Coaching assigned to driver")
      refreshEvents()
    } catch (error) {
      toast.error("Unable to assign coaching")
    }
  }

  const handleViewEvent = (event: VideoEvent) => {
    setSelectedEvent(event)
    setIsViewDialogOpen(true)
  }

  const handleSavePrivacySettings = () => {
    // Validation
    if (privacySettings.videoRetentionPeriod < 1) {
      toast.error("Video retention period must be at least 1 day")
      return
    }

    if (!privacySettings.restrictAccessByRole.admin &&
        !privacySettings.restrictAccessByRole.manager &&
        !privacySettings.restrictAccessByRole.driver) {
      toast.error("At least one role must have access to video recordings")
      return
    }

    // Save settings (already saved to useKV state)
    setIsPrivacySettingsDialogOpen(false)
    toast.success("Privacy settings saved successfully", {
      description: `Video retention: ${privacySettings.videoRetentionPeriod} days, Encryption: ${privacySettings.enableVideoEncryption ? 'Enabled' : 'Disabled'}`
    })
  }

  const getEventTypeLabel = (type: VideoEvent["eventType"]) => {
    const labels = {
      distraction: "Distraction",
      "phone-use": "Phone Use",
      drowsiness: "Drowsiness",
      tailgating: "Tailgating",
      "harsh-braking": "Harsh Braking",
      "harsh-acceleration": "Harsh Acceleration",
      speeding: "Speeding",
      collision: "Collision",
      "near-miss": "Near Miss",
      seatbelt: "Seatbelt Violation",
      "rolling-stop": "Rolling Stop",
      "lane-departure": "Lane Departure"
    }
    return labels[type]
  }

  const getSeverityColor = (severity: VideoEvent["severity"]) => {
    const colors = {
      low: "bg-blue-100 text-blue-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700"
    }
    return colors[severity]
  }

  const getCoachingStatusColor = (status: VideoEvent["coaching"]["status"]) => {
    const colors = {
      pending: "bg-gray-100 text-gray-700",
      "in-progress": "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700"
    }
    return colors[status]
  }

  const totalEvents = (events || []).length
  const unreviewedEvents = (events || []).filter(e => !e.reviewed).length
  const coachingPending = (events || []).filter(e => e.coaching.assigned && e.coaching.status === "pending").length
  const criticalEvents = (events || []).filter(e => e.severity === "critical").length

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Video Telematics</h2>
          <p className="text-muted-foreground">
            AI-powered dashcam event detection with driver coaching workflows
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPrivacySettingsDialogOpen(true)}>
            <ShieldCheck className="w-4 h-4 mr-2" />
            Privacy Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{totalEvents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Video className="w-3 h-3" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-yellow-600">{unreviewedEvents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Eye className="w-3 h-3" />
              Pending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coaching Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-orange-600">{coachingPending}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              Assigned
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-red-600">{criticalEvents}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <AlertTriangle className="w-3 h-3" />
              High priority
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="distraction">Distraction</SelectItem>
            <SelectItem value="phone-use">Phone Use</SelectItem>
            <SelectItem value="drowsiness">Drowsiness</SelectItem>
            <SelectItem value="speeding">Speeding</SelectItem>
            <SelectItem value="harsh-braking">Harsh Braking</SelectItem>
            <SelectItem value="collision">Collision</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterReviewed} onValueChange={setFilterReviewed}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="unreviewed">Unreviewed</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Video Events ({filteredEvents.length})</CardTitle>
          <CardDescription>
            AI-detected safety events from dashcam footage with driver coaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Vehicle / Driver</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Coaching</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-3">
                    No video events found. Events will appear here when detected by AI.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{event.vehicleNumber}</div>
                        <div className="text-sm text-muted-foreground">{event.driverName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getEventTypeLabel(event.eventType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)} variant="secondary">
                        {event.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {Math.round(event.aiConfidence * 100)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.coaching.assigned ? (
                        <Badge
                          className={getCoachingStatusColor(event.coaching.status)}
                          variant="secondary"
                        >
                          {event.coaching.status}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEvent(event)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        {!event.reviewed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReview(event.id)}
                          >
                            Review
                          </Button>
                        )}
                        {!event.coaching.assigned && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssignCoaching(event.id)}
                          >
                            Coach
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent && getEventTypeLabel(selectedEvent.eventType)} -{" "}
              {selectedEvent?.vehicleNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-700">
                  <Video className="w-16 h-16 mx-auto mb-2" />
                  <p>Video Player</p>
                  <p className="text-sm">
                    {selectedEvent.duration}s clip at {selectedEvent.speed} mph
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Location</Label>
                  <p className="text-sm">{selectedEvent.location?.address}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">AI Confidence</Label>
                  <p className="text-sm">{Math.round(selectedEvent.aiConfidence * 100)}%</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Reviewed By</Label>
                  <p className="text-sm">
                    {selectedEvent.reviewedBy || <span className="text-muted-foreground">Not reviewed</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Retention</Label>
                  <p className="text-sm">{selectedEvent.retentionDays} days</p>
                </div>
              </div>

              {selectedEvent.coaching.assigned && (
                <div className="border-t pt-2">
                  <Label className="text-xs text-muted-foreground">Coaching Status</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Assigned to: {selectedEvent.coaching.assignedTo}</span>
                      <Badge
                        className={getCoachingStatusColor(selectedEvent.coaching.status)}
                        variant="secondary"
                      >
                        {selectedEvent.coaching.status}
                      </Badge>
                    </div>
                    {selectedEvent.coaching.notes && (
                      <p className="text-sm text-muted-foreground">{selectedEvent.coaching.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Download Clip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrivacySettingsDialogOpen} onOpenChange={setIsPrivacySettingsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Privacy Settings
            </DialogTitle>
            <DialogDescription>
              Configure privacy and data retention settings for video telematics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {/* Recording Settings */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Recording Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audio Recording</Label>
                  <p className="text-sm text-muted-foreground">Record audio along with video footage</p>
                </div>
                <Switch
                  checked={privacySettings.enableAudioRecording}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, enableAudioRecording: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify Drivers of Recording</Label>
                  <p className="text-sm text-muted-foreground">Display recording indicator to drivers</p>
                </div>
                <Switch
                  checked={privacySettings.notifyDriversOfRecording}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, notifyDriversOfRecording: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Driver Opt-Out</Label>
                  <p className="text-sm text-muted-foreground">Allow drivers to opt-out of video recording</p>
                </div>
                <Switch
                  checked={privacySettings.enableDriverOptOut}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, enableDriverOptOut: checked })
                  }
                />
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Data Retention</h3>

              <div className="space-y-2">
                <Label>Video Retention Period</Label>
                <Select
                  value={privacySettings.videoRetentionPeriod.toString()}
                  onValueChange={(value) =>
                    setPrivacySettings({ ...privacySettings, videoRetentionPeriod: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">How long to keep video recordings</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Delete After Retention</Label>
                  <p className="text-sm text-muted-foreground">Automatically delete videos after retention period</p>
                </div>
                <Switch
                  checked={privacySettings.autoDeleteAfterRetention}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, autoDeleteAfterRetention: checked })
                  }
                />
              </div>
            </div>

            {/* Privacy Protection */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Privacy Protection</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Blur Faces in Recordings</Label>
                  <p className="text-sm text-muted-foreground">Automatically blur faces for privacy</p>
                </div>
                <Switch
                  checked={privacySettings.blurFaces}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, blurFaces: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Blur License Plates</Label>
                  <p className="text-sm text-muted-foreground">Automatically blur license plates</p>
                </div>
                <Switch
                  checked={privacySettings.blurLicensePlates}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, blurLicensePlates: checked })
                  }
                />
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Access Control</h3>

              <div className="space-y-3">
                <Label>Restrict Access by Role</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-admin"
                      checked={privacySettings.restrictAccessByRole.admin}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          restrictAccessByRole: {
                            ...privacySettings.restrictAccessByRole,
                            admin: checked === true
                          }
                        })
                      }
                    />
                    <label
                      htmlFor="role-admin"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Admin
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-manager"
                      checked={privacySettings.restrictAccessByRole.manager}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          restrictAccessByRole: {
                            ...privacySettings.restrictAccessByRole,
                            manager: checked === true
                          }
                        })
                      }
                    />
                    <label
                      htmlFor="role-manager"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Manager
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="role-driver"
                      checked={privacySettings.restrictAccessByRole.driver}
                      onCheckedChange={(checked) =>
                        setPrivacySettings({
                          ...privacySettings,
                          restrictAccessByRole: {
                            ...privacySettings.restrictAccessByRole,
                            driver: checked === true
                          }
                        })
                      }
                    />
                    <label
                      htmlFor="role-driver"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Driver
                    </label>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Select which roles can access video recordings</p>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Security</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Video Encryption</Label>
                  <p className="text-sm text-muted-foreground">Encrypt videos when exporting or downloading</p>
                </div>
                <Switch
                  checked={privacySettings.enableVideoEncryption}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({ ...privacySettings, enableVideoEncryption: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrivacySettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrivacySettings}>
              <Lock className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
