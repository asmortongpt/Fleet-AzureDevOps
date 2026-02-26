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
  BarChart,
  Plus,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  StatCard,
  RadialProgressChart,
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
// SHARED COMPONENTS
// ============================================================================

// KpiCard removed — using StatCard from @/components/visualizations for consistency

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Compliance Tab - Regulatory compliance and certifications
 */
const ComplianceTabContent = memo(function ComplianceTabContent() {
  const { push } = useDrilldown()
  const { drivers, vehicles, isLoading, error: fleetDataError } = useFleetData()
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )

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
        const rawVName = formatVehicleName(v as any)
        const vName = v.name || (rawVName !== 'Unknown Vehicle' ? rawVName : `Vehicle #${String(v.id).slice(0, 8)}`)
        items.push({
          item: `${vName} - Registration`,
          type: 'vehicle',
          daysLeft: daysUntil((v as any).registration_expiry)
        })
      }
    })

    return items.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 10)
  }, [drivers, vehicles, now])

  const handleScheduleRenewal = (itemName: string, daysLeft?: number) => {
    const parts = itemName.split(' - ')
    const entityName = parts[0] || itemName
    const renewalType = parts[1] || 'Renewal'
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + Math.max(0, (daysLeft ?? 14) - 7))
    const formattedDate = formatDate(targetDate)
    toast.success(`${renewalType} renewal scheduled for ${entityName} — target date: ${formattedDate}`)
    push({
      id: `renewal-${itemName}`,
      type: 'compliance-renewal',
      label: `Renew: ${entityName}`,
      data: { entityName, renewalType, item: itemName, scheduledDate: targetDate.toISOString() },
    })
  }

  // Extract dashboard metrics for radial charts (P0-2)
  const dashMetrics = useMemo(() => {
    if (!complianceDashboard) return null
    const metrics = complianceDashboard?.metrics
    if (!metrics) return null
    // metrics could be an object with named keys or an array
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

  const dashAlerts = useMemo(() => {
    if (!complianceDashboard) return []
    const alerts = complianceDashboard?.alerts || complianceDashboard?.data?.alerts
    return Array.isArray(alerts) ? alerts : []
  }, [complianceDashboard])

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

  // P0-1: Loading skeleton for Compliance tab
  if (isLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Compliance Rate"
          value={complianceStats.complianceRate != null ? `${complianceStats.complianceRate}%` : '\u2014'}
          icon={CheckCircle}
          description="All checks current"
        />
        <StatCard
          title="Active Certifications"
          value={complianceStats.activeCerts != null ? complianceStats.activeCerts : '\u2014'}
          icon={Award}
          description="Valid medical cards"
        />
        <StatCard
          title="Expiring Soon"
          value={complianceStats.expiringSoon != null ? complianceStats.expiringSoon : '\u2014'}
          icon={Clock}
          description="Within 30 days"
        />
        <StatCard
          title="Non-Compliant"
          value={complianceStats.nonCompliant != null ? complianceStats.nonCompliant : '\u2014'}
          icon={XCircle}
          description="Expired or overdue"
        />
      </div>

      {/* Main Content: Categories + Renewals */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Compliance Status by Category */}
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Compliance by Category</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
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
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <CheckCircle className="h-6 w-6 text-emerald-500" />
                <span className="text-sm text-muted-foreground">All certifications current. No renewals due within 60 days.</span>
              </div>
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
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => handleScheduleRenewal(renewal.item, renewal.daysLeft)}>
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

      {/* P0-2: Compliance Scores — radial gauge charts */}
      {dashMetrics && (dashMetrics.vehicleCompliance > 0 || dashMetrics.driverCompliance > 0 || dashMetrics.safetyCompliance > 0 || dashMetrics.regulatoryCompliance > 0) && (
        <div className="grid grid-cols-4 gap-1.5">
          <RadialProgressChart title="Vehicle" value={dashMetrics.vehicleCompliance} size="sm" height={120} />
          <RadialProgressChart title="Driver" value={dashMetrics.driverCompliance} size="sm" height={120} />
          <RadialProgressChart title="Safety" value={dashMetrics.safetyCompliance} size="sm" height={120} />
          <RadialProgressChart title="Regulatory" value={dashMetrics.regulatoryCompliance} size="sm" height={120} />
        </div>
      )}

      {/* P0-2: Alert banner from compliance dashboard */}
      {dashAlerts.length > 0 && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
            <h4 className="text-xs font-semibold text-yellow-400">Compliance Alerts</h4>
          </div>
          <div className="flex flex-col gap-1">
            {dashAlerts.slice(0, 3).map((alert: any, i: number) => (
              <p key={i} className="text-xs text-white/60">{alert.message || alert.description || String(alert)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

/**
 * Safety Tab - Safety metrics and incident management
 */
const SafetyTabContent = memo(function SafetyTabContent() {
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

  // P0-5: Properly unwrap safetyIncidents — API may return { data: [...] } envelope
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
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground">{fleetDataError instanceof Error ? fleetDataError.message : 'An unexpected error occurred'}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  // P0-1: Loading skeleton for Safety tab
  if (isLoading && safetyIncidentsLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    )
  }

  // Visible driver rankings capped to 5 (P0-6)
  const visibleDriverRankings = driverRankings.slice(0, 5)
  // Visible recent incidents capped to 5 (P0-6)
  const visibleRecentIncidents = recentIncidents.slice(0, 5)

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* P1-8: Report Incident action header */}
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

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Safety Score"
          value={safetyScoreStats.average > 0 ? String(safetyScoreStats.average) : '\u2014'}
          icon={Shield}
          description={`Avg across ${safetyScoreStats.count} drivers`}
        />
        <StatCard
          title="Days Since Last Report"
          value={daysSinceIncident !== null ? String(daysSinceIncident) : '\u2014'}
          icon={Award}
          description="Since last incident reported"
        />
        <StatCard
          title="Open Incidents"
          value={String(openIncidents)}
          icon={AlertTriangle}
          description="Under investigation"
        />
        <StatCard
          title="Training Completion"
          value={trainingCompletion > 0 ? `${trainingCompletion}%` : '\u2014'}
          icon={BookOpen}
          description="Safety training"
        />
      </div>

      {/* Main Content: Charts row */}
      <div className="grid grid-cols-2 gap-1.5">
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

          {/* Driver Safety Rankings — capped to 5 rows (P0-6) */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Driver Rankings</h3>
              <span className="text-xs text-muted-foreground ml-auto">Lowest first</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
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
                    {visibleDriverRankings.map((driver: any) => (
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
            {driverRankings.length > 5 && (
              <div className="pt-1.5 border-t border-white/[0.06] mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-6 text-xs text-muted-foreground hover:text-foreground"
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

          {/* Training Progress — moved alongside charts to reduce vertical height (P0-6) */}
          {trainingProgressData.length > 0 && (
            <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Training Progress</h3>
              </div>
              <div className="flex flex-col gap-1.5">
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

        {/* Right: Incident Trends + Recent Incidents */}
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

          {/* Recent Incidents — capped to 5 rows (P0-6) */}
          <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Recent Incidents</h3>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
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
                    {visibleRecentIncidents.map((incident: any) => {
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
            {recentIncidents.length > 5 && (
              <div className="pt-1.5 border-t border-white/[0.06] mt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full h-6 text-xs text-muted-foreground hover:text-foreground"
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

/**
 * Policies Tab - Policy management and enforcement
 */
const PoliciesTabContent = memo(function PoliciesTabContent() {
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

  // Unwrap policies from potential { data: [...] } envelope
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

  // Unwrap security events from potential { data: [...] } envelope
  const securityEventsList = useMemo(() => {
    if (Array.isArray(securityEvents)) return securityEvents
    if (securityEvents?.data && Array.isArray(securityEvents.data)) return securityEvents.data
    return []
  }, [securityEvents])

  const policyViolations = securityEventsList.filter((event: any) => {
    const type = (event.event_type || '').toString().toLowerCase()
    return type.includes('policy') || type.includes('violation')
  })

  // P1-9: Per-category adherence instead of identical global score
  const policyCategories = useMemo(() => {
    const categoryMap = new Map<string, { active: number; total: number }>()
    policyRows.forEach((policy: any) => {
      const category = policy.category || 'General'
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

  // P0-1: Loading skeleton for Policies tab
  if (policiesLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-md" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-48 rounded-md" />
          <Skeleton className="h-48 rounded-md" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Active Policies"
          value={String(activePolicies.length)}
          icon={FileText}
          description="Currently enforced"
        />
        <StatCard
          title="Policy Adherence"
          value={complianceScore > 0 ? `${complianceScore}%` : '\u2014'}
          icon={CheckCircle}
          description="Compliance rate"
        />
        <StatCard
          title="Under Review"
          value={String(underReview.length)}
          icon={ScrollText}
          description="Pending approval"
        />
        <StatCard
          title="Violations"
          value={String(policyViolations.length)}
          icon={Gavel}
          description="Total violations"
        />
      </div>

      {/* Main Content: Categories + Violations */}
      <div className="grid grid-cols-2 gap-1.5">
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
                    const violationStatus = (violation.status || '').toString().toLowerCase()
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

      {/* P0-3: Active Policies list to fill dead space */}
      {activePolicies.length > 0 && (
        <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Active Policies</h3>
            <span className="text-xs text-muted-foreground ml-auto">{activePolicies.length} policies</span>
          </div>
          <div className="max-h-[240px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#242424]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Policy Name</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {activePolicies.slice(0, 10).map((policy: any) => (
                  <tr
                    key={policy.id}
                    className="border-b border-white/[0.06] cursor-pointer hover:bg-white/[0.04]"
                    onClick={() => push({
                      id: policy.id,
                      type: 'policy',
                      label: policy.name || policy.title || 'Policy',
                      data: { policyId: policy.id, category: policy.category },
                    })}
                    role="button"
                    tabIndex={0}
                    aria-label={`View policy: ${policy.name || policy.title}`}
                  >
                    <td className="py-1.5 px-2 text-xs text-foreground font-medium">{policy.name || policy.title || '\u2014'}</td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground">{formatEnum(policy.category || 'General')}</td>
                    <td className="py-1.5 px-2 text-right">
                      <Badge variant="default">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activePolicies.length > 10 && (
            <div className="pt-1.5 border-t border-white/[0.06] mt-1">
              <Button
                size="sm"
                variant="ghost"
                className="w-full h-6 text-xs text-muted-foreground hover:text-foreground"
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

/**
 * Reporting Tab - Compliance and safety reporting
 */
const ReportingTabContent = memo(function ReportingTabContent() {
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

  // Unwrap from potential { data: [...] } envelope
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

  // P0-1: Loading skeleton for Reports tab
  if (templatesLoading && historyLoading) {
    return (
      <div className="space-y-1.5 p-2">
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
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

      {/* P0-4: Recent History section to fill dead space */}
      <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Recent History</h3>
          <span className="text-xs text-muted-foreground ml-auto">{history.length} reports</span>
        </div>
        <div className="max-h-[240px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No report history available</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#242424]">
                <tr className="border-b border-white/[0.08]">
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Report Name</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Generated</th>
                  <th className="py-1.5 px-2 text-left text-xs font-medium text-muted-foreground">Generated By</th>
                  <th className="py-1.5 px-2 text-right text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((entry: any, idx: number) => (
                  <tr key={entry.id || idx} className="border-b border-white/[0.06]">
                    <td className="py-1.5 px-2 text-xs text-foreground font-medium">
                      {entry.title || entry.reportName || entry.name || '\u2014'}
                    </td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground">
                      {formatDate(entry.generatedAt || entry.created_at || entry.timestamp)}
                    </td>
                    <td className="py-1.5 px-2 text-xs text-muted-foreground">
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
// MAIN COMPONENT
// ============================================================================

export default function ComplianceSafetyHub() {
  const [activeTab, setActiveTab] = useState('compliance')

  // P1-12: Badge counts for tabs
  const { drivers, vehicles, incidents: fleetIncidents, isLoading: fleetLoading } = useFleetData()
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

  const tabBadges = useMemo(() => {
    // Safety: open incidents count
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

    // Policies: violation count
    const secEventsList = Array.isArray(securityEventsRaw)
      ? securityEventsRaw
      : (securityEventsRaw?.data && Array.isArray(securityEventsRaw.data) ? securityEventsRaw.data : [])
    const violationCount = secEventsList.filter((event: any) => {
      const type = (event.event_type || '').toString().toLowerCase()
      return type.includes('policy') || type.includes('violation')
    }).length

    // Compliance: non-compliant + expiring soon
    const now = new Date()
    const msPerDay = 86400000
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const isExpired = (dateStr: string | undefined): boolean => {
      if (!dateStr) return true
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return true
      return date < now
    }
    const isWithinMonths = (dateStr: string | undefined, months: number): boolean => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return false
      const cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - months)
      return date >= cutoff
    }
    const isExpiringSoon = (dateStr: string | undefined, days: number): boolean => {
      if (!dateStr) return false
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return false
      const threshold = new Date(now.getTime() + days * msPerDay)
      return date >= now && date <= threshold
    }
    const nonCompliant = activeDrivers.filter((d: any) => {
      return isExpired(d.medical_card_expiry) || !isWithinMonths(d.drug_test_date, 12)
    }).length
    const driverExpiring = activeDrivers.filter((d: any) => isExpiringSoon(d.medical_card_expiry, 30)).length
    const vehicleExpiring = vehicles.filter((v: any) => isExpiringSoon((v as any).registration_expiry, 30)).length
    const complianceAlertCount = nonCompliant + driverExpiring + vehicleExpiring

    return { openCount, violationCount, complianceAlertCount }
  }, [safetyIncidentsRaw, fleetIncidents, securityEventsRaw, drivers, vehicles])

  return (
    <HubPage
      title="Compliance & Safety"
      description="Comprehensive compliance monitoring, safety management, and policy enforcement"
      icon={<Shield className="h-6 w-6" />}
      className="cta-hub"
    >
      <div className="flex flex-col h-full gap-1.5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="compliance" className="flex items-center gap-2" data-testid="hub-tab-compliance">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Compliance</span>
              {!fleetLoading && tabBadges.complianceAlertCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {tabBadges.complianceAlertCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="safety" className="flex items-center gap-2" data-testid="hub-tab-safety">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Safety</span>
              {!fleetLoading && tabBadges.openCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {tabBadges.openCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2" data-testid="hub-tab-policies">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Policies</span>
              {tabBadges.violationCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px] leading-none">
                  {tabBadges.violationCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reporting" className="flex items-center gap-2" data-testid="hub-tab-reports">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compliance" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <ComplianceTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="safety" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <SafetyTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="policies" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <PoliciesTabContent />
            </QueryErrorBoundary>
          </TabsContent>

          <TabsContent value="reporting" className="flex-1 min-h-0 overflow-y-auto">
            <QueryErrorBoundary>
              <ReportingTabContent />
            </QueryErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
