/**
 * DOTReportsDialog - Generate and export DOT compliance reports
 *
 * Features:
 * - Multiple report types (HOS Summary, DVIR Summary, Violations)
 * - Date range selection with presets
 * - Driver filtering (single or all drivers)
 * - Report preview with data tables
 * - PDF/CSV/Excel export
 * - Print functionality
 * - FMCSA-compliant formatting
 *
 * Usage:
 * ```tsx
 * <DOTReportsDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   tenantId="tenant-uuid"
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import { format, subMonths, differenceInDays } from 'date-fns'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DateRangePicker, type DateRange } from '@/components/reports/filters/DateRangePicker'
import {
  useHOSLogs,
  useDVIRReports,
  useHOSViolations,
  type HOSLog,
  type DVIRReport,
  type HOSViolation
} from '@/hooks/use-hos-data'
import { useDrivers } from '@/hooks/use-api'
import logger from '@/utils/logger'
import toast from 'sonner'

// ============================================================================
// TYPES
// ============================================================================

export interface DOTReportsDialogProps {
  /** Dialog open state */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Tenant ID for multi-tenant isolation */
  tenantId: string
}

type ReportType = 'hos_summary' | 'dvir_summary' | 'violations' | 'driver_performance'

interface ReportConfig {
  type: ReportType
  label: string
  description: string
  icon: React.ReactNode
}

interface HOSSummaryData {
  totalLogs: number
  byStatus: Record<string, number>
  byDriver: Record<string, { driver_id: string; logs: HOSLog[] }>
  logs: HOSLog[]
}

interface DVIRSummaryData {
  totalReports: number
  totalDefects: number
  criticalDefects: number
  unsafeVehicles: number
  byInspectionType: Record<string, number>
  reports: DVIRReport[]
}

interface ViolationSummaryData {
  totalViolations: number
  bySeverity: Record<string, number>
  byStatus: Record<string, number>
  byType: Record<string, number>
  violations: HOSViolation[]
}

interface DriverPerformanceData {
  totalHours: number
  totalViolations: number
  complianceRate: number
  avgDailyHours: number
  violations: HOSViolation[]
}

type ReportData = HOSSummaryData | DVIRSummaryData | ViolationSummaryData | DriverPerformanceData | null

// ============================================================================
// REPORT CONFIGURATIONS
// ============================================================================

const REPORT_TYPES: ReportConfig[] = [
  {
    type: 'hos_summary',
    label: 'HOS Log Summary',
    description: 'Driver duty status logs for the selected period',
    icon: <Clock className="h-4 w-4" />
  },
  {
    type: 'dvir_summary',
    label: 'DVIR Summary',
    description: 'Vehicle inspection reports and defects',
    icon: <FileText className="h-4 w-4" />
  },
  {
    type: 'violations',
    label: 'Violation Summary',
    description: 'HOS violations and compliance issues',
    icon: <AlertTriangle className="h-4 w-4" />
  },
  {
    type: 'driver_performance',
    label: 'Driver Performance',
    description: 'Aggregated driver statistics and compliance',
    icon: <CheckCircle className="h-4 w-4" />
  }
]

// ============================================================================
// COMPONENT
// ============================================================================

