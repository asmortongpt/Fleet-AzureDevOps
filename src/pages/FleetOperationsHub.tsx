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
  Siren,
  CalendarCheck
} from 'lucide-react'
import { useState, Suspense, lazy, memo, useMemo } from 'react'
import useSWR from 'swr'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { AddVehicleDialog } from '@/components/dialogs/AddVehicleDialog'
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
  GaugeChart,
} from '@/components/visualizations'
import { useAuth } from '@/contexts'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useReactiveAssetsData } from '@/hooks/use-reactive-assets-data'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
import { useReactiveFleetData } from '@/hooks/use-reactive-fleet-data'
import { useReactiveMaintenanceData } from '@/hooks/use-reactive-maintenance-data'
import { useReactiveOperationsData } from '@/hooks/use-reactive-operations-data'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatCurrency, formatNumber } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'


// ============================================================================
// LAZY-LOADED COMPONENTS
// ============================================================================

const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))
const VehicleAssignmentManagement = lazy(() => import('@/components/modules/fleet/VehicleAssignmentManagement').then(m => ({ default: m.default })))
const ReservationCalendarView = lazy(() => import('@/components/scheduling/ReservationCalendarView').then(m => ({ default: m.ReservationCalendarView })))


// ============================================================================
// HELPER: Flat progress bar replacing SVG circular gauges
// ============================================================================
function ProgressBar({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="h-2 bg-[rgba(0,204,254,0.08)] rounded-full">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-[#00CCFE]'
  if (score >= 70) return 'text-white'
  if (score >= 50) return 'text-[#FDC016]'
  return 'text-[#FF4300]'
}

function getBarColor(score: number) {
  if (score >= 90) return 'bg-[#00CCFE]'
  if (score >= 70) return 'bg-[rgba(255,255,255,0.60)]'
  if (score >= 50) return 'bg-[#FDC016]'
  return 'bg-[#FF4300]'
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
  const { push } = useDrilldown()

  const loading = fleetLoading || driversLoading || maintenanceLoading

  const fleetHealth = useMemo(() => {
    // Compute a health score for each vehicle:
    // 1. Use the DB health_score if present
    // 2. Otherwise synthesize from available data (fuel_level, status, mileage)
    const healthScores = vehicles.map((v: any) => {
      const dbScore = v.health_score ?? v.healthScore
      if (typeof dbScore === 'number' && !Number.isNaN(dbScore)) return dbScore

      // Synthesize a reasonable health score from available data
      let score = 80 // base score
      // Penalize low fuel
      const fuel = v.fuel_level ?? v.fuelLevel
      if (typeof fuel === 'number') {
        if (fuel < 15) score -= 15
        else if (fuel < 30) score -= 8
      }
      // Penalize non-active status
      const st = (v.status || '').toLowerCase()
      if (st === 'maintenance') score -= 20
      else if (st === 'inactive' || st === 'retired' || st === 'offline') score -= 25
      // Penalize high mileage (over 150k)
      const miles = v.mileage ?? v.odometer ?? 0
      if (miles > 200000) score -= 15
      else if (miles > 150000) score -= 8
      else if (miles > 100000) score -= 3

      return Math.max(10, Math.min(100, score))
    })

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
    const openWOs = workOrders.filter(
      (wo: any) => wo.status !== 'completed' && wo.status !== 'cancelled'
    )
    const totalDowntimeHours = workOrders.reduce((sum: number, wo: any) =>
      sum + Number(wo.downtimeHours || wo.downtime_hours || 0), 0)
    const emergencyCount = workOrders.filter(
      (wo: any) => wo.type === 'emergency' || wo.priority === 'urgent' || wo.priority === 'critical'
    ).length
    return { openWorkOrders: openWOs.length, totalDowntimeHours: Math.round(totalDowntimeHours), emergencyCount }
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
      const lastTest = d.drug_test_date ?? d.drug_test ?? d.drugTest ?? d.last_drug_test ?? d.lastDrugTest
      if (!lastTest) return false // No data available -- don't flag as overdue
      try { return new Date(lastTest) < twelveMonthsAgo } catch { return false }
    }).length
    return { expiringRegistrations, expiringMedicalCards, overdueDrugTests, totalAlerts: expiringRegistrations + expiringMedicalCards + overdueDrugTests }
  }, [vehicles, drivers])

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
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
    fill: name === 'preventive' ? '#10B981' : name === 'corrective' ? '#00CCFE' : name === 'emergency' ? '#FF4300' : name === 'inspection' ? '#FDC016' : '#1F3076',
  }))
  const healthDistributionData = [
    { name: 'Excellent (90+)', value: fleetHealth.excellent, fill: '#10B981' },
    { name: 'Good (70-89)', value: fleetHealth.good, fill: '#00CCFE' },
    { name: 'Fair (50-69)', value: fleetHealth.fair, fill: '#FDC016' },
    { name: 'Poor (<50)', value: fleetHealth.poor, fill: '#FF4300' },
  ].filter(d => d.value > 0)
  const hosChartData = [
    { name: 'Driving', value: hosCompliance.statuses.driving, fill: '#10B981' },
    { name: 'On Duty', value: hosCompliance.statuses.on_duty, fill: '#00CCFE' },
    { name: 'Off Duty', value: hosCompliance.statuses.off_duty, fill: '#2A1878' },
    { name: 'Sleeper', value: hosCompliance.statuses.sleeper, fill: '#1F3076' },
  ].filter(d => d.value > 0)

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* ROW 1: TOP-LEVEL KPI SUMMARY */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard title="Fleet Utilization" value={`${(fleetStats?.totalVehicles ?? 0) > 0 ? Math.round(((fleetStats?.activeVehicles ?? 0) / (fleetStats?.totalVehicles ?? 1)) * 100) : 0}%`} icon={Gauge}
          description={`${fleetStats?.activeVehicles ?? 0} active of ${fleetStats?.totalVehicles ?? vehicles.length} vehicles`}
          trend={(fleetStats?.totalVehicles ?? 0) > 0 && ((fleetStats?.activeVehicles ?? 0) / (fleetStats?.totalVehicles ?? 1)) >= 0.7 ? 'up' : 'neutral'}
          loading={loading} />
        <StatCard title="Avg Safety Score" value={safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : '—'} icon={Shield}
          description={`${safetyMetrics.needsAttention} drivers need attention`}
          trend={safetyMetrics.avgSafety >= 80 ? 'up' : safetyMetrics.avgSafety >= 60 ? 'neutral' : 'down'}
          loading={loading} />
        <StatCard title="Open Work Orders" value={maintenanceOverview.openWorkOrders} icon={ClipboardList}
          description={`${maintenanceOverview.emergencyCount} emergency · ${maintenanceOverview.totalDowntimeHours}h downtime`}
          trend={maintenanceOverview.emergencyCount > 3 ? 'down' : 'neutral'}
          loading={loading} />
        <StatCard title="Compliance Alerts" value={complianceAlerts.totalAlerts} icon={ShieldAlert}
          description="Items requiring attention"
          trend={complianceAlerts.totalAlerts > 5 ? 'down' : complianceAlerts.totalAlerts > 0 ? 'neutral' : 'up'}
          loading={loading} />
      </div>

      {/* Attention Required Banner */}
      {(maintenanceOverview.emergencyCount > 0 || complianceAlerts.totalAlerts > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 rounded border border-[rgba(255,67,0,0.3)] bg-[rgba(255,67,0,0.08)]">
          <div className="flex items-center gap-2">
            <Siren className="h-5 w-5 text-[#FF4300]" />
            <div>
              <p className="text-xs font-semibold text-[#FF4300]">{maintenanceOverview.emergencyCount}</p>
              <p className="text-xs text-[rgba(255,255,255,0.40)]">Emergency WOs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[#FDC016]" />
            <div>
              <p className="text-xs font-semibold text-[#FDC016]">{complianceAlerts.expiringRegistrations}</p>
              <p className="text-xs text-[rgba(255,255,255,0.40)]">Expiring Registrations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#FDC016]" />
            <div>
              <p className="text-xs font-semibold text-[#FDC016]">{complianceAlerts.expiringMedicalCards}</p>
              <p className="text-xs text-[rgba(255,255,255,0.40)]">Expiring Med Cards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#FDC016]" />
            <div>
              <p className="text-xs font-semibold text-[#FDC016]">{complianceAlerts.overdueDrugTests}</p>
              <p className="text-xs text-[rgba(255,255,255,0.40)]">Overdue Drug Tests</p>
            </div>
          </div>
        </div>
      )}

      {/* ROW 2: FLEET HEALTH + HOS COMPLIANCE */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Fleet Health Overview</span>} description="Vehicle health score distribution" icon={<HeartPulse className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <GaugeChart title="Fleet Health" value={fleetHealth.avgScore} size={90} height={110} />
              <div className="flex-1 flex flex-col gap-1">
                <p className="text-xs text-[rgba(255,255,255,0.40)]">{fleetHealth.totalWithScores} of {vehicles.length} vehicles with scores</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Excellent', count: fleetHealth.excellent, color: 'text-[#00CCFE]' },
                { label: 'Good', count: fleetHealth.good, color: 'text-white' },
                { label: 'Fair', count: fleetHealth.fair, color: 'text-[#FDC016]' },
                { label: 'Poor', count: fleetHealth.poor, color: 'text-[#FF4300]' },
              ].map(item => (
                <div key={item.label} className="text-center rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5">
                  <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
            {healthDistributionData.length > 0 && (
              <ResponsivePieChart title="Health Distribution" data={healthDistributionData} height={120} innerRadius={30} showPercentages compact />
            )}
          </div>
        </Section>

        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>HOS Compliance</span>} description="Hours of Service status" icon={<Timer className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Driving', value: hosCompliance.statuses.driving, icon: Activity },
                { label: 'On Duty', value: hosCompliance.statuses.on_duty, icon: UserCheck },
                { label: 'Off Duty', value: hosCompliance.statuses.off_duty, icon: Clock },
                { label: 'Sleeper', value: hosCompliance.statuses.sleeper, icon: BedDouble },
              ].map(item => (
                <div key={item.label} className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <item.icon className="h-3 w-3 text-[rgba(255,255,255,0.40)]" />
                    <span className="text-[10px] text-[rgba(255,255,255,0.40)]">{item.label}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Total Hours Available</p>
                  <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Across all active drivers</p>
                </div>
                <p className="text-sm font-bold text-white">{formatNumber(hosCompliance.totalHoursAvailable)}h</p>
              </div>
            </div>
            {hosChartData.length > 0 && (
              <ResponsivePieChart title="HOS Status Distribution" data={hosChartData} height={120} innerRadius={30} showPercentages compact />
            )}
          </div>
        </Section>

        {/* ROW 3: SAFETY METRICS + DEPARTMENT UTILIZATION */}
        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Safety Metrics</span>} description="Driver safety scoring" icon={<Shield className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className={`text-xl font-bold ${getScoreColor(safetyMetrics.avgSafety)}`}>
                  {safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : '--'}
                </span>
                <span className="text-xs text-[rgba(255,255,255,0.40)] ml-1">/ 100</span>
              </div>
              <div className="flex-1">
                <ProgressBar value={safetyMetrics.avgSafety} color={getBarColor(safetyMetrics.avgSafety)} />
              </div>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.40)]">Across {safetyMetrics.totalDrivers} drivers</p>
            {safetyMetrics.needsAttention > 0 && (
              <Alert variant="destructive" className="border-[rgba(255,67,0,0.4)]">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-[#FF4300]">
                  <span className="font-semibold">{safetyMetrics.needsAttention} driver{safetyMetrics.needsAttention !== 1 ? 's' : ''}</span> with safety score below 70 -- requires review
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Excellent', color: 'text-[#00CCFE]', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) >= 90).length },
                { label: 'Good', color: 'text-white', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 70 && s < 90 }).length },
                { label: 'Fair', color: 'text-[#FDC016]', count: drivers.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 50 && s < 70 }).length },
                { label: 'Poor', color: 'text-[#FF4300]', count: drivers.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) < 50).length },
              ].map(item => (
                <div key={item.label} className="text-center rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5">
                  <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.count}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Department Utilization</span>} description="Vehicle count and uptime by department" icon={<Building2 className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            {departmentChartData.length > 0 ? (
              <ResponsiveBarChart title="Vehicles by Department" data={departmentChartData} dataKey="count" height={150} showValues compact />
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No department data available</div>
            )}
          </div>
        </Section>

        {/* ROW 4: MAINTENANCE OVERVIEW + COMPLIANCE ALERTS */}
        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Maintenance Overview</span>} description="Work orders, downtime, and categories" icon={<Wrench className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
                <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Open WOs</p>
                <p className="text-sm font-bold text-white">{maintenanceOverview.openWorkOrders}</p>
              </div>
              <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
                <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Downtime</p>
                <p className="text-sm font-bold text-white">{maintenanceOverview.totalDowntimeHours}h</p>
              </div>
              <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
                <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Emergency</p>
                <p className="text-sm font-bold text-[#FF4300]">{maintenanceOverview.emergencyCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'In Progress', value: maintenanceMetrics?.inProgress ?? 0 },
                { label: 'Pending', value: maintenanceMetrics?.pendingOrders ?? 0 },
                { label: 'Parts Wait', value: maintenanceMetrics?.partsWaiting ?? 0 },
                { label: 'Done Today', value: maintenanceMetrics?.completedToday ?? 0 },
              ].map(item => (
                <div key={item.label} className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
                  <span className="text-[10px] text-[rgba(255,255,255,0.40)] block">{item.label}</span>
                  <span className="text-xs font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
            {woTypeChartData.length > 0 && (
              <ResponsivePieChart title="Work Orders by Category" data={woTypeChartData} height={120} innerRadius={35} showPercentages compact />
            )}
          </div>
        </Section>

        <Section title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Compliance Alerts</span>} description="Expiring certifications and overdue items" icon={<Siren className="h-4 w-4" />}>
          <div className="flex flex-col gap-2">
            {complianceAlerts.totalAlerts === 0 ? (
              <div className="flex flex-col items-center justify-center h-20 text-center">
                <CheckCircle className="h-6 w-6 text-[#10B981] mb-1" />
                <p className="text-sm font-medium text-white">All Clear</p>
                <p className="text-xs text-[rgba(255,255,255,0.40)]">No compliance alerts at this time</p>
              </div>
            ) : (
              <>
                {[
                  { icon: Car, title: 'Registration Expiry', desc: 'Vehicles expiring within 30 days', count: complianceAlerts.expiringRegistrations, severity: 'amber' as const, category: 'registration' },
                  { icon: UserIcon, title: 'Medical Card Expiry', desc: 'Drivers expiring within 30 days', count: complianceAlerts.expiringMedicalCards, severity: 'amber' as const, category: 'medical-card' },
                  { icon: ShieldAlert, title: 'Drug Test Overdue', desc: 'Last test over 12 months ago', count: complianceAlerts.overdueDrugTests, severity: 'red' as const, category: 'drug-test' },
                ].map(alert => (
                  <div
                    key={alert.title}
                    className={`rounded border p-2 cursor-pointer transition-colors hover:bg-[#2A1878] ${
                      alert.count > 0
                        ? alert.severity === 'red'
                          ? 'border-[rgba(255,67,0,0.4)] bg-[rgba(255,67,0,0.12)]'
                          : 'border-[rgba(253,192,22,0.3)] bg-[rgba(253,192,22,0.1)]'
                        : 'border-[rgba(0,204,254,0.08)] bg-[#221060]'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => push({ type: 'compliance-item', label: alert.title, data: { category: alert.category, alertType: alert.title } })}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ type: 'compliance-item', label: alert.title, data: { category: alert.category, alertType: alert.title } }); } }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <alert.icon className={`h-4 w-4 ${
                          alert.count > 0
                            ? alert.severity === 'red' ? 'text-[#FF4300]' : 'text-[#FDC016]'
                            : 'text-[rgba(255,255,255,0.40)]'
                        }`} />
                        <div>
                          <p className="text-xs font-medium text-white">{alert.title}</p>
                          <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{alert.desc}</p>
                        </div>
                      </div>
                      <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'}>{alert.count}</Badge>
                    </div>
                  </div>
                ))}
                <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">Total Compliance Issues</p>
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
  const { vehicles, metrics: stats, statusDistribution, lowFuelVehicles, highMileageVehicles, makeDistribution, isLoading: loading, error } = useReactiveFleetData()
  const { user } = useAuth()
  const { push } = useDrilldown()

  const safeStats = stats || {
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    idleVehicles: 0,
    averageFuelLevel: 0,
    totalMileage: 0
  }

  const avgHealthScore = useMemo(() => {
    if (vehicles.length === 0) return null
    // Use DB health_score when available, otherwise synthesize
    const scores = vehicles.map((v: any) => {
      const dbScore = v.health_score ?? v.healthScore
      if (dbScore != null && !Number.isNaN(Number(dbScore))) return Number(dbScore)
      // Synthesize from available data
      let score = 80
      const fuel = v.fuel_level ?? v.fuelLevel
      if (typeof fuel === 'number') {
        if (fuel < 15) score -= 15
        else if (fuel < 30) score -= 8
      }
      const st = (v.status || '').toLowerCase()
      if (st === 'maintenance') score -= 20
      else if (st === 'inactive' || st === 'retired' || st === 'offline') score -= 25
      const miles = v.mileage ?? v.odometer ?? 0
      if (miles > 200000) score -= 15
      else if (miles > 150000) score -= 8
      else if (miles > 100000) score -= 3
      return Math.max(10, Math.min(100, score))
    })
    const total = scores.reduce((sum: number, s: number) => sum + s, 0)
    return Math.round(total / scores.length)
  }, [vehicles])

  const statusBreakdownText = useMemo(() => {
    if (statusDistribution.length === 0) return ''
    return statusDistribution.map(s => `${s.name}: ${s.value}`).join(' | ')
  }, [statusDistribution])

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
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

  const handleAddVehicle = async () => {
    // Refresh fleet data after adding a vehicle
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* Header with Add Vehicle */}
      <div className="flex items-center justify-end">
        <AddVehicleDialog onAdd={handleAddVehicle} />
      </div>

      {/* Fleet Statistics */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Total Vehicles"
          value={safeStats.totalVehicles}
          icon={Car}
          description={statusBreakdownText || 'Active fleet count'}
          loading={loading}
          sparklineData={statusDistribution.map(s => ({ value: s.value }))}
        />
        <StatCard
          title="Active Vehicles"
          value={safeStats.activeVehicles}
          icon={Gauge}
          description="Currently in use"
          loading={loading}
        />
        <StatCard
          title="Fleet Health"
          value={avgHealthScore != null ? `${avgHealthScore}%` : '—'}
          icon={HeartPulse}
          trend={avgHealthScore != null ? (avgHealthScore >= 80 ? 'up' : avgHealthScore >= 60 ? 'neutral' : 'down') : 'neutral'}
          description="Avg health score"
          loading={loading}
        />
        <StatCard
          title="Avg Fuel Level"
          value={`${formatNumber(safeStats.averageFuelLevel || 0, 1)}%`}
          icon={Fuel}
          description="Fleet average"
          loading={loading}
        />
      </div>

      {/* Fleet Alerts */}
      {(lowFuelVehicles.length > 0 || highMileageVehicles.length > 0) && (
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Fleet Alerts</span>}
          description={`${lowFuelVehicles.length + highMileageVehicles.length} vehicles need attention`}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <div className="flex flex-col gap-1">
            {lowFuelVehicles.slice(0, 5).map((v: any) => (
              <div
                key={`fuel-${v.id}`}
                className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2 cursor-pointer hover:bg-[#2A1878] transition-colors"
                onClick={() => push({
                  type: 'vehicle-details',
                  label: formatVehicleName(v),
                  data: { vehicleId: String(v.id), vehicle: v },
                })}
              >
                <div className="flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 text-[#FDC016]" />
                  <div>
                    <p className="text-xs font-medium text-white">
                      {formatVehicleName(v)}
                    </p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Fuel: {v.fuel_level != null ? `${v.fuel_level}%` : 'N/A'}</p>
                  </div>
                </div>
                <Badge variant={v.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0">
                  {v.severity === 'high' ? 'Critical' : 'Warning'}
                </Badge>
              </div>
            ))}
            {highMileageVehicles.slice(0, 5).map((v: any) => (
              <div
                key={`mile-${v.id}`}
                className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2 cursor-pointer hover:bg-[#2A1878] transition-colors"
                onClick={() => push({
                  type: 'vehicle-details',
                  label: formatVehicleName(v),
                  data: { vehicleId: String(v.id), vehicle: v },
                })}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-[#FDC016]" />
                  <div>
                    <p className="text-xs font-medium text-white">
                      {formatVehicleName(v)}
                    </p>
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Mileage: {formatNumber(v.mileage)} mi</p>
                  </div>
                </div>
                <Badge variant={v.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0">
                  {v.severity === 'high' ? 'Critical' : 'Warning'}
                </Badge>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Main content area - scrollable with auto-height children */}
      <div className="flex flex-col gap-1.5">
        {/* Live Fleet Tracking - give map a proper height */}
        <div className="shrink-0" style={{ minHeight: '400px' }}>
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Live Fleet Tracking</span>}
            description="Real-time vehicle locations and status"
            icon={<MapPin className="h-4 w-4" />}
            className="h-full"
            contentClassName="!overflow-hidden"
          >
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-[350px]" />}>
                <div className="h-[380px]">
                  <LiveFleetDashboard />
                </div>
              </Suspense>
            </ErrorBoundary>
          </Section>
        </div>

        {/* Vehicle Telemetry - allow content to flow naturally */}
        <div className="shrink-0">
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Vehicle Telemetry</span>}
            description="Performance metrics and diagnostics"
            icon={<Gauge className="h-4 w-4" />}
            className="overflow-visible"
            contentClassName="!overflow-visible"
          >
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-48" />}>
                <VehicleTelemetry />
              </Suspense>
            </ErrorBoundary>
          </Section>
        </div>

        {/* Virtual Garage - allow content to flow naturally */}
        <div className="shrink-0">
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Virtual Garage</span>}
            description="3D vehicle models and inventory"
            icon={<Car className="h-4 w-4" />}
            className="overflow-visible"
            contentClassName="!overflow-visible"
          >
            <ErrorBoundary>
              <Suspense fallback={<Skeleton className="h-64" />}>
                <VirtualGarage />
              </Suspense>
            </ErrorBoundary>
          </Section>
        </div>

        {(user?.role === 'Admin' || user?.role === 'Manager' || user?.role === 'SuperAdmin') && (
          <div className="shrink-0">
            <Section
              title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>EV Charging Management</span>}
              description="Electric vehicle charging stations and schedules"
              icon={<Plug className="h-4 w-4" />}
              className="overflow-visible"
              contentClassName="!overflow-visible"
            >
              <ErrorBoundary>
                <Suspense fallback={<Skeleton className="h-48" />}>
                  <EVChargingManagement />
                </Suspense>
              </ErrorBoundary>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Drivers Tab - Driver management and performance
 */
const DriversTabContent = memo(function DriversTabContent() {
  const { drivers, topPerformers, performanceTrend, metrics: stats, lowSafetyDrivers, driversWithViolations, expiringLicenses, isLoading: loading, error } = useReactiveDriversData()
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
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
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
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* Driver Statistics */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Total Drivers"
          value={safeStats.totalDrivers}
          icon={Users}
          description="Active driver pool"
          loading={loading}
        />
        <StatCard
          title="On Duty"
          value={safeStats.activeDrivers}
          icon={UserIcon}
          description="Currently working"
          loading={loading}
        />
        <StatCard
          title="Avg Safety Score"
          value={computedAvgSafetyScore}
          icon={Shield}
          trend={computedAvgSafetyScore >= 80 ? 'up' : computedAvgSafetyScore >= 60 ? 'neutral' : 'down'}
          description="From driver safety scores"
          loading={loading}
          sparklineData={performanceTrend.map(p => ({ value: p.avgScore }))}
        />
        <StatCard
          title="HOS Driving"
          value={driversDrivingCount}
          icon={Activity}
          description="Currently driving"
          loading={loading}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Driver Performance Trends</span>}
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
                violations: point.violations
              }))}
              dataKeys={['safety_score', 'violations']}
              colors={['#00CCFE', '#FF4300']}
              height={120}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No performance trend data available</div>
          )}
        </Section>

        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Top Performers</span>}
          description="Drivers with highest safety scores"
          icon={<Award className="h-4 w-4" />}
        >
          {topPerformers.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {topPerformers.slice(0, 5).map((driver: any, index) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${driver.name}`}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[rgba(0,204,254,0.06)] text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white">{driver.name}</p>
                        {(driver.employment_type || driver.employmentType) && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {formatEnum(driver.employment_type || driver.employmentType)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{driver.licenseNumber}</p>
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
                      <p className="text-xs font-semibold text-white">{driver.safetyScore || 0}/100</p>
                    </div>
                  </div>
                </div>
              ))}
              {topPerformers.length > 5 && (
                <Button variant="outline" size="sm" className="w-full mt-1 text-xs" onClick={() => push({ type: 'drivers-list', label: 'All Top Performers', data: { filter: 'top-performers' } })}>
                  View All ({topPerformers.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No records found</div>
          )}
        </Section>
      </div>

      {/* Drivers Needing Attention */}
      {(lowSafetyDrivers.length > 0 || driversWithViolations.length > 0 || expiringLicenses.length > 0) && (
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Drivers Needing Attention</span>}
          description={`${lowSafetyDrivers.length + driversWithViolations.length + expiringLicenses.length} items requiring review`}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <div className="grid grid-cols-3 gap-1.5">
            {/* Low Safety Scores */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-[rgba(255,255,255,0.40)] font-medium mb-0.5">Low Safety Scores ({lowSafetyDrivers.length})</p>
              {lowSafetyDrivers.slice(0, 3).map((driver: any) => (
                <div
                  key={`safety-${driver.id}`}
                  className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 cursor-pointer hover:bg-[#2A1878] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Score: {driver.safetyScore}</p>
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">Low</Badge>
                  </div>
                </div>
              ))}
            </div>
            {/* Violations */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-[rgba(255,255,255,0.40)] font-medium mb-0.5">With Violations ({driversWithViolations.length})</p>
              {driversWithViolations.slice(0, 3).map((driver: any) => (
                <div
                  key={`viol-${driver.id}`}
                  className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 cursor-pointer hover:bg-[#2A1878] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{driver.violationCount} violations</p>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Review</Badge>
                  </div>
                </div>
              ))}
            </div>
            {/* Expiring Licenses */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-[rgba(255,255,255,0.40)] font-medium mb-0.5">Expiring Licenses ({expiringLicenses.length})</p>
              {expiringLicenses.slice(0, 3).map((driver: any) => (
                <div
                  key={`lic-${driver.id}`}
                  className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 cursor-pointer hover:bg-[#2A1878] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Exp: {formatDate(driver.licenseExpiry)}</p>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Expiring</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </div>
  )
})

/**
 * Operations Tab - Dispatch, routing, fuel management
 */
const OperationsTabContent = memo(function OperationsTabContent() {
  const { routes, fuelTransactions, metrics: stats, completionTrendData, fuelConsumptionData, delayedRoutes, avgFuelCostPerMile, isLoading: loading, error } = useReactiveOperationsData()
  const { vehicles: fleetVehicles } = useReactiveFleetData()
  const { push } = useDrilldown()

  const vehicleNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    fleetVehicles.forEach((v: any) => {
      const id = String(v.id)
      const name = v.unit_number || v.unitNumber || formatVehicleName({ year: v.year, make: v.make, model: v.model })
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
    return formatNumber(total / txWithMpg.length, 1)
  }, [fuelTransactions])

  if (loading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
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
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* Operations Statistics */}
      <div className="grid grid-cols-5 gap-1.5">
        <StatCard
          title="Active Routes"
          value={safeStats.activeJobs}
          icon={RouteIcon}
          description="In progress"
          loading={loading}
        />
        <StatCard
          title="Pending Tasks"
          value={safeStats.openTasks}
          icon={CheckSquare}
          description="Need assignment"
          loading={loading}
        />
        <StatCard
          title="Total Fuel Cost"
          value={formatCurrency(safeStats.totalFuelCost || 0)}
          icon={Fuel}
          description="Total fuel spend"
          loading={loading}
          sparklineData={fuelConsumptionData.map(d => ({ value: Number(d.cost) || 0 }))}
        />
        <StatCard
          title="Completion Rate"
          value={`${formatNumber(safeStats.completionRate, 1)}%`}
          icon={TrendingUp}
          description="Route completion"
          loading={loading}
          sparklineData={completionTrendData.map(d => ({ value: Number(d.completed) || 0 }))}
        />
        <StatCard
          title="Avg MPG"
          value={avgMpg ?? '—'}
          icon={Gauge}
          loading={loading}
          description="Fleet fuel efficiency"
        />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Route Completion Trend</span>}
          description="Completed routes over the past 7 days"
          icon={<LineChart className="h-4 w-4" />}
        >
          {completionTrendData.length > 0 ? (
            <ResponsiveLineChart
              title="Route Completion"
              data={completionTrendData}
              dataKeys={['completed', 'target']}
              colors={['#00CCFE', 'rgba(255,255,255,0.40)']}
              height={120}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No trend data available</div>
          )}
        </Section>
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Fuel Consumption</span>}
          description="Daily fuel usage over the past 7 days"
          icon={<Fuel className="h-4 w-4" />}
        >
          {fuelConsumptionData.length > 0 ? (
            <ResponsiveBarChart
              title="Fuel Consumption"
              data={fuelConsumptionData}
              dataKey="gallons"
              height={120}
              showValues
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No fuel data available</div>
          )}
        </Section>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-1.5">
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>{`Active Routes (${routes.length})`}</span>}
          description="Real-time route tracking"
          icon={<Map className="h-4 w-4" />}
        >
          {routes.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {routes.slice(0, 5).map(route => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${route.name || 'Route'}`}
                  onClick={() => push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-[rgba(255,255,255,0.40)]" />
                    <div>
                      <p className="text-xs font-semibold text-white">{route.name || `${formatEnum(route.routeType || 'route')} Route`}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                        {route.originName || 'Origin'} to {route.destinationName || 'Destination'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={route.status === 'in_transit' ? 'default' : 'secondary'} className="text-[10px] px-1 py-0">
                    {formatEnum(route.status)}
                  </Badge>
                </div>
              ))}
              {routes.length > 5 && (
                <Button variant="outline" size="sm" className="w-full mt-1 text-xs" onClick={() => push({ type: 'routes-list', label: 'All Routes', data: {} })}>
                  View All ({routes.length})
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No active routes</div>
          )}
        </Section>

        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Recent Fuel Transactions</span>}
          description="Latest fuel purchases and costs"
          icon={<Fuel className="h-4 w-4" />}
        >
          {fuelTransactions.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {fuelTransactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-white">
                        {vehicleNameMap[transaction.vehicleId] || 'Unknown Vehicle'}
                      </p>
                      {(transaction.station_brand || transaction.stationBrand) && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {transaction.station_brand || transaction.stationBrand}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                      {transaction.amount} gal @ {formatCurrency(transaction.pricePerUnit || 0)}/gal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white">{formatCurrency(transaction.cost)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{transaction.location || '—'}</p>
                      {(transaction.mpg_calculated || transaction.mpgCalculated) && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {formatNumber(Number(transaction.mpg_calculated || transaction.mpgCalculated), 1)} MPG
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No fuel transactions</div>
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
  const { workOrders, metrics, predictions, highConfidencePredictions, predictiveMetrics, requests, requestMetrics, isLoading, errors } = useReactiveMaintenanceData()
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

  const [woStatusFilter, setWoStatusFilter] = useState<string | null>(null)

  const openOrders = workOrders.filter(order =>
    order.status !== 'completed' && order.status !== 'cancelled'
  )

  const woStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    openOrders.forEach((o: any) => { counts[o.status || 'pending'] = (counts[o.status || 'pending'] || 0) + 1 })
    return counts
  }, [openOrders])

  const filteredOrders = woStatusFilter
    ? openOrders.filter((o: any) => o.status === woStatusFilter) : openOrders

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
      .slice(0, 5)
  }, [workOrders])


  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
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
    push({ type: 'work-order-create', label: 'New Work Order', data: {} })
  }

  const handleViewWorkOrder = (workOrderId: string) => {
    push({ id: workOrderId, type: 'workOrder', label: 'Work Order', data: { workOrderId } })
  }

  const handleScheduleMaintenance = (vehicleId: string) => {
    push({ type: 'work-order-create', label: 'Schedule Maintenance', data: { vehicleId, createType: 'preventive' } })
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* Maintenance Statistics */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Open Work Orders"
          value={openOrders.length}
          icon={ClipboardList}
          description={`${safeMetrics.inProgress} in progress · ${safeMetrics.pendingOrders} pending`}
          loading={isLoading}
        />
        <StatCard
          title="Urgent Orders"
          value={safeMetrics.urgentOrders}
          icon={AlertTriangle}
          description="Needs immediate attention"
          trend={safeMetrics.urgentOrders > 3 ? 'down' : safeMetrics.urgentOrders > 0 ? 'neutral' : 'up'}
          loading={isLoading}
        />
        <StatCard
          title="Total Downtime"
          value={`${formatNumber(totalDowntimeHours, 1)} hrs`}
          icon={Timer}
          trend={totalDowntimeHours > 100 ? 'down' : 'neutral'}
          description="Sum of downtime hours"
          loading={isLoading}
        />
        <StatCard
          title="Parts Inventory"
          value={formatCurrency(inventoryMetrics?.totalValue || 0)}
          icon={Package}
          description="Current stock value"
          loading={isLoading}
        />
      </div>

      {/* Cost Breakdown Row */}
      {(costBreakdown.partsCost > 0 || costBreakdown.laborCost > 0) && (
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
            <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Total Cost</p>
            <p className="text-sm font-bold text-white">{formatCurrency(safeMetrics.totalCost)}</p>
          </div>
          <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
            <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Parts Cost</p>
            <p className="text-sm font-bold text-white">{formatCurrency(costBreakdown.partsCost)}</p>
          </div>
          <div className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 text-center">
            <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Labor Cost</p>
            <p className="text-sm font-bold text-white">{formatCurrency(costBreakdown.laborCost)}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col gap-1.5">
        {/* Active Work Orders */}
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Active Work Orders</span>}
          description="Current maintenance tasks and their status"
          icon={<ClipboardList className="h-4 w-4" />}
          actions={
            <Button size="sm" onClick={handleCreateWorkOrder}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Work Order
            </Button>
          }
        >
          {/* Status filter pills */}
          <div className="flex gap-1 mb-2 flex-wrap">
            <Badge variant={!woStatusFilter ? 'default' : 'outline'} className="cursor-pointer text-[10px]"
              onClick={() => setWoStatusFilter(null)}>All ({openOrders.length})</Badge>
            {Object.entries(woStatusCounts).map(([status, count]) => (
              <Badge key={status} variant={woStatusFilter === status ? 'default' : 'outline'}
                className="cursor-pointer text-[10px]" onClick={() => setWoStatusFilter(status)}>
                {formatEnum(status)} ({count})
              </Badge>
            ))}
          </div>
          {filteredOrders.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 max-h-96">
              {filteredOrders.slice(0, 10).map((order: any) => (
                <div key={order.id} className={`flex items-center justify-between rounded border p-2 ${
                  order.is_emergency || order.isEmergency ? 'border-[rgba(255,67,0,0.4)] bg-[rgba(255,67,0,0.12)]' : 'border-[rgba(0,204,254,0.08)] bg-[#221060]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Tool className={`h-4 w-4 ${
                      order.priority === 'high' || order.priority === 'urgent' ? 'text-[#FF4300]' :
                      order.priority === 'medium' ? 'text-white' : 'text-[rgba(255,255,255,0.40)]'
                    }`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-white">{order.title || `${formatEnum(order.type || 'maintenance')} Maintenance`}</p>
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
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                        {order.vehicleName || 'Unknown Vehicle'} · Created: {formatDate(order.createdAt)}
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
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No active work orders</div>
          )}
        </Section>

        {/* Schedule + Overdue */}
        <div className="grid grid-cols-2 gap-1.5">
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Upcoming Maintenance</span>}
            description="Scheduled preventive maintenance"
            icon={<Calendar className="h-4 w-4" />}
          >
            {upcomingOrders.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {upcomingOrders.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{maintenance.title || `${formatEnum(maintenance.type || 'maintenance')} Maintenance`}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                        {maintenance.vehicleName || 'Unknown Vehicle'} · {formatDate(maintenance.createdAt)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => push({ id: maintenance.id, type: 'workOrder', label: maintenance.title || 'Work Order', data: { workOrderId: maintenance.id, editMode: true } })}>
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No scheduled maintenance</div>
            )}
          </Section>

          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Overdue Maintenance</span>}
            description="Requires immediate attention"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {overdueOrders.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {overdueOrders.map((overdue: any) => (
                  <Alert key={overdue.id} variant="destructive" className="border-[rgba(255,67,0,0.4)] bg-[rgba(255,67,0,0.15)]">
                    <AlertTriangle className="h-4 w-4 text-[#FF4300]" />
                    <AlertDescription>
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#FF4300] truncate">{overdue.title || `${formatEnum(overdue.type || 'Maintenance')} Maintenance`}</p>
                          <p className="text-[10px] text-[#FF4300]/70">
                            {overdue.vehicleName || 'Unknown Vehicle'} · Overdue by {overdue.daysOverdue} days
                          </p>
                        </div>
                        <Button size="sm" className="h-6 text-[10px] px-2 shrink-0" onClick={() => handleScheduleMaintenance(overdue.vehicleId || overdue.vehicleName)}>
                          Schedule
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No overdue maintenance</div>
            )}
          </Section>
        </div>

        {/* Parts Inventory */}
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Parts Inventory</span>}
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
                  <div key={item.id || item.partNumber || item.name} className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-white">{item.name || item.partNumber || 'Part'}</p>
                      <Badge variant={status === 'in-stock' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0">
                        {status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                      Qty: {quantity} {item.unitOfMeasure || item.unit_of_measure || ''} · Reorder: {reorderPoint}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No parts inventory available</div>
          )}
        </Section>

        {/* Predictive Alerts */}
        {highConfidencePredictions.length > 0 && (
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Predictive Alerts</span>}
            description={`${highConfidencePredictions.length} high-confidence predictions`}
            icon={<Activity className="h-4 w-4" />}
          >
            <div className="flex flex-col gap-1">
              {highConfidencePredictions.slice(0, 6).map((prediction: any) => (
                <div key={prediction.id} className={`flex items-center justify-between rounded border p-2 ${
                  prediction.severity === 'critical' ? 'border-[rgba(255,67,0,0.4)] bg-[rgba(255,67,0,0.12)]' :
                  prediction.severity === 'high' ? 'border-[rgba(253,192,22,0.3)] bg-[rgba(253,192,22,0.1)]' :
                  'border-[rgba(0,204,254,0.08)] bg-[#221060]'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 ${
                      prediction.severity === 'critical' ? 'text-[#FF4300]' :
                      prediction.severity === 'high' ? 'text-[#FDC016]' : 'text-[rgba(255,255,255,0.40)]'
                    }`} />
                    <div>
                      <p className="text-xs font-medium text-white">
                        {prediction.vehicleName || 'Unknown Vehicle'} - {prediction.issue || 'Predicted Issue'}
                      </p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                        {prediction.daysUntilFailure} days until failure · Confidence: {prediction.confidence}%
                        {prediction.estimatedCost ? ` · Est. ${formatCurrency(prediction.estimatedCost)}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    prediction.severity === 'critical' ? 'destructive' :
                    prediction.severity === 'high' ? 'default' : 'secondary'
                  } className="text-[10px] px-1 py-0">
                    {formatEnum(prediction.severity)}
                  </Badge>
                </div>
              ))}
            </div>
          </Section>
        )}
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
    lifecycleData,
    highValueAssets,
    lowStockItems,
    outOfStockItems,
    conditionDistribution,
    depreciationByTypeData,
    isLoading,
  } = useReactiveAssetsData()

  const handleViewAsset = (assetId: string) => {
    push({ id: assetId, type: 'asset', label: 'Asset Details', data: { assetId } })
  }

  const handleAddAsset = () => {
    push({ type: 'asset-create', label: 'Add New Asset', data: {} })
  }

  const handleScheduleAssetMaintenance = (assetId: string) => {
    push({ type: 'work-order-create', label: 'Schedule Asset Maintenance', data: { assetId, createType: 'preventive' } })
  }


  const utilizationData = [
    { name: 'In Use', value: statusDistribution.active || 0, fill: '#10B981' },
    { name: 'Available', value: statusDistribution.available || 0, fill: '#00CCFE' },
    { name: 'Maintenance', value: statusDistribution.maintenance || 0, fill: '#FDC016' },
    { name: 'Retired', value: statusDistribution.retired || 0, fill: '#2A1878' },
  ].filter((entry) => entry.value > 0)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* Asset Statistics */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Total Assets"
          value={metrics.totalAssets}
          icon={Box}
          description="Equipment and tools"
          loading={isLoading}
        />
        <StatCard
          title="Assets in Use"
          value={metrics.activeAssets}
          icon={Truck}
          description="Currently deployed"
          loading={isLoading}
        />
        <StatCard
          title="Maintenance Due"
          value={metrics.inMaintenance}
          icon={Wrench}
          description="Needs servicing"
          loading={isLoading}
        />
        <StatCard
          title="Asset Value"
          value={formatCurrency(metrics.totalValue)}
          icon={DollarSign}
          description="Total fleet value"
          loading={isLoading}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-1.5">
        {/* Asset Inventory */}
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Asset Inventory</span>}
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
                  <div key={asset.id} className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-[rgba(255,255,255,0.40)]" />
                      <div>
                        <p className="text-xs font-semibold text-white">{asset.assetTag || asset.name} - {asset.name}</p>
                        <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
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
                          healthScore >= 80 ? 'text-[#00CCFE] bg-[rgba(0,204,254,0.15)]' :
                          healthScore >= 60 ? 'text-[#FDC016] bg-[rgba(253,192,22,0.15)]' :
                          'text-[#FF4300] bg-[rgba(255,67,0,0.15)]'
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
            <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No assets available</div>
          )}
        </Section>

        {/* Utilization + Maintenance Schedule */}
        <div className="grid grid-cols-2 gap-1.5">
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Asset Utilization</span>}
            description="Usage metrics for key assets"
            icon={<BarChart className="h-4 w-4" />}
          >
            {utilizationData.length > 0 ? (
              <ResponsivePieChart
                title="Asset Utilization"
                data={utilizationData}
                height={120}
                compact
              />
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No utilization data available</div>
            )}
          </Section>

          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Asset Maintenance Schedule</span>}
            description="Upcoming asset servicing"
            icon={<Calendar className="h-4 w-4" />}
          >
            {maintenanceRequired.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {maintenanceRequired.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                    <div>
                      <p className="text-xs font-semibold text-white">{maintenance.assetTag || maintenance.name} - {maintenance.name}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
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
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No asset maintenance due</div>
            )}
          </Section>
        </div>

        {/* Asset Categories Breakdown */}
        <Section
          title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Asset Categories</span>}
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
              <div key={cat.name} className="rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-2">
                <p className="text-xs font-semibold text-white">{formatEnum(cat.name)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{cat.count} assets</p>
                  <p className="text-[10px] font-semibold text-white">{cat.value ? formatCurrency(cat.value) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Asset Lifecycle + High-Value Assets + Low Stock */}
        <div className="grid grid-cols-3 gap-1.5">
          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Asset Lifecycle</span>}
            description="Age distribution of assets"
            icon={<Clock className="h-4 w-4" />}
          >
            {(() => {
              const lcData = [
                { name: 'New (<1yr)', value: lifecycleData.new, fill: '#10B981' },
                { name: 'Operational (1-5yr)', value: lifecycleData.operational, fill: '#00CCFE' },
                { name: 'Aging (5-10yr)', value: lifecycleData.aging, fill: '#FDC016' },
                { name: 'End of Life (10yr+)', value: lifecycleData.endOfLife, fill: '#FF4300' },
              ].filter(d => d.value > 0)
              return lcData.length > 0 ? (
                <ResponsivePieChart title="Lifecycle" data={lcData} height={120} innerRadius={30} showPercentages compact />
              ) : (
                <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No lifecycle data</div>
              )
            })()}
          </Section>

          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>High-Value Assets</span>}
            description="Top assets by current value"
            icon={<DollarSign className="h-4 w-4" />}
          >
            {highValueAssets.length > 0 ? (
              <div className="flex flex-col gap-1">
                {highValueAssets.slice(0, 5).map((asset: any) => (
                  <div key={asset.id} className="flex items-center justify-between rounded border border-[rgba(0,204,254,0.08)] bg-[#221060] p-1.5 cursor-pointer hover:bg-[#2A1878] transition-colors"
                    role="button" tabIndex={0}
                    onClick={() => handleViewAsset(asset.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewAsset(asset.id); } }}
                  >
                    <div>
                      <p className="text-xs font-medium text-white truncate">{asset.name}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{formatEnum(asset.type)} · {formatEnum(asset.condition)}</p>
                    </div>
                    <p className="text-xs font-semibold text-white">{formatCurrency(asset.currentValue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">No assets</div>
            )}
          </Section>

          <Section
            title={<span style={{ fontFamily: '"Montserrat", sans-serif' }}>Low Stock Alert</span>}
            description="Inventory items at or below reorder point"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {lowStockItems.length > 0 || outOfStockItems.length > 0 ? (
              <div className="flex flex-col gap-1">
                {outOfStockItems.slice(0, 3).map((item: any) => (
                  <div key={`oos-${item.id}`} className="flex items-center justify-between rounded border border-[rgba(255,67,0,0.4)] bg-[rgba(255,67,0,0.12)] p-1.5">
                    <div>
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">{item.category}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">Out of Stock</Badge>
                  </div>
                ))}
                {lowStockItems.slice(0, 3).map((item: any) => (
                  <div key={`low-${item.id}`} className="flex items-center justify-between rounded border border-[rgba(253,192,22,0.3)] bg-[rgba(253,192,22,0.1)] p-1.5">
                    <div>
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">Qty: {item.quantity} / Reorder: {item.reorderPoint}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Low Stock</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-[rgba(255,255,255,0.40)] text-sm">All stock levels OK</div>
            )}
          </Section>
        </div>
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
    { id: 'assignments', label: 'Assignments', icon: UserCheck, testId: 'hub-tab-assignments' },
    { id: 'reservations', label: 'Reservations', icon: CalendarCheck, testId: 'hub-tab-reservations' },
    { id: 'drivers', label: 'Drivers', icon: Users, testId: 'hub-tab-drivers' },
    { id: 'operations', label: 'Operations', icon: OperationsIcon, testId: 'hub-tab-operations' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, testId: 'hub-tab-maintenance' },
    { id: 'assets', label: 'Assets', icon: Box, testId: 'hub-tab-assets' },
  ]

  return (
    <HubPage
      title={<span style={{ fontFamily: '"Cinzel", Georgia, serif' }}>Fleet Command</span>}
      description="Comprehensive fleet management, driver tracking, and operations control"
      icon={<Car className="h-5 w-5" />}
      className="cta-hub bg-[#1A0648]"
    >
      <div className="flex flex-col h-full gap-1.5 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex items-center gap-0.5 overflow-x-auto pb-0.5 border-b border-[rgba(0,204,254,0.08)] cta-tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-testid={tab.testId}
                className={`
                  relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg cta-tab
                  transition-colors whitespace-nowrap shrink-0
                  ${isActive
                    ? 'bg-[#332090] text-white shadow-md border-b-2 border-b-[#00CCFE] cta-tab--active'
                    : 'text-[rgba(255,255,255,0.40)] hover:text-white hover:bg-[#2A1878]'
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
        <div className="flex-1 min-h-0 overflow-y-auto">
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
          {activeTab === 'assignments' && (
            <QueryErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-40" /></div>}>
                <VehicleAssignmentManagement />
              </Suspense>
            </QueryErrorBoundary>
          )}
          {activeTab === 'reservations' && (
            <QueryErrorBoundary>
              <Suspense fallback={<div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-40" /></div>}>
                <ReservationCalendarView />
              </Suspense>
            </QueryErrorBoundary>
          )}
        </div>
      </div>
    </HubPage>
  )
}
