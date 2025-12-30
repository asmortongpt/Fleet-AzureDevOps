import {
  Plus,
  Trash,
  Play,
  Download,
  FloppyDisk,
  Calendar,
  FolderOpen,
  MagicWand,
  ChartBar,
  X,
  Clock
} from "@phosphor-icons/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import apiClient from "@/lib/api-client"
import logger from '@/utils/logger'

interface DataSource {
  id: string
  name: string
  table: string
  columns: ColumnDefinition[]
}

interface ColumnDefinition {
  field: string
  label: string
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'boolean'
  aggregatable: boolean
  filterable: boolean
}

interface ReportColumn {
  field: string
  label: string
  table: string
  type: string
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max'
}

interface FilterCondition {
  field: string
  operator: string
  value: any
  value2?: any
}

interface CustomReport {
  id?: string
  report_name: string
  description?: string
  data_sources: string[]
  columns: ReportColumn[]
  filters: FilterCondition[]
  grouping: Array<{ field: string }>
  sorting: Array<{ field: string; direction: 'asc' | 'desc' }>
  is_public: boolean
}

interface ReportTemplate {
  id: string
  template_name: string
  description: string
  category: string
  config: any
}

interface ReportExecution {
  id: string
  execution_time: string
  row_count: number
  status: string
  format: string
}

