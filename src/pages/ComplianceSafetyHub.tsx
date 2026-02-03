/**
 * ComplianceSafetyHub - Consolidated Compliance & Safety Management Dashboard
 *
 * Consolidates:
 * - ComplianceHub (regulatory compliance, certifications)
 * - SafetyHub (safety metrics, incidents)
 * - SafetyComplianceHub (combined safety + compliance)
 * - PolicyHub (policy management, enforcement)
 *
 * Features:
 * - Unified compliance and safety monitoring
 * - Real-time compliance status tracking
 * - Incident management and reporting
 * - Policy enforcement tracking
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BookOpen,
  ClipboardCheck,
  Users,
  Car,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckSquare,
  FileCheck,
  ScrollText,
  Gavel,
  BookMarked,
  BarChart
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { getCsrfToken } from '@/hooks/use-api'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import useSWR from 'swr'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Compliance Tab - Regulatory compliance and certifications
 */
const ComplianceTabContent = memo(function ComplianceTabContent() {
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingStats } = useSWR<any>(
    '/api/safety-training/compliance-stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: expiringTraining } = useSWR<any[]>(
    '/api/safety-training/expiring?days=30',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: documents } = useSWR<any[]>(
    '/api/documents?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )

  const complianceMetrics = Array.isArray(complianceDashboard?.metrics) ? complianceDashboard.metrics : []
  const complianceRate = complianceMetrics.length > 0
    ? Math.round(complianceMetrics.reduce((sum: number, metric: any) => sum + Number(metric.score || 0), 0) / complianceMetrics.length)
    : 0

  const expiringTrainingList = Array.isArray(expiringTraining) ? expiringTraining : []
  const documentsList = Array.isArray(documents) ? documents : []

  const expiringDocuments = useMemo(() => {
    const now = new Date()
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return documentsList.filter((doc: any) => {
      const expiry = doc.expires_at || doc.expiry_date
      if (!expiry) return false
      const date = new Date(expiry)
      return date >= now && date <= threshold
    })
  }, [documentsList])

  const expiringSoonCount = Number(trainingStats?.expiring_soon || 0) + expiringDocuments.length
  const activeCertifications = Number(trainingStats?.compliant_employees || 0)
  const nonCompliantCount = Number(trainingStats?.expired_certifications || 0)

  const renewals = useMemo(() => {
    const now = new Date()
    const items = [
      ...expiringTrainingList.map((record: any) => {
        const expiry = record.expiry_date ? new Date(record.expiry_date) : null
        const daysLeft = expiry ? Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
        return {
          item: `${record.employee_name || 'Driver'} - ${record.training_name || 'Training'}`,
          daysLeft
        }
      }),
      ...expiringDocuments.map((doc: any) => {
        const expiry = doc.expires_at || doc.expiry_date
        const expiryDate = expiry ? new Date(expiry) : null
        const daysLeft = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
        return {
          item: `${doc.file_name || doc.name || 'Document'} - Expiring`,
          daysLeft
        }
      })
    ]

    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 6)
  }, [expiringDocuments, expiringTrainingList])

  const categoryItems = useMemo(() => {
    return complianceMetrics.map((metric: any) => ({
      category: metric.category,
      status: metric.status,
      rate: Math.round(Number(metric.score || 0))
    }))
  }, [complianceMetrics])

  // Handler for scheduling renewals
  const handleScheduleRenewal = (itemName: string) => {
    toast.success(`Scheduling renewal for: ${itemName}`)
    // TODO: Open scheduling dialog or navigate to scheduling page
    logger.info('Schedule renewal clicked:', itemName)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Compliance Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Rate"
          value={complianceRate > 0 ? `${complianceRate}%` : "—"}
          icon={CheckCircle}
          description="Overall compliance"
        />
        <StatCard
          title="Active Certifications"
          value={activeCertifications || "—"}
          icon={Award}
          description="Valid certificates"
        />
        <StatCard
          title="Expiring Soon"
          value={expiringSoonCount || "—"}
          icon={Clock}
          description="Within 30 days"
        />
        <StatCard
          title="Non-Compliant"
          value={nonCompliantCount || "—"}
          icon={XCircle}
          description="Needs attention"
        />
      </motion.div>

      {/* Compliance Status by Category */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Compliance Status by Category
            </CardTitle>
            <CardDescription>Breakdown of compliance across different areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">No compliance metrics available.</div>
              ) : (
                categoryItems.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckSquare className={`h-5 w-5 ${
                        item.status === 'excellent' || item.status === 'good' ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.rate}% compliant</p>
                      </div>
                    </div>
                    <Badge variant={item.status === 'excellent' || item.status === 'good' ? 'default' : 'secondary'}>
                      {item.status === 'excellent' || item.status === 'good' ? 'Compliant' : 'Review Needed'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Renewals */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Renewals
            </CardTitle>
            <CardDescription>Certifications and licenses expiring soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {renewals.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming renewals.</div>
              ) : (
                renewals.map((renewal, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileCheck className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{renewal.item}</p>
                        <p className="text-sm text-muted-foreground">Expires in {renewal.daysLeft} days</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleScheduleRenewal(renewal.item)}>
                      Schedule
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Safety Tab - Safety metrics and incident management
 */
const SafetyTabContent = memo(function SafetyTabContent() {
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: safetyIncidents } = useSWR<any[]>(
    '/api/safety-incidents?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingStats } = useSWR<any>(
    '/api/safety-training/compliance-stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingCourses } = useSWR<any[]>(
    '/api/training/courses?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingProgress } = useSWR<any[]>(
    '/api/training/progress',
    fetcher,
    { shouldRetryOnError: false }
  )

  const incidents = Array.isArray(safetyIncidents) ? safetyIncidents : []
  const safetyMetric = Array.isArray(complianceDashboard?.metrics)
    ? complianceDashboard.metrics.find((metric: any) => (metric.category || '').toLowerCase().includes('safety'))
    : null

  const safetyScore = safetyMetric ? Math.round(Number(safetyMetric.score || 0)) : 0
  const latestIncidentDate = incidents
    .map((incident: any) => incident.incident_date || incident.created_at)
    .filter(Boolean)
    .map((value: string) => new Date(value))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]

  const daysSinceIncident = latestIncidentDate
    ? Math.max(0, Math.floor((Date.now() - latestIncidentDate.getTime()) / (1000 * 60 * 60 * 24)))
    : null

  const openIncidents = incidents.filter((incident: any) => {
    const status = (incident.status || '').toString().toLowerCase()
    return status && !['resolved', 'closed', 'completed'].includes(status)
  }).length

  const trainingCompletion = Number(trainingStats?.compliance_rate || 0)

  const incidentTrendData = useMemo(() => {
    const now = new Date()
    const months: { label: string; month: number; year: number }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ label: date.toLocaleString('default', { month: 'short' }), month: date.getMonth(), year: date.getFullYear() })
    }
    return months.map((item) => {
      const count = incidents.filter((incident: any) => {
        const date = incident.incident_date || incident.created_at
        if (!date) return false
        const incidentDate = new Date(date)
        return incidentDate.getMonth() === item.month && incidentDate.getFullYear() === item.year
      }).length
      return { name: item.label, month: item.label, incidents: count }
    })
  }, [incidents])

  const recentIncidents = incidents
    .slice()
    .sort((a: any, b: any) => new Date(b.incident_date || b.created_at).getTime() - new Date(a.incident_date || a.created_at).getTime())
    .slice(0, 5)

  const trainingProgressData = useMemo(() => {
    const courses = Array.isArray(trainingCourses) ? trainingCourses : []
    const progressRows = Array.isArray(trainingProgress) ? trainingProgress : []
    const progressByCourse = progressRows.reduce((acc: Record<string, { completed: number; total: number }>, row: any) => {
      const courseId = row.course_id
      if (!courseId) return acc
      if (!acc[courseId]) acc[courseId] = { completed: 0, total: 0 }
      acc[courseId].total += 1
      if (Number(row.progress) >= 100 || row.completed_modules?.length === row.total_modules?.length) {
        acc[courseId].completed += 1
      }
      return acc
    }, {})

    return courses.map((course: any) => {
      const stats = progressByCourse[course.id] || { completed: 0, total: 0 }
      return {
        course: course.title || 'Training Course',
        completed: stats.completed,
        total: stats.total || 0
      }
    }).filter((course: any) => course.total > 0)
  }, [trainingCourses, trainingProgress])

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Safety Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Safety Score"
          value={safetyScore > 0 ? `${safetyScore}` : "—"}
          icon={Shield}
          description="Fleet average"
        />
        <StatCard
          title="Days Since Incident"
          value={daysSinceIncident !== null ? daysSinceIncident : "—"}
          icon={Award}
          description="Accident-free streak"
        />
        <StatCard
          title="Open Incidents"
          value={openIncidents}
          icon={AlertTriangle}
          description="Under investigation"
        />
        <StatCard
          title="Training Completion"
          value={trainingCompletion > 0 ? `${trainingCompletion}%` : "—"}
          icon={BookOpen}
          description="Safety training"
        />
      </motion.div>

      {/* Incident Trends */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Incident Trends
            </CardTitle>
            <CardDescription>Safety incidents over time (trending down is good)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveLineChart
              title="Incident Trends"
              data={incidentTrendData}
              dataKeys={['incidents']}
              colors={['#ef4444']}
              height={300}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Incidents */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>Latest safety incidents and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentIncidents.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent incidents.</div>
              ) : (
                recentIncidents.map((incident: any) => {
                  const severity = (incident.severity || '').toString().toLowerCase()
                  const status = incident.status || 'Open'
                  return (
                    <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          severity === 'minor' || severity === 'low' ? 'text-yellow-500' :
                          severity === 'moderate' || severity === 'medium' ? 'text-orange-500' : 'text-red-500'
                        }`} />
                        <div>
                          <p className="font-semibold">{incident.incident_type || 'Incident'}</p>
                          <p className="text-sm text-muted-foreground">
                            {incident.vehicle_id ? `Vehicle ${incident.vehicle_id.slice(0, 8)}` : 'Vehicle'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={status === 'Resolved' || status === 'Closed' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Safety Training Progress */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Safety Training Progress
            </CardTitle>
            <CardDescription>Driver safety training completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingProgressData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No training progress available.</div>
              ) : (
                trainingProgressData.map((training: any) => (
                  <div key={training.course} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{training.course}</p>
                      <p className="text-sm text-muted-foreground">
                        {training.completed}/{training.total} ({Math.round((training.completed / training.total) * 100)}%)
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${training.total > 0 ? (training.completed / training.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Policies Tab - Policy management and enforcement
 */
const PoliciesTabContent = memo(function PoliciesTabContent() {
  const { data: policies } = useSWR<any[]>(
    '/api/policies?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: securityEvents } = useSWR<any[]>(
    '/api/security/events?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )

  const policyRows = Array.isArray(policies) ? policies : []
  const activePolicies = policyRows.filter((policy: any) => policy.is_active)
  const underReview = policyRows.filter((policy: any) => !policy.is_active)

  const complianceScore = Array.isArray(complianceDashboard?.metrics)
    ? Math.round(complianceDashboard.metrics.reduce((sum: number, metric: any) => sum + Number(metric.score || 0), 0) / complianceDashboard.metrics.length)
    : 0

  const policyViolations = (Array.isArray(securityEvents) ? securityEvents : []).filter((event: any) => {
    const type = (event.event_type || '').toString().toLowerCase()
    return type.includes('policy') || type.includes('violation')
  })

  const policyCategories = useMemo(() => {
    const categoryMap = new Map<string, number>()
    policyRows.forEach((policy: any) => {
      const category = policy.category || 'General'
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
    })
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      policies: count,
      adherence: complianceScore || 0
    }))
  }, [policyRows, complianceScore])

  // Handler for viewing policy categories
  const handleViewPolicy = (category: string) => {
    toast.success(`Opening policy details for: ${category}`)
    // TODO: Open policy details modal or navigate to policy page
    logger.info('View policy clicked:', category)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Policy Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Policies"
          value={activePolicies.length}
          icon={FileText}
          description="Currently enforced"
        />
        <StatCard
          title="Policy Adherence"
          value={complianceScore > 0 ? `${complianceScore}%` : "—"}
          icon={CheckCircle}
          description="Compliance rate"
        />
        <StatCard
          title="Under Review"
          value={underReview.length}
          icon={ScrollText}
          description="Pending approval"
        />
        <StatCard
          title="Violations"
          value={policyViolations.length}
          icon={Gavel}
          description="This month"
        />
      </motion.div>

      {/* Policy Categories */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5" />
              Policy Categories
            </CardTitle>
            <CardDescription>Fleet policies organized by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {policyCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground">No policy categories available.</div>
              ) : (
                policyCategories.map((item) => (
                  <div key={item.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.policies} policies · {item.adherence}% adherence
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleViewPolicy(item.category)}>
                      View
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Policy Violations */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Recent Policy Violations
            </CardTitle>
            <CardDescription>Latest policy violations and corrective actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {policyViolations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent policy violations.</div>
              ) : (
                policyViolations.slice(0, 5).map((violation: any) => (
                  <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-semibold">{violation.event_type || 'Policy Violation'}</p>
                        <p className="text-sm text-muted-foreground">{violation.message || 'Violation recorded'}</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Review</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Reporting Tab - Compliance and safety reporting
 */
const ReportingTabContent = memo(function ReportingTabContent() {
  const { data: reportTemplates } = useSWR<any[]>(
    '/api/reports/templates',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: reportHistory } = useSWR<any[]>(
    '/api/reports/history',
    fetcher,
    { shouldRetryOnError: false }
  )

  const templates = Array.isArray(reportTemplates) ? reportTemplates : []
  const history = Array.isArray(reportHistory) ? reportHistory : []

  const complianceTemplates = templates.filter((template: any) => {
    const domain = (template.domain || template.category || '').toString().toLowerCase()
    return domain.includes('compliance') || domain.includes('safety') || domain.includes('osha')
  })

  const lastGeneratedMap = useMemo(() => {
    const map = new Map<string, any>()
    history.forEach((item: any) => {
      if (!item.templateId) return
      if (!map.has(item.templateId)) {
        map.set(item.templateId, item)
      }
    })
    return map
  }, [history])

  // Handler for viewing reports
  const handleViewReport = (reportName: string, downloadUrl?: string) => {
    if (!downloadUrl) {
      toast.error('No download link available for this report')
      return
    }
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Opening report: ${reportName}`)
    logger.info('View report clicked:', reportName)
  }

  // Handler for generating reports
  const handleGenerateReport = async (reportId: string, reportName: string) => {
    try {
      const csrfToken = await getCsrfToken()
      const response = await fetch('/api/reports/execute', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        body: JSON.stringify({ reportId, filters: {} })
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}))
        throw new Error(errorPayload.error || 'Failed to generate report')
      }

      toast.success(`Generated report: ${reportName}`)
      logger.info('Generate report clicked:', reportName)
    } catch (error) {
      logger.error('Generate report failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    }
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance & Safety Reports
          </CardTitle>
          <CardDescription>Generate and view compliance and safety reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceTemplates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No compliance report templates available.</div>
            ) : (
              complianceTemplates.map((report: any) => {
                const lastGenerated = lastGeneratedMap.get(report.id)
                return (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{report.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.category || report.domain || 'Compliance'} · Last generated:{' '}
                          {lastGenerated?.generatedAt ? new Date(lastGenerated.generatedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReport(report.title, lastGenerated?.downloadUrl)}
                        disabled={!lastGenerated?.downloadUrl}
                      >
                        View
                      </Button>
                      <Button size="sm" onClick={() => handleGenerateReport(report.id, report.title)}>
                        Generate
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComplianceSafetyHub() {
  const [activeTab, setActiveTab] = useState('compliance')

  return (
    <HubPage
      title="Compliance & Safety"
      description="Comprehensive compliance monitoring, safety management, and policy enforcement"
      icon={<Shield className="h-6 w-6" />}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compliance" className="flex items-center gap-2" data-testid="hub-tab-compliance">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2" data-testid="hub-tab-safety">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Safety</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2" data-testid="hub-tab-policies">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2" data-testid="hub-tab-reports">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="compliance" className="mt-6">
                <ErrorBoundary>
                  <ComplianceTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="safety" className="mt-6">
                <ErrorBoundary>
                  <SafetyTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="policies" className="mt-6">
                <ErrorBoundary>
                  <PoliciesTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="reporting" className="mt-6">
                <ErrorBoundary>
                  <ReportingTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
