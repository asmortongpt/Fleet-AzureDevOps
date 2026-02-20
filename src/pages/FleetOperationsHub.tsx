/**
 * FleetOperationsHub - Consolidated Fleet Management Dashboard
 *
 * Consolidates:
 * - FleetHub (vehicles, tracking, telemetry)
 * - DriversHub (driver management, performance)
 * - AssetsHub (asset tracking, lifecycle)
 * - OperationsHub (dispatch, routing, fuel)
 * - MaintenanceHub (work orders, schedules, preventive maintenance)
 *
 * Features:
 * - Unified navigation with tabs
 * - Real-time data updates
 * - WCAG 2.1 AA accessibility
 * - Responsive design
 * - Performance optimized
 * - Comprehensive error handling
 */

import {
  Car,
  Users,
  Box,
  Radio as OperationsIcon,
  Wrench,
  MapPin,
  Gauge,
  Plug,
  BarChart,
  AlertTriangle,
  TrendingUp,
  Fuel,
  User as UserIcon,
  Shield,
  LineChart,
  Clock,
  Award,
  Map,
  CheckSquare,
  Calendar,
  Truck,
  Package,
  Plus,
  Route as RouteIcon,
  CheckCircle,
  ClipboardList,
  Wrench as Tool,
  DollarSign,
  LayoutDashboard,
  HeartPulse,
  Building2,
  Timer,
  ShieldAlert,
  Activity,
  UserCheck,
  BedDouble,
  Siren
} from 'lucide-react'
import { useState, Suspense, lazy, memo, useMemo } from 'react'

import useSWR from 'swr'

import { apiFetcher } from '@/lib/api-fetcher'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useAuth } from '@/contexts'
import { useReactiveAssetsData } from '@/hooks/use-reactive-assets-data'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
import { useReactiveFleetData } from '@/hooks/use-reactive-fleet-data'
import { useReactiveMaintenanceData } from '@/hooks/use-reactive-maintenance-data'
import { useReactiveOperationsData } from '@/hooks/use-reactive-operations-data'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format-helpers'


// ============================================================================
// LAZY-LOADED COMPONENTS
// ============================================================================

const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))


// ============================================================================
// HELPER: Flat progress bar replacing SVG circular gauges
// ============================================================================
function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 bg-white/10 rounded-full">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-foreground'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

function getBarColor(score: number) {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 70) return 'bg-foreground/60'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Overview Tab - Expanded Fleet KPIs Dashboard
 */
