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
import { useNavigate } from 'react-router-dom'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCsrfToken } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
} from '@/components/visualizations'


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
  const { drivers, vehicles } = useFleetData()

  const now = useMemo(() => new Date(), [])
  const msPerDay = 86400000

  // Helper: check if a date string is within N months ago (i.e. not overdue)
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

    // A driver is fully compliant when: drug test < 12 months, background check cleared,
    // MVR check current, and medical card not expired
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

    // Active certifications: drivers with valid medical card
    const activeCerts = activeDrivers.filter((d: any) => !isExpired(d.medical_card_expiry)).length

    // Expiring soon: medical cards within 30 days + vehicle registrations within 30 days
    const driverExpiring = activeDrivers.filter((d: any) =>
      isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const vehicleExpiring = vehicles.filter((v: any) =>
      isExpiringSoon(v.registration_expiry, 30)
    ).length
    const expiringSoon = driverExpiring + vehicleExpiring

    // Non-compliant: drivers with expired medical card or drug test overdue (> 12 months)
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

    // Medical Cards
    const medValid = activeDrivers.filter((d: any) =>
      d.medical_card_expiry && !isExpired(d.medical_card_expiry) && !isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const medExpiring = activeDrivers.filter((d: any) =>
      isExpiringSoon(d.medical_card_expiry, 30)
    ).length
    const medExpired = activeDrivers.filter((d: any) =>
      isExpired(d.medical_card_expiry)
    ).length

    // Drug Testing
    const drugCurrent = activeDrivers.filter((d: any) =>
      isWithinMonths(d.drug_test_date, 12)
    ).length
    const drugOverdue = activeDrivers.length - drugCurrent

    // Background Checks
    const bgCleared = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'cleared'
    ).length
    const bgPending = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'pending'
    ).length
    const bgFailed = activeDrivers.filter((d: any) =>
      (d.background_check_status || '').toLowerCase() === 'failed'
    ).length

    // MVR Checks
    const mvrSatisfactory = activeDrivers.filter((d: any) =>
      (d.mvr_check_status || '').toLowerCase() === 'satisfactory'
    ).length
    const mvrNeedsReview = activeDrivers.filter((d: any) => {
      const status = (d.mvr_check_status || '').toLowerCase()
      return status && status !== 'satisfactory'
    }).length

    // Vehicle Registration
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

    // Drivers with medical_card_expiry within 60 days
    activeDrivers.forEach((d: any) => {
      if (d.medical_card_expiry && isExpiringSoon(d.medical_card_expiry, 60)) {
        items.push({
          item: `${d.name || d.first_name + ' ' + d.last_name} - Medical Card`,
          type: 'driver',
          daysLeft: daysUntil(d.medical_card_expiry)
        })
      }
    })

    // Vehicles with registration_expiry within 60 days
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

  // Handler for scheduling renewals
  const handleScheduleRenewal = (itemName: string) => {
    toast.success(`Scheduling renewal for: ${itemName}`)
    logger.info('Schedule renewal clicked:', itemName)
  }

  return (
    <div className="space-y-6">
      {/* Compliance Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compliance Rate"
          value={complianceStats.complianceRate > 0 ? `${complianceStats.complianceRate}%` : "—"}
          icon={CheckCircle}
          description="Drivers with all checks current"
        />
        <StatCard
          title="Active Certifications"
          value={complianceStats.activeCerts || "—"}
          icon={Award}
          description="Valid medical cards"
        />
        <StatCard
          title="Expiring Soon"
          value={complianceStats.expiringSoon || "—"}
          icon={Clock}
          description="Within 30 days"
        />
        <StatCard
          title="Non-Compliant"
          value={complianceStats.nonCompliant || "—"}
          icon={XCircle}
          description="Expired or overdue"
        />
      </div>

      {/* Compliance Status by Category */}
      <div>
        <Section
          title="Compliance Status by Category"
          description="Breakdown of compliance across driver and vehicle areas"
          icon={<ClipboardCheck className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {categoryBreakdowns.map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.category} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${
                      item.status === 'good' ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="font-semibold">{item.category}</p>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{item.rate}%</span>
                    <Badge variant={item.status === 'good' ? 'default' : 'secondary'}>
                      {item.status === 'good' ? 'Compliant' : 'Review Needed'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      </div>

      {/* Upcoming Renewals */}
      <div>
        <Section
          title="Upcoming Renewals"
          description="Medical cards and vehicle registrations expiring within 60 days"
          icon={<Clock className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {renewals.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming renewals within 60 days.</div>
            ) : (
              renewals.map((renewal, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    {renewal.type === 'driver' ? (
                      <Users className={`h-5 w-5 ${renewal.daysLeft <= 14 ? 'text-red-500' : renewal.daysLeft <= 30 ? 'text-yellow-500' : 'text-blue-500'}`} />
                    ) : (
                      <Car className={`h-5 w-5 ${renewal.daysLeft <= 14 ? 'text-red-500' : renewal.daysLeft <= 30 ? 'text-yellow-500' : 'text-blue-500'}`} />
                    )}
                    <div>
                      <p className="font-semibold">{renewal.item}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires in {renewal.daysLeft} day{renewal.daysLeft !== 1 ? 's' : ''}
                        {renewal.daysLeft <= 14 && <span className="ml-2 text-red-500 font-medium">URGENT</span>}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleScheduleRenewal(renewal.item)}>
                    Schedule
                  </Button>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Safety Tab - Safety metrics and incident management
 */
const SafetyTabContent = memo(function SafetyTabContent() {
  const { drivers, incidents: fleetIncidents } = useFleetData()
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

  // Merge incident sources - prefer API safety incidents, supplement with fleet data
  const incidents = useMemo(() => {
    const apiIncidents = Array.isArray(safetyIncidents) ? safetyIncidents : []
    if (apiIncidents.length > 0) return apiIncidents
    return Array.isArray(fleetIncidents) ? fleetIncidents : []
  }, [safetyIncidents, fleetIncidents])

  // Compute safety score from real driver safety_score fields
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

  // Safety score distribution for bar chart
  const scoreDistribution = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const buckets = [
      { name: '90-100', range: [90, 100], count: 0 },
      { name: '80-89', range: [80, 89], count: 0 },
      { name: '70-79', range: [70, 79], count: 0 },
      { name: '60-69', range: [60, 69], count: 0 },
      { name: 'Below 60', range: [0, 59], count: 0 }
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

  // Driver Safety Rankings - sorted by safety score ascending (worst first for visibility)
  const driverRankings = useMemo(() => {
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    return activeDrivers
      .filter((d: any) => (d.safety_score ?? d.safetyScore) != null)
      .map((d: any) => ({
        id: d.id,
        name: d.name || `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown',
        safetyScore: Number(d.safety_score ?? d.safetyScore ?? 0),
        hosStatus: d.hos_status || 'Unknown',
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
    <div className="space-y-6">
      {/* Safety Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Safety Score"
          value={safetyScoreStats.average > 0 ? `${safetyScoreStats.average}` : "—"}
          icon={Shield}
          description={`Average across ${safetyScoreStats.count} drivers`}
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
      </div>

      {/* Driver Safety Score Distribution */}
      <div>
        <Section
          title="Driver Safety Score Distribution"
          description="Distribution of safety scores across active drivers"
          icon={<TrendingUp className="h-5 w-5" />}
        >
          <ResponsiveBarChart
            title="Safety Score Distribution"
            data={scoreDistribution}
            dataKeys={['drivers']}
            colors={['#3b82f6']}
            height={250}
          />
        </Section>
      </div>

      {/* Driver Safety Rankings */}
      <div>
        <Section
          title="Driver Safety Rankings"
          description="All drivers ranked by safety score (lowest first)"
          icon={<Users className="h-5 w-5" />}
        >
          {driverRankings.length === 0 ? (
            <div className="text-sm text-muted-foreground">No driver safety data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-3 px-4 text-left font-semibold">Driver</th>
                    <th className="py-3 px-4 text-left font-semibold">Safety Score</th>
                    <th className="py-3 px-4 text-left font-semibold">HOS Status</th>
                    <th className="py-3 px-4 text-left font-semibold">Incidents</th>
                  </tr>
                </thead>
                <tbody>
                  {driverRankings.map((driver: any) => (
                    <tr key={driver.id} className={`border-b border-border/30 ${driver.safetyScore < 70 ? 'bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{driver.name}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          driver.safetyScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                          driver.safetyScore >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {driver.safetyScore}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          (driver.hosStatus || '').toLowerCase() === 'driving' ? 'default' :
                          (driver.hosStatus || '').toLowerCase() === 'off_duty' || (driver.hosStatus || '').toLowerCase() === 'off-duty' ? 'secondary' :
                          'outline'
                        }>
                          {driver.hosStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={driver.incidents > 0 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                          {driver.incidents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {/* Incident Trends */}
      <div>
        <Section
          title="Incident Trends"
          description="Safety incidents over time (trending down is good)"
          icon={<TrendingDown className="h-5 w-5" />}
        >
          <ResponsiveLineChart
            title="Incident Trends"
            data={incidentTrendData}
            dataKeys={['incidents']}
            colors={['#ef4444']}
            height={300}
          />
        </Section>
      </div>

      {/* Recent Incidents */}
      <div>
        <Section
          title="Recent Incidents"
          description="Latest safety incidents and their status"
          icon={<AlertCircle className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {recentIncidents.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent incidents.</div>
            ) : (
              recentIncidents.map((incident: any) => {
                const severity = (incident.severity || '').toString().toLowerCase()
                const status = incident.status || 'Open'
                return (
                  <div key={incident.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        severity === 'minor' || severity === 'low' ? 'text-yellow-500' :
                        severity === 'moderate' || severity === 'medium' ? 'text-orange-500' : 'text-red-500'
                      }`} />
                      <div>
                        <p className="font-semibold">{incident.incident_type || 'Incident'}</p>
                        <p className="text-sm text-muted-foreground">
                          {incident.vehicle_id ? `Vehicle ${String(incident.vehicle_id).slice(0, 8)}` : 'Vehicle'}
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
        </Section>
      </div>

      {/* Safety Training Progress */}
      <div>
        <Section
          title="Safety Training Progress"
          description="Driver safety training completion status"
          icon={<BookOpen className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {trainingProgressData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No training progress available.</div>
            ) : (
              trainingProgressData.map((training: any) => (
                <div key={training.course} className="space-y-2 rounded-xl border border-border/60 bg-background/60 p-3">
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
        </Section>
      </div>
    </div>
  )
})

/**
 * Policies Tab - Policy management and enforcement
 */
const PoliciesTabContent = memo(function PoliciesTabContent() {
  const navigate = useNavigate()
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
    logger.info('View policy clicked:', category)
    navigate(`/compliance/policies/${encodeURIComponent(category)}`)
  }

  return (
    <div className="space-y-6">
      {/* Policy Statistics */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
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
      </div>

      {/* Policy Categories */}
      <div>
        <Section
          title="Policy Categories"
          description="Fleet policies organized by category"
          icon={<BookMarked className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {policyCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No policy categories available.</div>
            ) : (
              policyCategories.map((item) => (
                <div key={item.category} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
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
        </Section>
      </div>

      {/* Recent Policy Violations */}
      <div>
        <Section
          title="Recent Policy Violations"
          description="Latest policy violations and corrective actions"
          icon={<Gavel className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {policyViolations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent policy violations.</div>
            ) : (
              policyViolations.slice(0, 5).map((violation: any) => (
                <div key={violation.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
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
        </Section>
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
    <div className="space-y-6">
      <Section
        title="Compliance & Safety Reports"
        description="Generate and view compliance and safety reports"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {complianceTemplates.length === 0 ? (
            <div className="text-sm text-muted-foreground">No compliance report templates available.</div>
          ) : (
            complianceTemplates.map((report: any) => {
              const lastGenerated = lastGeneratedMap.get(report.id)
              return (
                <div key={report.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
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
      </Section>
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
        </Tabs>
      </div>
    </HubPage>
  )
}
