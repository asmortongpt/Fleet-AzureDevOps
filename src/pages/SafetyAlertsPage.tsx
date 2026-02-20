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
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  FileText,
  Eye,
  Download,
  LineChart,
  Filter
} from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import useSWR from "swr"

import { apiFetcher } from '@/lib/api-fetcher'
import ErrorBoundary from '@/components/common/ErrorBoundary'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDrilldown } from "@/contexts/DrilldownContext"
import { formatEnum } from "@/utils/format-enum"
import { formatDateTime, formatNumber } from '@/utils/format-helpers'
import { getCsrfToken } from "@/hooks/use-api"

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

const fetcher = apiFetcher

export default function SafetyAlertsPage() {
  const { push } = useDrilldown()
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const currentYear = new Date().getFullYear()

  const {
    data: alertsResponse,
    error: alertsError,
    isLoading: alertsLoading,
    mutate: refreshAlerts
  } = useSWR<SafetyAlert[]>('/api/safety-alerts?limit=200', fetcher, {
    refreshInterval: 30000,
    shouldRetryOnError: false
  })

  const { data: oshaResponse } = useSWR<OSHAMetrics>(
    `/api/safety-alerts/metrics/osha?year=${currentYear}`,
    fetcher,
    { refreshInterval: 60000, shouldRetryOnError: false }
  )

  const alerts = useMemo(() => {
    const raw = Array.isArray(alertsResponse) ? alertsResponse : []
    return raw.map((alert) => ({
      ...alert,
      alertNumber: alert.alertNumber || (alert as any).alert_number || alert.id,
      reportedAt: alert.reportedAt || (alert as any).reported_at || (alert as any).created_at || new Date().toISOString(),
      reportedBy: alert.reportedBy || (alert as any).reported_by || 'System'
    }))
  }, [alertsResponse])

  const oshaMetrics = useMemo<OSHAMetrics>(() => {
    // apiFetcher unwraps the { data: ... } envelope, so oshaResponse IS the OSHAMetrics object directly
    if (oshaResponse && typeof oshaResponse === 'object' && 'totalRecordableIncidents' in oshaResponse) {
      return oshaResponse
    }

    // Fallback: compute from alert records when OSHA metrics endpoint has no data
    const totalRecordableIncidents = alerts.filter(a => a.oshaRecordable).length
    const totalCases = alerts.length
    const daysAwayRestrictedTransfer = alerts.reduce(
      (sum, a) => sum + (a.daysAwayFromWork || 0) + (a.daysRestricted || 0),
      0
    )
    const daysAwayFromWork = alerts.reduce((sum, a) => sum + (a.daysAwayFromWork || 0), 0)
    const totalHoursWorked = 0

    const incidentRate = 0
    const daysAwayFromWorkCaseRate = 0
    const lostWorkdayRate = 0

    return {
      totalRecordableIncidents,
      daysAwayRestrictedTransfer,
      totalCases,
      incidentRate,
      daysAwayFromWorkCaseRate,
      lostWorkdayRate,
      totalHoursWorked,
      yearToDate: {
        injuries: alerts.filter(a => a.type === 'injury').length,
        illnesses: alerts.filter(a => a.type === 'environmental').length,
        fatalities: 0
      }
    }
  }, [alerts, oshaResponse])

  const filteredAlerts = useMemo(() => {
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

    return filtered
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

  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      const csrf = await getCsrfToken()
      const response = await fetch(`/api/safety-alerts/${alertId}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        }
      })

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert')
      }

      toast.success("Alert acknowledged")
      refreshAlerts()
    } catch (error) {
      toast.error("Unable to acknowledge alert")
    }
  }, [refreshAlerts])

  const handleResolve = useCallback(async (alertId: string) => {
    try {
      const csrf = await getCsrfToken()
      const response = await fetch(`/api/safety-alerts/${alertId}/resolve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf
        }
      })

      if (!response.ok) {
        throw new Error('Failed to resolve alert')
      }

      toast.success("Alert marked as resolved")
      refreshAlerts()
    } catch (error) {
      toast.error("Unable to resolve alert")
    }
  }, [refreshAlerts])

  const getSeverityBadge = (severity: SafetyAlert["severity"]) => {
    const colors = {
      critical: "bg-red-100 text-red-800 border-red-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
    return (
      <Badge variant="outline" className={colors[severity]}>
        {formatEnum(severity)}
      </Badge>
    )
  }

  const getStatusBadge = (status: SafetyAlert["status"]) => {
    const colors = {
      active: "bg-red-100 text-red-800",
      acknowledged: "bg-emerald-100 text-emerald-800",
      investigating: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800"
    }
    return (
      <Badge className={colors[status]}>
        {formatEnum(status)}
      </Badge>
    )
  }

  const getTypeIcon = (type: SafetyAlert["type"]) => {
    switch (type) {
      case "injury": return <AlertTriangle className="w-4 h-4 text-red-600" />
      case "near-miss": return <AlertTriangle className="w-4 h-4 text-orange-600" />
      case "hazard": return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case "osha-violation": return <FileText className="w-4 h-4 text-red-600" />
      case "equipment-failure": return <LineChart className="w-4 h-4 text-orange-600" />
      case "environmental": return <ShieldCheck className="w-4 h-4 text-green-600" />
    }
  }

  const activeAlerts = alerts.filter(a => a.status === "active").length
  const criticalAlerts = alerts.filter(a => a.severity === "critical").length
  const oshaRecordable = alerts.filter(a => a.oshaRecordable).length
  const avgResolutionTime = useMemo(() => {
    const resolved = alerts.filter(a => a.actualResolutionTime && a.reportedAt)
    if (resolved.length === 0) return "—"
    const totalMs = resolved.reduce((sum, alert) => {
      const start = new Date(alert.reportedAt).getTime()
      const end = new Date(alert.actualResolutionTime as string).getTime()
      if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum
      return sum + (end - start)
    }, 0)
    if (totalMs <= 0) return "—"
    const avgHours = totalMs / resolved.length / 36e5
    return `${avgHours.toFixed(1)} hours`
  }, [alerts])

  const metrics = oshaMetrics

  // Compute monthly incident trend from real alert data
  const monthlyTrend = useMemo(() => {
    const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    const counts = new Array(12).fill(0)
    alerts.forEach(a => {
      const d = new Date(a.reportedAt)
      if (d.getFullYear() === currentYear && !Number.isNaN(d.getTime())) {
        counts[d.getMonth()]++
      }
    })
    const max = Math.max(...counts, 1)
    return months.map((label, i) => ({
      label,
      count: counts[i],
      heightPct: Math.round((counts[i] / max) * 100)
    }))
  }, [alerts, currentYear])

  // Compute incident category breakdown from real alert data
  const categoryBreakdown = useMemo(() => {
    const categories: { key: SafetyAlert['type']; label: string; color: string }[] = [
      { key: 'near-miss', label: 'Near Miss', color: 'bg-orange-500' },
      { key: 'hazard', label: 'Hazard', color: 'bg-yellow-500' },
      { key: 'injury', label: 'Injury', color: 'bg-red-500' },
      { key: 'equipment-failure', label: 'Equipment', color: 'bg-purple-500' },
      { key: 'environmental', label: 'Environmental', color: 'bg-green-500' },
      { key: 'osha-violation', label: 'OSHA Violation', color: 'bg-red-700' },
    ]
    const total = alerts.length || 1
    return categories
      .map(cat => {
        const count = alerts.filter(a => a.type === cat.key).length
        return { ...cat, count, pct: Math.round((count / total) * 100) }
      })
      .filter(cat => cat.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [alerts])

  // Compute safety performance metrics from real alert data
  const performanceMetrics = useMemo(() => {
    // Days since last injury
    const injuries = alerts
      .filter(a => a.type === 'injury')
      .map(a => new Date(a.reportedAt).getTime())
      .filter(t => !Number.isNaN(t))
      .sort((a, b) => b - a)
    const daysSinceLastInjury = injuries.length > 0
      ? Math.floor((Date.now() - injuries[0]) / 864e5)
      : alerts.length > 0 ? '—' : '—'

    // Hazard reports resolved rate
    const hazards = alerts.filter(a => a.type === 'hazard')
    const hazardsResolved = hazards.filter(a => a.status === 'resolved' || a.status === 'closed').length
    const hazardResolutionRate = hazards.length > 0
      ? `${Math.round((hazardsResolved / hazards.length) * 100)}%`
      : '—'

    // Average resolution time from real data
    const resolvedAlerts = alerts.filter(a => a.actualResolutionTime && a.reportedAt)
    let avgResolution = '—'
    if (resolvedAlerts.length > 0) {
      const totalMs = resolvedAlerts.reduce((sum, a) => {
        const start = new Date(a.reportedAt).getTime()
        const end = new Date(a.actualResolutionTime as string).getTime()
        if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return sum
        return sum + (end - start)
      }, 0)
      if (totalMs > 0) {
        avgResolution = `${(totalMs / resolvedAlerts.length / 36e5).toFixed(1)}h`
      }
    }

    // Closure rate
    const closedAlerts = alerts.filter(a => a.status === 'resolved' || a.status === 'closed').length
    const closureRate = alerts.length > 0
      ? `${Math.round((closedAlerts / alerts.length) * 100)}%`
      : '—'

    return [
      { label: 'Days Since Last Injury', value: String(daysSinceLastInjury) },
      { label: 'Alert Closure Rate', value: closureRate },
      { label: 'Hazard Reports Resolved', value: hazardResolutionRate },
      { label: 'Avg Resolution Time', value: avgResolution },
    ]
  }, [alerts])

  // CSV export helper
  const generateCSV = useCallback((rows: SafetyAlert[], filename: string) => {
    const headers = [
      'Alert #', 'Type', 'Severity', 'Title', 'Description', 'Location',
      'Status', 'OSHA Recordable', 'OSHA Form', 'Reported By', 'Reported At',
      'Days Away From Work', 'Days Restricted', 'Assigned To', 'Root Cause',
      'Resolution Time'
    ]
    const csvRows = [headers.join(',')]
    rows.forEach(a => {
      const row = [
        a.alertNumber,
        a.type,
        a.severity,
        `"${(a.title || '').replace(/"/g, '""')}"`,
        `"${(a.description || '').replace(/"/g, '""')}"`,
        `"${(a.location || '').replace(/"/g, '""')}"`,
        a.status,
        a.oshaRecordable ? 'Yes' : 'No',
        a.oshaFormRequired || '',
        `"${(a.reportedBy || '').replace(/"/g, '""')}"`,
        a.reportedAt,
        a.daysAwayFromWork ?? '',
        a.daysRestricted ?? '',
        `"${(a.assignedTo || '').replace(/"/g, '""')}"`,
        `"${(a.rootCause || '').replace(/"/g, '""')}"`,
        a.actualResolutionTime || ''
      ]
      csvRows.push(row.join(','))
    })
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  // Generic blob download helper (defined before OSHA generators that use it)
  const downloadBlob = useCallback((content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  // OSHA Form generators
  const generateOSHAForm300 = useCallback(() => {
    const recordable = alerts.filter(a => a.oshaRecordable)
    const headers = [
      'Case No.', 'Employee Name', 'Job Title', 'Date of Injury/Illness',
      'Where Event Occurred', 'Description', 'Classify (Injury/Illness)',
      'Days Away From Work', 'Days Restricted', 'Death'
    ]
    const csvRows = [
      'OSHA Form 300 - Log of Work-Related Injuries and Illnesses',
      `Establishment: Fleet CTA | Year: ${currentYear}`,
      '',
      headers.join(',')
    ]
    recordable.forEach((a, i) => {
      csvRows.push([
        i + 1,
        `"${(a.reportedBy || 'Unknown').replace(/"/g, '""')}"`,
        '""',
        a.reportedAt ? new Date(a.reportedAt).toLocaleDateString() : '',
        `"${(a.location || '').replace(/"/g, '""')}"`,
        `"${(a.description || '').replace(/"/g, '""')}"`,
        a.type === 'environmental' ? 'Illness' : 'Injury',
        a.daysAwayFromWork ?? 0,
        a.daysRestricted ?? 0,
        'No'
      ].join(','))
    })
    downloadBlob(csvRows.join('\n'), `OSHA-Form-300-${currentYear}.csv`)
    toast.success(`OSHA Form 300 generated with ${recordable.length} recordable incidents`)
  }, [alerts, currentYear, downloadBlob])

  const generateOSHAForm300A = useCallback(() => {
    const recordable = alerts.filter(a => a.oshaRecordable)
    const injuries = recordable.filter(a => a.type !== 'environmental').length
    const illnesses = recordable.filter(a => a.type === 'environmental').length
    const totalDaysAway = recordable.reduce((sum, a) => sum + (a.daysAwayFromWork || 0), 0)
    const totalDaysRestricted = recordable.reduce((sum, a) => sum + (a.daysRestricted || 0), 0)

    const lines = [
      'OSHA Form 300A - Summary of Work-Related Injuries and Illnesses',
      `Establishment: Fleet CTA | Year: ${currentYear}`,
      '',
      'SUMMARY',
      `Total number of cases: ${recordable.length}`,
      `Total injuries: ${injuries}`,
      `Total illnesses: ${illnesses}`,
      `Total fatalities: 0`,
      `Total days away from work: ${totalDaysAway}`,
      `Total days of restricted work activity: ${totalDaysRestricted}`,
      '',
      `OSHA Total Recordable Incident Rate (TRIR): ${metrics.incidentRate.toFixed(2)}`,
      `Days Away/Restricted/Transfer (DART) Rate: ${metrics.daysAwayFromWorkCaseRate.toFixed(2)}`,
      `Lost Workday Rate: ${metrics.lostWorkdayRate.toFixed(2)}`,
    ]
    downloadBlob(lines.join('\n'), `OSHA-Form-300A-${currentYear}.csv`)
    toast.success('OSHA Form 300A summary generated')
  }, [alerts, currentYear, metrics, downloadBlob])

  const generateOSHAForm301 = useCallback((alert?: SafetyAlert | null) => {
    const target = alert || alerts.filter(a => a.oshaRecordable)[0]
    if (!target) {
      toast.error('No OSHA recordable incidents available for Form 301')
      return
    }
    const lines = [
      'OSHA Form 301 - Injury and Illness Incident Report',
      '',
      `Case Number: ${target.alertNumber}`,
      `Date of Report: ${new Date().toLocaleDateString()}`,
      '',
      'ABOUT THE EMPLOYEE',
      `Name: ${target.reportedBy || 'Unknown'}`,
      '',
      'ABOUT THE CASE',
      `Date of Injury/Illness: ${target.reportedAt ? new Date(target.reportedAt).toLocaleDateString() : ''}`,
      `Time of Event: ${target.reportedAt ? new Date(target.reportedAt).toLocaleTimeString() : ''}`,
      `Location: ${target.location}`,
      '',
      'DESCRIPTION',
      `${target.description}`,
      '',
      `Type: ${target.type}`,
      `Severity: ${target.severity}`,
      `OSHA Form Required: ${target.oshaFormRequired || 'N/A'}`,
      `Days Away From Work: ${target.daysAwayFromWork ?? 0}`,
      `Days Restricted: ${target.daysRestricted ?? 0}`,
      '',
      'ROOT CAUSE',
      `${target.rootCause || 'Under investigation'}`,
      '',
      'CORRECTIVE ACTIONS',
      ...(target.correctiveActions?.length ? target.correctiveActions.map((a, i) => `${i + 1}. ${a}`) : ['None recorded']),
      '',
      'PREVENTIVE MEASURES',
      ...(target.preventiveMeasures?.length ? target.preventiveMeasures.map((m, i) => `${i + 1}. ${m}`) : ['None recorded']),
    ]
    downloadBlob(lines.join('\n'), `OSHA-Form-301-${target.alertNumber}.csv`)
    toast.success(`OSHA Form 301 generated for ${target.alertNumber}`)
  }, [alerts, downloadBlob])

  // OSHA Forms dialog state
  const [oshaFormsOpen, setOshaFormsOpen] = useState(false)

  return (
    <ErrorBoundary>
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#111] via-[#111] to-[#111]">
      {/* Header */}
      <div className="flex-none border-b border-white/[0.08] bg-white/[0.03] backdrop-blur-xl">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Bell className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">Safety Alerts</h1>
                <p className="text-sm text-white/40">Real-time safety monitoring with OSHA compliance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (alerts.length === 0) {
                    toast.error('No alerts to export')
                    return
                  }
                  generateCSV(alerts, `safety-alerts-${new Date().toISOString().split('T')[0]}.csv`)
                  toast.success(`Exported ${alerts.length} safety alerts`)
                }}
              >
                <Download className="w-4 h-4" />
                Export Report
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setOshaFormsOpen(true)}>
                <FileText className="w-4 h-4" />
                OSHA Forms
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-2">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide">Active Alerts</p>
                    <p className="text-sm font-bold text-white mt-1">{activeAlerts}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Bell className="w-3 h-3 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242424] border-white/[0.08]">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide">Critical</p>
                    <p className="text-sm font-bold text-white mt-1">{criticalAlerts}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242424] border-white/[0.08]">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide">OSHA Recordable</p>
                    <p className="text-sm font-bold text-white mt-1">{oshaRecordable}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="w-3 h-3 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#242424] border-white/[0.08]">
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide">Avg Resolution</p>
                    <p className="text-sm font-bold text-white mt-1">{avgResolutionTime}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Clock className="w-3 h-3 text-green-400" />
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
          <TabsList className="mx-3 mt-2">
            <TabsTrigger value="alerts">Alert Dashboard</TabsTrigger>
            <TabsTrigger value="osha">OSHA Compliance</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="flex-1 overflow-auto p-3 space-y-2">
            {/* Filters */}
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardContent className="p-2">
                <div className="grid grid-cols-5 gap-2">
                  <Input
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#111] border-white/[0.08] text-white"
                  />
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="bg-[#111] border-white/[0.08] text-white">
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
                    <SelectTrigger className="bg-[#111] border-white/[0.08] text-white">
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
                    <SelectTrigger className="bg-[#111] border-white/[0.08] text-white">
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
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setFilterSeverity("all")
                      setFilterStatus("all")
                      setFilterType("all")
                      setSearchTerm("")
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Table */}
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white">Safety Alerts ({filteredAlerts.length})</CardTitle>
                <CardDescription>Real-time safety incidents and hazards</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.08] hover:bg-[#242424]">
                      <TableHead className="text-white/80">Alert #</TableHead>
                      <TableHead className="text-white/80">Type</TableHead>
                      <TableHead className="text-white/80">Title</TableHead>
                      <TableHead className="text-white/80">Location</TableHead>
                      <TableHead className="text-white/80">Severity</TableHead>
                      <TableHead className="text-white/80">Status</TableHead>
                      <TableHead className="text-white/80">OSHA</TableHead>
                      <TableHead className="text-white/80">Reported</TableHead>
                      <TableHead className="text-white/80">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertsLoading && (
                      <TableRow className="border-white/[0.08]">
                        <TableCell colSpan={9} className="text-white/80">
                          Loading alerts...
                        </TableCell>
                      </TableRow>
                    )}
                    {alertsError && !alertsLoading && (
                      <TableRow className="border-white/[0.08]">
                        <TableCell colSpan={9} className="text-red-400">
                          Failed to load alerts. Please check your session and try again.
                        </TableCell>
                      </TableRow>
                    )}
                    {!alertsLoading && !alertsError && filteredAlerts.length === 0 && (
                      <TableRow className="border-white/[0.08]">
                        <TableCell colSpan={9} className="text-white/80">
                          No alerts match the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {!alertsLoading && !alertsError && filteredAlerts.map(alert => (
                      <TableRow
                        key={alert.id}
                        className="border-white/[0.08] hover:bg-[#242424] cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for alert ${alert.alertNumber}: ${alert.title}`}
                        onClick={() => handleViewDetails(alert)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewDetails(alert); } }}
                      >
                        <TableCell className="font-mono text-white/80">{alert.alertNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(alert.type)}
                            <span className="text-white/80">{formatEnum(alert.type.replace('-', '_'))}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-medium">{alert.title}</TableCell>
                        <TableCell className="text-white/80">{alert.location}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          {alert.oshaRecordable && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800">
                              {alert.oshaFormRequired || "Yes"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-white/80">
                          {formatDateTime(alert.reportedAt)}
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

          <TabsContent value="osha" className="flex-1 overflow-auto p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader>
                  <CardTitle className="text-white">OSHA Incident Rates</CardTitle>
                  <CardDescription>Rates per 100 full-time workers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white/[0.03] rounded-lg">
                    <div>
                      <p className="text-sm text-white/40">Total Recordable Incident Rate (TRIR)</p>
                      <p className="text-sm font-bold text-white">{metrics.incidentRate}</p>
                    </div>
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.03] rounded-lg">
                    <div>
                      <p className="text-sm text-white/40">Days Away/Restricted Case Rate (DART)</p>
                      <p className="text-sm font-bold text-white">{metrics.daysAwayFromWorkCaseRate}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white/[0.03] rounded-lg">
                    <div>
                      <p className="text-sm text-white/40">Lost Workday Rate</p>
                      <p className="text-sm font-bold text-white">{metrics.lostWorkdayRate}</p>
                    </div>
                    <TrendingDown className="w-4 h-4 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader>
                  <CardTitle className="text-white">Year-to-Date Statistics</CardTitle>
                  <CardDescription>Total hours worked: {formatNumber(metrics.totalHoursWorked)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-2 bg-white/[0.03] rounded-lg">
                    <p className="text-sm text-white/40 mb-2">Total Recordable Cases</p>
                    <p className="text-base font-bold text-white">{metrics.totalRecordableIncidents}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-white/[0.03] rounded-lg">
                      <p className="text-xs text-white/40 mb-1">Injuries</p>
                      <p className="text-base font-bold text-white">{metrics.yearToDate.injuries}</p>
                    </div>
                    <div className="p-2 bg-white/[0.03] rounded-lg">
                      <p className="text-xs text-white/40 mb-1">Illnesses</p>
                      <p className="text-base font-bold text-white">{metrics.yearToDate.illnesses}</p>
                    </div>
                    <div className="p-2 bg-white/[0.03] rounded-lg">
                      <p className="text-xs text-white/40 mb-1">Fatalities</p>
                      <p className="text-base font-bold text-white">{metrics.yearToDate.fatalities}</p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/[0.03] rounded-lg">
                    <p className="text-sm text-white/40 mb-2">Days Away/Restricted/Transfer</p>
                    <p className="text-sm font-bold text-white">{metrics.daysAwayRestrictedTransfer}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white">OSHA Form Requirements</CardTitle>
                <CardDescription>Required forms for recordable incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                    <FileText className="w-4 h-4 text-emerald-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 300</h3>
                    <p className="text-sm text-white/40 mb-3">Log of Work-Related Injuries and Illnesses</p>
                    <Button variant="outline" className="w-full" size="sm" onClick={generateOSHAForm300}>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Form
                    </Button>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                    <FileText className="w-4 h-4 text-purple-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 300A</h3>
                    <p className="text-sm text-white/40 mb-3">Summary of Work-Related Injuries and Illnesses</p>
                    <Button variant="outline" className="w-full" size="sm" onClick={generateOSHAForm300A}>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Summary
                    </Button>
                  </div>
                  <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
                    <FileText className="w-4 h-4 text-green-400 mb-2" />
                    <h3 className="font-semibold text-white mb-1">OSHA Form 301</h3>
                    <p className="text-sm text-white/40 mb-3">Injury and Illness Incident Report</p>
                    <Button variant="outline" className="w-full" size="sm" onClick={() => generateOSHAForm301()}>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="flex-1 overflow-auto p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader>
                  <CardTitle className="text-white">Incident Trend Analysis</CardTitle>
                  <CardDescription>Monthly incident comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between h-32 gap-2">
                    {monthlyTrend.map((m, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-white/60 mb-1">{m.count > 0 ? m.count : ''}</span>
                        <div
                          className="w-full bg-emerald-500/80 rounded-t transition-all"
                          style={{ height: `${Math.max(m.heightPct, m.count > 0 ? 4 : 0)}%` }}
                        />
                        <span className="text-[9px] text-white/60">{m.label}</span>
                      </div>
                    ))}
                  </div>
                  {alerts.length === 0 && (
                    <p className="text-xs text-white/40 text-center mt-2">No alert data available for {currentYear}</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader>
                  <CardTitle className="text-white">Incident by Category</CardTitle>
                  <CardDescription>Distribution breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {categoryBreakdown.length === 0 && (
                    <p className="text-xs text-white/40 text-center">No incidents to categorize</p>
                  )}
                  {categoryBreakdown.map(item => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/80">{item.label}</span>
                        <span className="text-white font-medium">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="w-full bg-white/[0.1] rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${Math.max(item.pct, 2)}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-white">Safety Performance Metrics</CardTitle>
                <CardDescription>Key safety indicators over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {performanceMetrics.map(metric => (
                    <div key={metric.label} className="p-2 bg-white/[0.03] rounded-lg">
                      <p className="text-xs text-white/40 mb-1">{metric.label}</p>
                      <p className="text-sm font-bold text-white">{metric.value}</p>
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
              Reported {selectedAlert && formatDateTime(selectedAlert.reportedAt)} by {selectedAlert?.reportedBy}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-2 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm font-medium text-white/40">Severity</p>
                  <div className="mt-1">{getSeverityBadge(selectedAlert.severity)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/40">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAlert.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/40">Location</p>
                  <p className="mt-1 text-sm">{selectedAlert.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/40">OSHA Recordable</p>
                  <p className="mt-1 text-sm">{selectedAlert.oshaRecordable ? "Yes" : "No"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white/40">Description</p>
                <p className="mt-1 text-sm">{selectedAlert.description}</p>
              </div>

              {selectedAlert.witnesses && selectedAlert.witnesses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white/40">Witnesses</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.witnesses.map((witness) => (
                      <li key={witness}>{witness}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.correctiveActions && selectedAlert.correctiveActions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white/40">Corrective Actions</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.correctiveActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.preventiveMeasures && selectedAlert.preventiveMeasures.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white/40">Preventive Measures</p>
                  <ul className="mt-1 list-disc list-inside text-sm">
                    {selectedAlert.preventiveMeasures.map((measure) => (
                      <li key={measure}>{measure}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedAlert.assignedTo && (
                <div>
                  <p className="text-sm font-medium text-white/40">Assigned To</p>
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
              <Button onClick={() => {
                generateOSHAForm301(selectedAlert)
                setDetailsOpen(false)
              }}>
                <FileText className="w-4 h-4 mr-2" />
                Generate OSHA Form 301
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OSHA Forms Quick Access Dialog */}
      <Dialog open={oshaFormsOpen} onOpenChange={setOshaFormsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>OSHA Forms</DialogTitle>
            <DialogDescription>
              Generate required OSHA compliance forms from your safety alert data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              <div>
                <p className="font-medium text-sm">Form 300</p>
                <p className="text-xs text-white/40">Log of Work-Related Injuries and Illnesses</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { generateOSHAForm300(); setOshaFormsOpen(false) }}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              <div>
                <p className="font-medium text-sm">Form 300A</p>
                <p className="text-xs text-white/40">Summary of Work-Related Injuries and Illnesses</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { generateOSHAForm300A(); setOshaFormsOpen(false) }}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg border border-white/[0.08]">
              <div>
                <p className="font-medium text-sm">Form 301</p>
                <p className="text-xs text-white/40">Injury and Illness Incident Report</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => { generateOSHAForm301(); setOshaFormsOpen(false) }}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOshaFormsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ErrorBoundary>
  )
}
