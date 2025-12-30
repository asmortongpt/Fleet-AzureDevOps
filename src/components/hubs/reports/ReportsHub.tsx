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
  ChartBar,
  Calendar,
  Clock,
  Download,
  Play,
  Plus,
  MagnifyingGlass,
  FolderOpen,
  Lightning
} from "@phosphor-icons/react"
import { useState, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

// Demo data for report templates
const demoTemplates: ReportTemplate[] = [
  {
    id: "tpl-001",
    name: "Fleet Utilization Report",
    description: "Comprehensive analysis of fleet utilization rates, idle time, and efficiency metrics",
    category: "fleet",
    lastGenerated: "2025-12-29",
    frequency: "weekly",
    format: ["pdf", "xlsx"],
    estimatedTime: "2-3 min"
  },
  {
    id: "tpl-002",
    name: "Maintenance Cost Analysis",
    description: "Detailed breakdown of maintenance costs by vehicle, category, and vendor",
    category: "maintenance",
    lastGenerated: "2025-12-28",
    frequency: "monthly",
    format: ["pdf", "xlsx", "csv"],
    estimatedTime: "3-5 min"
  },
  {
    id: "tpl-003",
    name: "Safety Incident Summary",
    description: "Monthly safety incident report with OSHA compliance metrics",
    category: "safety",
    lastGenerated: "2025-12-01",
    frequency: "monthly",
    format: ["pdf"],
    estimatedTime: "1-2 min"
  },
  {
    id: "tpl-004",
    name: "Compliance Status Report",
    description: "Vehicle registration, inspection, and certification compliance status",
    category: "compliance",
    lastGenerated: "2025-12-15",
    frequency: "weekly",
    format: ["pdf", "xlsx"],
    estimatedTime: "2-3 min"
  },
  {
    id: "tpl-005",
    name: "Fuel Consumption Analysis",
    description: "Fuel usage trends, efficiency metrics, and cost analysis by vehicle and route",
    category: "operations",
    lastGenerated: "2025-12-29",
    frequency: "daily",
    format: ["xlsx", "csv"],
    estimatedTime: "1-2 min"
  },
  {
    id: "tpl-006",
    name: "Driver Performance Scorecard",
    description: "Individual and team driver performance metrics and safety scores",
    category: "operations",
    lastGenerated: "2025-12-27",
    frequency: "weekly",
    format: ["pdf", "xlsx"],
    estimatedTime: "2-3 min"
  },
  {
    id: "tpl-007",
    name: "Financial Summary",
    description: "Fleet operational costs, revenue metrics, and budget variance analysis",
    category: "financial",
    lastGenerated: "2025-12-01",
    frequency: "monthly",
    format: ["pdf", "xlsx"],
    estimatedTime: "4-6 min"
  },
  {
    id: "tpl-008",
    name: "Vehicle Lifecycle Report",
    description: "Asset depreciation, replacement planning, and TCO analysis",
    category: "fleet",
    lastGenerated: "2025-11-30",
    frequency: "quarterly",
    format: ["pdf", "xlsx"],
    estimatedTime: "5-8 min"
  }
]

// Demo generated reports
const demoGeneratedReports: GeneratedReport[] = [
  {
    id: "rpt-001",
    templateId: "tpl-001",
    name: "Fleet Utilization Report - Dec 2025",
    generatedAt: "2025-12-29T14:30:00Z",
    generatedBy: "System (Scheduled)",
    format: "pdf",
    size: "2.4 MB",
    status: "ready",
    downloadUrl: "#"
  },
  {
    id: "rpt-002",
    templateId: "tpl-005",
    name: "Fuel Consumption Analysis - Dec 29",
    generatedAt: "2025-12-29T06:00:00Z",
    generatedBy: "System (Scheduled)",
    format: "xlsx",
    size: "1.8 MB",
    status: "ready",
    downloadUrl: "#"
  },
  {
    id: "rpt-003",
    templateId: "tpl-002",
    name: "Maintenance Cost Analysis - Nov 2025",
    generatedAt: "2025-12-01T09:15:00Z",
    generatedBy: "John Smith",
    format: "pdf",
    size: "3.2 MB",
    status: "ready",
    downloadUrl: "#"
  },
  {
    id: "rpt-004",
    templateId: "tpl-006",
    name: "Driver Performance Scorecard - Week 52",
    generatedAt: "2025-12-27T08:00:00Z",
    generatedBy: "System (Scheduled)",
    format: "xlsx",
    size: "1.1 MB",
    status: "ready",
    downloadUrl: "#"
  }
]

// Demo scheduled reports
const demoScheduledReports: ScheduledReport[] = [
  {
    id: "sch-001",
    templateId: "tpl-001",
    name: "Fleet Utilization Report",
    frequency: "Weekly (Monday)",
    nextRun: "2026-01-06T08:00:00Z",
    lastRun: "2025-12-29T08:00:00Z",
    recipients: ["fleet-managers@company.com", "operations@company.com"],
    format: "pdf",
    enabled: true
  },
  {
    id: "sch-002",
    templateId: "tpl-005",
    name: "Fuel Consumption Analysis",
    frequency: "Daily (6:00 AM)",
    nextRun: "2025-12-30T06:00:00Z",
    lastRun: "2025-12-29T06:00:00Z",
    recipients: ["operations@company.com"],
    format: "xlsx",
    enabled: true
  },
  {
    id: "sch-003",
    templateId: "tpl-003",
    name: "Safety Incident Summary",
    frequency: "Monthly (1st)",
    nextRun: "2026-01-01T09:00:00Z",
    lastRun: "2025-12-01T09:00:00Z",
    recipients: ["safety@company.com", "hr@company.com", "management@company.com"],
    format: "pdf",
    enabled: true
  },
  {
    id: "sch-004",
    templateId: "tpl-007",
    name: "Financial Summary",
    frequency: "Monthly (5th)",
    nextRun: "2026-01-05T07:00:00Z",
    lastRun: "2025-12-05T07:00:00Z",
    recipients: ["finance@company.com", "cfo@company.com"],
    format: "xlsx",
    enabled: false
  }
]

const getCategoryColor = (category: ReportCategory): string => {
  switch (category) {
    case "fleet": return "bg-blue-500/10 text-blue-500"
    case "maintenance": return "bg-orange-500/10 text-orange-500"
    case "safety": return "bg-red-500/10 text-red-500"
    case "compliance": return "bg-purple-500/10 text-purple-500"
    case "financial": return "bg-green-500/10 text-green-500"
    case "operations": return "bg-cyan-500/10 text-cyan-500"
    default: return "bg-gray-500/10 text-gray-500"
  }
}

const getStatusColor = (status: ReportStatus): string => {
  switch (status) {
    case "ready": return "bg-green-500/10 text-green-500"
    case "generating": return "bg-blue-500/10 text-blue-500"
    case "scheduled": return "bg-yellow-500/10 text-yellow-500"
    case "failed": return "bg-red-500/10 text-red-500"
    default: return "bg-gray-500/10 text-gray-500"
  }
}

export function ReportsHub() {
  const [activeTab, setActiveTab] = useState("templates")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = useMemo(() => {
    return demoTemplates.filter(template => {
      if (categoryFilter !== "all" && template.category !== categoryFilter) return false
      if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [categoryFilter, searchQuery])

  const stats = useMemo(() => ({
    totalTemplates: demoTemplates.length,
    generatedThisMonth: demoGeneratedReports.length,
    scheduledActive: demoScheduledReports.filter(r => r.enabled).length,
    scheduledTotal: demoScheduledReports.length
  }), [])

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Reports Hub
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate, schedule, and manage fleet reports
            </p>
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

      {/* Stats Cards */}
      <div className="px-6 py-4 border-b bg-card">
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Report Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTemplates}</div>
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
              <div className="text-3xl font-bold text-green-500">{stats.generatedThisMonth}</div>
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
              <div className="text-3xl font-bold text-blue-500">{stats.scheduledActive}</div>
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
                  <Lightning className="w-3 h-3 mr-1" />
                  Quick Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="templates">
                <ChartBar className="w-4 h-4 mr-2" />
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
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
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
                        <Badge variant="outline">
                          {template.frequency}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{template.estimatedTime}</span>
                        </div>
                        <div className="flex gap-1">
                          {template.format.map(f => (
                            <Badge key={f} variant="secondary" className="text-xs">
                              {f.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {template.lastGenerated && (
                        <p className="text-xs text-muted-foreground">
                          Last generated: {new Date(template.lastGenerated).toLocaleDateString()}
                        </p>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          <Play className="w-3 h-3 mr-1" />
                          Generate
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="w-3 h-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    {demoGeneratedReports.map(report => (
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
                          <Button size="sm" variant="outline">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    {demoScheduledReports.map(schedule => (
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
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
