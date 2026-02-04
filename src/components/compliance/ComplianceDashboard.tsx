import {
  Shield,
  AlertTriangle,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Activity,
  Bell,
  FileCheck,
  AlertCircle,
  XCircle
} from 'lucide-react'
import React, { useState, useMemo } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

/**
 * Compliance Dashboard Component
 *
 * Features:
 * - Compliance scorecard (overall score, violations, inspections due)
 * - Alert panel for real-time warnings
 * - Timeline view with event history
 * - Reporting panel for document generation
 */

interface ComplianceMetric {
  id: string
  category: string
  score: number
  target: number
  trend: 'up' | 'down' | 'stable'
  violations: number
  inspectionsDue: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface ComplianceAlert {
  id: string
  type: 'warning' | 'violation' | 'expiring' | 'critical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  timestamp: string
  entityType: 'vehicle' | 'driver' | 'document' | 'facility'
  entityId: string
  dueDate?: string
}

interface ComplianceEvent {
  id: string
  type: 'inspection' | 'violation' | 'certification' | 'training' | 'audit'
  title: string
  description: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed' | 'expired'
  entityType: string
  entityId: string
}


// Compliance Scorecard Component
const ComplianceScorecard: React.FC<{ metrics: ComplianceMetric[] }> = ({ metrics }) => {
  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0
    const avg = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    return Math.round(avg)
  }, [metrics])

  const totalViolations = useMemo(() => {
    return metrics.reduce((sum, m) => sum + m.violations, 0)
  }, [metrics])

  const totalInspectionsDue = useMemo(() => {
    return metrics.reduce((sum, m) => sum + m.inspectionsDue, 0)
  }, [metrics])

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-blue-800'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-2">
      {/* Overall Score */}
      <Card data-testid="compliance-overall-score">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Compliance Score
            </span>
            <span className={cn("text-base font-bold", getScoreColor(overallScore))}>
              {overallScore}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold text-red-600">{totalViolations}</div>
              <div className="text-sm text-muted-foreground">Active Violations</div>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-600">{totalInspectionsDue}</div>
              <div className="text-sm text-muted-foreground">Inspections Due</div>
            </div>
            <div>
              <div className="text-sm font-bold text-green-600">{metrics.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2" data-testid="compliance-categories">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{metric.category}</span>
                <div className="flex items-center gap-2">
                  {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                  <Badge variant="outline" className={cn("font-bold", getScoreColor(metric.score))}>
                    {metric.score}%
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{metric.score}% / {metric.target}%</span>
                </div>
                <Progress value={metric.score} className="h-2" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Violations</span>
                <span className="font-semibold text-red-600">{metric.violations}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inspections Due</span>
                <span className="font-semibold text-yellow-600">{metric.inspectionsDue}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Alert Panel Component
const AlertPanel: React.FC<{ alerts: ComplianceAlert[] }> = ({ alerts }) => {
  const [alertFilter, setAlertFilter] = useState<string>('all')

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return alerts
    return alerts.filter(a => a.severity === alertFilter)
  }, [alertFilter, alerts])

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'low': return <Bell className="h-5 w-5 text-blue-800" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getSeverityBgColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900'
      case 'high': return 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-900'
      case 'medium': return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900'
      case 'low': return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
      default: return 'bg-gray-50 dark:bg-gray-950'
    }
  }

  return (
    <Card data-testid="compliance-alert-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
          </CardTitle>
          <Select value={alertFilter} onValueChange={setAlertFilter}>
            <SelectTrigger className="w-32" data-testid="alert-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn("p-2 rounded-lg border", getSeverityBgColor(alert.severity))}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {alert.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {alert.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Timeline View Component
const TimelineView: React.FC<{ events: ComplianceEvent[] }> = ({ events }) => {
  const [eventFilter, setEventFilter] = useState<string>('all')

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return events
    return events.filter(e => e.type === eventFilter)
  }, [eventFilter, events])

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'inspection': return <FileCheck className="h-4 w-4" />
      case 'violation': return <AlertTriangle className="h-4 w-4" />
      case 'certification': return <Shield className="h-4 w-4" />
      case 'training': return <Activity className="h-4 w-4" />
      case 'audit': return <FileText className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      case 'expired': return 'text-slate-700'
      default: return 'text-slate-700'
    }
  }

  return (
    <Card data-testid="compliance-timeline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Compliance Timeline
          </CardTitle>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-40" data-testid="event-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="inspection">Inspections</SelectItem>
              <SelectItem value="violation">Violations</SelectItem>
              <SelectItem value="certification">Certifications</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="audit">Audits</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-2">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="flex gap-2" data-testid={`event-${event.id}`}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground">
                    {getEventIcon(event.type)}
                  </div>
                  {index < filteredEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold">{event.title}</h4>
                    <Badge variant="outline" className={cn("text-xs capitalize", getStatusColor(event.status))}>
                      {event.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Reporting Panel Component
const ReportingPanel: React.FC = () => {
  const reportTypes = [
    {
      id: 'compliance-summary',
      name: 'Compliance Summary Report',
      description: 'Overall compliance status and metrics',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'violations-report',
      name: 'Violations Report',
      description: 'Active violations and corrective actions',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    {
      id: 'inspection-schedule',
      name: 'Inspection Schedule',
      description: 'Upcoming and overdue inspections',
      icon: <FileCheck className="h-5 w-5" />
    },
    {
      id: 'certification-status',
      name: 'Certification Status',
      description: 'Driver and vehicle certifications',
      icon: <FileText className="h-5 w-5" />
    }
  ]

  return (
    <Card data-testid="compliance-reporting">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Generate Reports
        </CardTitle>
        <CardDescription>
          Export compliance data and generate regulatory reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reportTypes.map((report) => (
            <Card key={report.id} className="hover:bg-accent transition-colors cursor-pointer">
              <CardContent className="p-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-primary">{report.icon}</div>
                    <div>
                      <h4 className="font-semibold mb-1">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Main Compliance Dashboard Component
export function ComplianceDashboard() {
  const { data, error } = useSWR('/api/compliance/dashboard', fetcher)
  const metrics: ComplianceMetric[] = data?.metrics || []
  const alerts: ComplianceAlert[] = data?.alerts || []
  const events: ComplianceEvent[] = data?.events || []

  if (error) {
    return (
      <div className="p-3 text-sm text-red-600">
        Failed to load compliance dashboard.
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" data-testid="compliance-dashboard">
      {/* Header */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold">Compliance Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor compliance metrics, alerts, and reporting
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Scorecard */}
          <ComplianceScorecard metrics={metrics} />

          {/* Two-column layout for Alerts and Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <AlertPanel alerts={alerts} />
            <TimelineView events={events} />
          </div>

          {/* Reporting Panel */}
          <ReportingPanel />
        </div>
      </ScrollArea>
    </div>
  )
}
