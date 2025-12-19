/**
 * Safety Hub Component
 * Phase 3: Safety and Assets Hubs Implementation
 *
 * Features:
 * - Incident location map with severity overlay
 * - Hazard zones mapping
 * - Safety inspection routes
 * - Incident report panel
 * - OSHA compliance metrics dashboard
 */

import {
  FirstAid,
  Warning,
  MapPin,
  TrendUp,
  CheckCircle,
  XCircle,
  FileText,
  Calendar
} from "@phosphor-icons/react"
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api"
import { useState, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Safety incident severity levels
type IncidentSeverity = "critical" | "high" | "medium" | "low"
type IncidentStatus = "open" | "investigating" | "resolved" | "closed"
type HazardType = "chemical" | "physical" | "biological" | "ergonomic" | "environmental"

interface SafetyIncident {
  id: string
  type: string
  severity: IncidentSeverity
  status: IncidentStatus
  location: {
    lat: number
    lng: number
    address: string
  }
  vehicleId?: string
  driverId?: string
  date: string
  description: string
  injuries: number
  oshaRecordable: boolean
  workDaysLost: number
  reportedBy: string
}

interface HazardZone {
  id: string
  name: string
  type: HazardType
  location: {
    lat: number
    lng: number
  }
  radius: number // meters
  severity: "high" | "medium" | "low"
  restrictions: string[]
  activeFrom: string
  activeTo?: string
}

interface SafetyInspection {
  id: string
  vehicleId: string
  vehicleName: string
  inspectorId: string
  inspectorName: string
  date: string
  passed: boolean
  violations: number
  notes: string
  nextInspection: string
}

interface OSHAMetrics {
  totalIncidents: number
  recordableIncidents: number
  lostTimeIncidents: number
  totalWorkDaysLost: number
  incidentRate: number
  severityRate: number
  daysWithoutIncident: number
  complianceScore: number
  trend: "improving" | "stable" | "declining"
}

// Demo data for safety incidents
const demoIncidents: SafetyIncident[] = [
  {
    id: "inc-001",
    type: "Vehicle Collision",
    severity: "critical",
    status: "investigating",
    location: { lat: 30.4383, lng: -84.2807, address: "1500 S Adams St, Tallahassee, FL" },
    vehicleId: "veh-demo-1001",
    driverId: "drv-001",
    date: "2025-12-15",
    description: "Rear-end collision at intersection during peak hours",
    injuries: 2,
    oshaRecordable: true,
    workDaysLost: 5,
    reportedBy: "John Smith"
  },
  {
    id: "inc-002",
    type: "Slip and Fall",
    severity: "medium",
    status: "resolved",
    location: { lat: 30.4550, lng: -84.2500, address: "North Service Center, Tallahassee, FL" },
    date: "2025-12-10",
    description: "Employee slipped on wet floor in maintenance bay",
    injuries: 1,
    oshaRecordable: true,
    workDaysLost: 2,
    reportedBy: "Sarah Johnson"
  },
  {
    id: "inc-003",
    type: "Near Miss",
    severity: "low",
    status: "closed",
    location: { lat: 30.4200, lng: -84.3100, address: "South Warehouse, Tallahassee, FL" },
    date: "2025-12-08",
    description: "Forklift nearly collided with pedestrian in warehouse",
    injuries: 0,
    oshaRecordable: false,
    workDaysLost: 0,
    reportedBy: "Mike Davis"
  },
  {
    id: "inc-004",
    type: "Equipment Malfunction",
    severity: "high",
    status: "open",
    location: { lat: 30.4400, lng: -84.2600, address: "East Depot, Tallahassee, FL" },
    vehicleId: "veh-demo-1015",
    date: "2025-12-14",
    description: "Brake failure reported during routine operation",
    injuries: 0,
    oshaRecordable: false,
    workDaysLost: 0,
    reportedBy: "Lisa Chen"
  },
  {
    id: "inc-005",
    type: "Chemical Exposure",
    severity: "medium",
    status: "investigating",
    location: { lat: 30.4300, lng: -84.3000, address: "West Facility, Tallahassee, FL" },
    date: "2025-12-12",
    description: "Minor chemical spill during refueling operation",
    injuries: 0,
    oshaRecordable: true,
    workDaysLost: 1,
    reportedBy: "Tom Wilson"
  }
]

// Demo hazard zones
const demoHazardZones: HazardZone[] = [
  {
    id: "hz-001",
    name: "Construction Zone - I-10 East",
    type: "physical",
    location: { lat: 30.4500, lng: -84.2700 },
    radius: 500,
    severity: "high",
    restrictions: ["Speed limit 35 mph", "No lane changes", "Increased following distance"],
    activeFrom: "2025-12-01",
    activeTo: "2026-03-31"
  },
  {
    id: "hz-002",
    name: "Flood Prone Area - S Monroe St",
    type: "environmental",
    location: { lat: 30.4200, lng: -84.2800 },
    radius: 300,
    severity: "medium",
    restrictions: ["Avoid during heavy rain", "Check water levels", "Use alternate route if flooded"],
    activeFrom: "2025-06-01",
    activeTo: "2025-11-30"
  },
  {
    id: "hz-003",
    name: "Chemical Storage Facility",
    type: "chemical",
    location: { lat: 30.4600, lng: -84.2900 },
    radius: 200,
    severity: "high",
    restrictions: ["Authorized personnel only", "PPE required", "No smoking"],
    activeFrom: "2024-01-01"
  }
]

// Demo safety inspections
const demoInspections: SafetyInspection[] = [
  {
    id: "insp-001",
    vehicleId: "veh-demo-1001",
    vehicleName: "Ford F-150",
    inspectorId: "emp-001",
    inspectorName: "Safety Inspector A",
    date: "2025-12-14",
    passed: true,
    violations: 0,
    notes: "All safety systems operational",
    nextInspection: "2026-01-14"
  },
  {
    id: "insp-002",
    vehicleId: "veh-demo-1002",
    vehicleName: "Chevrolet Silverado",
    inspectorId: "emp-001",
    inspectorName: "Safety Inspector A",
    date: "2025-12-13",
    passed: false,
    violations: 2,
    notes: "Brake pad wear exceeds limits, windshield wiper replacement needed",
    nextInspection: "2025-12-20"
  },
  {
    id: "insp-003",
    vehicleId: "veh-demo-1003",
    vehicleName: "Mercedes Sprinter",
    inspectorId: "emp-002",
    inspectorName: "Safety Inspector B",
    date: "2025-12-12",
    passed: true,
    violations: 0,
    notes: "Excellent condition, no issues found",
    nextInspection: "2026-01-12"
  }
]

// Demo OSHA metrics
const demoOSHAMetrics: OSHAMetrics = {
  totalIncidents: 5,
  recordableIncidents: 3,
  lostTimeIncidents: 2,
  totalWorkDaysLost: 8,
  incidentRate: 2.4, // per 100 employees
  severityRate: 1.2,
  daysWithoutIncident: 2,
  complianceScore: 87,
  trend: "stable"
}

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const mapCenter = {
  lat: 30.4383,
  lng: -84.2807
}

const getSeverityColor = (severity: IncidentSeverity): string => {
  switch (severity) {
    case "critical": return "destructive"
    case "high": return "default"
    case "medium": return "secondary"
    case "low": return "outline"
  }
}

const getSeverityMapColor = (severity: string): string => {
  switch (severity) {
    case "critical": return "#dc2626"
    case "high": return "#ea580c"
    case "medium": return "#f59e0b"
    case "low": return "#22c55e"
    default: return "#6b7280"
  }
}

const getHazardColor = (severity: string): string => {
  switch (severity) {
    case "high": return "#dc2626"
    case "medium": return "#f59e0b"
    case "low": return "#22c55e"
    default: return "#6b7280"
  }
}

export function SafetyHub() {
  const [activeTab, setActiveTab] = useState("incidents")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mapLoaded, setMapLoaded] = useState(false)

  const filteredIncidents = useMemo(() => {
    return demoIncidents.filter(incident => {
      if (severityFilter !== "all" && incident.severity !== severityFilter) return false
      if (statusFilter !== "all" && incident.status !== statusFilter) return false
      return true
    })
  }, [severityFilter, statusFilter])

  const recentInspections = useMemo(() => {
    return [...demoInspections].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5)
  }, [])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FirstAid className="w-6 h-6 text-red-500" />
              Safety Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Incident tracking, hazard zones, and OSHA compliance monitoring
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <Warning className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </div>
        </div>
      </div>

      {/* OSHA Metrics Cards */}
      <div className="px-6 py-4 border-b bg-card">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Days Without Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {demoOSHAMetrics.daysWithoutIncident}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Target: 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                OSHA Compliance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold">
                  {demoOSHAMetrics.complianceScore}%
                </div>
                <TrendUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +3% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recordable Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {demoOSHAMetrics.recordableIncidents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {demoOSHAMetrics.totalIncidents} total incidents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Work Days Lost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {demoOSHAMetrics.totalWorkDaysLost}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Severity Rate: {demoOSHAMetrics.severityRate}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 h-full">
          {/* LEFT: Map */}
          <div className="border-r relative">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="incidents">Incident Map</TabsTrigger>
                <TabsTrigger value="hazards">Hazard Zones</TabsTrigger>
                <TabsTrigger value="inspections">Inspection Routes</TabsTrigger>
              </TabsList>

              <TabsContent value="incidents" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {mapLoaded && filteredIncidents.map(incident => (
                      <Marker
                        key={incident.id}
                        position={{ lat: incident.location.lat, lng: incident.location.lng }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: 12,
                          fillColor: getSeverityMapColor(incident.severity),
                          fillOpacity: 0.8,
                          strokeColor: "#fff",
                          strokeWeight: 2
                        }}
                        title={`${incident.type} - ${incident.severity}`}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>

              <TabsContent value="hazards" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {mapLoaded && demoHazardZones.map(zone => (
                      <Circle
                        key={zone.id}
                        center={{ lat: zone.location.lat, lng: zone.location.lng }}
                        radius={zone.radius}
                        options={{
                          fillColor: getHazardColor(zone.severity),
                          fillOpacity: 0.3,
                          strokeColor: getHazardColor(zone.severity),
                          strokeOpacity: 0.8,
                          strokeWeight: 2
                        }}
                      />
                    ))}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>

              <TabsContent value="inspections" className="flex-1 m-0 p-0">
                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={12}
                    onLoad={() => setMapLoaded(true)}
                    options={{
                      styles: [
                        { elementType: "geometry", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                      ]
                    }}
                  >
                    {/* Inspection route visualization would go here */}
                  </GoogleMap>
                </LoadScript>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Data Panel */}
          <div className="overflow-auto">
            <div className="p-4">
              {/* Filters */}
              <div className="flex gap-2 mb-4">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
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

              <Tabs defaultValue="incidents-list">
                <TabsList className="w-full">
                  <TabsTrigger value="incidents-list" className="flex-1">Incidents</TabsTrigger>
                  <TabsTrigger value="inspections-list" className="flex-1">Inspections</TabsTrigger>
                  <TabsTrigger value="hazards-list" className="flex-1">Hazard Zones</TabsTrigger>
                </TabsList>

                <TabsContent value="incidents-list" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Incidents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>OSHA</TableHead>
                            <TableHead className="text-right">Days Lost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredIncidents.map(incident => (
                            <TableRow key={incident.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {new Date(incident.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{incident.type}</TableCell>
                              <TableCell>
                                <Badge variant={getSeverityColor(incident.severity)}>
                                  {incident.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {incident.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {incident.oshaRecordable ? (
                                  <CheckCircle className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {incident.workDaysLost}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="inspections-list" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Safety Inspections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Vehicle</TableHead>
                            <TableHead>Inspector</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Violations</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentInspections.map(inspection => (
                            <TableRow key={inspection.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {new Date(inspection.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{inspection.vehicleName}</TableCell>
                              <TableCell>{inspection.inspectorName}</TableCell>
                              <TableCell>
                                {inspection.passed ? (
                                  <Badge variant="outline" className="bg-green-500/10 text-green-500">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Passed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-500/10 text-red-500">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {inspection.violations}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="hazards-list" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Hazard Zones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {demoHazardZones.map(zone => (
                          <Card key={zone.id}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{zone.name}</CardTitle>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} hazard
                                  </p>
                                </div>
                                <Badge variant={zone.severity === "high" ? "destructive" : "secondary"}>
                                  {zone.severity}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span>Radius: {zone.radius}m</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span>
                                    Active from {new Date(zone.activeFrom).toLocaleDateString()}
                                    {zone.activeTo && ` to ${new Date(zone.activeTo).toLocaleDateString()}`}
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm font-medium mb-1">Restrictions:</p>
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {zone.restrictions.map((restriction, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>{restriction}</span>
                                      </li>
                                    ))}
                                  </ul>
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
          </div>
        </div>
      </div>
    </div>
  )
}
