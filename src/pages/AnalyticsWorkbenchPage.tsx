/**
 * Analytics Workbench - Custom Report Builder & Data Export
 * Production-ready analytics workspace with drag-and-drop report builder
 */

import {
  ChartBar,
  Database,
  Download,
  Faders,
  FloppyDisk,
  Table,
  ChartLine,
  PieChart,
  ChartBarHorizontal,
  Plus,
  Trash,
  FileText,
  FilePdf,
  FileCsv,
  FunnelSimple,
  ArrowsClockwise,
  CaretDown,
  Check,
  X
} from "@phosphor-icons/react"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useFleetData } from "@/hooks/use-fleet-data"

// Types
interface ReportColumn {
  id: string
  field: string
  label: string
  type: "string" | "number" | "date" | "status"
  aggregate?: "sum" | "avg" | "count" | "min" | "max"
}

interface ReportFilter {
  id: string
  field: string
  operator: "equals" | "contains" | "greater" | "less" | "between"
  value: string | number
}

interface SavedReport {
  id: string
  name: string
  description: string
  columns: ReportColumn[]
  filters: ReportFilter[]
  chartType: ChartType
  createdAt: string
  lastRun: string
}

type ChartType = "table" | "bar" | "line" | "pie" | "horizontal-bar"

// Available data fields
const AVAILABLE_FIELDS = [
  { id: "vehicleId", label: "Vehicle ID", type: "string" as const },
  { id: "make", label: "Make", type: "string" as const },
  { id: "model", label: "Model", type: "string" as const },
  { id: "year", label: "Year", type: "number" as const },
  { id: "status", label: "Status", type: "status" as const },
  { id: "mileage", label: "Mileage", type: "number" as const },
  { id: "fuelLevel", label: "Fuel Level", type: "number" as const },
  { id: "lastService", label: "Last Service", type: "date" as const },
  { id: "assignedDriver", label: "Assigned Driver", type: "string" as const },
  { id: "department", label: "Department", type: "string" as const },
  { id: "location", label: "Location", type: "string" as const }
]

