/**
 * Reports Hub Component
 * Phase 2-3: Map-First UX Transformation
 *
 * Features:
 * - Report templates and generation
 * - Scheduled report management
 * - Report history and downloads
 * - Custom report builder access
 */

import {
  FileText,
  BarChart,
  Calendar,
  Clock,
  Download,
  Play,
  Plus,
  Search,
  FolderOpen,
  Zap
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useAuth } from "@/contexts"
import { secureFetch } from "@/hooks/use-api"
import { useFleetData } from "@/hooks/use-fleet-data"

// Report types and status
type ReportCategory = "fleet" | "maintenance" | "safety" | "compliance" | "financial" | "operations"
type ReportStatus = "ready" | "generating" | "scheduled" | "failed"
type ReportFormat = "pdf" | "xlsx" | "csv"

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: ReportCategory
  lastGenerated?: string
  frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "on-demand"
  format: ReportFormat[]
  estimatedTime: string
}

interface GeneratedReport {
  id: string
  templateId: string
  name: string
  generatedAt: string
  generatedBy: string
  format: ReportFormat
  size: string
  status: ReportStatus
  downloadUrl?: string
}

interface ScheduledReport {
  id: string
  templateId: string
  name: string
  frequency: string
  nextRun: string
  lastRun?: string
  recipients: string[]
  format: ReportFormat
  enabled: boolean
}

const getCategoryColor = (category: ReportCategory): string => {
  switch (category) {
    case "fleet": return "bg-blue-500/10 text-blue-800"
    case "maintenance": return "bg-orange-500/10 text-orange-500"
    case "safety": return "bg-red-500/10 text-red-500"
    case "compliance": return "bg-purple-500/10 text-purple-500"
    case "financial": return "bg-green-500/10 text-green-500"
    case "operations": return "bg-cyan-500/10 text-cyan-500"
    default: return "bg-gray-500/10 text-gray-700"
  }
}

const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case "ready": return "bg-green-500/10 text-green-500"
    case "generating": return "bg-blue-500/10 text-blue-800"
    case "scheduled": return "bg-yellow-500/10 text-yellow-500"
    case "failed": return "bg-red-500/10 text-red-500"
    default: return "bg-gray-500/10 text-gray-700"
  }
}

