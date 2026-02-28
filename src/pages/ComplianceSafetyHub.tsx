/**
 * ComplianceSafetyHub - Urgency-Based Compliance Command Center
 *
 * Redesigned layout:
 * - Alert banner at top for critical/expiring items
 * - KanbanBoard with 4 urgency columns: Compliant | Expiring Soon | Non-Compliant | Overdue
 * - TimelineStrip below kanban showing compliance events
 * - Compact inline tabs for Safety, Policies, Reports sub-views
 *
 * Consolidates:
 * - ComplianceHub (regulatory compliance, certifications)
 * - SafetyHub (safety metrics, incidents)
 * - SafetyComplianceHub (combined safety + compliance)
 * - PolicyHub (policy management, enforcement)
 */

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
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileCheck,
  ScrollText,
  Gavel,
  BookMarked,
  BarChart,
  Plus,
  X,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HeroMetrics, type HeroMetric } from '@/components/ui/hero-metrics'
import { KanbanBoard } from '@/components/ui/kanban-board'
import type { KanbanColumn, KanbanItem } from '@/components/ui/kanban-board'
import { Skeleton } from '@/components/ui/skeleton'
import { TimelineStrip } from '@/components/ui/timeline-strip'
import type { TimelineEvent } from '@/components/ui/timeline-strip'
import {
  ResponsiveBarChart,
  ResponsiveLineChart,
} from '@/components/visualizations'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate } from '@/utils/format-helpers'
import logger from '@/utils/logger';
import { formatVehicleName } from '@/utils/vehicle-display';


const fetcher = apiFetcher

// ============================================================================
// SHARED DATE HELPERS
// ============================================================================

function createDateHelpers(now: Date) {
  const msPerDay = 86400000

  const isWithinMonths = (dateStr: string | undefined, months: number): boolean => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false
    const cutoff = new Date(now)
    cutoff.setMonth(cutoff.getMonth() - months)
    return date >= cutoff
  }

  const isExpired = (dateStr: string | undefined): boolean => {
    if (!dateStr) return true
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return true
    return date < now
  }

  const isExpiringSoon = (dateStr: string | undefined, days: number): boolean => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return false
    const threshold = new Date(now.getTime() + days * msPerDay)
    return date >= now && date <= threshold
  }

  const daysUntil = (dateStr: string): number => {
    const date = new Date(dateStr)
    return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / msPerDay))
  }

  const daysSince = (dateStr: string): number => {
    const date = new Date(dateStr)
    return Math.max(0, Math.floor((now.getTime() - date.getTime()) / msPerDay))
  }

  return { isWithinMonths, isExpired, isExpiringSoon, daysUntil, daysSince }
}

// ============================================================================
// SAFETY SUB-VIEW
// ============================================================================