export function AnalyticsWorkbenchPage() {
  const { vehicles = [] } = useFleetData()

  // Report Builder State
  const [selectedColumns, setSelectedColumns] = useState<ReportColumn[]>([])
  const [filters, setFilters] = useState<ReportFilter[]>([])
  const [chartType, setChartType] = useState<ChartType>("table")
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  // UI State
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [activeTab, setActiveTab] = useState("builder")

  // Add Column to Report
  const addColumn = (fieldId: string) => {
    const field = AVAILABLE_FIELDS.find((f) => f.id === fieldId)
    if (!field || selectedColumns.some((c) => c.field === fieldId)) return

    const newColumn: ReportColumn = {
      id: `col-${Date.now()}`,
      field: field.id,
      label: field.label,
      type: field.type
    }
    setSelectedColumns([...selectedColumns, newColumn])
    toast.success(`Added ${field.label} to report`)
  }

  // Remove Column
  const removeColumn = (columnId: string) => {
    setSelectedColumns(selectedColumns.filter((c) => c.id !== columnId))
  }

  // Add Filter
  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: AVAILABLE_FIELDS[0].id,
      operator: "equals",
      value: ""
    }
    setFilters([...filters, newFilter])
  }

  // Update Filter
  const updateFilter = (
    filterId: string,
    key: keyof ReportFilter,
    value: string | number
  ) => {
    setFilters(
      filters.map((f) =>
        f.id === filterId ? { ...f, [key]: value } : f
      )
    )
  }

  // Remove Filter
  const removeFilter = (filterId: string) => {
    setFilters(filters.filter((f) => f.id !== filterId))
  }

  // Apply Filters to Data
  const filteredData = useMemo(() => {
    let data = vehicles

    filters.forEach((filter) => {
      if (!filter.value) return

      data = data.filter((vehicle: Record<string, unknown>) => {
        const fieldValue = vehicle[filter.field]
        const filterValue = filter.value

        switch (filter.operator) {
          case "equals":
            return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase()
          case "contains":
            return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase())
          case "greater":
            return Number(fieldValue) > Number(filterValue)
          case "less":
            return Number(fieldValue) < Number(filterValue)
          default:
            return true
        }
      })
    })

    return data
  }, [vehicles, filters])

  // Generate Report Data
  const reportData = useMemo(() => {
    return filteredData.map((vehicle: Record<string, unknown>) => {
      const row: Record<string, unknown> = {}
      selectedColumns.forEach((col) => {
        row[col.field] = vehicle[col.field]
      })
      return row
    })
  }, [filteredData, selectedColumns])

  // Export to CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = selectedColumns.map((col) => col.label).join(",")
    const rows = reportData.map((row) =>
      selectedColumns.map((col) => row[col.field] || "").join(",")
    )
    const csv = [headers, ...rows].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `analytics-report-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Report exported to CSV")
  }

  // Export to PDF
  const exportToPDF = () => {
    if (reportData.length === 0) {
      toast.error("No data to export")
      return
    }

    const doc = new jsPDF()

    // Title
    doc.setFontSize(18)
    doc.text("Fleet Analytics Report", 14, 22)

    // Metadata
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)
    doc.text(`Total Records: ${reportData.length}`, 14, 36)

    // Table
    const headers = selectedColumns.map((col) => col.label)
    const rows = reportData.map((row) =>
      selectedColumns.map((col) => String(row[col.field] || ""))
    )

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 42,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 51, 51] }
    })

    doc.save(`analytics-report-${new Date().toISOString().split("T")[0]}.pdf`)
    toast.success("Report exported to PDF")
  }

  // Save Report
  const saveReport = () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name")
      return
    }

    const newReport: SavedReport = {
      id: `report-${Date.now()}`,
      name: reportName,
      description: reportDescription,
      columns: selectedColumns,
      filters: filters,
      chartType: chartType,
      createdAt: new Date().toISOString(),
      lastRun: new Date().toISOString()
    }

    setSavedReports([...savedReports, newReport])
    setIsSaveDialogOpen(false)
    setReportName("")
    setReportDescription("")
    toast.success(`Report "${reportName}" saved successfully`)
  }

  // Load Report
  const loadReport = (report: SavedReport) => {
    setSelectedColumns(report.columns)
    setFilters(report.filters)
    setChartType(report.chartType)
    setActiveTab("builder")
    toast.success(`Loaded report: ${report.name}`)
  }

  // Delete Report
  const deleteReport = (reportId: string) => {
    setSavedReports(savedReports.filter((r) => r.id !== reportId))
    toast.success("Report deleted")
  }

  // Calculate aggregate statistics
  const stats = useMemo(() => {
    return {
      totalRecords: reportData.length,
      filteredRecords: reportData.length,
      columnsSelected: selectedColumns.length,
      filtersApplied: filters.filter((f) => f.value).length
    }
  }, [reportData, selectedColumns, filters])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Workbench</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build custom reports with drag-and-drop interface
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedColumns([])
                setFilters([])
                setChartType("table")
                toast.info("Report cleared")
              }}
            >
              <ArrowsClockwise className="w-4 h-4 mr-2" />
              Clear
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <CaretDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileCsv className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FilePdf className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsSaveDialogOpen(true)}>
              <FloppyDisk className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{stats.totalRecords}</p>
                </div>
                <Database className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Columns Selected</p>
                  <p className="text-2xl font-bold">{stats.columnsSelected}</p>
                </div>
                <Table className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Filters Active</p>
                  <p className="text-2xl font-bold">{stats.filtersApplied}</p>
                </div>
                <FunnelSimple className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Saved Reports</p>
                  <p className="text-2xl font-bold">{savedReports.length}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="builder">
              <Faders className="w-4 h-4 mr-2" />
              Report Builder
            </TabsTrigger>
            <TabsTrigger value="preview">
              <ChartBar className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="saved">
              <FloppyDisk className="w-4 h-4 mr-2" />
              Saved Reports
            </TabsTrigger>
          </TabsList>

          {/* Report Builder Tab */}
          <TabsContent value="builder" className="space-y-6 mt-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Column Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table className="w-5 h-5" />
                    Select Columns
                  </CardTitle>
                  <CardDescription>
                    Choose which fields to include in your report
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select onValueChange={addColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Add a column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_FIELDS.map((field) => (
                        <SelectItem
                          key={field.id}
                          value={field.id}
                          disabled={selectedColumns.some((c) => c.field === field.id)}
                        >
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Selected Columns</Label>
                    {selectedColumns.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                        No columns selected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedColumns.map((col) => (
                          <div
                            key={col.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <Database className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{col.label}</span>
                              <Badge variant="secondary">{col.type}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(col.id)}
                            >
                              <Trash className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FunnelSimple className="w-5 h-5" />
                    Data Filters
                  </CardTitle>
                  <CardDescription>
                    Filter data based on specific criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addFilter}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Filter
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Active Filters</Label>
                    {filters.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                        No filters applied
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filters.map((filter) => (
                          <div key={filter.id} className="p-3 bg-muted rounded-lg space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={filter.field}
                                onValueChange={(value) =>
                                  updateFilter(filter.id, "field", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {AVAILABLE_FIELDS.map((field) => (
                                    <SelectItem key={field.id} value={field.id}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={filter.operator}
                                onValueChange={(value) =>
                                  updateFilter(
                                    filter.id,
                                    "operator",
                                    value as ReportFilter["operator"]
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="greater">Greater Than</SelectItem>
                                  <SelectItem value="less">Less Than</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex gap-2">
                              <Input
                                placeholder="Filter value..."
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(filter.id, "value", e.target.value)
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFilter(filter.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine className="w-5 h-5" />
                  Visualization Type
                </CardTitle>
                <CardDescription>
                  Choose how to display your report data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { type: "table" as ChartType, icon: Table, label: "Table" },
                    { type: "bar" as ChartType, icon: ChartBar, label: "Bar Chart" },
                    { type: "line" as ChartType, icon: ChartLine, label: "Line Chart" },
                    { type: "pie" as ChartType, icon: PieChart, label: "Pie Chart" },
                    {
                      type: "horizontal-bar" as ChartType,
                      icon: ChartBarHorizontal,
                      label: "H-Bar Chart"
                    }
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        chartType === type
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 mx-auto mb-2 ${
                          chartType === type ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                      <p className="text-sm font-medium text-center">{label}</p>
                      {chartType === type && (
                        <Check className="w-5 h-5 mx-auto mt-2 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  Viewing {reportData.length} records with {selectedColumns.length} columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No data to display</p>
                    <p className="text-sm mt-1">Add columns and apply filters to see results</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          {selectedColumns.map((col) => (
                            <th
                              key={col.id}
                              className="text-left p-3 font-semibold text-sm bg-muted"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.slice(0, 50).map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/50">
                            {selectedColumns.map((col) => (
                              <td key={col.id} className="p-3 text-sm">
                                {String(row[col.field] || "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.length > 50 && (
                      <p className="text-sm text-muted-foreground text-center py-3">
                        Showing 50 of {reportData.length} records. Export to see all data.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Reports Tab */}
          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Reports</CardTitle>
                <CardDescription>
                  Load previously saved report configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No saved reports</p>
                    <p className="text-sm mt-1">Create and save a report to see it here</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {savedReports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{report.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {report.description || "No description"}
                            </p>
                            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                              <span>{report.columns.length} columns</span>
                              <span>{report.filters.length} filters</span>
                              <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadReport(report)}
                            >
                              Load
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
                            >
                              <Trash className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Report Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report</DialogTitle>
            <DialogDescription>
              Save your current report configuration for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="e.g., Monthly Fleet Overview"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-description">Description (optional)</Label>
              <Input
                id="report-description"
                placeholder="Brief description of this report..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Report will include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{selectedColumns.length} columns</li>
                <li>{filters.length} filters</li>
                <li>Visualization: {chartType}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveReport}>
              <FloppyDisk className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AnalyticsWorkbenchPage
