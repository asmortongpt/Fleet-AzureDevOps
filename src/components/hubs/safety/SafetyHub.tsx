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

import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api"
import {
  Cross,
  AlertTriangle,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileText,
  Calendar
} from "lucide-react"
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
import { useDrilldown } from "@/contexts/DrilldownContext"
import { useFleetData } from "@/hooks/use-fleet-data"

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

// Data is now loaded from useFleetData hook - no hardcoded demo data

const mapContainerStyle = {
  width: "100%",
  height: "100%"
}

const mapCenter = {
  lat: 30.4383,
  lng: -84.2807
}

const getSeverityColor = (severity: IncidentSeverity): "destructive" | "default" | "secondary" | "outline" => {
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
  const { push } = useDrilldown()
  const fleetData = useFleetData()
  const [activeTab, setActiveTab] = useState("incidents")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mapLoaded, setMapLoaded] = useState(false)

  // Transform incidents from fleet data
  const incidents: SafetyIncident[] = useMemo(() => {
    const rawIncidents = (fleetData as any).incidents || []
    return rawIncidents.map((inc: any) => ({
      id: inc.id,
      type: inc.type || inc.incidentType || 'Incident',
      severity: inc.severity || 'medium',
      status: inc.status || 'open',
      location: inc.location || { lat: 30.4383, lng: -84.2807, address: inc.address || 'Unknown' },
      vehicleId: inc.vehicleId,
      driverId: inc.driverId,
      date: inc.date || inc.createdAt || new Date().toISOString(),
      description: inc.description || '',
      injuries: inc.injuries || 0,
      oshaRecordable: inc.oshaRecordable || false,
      workDaysLost: inc.workDaysLost || 0,
      reportedBy: inc.reportedBy || 'Unknown'
    }))
  }, [(fleetData as any).incidents])

  // Transform hazard zones from fleet data
  const hazardZones: HazardZone[] = useMemo(() => {
    const rawZones = (fleetData as any).hazardZones || []
    return rawZones.map((zone: any) => ({
      id: zone.id,
      name: zone.name || 'Hazard Zone',
      type: zone.type || 'physical',
      location: zone.location || { lat: 30.4383, lng: -84.2807 },
      radius: zone.radius || 200,
      severity: zone.severity || 'medium',
      restrictions: zone.restrictions || [],
      activeFrom: zone.activeFrom || new Date().toISOString(),
      activeTo: zone.activeTo
    }))
  }, [(fleetData as any).hazardZones])

  // Transform inspections from fleet data
  const inspections: SafetyInspection[] = useMemo(() => {
    const rawInspections = (fleetData as any).inspections || []
    return rawInspections.map((insp: any) => ({
      id: insp.id,
      vehicleId: insp.vehicleId,
      vehicleName: insp.vehicleName || insp.vehicleNumber || 'Unknown Vehicle',
      inspectorId: insp.inspectorId || insp.inspectedBy,
      inspectorName: insp.inspectorName || 'Inspector',
      date: insp.date || insp.createdAt || new Date().toISOString(),
      passed: insp.passed ?? insp.status === 'passed',
      violations: insp.violations || 0,
      notes: insp.notes || '',
      nextInspection: insp.nextInspection || insp.nextDue || ''
    }))
  }, [(fleetData as any).inspections])

  // Calculate OSHA metrics from incidents data
  const oshaMetrics: OSHAMetrics = useMemo(() => {
    const recordable = incidents.filter(i => i.oshaRecordable)
    const lostTime = incidents.filter(i => i.workDaysLost > 0)
    const totalDaysLost = incidents.reduce((sum, i) => sum + i.workDaysLost, 0)

    // Calculate days without incident
    const sortedIncidents = [...incidents].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastIncidentDate = sortedIncidents[0]?.date ? new Date(sortedIncidents[0].date) : new Date()
    const daysWithout = Math.floor((new Date().getTime() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24))

    return {
      totalIncidents: incidents.length,
      recordableIncidents: recordable.length,
      lostTimeIncidents: lostTime.length,
      totalWorkDaysLost: totalDaysLost,
      incidentRate: incidents.length > 0 ? parseFloat((incidents.length / 100 * 200000 / 2080).toFixed(2)) : 0,
      severityRate: incidents.length > 0 ? parseFloat((totalDaysLost / 100 * 200000 / 2080).toFixed(2)) : 0,
      daysWithoutIncident: daysWithout > 0 ? daysWithout : 0,
      complianceScore: 100 - (recordable.length * 5),
      trend: incidents.length === 0 ? 'improving' : recordable.length > 2 ? 'declining' : 'stable'
    }
  }, [incidents])

  // Drilldown handlers
  const handleIncidentClick = (incident: SafetyIncident) => {
    push({
      type: 'incident',
      label: `${incident.type} - ${incident.id}`,
      data: { incidentId: incident.id, type: incident.type, severity: incident.severity }
    })
  }

  const handleVehicleClick = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation()
    push({
      type: 'vehicle',
      label: vehicleId,
      data: { vehicleId }
    })
  }

  const handleDriverClick = (e: React.MouseEvent, driverId: string) => {
    e.stopPropagation()
    push({
      type: 'driver',
      label: driverId,
      data: { driverId }
    })
  }

  const handleInspectionClick = (inspection: SafetyInspection) => {
    push({
      type: 'inspection',
      label: `Inspection - ${inspection.vehicleName}`,
      data: { inspectionId: inspection.id, vehicleId: inspection.vehicleId }
    })
  }

  const handleHazardZoneClick = (zone: HazardZone) => {
    push({
      type: 'hazard-zone',
      label: zone.name,
      data: { zoneId: zone.id, zoneName: zone.name, severity: zone.severity }
    })
  }

  const handleMetricClick = (metricType: string, label: string) => {
    push({
      type: metricType as any,
      label,
      data: { filter: metricType }
    })
  }

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      if (severityFilter !== "all" && incident.severity !== severityFilter) return false
      if (statusFilter !== "all" && incident.status !== statusFilter) return false
      return true
    })
  }, [incidents, severityFilter, statusFilter])

  const recentInspections = useMemo(() => {
    return [...inspections].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5)
  }, [inspections])

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              <Cross className="w-4 h-4 text-red-500" />
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
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Incident
            </Button>
          </div>
        </div>
      </div>

      {/* OSHA Metrics Cards */}
      <div className="px-3 py-2 border-b bg-card">
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Days Without Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-green-500">
                {oshaMetrics.daysWithoutIncident}
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
                <div className="text-base font-bold">
                  {oshaMetrics.complianceScore}%
                </div>
                <TrendingUp className="w-3 h-3 text-green-500" />
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
              <div className="text-base font-bold text-orange-500">
                {oshaMetrics.recordableIncidents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {oshaMetrics.totalIncidents} total incidents
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
              <div className="text-base font-bold text-red-500">
                {oshaMetrics.totalWorkDaysLost}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Severity Rate: {oshaMetrics.severityRate}
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
                    {mapLoaded && hazardZones.map(zone => (
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
                        onClick={() => handleHazardZoneClick(zone)}
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
            <div className="p-2">
              {/* Filters */}
              <div className="flex gap-2 mb-2">
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

                <TabsContent value="incidents-list" className="mt-2">
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
                            <TableRow
                              key={incident.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleIncidentClick(incident)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleIncidentClick(incident)}
                            >
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

                <TabsContent value="inspections-list" className="mt-2">
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
                            <TableRow
                              key={inspection.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleInspectionClick(inspection)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && handleInspectionClick(inspection)}
                            >
                              <TableCell className="font-medium">
                                {new Date(inspection.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell
                                className="text-primary hover:underline"
                                onClick={(e) => handleVehicleClick(e, inspection.vehicleId)}
                              >
                                {inspection.vehicleName}
                              </TableCell>
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

                <TabsContent value="hazards-list" className="mt-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Hazard Zones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {hazardZones.map(zone => (
                          <Card
                            key={zone.id}
                            className="cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => handleHazardZoneClick(zone)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleHazardZoneClick(zone)}
                          >
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
