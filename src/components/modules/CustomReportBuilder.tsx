import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  ListBullets,
  Funnel,
  SortAscending,
  X,
  FileArrowDown,
  Clock,
  CheckCircle,
  Warning
} from "@phosphor-icons/react"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

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
  const [previewData, setPreviewData] = useState<any[]>([])
  const [executionHistory, setExecutionHistory] = useState<ReportExecution[]>([])

  // Schedule state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)
  const [scheduleType, setScheduleType] = useState("daily")
  const [scheduleTime, setScheduleTime] = useState("09:00")
  const [recipients, setRecipients] = useState("")
  const [scheduleFormat, setScheduleFormat] = useState("csv")

  // TanStack Query hooks - consolidate all initial data fetching
  const { data: dataSources = [], isLoading: dataSourcesLoading } = useQuery({
    queryKey: ["customReports", "dataSources"],
    queryFn: async () => apiClient.get("/custom-reports/data-sources")
  })

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["customReports", "templates"],
    queryFn: async () => apiClient.get("/custom-reports/templates")
  })

  const { data: myReports = [], isLoading: myReportsLoading } = useQuery({
    queryKey: ["customReports", "myReports"],
    queryFn: async () => apiClient.get("/custom-reports")
  })

  const loading = dataSourcesLoading || templatesLoading || myReportsLoading

  // Memoize derived state to prevent unnecessary recalculations
  const availableColumns = useMemo(() => {
    return selectedDataSources.flatMap(sourceId => {
      const source = dataSources.find(ds => ds.id === sourceId)
      return source ? source.columns.map(col => ({ ...col, sourceId, sourceName: source.name })) : []
    })
  }, [selectedDataSources, dataSources])

  // TanStack Query mutations for API operations
  const saveReportMutation = useMutation({
    mutationFn: async (reportData: CustomReport) => {
      if (selectedReport?.id) {
        return apiClient.put(`/custom-reports/${selectedReport.id}`, reportData)
      } else {
        return apiClient.post('/custom-reports', reportData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customReports", "myReports"] })
      toast.success(selectedReport?.id ? "Report updated successfully" : "Report created successfully")
      setActiveTab("my-reports")
    },
    onError: (error) => {
      console.error("Error saving report:", error)
      toast.error("Failed to save report")
    }
  })

  const executeReportMutation = useMutation({
    mutationFn: async ({ reportId, format }: { reportId: string; format: string }) => {
      return apiClient.post(`/custom-reports/${reportId}/execute`, { format })
    },
    onSuccess: (result, variables) => {
      toast.success(`Report executed! ${result.rowCount} rows generated.`)
      window.open(`/api/custom-reports/${variables.reportId}/download/${result.executionId}`, '_blank')
    },
    onError: (error) => {
      console.error("Error executing report:", error)
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

      return apiClient.post(`/custom-reports/${selectedReport.id}/schedule`, {
        schedule_type: scheduleType,
        schedule_config: scheduleConfig,
        recipients: recipientList,
        format: scheduleFormat
      })
    },
    onSuccess: () => {
      toast.success("Report scheduled successfully")
      setShowScheduleDialog(false)
    },
    onError: (error: any) => {
      const message = error.message || "Failed to schedule report"
      console.error("Error scheduling report:", error)
      toast.error(message)
    }
  })

  const loadTemplateMutation = useMutation({
    mutationFn: async ({ templateId, templateName }: { templateId: string; templateName: string }) => {
      const reportName = `${templateName} - ${new Date().toLocaleDateString()}`
      return apiClient.post(`/custom-reports/from-template/${templateId}`, { report_name: reportName })
    },
    onSuccess: (report) => {
      toast.success("Template loaded successfully")
      setSelectedReport(report)
      loadReportToBuilder(report)
      setActiveTab("builder")
    },
    onError: (error) => {
      console.error("Error loading template:", error)
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

  const handleAddSorting = () => {
    setSorting([
      ...sorting,
      { field: '', direction: 'asc' }
    ])
  }

  const handleRemoveSorting = (index: number) => {
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
                  {dataSources.map(source => (
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
                <div className="border rounded-lg p-4 min-h-[100px]">
                  {selectedColumns.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No columns selected. Click columns below to add them.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedColumns.map((col, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <span className="font-medium">{col.label}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({col.table})
                            </span>
                          </div>
                          {col.type === 'number' || col.type === 'currency' ? (
                            <Select
                              value={col.aggregate || 'none'}
                              onValueChange={(value) => {
                                const newColumns = [...selectedColumns]
                                newColumns[index].aggregate = value === 'none' ? undefined : value as any
                                setSelectedColumns(newColumns)
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Aggregate</SelectItem>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="avg">Average</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                                <SelectItem value="min">Min</SelectItem>
                                <SelectItem value="max">Max</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveColumn(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Available Columns */}
              {selectedDataSources.length > 0 && (
                <div className="space-y-2">
                  <Label>Available Columns (Click to Add)</Label>
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {selectedDataSources.map(sourceId => {
                      const source = dataSources.find(ds => ds.id === sourceId)
                      if (!source) return null

                      return (
                        <div key={sourceId} className="mb-4">
                          <h4 className="font-semibold text-sm mb-2">{source.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {source.columns.map(col => (
                              <Badge
                                key={col.field}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50"
                                onClick={() => handleAddColumn(col, sourceId)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {col.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Filters ({filters.length})</Label>
                  <Button variant="outline" size="sm" onClick={handleAddFilter}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Filter
                  </Button>
                </div>
                {filters.length > 0 && (
                  <div className="space-y-2">
                    {filters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                        <Select
                          value={filter.field}
                          onValueChange={(value) => handleUpdateFilter(index, { field: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map(col => (
                              <SelectItem key={`${col.sourceId}.${col.field}`} value={`${col.sourceId}.${col.field}`}>
                                {col.label} ({col.sourceName})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select
                          value={filter.operator}
                          onValueChange={(value) => handleUpdateFilter(index, { operator: value })}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="not_equals">Not Equals</SelectItem>
                            <SelectItem value="greater_than">Greater Than</SelectItem>
                            <SelectItem value="less_than">Less Than</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                          </SelectContent>
                        </Select>

                        <Input
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                          className="flex-1"
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFilter(index)}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public/Private */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label>Make this report public (visible to all users in tenant)</Label>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleSaveReport}>
                  <FloppyDisk className="w-4 h-4 mr-2" />
                  Save Report
                </Button>
                {selectedReport?.id && (
                  <>
                    <Button variant="outline" onClick={() => handleExecuteReport(selectedReport.id!, 'csv')}>
                      <Play className="w-4 h-4 mr-2" />
                      Run Report
                    </Button>
                    <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>{template.category}</Badge>
                    <Button
                      className="w-full"
                      onClick={() => handleLoadTemplate(template.id, template.template_name)}
                    >
                      <MagicWand className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* My Reports Tab */}
        <TabsContent value="my-reports">
          <Card>
            <CardHeader>
              <CardTitle>My Reports</CardTitle>
              <CardDescription>Your saved custom reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Data Sources</TableHead>
                    <TableHead>Columns</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myReports.map(report => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.report_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {report.data_sources.slice(0, 2).map(ds => (
                            <Badge key={ds} variant="outline">{ds}</Badge>
                          ))}
                          {report.data_sources.length > 2 && (
                            <Badge variant="outline">+{report.data_sources.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{report.columns.length}</TableCell>
                      <TableCell>
                        {report.id ? new Date().toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadReport(report)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => report.id && handleExecuteReport(report.id, 'csv')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {myReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No reports yet. Create your first report or use a template!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent report executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Select a report to view its execution history
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Schedule Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Configure automated report generation and delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select value={scheduleType} onValueChange={setScheduleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
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
              <Label>Format</Label>
              <Select value={scheduleFormat} onValueChange={setScheduleFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recipients (comma-separated emails)</Label>
              <Textarea
                placeholder="john@example.com, jane@example.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReport}>
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