const SafetySubView = memo(function SafetySubView() {
  const { push } = useDrilldown()
  const { drivers, incidents: fleetIncidents, isLoading, error: fleetDataError } = useFleetData()
  const { data: safetyIncidents, isLoading: safetyIncidentsLoading } = useSWR<any>(
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

  const incidents = useMemo(() => {
    const unwrapped = Array.isArray(safetyIncidents)
      ? safetyIncidents
      : (safetyIncidents?.data && Array.isArray(safetyIncidents.data) ? safetyIncidents.data : [])
    if (unwrapped.length > 0) return unwrapped
    return Array.isArray(fleetIncidents) ? fleetIncidents : []
  }, [safetyIncidents, fleetIncidents])

  const safetyScoreStats = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const driversWithScores = activeDrivers.filter((d: any) =>
      d.safety_score != null || d.safetyScore != null
    )
    if (driversWithScores.length === 0) return { average: 0, count: 0 }

    const total = driversWithScores.reduce((sum: number, d: any) => {
      const score = Number(d.safety_score ?? d.safetyScore ?? 0)
      return sum + score
    }, 0)

    return {
      average: Math.round(total / driversWithScores.length),
      count: driversWithScores.length
    }
  }, [drivers])

  const scoreDistribution = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const buckets = [
      { name: '90-100', range: [90, 100], count: 0 },
      { name: '80-89', range: [80, 89], count: 0 },
      { name: '70-79', range: [70, 79], count: 0 },
      { name: '60-69', range: [60, 69], count: 0 },
      { name: '<60', range: [0, 59], count: 0 }
    ]
    activeDrivers.forEach((d: any) => {
      const score = Number(d.safety_score ?? d.safetyScore ?? 0)
      if (score <= 0) return
      for (const bucket of buckets) {
        if (score >= bucket.range[0] && score <= bucket.range[1]) {
          bucket.count++
          break
        }
      }
    })
    return buckets.map((b) => ({ name: b.name, drivers: b.count }))
  }, [drivers])

  const driverRankings = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    return activeDrivers
      .filter((d: any) => (d.safety_score ?? d.safetyScore) != null)
      .map((d: any) => ({
        id: d.id,
        name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || '\u2014',
        safetyScore: Number(d.safety_score ?? d.safetyScore ?? 0),
        hosStatus: d.hos_status || '\u2014',
        incidents: Number(d.total_incidents ?? d.incidents ?? 0)
      }))
      .sort((a: any, b: any) => a.safetyScore - b.safetyScore)
  }, [drivers])

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
    const nowDate = new Date()
    const months: { label: string; month: number; year: number }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
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
    .slice(0, 8)

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

  if (fleetDataError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-400 font-medium">Failed to load data</p>
        <p className="text-sm text-white/40">{fleetDataError instanceof Error ? fleetDataError.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (isLoading && safetyIncidentsLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    )
  }

  const visibleDriverRankings = driverRankings.slice(0, 5)
  const visibleRecentIncidents = recentIncidents.slice(0, 5)

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* Report Incident action header */}
      <div className="flex items-center justify-between">
        <div />
        <Button
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => push({
            id: 'new-incident',
            type: 'incidents',
            label: 'Report Incident',
            data: {},
          })}
        >
          <Plus className="h-3.5 w-3.5" />
          Report Incident
        </Button>
      </div>

      {/* KPI Matrix */}
      <HeroMetrics
        className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
        metrics={[
          { label: 'Safety Score', value: safetyScoreStats.average > 0 ? String(safetyScoreStats.average) : '\u2014', icon: Shield, accent: 'emerald' },
          { label: 'Days Since Report', value: daysSinceIncident !== null ? String(daysSinceIncident) : '\u2014', icon: Award, accent: 'amber' },
          { label: 'Open Incidents', value: String(openIncidents), icon: AlertTriangle, accent: openIncidents > 0 ? 'rose' : 'emerald' },
          { label: 'Training', value: trainingCompletion > 0 ? `${trainingCompletion}%` : '\u2014', icon: BookOpen, accent: 'gray' },
        ]}
      />

      {/* Main Content: Charts row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Left: Score Distribution + Driver Rankings */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/80">Score Distribution</h3>
            </div>
            <ResponsiveBarChart
              title=""
              data={scoreDistribution}
              dataKeys={['drivers']}
              colors={['#10b981']}
              height={140}
              compact
            />
          </div>

          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/80">Driver Rankings</h3>
              <span className="text-xs text-white/35 ml-auto">Lowest first</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {driverRankings.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-white/40 text-sm">No records found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#1a1a1a]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Driver</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Score</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">HOS</th>
                      <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleDriverRankings.map((driver: any) => (
                      <tr
                        key={driver.id}
                        className="border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03]"
                        onClick={() => push({
                          id: driver.id,
                          type: 'driver',
                          label: driver.name,
                          data: { driverId: driver.id, safetyScore: driver.safetyScore, hosStatus: driver.hosStatus, incidents: driver.incidents },
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            push({
                              id: driver.id,
                              type: 'driver',
                              label: driver.name,
                              data: { driverId: driver.id, safetyScore: driver.safetyScore, hosStatus: driver.hosStatus, incidents: driver.incidents },
                            })
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for driver ${driver.name}`}
                      >
                        <td className="py-1.5 px-2 text-xs text-white/80">{driver.name}</td>
                        <td className="py-1.5 px-2">
                          <span className={`text-xs font-medium ${
                            driver.safetyScore >= 90 ? 'text-emerald-400' :
                            driver.safetyScore >= 70 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {driver.safetyScore}
                          </span>
                        </td>
                        <td className="py-1.5 px-2">
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {formatEnum(driver.hosStatus)}
                          </Badge>
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <span className={`text-xs ${driver.incidents > 0 ? 'text-red-400 font-medium' : 'text-white/80'}`}>
                            {driver.incidents}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {driverRankings.length > 5 && (
              <div className="pt-1.5 border-t border-white/[0.08] mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-6 text-xs text-white/40 hover:text-white/80"
                  onClick={() => push({
                    id: 'all-driver-rankings',
                    type: 'driver-rankings',
                    label: 'All Driver Rankings',
                    data: { rankings: driverRankings },
                  })}
                >
                  View All ({driverRankings.length})
                </Button>
              </div>
            )}
          </div>

          {trainingProgressData.length > 0 && (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/80">Training Progress</h3>
              </div>
              <div className="flex flex-col gap-3">
                {trainingProgressData.slice(0, 4).map((training: any) => {
                  const pct = training.total > 0 ? Math.round((training.completed / training.total) * 100) : 0
                  return (
                    <div key={training.course}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-white/80 truncate mr-2">{training.course}</span>
                        <span className="text-xs text-white/35 shrink-0">
                          {training.completed}/{training.total} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full">
                        <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Incident Trends + Recent Incidents */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/80">Incident Trends</h3>
            </div>
            <ResponsiveLineChart
              title=""
              data={incidentTrendData}
              dataKeys={['incidents']}
              colors={['#ef4444']}
              height={140}
              compact
            />
          </div>

          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-white/40" />
              <h3 className="text-sm font-semibold text-white/80">Recent Incidents</h3>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {recentIncidents.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-white/40 text-sm">No records found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#1a1a1a]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Type</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Severity</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Date</th>
                      <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecentIncidents.map((incident: any) => {
                      const severity = (incident.severity || '').toString().toLowerCase()
                      const status = incident.status || 'open'
                      const incidentLabel = incident.incident_type || 'Incident'
                      return (
                        <tr
                          key={incident.id}
                          className="border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03]"
                          onClick={() => push({
                            id: incident.id,
                            type: 'incident',
                            label: incidentLabel,
                            data: { incidentId: incident.id, severity, status, vehicleId: incident.vehicle_id },
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              push({
                                id: incident.id,
                                type: 'incident',
                                label: incidentLabel,
                                data: { incidentId: incident.id, severity, status, vehicleId: incident.vehicle_id },
                              })
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`View details for incident: ${incidentLabel}`}
                        >
                          <td className="py-1.5 px-2 text-xs text-white/80">{formatEnum(incidentLabel)}</td>
                          <td className="py-1.5 px-2">
                            <Badge variant={
                              severity === 'minor' || severity === 'low' ? 'secondary' :
                              severity === 'moderate' || severity === 'medium' ? 'outline' : 'destructive'
                            }>
                              {formatEnum(severity)}
                            </Badge>
                          </td>
                          <td className="py-1.5 px-2 text-xs text-white/40">
                            {formatDate(incident.incident_date || incident.created_at)}
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <Badge variant={['resolved', 'closed'].includes(status.toLowerCase()) ? 'default' : 'secondary'}>
                              {formatEnum(status)}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {recentIncidents.length > 5 && (
              <div className="pt-1.5 border-t border-white/[0.08] mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-6 text-xs text-white/40 hover:text-white/80"
                  onClick={() => push({
                    id: 'all-incidents',
                    type: 'incidents',
                    label: 'All Incidents',
                    data: { incidents: recentIncidents },
                  })}
                >
                  View All ({incidents.length})
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// POLICIES SUB-VIEW
// ============================================================================

const PoliciesSubView = memo(function PoliciesSubView() {
  const { push } = useDrilldown()
  const { data: policies, isLoading: policiesLoading } = useSWR<any>(
    '/api/policies?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: securityEvents } = useSWR<any>(
    '/api/security/events?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )

  const policyRows = useMemo(() => {
    if (Array.isArray(policies)) return policies
    if (policies?.data && Array.isArray(policies.data)) return policies.data
    return []
  }, [policies])
  const activePolicies = policyRows.filter((policy: any) => policy.is_active)
  const underReview = policyRows.filter((policy: any) => !policy.is_active)

  const complianceScore = Array.isArray(complianceDashboard?.metrics)
    ? Math.round(complianceDashboard.metrics.reduce((sum: number, metric: any) => sum + Number(metric.score || 0), 0) / complianceDashboard.metrics.length)
    : 0

  const securityEventsList = useMemo(() => {
    if (Array.isArray(securityEvents)) return securityEvents
    if (securityEvents?.data && Array.isArray(securityEvents.data)) return securityEvents.data
    return []
  }, [securityEvents])

  const policyViolations = securityEventsList.filter((event: any) => {
    const type = (event.event_type || '').toString().toLowerCase()
    return type.includes('policy') || type.includes('violation')
  })

  const policyCategories = useMemo(() => {
    const categoryMap = new Map<string, { active: number; total: number }>()
    policyRows.forEach((policy: any) => {
      const category = policy.category || policy.policy_type || 'General'
      const existing = categoryMap.get(category) || { active: 0, total: 0 }
      existing.total += 1
      if (policy.is_active) existing.active += 1
      categoryMap.set(category, existing)
    })
    return Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category,
      policies: stats.total,
      adherence: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0
    }))
  }, [policyRows])

  const handleViewPolicy = (category: string) => {
    toast.success(`Opening policy details for: ${category}`)
    logger.info('View policy clicked:', category)
    push({
      id: category,
      type: 'policy-category',
      label: category,
      data: { category },
    })
  }

  if (policiesLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      {/* KPI Matrix */}
      <HeroMetrics
        className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
        metrics={[
          { label: 'Active Policies', value: String(activePolicies.length), icon: FileText, accent: 'emerald' },
          { label: 'Adherence', value: complianceScore > 0 ? `${complianceScore}%` : '\u2014', icon: CheckCircle, accent: 'emerald' },
          { label: 'Under Review', value: String(underReview.length), icon: ScrollText, accent: 'amber' },
          { label: 'Violations', value: String(policyViolations.length), icon: Gavel, accent: policyViolations.length > 0 ? 'rose' : 'gray' },
        ]}
      />

      {/* Main Content: Categories + Violations */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/80">Policy Categories</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {policyCategories.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/40 text-sm">No records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Category</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Policies</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Adherence</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {policyCategories.map((item) => (
                    <tr key={item.category} className="border-b border-white/[0.08]">
                      <td className="py-1.5 px-2 text-xs text-white/80">{formatEnum(item.category)}</td>
                      <td className="py-1.5 px-2 text-right text-xs text-white/80">{item.policies}</td>
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12">
                            <div className="h-2 bg-white/10 rounded-full">
                              <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${item.adherence}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-white/80">{item.adherence}%</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleViewPolicy(item.category)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/80">Recent Violations</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {policyViolations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-white/40 text-sm">No records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#1a1a1a]">
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Violation</th>
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Details</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policyViolations.slice(0, 8).map((violation: any) => {
                    const violationLabel = violation.event_type || 'Policy Violation'
                    const violationStatus = (violation.status || '').toString().toLowerCase()
                    return (
                      <tr
                        key={violation.id}
                        className="border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03]"
                        onClick={() => push({
                          id: violation.id,
                          type: 'violation',
                          label: violationLabel,
                          data: { violationId: violation.id, eventType: violation.event_type, message: violation.message },
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            push({
                              id: violation.id,
                              type: 'violation',
                              label: violationLabel,
                              data: { violationId: violation.id, eventType: violation.event_type, message: violation.message },
                            })
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for violation: ${violationLabel}`}
                      >
                        <td className="py-1.5 px-2 text-xs text-white/80">{formatEnum(violationLabel)}</td>
                        <td className="py-1.5 px-2 text-xs text-white/40 truncate max-w-[200px]">
                          {violation.message || '\u2014'}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <Badge variant={violationStatus === 'resolved' ? 'default' : 'destructive'}>
                            {formatEnum(violationStatus || 'Review')}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Active Policies list */}
      {activePolicies.length > 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/80">Active Policies</h3>
            <span className="text-xs text-white/35 ml-auto">{activePolicies.length} policies</span>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Policy Name</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Category</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {activePolicies.slice(0, 10).map((policy: any) => (
                  <tr
                    key={policy.id}
                    className="border-b border-white/[0.08] cursor-pointer hover:bg-white/[0.03]"
                    onClick={() => push({
                      id: policy.id,
                      type: 'policy',
                      label: policy.name || policy.policy_name || policy.title || 'Policy',
                      data: { policyId: policy.id, category: policy.category },
                    })}
                    role="button"
                    tabIndex={0}
                    aria-label={`View policy: ${policy.name || policy.policy_name || policy.title}`}
                  >
                    <td className="py-1.5 px-2 text-xs text-white/80 font-medium">{policy.name || policy.policy_name || policy.title || '\u2014'}</td>
                    <td className="py-1.5 px-2 text-xs text-white/40">{formatEnum(policy.category || policy.policy_type || 'General')}</td>
                    <td className="py-1.5 px-2 text-right">
                      <Badge variant="default">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activePolicies.length > 10 && (
            <div className="pt-1.5 border-t border-white/[0.08] mt-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full h-6 text-xs text-white/40 hover:text-white/80"
                onClick={() => push({
                  id: 'all-policies',
                  type: 'policies',
                  label: 'All Policies',
                  data: { policies: activePolicies },
                })}
              >
                View All ({activePolicies.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// ============================================================================
// REPORTING SUB-VIEW
// ============================================================================

const ReportingSubView = memo(function ReportingSubView() {
  const { data: reportTemplates, isLoading: templatesLoading } = useSWR<any>(
    '/api/reports/templates',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: reportHistory, isLoading: historyLoading } = useSWR<any>(
    '/api/reports/history',
    fetcher,
    { shouldRetryOnError: false }
  )

  const templates = useMemo(() => {
    if (Array.isArray(reportTemplates)) return reportTemplates
    if (reportTemplates?.data && Array.isArray(reportTemplates.data)) return reportTemplates.data
    return []
  }, [reportTemplates])
  const history = useMemo(() => {
    if (Array.isArray(reportHistory)) return reportHistory
    if (reportHistory?.data && Array.isArray(reportHistory.data)) return reportHistory.data
    return []
  }, [reportHistory])

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

  const handleViewReport = (reportName: string, downloadUrl?: string) => {
    if (!downloadUrl) {
      toast.error('No download link available for this report')
      return
    }
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Opening report: ${reportName}`)
    logger.info('View report clicked:', reportName)
  }

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

  if (templatesLoading && historyLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto">
      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/80">Compliance & Safety Reports</h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {complianceTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">No records found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Report</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Category</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Last Generated</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complianceTemplates.map((report: any) => {
                  const lastGenerated = lastGeneratedMap.get(report.id)
                  return (
                    <tr key={report.id} className="border-b border-white/[0.08]">
                      <td className="py-1.5 px-2 text-xs text-white/80 font-medium">{report.title}</td>
                      <td className="py-1.5 px-2 text-xs text-white/40">
                        {formatEnum(report.category || report.domain || 'compliance')}
                      </td>
                      <td className="py-1.5 px-2 text-xs text-white/40">
                        {formatDate(lastGenerated?.generatedAt)}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => handleViewReport(report.title, lastGenerated?.downloadUrl)}
                            disabled={!lastGenerated?.downloadUrl}
                          >
                            View
                          </Button>
                          <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleGenerateReport(report.id, report.title)}>
                            Generate
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/80">Recent History</h3>
          <span className="text-xs text-white/35 ml-auto">{history.length} reports</span>
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">No report history available</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Report Name</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Generated</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-white/40">Generated By</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((entry: any, idx: number) => (
                  <tr key={entry.id || idx} className="border-b border-white/[0.08]">
                    <td className="py-1.5 px-2 text-xs text-white/80 font-medium">
                      {entry.title || entry.reportName || entry.name || '\u2014'}
                    </td>
                    <td className="py-1.5 px-2 text-xs text-white/40">
                      {formatDate(entry.generatedAt || entry.created_at || entry.timestamp)}
                    </td>
                    <td className="py-1.5 px-2 text-xs text-white/40">
                      {entry.generatedBy || entry.created_by || entry.user || '\u2014'}
                    </td>
                    <td className="py-1.5 px-2 text-right">
                      <Badge variant={
                        (entry.status || '').toLowerCase() === 'completed' || (entry.status || '').toLowerCase() === 'success'
                          ? 'default' : 'secondary'
                      }>
                        {formatEnum(entry.status || 'completed')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT — URGENCY-BASED COMMAND CENTER
// ============================================================================

export default function ComplianceSafetyHub() {
  const [activeTab, setActiveTab] = useState('compliance')
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [timelineCollapsed, setTimelineCollapsed] = useState(true)

  const { push } = useDrilldown()
  const { drivers, vehicles, incidents: fleetIncidents, isLoading: fleetLoading } = useFleetData()
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: safetyIncidentsRaw } = useSWR<any>(
    '/api/safety-incidents?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: securityEventsRaw } = useSWR<any>(
    '/api/security/events?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )

  const now = useMemo(() => new Date(), [])
  const dateHelpers = useMemo(() => createDateHelpers(now), [now])

  // ── Compliance stats (used for alert banner + compliance tab) ──
  const complianceStats = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const totalDrivers = activeDrivers.length

    const compliantDrivers = activeDrivers.filter((d: any) => {
      const drugTestCurrent = dateHelpers.isWithinMonths(d.last_drug_test_date, 12)
      const bgCheckCleared = (d.background_check_status || '').toLowerCase() === 'cleared'
      const mvrCurrent = (d.mvr_status || '').toLowerCase() === 'satisfactory'
      const medicalCardValid = !dateHelpers.isExpired(d.medical_card_expiration)
      return drugTestCurrent && bgCheckCleared && mvrCurrent && medicalCardValid
    })

    const complianceRate = totalDrivers > 0
      ? Math.round((compliantDrivers.length / totalDrivers) * 100)
      : 0

    const activeCerts = activeDrivers.filter((d: any) => !dateHelpers.isExpired(d.medical_card_expiration)).length

    const driverExpiring = activeDrivers.filter((d: any) =>
      dateHelpers.isExpiringSoon(d.medical_card_expiration, 30)
    ).length
    const vehicleExpiring = vehicles.filter((v: any) =>
      dateHelpers.isExpiringSoon(v.registration_expiry, 30)
    ).length
    const expiringSoon = driverExpiring + vehicleExpiring

    const nonCompliant = activeDrivers.filter((d: any) => {
      const medExpired = dateHelpers.isExpired(d.medical_card_expiration)
      const drugOverdue = !dateHelpers.isWithinMonths(d.last_drug_test_date, 12)
      return medExpired || drugOverdue
    }).length

    return { complianceRate, activeCerts, expiringSoon, nonCompliant }
  }, [drivers, vehicles, now, dateHelpers])

  // ── Expiring this week — drives alert banner urgency ──
  const expiringThisWeek = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    let count = 0
    activeDrivers.forEach((d: any) => {
      if (dateHelpers.isExpiringSoon(d.medical_card_expiration, 7)) count++
    })
    vehicles.forEach((v: any) => {
      if (dateHelpers.isExpiringSoon((v as any).registration_expiry, 7)) count++
    })
    return count
  }, [drivers, vehicles, now, dateHelpers])

  // ── KanbanBoard columns from real compliance data ──
  const kanbanColumns = useMemo((): KanbanColumn[] => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const compliantItems: KanbanItem[] = []
    const expiringItems: KanbanItem[] = []
    const nonCompliantItems: KanbanItem[] = []
    const overdueItems: KanbanItem[] = []

    activeDrivers.forEach((d: any) => {
      const driverName = d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown'
      const medExpiry = d.medical_card_expiration
      const drugTestDate = d.last_drug_test_date
      const drugTestCurrent = dateHelpers.isWithinMonths(drugTestDate, 12)
      const bgCleared = (d.background_check_status || '').toLowerCase() === 'cleared'
      const mvrOk = (d.mvr_status || '').toLowerCase() === 'satisfactory'
      const medValid = medExpiry && !dateHelpers.isExpired(medExpiry)

      if (medExpiry && dateHelpers.isExpired(medExpiry)) {
        const overdueDays = dateHelpers.daysSince(medExpiry)
        overdueItems.push({
          id: `driver-med-${d.id}`,
          title: driverName,
          subtitle: 'Medical Card',
          badge: `${overdueDays}d overdue`,
          badgeColor: '#dc2626',
          meta: `Expired ${formatDate(medExpiry)}`,
          onClick: () => push({
            id: d.id,
            type: 'driver',
            label: driverName,
            data: { driverId: d.id },
          }),
        })
      } else if (medExpiry && dateHelpers.isExpiringSoon(medExpiry, 30)) {
        const days = dateHelpers.daysUntil(medExpiry)
        expiringItems.push({
          id: `driver-med-${d.id}`,
          title: driverName,
          subtitle: 'Medical Card',
          badge: `${days}d left`,
          badgeColor: '#f59e0b',
          meta: `Expires ${formatDate(medExpiry)}`,
          onClick: () => push({
            id: d.id,
            type: 'driver',
            label: driverName,
            data: { driverId: d.id },
          }),
        })
      } else if (!drugTestCurrent) {
        nonCompliantItems.push({
          id: `driver-drug-${d.id}`,
          title: driverName,
          subtitle: 'Drug Test',
          badge: 'Overdue',
          badgeColor: '#ef4444',
          meta: drugTestDate ? `Last test: ${formatDate(drugTestDate)}` : 'No test on file',
          onClick: () => push({
            id: d.id,
            type: 'driver',
            label: driverName,
            data: { driverId: d.id },
          }),
        })
      } else if (!bgCleared || !mvrOk) {
        const issue = !bgCleared ? 'Background Check' : 'MVR Check'
        nonCompliantItems.push({
          id: `driver-check-${d.id}`,
          title: driverName,
          subtitle: issue,
          badge: 'Review',
          badgeColor: '#ef4444',
          meta: `Status: ${!bgCleared ? formatEnum(d.background_check_status || 'pending') : formatEnum(d.mvr_status || 'pending')}`,
          onClick: () => push({
            id: d.id,
            type: 'driver',
            label: driverName,
            data: { driverId: d.id },
          }),
        })
      } else if (medValid && drugTestCurrent && bgCleared && mvrOk) {
        compliantItems.push({
          id: `driver-ok-${d.id}`,
          title: driverName,
          subtitle: 'All checks current',
          badge: 'OK',
          badgeColor: '#10b981',
          meta: medExpiry ? `Med card: ${formatDate(medExpiry)}` : undefined,
          onClick: () => push({
            id: d.id,
            type: 'driver',
            label: driverName,
            data: { driverId: d.id },
          }),
        })
      }
    })

    // Vehicle registrations
    vehicles.forEach((v: any) => {
      const regExpiry = (v as any).registration_expiry
      if (!regExpiry) return
      const vName = v.name || formatVehicleName(v as any)
      if (vName === 'Unknown Vehicle') return

      if (dateHelpers.isExpired(regExpiry)) {
        const overdueDays = dateHelpers.daysSince(regExpiry)
        overdueItems.push({
          id: `vehicle-reg-${v.id}`,
          title: vName,
          subtitle: 'Registration',
          badge: `${overdueDays}d overdue`,
          badgeColor: '#dc2626',
          meta: `Expired ${formatDate(regExpiry)}`,
          onClick: () => push({
            id: String(v.id),
            type: 'vehicle',
            label: vName,
            data: { vehicleId: v.id },
          }),
        })
      } else if (dateHelpers.isExpiringSoon(regExpiry, 30)) {
        const days = dateHelpers.daysUntil(regExpiry)
        expiringItems.push({
          id: `vehicle-reg-${v.id}`,
          title: vName,
          subtitle: 'Registration',
          badge: `${days}d left`,
          badgeColor: '#f59e0b',
          meta: `Expires ${formatDate(regExpiry)}`,
          onClick: () => push({
            id: String(v.id),
            type: 'vehicle',
            label: vName,
            data: { vehicleId: v.id },
          }),
        })
      }
    })

    return [
      { id: 'compliant', title: 'Compliant', count: compliantItems.length, accent: '#10b981', items: compliantItems.slice(0, 8) },
      { id: 'expiring', title: 'Expiring Soon', count: expiringItems.length, accent: '#f59e0b', items: expiringItems.slice(0, 8) },
      { id: 'non-compliant', title: 'Non-Compliant', count: nonCompliantItems.length, accent: '#ef4444', items: nonCompliantItems.slice(0, 8) },
      { id: 'overdue', title: 'Overdue', count: overdueItems.length, accent: '#dc2626', items: overdueItems.slice(0, 8) },
    ]
  }, [drivers, vehicles, now, push, dateHelpers])

  // ── Timeline events from compliance data ──
  const timelineEvents = useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = []
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')

    activeDrivers.forEach((d: any) => {
      const driverName = d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown'
      if (d.medical_card_expiration && dateHelpers.isExpired(d.medical_card_expiration)) {
        events.push({
          id: `expired-med-${d.id}`,
          label: `${driverName} medical card expired`,
          time: formatDate(d.medical_card_expiration),
          type: 'compliance',
        })
      }
      if (d.medical_card_expiration && dateHelpers.isExpiringSoon(d.medical_card_expiration, 30)) {
        events.push({
          id: `expiring-med-${d.id}`,
          label: `${driverName} medical card expiring`,
          time: `${dateHelpers.daysUntil(d.medical_card_expiration)}d left`,
          type: 'alert',
        })
      }
      if (d.last_drug_test_date && dateHelpers.isWithinMonths(d.last_drug_test_date, 1)) {
        events.push({
          id: `drug-test-${d.id}`,
          label: `${driverName} drug test completed`,
          time: formatDate(d.last_drug_test_date),
          type: 'dispatch',
        })
      }
    })

    vehicles.forEach((v: any) => {
      const regExpiry = (v as any).registration_expiry
      if (!regExpiry) return
      const vName = v.name || formatVehicleName(v as any)
      if (dateHelpers.isExpiringSoon(regExpiry, 30)) {
        events.push({
          id: `expiring-reg-${v.id}`,
          label: `${vName} registration expiring`,
          time: `${dateHelpers.daysUntil(regExpiry)}d left`,
          type: 'alert',
        })
      }
    })

    return events.slice(0, 20)
  }, [drivers, vehicles, now, dateHelpers])

  // ── Dashboard metrics for radial display ──
  const dashMetrics = useMemo(() => {
    if (!complianceDashboard) return null
    const metrics = complianceDashboard?.metrics
    if (!metrics) return null
    if (Array.isArray(metrics)) {
      return {
        vehicleCompliance: Number(metrics.find((m: any) => m.name?.toLowerCase().includes('vehicle'))?.score || 0),
        driverCompliance: Number(metrics.find((m: any) => m.name?.toLowerCase().includes('driver'))?.score || 0),
        safetyCompliance: Number(metrics.find((m: any) => m.name?.toLowerCase().includes('safety'))?.score || 0),
        regulatoryCompliance: Number(metrics.find((m: any) => m.name?.toLowerCase().includes('regulatory'))?.score || 0),
      }
    }
    return {
      vehicleCompliance: Number(metrics.vehicleCompliance ?? metrics.vehicle_compliance ?? 0),
      driverCompliance: Number(metrics.driverCompliance ?? metrics.driver_compliance ?? 0),
      safetyCompliance: Number(metrics.safetyCompliance ?? metrics.safety_compliance ?? 0),
      regulatoryCompliance: Number(metrics.regulatoryCompliance ?? metrics.regulatory_compliance ?? 0),
    }
  }, [complianceDashboard])

  // ── Tab badge counts ──
  const tabBadges = useMemo(() => {
    const allSafetyIncidents = Array.isArray(safetyIncidentsRaw)
      ? safetyIncidentsRaw
      : (safetyIncidentsRaw?.data && Array.isArray(safetyIncidentsRaw.data) ? safetyIncidentsRaw.data : [])
    const incidentsToUse = allSafetyIncidents.length > 0
      ? allSafetyIncidents
      : (Array.isArray(fleetIncidents) ? fleetIncidents : [])
    const openCount = incidentsToUse.filter((inc: any) => {
      const status = (inc.status || '').toString().toLowerCase()
      return status && !['resolved', 'closed', 'completed'].includes(status)
    }).length

    const secEventsList = Array.isArray(securityEventsRaw)
      ? securityEventsRaw
      : (securityEventsRaw?.data && Array.isArray(securityEventsRaw.data) ? securityEventsRaw.data : [])
    const violationCount = secEventsList.filter((event: any) => {
      const type = (event.event_type || '').toString().toLowerCase()
      return type.includes('policy') || type.includes('violation')
    }).length

    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const nonCompliant = activeDrivers.filter((d: any) => {
      return dateHelpers.isExpired(d.medical_card_expiration) || !dateHelpers.isWithinMonths(d.last_drug_test_date, 12)
    }).length
    const driverExpiring = activeDrivers.filter((d: any) => dateHelpers.isExpiringSoon(d.medical_card_expiration, 30)).length
    const vehicleExpiring = vehicles.filter((v: any) => dateHelpers.isExpiringSoon((v as any).registration_expiry, 30)).length
    const complianceAlertCount = nonCompliant + driverExpiring + vehicleExpiring

    return { openCount, violationCount, complianceAlertCount }
  }, [safetyIncidentsRaw, fleetIncidents, securityEventsRaw, drivers, vehicles, dateHelpers])

  // ── Critical item count for the top-level alert ──
  const criticalCount = expiringThisWeek + complianceStats.nonCompliant
  const hasCritical = criticalCount > 0

  // ── Tab definitions ──
  const tabs = [
    { id: 'compliance', label: 'Compliance', icon: ClipboardCheck, badge: tabBadges.complianceAlertCount },
    { id: 'safety', label: 'Safety', icon: Shield, badge: tabBadges.openCount },
    { id: 'policies', label: 'Policies', icon: FileText, badge: tabBadges.violationCount },
    { id: 'reporting', label: 'Reports', icon: BarChart, badge: 0 },
  ] as const

  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden">
      {/* ── Alert Banner ── */}
      {!alertDismissed && hasCritical && (
        <div
          className="flex items-center justify-between px-5 py-2.5 shrink-0"
          style={{
            background: expiringThisWeek > 0
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(239, 68, 68, 0.12)',
            borderBottom: `1px solid ${expiringThisWeek > 0 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="h-4 w-4 shrink-0"
              style={{ color: expiringThisWeek > 0 ? '#f59e0b' : '#ef4444' }}
            />
            <span className="text-[13px] font-medium text-white/80">
              {expiringThisWeek > 0
                ? `${expiringThisWeek} certification${expiringThisWeek !== 1 ? 's' : ''} expiring this week`
                : `${complianceStats.nonCompliant} non-compliant item${complianceStats.nonCompliant !== 1 ? 's' : ''} require attention`
              }
            </span>
            {expiringThisWeek > 0 && complianceStats.nonCompliant > 0 && (
              <span className="text-[11px] text-white/40 ml-2">
                + {complianceStats.nonCompliant} non-compliant
              </span>
            )}
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="p-1 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/60 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Compact Inline Tab Bar ── */}
      <div
        className="flex items-center gap-1 px-5 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        role="tablist"
        aria-label="Compliance & Safety sections"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              data-testid={`hub-tab-${tab.id === 'reporting' ? 'reports' : tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors
                ${isActive
                  ? 'bg-white/[0.08] text-white/80'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {!fleetLoading && tab.badge > 0 && (
                <span
                  className="ml-1 text-[10px] font-bold px-1.5 py-0 rounded-full leading-[16px]"
                  style={{
                    background: tab.id === 'policies' ? 'rgba(255,255,255,0.08)' : 'rgba(239, 68, 68, 0.2)',
                    color: tab.id === 'policies' ? 'rgba(255,255,255,0.5)' : '#ef4444',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* ══ COMPLIANCE TAB — Kanban Command Center ══ */}
        {activeTab === 'compliance' && (
          <div id="panel-compliance" role="tabpanel" className="flex flex-col gap-3 p-4">
            {fleetLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 rounded-md" />
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[200px] rounded-md" />)}
                </div>
                <Skeleton className="h-10 rounded-md" />
              </div>
            ) : (
              <>
                {/* Summary KPI matrix */}
                <HeroMetrics
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
                  metrics={[
                    { label: 'Compliance Rate', value: `${complianceStats.complianceRate}%`, icon: CheckCircle, accent: 'emerald' },
                    { label: 'Active Certs', value: String(complianceStats.activeCerts), icon: Award, accent: 'emerald' },
                    { label: 'Expiring Soon', value: String(complianceStats.expiringSoon), icon: Clock, accent: complianceStats.expiringSoon > 0 ? 'amber' : 'gray' },
                    { label: 'Non-Compliant', value: String(complianceStats.nonCompliant), icon: XCircle, accent: complianceStats.nonCompliant > 0 ? 'rose' : 'gray' },
                  ]}
                />

                {/* Kanban Board — urgency columns */}
                <KanbanBoard columns={kanbanColumns} />

                {/* Compliance Scores — compact matrix */}
                {dashMetrics && (dashMetrics.vehicleCompliance > 0 || dashMetrics.driverCompliance > 0 || dashMetrics.safetyCompliance > 0 || dashMetrics.regulatoryCompliance > 0) && (
                  <HeroMetrics
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03]"
                    metrics={[
                      { label: 'Vehicle', value: `${dashMetrics.vehicleCompliance}%`, icon: Shield, accent: dashMetrics.vehicleCompliance >= 80 ? 'emerald' : dashMetrics.vehicleCompliance >= 60 ? 'amber' : 'rose' },
                      { label: 'Driver', value: `${dashMetrics.driverCompliance}%`, icon: Users, accent: dashMetrics.driverCompliance >= 80 ? 'emerald' : dashMetrics.driverCompliance >= 60 ? 'amber' : 'rose' },
                      { label: 'Safety', value: `${dashMetrics.safetyCompliance}%`, icon: Shield, accent: dashMetrics.safetyCompliance >= 80 ? 'emerald' : dashMetrics.safetyCompliance >= 60 ? 'amber' : 'rose' },
                      { label: 'Regulatory', value: `${dashMetrics.regulatoryCompliance}%`, icon: FileCheck, accent: dashMetrics.regulatoryCompliance >= 80 ? 'emerald' : dashMetrics.regulatoryCompliance >= 60 ? 'amber' : 'rose' },
                    ]}
                  />
                )}

                {/* Timeline Strip */}
                {timelineEvents.length > 0 && (
                  <TimelineStrip
                    events={timelineEvents}
                    collapsed={timelineCollapsed}
                    onToggle={() => setTimelineCollapsed(!timelineCollapsed)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ══ SAFETY TAB ══ */}
        {activeTab === 'safety' && (
          <div id="panel-safety" role="tabpanel" className="p-4">
            <QueryErrorBoundary>
              <SafetySubView />
            </QueryErrorBoundary>
          </div>
        )}

        {/* ══ POLICIES TAB ══ */}
        {activeTab === 'policies' && (
          <div id="panel-policies" role="tabpanel" className="p-4">
            <QueryErrorBoundary>
              <PoliciesSubView />
            </QueryErrorBoundary>
          </div>
        )}

        {/* ══ REPORTING TAB ══ */}
        {activeTab === 'reporting' && (
          <div id="panel-reporting" role="tabpanel" className="p-4">
            <QueryErrorBoundary>
              <ReportingSubView />
            </QueryErrorBoundary>
          </div>
        )}
      </div>
    </div>
  )
}