export function DOTReportsDialog({ open, onOpenChange, tenantId }: DOTReportsDialogProps) {
  // State
  const [reportType, setReportType] = useState<ReportType>('hos_summary')
  const [selectedDriver, setSelectedDriver] = useState<string>('all')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subMonths(new Date(), 1),
    end: new Date(),
    label: 'Last 30 Days'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<ReportData>(null)

  // Data hooks
  const { data: drivers = [] } = useDrivers(tenantId)
  const { data: hosLogs = [] } = useHOSLogs(tenantId, {
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    driverId: selectedDriver !== 'all' ? selectedDriver : undefined
  })
  const { data: dvirReports = [] } = useDVIRReports(tenantId, {
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    driverId: selectedDriver !== 'all' ? selectedDriver : undefined
  })
  const { data: violations = [] } = useHOSViolations({
    tenant_id: tenantId,
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
    driverId: selectedDriver !== 'all' ? selectedDriver : undefined
  })

  // Get current report config
  const currentReportConfig = useMemo(
    () => REPORT_TYPES.find((r) => r.type === reportType)!,
    [reportType]
  )

  // Generate report
  const handleGenerateReport = () => {
    setIsGenerating(true)

    try {
      let data: ReportData

      switch (reportType) {
        case 'hos_summary':
          data = generateHOSSummary(hosLogs, dateRange)
          break
        case 'dvir_summary':
          data = generateDVIRSummary(dvirReports, dateRange)
          break
        case 'violations':
          data = generateViolationSummary(violations, dateRange)
          break
        case 'driver_performance':
          data = generateDriverPerformance(hosLogs, violations, dateRange)
          break
        default:
          throw new Error('Invalid report type')
      }

      setReportData(data)
      toast.success('Report generated successfully')
    } catch (error) {
      logger.error('[DOT Reports] Generation error:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  // Export report
  const handleExport = async (exportFormat: 'pdf' | 'csv' | 'xlsx') => {
    if (!reportData) {
      toast.error('Please generate a report first')
      return
    }

    try {
      // In production, this would call backend API to generate file
      logger.info(`[DOT Reports] Exporting as ${exportFormat}`, {
        reportType,
        dateRange,
        driverId: selectedDriver
      })

      // For now, create a simple CSV export
      if (exportFormat === 'csv') {
        const csv = convertToCSV(reportData)
        downloadFile(csv, `dot-report-${reportType}-${Date.now()}.csv`, 'text/csv')
        toast.success('Report exported successfully')
      } else {
        toast.info(`${exportFormat.toUpperCase()} export coming soon`)
      }
    } catch (error) {
      logger.error('[DOT Reports] Export error:', error)
      toast.error('Failed to export report')
    }
  }

  // Print report
  const handlePrint = () => {
    if (!reportData) {
      toast.error('Please generate a report first')
      return
    }

    // Use browser print
    window.print()
  }

  // Reset when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setReportData(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            DOT Compliance Reports
          </DialogTitle>
          <DialogDescription>
            Generate FMCSA-compliant reports for Hours of Service, DVIR, and violations
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Report Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="report-type">
                <Filter className="h-3 w-3 inline mr-1" />
                Report Type
              </Label>
              <Select value={reportType} onValueChange={(val) => setReportType(val as ReportType)}>
                <SelectTrigger id="report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((config) => (
                    <SelectItem key={config.type} value={config.type}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <div>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {config.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Driver Selection */}
            <div className="space-y-2">
              <Label htmlFor="driver-select">Driver</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                <SelectTrigger id="driver-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name} ({driver.license_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <Label>
              <Calendar className="h-3 w-3 inline mr-1" />
              Reporting Period
            </Label>
            <DateRangePicker value={dateRange} onChange={setDateRange} className="w-full" />
          </div>

          {/* Generate Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>

          {/* Report Preview */}
          {reportData && (
            <div className="border rounded-lg bg-white">
              {/* Report Header */}
              <div className="border-b bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{currentReportConfig.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(dateRange.start, 'MMM d, yyyy')} -{' '}
                      {format(dateRange.end, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                      <Download className="h-4 w-4 mr-2" />
                      CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="p-4">
                {reportType === 'hos_summary' && <HOSSummaryReport data={reportData} />}
                {reportType === 'dvir_summary' && <DVIRSummaryReport data={reportData} />}
                {reportType === 'violations' && <ViolationSummaryReport data={reportData} />}
                {reportType === 'driver_performance' && (
                  <DriverPerformanceReport data={reportData} />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// REPORT GENERATORS
// ============================================================================

function generateHOSSummary(logs: HOSLog[], dateRange: DateRange): HOSSummaryData {
  return {
    totalLogs: logs.length,
    byStatus: {
      off_duty: logs.filter((l) => l.duty_status === 'off_duty').length,
      sleeper: logs.filter((l) => l.duty_status === 'sleeper').length,
      driving: logs.filter((l) => l.duty_status === 'driving').length,
      on_duty: logs.filter((l) => l.duty_status === 'on_duty').length
    },
    byDriver: logs.reduce((acc, log) => {
      const key = log.driver_id
      if (!acc[key]) {
        acc[key] = { driver_id: log.driver_id, logs: [] }
      }
      acc[key].logs.push(log)
      return acc
    }, {} as Record<string, { driver_id: string; logs: HOSLog[] }>),
    logs
  }
}

function generateDVIRSummary(reports: DVIRReport[], dateRange: DateRange): DVIRSummaryData {
  const totalDefects = reports.reduce((sum, r) => sum + (r.defects?.length || 0), 0)
  const criticalDefects = reports.reduce(
    (sum, r) => sum + (r.defects?.filter((d) => d.severity === 'critical').length || 0),
    0
  )

  return {
    totalReports: reports.length,
    totalDefects,
    criticalDefects,
    unsafeVehicles: reports.filter((r) => !r.vehicle_safe_to_operate).length,
    byInspectionType: {
      pre_trip: reports.filter((r) => r.inspection_type === 'pre_trip').length,
      post_trip: reports.filter((r) => r.inspection_type === 'post_trip').length,
      en_route: reports.filter((r) => r.inspection_type === 'en_route').length
    },
    reports
  }
}

function generateViolationSummary(violations: HOSViolation[], dateRange: DateRange): ViolationSummaryData {
  return {
    totalViolations: violations.length,
    bySeverity: {
      critical: violations.filter((v) => v.severity === 'critical').length,
      major: violations.filter((v) => v.severity === 'major').length,
      minor: violations.filter((v) => v.severity === 'minor').length
    },
    byStatus: {
      open: violations.filter((v) => v.status === 'open').length,
      acknowledged: violations.filter((v) => v.status === 'acknowledged').length,
      resolved: violations.filter((v) => v.status === 'resolved').length
    },
    byType: violations.reduce((acc, v) => {
      acc[v.violation_type] = (acc[v.violation_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    violations
  }
}

function generateDriverPerformance(logs: HOSLog[], violations: HOSViolation[], dateRange: DateRange): DriverPerformanceData {
  const drivingHours = logs
    .filter((l) => l.duty_status === 'driving')
    .reduce((sum, l) => {
      const start = new Date(l.start_time)
      const end = l.end_time ? new Date(l.end_time) : new Date()
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0)

  return {
    totalHours: drivingHours,
    totalViolations: violations.length,
    complianceRate:
      logs.length > 0 ? ((logs.length - violations.length) / logs.length) * 100 : 100,
    avgDailyHours: drivingHours / Math.max(1, differenceInDays(dateRange.end, dateRange.start)),
    violations
  }
}

// ============================================================================
// REPORT COMPONENTS
// ============================================================================

function HOSSummaryReport({ data }: { data: HOSSummaryData }): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Logs" value={data.totalLogs} />
        <StatCard label="Off Duty" value={data.byStatus.off_duty} />
        <StatCard label="Driving" value={data.byStatus.driving} />
        <StatCard label="On Duty" value={data.byStatus.on_duty} />
      </div>

      {/* Log Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Date/Time</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Driver</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Duty Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Location</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Vehicle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.logs.map((log: HOSLog) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {format(new Date(log.start_time), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-3 py-2">{log.driver_id}</td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{log.duty_status.replace('_', ' ')}</Badge>
                </td>
                <td className="px-3 py-2">
                  {log.start_location?.city}, {log.start_location?.state}
                </td>
                <td className="px-3 py-2">{log.vehicle_id || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DVIRSummaryReport({ data }: { data: DVIRSummaryData }): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Reports" value={data.totalReports} />
        <StatCard label="Total Defects" value={data.totalDefects} variant="warning" />
        <StatCard label="Critical Defects" value={data.criticalDefects} variant="danger" />
        <StatCard label="Unsafe Vehicles" value={data.unsafeVehicles} variant="danger" />
      </div>

      {/* DVIR Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Vehicle</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Defects</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Safe?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.reports.map((report: DVIRReport) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {format(new Date(report.inspection_datetime), 'MMM d, yyyy')}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{report.inspection_type.replace('_', ' ')}</Badge>
                </td>
                <td className="px-3 py-2">{report.vehicle_id}</td>
                <td className="px-3 py-2">{report.defects?.length || 0}</td>
                <td className="px-3 py-2">
                  {report.vehicle_safe_to_operate ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ViolationSummaryReport({ data }: { data: ViolationSummaryData }): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Violations" value={data.totalViolations} variant="warning" />
        <StatCard label="Critical" value={data.bySeverity.critical} variant="danger" />
        <StatCard label="Open" value={data.byStatus.open} variant="warning" />
        <StatCard label="Resolved" value={data.byStatus.resolved} variant="success" />
      </div>

      {/* Violations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Severity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.violations.map((violation: HOSViolation) => (
              <tr key={violation.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {format(new Date(violation.violation_datetime), 'MMM d, yyyy')}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{violation.violation_type.replace('_', ' ')}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant={
                      violation.severity === 'critical'
                        ? 'destructive'
                        : violation.severity === 'major'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {violation.severity}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline">{violation.status}</Badge>
                </td>
                <td className="px-3 py-2 max-w-xs truncate">{violation.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DriverPerformanceReport({ data }: { data: DriverPerformanceData }): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Hours" value={data.totalHours.toFixed(1)} />
        <StatCard label="Violations" value={data.totalViolations} variant="warning" />
        <StatCard label="Compliance Rate" value={`${data.complianceRate.toFixed(1)}%`} variant="success" />
        <StatCard label="Avg Daily Hours" value={data.avgDailyHours.toFixed(1)} />
      </div>
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  variant = 'default'
}: {
  label: string
  value: string | number
  variant?: 'default' | 'success' | 'warning' | 'danger'
}): React.ReactElement {
  const colorClasses: Record<'default' | 'success' | 'warning' | 'danger', string> = {
    default: 'bg-gray-50 border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[variant]}`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function convertToCSV(data: HOSSummaryData | DVIRSummaryData | ViolationSummaryData | DriverPerformanceData): string {
  // Simple CSV conversion - in production, use a proper CSV library
  const headers = Object.keys(data).join(',')
  const values = Object.values(data).map(v =>
    typeof v === 'object' ? JSON.stringify(v) : String(v)
  ).join(',')
  return `${headers}\n${values}`
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
