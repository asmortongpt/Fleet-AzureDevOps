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
  Trophy,
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

// framer-motion removed - React 19 incompatible animation system caused invisible content
import toast from 'react-hot-toast'
import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
// Tab navigation is custom (pill buttons) - no longer using Radix Tabs
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
import logger from '@/utils/logger';


// ============================================================================
// LAZY-LOADED COMPONENTS
// ============================================================================

const LiveTracking = lazy(() => import('@/components/fleet/LiveTracking'))
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const VideoTelematics = lazy(() => import('@/components/modules/compliance/VideoTelematics').then(m => ({ default: m.VideoTelematics })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))
const FleetManagerDashboard = lazy(() => import('@/components/dashboards/roles/FleetManagerDashboard').then(m => ({ default: m.FleetManagerDashboard })))
const DriverDashboard = lazy(() => import('@/components/dashboards/roles/DriverDashboard').then(m => ({ default: m.DriverDashboard })))


const swrFetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

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

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 70) return 'text-blue-600 dark:text-blue-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }
  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 dark:bg-emerald-900/40'
    if (score >= 70) return 'bg-blue-100 dark:bg-blue-900/40'
    if (score >= 50) return 'bg-amber-100 dark:bg-amber-900/40'
    return 'bg-red-100 dark:bg-red-900/40'
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}
      </div>
    )
  }

  const departmentChartData = departmentUtil.slice(0, 8).map(d => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '...' : d.name, count: d.count, uptime: d.avgUptime ?? 0,
  }))
  const woTypeChartData = Object.entries(woTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number,
    fill: name === 'preventive' ? '#10b981' : name === 'corrective' ? '#3b82f6' : name === 'emergency' ? '#ef4444' : name === 'inspection' ? '#f59e0b' : '#8b5cf6',
  }))
  const healthDistributionData = [
    { name: 'Excellent (90+)', value: fleetHealth.excellent, fill: '#10b981' },
    { name: 'Good (70-89)', value: fleetHealth.good, fill: '#3b82f6' },
    { name: 'Fair (50-69)', value: fleetHealth.fair, fill: '#f59e0b' },
    { name: 'Poor (<50)', value: fleetHealth.poor, fill: '#ef4444' },
  ].filter(d => d.value > 0)
  const hosChartData = [
    { name: 'Driving', value: hosCompliance.statuses.driving, fill: '#10b981' },
    { name: 'On Duty', value: hosCompliance.statuses.on_duty, fill: '#3b82f6' },
    { name: 'Off Duty', value: hosCompliance.statuses.off_duty, fill: '#94a3b8' },
    { name: 'Sleeper', value: hosCompliance.statuses.sleeper, fill: '#8b5cf6' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* ROW 1: TOP-LEVEL KPI SUMMARY */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Fleet Health Score" value={fleetHealth.avgScore > 0 ? fleetHealth.avgScore : 'N/A'} icon={HeartPulse}
          description={`${fleetHealth.totalWithScores} vehicles scored`}
          trend={fleetHealth.avgScore >= 80 ? 'up' : fleetHealth.avgScore >= 60 ? 'neutral' : 'down'} />
        <StatCard title="Avg Safety Score" value={safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : 'N/A'} icon={Shield}
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
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Fleet Health Overview" description="Vehicle health score distribution" icon={<HeartPulse className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-20 h-20 rounded-2xl ${getHealthBg(fleetHealth.avgScore)}`}>
                <span className={`text-3xl font-bold ${getHealthColor(fleetHealth.avgScore)}`}>
                  {fleetHealth.avgScore > 0 ? fleetHealth.avgScore : '--'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Average Health Score</p>
                <p className="text-xs text-muted-foreground">{fleetHealth.totalWithScores} of {vehicles.length} vehicles with scores</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Excellent (90+)', color: 'bg-emerald-500', count: fleetHealth.excellent },
                { label: 'Good (70-89)', color: 'bg-blue-500', count: fleetHealth.good },
                { label: 'Fair (50-69)', color: 'bg-amber-500', count: fleetHealth.fair },
                { label: 'Poor (<50)', color: 'bg-red-500', count: fleetHealth.poor },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
            {healthDistributionData.length > 0 && (
              <ResponsivePieChart title="Health Distribution" data={healthDistributionData} height={200} innerRadius={50} showPercentages />
            )}
          </div>
        </Section>

        <Section title="HOS Compliance" description="Hours of Service status across drivers" icon={<Timer className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Driving', value: hosCompliance.statuses.driving, icon: Activity, border: 'border-emerald-200/60 dark:border-emerald-800/40', bg: 'bg-emerald-50/50 dark:bg-emerald-950/20', iconColor: 'text-emerald-600 dark:text-emerald-400', textColor: 'text-emerald-700 dark:text-emerald-300' },
                { label: 'On Duty', value: hosCompliance.statuses.on_duty, icon: UserCheck, border: 'border-blue-200/60 dark:border-blue-800/40', bg: 'bg-blue-50/50 dark:bg-blue-950/20', iconColor: 'text-blue-600 dark:text-blue-400', textColor: 'text-blue-700 dark:text-blue-300' },
                { label: 'Off Duty', value: hosCompliance.statuses.off_duty, icon: Clock, border: 'border-slate-200/60 dark:border-slate-700/40', bg: 'bg-slate-50/50 dark:bg-slate-900/20', iconColor: 'text-slate-500', textColor: 'text-slate-700 dark:text-slate-300' },
                { label: 'Sleeper', value: hosCompliance.statuses.sleeper, icon: BedDouble, border: 'border-violet-200/60 dark:border-violet-800/40', bg: 'bg-violet-50/50 dark:bg-violet-950/20', iconColor: 'text-violet-600 dark:text-violet-400', textColor: 'text-violet-700 dark:text-violet-300' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-3`}>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${item.textColor}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Total Hours Available</p>
                  <p className="text-xs text-muted-foreground">Across all active drivers</p>
                </div>
                <p className="text-2xl font-bold text-foreground">{hosCompliance.totalHoursAvailable}h</p>
              </div>
            </div>
            {hosChartData.length > 0 && (
              <ResponsivePieChart title="HOS Status Distribution" data={hosChartData} height={200} innerRadius={50} showPercentages />
            )}
          </div>
        </Section>
      </div>

      {/* ROW 3: SAFETY METRICS + DEPARTMENT UTILIZATION */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Safety Metrics" description="Driver safety scoring and alerts" icon={<Shield className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center justify-center w-20 h-20 rounded-2xl ${getHealthBg(safetyMetrics.avgSafety)}`}>
                <span className={`text-3xl font-bold ${getHealthColor(safetyMetrics.avgSafety)}`}>
                  {safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : '--'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Average Driver Safety Score</p>
                <p className="text-xs text-muted-foreground">Across {safetyMetrics.totalDrivers} drivers</p>
              </div>
            </div>
            {safetyMetrics.needsAttention > 0 && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-semibold">{safetyMetrics.needsAttention} driver{safetyMetrics.needsAttention !== 1 ? 's' : ''}</span> with safety score below 70 -- requires review
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Excellent (90+)', color: 'text-emerald-600 dark:text-emerald-400', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) >= 90).length },
                { label: 'Good (70-89)', color: 'text-blue-600 dark:text-blue-400', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 70 && s < 90 }).length },
                { label: 'Fair (50-69)', color: 'text-amber-600 dark:text-amber-400', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 50 && s < 70 }).length },
                { label: 'Poor (<50)', color: 'text-red-600 dark:text-red-400', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) < 50).length },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Department Utilization" description="Vehicle count and uptime by department" icon={<Building2 className="h-5 w-5" />}>
          <div className="space-y-4">
            {departmentUtil.length > 0 ? (
              <>
                <div className="space-y-2">
                  {departmentUtil.slice(0, 6).map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{dept.count}</p>
                          <p className="text-[10px] text-muted-foreground">vehicles</p>
                        </div>
                        {dept.avgUptime !== null && (
                          <div className="text-right">
                            <p className="text-sm font-semibold">{dept.avgUptime}%</p>
                            <p className="text-[10px] text-muted-foreground">uptime</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {departmentChartData.length > 0 && (
                  <ResponsiveBarChart title="Vehicles by Department" data={departmentChartData} dataKey="count" height={200} showValues />
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No department data available</div>
            )}
          </div>
        </Section>
      </div>

      {/* ROW 4: MAINTENANCE OVERVIEW + COMPLIANCE ALERTS */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Maintenance Overview" description="Work orders, downtime, and categories" icon={<Wrench className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total WOs</p>
                <p className="text-xl font-bold text-foreground">{maintenanceMetrics?.totalWorkOrders ?? 0}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Downtime</p>
                <p className="text-xl font-bold text-foreground">{maintenanceOverview.totalDowntimeHours}h</p>
              </div>
              <div className="rounded-xl border border-red-200/60 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Emergency</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{maintenanceOverview.emergencyCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'In Progress', value: maintenanceMetrics?.inProgress ?? 0 },
                { label: 'Pending', value: maintenanceMetrics?.pendingOrders ?? 0 },
                { label: 'Parts Waiting', value: maintenanceMetrics?.partsWaiting ?? 0 },
                { label: 'Completed Today', value: maintenanceMetrics?.completedToday ?? 0 },
              ].map(item => (
                <div key={item.label} className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
            {woTypeChartData.length > 0 && (
              <ResponsivePieChart title="Work Orders by Category" data={woTypeChartData} height={200} innerRadius={50} showPercentages />
            )}
          </div>
        </Section>

        <Section title="Compliance Alerts" description="Expiring certifications and overdue items" icon={<Siren className="h-5 w-5" />}>
          <div className="space-y-4">
            {complianceAlerts.totalAlerts === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
                <p className="text-sm font-semibold text-foreground">All Clear</p>
                <p className="text-xs text-muted-foreground">No compliance alerts at this time</p>
              </div>
            ) : (
              <>
                {[
                  { icon: Car, title: 'Registration Expiry', desc: 'Vehicles expiring within 30 days', count: complianceAlerts.expiringRegistrations, severity: 'amber' as const },
                  { icon: UserIcon, title: 'Medical Card Expiry', desc: 'Drivers expiring within 30 days', count: complianceAlerts.expiringMedicalCards, severity: 'amber' as const },
                  { icon: ShieldAlert, title: 'Drug Test Overdue', desc: 'Last test over 12 months ago', count: complianceAlerts.overdueDrugTests, severity: 'red' as const },
                ].map(alert => (
                  <div key={alert.title} className={`rounded-xl border p-4 ${
                    alert.count > 0
                      ? alert.severity === 'red'
                        ? 'border-red-200/60 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20'
                        : 'border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-border/60 bg-background/60'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <alert.icon className={`h-5 w-5 ${
                          alert.count > 0
                            ? alert.severity === 'red' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.desc}</p>
                        </div>
                      </div>
                      <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'}>{alert.count}</Badge>
                    </div>
                  </div>
                ))}
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Total Compliance Issues</p>
                    <Badge variant={complianceAlerts.totalAlerts > 5 ? 'destructive' : 'secondary'} className="text-base px-3 py-1">
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
  const { vehicles, metrics: stats, statusDistribution, isLoading: loading, error, refetch } = useReactiveFleetData()
  const { user } = useAuth()

  // Default stats if undefined - use metrics structure from hook
  const safeStats = stats || {
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    idleVehicles: 0,
    averageFuelLevel: 0,
    totalMileage: 0
  }

  // Enhancement 1: Calculate average health score from vehicles
  const avgHealthScore = useMemo(() => {
    const vehiclesWithHealth = vehicles.filter((v: any) => v.health_score != null)
    if (vehiclesWithHealth.length === 0) return null
    const total = vehiclesWithHealth.reduce((sum: number, v: any) => sum + Number(v.health_score), 0)
    return Math.round(total / vehiclesWithHealth.length)
  }, [vehicles])

  // Enhancement 2: Build operational_status breakdown for subtitle
  const statusBreakdownText = useMemo(() => {
    if (statusDistribution.length === 0) return ''
    return statusDistribution.map(s => `${s.name}: ${s.value}`).join(' | ')
  }, [statusDistribution])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fleet Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          value={avgHealthScore != null ? `${avgHealthScore}%` : 'N/A'}
          icon={HeartPulse}
          trend={avgHealthScore != null ? (avgHealthScore >= 80 ? 'up' : avgHealthScore >= 60 ? 'neutral' : 'down') : 'neutral'}
          description="Avg health score"
        />
        <StatCard
          title="Maintenance Due"
          value={safeStats.maintenanceVehicles}
          icon={Wrench}
          description="Needs attention"
        />
        <StatCard
          title="Avg Fuel Level"
          value={`${(safeStats.averageFuelLevel || 0).toFixed(1)}%`}
          icon={Fuel}
          description="Fleet average"
        />
      </div>

      {/* Live Fleet Dashboard */}
      <div>
        <Section
          title="Live Fleet Tracking"
          description="Real-time vehicle locations and status"
          icon={<MapPin className="h-5 w-5" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-96" />}>
              <LiveFleetDashboard />
            </Suspense>
          </ErrorBoundary>
        </Section>
      </div>

      {/* Vehicle Telemetry */}
      <div>
        <Section
          title="Vehicle Telemetry"
          description="Performance metrics and diagnostics"
          icon={<Gauge className="h-5 w-5" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <VehicleTelemetry />
            </Suspense>
          </ErrorBoundary>
        </Section>
      </div>

      {/* Virtual Garage */}
      <div>
        <Section
          title="Virtual Garage"
          description="3D vehicle models and inventory"
          icon={<Car className="h-5 w-5" />}
        >
          <ErrorBoundary>
            <Suspense fallback={<Skeleton className="h-96" />}>
              <VirtualGarage />
            </Suspense>
          </ErrorBoundary>
        </Section>
      </div>

      {/* EV Charging Management */}
      {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'SuperAdmin') && (
        <div>
          <Section
            title="EV Charging Management"
            description="Electric vehicle charging stations and schedules"
            icon={<Plug className="h-5 w-5" />}
          >
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64" />}>
                <EVChargingManagement />
              </Suspense>
            </ErrorBoundary>
          </Section>
        </div>
      )}
    </div>
  )
})

/**
 * Drivers Tab - Driver management and performance
 */
const DriversTabContent = memo(function DriversTabContent() {
  const { drivers, performanceTrend, metrics: stats, isLoading: loading, error, refresh: refetch } = useReactiveDriversData()

  // Default stats if undefined - use metrics structure from hook
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

  // Enhancement 3: Compute actual average from driver.safetyScore (driver.safety_score from API)
  const computedAvgSafetyScore = useMemo(() => {
    const driversWithScore = drivers.filter(d => d.safetyScore > 0)
    if (driversWithScore.length === 0) return safeStats.avgSafetyScore
    const total = driversWithScore.reduce((sum, d) => sum + d.safetyScore, 0)
    return Math.round(total / driversWithScore.length)
  }, [drivers, safeStats.avgSafetyScore])

  // Enhancement 4: Count drivers currently "driving" (HOS status)
  const driversDrivingCount = useMemo(() => {
    return drivers.filter((d: any) =>
      d.hos_status === 'driving' || d.hosStatus === 'driving' ||
      (d.status === 'active' && (d as any).hos_status === 'driving')
    ).length
  }, [drivers])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Driver Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          icon={Trophy}
          trend={computedAvgSafetyScore >= 80 ? 'up' : computedAvgSafetyScore >= 60 ? 'neutral' : 'down'}
          description="From driver safety_score"
        />
        <StatCard
          title="HOS Driving"
          value={driversDrivingCount}
          icon={Activity}
          description="Currently driving"
        />
        <StatCard
          title="Avg Performance"
          value={`${safeStats.avgPerformance}%`}
          icon={Shield}
          description="Performance rating"
        />
      </div>

      {/* Driver Performance Chart */}
      <div>
        <Section
          title="Driver Performance Trends"
          description="Safety scores and compliance over time"
          icon={<LineChart className="h-5 w-5" />}
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
              colors={['#10b981', '#3b82f6']}
              height={300}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No performance trend data available yet
            </div>
          )}
        </Section>
      </div>

      {/* Top Performers */}
      <div>
        <Section
          title="Top Performers"
          description="Drivers with highest safety scores"
          icon={<Award className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {drivers.slice(0, 5).map((driver: any, index) => (
              <div key={driver.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{driver.name}</p>
                      {(driver.employment_type || driver.employmentType) && (
                        <Badge variant="outline" className="text-xs">
                          {driver.employment_type || driver.employmentType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{driver.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(driver.department || driver.dept) && (
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {driver.department || driver.dept}
                    </span>
                  )}
                  {(driver.hos_status || driver.hosStatus) && (
                    <Badge variant={
                      (driver.hos_status || driver.hosStatus) === 'driving' ? 'default' :
                      (driver.hos_status || driver.hosStatus) === 'on_duty' ? 'secondary' : 'outline'
                    } className="text-xs">
                      {driver.hos_status || driver.hosStatus}
                    </Badge>
                  )}
                  <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                    {driver.status}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">{driver.safetyScore || 0}/100</p>
                    <p className="text-sm text-muted-foreground">Safety Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Operations Tab - Dispatch, routing, fuel management
 */
const OperationsTabContent = memo(function OperationsTabContent() {
  const { routes, tasks, fuelTransactions, metrics: stats, isLoading: loading, error, refresh: refetch } = useReactiveOperationsData()

  // Default stats if undefined - use metrics structure from hook
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

  // Enhancement 8: Calculate average mpg from fuel transactions with mpg_calculated
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error.message || 'Failed to load data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Operations Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
          value={`$${(safeStats.totalFuelCost || 0).toFixed(2)}`}
          icon={Fuel}
          description="Total fuel spend"
        />
        <StatCard
          title="Avg Fuel Efficiency"
          value={avgMpg ? `${avgMpg} MPG` : 'N/A'}
          icon={Gauge}
          trend={avgMpg && Number(avgMpg) >= 20 ? 'up' : avgMpg ? 'neutral' : 'neutral'}
          description="Avg mpg_calculated"
        />
        <StatCard
          title="Completion Rate"
          value={`${safeStats.completionRate.toFixed(1)}%`}
          icon={TrendingUp}
          description="Route completion"
        />
      </div>

      {/* Active Routes Map */}
      <div>
        <Section
          title="Active Routes"
          description="Real-time route tracking and optimization"
          icon={<Map className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {routes.length > 0 ? (
              routes.slice(0, 5).map(route => (
                <div key={route.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <RouteIcon className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-semibold">Route #{route.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {route.origin || 'Origin'} → {route.destination || 'Destination'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={route.status === 'in_transit' ? 'default' : 'secondary'}>
                    {route.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active routes
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Fuel Transactions */}
      <div>
        <Section
          title="Recent Fuel Transactions"
          description="Latest fuel purchases and costs"
          icon={<Fuel className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {fuelTransactions.length > 0 ? (
              fuelTransactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Vehicle #{transaction.vehicleId}</p>
                      {(transaction.station_brand || transaction.stationBrand) && (
                        <Badge variant="outline" className="text-xs">
                          {transaction.station_brand || transaction.stationBrand}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.amount} gal @ ${(transaction.pricePerUnit || 0).toFixed(2)}/gal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${transaction.cost.toFixed(2)}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <p className="text-sm text-muted-foreground">{transaction.location || 'N/A'}</p>
                      {(transaction.mpg_calculated || transaction.mpgCalculated) && (
                        <Badge variant="secondary" className="text-xs">
                          {Number(transaction.mpg_calculated || transaction.mpgCalculated).toFixed(1)} MPG
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No fuel transactions
              </div>
            )}
          </div>
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
  const { data: partsResponse } = useSWR<any>(
    '/api/parts?limit=6',
    swrFetcher,
    { shouldRetryOnError: false }
  )

  const parts = Array.isArray(partsResponse) ? partsResponse : (partsResponse?.data || [])

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

  // Enhancement 11: Calculate total downtime_hours from work orders
  const totalDowntimeHours = useMemo(() => {
    return workOrders.reduce((sum: number, order: any) => {
      const downtime = Number(order.downtime_hours || order.downtimeHours || 0)
      return sum + downtime
    }, 0)
  }, [workOrders])

  // Enhancement 12: Aggregate parts_cost and labor_cost
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

  const formatDate = (value?: string) => {
    if (!value) return '—'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  const maintenanceError = errors.workOrders || errors.requests || errors.predictions
  if (maintenanceError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {maintenanceError.message || 'Failed to load maintenance data. Please try again.'}
        </AlertDescription>
      </Alert>
    )
  }

  // Handler for creating new work order
  const handleCreateWorkOrder = () => {
    toast.success('Opening work order creation form')
    logger.info('Create work order clicked')
  }

  // Handler for viewing work order details
  const handleViewWorkOrder = (workOrderId: string) => {
    toast.success(`Opening work order: ${workOrderId}`)
    logger.info('View work order clicked:', workOrderId)
  }

  // Handler for scheduling maintenance
  const handleScheduleMaintenance = (vehicleId: string) => {
    toast.success(`Scheduling maintenance for vehicle: ${vehicleId}`)
    logger.info('Schedule maintenance clicked:', vehicleId)
  }

  return (
    <div className="space-y-6">
      {/* Maintenance Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Open Work Orders"
          value={openOrders.length}
          icon={ClipboardList}
          description="Active maintenance tasks"
        />
        <StatCard
          title="Scheduled"
          value={safeMetrics.pendingOrders}
          icon={Calendar}
          description="Upcoming maintenance"
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
          description="Sum of downtime_hours"
        />
        <StatCard
          title="Parts Inventory"
          value={`$${(inventoryMetrics?.totalValue || 0).toFixed(0)}`}
          icon={Package}
          description="Current stock value"
        />
      </div>

      {/* Cost Breakdown */}
      {(costBreakdown.partsCost > 0 || costBreakdown.laborCost > 0) && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">${safeMetrics.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <p className="text-sm text-muted-foreground">Parts Cost</p>
            <p className="text-2xl font-bold">${costBreakdown.partsCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-4">
            <p className="text-sm text-muted-foreground">Labor Cost</p>
            <p className="text-2xl font-bold">${costBreakdown.laborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      )}

      {/* Work Orders List */}
      <div>
        <Section
          title="Active Work Orders"
          description="Current maintenance tasks and their status"
          icon={<ClipboardList className="h-5 w-5" />}
          actions={
            <Button onClick={handleCreateWorkOrder}>
              <Plus className="h-4 w-4 mr-2" />
              New Work Order
            </Button>
          }
        >
          <div className="space-y-3">
            {openOrders.length > 0 ? openOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className={`flex items-center justify-between rounded-xl border bg-background/60 p-4 ${
                order.is_emergency || order.isEmergency ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20' : 'border-border/60'
              }`}>
                <div className="flex items-center gap-3">
                  <Tool className={`h-5 w-5 ${
                    order.priority === 'high' || order.priority === 'urgent' ? 'text-red-500' :
                    order.priority === 'medium' ? 'text-blue-500' : 'text-muted-foreground'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{order.id} - {order.type}</p>
                      {(order.is_emergency || order.isEmergency) && (
                        <Badge variant="destructive" className="text-xs">
                          <Siren className="h-3 w-3 mr-1" />
                          EMERGENCY
                        </Badge>
                      )}
                      {(order.category || order.work_category) && (
                        <Badge variant="outline" className="text-xs">
                          {order.category || order.work_category}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(order.vehicleName || order.vehicleId)} · Created: {formatDate(order.createdAt)}
                      {(order.parts_cost || order.partsCost || order.labor_cost || order.laborCost) && (
                        <span className="ml-2">
                          Parts: ${Number(order.parts_cost || order.partsCost || 0).toFixed(0)} | Labor: ${Number(order.labor_cost || order.laborCost || 0).toFixed(0)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    order.status === 'in_progress' ? 'default' :
                    order.status === 'pending' ? 'secondary' : 'outline'
                  }>
                    {order.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleViewWorkOrder(order.id)}>
                    View
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No active work orders
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Maintenance Schedule */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title="Upcoming Maintenance Schedule"
          description="Scheduled preventive maintenance for the next 30 days"
          icon={<Calendar className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {upcomingOrders.length > 0 ? upcomingOrders.slice(0, 4).map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3">
                <div>
                  <p className="font-semibold">{maintenance.vehicleName || maintenance.vehicleId}</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenance.type} · {formatDate(maintenance.createdAt)}
                  </p>
                  {maintenance.description && (
                    <p className="text-xs text-muted-foreground">{maintenance.description}</p>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No scheduled maintenance
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Overdue Maintenance"
          description="Vehicles requiring immediate attention"
          icon={<AlertTriangle className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {overdueOrders.length > 0 ? overdueOrders.map((overdue: any) => (
              <Alert key={overdue.id} variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{overdue.vehicleName || overdue.vehicleId}</p>
                      <p className="text-sm">
                        {overdue.type || 'Maintenance'} · Overdue by {overdue.daysOverdue} days
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleScheduleMaintenance(overdue.vehicleId || overdue.vehicleName)}>
                      Schedule Now
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No overdue maintenance
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Parts Inventory */}
      <div>
        <Section
          title="Parts Inventory"
          description="Common maintenance parts and supplies"
          icon={<Package className="h-5 w-5" />}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {parts.length > 0 ? parts.map((item: any) => {
              const quantity = Number(item.quantityOnHand ?? item.quantity_on_hand ?? 0)
              const reorderPoint = Number(item.reorderPoint ?? item.reorder_point ?? 0)
              const status = quantity <= reorderPoint ? 'low-stock' : 'in-stock'
              return (
                <div key={item.id || item.partNumber || item.name} className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{item.name || item.partNumber || 'Part'}</p>
                    <Badge variant={status === 'in-stock' ? 'default' : 'destructive'}>
                      {status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty: {quantity} {item.unitOfMeasure || item.unit_of_measure || ''} · Reorder: {reorderPoint}
                  </p>
                </div>
              )
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                No parts inventory available
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Assets Tab - Asset tracking and lifecycle management
 */
const AssetsTabContent = memo(function AssetsTabContent() {
  const navigate = useNavigate()
  const {
    assets,
    metrics,
    statusDistribution,
    typeDistribution,
    maintenanceRequired,
    inventoryByCategory,
    isLoading,
  } = useReactiveAssetsData()

  // Handler for viewing asset details
  const handleViewAsset = (assetId: string) => {
    toast.success(`Opening asset details: ${assetId}`)
    logger.info('View asset clicked:', assetId)
    navigate(`/assets/${assetId}`)
  }

  // Handler for adding new asset
  const handleAddAsset = () => {
    toast.success('Opening add asset form')
    logger.info('Add asset clicked')
    navigate('/assets/new')
  }

  // Handler for scheduling asset maintenance
  const handleScheduleAssetMaintenance = (assetId: string) => {
    toast.success(`Scheduling maintenance for asset: ${assetId}`)
    logger.info('Schedule asset maintenance clicked:', assetId)
    navigate(`/maintenance/schedule?assetId=${assetId}`)
  }

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const utilizationData = [
    { name: 'In Use', value: statusDistribution.active || 0, fill: '#10b981' },
    { name: 'Available', value: statusDistribution.available || 0, fill: '#3b82f6' },
    { name: 'Maintenance', value: statusDistribution.maintenance || 0, fill: '#f59e0b' },
    { name: 'Retired', value: statusDistribution.retired || 0, fill: '#94a3b8' },
  ].filter((entry) => entry.value > 0)

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Asset Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Assets"
          value={metrics.totalAssets}
          icon={Box}
          description="Equipment & tools"
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

      {/* Asset Categories */}
      <div>
        <Section
          title="Asset Inventory"
          description="Heavy machinery, equipment, and tools"
          icon={<Box className="h-5 w-5" />}
          actions={
            <Button onClick={handleAddAsset}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          }
        >
          <div className="space-y-3">
            {assets.length > 0 ? assets.slice(0, 6).map((asset: any) => {
              const healthScore = asset.health_score != null ? Number(asset.health_score) : null
              const healthColor = healthScore != null
                ? healthScore >= 80 ? 'text-green-600 bg-green-100 dark:bg-green-900/30'
                : healthScore >= 60 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
                : 'text-red-600 bg-red-100 dark:bg-red-900/30'
                : ''
              return (
                <div key={asset.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <Box className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{asset.assetTag || asset.id} - {asset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.type} · {asset.location}
                        {(asset.department || asset.dept) && (
                          <span className="ml-2">· {asset.department || asset.dept}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {healthScore != null && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${healthColor}`}>
                        {healthScore}%
                      </span>
                    )}
                    <Badge variant={asset.status === 'active' ? 'default' : 'secondary'}>
                      {asset.status}
                    </Badge>
                    {asset.condition && (
                      <Badge variant={
                        asset.condition === 'excellent' ? 'default' :
                        asset.condition === 'good' ? 'secondary' : 'outline'
                      }>
                        {asset.condition}
                      </Badge>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleViewAsset(asset.id)}>
                      View
                    </Button>
                  </div>
                </div>
              )
            }) : (
              <div className="text-center py-8 text-muted-foreground">
                No assets available
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Asset Lifecycle & Utilization */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title="Asset Utilization"
          description="Usage metrics for key assets"
          icon={<BarChart className="h-5 w-5" />}
        >
          {utilizationData.length > 0 ? (
            <ResponsivePieChart
              title="Asset Utilization"
              data={utilizationData}
              height={250}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No utilization data available
            </div>
          )}
        </Section>

        <Section
          title="Asset Maintenance Schedule"
          description="Upcoming asset servicing"
          icon={<Calendar className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {maintenanceRequired.length > 0 ? maintenanceRequired.slice(0, 4).map((maintenance) => (
              <div key={maintenance.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-3">
                <div>
                  <p className="font-semibold">{maintenance.assetTag || maintenance.id} - {maintenance.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenance.type} · Due: {maintenance.nextServiceDate || maintenance.lastServiceDate || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {maintenance.status && (
                    <Badge variant={maintenance.status === 'maintenance' ? 'destructive' : 'secondary'}>
                      {maintenance.status}
                    </Badge>
                  )}
                  <Button size="sm" onClick={() => handleScheduleAssetMaintenance(maintenance.id)}>
                    Schedule
                  </Button>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                No asset maintenance due
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Asset Categories Breakdown */}
      <div>
        <Section
          title="Asset Categories"
          description="Breakdown by equipment type"
          icon={<Package className="h-5 w-5" />}
        >
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {(inventoryByCategory.length > 0 ? inventoryByCategory : Object.entries(typeDistribution).map(([key, value]) => ({
              name: key,
              count: value,
              value: 0,
              items: value
            }))).map((cat) => (
              <div key={cat.name} className="rounded-xl border border-border/60 bg-background/60 p-4">
                <p className="font-semibold">{cat.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-muted-foreground">{cat.count} assets</p>
                  <p className="text-sm font-semibold">{cat.value ? formatCurrency(cat.value) : '—'}</p>
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
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border/40 cta-tabs">
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
                  transition-all duration-200 whitespace-nowrap shrink-0
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
        <div>
          <ErrorBoundary>
            {activeTab === 'overview' && <OverviewTabContent />}
            {activeTab === 'fleet' && <FleetTabContent />}
            {activeTab === 'drivers' && <DriversTabContent />}
            {activeTab === 'operations' && <OperationsTabContent />}
            {activeTab === 'maintenance' && <MaintenanceTabContent />}
            {activeTab === 'assets' && <AssetsTabContent />}
          </ErrorBoundary>
        </div>
      </div>
    </HubPage>
  )
}
