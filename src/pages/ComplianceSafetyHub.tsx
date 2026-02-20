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
  FileCheck,
  ScrollText,
  Gavel,
  BookMarked,
  BarChart
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { apiFetcher } from '@/lib/api-fetcher'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResponsiveBarChart,
  ResponsiveLineChart,
} from '@/components/visualizations'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { formatEnum } from '@/utils/format-enum'
import { formatDate } from '@/utils/format-helpers'
import logger from '@/utils/logger';


const fetcher = apiFetcher

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function KpiCard({ title, value, icon: Icon, description }: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
    </div>
  )
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Compliance Tab - Regulatory compliance and certifications
 */
const ComplianceTabContent = memo(function ComplianceTabContent() {
  const { push } = useDrilldown()
  const { drivers, vehicles, error: fleetDataError } = useFleetData()

  const now = useMemo(() => new Date(), [])
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

  // Compliance stats computed from real driver/vehicle data
  const complianceStats = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const totalDrivers = activeDrivers.length

    const compliantDrivers = activeDrivers.filter((d: any) => {
      const drugTestCurrent = isWithinMonths(d.drug_test_date, 12)
      const bgCheckCleared = (d.background_check_status || '').toLowerCase() === 'cleared'
      const mvrCurrent = (d.mvr_check_status || '').toLowerCase() === 'satisfactory'
      const medicalCardValid = !isExpired(d.medical_card_expiry)
      return drugTestCurrent && bgCheckCleared && mvrCurrent && medicalCardValid
    })

    const complianceRate = totalDrivers > 0
      ? Math.round((compliantDrivers.length / totalDrivers) * 100)
      : 0

    const activeCerts = activeDrivers.filter((d: any) => !isExpired(d.medical_card_expiry)).length

    const driverExpiring = activeDrivers.filter((d: any) =>
      isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const vehicleExpiring = vehicles.filter((v: any) =>
      isExpiringSoon(v.registration_expiry, 30)
    ).length
    const expiringSoon = driverExpiring + vehicleExpiring

    const nonCompliant = activeDrivers.filter((d: any) => {
      const medExpired = isExpired(d.medical_card_expiry)
      const drugOverdue = !isWithinMonths(d.drug_test_date, 12)
      return medExpired || drugOverdue
    }).length

    return { complianceRate, activeCerts, expiringSoon, nonCompliant }
  }, [drivers, vehicles, now])

  // Status by Category - real breakdowns
  const categoryBreakdowns = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')

    const medValid = activeDrivers.filter((d: any) =>
      d.medical_card_expiry && !isExpired(d.medical_card_expiry) && !isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const medExpiring = activeDrivers.filter((d: any) =>
      isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const medExpired = activeDrivers.filter((d: any) =>
      isExpired(d.medical_card_expiry)
    ).length

    const drugCurrent = activeDrivers.filter((d: any) =>
      isWithinMonths(d.drug_test_date, 12)
    ).length
    const drugOverdue = activeDrivers.length - drugCurrent

    const bgCleared = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'cleared'
    ).length
    const bgPending = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'pending'
    ).length
    const bgFailed = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'failed'
    ).length

    const mvrSatisfactory = activeDrivers.filter((d: any) =>
      (d.mvr_check_status || '').toLowerCase() === 'satisfactory'
    ).length
    const mvrNeedsReview = activeDrivers.filter((d: any) => {
      const status = (d.mvr_check_status || '').toLowerCase()
      return status && status !== 'satisfactory'
    }).length

    const regValid = vehicles.filter((v: any) =>
      (v as any).registration_expiry && !isExpired((v as any).registration_expiry) && !isExpiringSoon((v as any).registration_expiry, 30)
    ).length
    const regExpiring = vehicles.filter((v: any) =>
      isExpiringSoon((v as any).registration_expiry, 30)
    ).length
    const regExpired = vehicles.filter((v: any) =>
      isExpired((v as any).registration_expiry)
    ).length

    return [
      {
        category: 'Medical Cards',
        icon: Users,
        details: `${medValid} valid, ${medExpiring} expiring, ${medExpired} expired`,
        rate: activeDrivers.length > 0 ? Math.round((medValid / activeDrivers.length) * 100) : 0,
        status: medExpired === 0 ? 'good' : 'warning'
      },
      {
        category: 'Drug Testing',
        icon: ClipboardCheck,
        details: `${drugCurrent} current, ${drugOverdue} overdue`,
        rate: activeDrivers.length > 0 ? Math.round((drugCurrent / activeDrivers.length) * 100) : 0,
        status: drugOverdue === 0 ? 'good' : 'warning'
      },
      {
        category: 'Background Checks',
        icon: Shield,
        details: `${bgCleared} cleared, ${bgPending} pending, ${bgFailed} failed`,
        rate: activeDrivers.length > 0 ? Math.round((bgCleared / activeDrivers.length) * 100) : 0,
        status: bgFailed === 0 ? 'good' : 'warning'
      },
      {
        category: 'MVR Checks',
        icon: FileCheck,
        details: `${mvrSatisfactory} satisfactory, ${mvrNeedsReview} needs review`,
        rate: activeDrivers.length > 0 ? Math.round((mvrSatisfactory / activeDrivers.length) * 100) : 0,
        status: mvrNeedsReview === 0 ? 'good' : 'warning'
      },
      {
        category: 'Vehicle Registration',
        icon: Car,
        details: `${regValid} valid, ${regExpiring} expiring, ${regExpired} expired`,
        rate: vehicles.length > 0 ? Math.round((regValid / vehicles.length) * 100) : 0,
        status: regExpired === 0 ? 'good' : 'warning'
      }
    ]
  }, [drivers, vehicles, now])

  // Upcoming Renewals - real data sorted by urgency (within 60 days)
  const renewals = useMemo(() => {
    const items: { item: string; type: string; daysLeft: number }[] = []
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')

    activeDrivers.forEach((d: any) => {
      if (d.medical_card_expiry && isExpiringSoon(d.medical_card_expiry, 60)) {
        items.push({
          item: `${d.name || d.first_name + ' ' + d.last_name} - Medical Card`,
          type: 'driver',
          daysLeft: daysUntil(d.medical_card_expiry)
        })
      }
    })

    vehicles.forEach((v: any) => {
      if ((v as any).registration_expiry && isExpiringSoon((v as any).registration_expiry, 60)) {
        const vName = v.name || `${v.year} ${v.make} ${v.model}` || `Vehicle #${String(v.id).slice(0, 8)}`
        items.push({
          item: `${vName} - Registration`,
          type: 'vehicle',
          daysLeft: daysUntil((v as any).registration_expiry)
        })
      }
    })

    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10)
  }, [drivers, vehicles, now])

  const handleScheduleRenewal = (itemName: string) => {
    toast.success(`Scheduling renewal for: ${itemName}`)
    const parts = itemName.split(' - ')
    const entityName = parts[0] || itemName
    const renewalType = parts[1] || 'Renewal'
    push({
      id: `renewal-${itemName}`,
      type: 'compliance-renewal',
      label: `Renew: ${entityName}`,
      data: { entityName, renewalType, item: itemName },
    })
  }

  if (fleetDataError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground">{fleetDataError instanceof Error ? fleetDataError.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <KpiCard
          title="Compliance Rate"
          value={complianceStats.complianceRate > 0 ? `${complianceStats.complianceRate}%` : '\u2014'}
          icon={CheckCircle}
          description="All checks current"
        />
        <KpiCard
          title="Active Certifications"
          value={complianceStats.activeCerts || '\u2014'}
          icon={Award}
          description="Valid medical cards"
        />
        <KpiCard
          title="Expiring Soon"
          value={complianceStats.expiringSoon || '\u2014'}
          icon={Clock}
          description="Within 30 days"
        />
        <KpiCard
          title="Non-Compliant"
          value={complianceStats.nonCompliant || '\u2014'}
          icon={XCircle}
          description="Expired or overdue"
        />
      </div>

      {/* Main Content: Categories + Renewals */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Compliance Status by Category */}
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Compliance by Category</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {categoryBreakdowns.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              categoryBreakdowns.map((item) => {
                const IconComponent = item.icon
                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between rounded-md border border-white/[0.08] bg-[#242424] p-2 cursor-pointer hover:bg-white/[0.04]"
                    onClick={() => push({
                      id: item.category,
                      type: 'compliance-item',
                      label: item.category,
                      data: { category: item.category, rate: item.rate, status: item.status, details: item.details },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: item.category,
                          type: 'compliance-item',
                          label: item.category,
                          data: { category: item.category, rate: item.rate, status: item.status, details: item.details },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${item.category}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent className={`h-4 w-4 shrink-0 ${
                        item.status === 'good' ? 'text-emerald-500' : 'text-yellow-500'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.category}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16">
                        <div className="h-2 bg-white/10 rounded-full">
                          <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${item.rate}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-foreground w-8 text-right">{item.rate}%</span>
                      <Badge variant={item.status === 'good' ? 'default' : 'secondary'}>
                        {item.status === 'good' ? 'Compliant' : 'Review'}
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Upcoming Renewals</h3>
            <span className="text-xs text-muted-foreground ml-auto">Within 60 days</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renewals.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#242424]">
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Days Left</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {renewals.map((renewal, index) => (
                    <tr key={index} className="border-b border-white/[0.06]">
                      <td className="py-1.5 px-2 text-foreground text-xs">{renewal.item}</td>
                      <td className="py-1.5 px-2">
                        <Badge variant="outline">{formatEnum(renewal.type)}</Badge>
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <span className={`text-xs font-medium ${
                          renewal.daysLeft <= 14 ? 'text-red-400' : renewal.daysLeft <= 30 ? 'text-yellow-400' : 'text-foreground'
                        }`}>
                          {renewal.daysLeft}d
                        </span>
                        {renewal.daysLeft <= 14 && (
                          <Badge variant="destructive" className="ml-1.5 text-[10px] px-1 py-0">
                            {formatEnum('urgent')}
                          </Badge>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleScheduleRenewal(renewal.item)}>
                          Schedule
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

/**
 * Safety Tab - Safety metrics and incident management
 */
const SafetyTabContent = memo(function SafetyTabContent() {
  const { push } = useDrilldown()
  const { drivers, incidents: fleetIncidents, error: fleetDataError } = useFleetData()
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

  const incidents = useMemo(() => {
    const apiIncidents = Array.isArray(safetyIncidents) ? safetyIncidents : []
    if (apiIncidents.length > 0) return apiIncidents
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
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground">{fleetDataError instanceof Error ? fleetDataError.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <KpiCard
          title="Safety Score"
          value={safetyScoreStats.average > 0 ? String(safetyScoreStats.average) : '\u2014'}
          icon={Shield}
          description={`Avg across ${safetyScoreStats.count} drivers`}
        />
        <KpiCard
          title="Days Since Incident"
          value={daysSinceIncident !== null ? String(daysSinceIncident) : '\u2014'}
          icon={Award}
          description="Accident-free streak"
        />
        <KpiCard
          title="Open Incidents"
          value={String(openIncidents)}
          icon={AlertTriangle}
          description="Under investigation"
        />
        <KpiCard
          title="Training Completion"
          value={trainingCompletion > 0 ? `${trainingCompletion}%` : '\u2014'}
          icon={BookOpen}
          description="Safety training"
        />
      </div>

      {/* Main Content: Charts row */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left: Score Distribution + Driver Rankings */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* Score Distribution Chart */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Score Distribution</h3>
            </div>
            <ResponsiveBarChart
              title=""
              data={scoreDistribution}
              dataKeys={['drivers']}
              colors={['hsl(var(--primary))']}
              height={140}
              compact
            />
          </div>

          {/* Driver Safety Rankings */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Driver Rankings</h3>
              <span className="text-xs text-muted-foreground ml-auto">Lowest first</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {driverRankings.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#242424]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Driver</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Score</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">HOS</th>
                      <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Incidents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverRankings.map((driver: any) => (
                      <tr
                        key={driver.id}
                        className="border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.04]"
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
                        <td className="py-1.5 px-2 text-xs text-foreground">{driver.name}</td>
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
                          <span className={`text-xs ${driver.incidents > 0 ? 'text-red-400 font-medium' : 'text-foreground'}`}>
                            {driver.incidents}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right: Incident Trends + Recent Incidents + Training */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* Incident Trends */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Incident Trends</h3>
            </div>
            <ResponsiveLineChart
              title=""
              data={incidentTrendData}
              dataKeys={['incidents']}
              colors={['hsl(var(--destructive))']}
              height={140}
              compact
            />
          </div>

          {/* Recent Incidents */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Recent Incidents</h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentIncidents.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#242424]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Type</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Severity</th>
                      <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentIncidents.map((incident: any) => {
                      const severity = (incident.severity || '').toString().toLowerCase()
                      const status = incident.status || 'open'
                      const incidentLabel = incident.incident_type || 'Incident'
                      return (
                        <tr
                          key={incident.id}
                          className="border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.04]"
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
                          <td className="py-1.5 px-2 text-xs text-foreground">{formatEnum(incidentLabel)}</td>
                          <td className="py-1.5 px-2">
                            <Badge variant={
                              severity === 'minor' || severity === 'low' ? 'secondary' :
                              severity === 'moderate' || severity === 'medium' ? 'outline' : 'destructive'
                            }>
                              {formatEnum(severity)}
                            </Badge>
                          </td>
                          <td className="py-1.5 px-2 text-xs text-muted-foreground">
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
          </div>

          {/* Training Progress */}
          {trainingProgressData.length > 0 && (
            <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Training Progress</h3>
              </div>
              <div className="space-y-2">
                {trainingProgressData.slice(0, 4).map((training: any) => {
                  const pct = training.total > 0 ? Math.round((training.completed / training.total) * 100) : 0
                  return (
                    <div key={training.course}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-foreground truncate mr-2">{training.course}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
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
      </div>
    </div>
  )
})

/**
 * Policies Tab - Policy management and enforcement
 */
const PoliciesTabContent = memo(function PoliciesTabContent() {
  const { push } = useDrilldown()
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

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <KpiCard
          title="Active Policies"
          value={String(activePolicies.length)}
          icon={FileText}
          description="Currently enforced"
        />
        <KpiCard
          title="Policy Adherence"
          value={complianceScore > 0 ? `${complianceScore}%` : '\u2014'}
          icon={CheckCircle}
          description="Compliance rate"
        />
        <KpiCard
          title="Under Review"
          value={String(underReview.length)}
          icon={ScrollText}
          description="Pending approval"
        />
        <KpiCard
          title="Violations"
          value={String(policyViolations.length)}
          icon={Gavel}
          description="This month"
        />
      </div>

      {/* Main Content: Categories + Violations */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Policy Categories */}
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Policy Categories</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {policyCategories.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#242424]">
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Policies</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Adherence</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {policyCategories.map((item) => (
                    <tr key={item.category} className="border-b border-white/[0.06]">
                      <td className="py-1.5 px-2 text-xs text-foreground">{formatEnum(item.category)}</td>
                      <td className="py-1.5 px-2 text-right text-xs text-foreground">{item.policies}</td>
                      <td className="py-1.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12">
                            <div className="h-2 bg-white/10 rounded-full">
                              <div className="h-2 bg-emerald-500 rounded-full" style={{ width: `${item.adherence}%` }} />
                            </div>
                          </div>
                          <span className="text-xs text-foreground">{item.adherence}%</span>
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

        {/* Recent Policy Violations */}
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Recent Violations</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {policyViolations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#242424]">
                  <tr className="border-b border-white/[0.08]">
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Violation</th>
                    <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Details</th>
                    <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {policyViolations.slice(0, 8).map((violation: any) => {
                    const violationLabel = violation.event_type || 'Policy Violation'
                    return (
                      <tr
                        key={violation.id}
                        className="border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.04]"
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
                        <td className="py-1.5 px-2 text-xs text-foreground">{formatEnum(violationLabel)}</td>
                        <td className="py-1.5 px-2 text-xs text-muted-foreground truncate max-w-[200px]">
                          {violation.message || '\u2014'}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <Badge variant="destructive">Review</Badge>
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
    </div>
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

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Compliance & Safety Reports</h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {complianceTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#242424]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Report</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Last Generated</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complianceTemplates.map((report: any) => {
                  const lastGenerated = lastGeneratedMap.get(report.id)
                  return (
                    <tr key={report.id} className="border-b border-white/[0.06]">
                      <td className="py-1.5 px-2 text-xs text-foreground font-medium">{report.title}</td>
                      <td className="py-1.5 px-2 text-xs text-muted-foreground">
                        {formatEnum(report.category || report.domain || 'compliance')}
                      </td>
                      <td className="py-1.5 px-2 text-xs text-muted-foreground">
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
    </div>
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
      className="cta-hub"
    >
      <div className="flex flex-col h-full gap-2 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
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

          <TabsContent value="compliance" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <ComplianceTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="safety" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <SafetyTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="policies" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <PoliciesTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="reporting" className="flex-1 min-h-0 overflow-hidden">
            <QueryErrorBoundary>
              <ReportingTabContent />
            </QueryErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
