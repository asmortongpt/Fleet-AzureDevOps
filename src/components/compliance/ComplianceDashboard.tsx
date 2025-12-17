import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  Activity,
  Bell,
  FileCheck,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVehicles, useDrivers } from '@/hooks/use-api'

/**
 * Compliance Dashboard Component
 *
 * Features:
 * - Compliance scorecard (overall score, violations, inspections due)
 * - Alert panel for real-time warnings
 * - Timeline view with event history
 * - Reporting panel for document generation
 */

// Mock compliance data
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

const mockMetrics: ComplianceMetric[] = [
  {
    id: 'vehicle-compliance',
    category: 'Vehicle Compliance',
    score: 92,
    target: 95,
    trend: 'up',
    violations: 3,
    inspectionsDue: 5,
    status: 'good'
  },
  {
    id: 'driver-compliance',
    category: 'Driver Compliance',
    score: 88,
    target: 95,
    trend: 'down',
    violations: 7,
    inspectionsDue: 8,
    status: 'warning'
  },
  {
    id: 'safety-compliance',
    category: 'Safety Compliance',
    score: 96,
    target: 95,
    trend: 'stable',
    violations: 1,
    inspectionsDue: 2,
    status: 'excellent'
  },
  {
    id: 'regulatory-compliance',
    category: 'Regulatory Compliance',
    score: 75,
    target: 95,
    trend: 'down',
    violations: 12,
    inspectionsDue: 15,
    status: 'critical'
  }
]

const mockAlerts: ComplianceAlert[] = [
  {
    id: 'alert-1',
    type: 'critical',
    severity: 'critical',
    title: 'DOT Annual Inspection Overdue',
    description: '2 vehicles have overdue DOT annual inspections',
    timestamp: '2024-12-16T09:30:00',
    entityType: 'vehicle',
    entityId: 'veh-123',
    dueDate: '2024-12-10'
  },
  {
    id: 'alert-2',
    type: 'expiring',
    severity: 'high',
    title: 'Driver Certifications Expiring Soon',
    description: '4 driver certifications expire within 30 days',
    timestamp: '2024-12-16T08:15:00',
    entityType: 'driver',
    entityId: 'drv-456',
    dueDate: '2025-01-15'
  },
  {
    id: 'alert-3',
    type: 'warning',
    severity: 'medium',
    title: 'Insurance Documentation Review',
    description: 'Annual insurance policy review required',
    timestamp: '2024-12-15T14:20:00',
    entityType: 'document',
    entityId: 'doc-789',
    dueDate: '2024-12-20'
  },
  {
    id: 'alert-4',
    type: 'violation',
    severity: 'high',
    title: 'Speed Violation Recorded',
    description: 'Vehicle FL-456 exceeded speed limit by 15mph',
    timestamp: '2024-12-14T16:45:00',
    entityType: 'vehicle',
    entityId: 'veh-456'
  }
]

const mockEvents: ComplianceEvent[] = [
  {
    id: 'event-1',
    type: 'inspection',
    title: 'Vehicle Safety Inspection',
    description: 'Annual safety inspection completed for FL-123',
    timestamp: '2024-12-15T10:00:00',
    status: 'completed',
    entityType: 'vehicle',
    entityId: 'veh-123'
  },
  {
    id: 'event-2',
    type: 'certification',
    title: 'Driver CDL Renewal',
    description: 'CDL certification renewed for John Doe',
    timestamp: '2024-12-14T14:30:00',
    status: 'completed',
    entityType: 'driver',
    entityId: 'drv-001'
  },
  {
    id: 'event-3',
    type: 'violation',
    title: 'Traffic Violation',
    description: 'Speeding violation recorded for FL-456',
    timestamp: '2024-12-14T16:45:00',
    status: 'pending',
    entityType: 'vehicle',
    entityId: 'veh-456'
  },
  {
    id: 'event-4',
    type: 'training',
    title: 'Safety Training Completed',
    description: 'Defensive driving course completed by 3 drivers',
    timestamp: '2024-12-13T09:00:00',
    status: 'completed',
    entityType: 'driver',
    entityId: 'drv-multiple'
  },
  {
    id: 'event-5',
    type: 'audit',
    title: 'Fleet Compliance Audit',
    description: 'Quarterly compliance audit scheduled',
    timestamp: '2024-12-20T09:00:00',
    status: 'pending',
    entityType: 'facility',
    entityId: 'fac-001'
  }
]

// Compliance Scorecard Component
const ComplianceScorecard: React.FC = () => {
  const overallScore = useMemo(() => {
    const avg = mockMetrics.reduce((sum, m) => sum + m.score, 0) / mockMetrics.length
    return Math.round(avg)
  }, [])

  const totalViolations = useMemo(() => {
    return mockMetrics.reduce((sum, m) => sum + m.violations, 0)
  }, [])

  const totalInspectionsDue = useMemo(() => {
    return mockMetrics.reduce((sum, m) => sum + m.inspectionsDue, 0)
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600'
    if (score >= 85) return 'text-blue-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <Card data-testid="compliance-overall-score">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Overall Compliance Score
            </span>
            <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
              {overallScore}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{totalViolations}</div>
              <div className="text-sm text-muted-foreground">Active Violations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{totalInspectionsDue}</div>
              <div className="text-sm text-muted-foreground">Inspections Due</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{mockMetrics.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="compliance-categories">
        {mockMetrics.map((metric) => (
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
const AlertPanel: React.FC = () => {
  const [alertFilter, setAlertFilter] = useState<string>('all')

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return mockAlerts
    return mockAlerts.filter(a => a.severity === alertFilter)
  }, [alertFilter])

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'low': return <Bell className="h-5 w-5 text-blue-600" />
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
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={cn("p-4 rounded-lg border", getSeverityBgColor(alert.severity))}
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
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
const TimelineView: React.FC = () => {
  const [eventFilter, setEventFilter] = useState<string>('all')

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'all') return mockEvents
    return mockEvents.filter(e => e.type === eventFilter)
  }, [eventFilter])

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
      case 'expired': return 'text-gray-600'
      default: return 'text-gray-600'
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
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {filteredEvents.map((event, index) => (
              <div key={event.id} className="flex gap-4" data-testid={`event-${event.id}`}>
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                    {getEventIcon(event.type)}
                  </div>
                  {index < filteredEvents.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
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
              <CardContent className="p-4">
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
  return (
    <div className="h-screen flex flex-col" data-testid="compliance-dashboard">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
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
        <div className="p-6 space-y-6">
          {/* Scorecard */}
          <ComplianceScorecard />

          {/* Two-column layout for Alerts and Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertPanel />
            <TimelineView />
          </div>

          {/* Reporting Panel */}
          <ReportingPanel />
        </div>
      </ScrollArea>
    </div>
  )
}