const OverviewTabContent = memo(function OverviewTabContent() {
  const { vehicles, metrics: fleetStats, isLoading: fleetLoading } = useReactiveFleetData()
  const { drivers, metrics: driverStats, isLoading: driversLoading } = useReactiveDriversData()
  const {
    workOrders,
    metrics: maintenanceMetrics,
    typeDistribution: woTypeDistribution,
    isLoading: maintenanceLoading,
  } = useReactiveMaintenanceData()

  const loading = fleetLoading || driversLoading || maintenanceLoading

  const fleetHealth = useMemo(() => {
    const healthScores = vehicles
      .map((v: any) => v.health_score ?? v.healthScore)
      .filter((s: any): s is number => typeof s === 'number' && !Number.isNaN(s))
    const avgScore = healthScores.length > 0
      ? Math.round(healthScores.reduce((a: number, b: number) => a + b, 0) / healthScores.length)
      : 0
    return {
      avgScore,
      excellent: healthScores.filter((s: number) => s >= 90).length,
      good: healthScores.filter((s: number) => s >= 70 && s < 90).length,
      fair: healthScores.filter((s: number) => s >= 50 && s < 70).length,
      poor: healthScores.filter((s: number) => s < 50).length,
      totalWithScores: healthScores.length,
    }
  }, [vehicles])

  const hosCompliance = useMemo(() => {
    const statuses = { driving: 0, on_duty: 0, off_duty: 0, sleeper: 0 }
    let totalHoursAvailable = 0
    drivers.forEach((d: any) => {
      const hosStatus = (d.hos_status ?? d.hosStatus ?? '').toLowerCase()
      if (hosStatus === 'driving') statuses.driving++
      else if (hosStatus === 'on_duty' || hosStatus === 'on-duty') statuses.on_duty++
      else if (hosStatus === 'off_duty' || hosStatus === 'off-duty') statuses.off_duty++
      else if (hosStatus === 'sleeper' || hosStatus === 'sleeper_berth') statuses.sleeper++
      else statuses.off_duty++
      totalHoursAvailable += Number(d.hours_available ?? d.hoursAvailable ?? d.hoursRemaining ?? 0) || 0
    })
    return { statuses, totalHoursAvailable: Math.round(totalHoursAvailable) }
  }, [drivers])

  const safetyMetrics = useMemo(() => {
    const scores = drivers
      .map((d: any) => d.safetyScore ?? d.safety_score ?? d.performanceRating ?? 0)
      .filter((s: number) => typeof s === 'number')
    const avgSafety = scores.length > 0
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0
    return { avgSafety, needsAttention: scores.filter((s: number) => s < 70).length, totalDrivers: scores.length }
  }, [drivers])

  const departmentUtil = useMemo(() => {
    const deptMap: Record<string, { count: number; uptimeTotal: number; uptimeCount: number }> = {}
    vehicles.forEach((v: any) => {
      const dept = v.department ?? v.dept ?? 'Unassigned'
      if (!deptMap[dept]) deptMap[dept] = { count: 0, uptimeTotal: 0, uptimeCount: 0 }
      deptMap[dept].count++
      const uptime = v.uptime ?? v.utilization ?? v.availability
      if (typeof uptime === 'number') { deptMap[dept].uptimeTotal += uptime; deptMap[dept].uptimeCount++ }
    })
    return Object.entries(deptMap)
      .map(([name, data]) => ({
        name, count: data.count,
        avgUptime: data.uptimeCount > 0 ? Math.round(data.uptimeTotal / data.uptimeCount) : null,
      }))
      .sort((a, b) => b.count - a.count)
  }, [vehicles])

  const maintenanceOverview = useMemo(() => {
    const totalDowntimeHours = workOrders.reduce((sum: number, wo: any) =>
      sum + (wo.actualHours || wo.estimatedHours || 0), 0)
    const emergencyCount = workOrders.filter(
      (wo: any) => wo.type === 'emergency' || wo.priority === 'urgent' || wo.priority === 'critical'
    ).length
    return { totalDowntimeHours: Math.round(totalDowntimeHours), emergencyCount }
  }, [workOrders])

  const complianceAlerts = useMemo(() => {
    const now = new Date()
    const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30)
    const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(now.getMonth() - 12)
    const expiringRegistrations = vehicles.filter((v: any) => {
      const expiry = v.registration_expiry ?? v.registrationExpiry ?? v.registration_expiry_date
      if (!expiry) return false
      try { const d = new Date(expiry); return d >= now && d <= thirtyDays } catch { return false }
    }).length
    const expiringMedicalCards = drivers.filter((d: any) => {
      const expiry = d.medical_card_expiry ?? d.medicalCardExpiry ?? d.medical_expiry ?? d.medical_card_expiry_date
      if (!expiry) return false
      try { const dt = new Date(expiry); return dt >= now && dt <= thirtyDays } catch { return false }
    }).length
    const overdueDrugTests = drivers.filter((d: any) => {
      const lastTest = d.drug_test ?? d.drugTest ?? d.last_drug_test ?? d.lastDrugTest ?? d.drug_test_date
      if (!lastTest) return true
      try { return new Date(lastTest) < twelveMonthsAgo } catch { return false }
    }).length
    return { expiringRegistrations, expiringMedicalCards, overdueDrugTests, totalAlerts: expiringRegistrations + expiringMedicalCards + overdueDrugTests }
  }, [vehicles, drivers])

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const departmentChartData = departmentUtil.slice(0, 8).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name, count: d.count, uptime: d.avgUptime ?? 0,
  }))
  const woTypeChartData = Object.entries(woTypeDistribution).map(([name, value]) => ({
    name: formatEnum(name), value: value as number,
    fill: name === 'preventive' ? '#10B981' : name === 'corrective' ? '#3B82F6' : name === 'emergency' ? '#EF4444' : name === 'inspection' ? '#F59E0B' : '#8B5CF6',
  }))
  const healthDistributionData = [
    { name: 'Excellent (90+)', value: fleetHealth.excellent, fill: '#10B981' },
    { name: 'Good (70-89)', value: fleetHealth.good, fill: '#3B82F6' },
    { name: 'Fair (50-69)', value: fleetHealth.fair, fill: '#F59E0B' },
    { name: 'Poor (<50)', value: fleetHealth.poor, fill: '#EF4444' },
  ].filter(d => d.value > 0)
  const hosChartData = [
    { name: 'Driving', value: hosCompliance.statuses.driving, fill: '#10B981' },
    { name: 'On Duty', value: hosCompliance.statuses.on_duty, fill: '#3B82F6' },
    { name: 'Off Duty', value: hosCompliance.statuses.off_duty, fill: '#94A3B8' },
    { name: 'Sleeper', value: hosCompliance.statuses.sleeper, fill: '#8B5CF6' },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* ROW 1: TOP-LEVEL KPI SUMMARY */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard title="Fleet Health Score" value={fleetHealth.avgScore > 0 ? fleetHealth.avgScore : '—'} icon={HeartPulse}
          description={`${fleetHealth.totalWithScores} vehicles scored`}
          trend={fleetHealth.avgScore >= 80 ? 'up' : fleetHealth.avgScore >= 60 ? 'neutral' : 'down'} />
        <StatCard title="Avg Safety Score" value={safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : '—'} icon={Shield}
          description={`${safetyMetrics.needsAttention} drivers need attention`}
          trend={safetyMetrics.avgSafety >= 80 ? 'up' : safetyMetrics.avgSafety >= 60 ? 'neutral' : 'down'} />
        <StatCard title="Open Work Orders" value={maintenanceMetrics?.totalWorkOrders ?? 0} icon={ClipboardList}
          description={`${maintenanceOverview.emergencyCount} emergency`}
          trend={maintenanceOverview.emergencyCount > 3 ? 'down' : 'neutral'} />
        <StatCard title="Compliance Alerts" value={complianceAlerts.totalAlerts} icon={ShieldAlert}
          description="Items requiring attention"
          trend={complianceAlerts.totalAlerts > 5 ? 'down' : complianceAlerts.totalAlerts > 0 ? 'neutral' : 'up'} />
      </div>

      {/* ROW 2: FLEET HEALTH + HOS COMPLIANCE */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-3 gap-1.5 overflow-hidden">
        <Section title="Fleet Health Overview" description="Vehicle health score distribution" icon={<HeartPulse className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className={`text-2xl font-bold ${getScoreColor(fleetHealth.avgScore)}`}>
                  {fleetHealth.avgScore > 0 ? fleetHealth.avgScore : '--'}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ 100</span>
              </div>
              <div className="flex-1">
                <ProgressBar value={fleetHealth.avgScore} color={getBarColor(fleetHealth.avgScore)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{fleetHealth.totalWithScores} of {vehicles.length} vehicles with scores</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Excellent', count: fleetHealth.excellent, color: 'text-emerald-400' },
                { label: 'Good', count: fleetHealth.good, color: 'text-foreground' },
                { label: 'Fair', count: fleetHealth.fair, color: 'text-amber-400' },
                { label: 'Poor', count: fleetHealth.poor, color: 'text-rose-400' },
              ].map(item => (
                <div key={item.label} className="text-center rounded border border-white/[0.08] bg-[#242424] p-1.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
            {healthDistributionData.length > 0 && (
              <ResponsivePieChart title="Health Distribution" data={healthDistributionData} height={140} innerRadius={35} showPercentages compact />
            )}
          </div>
        </Section>

        <Section title="HOS Compliance" description="Hours of Service status" icon={<Timer className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Driving', value: hosCompliance.statuses.driving, icon: Activity },
                { label: 'On Duty', value: hosCompliance.statuses.on_duty, icon: UserCheck },
                { label: 'Off Duty', value: hosCompliance.statuses.off_duty, icon: Clock },
                { label: 'Sleeper', value: hosCompliance.statuses.sleeper, icon: BedDouble },
              ].map(item => (
                <div key={item.label} className="rounded border border-white/[0.08] bg-[#242424] p-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded border border-white/[0.08] bg-[#242424] p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Total Hours Available</p>
                  <p className="text-[10px] text-muted-foreground">Across all active drivers</p>
                </div>
                <p className="text-lg font-bold text-foreground">{formatNumber(hosCompliance.totalHoursAvailable)}h</p>
              </div>
            </div>
            {hosChartData.length > 0 && (
              <ResponsivePieChart title="HOS Status Distribution" data={hosChartData} height={140} innerRadius={35} showPercentages compact />
            )}
          </div>
        </Section>

        {/* ROW 3: SAFETY METRICS + DEPARTMENT UTILIZATION */}
        <Section title="Safety Metrics" description="Driver safety scoring" icon={<Shield className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className={`text-2xl font-bold ${getScoreColor(safetyMetrics.avgSafety)}`}>
                  {safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : '--'}
                </span>
                <span className="text-xs text-muted-foreground ml-1">/ 100</span>
              </div>
              <div className="flex-1">
                <ProgressBar value={safetyMetrics.avgSafety} color={getBarColor(safetyMetrics.avgSafety)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Across {safetyMetrics.totalDrivers} drivers</p>
            {safetyMetrics.needsAttention > 0 && (
              <Alert variant="destructive" className="border-rose-800/40">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">{safetyMetrics.needsAttention} driver{safetyMetrics.needsAttention !== 1 ? 's' : ''}</span> with safety score below 70 -- requires review
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Excellent', color: 'text-emerald-400', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) >= 90).length },
                { label: 'Good', color: 'text-foreground', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 70 && s < 90 }).length },
                { label: 'Fair', color: 'text-amber-400', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 50 && s < 70 }).length },
                { label: 'Poor', color: 'text-rose-400', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) < 50).length },
              ].map(item => (
                <div key={item.label} className="text-center rounded border border-white/[0.08] bg-[#242424] p-1.5">
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Department Utilization" description="Vehicle count and uptime by department" icon={<Building2 className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            {departmentUtil.length > 0 ? (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                  {departmentUtil.slice(0, 6).map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium text-foreground">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-foreground">{dept.count}</p>
                          <p className="text-[10px] text-muted-foreground">vehicles</p>
                        </div>
                        {dept.avgUptime !== null && (
                          <div className="text-right">
                            <p className="text-xs font-semibold text-foreground">{dept.avgUptime}%</p>
                            <p className="text-[10px] text-muted-foreground">uptime</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {departmentChartData.length > 0 && (
                  <ResponsiveBarChart title="Vehicles by Department" data={departmentChartData} dataKey="count" height={140} showValues compact />
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No department data available</div>
            )}
          </div>
        </Section>

        {/* ROW 4: MAINTENANCE OVERVIEW + COMPLIANCE ALERTS */}
        <Section title="Maintenance Overview" description="Work orders, downtime, and categories" icon={<Wrench className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Total WOs</p>
                <p className="text-lg font-bold text-foreground">{maintenanceMetrics?.totalWorkOrders ?? 0}</p>
              </div>
              <div className="rounded border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Downtime</p>
                <p className="text-lg font-bold text-foreground">{maintenanceOverview.totalDowntimeHours}h</p>
              </div>
              <div className="rounded border border-white/[0.08] bg-[#242424] p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Emergency</p>
                <p className="text-lg font-bold text-rose-400">{maintenanceOverview.emergencyCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'In Progress', value: maintenanceMetrics?.inProgress ?? 0 },
                { label: 'Pending', value: maintenanceMetrics?.pendingOrders ?? 0 },
                { label: 'Parts Waiting', value: maintenanceMetrics?.partsWaiting ?? 0 },
                { label: 'Completed Today', value: maintenanceMetrics?.completedToday ?? 0 },
              ].map(item => (
                <div key={item.label} className="rounded border border-white/[0.08] bg-[#242424] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-foreground">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            {woTypeChartData.length > 0 && (
              <ResponsivePieChart title="Work Orders by Category" data={woTypeChartData} height={140} innerRadius={35} showPercentages compact />
            )}
          </div>
        </Section>

        <Section title="Compliance Alerts" description="Expiring certifications and overdue items" icon={<Siren className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            {complianceAlerts.totalAlerts === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-foreground">All Clear</p>
                <p className="text-xs text-muted-foreground">No compliance alerts at this time</p>
              </div>
            ) : (
              <>
                {[
                  { icon: Car, title: 'Registration Expiry', desc: 'Vehicles expiring within 30 days', count: complianceAlerts.expiringRegistrations, severity: 'amber' as const },
                  { icon: UserIcon, title: 'Medical Card Expiry', desc: 'Drivers expiring within 30 days', count: complianceAlerts.expiringMedicalCards, severity: 'amber' as const },
                  { icon: ShieldAlert, title: 'Drug Test Overdue', desc: 'Last test over 12 months ago', count: complianceAlerts.overdueDrugTests, severity: 'red' as const },
                ].map(alert => (
                  <div key={alert.title} className={`rounded border p-3 ${
                    alert.count > 0
                      ? alert.severity === 'red'
                        ? 'border-rose-800/40 bg-rose-950/20'
                        : 'border-amber-800/40 bg-amber-950/20'
                      : 'border-white/[0.08] bg-[#242424]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <alert.icon className={`h-4 w-4 ${
                          alert.count > 0
                            ? alert.severity === 'red' ? 'text-rose-400' : 'text-amber-400'
                            : 'text-muted-foreground'
                        }`} />
                        <div>
                          <p className="text-xs font-medium text-foreground">{alert.title}</p>
                          <p className="text-[10px] text-muted-foreground">{alert.desc}</p>
                        </div>
                      </div>
                      <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'}>{alert.count}</Badge>
                    </div>
                  </div>
                ))}
                <div className="rounded border border-white/[0.08] bg-[#242424] p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-foreground">Total Compliance Issues</p>
                    <Badge variant={complianceAlerts.totalAlerts > 5 ? 'destructive' : 'secondary'}>
                      {complianceAlerts.totalAlerts}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Fleet Tab - Vehicle tracking and telemetry
 */
const FleetTabContent = memo(function FleetTabContent() {
  const { vehicles, metrics: stats, statusDistribution, isLoading: loading, error } = useReactiveFleetData()
  const { user } = useAuth()

  const safeStats = stats || {
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    idleVehicles: 0,
    averageFuelLevel: 0,
    totalMileage: 0
  }

  const avgHealthScore = useMemo(() => {
    const vehiclesWithHealth = vehicles.filter((v: any) => v.health_score != null)
    if (vehiclesWithHealth.length === 0) return null
    const total = vehiclesWithHealth.reduce((sum: number, v: any) => sum + Number(v.health_score), 0)
    return Math.round(total / vehiclesWithHealth.length)
  }, [vehicles])

  const statusBreakdownText = useMemo(() => {
    if (statusDistribution.length === 0) return ''
    return statusDistribution.map(s => `${s.name}: ${s.value}`).join(' | ')
  }, [statusDistribution])

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-1.5">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* Fleet Statistics */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Total Vehicles"
          value={safeStats.totalVehicles}
          icon={Car}
          description={statusBreakdownText || 'Active fleet count'}
        />
        <StatCard
          title="Active Vehicles"
          value={safeStats.activeVehicles}
          icon={Gauge}
          description="Currently in use"
        />
        <StatCard
          title="Fleet Health"
          value={avgHealthScore != null ? `${avgHealthScore}%` : '—'}
          icon={HeartPulse}
          trend={avgHealthScore != null ? (avgHealthScore >= 80 ? 'up' : avgHealthScore >= 60 ? 'neutral' : 'down') : 'neutral'}
          description="Avg health score"
        />
        <StatCard
          title="Avg Fuel Level"
          value={`${(safeStats.averageFuelLevel || 0).toFixed(1)}%`}
          icon={Fuel}
          description="Fleet average"
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
        <Section
          title="Live Fleet Tracking"
          description="Real-time vehicle locations and status"
          icon={<MapPin className="h-4 w-4" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <LiveFleetDashboard />
            </Suspense>
          </ErrorBoundary>
        </Section>

        <Section
          title="Vehicle Telemetry"
          description="Performance metrics and diagnostics"
          icon={<Gauge className="h-4 w-4" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-48" />}>
              <VehicleTelemetry />
            </Suspense>
          </ErrorBoundary>
        </Section>

        <Section
          title="Virtual Garage"
          description="3D vehicle models and inventory"
          icon={<Car className="h-4 w-4" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <VirtualGarage />
            </Suspense>
          </ErrorBoundary>
        </Section>

        {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'SuperAdmin') && (
          <Section
            title="EV Charging Management"
            description="Electric vehicle charging stations and schedules"
            icon={<Plug className="h-4 w-4" />}
          >
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-48" />}>
                <EVChargingManagement />
              </Suspense>
            </ErrorBoundary>
          </Section>
        )}
      </div>
    </div>
  )
})

/**
 * Drivers Tab - Driver management and performance
 */
const DriversTabContent = memo(function DriversTabContent() {
  const { drivers, performanceTrend, metrics: stats, isLoading: loading, error } = useReactiveDriversData()
  const { push } = useDrilldown()

  const safeStats = stats || {
    totalDrivers: 0,
    activeDrivers: 0,
    onLeave: 0,
    suspended: 0,
    avgSafetyScore: 0,
    avgPerformance: 0,
    activeAssignments: 0,
    totalViolations: 0
  }

  const computedAvgSafetyScore = useMemo(() => {
    const driversWithScore = drivers.filter(d => d.safetyScore > 0)
    if (driversWithScore.length === 0) return safeStats.avgSafetyScore
    const total = driversWithScore.reduce((sum, d) => sum + d.safetyScore, 0)
    return Math.round(total / driversWithScore.length)
  }, [drivers, safeStats.avgSafetyScore])

  const driversDrivingCount = useMemo(() => {
    return drivers.filter((d: any) =>
      d.hos_status === 'driving' || d.hosStatus === 'driving' ||
      (d.status === 'active' && (d as any).hos_status === 'driving')
    ).length
  }, [drivers])

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-1.5">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* Driver Statistics */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Total Drivers"
          value={safeStats.totalDrivers}
          icon={Users}
          description="Active driver pool"
        />
        <StatCard
          title="On Duty"
          value={safeStats.activeDrivers}
          icon={UserIcon}
          description="Currently working"
        />
        <StatCard
          title="Avg Safety Score"
          value={computedAvgSafetyScore}
          icon={Shield}
          trend={computedAvgSafetyScore >= 80 ? 'up' : computedAvgSafetyScore >= 60 ? 'neutral' : 'down'}
          description="From driver safety scores"
        />
        <StatCard
          title="HOS Driving"
          value={driversDrivingCount}
          icon={Activity}
          description="Currently driving"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        <Section
          title="Driver Performance Trends"
          description="Safety scores and compliance over time"
          icon={<LineChart className="h-4 w-4" />}
        >
          {performanceTrend.length > 0 ? (
            <ResponsiveLineChart
              title="Driver Performance Trends"
              data={performanceTrend.map(point => ({
                name: point.date,
                date: point.date,
                safety_score: point.avgScore,
                performance_rating: point.avgScore
              }))}
              dataKeys={['safety_score', 'performance_rating']}
              colors={['hsl(var(--success))', 'hsl(var(--primary))']}
              height={140}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No performance trend data available</div>
          )}
        </Section>

        <Section
          title="Top Performers"
          description="Drivers with highest safety scores"
          icon={<Award className="h-4 w-4" />}
        >
          {drivers.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {drivers.slice(0, 5).map((driver: any, index) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${driver.name}`}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.06] text-foreground text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">{driver.name}</p>
                        {(driver.employment_type || driver.employmentType) && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {formatEnum(driver.employment_type || driver.employmentType)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{driver.licenseNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(driver.hos_status || driver.hosStatus) && (
                      <Badge variant={
                        (driver.hos_status || driver.hosStatus) === 'driving' ? 'default' :
                        (driver.hos_status || driver.hosStatus) === 'on_duty' ? 'secondary' : 'outline'
                      } className="text-[10px] px-1 py-0">
                        {formatEnum(driver.hos_status || driver.hosStatus)}
                      </Badge>
                    )}
                    <Badge variant={driver.status === 'active' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                      {formatEnum(driver.status)}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{driver.safetyScore || 0}/100</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
          )}
        </Section>
      </div>
    </div>
  )
})

/**
 * Operations Tab - Dispatch, routing, fuel management
 */
const OperationsTabContent = memo(function OperationsTabContent() {
  const { routes, fuelTransactions, metrics: stats, isLoading: loading, error } = useReactiveOperationsData()
  const { vehicles: fleetVehicles } = useReactiveFleetData()
  const { push } = useDrilldown()

  const vehicleNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    fleetVehicles.forEach((v: any) => {
      const id = String(v.id)
      const name = v.unit_number || v.unitNumber || `${v.year || ''} ${v.make || ''} ${v.model || ''}`.trim()
      if (name) map[id] = name
    })
    return map
  }, [fleetVehicles])

  const safeStats = stats || {
    activeJobs: 0,
    scheduled: 0,
    completed: 0,
    delayed: 0,
    cancelled: 0,
    totalRoutes: 0,
    completionRate: 0,
    avgRouteDistance: 0,
    totalDistance: 0,
    totalFuelCost: 0,
    avgFuelCostPerMile: 0,
    avgFuelCostPerRoute: 0,
    openTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    totalTasks: 0
  }

  const avgMpg = useMemo(() => {
    const txWithMpg = fuelTransactions.filter((tx: any) =>
      tx.mpg_calculated != null || tx.mpgCalculated != null
    )
    if (txWithMpg.length === 0) return null
    const total = txWithMpg.reduce((sum: number, tx: any) =>
      sum + Number(tx.mpg_calculated || tx.mpgCalculated || 0), 0
    )
    return (total / txWithMpg.length).toFixed(1)
  }, [fuelTransactions])

  if (loading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-1.5">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* Operations Statistics */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Active Routes"
          value={safeStats.activeJobs}
          icon={RouteIcon}
          description="In progress"
        />
        <StatCard
          title="Pending Tasks"
          value={safeStats.openTasks}
          icon={CheckSquare}
          description="Need assignment"
        />
        <StatCard
          title="Total Fuel Cost"
          value={formatCurrency(safeStats.totalFuelCost || 0)}
          icon={Fuel}
          description="Total fuel spend"
        />
        <StatCard
          title="Completion Rate"
          value={`${safeStats.completionRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Route completion"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        <Section
          title="Active Routes"
          description="Real-time route tracking"
          icon={<Map className="h-4 w-4" />}
        >
          {routes.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {routes.slice(0, 5).map(route => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${route.name || 'Route'}`}
                  onClick={() => push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{route.name || `${formatEnum(route.routeType || 'route')} Route`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {route.originName || 'Origin'} to {route.destinationName || 'Destination'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={route.status === 'in_transit' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                    {formatEnum(route.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No active routes</div>
          )}
        </Section>

        <Section
          title="Recent Fuel Transactions"
          description="Latest fuel purchases and costs"
          icon={<Fuel className="h-4 w-4" />}
        >
          {fuelTransactions.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {fuelTransactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">
                        {vehicleNameMap[transaction.vehicleId] || `Vehicle ...${String(transaction.vehicleId).slice(-4)}`}
                      </p>
                      {(transaction.station_brand || transaction.stationBrand) && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {transaction.station_brand || transaction.stationBrand}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {transaction.amount} gal @ {formatCurrency(transaction.pricePerUnit || 0)}/gal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-foreground">{formatCurrency(transaction.cost)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <p className="text-[10px] text-muted-foreground">{transaction.location || '—'}</p>
                      {(transaction.mpg_calculated || transaction.mpgCalculated) && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {Number(transaction.mpg_calculated || transaction.mpgCalculated).toFixed(1)} MPG
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No fuel transactions</div>
          )}
        </Section>
      </div>
    </div>
  )
})

/**
 * Maintenance Tab - Work orders and schedules
 */
const MaintenanceTabContent = memo(function MaintenanceTabContent() {
  const { workOrders, metrics, isLoading, errors } = useReactiveMaintenanceData()
  const { inventoryMetrics } = useReactiveAssetsData()
  const { push } = useDrilldown()
  const { data: partsResponse } = useSWR<any>(
    '/api/parts?limit=6',
    apiFetcher,
    { shouldRetryOnError: false }
  )

  const parts = Array.isArray(partsResponse) ? partsResponse : []

  const safeMetrics = metrics || {
    totalWorkOrders: 0,
    urgentOrders: 0,
    inProgress: 0,
    completedToday: 0,
    partsWaiting: 0,
    pendingOrders: 0,
    avgCompletionTime: 0,
    totalCost: 0
  }

  const totalDowntimeHours = useMemo(() => {
    return workOrders.reduce((sum: number, order: any) => {
      const downtime = Number(order.downtime_hours || order.downtimeHours || 0)
      return sum + downtime
    }, 0)
  }, [workOrders])

  const costBreakdown = useMemo(() => {
    const partsCost = workOrders.reduce((sum: number, order: any) =>
      sum + Number(order.parts_cost || order.partsCost || 0), 0
    )
    const laborCost = workOrders.reduce((sum: number, order: any) =>
      sum + Number(order.labor_cost || order.laborCost || 0), 0
    )
    return { partsCost, laborCost }
  }, [workOrders])

  const openOrders = workOrders.filter(order =>
    order.status !== 'completed' && order.status !== 'cancelled'
  )

  const upcomingOrders = workOrders.filter(order =>
    order.status === 'pending' || order.status === 'in_progress'
  )

  const overdueOrders = useMemo(() => {
    const now = Date.now()
    return workOrders
      .filter(order => order.status !== 'completed' && order.status !== 'cancelled')
      .map((order: any) => {
        const dueDate = order.scheduledEnd || order.scheduledStart
        if (!dueDate) return null
        const dueMs = new Date(dueDate).getTime()
        if (Number.isNaN(dueMs) || dueMs >= now) return null
        const daysOverdue = Math.max(1, Math.round((now - dueMs) / (1000 * 60 * 60 * 24)))
        return { ...order, dueDate, daysOverdue }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.daysOverdue - a.daysOverdue)
      .slice(0, 3)
  }, [workOrders])


  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const maintenanceError = errors.workOrders || errors.requests || errors.predictions
  if (maintenanceError) {
    return (
      <div className="p-1.5">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {maintenanceError.message || 'Failed to load maintenance data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleCreateWorkOrder = () => {
    push({ type: 'work-order-create' as any, label: 'New Work Order', data: {} })
  }

  const handleViewWorkOrder = (workOrderId: string) => {
    push({ id: workOrderId, type: 'workOrder', label: 'Work Order', data: { workOrderId } })
  }

  const handleScheduleMaintenance = (vehicleId: string) => {
    push({ id: vehicleId, type: 'vehicle', label: 'Schedule Maintenance', data: { vehicleId, action: 'schedule-maintenance' } })
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* Maintenance Statistics */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Open Work Orders"
          value={openOrders.length}
          icon={ClipboardList}
          description="Active maintenance tasks"
        />
        <StatCard
          title="Urgent Orders"
          value={safeMetrics.urgentOrders}
          icon={AlertTriangle}
          description="Needs immediate attention"
        />
        <StatCard
          title="Total Downtime"
          value={`${totalDowntimeHours.toFixed(1)} hrs`}
          icon={Timer}
          trend={totalDowntimeHours > 100 ? 'down' : 'neutral'}
          description="Sum of downtime hours"
        />
        <StatCard
          title="Parts Inventory"
          value={formatCurrency(inventoryMetrics?.totalValue || 0)}
          icon={Package}
          description="Current stock value"
        />
      </div>

      {/* Cost Breakdown Row */}
      {(costBreakdown.partsCost > 0 || costBreakdown.laborCost > 0) && (
        <div className="grid grid-cols-3 gap-1.5 shrink-0">
          <div className="rounded border border-white/[0.08] bg-[#242424] p-2">
            <p className="text-[10px] text-muted-foreground">Total Cost</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(safeMetrics.totalCost)}</p>
          </div>
          <div className="rounded border border-white/[0.08] bg-[#242424] p-2">
            <p className="text-[10px] text-muted-foreground">Parts Cost</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(costBreakdown.partsCost)}</p>
          </div>
          <div className="rounded border border-white/[0.08] bg-[#242424] p-2">
            <p className="text-[10px] text-muted-foreground">Labor Cost</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(costBreakdown.laborCost)}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
        {/* Active Work Orders */}
        <Section
          title="Active Work Orders"
          description="Current maintenance tasks and their status"
          icon={<ClipboardList className="h-4 w-4" />}
          actions={
            <Button size="sm" onClick={handleCreateWorkOrder}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Work Order
            </Button>
          }
        >
          {openOrders.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {openOrders.slice(0, 5).map((order: any) => (
                <div key={order.id} className={`flex items-center justify-between rounded border p-2 ${
                  order.is_emergency || order.isEmergency ? 'border-rose-800/40 bg-rose-950/20' : 'border-white/[0.08] bg-[#242424]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Tool className={`h-4 w-4 ${
                      order.priority === 'high' || order.priority === 'urgent' ? 'text-rose-400' :
                      order.priority === 'medium' ? 'text-foreground' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-foreground">{order.title || `${formatEnum(order.type || 'maintenance')} Maintenance`}</p>
                        {(order.is_emergency || order.isEmergency) && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            <Siren className="h-3 w-3 mr-0.5" />
                            EMERGENCY
                          </Badge>
                        )}
                        {order.type && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {formatEnum(order.type)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {order.vehicleName || (order.vehicleId ? `...${String(order.vehicleId).slice(-4)}` : '—')} · Created: {formatDate(order.createdAt)}
                        {(order.parts_cost || order.partsCost || order.labor_cost || order.laborCost) && (
                          <span className="ml-1">
                            Parts: {formatCurrency(Number(order.parts_cost || order.partsCost || 0))} | Labor: {formatCurrency(Number(order.labor_cost || order.laborCost || 0))}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={
                      order.status === 'in_progress' ? 'default' :
                      order.status === 'pending' ? 'secondary' : 'outline'
                    } className="text-[10px] px-1 py-0">
                      {formatEnum(order.status)}
                    </Badge>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleViewWorkOrder(order.id)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No active work orders</div>
          )}
        </Section>

        {/* Schedule + Overdue */}
        <div className="grid grid-cols-2 gap-1.5">
          <Section
            title="Upcoming Maintenance"
            description="Scheduled preventive maintenance"
            icon={<Calendar className="h-4 w-4" />}
          >
            {upcomingOrders.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {upcomingOrders.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{maintenance.title || `${formatEnum(maintenance.type || 'maintenance')} Maintenance`}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {maintenance.vehicleName || (maintenance.vehicleId ? `...${String(maintenance.vehicleId).slice(-4)}` : '—')} · {formatDate(maintenance.createdAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleViewWorkOrder(maintenance.id)}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No scheduled maintenance</div>
            )}
          </Section>

          <Section
            title="Overdue Maintenance"
            description="Requires immediate attention"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {overdueOrders.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {overdueOrders.map((overdue: any) => (
                  <Alert key={overdue.id} variant="destructive" className="border-rose-800/40 bg-rose-950/30">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-rose-200">{overdue.title || `${formatEnum(overdue.type || 'Maintenance')} Maintenance`}</p>
                          <p className="text-[10px] text-rose-300/70">
                            {overdue.vehicleName || (overdue.vehicleId ? `...${String(overdue.vehicleId).slice(-4)}` : '—')} · Overdue by {overdue.daysOverdue} days
                          </p>
                        </div>
                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleScheduleMaintenance(overdue.vehicleId || overdue.vehicleName)}>
                          Schedule
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No overdue maintenance</div>
            )}
          </Section>
        </div>

        {/* Parts Inventory */}
        <Section
          title="Parts Inventory"
          description="Common maintenance parts and supplies"
          icon={<Package className="h-4 w-4" />}
        >
          {parts.length > 0 ? (
            <div className="grid gap-1.5 grid-cols-3">
              {parts.map((item: any) => {
                const quantity = Number(item.quantityOnHand ?? item.quantity_on_hand ?? 0)
                const reorderPoint = Number(item.reorderPoint ?? item.reorder_point ?? 0)
                const status = quantity <= reorderPoint ? 'low-stock' : 'in-stock'
                return (
                  <div key={item.id || item.partNumber || item.name} className="rounded border border-white/[0.08] bg-[#242424] p-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-foreground">{item.name || item.partNumber || 'Part'}</p>
                      <Badge variant={status === 'in-stock' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0">
                        {status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Qty: {quantity} {item.unitOfMeasure || item.unit_of_measure || ''} · Reorder: {reorderPoint}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No parts inventory available</div>
          )}
        </Section>
      </div>
    </div>
  )
})

/**
 * Assets Tab - Asset tracking and lifecycle management
 */
const AssetsTabContent = memo(function AssetsTabContent() {
  const { push } = useDrilldown()
  const {
    assets,
    metrics,
    statusDistribution,
    typeDistribution,
    maintenanceRequired,
    inventoryByCategory,
    isLoading,
  } = useReactiveAssetsData()

  const handleViewAsset = (assetId: string) => {
    push({ id: assetId, type: 'asset', label: 'Asset Details', data: { assetId } })
  }

  const handleAddAsset = () => {
    push({ type: 'asset-create' as any, label: 'Add New Asset', data: {} })
  }

  const handleScheduleAssetMaintenance = (assetId: string) => {
    push({ id: assetId, type: 'asset', label: 'Schedule Maintenance', data: { assetId, action: 'schedule-maintenance' } })
  }


  const utilizationData = [
    { name: 'In Use', value: statusDistribution.active || 0, fill: '#10B981' },
    { name: 'Available', value: statusDistribution.available || 0, fill: '#3B82F6' },
    { name: 'Maintenance', value: statusDistribution.maintenance || 0, fill: '#F59E0B' },
    { name: 'Retired', value: statusDistribution.retired || 0, fill: '#94A3B8' },
  ].filter((entry) => entry.value > 0)

  if (isLoading) {
    return (
      <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 shrink-0">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* Asset Statistics */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
        <StatCard
          title="Total Assets"
          value={metrics.totalAssets}
          icon={Box}
          description="Equipment and tools"
        />
        <StatCard
          title="Assets in Use"
          value={metrics.activeAssets}
          icon={Truck}
          description="Currently deployed"
        />
        <StatCard
          title="Maintenance Due"
          value={metrics.inMaintenance}
          icon={Wrench}
          description="Needs servicing"
        />
        <StatCard
          title="Asset Value"
          value={formatCurrency(metrics.totalValue)}
          icon={DollarSign}
          description="Total fleet value"
        />
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5">
        {/* Asset Inventory */}
        <Section
          title="Asset Inventory"
          description="Heavy machinery, equipment, and tools"
          icon={<Box className="h-4 w-4" />}
          actions={
            <Button size="sm" onClick={handleAddAsset}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Asset
            </Button>
          }
        >
          {assets.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {assets.slice(0, 6).map((asset: any) => {
                const healthScore = asset.health_score != null ? Number(asset.health_score) : null
                return (
                  <div key={asset.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{asset.assetTag || `...${String(asset.id).slice(-4)}`} - {asset.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatEnum(asset.type)} · {asset.location}
                          {(asset.department || asset.dept) && (
                            <span className="ml-1">· {asset.department || asset.dept}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {healthScore != null && (
                        <span className={`inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium ${
                          healthScore >= 80 ? 'text-emerald-400 bg-emerald-900/30' :
                          healthScore >= 60 ? 'text-amber-400 bg-amber-900/30' :
                          'text-rose-400 bg-rose-900/30'
                        }`}>
                          {healthScore}%
                        </span>
                      )}
                      <Badge variant={asset.status === 'active' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                        {formatEnum(asset.status)}
                      </Badge>
                      {asset.condition && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {formatEnum(asset.condition)}
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleViewAsset(asset.id)}>
                        View
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No assets available</div>
          )}
        </Section>

        {/* Utilization + Maintenance Schedule */}
        <div className="grid grid-cols-2 gap-1.5">
          <Section
            title="Asset Utilization"
            description="Usage metrics for key assets"
            icon={<BarChart className="h-4 w-4" />}
          >
            {utilizationData.length > 0 ? (
              <ResponsivePieChart
                title="Asset Utilization"
                data={utilizationData}
                height={140}
                compact
              />
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No utilization data available</div>
            )}
          </Section>

          <Section
            title="Asset Maintenance Schedule"
            description="Upcoming asset servicing"
            icon={<Calendar className="h-4 w-4" />}
          >
            {maintenanceRequired.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {maintenanceRequired.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{maintenance.assetTag || `...${String(maintenance.id).slice(-4)}`} - {maintenance.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatEnum(maintenance.type)} · Due: {formatDate(maintenance.nextServiceDate || maintenance.lastServiceDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {maintenance.status && (
                        <Badge variant={maintenance.status === 'maintenance' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0">
                          {formatEnum(maintenance.status)}
                        </Badge>
                      )}
                      <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleScheduleAssetMaintenance(maintenance.id)}>
                        Schedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No asset maintenance due</div>
            )}
          </Section>
        </div>

        {/* Asset Categories Breakdown */}
        <Section
          title="Asset Categories"
          description="Breakdown by equipment type"
          icon={<Package className="h-4 w-4" />}
        >
          <div className="grid gap-1.5 grid-cols-3">
            {(inventoryByCategory.length > 0 ? inventoryByCategory : Object.entries(typeDistribution).map(([key, value]) => ({
              name: key,
              count: value,
              value: 0,
              items: value
            }))).map((cat) => (
              <div key={cat.name} className="rounded border border-white/[0.08] bg-[#242424] p-2">
                <p className="text-xs font-semibold text-foreground">{formatEnum(cat.name)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-muted-foreground">{cat.count} assets</p>
                  <p className="text-[10px] font-semibold text-foreground">{cat.value ? formatCurrency(cat.value) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FleetOperationsHub() {
  const [activeTab, setActiveTab] = useState('overview')
  const { user } = useAuth()

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, testId: 'hub-tab-overview' },
    { id: 'fleet', label: 'Fleet', icon: Car, testId: 'hub-tab-fleet' },
    { id: 'drivers', label: 'Drivers', icon: Users, testId: 'hub-tab-drivers' },
    { id: 'operations', label: 'Operations', icon: OperationsIcon, testId: 'hub-tab-operations' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, testId: 'hub-tab-maintenance' },
    { id: 'assets', label: 'Assets', icon: Box, testId: 'hub-tab-assets' },
  ]

  return (
    <HubPage
      title="Fleet Operations"
      description="Comprehensive fleet management, driver tracking, and operations control"
      icon={<Car className="h-5 w-5" />}
      className="cta-hub"
    >
      <div className="flex flex-col h-full gap-1.5 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-white/[0.08] cta-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={tab.testId}
                className={`
                  relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg cta-tab
                  transition-colors whitespace-nowrap shrink-0
                  ${isActive
                    ? 'cta-pill text-primary-foreground shadow-md cta-tab--active'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'overview' && (
            <QueryErrorBoundary>
              <OverviewTabContent />
            </QueryErrorBoundary>
          )}
          {activeTab === 'fleet' && (
            <QueryErrorBoundary>
              <FleetTabContent />
            </QueryErrorBoundary>
          )}
          {activeTab === 'drivers' && (
            <QueryErrorBoundary>
              <DriversTabContent />
            </QueryErrorBoundary>
          )}
          {activeTab === 'operations' && (
            <QueryErrorBoundary>
              <OperationsTabContent />
            </QueryErrorBoundary>
          )}
          {activeTab === 'maintenance' && (
            <QueryErrorBoundary>
              <MaintenanceTabContent />
            </QueryErrorBoundary>
          )}
          {activeTab === 'assets' && (
            <QueryErrorBoundary>
              <AssetsTabContent />
            </QueryErrorBoundary>
          )}
        </div>
      </div>
    </HubPage>
  )
}