export function CustomReportBuilder() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("builder")
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null)

  // Report builder state
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([])
  const [selectedColumns, setSelectedColumns] = useState<ReportColumn[]>([])
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [grouping, setGrouping] = useState<Array<{ field: string }>>([])
  const [sorting, setSorting] = useState<Array<{ field: string; direction: 'asc' | 'desc' }>>([])
  const [isPublic, setIsPublic] = useState(false)

  // Preview state
  const [_previewData, _setPreviewData] = useState<any[]>([])
  const [_executionHistory, _setExecutionHistory] = useState<ReportExecution[]>([])

  // Schedule state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleType, setScheduleType] = useState("daily")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [recipients, setRecipients] = useState("")
  const [scheduleFormat, setScheduleFormat] = useState("csv")

  // TanStack Query hooks - consolidate all initial data fetching
  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery<DataSource[]>({
    queryKey: ["customReports", "dataSources"],
    queryFn: async () => (await apiClient.get("/custom-reports/data-sources")).data,
    gcTime: 5 * 60 * 1000
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery<ReportTemplate[]>({
    queryKey: ["customReports", "templates"],
    queryFn: async () => (await apiClient.get("/custom-reports/templates")).data,
    gcTime: 5 * 60 * 1000
  })

  const { data: myReports = [], isLoading: myReportsLoading } = useQuery<CustomReport[]>({
    queryKey: ["customReports", "myReports"],
    queryFn: async () => (await apiClient.get("/custom-reports")).data,
    gcTime: 5 * 60 * 1000
  })

  const loading = dataSourcesLoading || templatesLoading || myReportsLoading

  // Memoize derived state to prevent unnecessary recalculations
  const availableColumns = useMemo(() => {
    return selectedDataSources.flatMap(sourceId => {
      const source = dataSources.find((ds: DataSource) => ds.id === sourceId)
      return source ? source.columns.map((col: ColumnDefinition) => ({ ...col, sourceId, sourceName: source.name })) : []
    })
  }, [selectedDataSources, dataSources])

  // TanStack Query mutations for API operations
  const saveReportMutation = useMutation({
    mutationFn: async (reportData: CustomReport) => {
      if (selectedReport?.id) {
        return (await apiClient.put(`/custom-reports/${selectedReport.id}`, reportData)).data
      } else {
        return (await apiClient.post('/custom-reports', reportData)).data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports", "myReports"] })
      toast.success(selectedReport?.id ? "Report updated successfully" : "Report created successfully")
      setActiveTab("my-reports")
    },
    onError: (error) => {
      logger.error("Error saving report:", error)
      toast.error("Failed to save report")
    }
  })

  const executeReportMutation = useMutation({
    mutationFn: async ({ reportId, format }: { reportId: string; format: string }) => {
      return (await apiClient.post(`/custom-reports/${reportId}/execute`, { format })).data
    },
    onSuccess: (result: { rowCount: number; executionId: string }, variables: { reportId: string }) => {
      toast.success(`Report executed! ${result.rowCount} rows generated.`)
      window.open(`/api/custom-reports/${variables.reportId}/download/${result.executionId}`, '_blank')
    },
    onError: (error) => {
      logger.error("Error executing report:", error)
      toast.error("Failed to execute report")
    }
  })

  const scheduleReportMutation = useMutation({
    mutationFn: async () => {
      if (!selectedReport?.id) throw new Error("No report selected")

      const scheduleConfig = {
        hour: parseInt(scheduleTime.split(':')[0]),
        minute: parseInt(scheduleTime.split(':')[1])
      }

      const recipientList = recipients.split(',').map(r => r.trim()).filter(r => r)

      if (recipientList.length === 0) {
        throw new Error("Please enter at least one recipient email")
      }

      return (await apiClient.post(`/custom-reports/${selectedReport.id}`, {
        schedule_type: scheduleType,
        schedule_config: scheduleConfig,
        recipients: recipientList,
        format: scheduleFormat
      })).data
    },
    onSuccess: () => {
      toast.success("Report scheduled successfully")
      setShowScheduleDialog(false)
    },
    onError: (error: Error | unknown) => {
      const message = error instanceof Error ? error.message : "Failed to schedule report"
      logger.error("Error scheduling report:", error)
      toast.error(message)
    }
  })

  const loadTemplateMutation = useMutation({
    mutationFn: async ({ templateId, templateName }: { templateId: string; templateName: string }) => {
      const reportName = `${templateName} - ${new Date().toLocaleDateString()}`
      return (await apiClient.post(`/custom-reports/from-template/${templateId}`, { report_name: reportName })).data as CustomReport
    },
    onSuccess: (report: CustomReport) => {
      toast.success("Template loaded successfully")
      setSelectedReport(report)
      loadReportToBuilder(report)
      setActiveTab("builder")
    },
    onError: (error) => {
      logger.error("Error loading template:", error)
      toast.error("Failed to load template")
    }
  })

  const handleDataSourceToggle = (sourceId: string) => {
    if (selectedDataSources.includes(sourceId)) {
      setSelectedDataSources(selectedDataSources.filter(id => id !== sourceId))
      // Remove columns from deselected source
      setSelectedColumns(selectedColumns.filter(col => col.table !== sourceId))
    } else {
      setSelectedDataSources([...selectedDataSources, sourceId])
    }
  }

  const handleAddColumn = (column: ColumnDefinition, sourceId: string) => {
    const newColumn: ReportColumn = {
      field: column.field,
      label: column.label,
      table: sourceId,
      type: column.type
    }

    if (!selectedColumns.some(col => col.field === column.field && col.table === sourceId)) {
      setSelectedColumns([...selectedColumns, newColumn])
    }
  }

  const handleRemoveColumn = (index: number) => {
    setSelectedColumns(selectedColumns.filter((_, i) => i !== index))
  }

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { field: '', operator: 'equals', value: '' }
    ])
  }

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleUpdateFilter = (index: number, updates: Partial<FilterCondition>) => {
    const newFilters = [...filters]
    newFilters[index] = { ...newFilters[index], ...updates }
    setFilters(newFilters)
  }

  const _handleAddSorting = () => {
    setSorting([
      ...sorting,
      { field: '', direction: 'asc' }
    ])
  }

  const _handleRemoveSorting = (index: number) => {
    setSorting(sorting.filter((_, i) => i !== index))
  }

  const handleSaveReport = () => {
    if (!reportName) {
      toast.error("Please enter a report name")
      return
    }

    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column")
      return
    }

    const reportData: CustomReport = {
      report_name: reportName,
      description: reportDescription,
      data_sources: selectedDataSources,
      columns: selectedColumns,
      filters,
      grouping,
      sorting,
      is_public: isPublic
    }

    saveReportMutation.mutate(reportData)
  }

  const handleExecuteReport = (reportId: string, format: string = 'csv') => {
    toast.info("Executing report...")
    executeReportMutation.mutate({ reportId, format })
  }

  const handleScheduleReport = () => {
    scheduleReportMutation.mutate()
  }

  const handleLoadTemplate = (templateId: string, templateName: string) => {
    loadTemplateMutation.mutate({ templateId, templateName })
  }

  const handleLoadReport = (report: CustomReport) => {
    setSelectedReport(report)
    loadReportToBuilder(report)
    setActiveTab("builder")
  }

  const loadReportToBuilder = (report: CustomReport) => {
    setReportName(report.report_name)
    setReportDescription(report.description || "")
    setSelectedDataSources(report.data_sources)
    setSelectedColumns(report.columns)
    setFilters(report.filters)
    setGrouping(report.grouping)
    setSorting(report.sorting)
    setIsPublic(report.is_public)
  }

  const handleNewReport = () => {
    setSelectedReport(null)
    setReportName("")
    setReportDescription("")
    setSelectedDataSources([])
    setSelectedColumns([])
    setFilters([])
    setGrouping([])
    setSorting([])
    setIsPublic(false)
    setActiveTab("builder")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Custom Report Builder</h1>
          <p className="text-gray-600">Create and schedule custom reports with drag-and-drop interface</p>
        </div>
        <Button onClick={handleNewReport}>
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="builder">
            <ChartBar className="w-4 h-4 mr-2" />
            Report Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <MagicWand className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="my-reports">
            <FolderOpen className="w-4 h-4 mr-2" />
            My Reports ({myReports.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            Execution History
          </TabsTrigger>
        </TabsList>

        {/* Report Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Define your custom report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Report Name *</Label>
                  <Input
                    placeholder="e.g., Monthly Fleet Utilization"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Optional description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
              </div>

              {/* Data Sources */}
              <div className="space-y-2">
                <Label>Select Data Sources *</Label>
                <div className="flex flex-wrap gap-2">
                  {dataSources.map((source: DataSource) => (
                    <Badge
                      key={source.id}
                      variant={selectedDataSources.includes(source.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleDataSourceToggle(source.id)}
                    >
                      {source.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Columns */}
              <div className="space-y-2">
                <Label>Selected Columns ({selectedColumns.length})</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Start with pre-configured report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template: ReportTemplate) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{template.template_name}</CardTitle>
                      <CardDescription>{template.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleLoadTemplate(template.id, template.template_name)}
                      >
                        <MagicWand className="w-4 h-4 mr-2" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Reports Tab */}
        <TabsContent value="my-reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Custom Reports</CardTitle>
              <CardDescription>Manage your saved reports</CardDescription>
            </CardHeader>
            <CardContent>
              {myReports.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">You haven't created any custom reports yet.</p>
                  <Button variant="link" className="mt-2" onClick={() => setActiveTab("builder")}>
                    Create Your First Report
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myReports.map((report: CustomReport) => (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium">{report.report_name}</h3>
                        <p className="text-sm text-gray-500">{report.description}</p>
                        <div className="flex gap-2 mt-2">
                          {report.data_sources.map((dsId) => {
                            const ds = dataSources.find((d: DataSource) => d.id === dsId)
                            return ds ? (
                              <Badge key={dsId} variant="outline">{ds.name}</Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => report.id && handleExecuteReport(report.id)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Run
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadReport(report)}
                        >
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>View past report executions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">Execution history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>Set up automated report delivery</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Recipients (comma-separated emails)</Label>
              <Textarea
                placeholder="Enter email addresses"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={scheduleFormat} onValueChange={setScheduleFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReport}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}