export function ReportsHub() {
  const { user } = useAuth()
  const { vehicles, drivers, workOrders } = useFleetData()
  const [activeTab, setActiveTab] = useState("templates")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([])
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    templateId: "",
    schedule: "weekly",
    recipients: "",
    format: "pdf" as ReportFormat
  })

  const fetchJson = async (path: string, options?: RequestInit) => {
    const response = await secureFetch(path, options)
    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Request failed: ${response.status}`)
    }
    return response.json()
  }

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const [templatesResponse, historyResponse, scheduledResponse] = await Promise.all([
        fetchJson("/api/reports/templates"),
        fetchJson("/api/reports/history"),
        fetchJson("/api/reports/scheduled")
      ])

      const mappedTemplates: ReportTemplate[] = (templatesResponse.data || []).map((template: any) => ({
        id: template.id,
        name: template.title,
        description: template.description,
        category: (template.category || template.domain || "operations") as ReportCategory,
        lastGenerated: template.lastUsed,
        format: [],
        estimatedTime: ""
      }))

      const mappedHistory: GeneratedReport[] = (historyResponse.data || []).map((report: any) => ({
        id: report.id,
        templateId: report.templateId,
        name: report.title,
        generatedAt: report.generatedAt,
        generatedBy: report.generatedBy,
        format: report.format,
        size: report.size ? `${Math.round(report.size / 1024)} KB` : "0 KB",
        status: report.status === "completed" ? "ready" : report.status,
        downloadUrl: report.downloadUrl
      }))

      const mappedScheduled: ScheduledReport[] = (scheduledResponse.data || []).map((schedule: any) => ({
        id: schedule.id,
        templateId: schedule.templateId,
        name: schedule.name || schedule.templateId,
        frequency: schedule.schedule,
        nextRun: schedule.nextRun,
        lastRun: schedule.lastRun,
        recipients: schedule.recipients || [],
        format: schedule.format,
        enabled: schedule.status === "active"
      }))

      setTemplates(mappedTemplates)
      setGeneratedReports(mappedHistory)
      setScheduledReports(mappedScheduled)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleGenerateReport = async (template: ReportTemplate) => {
    try {
      await fetchJson("/api/reports/execute", {
        method: "POST",
        body: JSON.stringify({
          reportId: template.id,
          filters: {},
          userId: user?.id
        })
      })
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report")
    }
  }

  const openScheduleDialog = (template: ReportTemplate) => {
    setScheduleForm({
      templateId: template.id,
      schedule: "weekly",
      recipients: "",
      format: "pdf"
    })
    setScheduleDialogOpen(true)
  }

  const handleScheduleReport = async () => {
    try {
      const recipients = scheduleForm.recipients
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)

      await fetchJson("/api/reports/scheduled", {
        method: "POST",
        body: JSON.stringify({
          templateId: scheduleForm.templateId,
          schedule: scheduleForm.schedule,
          recipients,
          format: scheduleForm.format
        })
      })
      setScheduleDialogOpen(false)
      await loadReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule report")
    }
  }

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      if (categoryFilter !== "all" && template.category !== categoryFilter) return false
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [categoryFilter, searchQuery, templates])

  const stats = useMemo(() => ({
    totalTemplates: templates.length,
    generatedThisMonth: generatedReports.length,
    scheduledActive: scheduledReports.filter(r => r.enabled).length,
    scheduledTotal: scheduledReports.length
  }), [generatedReports.length, scheduledReports, templates.length])

  const fleetSummary = useMemo(() => {
    const totalVehicles = vehicles.length
    const activeDrivers = drivers.filter((d: any) => d.status === 'active').length
    const openWorkOrders = workOrders.filter((wo: any) => {
      const status = (wo.status || '').toLowerCase()
      return status === 'pending' || status === 'in-progress' || status === 'open' || status === 'waiting_parts'
    }).length
    // Approximate fleet health from active vehicles ratio
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active' || v.status === 'idle').length
    const avgFleetHealth = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0
    return { totalVehicles, activeDrivers, openWorkOrders, avgFleetHealth }
  }, [vehicles, drivers, workOrders])

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Reports Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate, schedule, and manage fleet reports
            </p>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FolderOpen className="w-4 h-4 mr-2" />
              Report Library
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Custom Report
            </Button>
          </div>
        </div>
      </div>

      {/* Fleet Summary Quick-Stats Bar */}
      <div className="px-3 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-6">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fleet Summary</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">{fleetSummary.totalVehicles}</span>
            <span className="text-xs text-muted-foreground">Vehicles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">{fleetSummary.activeDrivers}</span>
            <span className="text-xs text-muted-foreground">Active Drivers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm font-medium">{fleetSummary.openWorkOrders}</span>
            <span className="text-xs text-muted-foreground">Open Work Orders</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${fleetSummary.avgFleetHealth >= 80 ? 'bg-green-500' : fleetSummary.avgFleetHealth >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">{fleetSummary.avgFleetHealth}%</span>
            <span className="text-xs text-muted-foreground">Fleet Health</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-3 py-2 border-b bg-card">
        <div className="grid grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Report Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold">{stats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground mt-1">Available templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Generated This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-green-500">{stats.generatedThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Reports generated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Schedules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-blue-800">{stats.scheduledActive}</div>
              <p className="text-xs text-muted-foreground mt-1">
                of {stats.scheduledTotal} scheduled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Zap className="w-3 h-3 mr-1" />
                  Quick Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="templates">
                <BarChart className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="generated">
                <FileText className="w-4 h-4 mr-2" />
                Generated Reports
              </TabsTrigger>
              <TabsTrigger value="scheduled">
                <Calendar className="w-4 h-4 mr-2" />
                Scheduled
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="templates" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-sm transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {template.category}
                        </Badge>
                        {template.frequency && (
                          <Badge variant="outline">
                            {template.frequency}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{template.estimatedTime || "—"}</span>
                        </div>
                        <div className="flex gap-1">
                          {template.format.length > 0 ? (
                            template.format.map(f => (
                              <Badge key={f} variant="secondary" className="text-xs">
                                {f.toUpperCase()}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              N/A
                            </Badge>
                          )}
                        </div>
                      </div>

                      {template.lastGenerated && (
                        <p className="text-xs text-muted-foreground">
                          Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1" onClick={() => handleGenerateReport(template)}>
                          <Play className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openScheduleDialog(template)}>
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!loading && filteredTemplates.length === 0 && (
                <div className="text-sm text-muted-foreground">No report templates available.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="generated" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Download or view generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedReports.map(report => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          {new Date(report.generatedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{report.generatedBy}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.format.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{report.size}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => report.downloadUrl && window.open(report.downloadUrl, "_blank")}
                            disabled={!report.downloadUrl}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && generatedReports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No reports generated yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>Manage automated report generation</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Next Run</TableHead>
                      <TableHead>Last Run</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map(schedule => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">{schedule.name}</TableCell>
                        <TableCell>{schedule.frequency}</TableCell>
                        <TableCell>
                          {new Date(schedule.nextRun).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {schedule.lastRun
                            ? new Date(schedule.lastRun).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {schedule.recipients.length} recipient(s)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{schedule.format.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={schedule.enabled ? "default" : "secondary"}>
                            {schedule.enabled ? "Active" : "Paused"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && scheduledReports.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No scheduled reports configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="schedule">Schedule</Label>
              <Select
                value={scheduleForm.schedule}
                onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, schedule: value }))}
              >
                <SelectTrigger id="schedule">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="recipients">Recipients</Label>
              <Input
                id="recipients"
                placeholder="email1@agency.gov, email2@agency.gov"
                value={scheduleForm.recipients}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, recipients: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="format">Format</Label>
              <Select
                value={scheduleForm.format}
                onValueChange={(value) => setScheduleForm((prev) => ({ ...prev, format: value as ReportFormat }))}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReport}>Save Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
