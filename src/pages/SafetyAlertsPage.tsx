/**
 * SafetyAlertsPage - Real-time Safety Alerts with OSHA Compliance
 * Route: /safety-alerts
 *
 * Features:
 * - Real-time safety alert monitoring
 * - OSHA compliance tracking (Forms 300, 300A, 301)
 * - Alert severity classification
 * - Drilldown panels for detailed analysis
 * - Industry-standard safety metrics
 */

import {
  Bell,
  Warning,
  CheckCircle,
  Clock,
  TrendUp,
  TrendDown,
  ShieldCheck,
  FileText,
  Eye,
  Download,
  Calendar,
  ChartLine,
  Funnel
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SafetyAlert {
  id: string
  alertNumber: string
  type: "injury" | "near-miss" | "hazard" | "osha-violation" | "equipment-failure" | "environmental"
  severity: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  location: string
  facilityId?: string
  vehicleId?: string
  driverId?: string
  reportedBy: string
  reportedAt: string
  status: "active" | "acknowledged" | "investigating" | "resolved" | "closed"
  oshaRecordable: boolean
  oshaFormRequired?: "300" | "300A" | "301"
  daysAwayFromWork?: number
  daysRestricted?: number
  requiresImmediateAction: boolean
  estimatedResolutionTime?: string
  actualResolutionTime?: string
  assignedTo?: string
  witnesses?: string[]
  photos?: string[]
  rootCause?: string
  correctiveActions?: string[]
  preventiveMeasures?: string[]
}

interface OSHAMetrics {
  totalRecordableIncidents: number
  daysAwayRestrictedTransfer: number
  totalCases: number
  incidentRate: number
  daysAwayFromWorkCaseRate: number
  lostWorkdayRate: number
  totalHoursWorked: number
  yearToDate: {
    injuries: number
    illnesses: number
    fatalities: number
  }
}

export default function SafetyAlertsPage() {
  const { push } = useDrilldown()
  const [alerts, setAlerts] = useState<SafetyAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<SafetyAlert[]>([])
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [oshaMetrics] = useState<OSHAMetrics>({
    totalRecordableIncidents: 12,
    daysAwayRestrictedTransfer: 8,
    totalCases: 12,
    incidentRate: 2.4,
    daysAwayFromWorkCaseRate: 1.6,
    lostWorkdayRate: 45,
    totalHoursWorked: 500000,
    yearToDate: {
      injuries: 8,
      illnesses: 4,
      fatalities: 0
    }
  })

  // Real-time alert simulation
  useEffect(() => {
    // Initialize with sample data
    const sampleAlerts: SafetyAlert[] = [
      {
        id: "alert-001",
        alertNumber: "SA-2025-001",
        type: "injury",
        severity: "critical",
        title: "Driver Injury - Forklift Operation",
        description: "Driver sustained hand injury while operating forklift at Warehouse B",
        location: "Warehouse B, Loading Bay 3",
        facilityId: "facility-002",
        vehicleId: "vehicle-fl-001",
        driverId: "driver-042",
        reportedBy: "Supervisor Jane Smith",
        reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "investigating",
        oshaRecordable: true,
        oshaFormRequired: "301",
        daysAwayFromWork: 3,
        requiresImmediateAction: true,
        assignedTo: "Safety Officer Mike Johnson",
        witnesses: ["John Doe", "Sarah Williams"]
      },
      {
        id: "alert-002",
        alertNumber: "SA-2025-002",
        type: "near-miss",
        severity: "high",
        title: "Near Miss - Pedestrian in Loading Zone",
        description: "Pedestrian almost struck by reversing truck in loading zone",
        location: "Main Distribution Center, Dock 7",
        facilityId: "facility-001",
        vehicleId: "vehicle-truck-045",
        reportedBy: "Guard Tom Anderson",
        reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: "acknowledged",
        oshaRecordable: false,
        requiresImmediateAction: true,
        preventiveMeasures: ["Install additional mirrors", "Enhanced signage"]
      },
      {
        id: "alert-003",
        alertNumber: "SA-2025-003",
        type: "hazard",
        severity: "medium",
        title: "Spill Hazard - Hydraulic Fluid Leak",
        description: "Hydraulic fluid leak detected on vehicle FL-023",
        location: "Maintenance Bay 2",
        vehicleId: "vehicle-fl-023",
        reportedBy: "Mechanic Carlos Rodriguez",
        reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: "resolved",
        oshaRecordable: false,
        requiresImmediateAction: false,
        correctiveActions: ["Replaced hydraulic line", "Cleaned spill area"]
      },
      {
        id: "alert-004",
        alertNumber: "SA-2025-004",
        type: "osha-violation",
        severity: "high",
        title: "Missing Safety Guard on Equipment",
        description: "Safety guard missing on conveyor belt system",
        location: "Processing Area C",
        facilityId: "facility-003",
        reportedBy: "Inspector Lisa Chen",
        reportedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        status: "active",
        oshaRecordable: false,
        requiresImmediateAction: true,
        estimatedResolutionTime: "24 hours"
      },
      {
        id: "alert-005",
        alertNumber: "SA-2025-005",
        type: "equipment-failure",
        severity: "medium",
        title: "Backup Alarm Malfunction",
        description: "Backup alarm not functioning on forklift FL-018",
        location: "Warehouse A",
        vehicleId: "vehicle-fl-018",
        reportedBy: "Operator Mark Thompson",
        reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: "resolved",
        oshaRecordable: false,
        requiresImmediateAction: true,
        actualResolutionTime: "2 hours",
        correctiveActions: ["Replaced backup alarm unit", "Tested all alarms"]
      },
      {
        id: "alert-006",
        alertNumber: "SA-2025-006",
        type: "environmental",
        severity: "low",
        title: "Minor Chemical Spill",
        description: "Small cleaning solution spill in break room",
        location: "Building A, Break Room",
        facilityId: "facility-001",
        reportedBy: "Janitor Maria Garcia",
        reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: "closed",
        oshaRecordable: false,
        requiresImmediateAction: false,
        correctiveActions: ["Cleaned spill", "Reviewed storage procedures"]
      }
    ]
    setAlerts(sampleAlerts)
    setFilteredAlerts(sampleAlerts)

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly update alert statuses
      setAlerts(prev => {
        const updated = [...prev]
        const randomIndex = Math.floor(Math.random() * updated.length)
        const statuses: SafetyAlert["status"][] = ["active", "acknowledged", "investigating", "resolved", "closed"]
        const currentStatusIndex = statuses.indexOf(updated[randomIndex].status)
        if (currentStatusIndex < statuses.length - 1) {
          updated[randomIndex] = {
            ...updated[randomIndex],
            status: statuses[currentStatusIndex + 1]
          }
        }
        return updated
      })
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = alerts

    if (filterSeverity !== "all") {
      filtered = filtered.filter(a => a.severity === filterSeverity)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(a => a.status === filterStatus)
    }

    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.description.toLowerCase().includes(term) ||
        a.alertNumber.toLowerCase().includes(term) ||
        a.location.toLowerCase().includes(term)
      )
    }

    setFilteredAlerts(filtered)
  }, [alerts, filterSeverity, filterStatus, filterType, searchTerm])

  const handleViewDetails = (alert: SafetyAlert) => {
    setSelectedAlert(alert)
    setDetailsOpen(true)

    // Also push to drilldown context for breadcrumb navigation
    push({
      type: 'safety-alert',
      data: { alert }
    })
  }

  const handleAcknowledge = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId && a.status === "active"
        ? { ...a, status: "acknowledged" }
        : a
    ))
    toast.success("Alert acknowledged")
  }

  const handleResolve = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId
        ? { ...a, status: "resolved", actualResolutionTime: new Date().toISOString() }
        : a
    ))
    toast.success("Alert marked as resolved")
  }

  const getSeverityBadge = (severity: SafetyAlert["severity"]) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-blue-100 text-blue-800 border-blue-200"
    }
    return (
      <Badge variant="outline" className={colors[severity]}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: SafetyAlert["status"]) => {
    const colors = {
      active: "bg-red-100 text-red-800",
      acknowledged: "bg-blue-100 text-blue-800",
      investigating: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    }
    return (
      <Badge className={colors[status]}>
        {status}
      </Badge>
    )
  }

  const getTypeIcon = (type: SafetyAlert["type"]) => {
    switch (type) {
      case "injury": return <Warning className="w-4 h-4 text-red-600" />
      case "near-miss": return <Warning className="w-4 h-4 text-orange-600" />
      case "hazard": return <Warning className="w-4 h-4 text-yellow-600" />
      case "osha-violation": return <FileText className="w-4 h-4 text-red-600" />
      case "equipment-failure": return <ChartLine className="w-4 h-4 text-orange-600" />
      case "environmental": return <ShieldCheck className="w-4 h-4 text-green-600" />
    }
  }

  const activeAlerts = alerts.filter(a => a.status === "active").length
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length
  const oshaRecordable = alerts.filter(a => a.oshaRecordable).length
  const avgResolutionTime = "4.2 hours" // Calculate from actual data

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="flex-none border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Bell className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Safety Alerts</h1>
                <p className="text-sm text-slate-400">Real-time safety monitoring with OSHA compliance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                OSHA Forms
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Active Alerts</p>
                    <p className="text-2xl font-bold text-white mt-1">{activeAlerts}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Bell className="w-5 h-5 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Critical</p>
                    <p className="text-2xl font-bold text-white mt-1">{criticalAlerts}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Warning className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">OSHA Recordable</p>
                    <p className="text-2xl font-bold text-white mt-1">{oshaRecordable}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide">Avg Resolution</p>
                    <p className="text-2xl font-bold text-white mt-1">{avgResolutionTime}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="alerts" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="alerts">Alert Dashboard</TabsTrigger>
            <TabsTrigger value="osha">OSHA Compliance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="flex-1 overflow-auto p-6 space-y-4">
            {/* Filters */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="grid grid-cols-5 gap-4">
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
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
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="near-miss">Near Miss</SelectItem>
                      <SelectItem value="hazard">Hazard</SelectItem>
                      <SelectItem value="osha-violation">OSHA Violation</SelectItem>
                      <SelectItem value="equipment-failure">Equipment Failure</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="gap-2">
                    <Funnel className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Table */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Safety Alerts ({filteredAlerts.length})</CardTitle>
                <CardDescription>Real-time safety incidents and hazards</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-slate-800/50">
                      <TableHead className="text-slate-300">Alert #</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Title</TableHead>
                      <TableHead className="text-slate-300">Location</TableHead>
                      <TableHead className="text-slate-300">Severity</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">OSHA</TableHead>
                      <TableHead className="text-slate-300">Reported</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map(alert => (
                      <TableRow
                        key={alert.id}
                        className="border-slate-700 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => handleViewDetails(alert)}
                      >
                        <TableCell className="font-mono text-slate-300">{alert.alertNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(alert.type)}
                            <span className="text-slate-300 capitalize">{alert.type.replace('-', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-medium">{alert.title}</TableCell>
                        <TableCell className="text-slate-300">{alert.location}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          {alert.oshaRecordable && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              {alert.oshaFormRequired || "Yes"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(alert.reportedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            {alert.status === "active" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAcknowledge(alert.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {(alert.status === "acknowledged" || alert.status === "investigating") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolve(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(alert)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="osha" className="flex-1 overflow-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">OSHA Incident Rates</CardTitle>
                  <CardDescription>Rates per 100 full-time workers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-400">Total Recordable Incident Rate (TRIR)</p>
                      <p className="text-2xl font-bold text-white">{oshaMetrics.incidentRate}</p>
                    </div>
                    <TrendDown className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-400">Days Away/Restricted Case Rate (DART)</p>
                      <p className="text-2xl font-bold text-white">{oshaMetrics.daysAwayFromWorkCaseRate}</p>
                    </div>
                    <TrendUp className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-400">Lost Workday Rate</p>
                      <p className="text-2xl font-bold text-white">{oshaMetrics.lostWorkdayRate}</p>
                    </div>
                    <TrendDown className="w-6 h-6 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Year-to-Date Statistics</CardTitle>
                  <CardDescription>Total hours worked: {oshaMetrics.totalHoursWorked.toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-2">Total Recordable Cases</p>
                    <p className="text-3xl font-bold text-white">{oshaMetrics.totalRecordableIncidents}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Injuries</p>
                      <p className="text-xl font-bold text-white">{oshaMetrics.yearToDate.injuries}</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Illnesses</p>
                      <p className="text-xl font-bold text-white">{oshaMetrics.yearToDate.illnesses}</p>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Fatalities</p>
                      <p className="text-xl font-bold text-white">{oshaMetrics.yearToDate.fatalities}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-400 mb-2">Days Away/Restricted/Transfer</p>
                    <p className="text-2xl font-bold text-white">{oshaMetrics.daysAwayRestrictedTransfer}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">OSHA Form Requirements</CardTitle>
                <CardDescription>Required forms for recordable incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                    <FileText className="w-8 h-8 text-blue-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 300</h3>
                    <p className="text-sm text-slate-400 mb-3">Log of Work-Related Injuries and Illnesses</p>
                    <Button variant="outline" className="w-full" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Form
                    </Button>
                  </div>
                  <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                    <FileText className="w-8 h-8 text-purple-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 300A</h3>
                    <p className="text-sm text-slate-400 mb-3">Summary of Work-Related Injuries and Illnesses</p>
                    <Button variant="outline" className="w-full" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Summary
                    </Button>
                  </div>
                  <div className="p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                    <FileText className="w-8 h-8 text-green-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 301</h3>
                    <p className="text-sm text-slate-400 mb-3">Injury and Illness Incident Report</p>
                    <Button variant="outline" className="w-full" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Incident Trend Analysis</CardTitle>
                  <CardDescription>Monthly incident comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[45, 32, 28, 56, 41, 23, 35, 29, 18, 24, 15, 12].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-blue-500/80 rounded-t" style={{ height: `${h * 2}px` }} />
                        <span className="text-[9px] text-slate-500">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Incident by Category</CardTitle>
                  <CardDescription>Distribution breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { type: 'Near Miss', count: 45, pct: 40, color: 'bg-orange-500' },
                    { type: 'Hazard', count: 32, pct: 28, color: 'bg-yellow-500' },
                    { type: 'Injury', count: 18, pct: 16, color: 'bg-red-500' },
                    { type: 'Equipment', count: 12, pct: 11, color: 'bg-purple-500' },
                    { type: 'Environmental', count: 6, pct: 5, color: 'bg-green-500' },
                  ].map(item => (
                    <div key={item.type} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">{item.type}</span>
                        <span className="text-white font-medium">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Safety Performance Metrics</CardTitle>
                <CardDescription>Key safety indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Days Since Last Injury', value: '47', trend: '+12', good: true },
                    { label: 'Safety Training Completion', value: '94%', trend: '+8%', good: true },
                    { label: 'Hazard Reports Resolved', value: '89%', trend: '+5%', good: true },
                    { label: 'Average Resolution Time', value: '4.2h', trend: '-1.3h', good: true },
                  ].map(metric => (
                    <div key={metric.label} className="p-4 bg-slate-900/50 rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                      <p className={`text-xs ${metric.good ? 'text-green-400' : 'text-red-400'}`}>{metric.trend}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Alert Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getTypeIcon(selectedAlert.type)}
              {selectedAlert?.alertNumber} - {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              Reported {selectedAlert && new Date(selectedAlert.reportedAt).toLocaleString()} by {selectedAlert?.reportedBy}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Severity</p>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Location</p>
                  <p className="mt-1 text-sm">{selectedAlert.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">OSHA Recordable</p>
                  <p className="mt-1 text-sm">{selectedAlert.oshaRecordable ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Description</p>
                <p className="mt-1 text-sm">{selectedAlert.description}</p>
              </div>

              {selectedAlert.witnesses && selectedAlert.witnesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Witnesses</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.witnesses.map((witness, i) => (
                      <li key={i}>{witness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.correctiveActions && selectedAlert.correctiveActions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Corrective Actions</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.correctiveActions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.preventiveMeasures && selectedAlert.preventiveMeasures.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Preventive Measures</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.preventiveMeasures.map((measure, i) => (
                      <li key={i}>{measure}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Assigned To</p>
                  <p className="mt-1 text-sm">{selectedAlert.assignedTo}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedAlert?.oshaRecordable && (
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Generate OSHA Form
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
