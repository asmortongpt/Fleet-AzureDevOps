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
 * Redesigned with VerticalTabs sidebar navigation and HeroMetrics strip.
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
import { HeroMetrics, type HeroMetric } from '@/components/ui/hero-metrics'
import { Section } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'
import { VerticalTabs, type VTab } from '@/components/ui/vertical-tabs'
import {
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
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
    <div className="h-2 bg-white/10 rounded-full">
      <div className={`h-2 ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-400'
  if (score >= 70) return 'text-white/80'
  if (score >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

function getBarColor(score: number) {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 70) return 'bg-white/30'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

/** Status dot color for vehicles */
function statusDotColor(status: string) {
  const s = (status || '').toLowerCase()
  if (s === 'active' || s === 'in_use') return 'bg-emerald-400'
  if (s === 'idle') return 'bg-amber-400'
  if (s === 'maintenance') return 'bg-rose-400'
  if (s === 'inactive' || s === 'retired' || s === 'offline') return 'bg-white/20'
  return 'bg-white/30'
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Overview Tab - Command Center Layout
 *
 * HeroMetrics strip at top, then 60/40 split:
 *   Left  -- Vehicle data table with inline status dots, sortable columns
 *   Right -- Fleet Health donut (120px), Active Alerts, HOS Compliance bars
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

  const [sortKey, setSortKey] = useState<'vehicle' | 'status' | 'mileage' | 'fuel' | 'location'>('vehicle')
  const [sortAsc, setSortAsc] = useState(true)

  const loading = fleetLoading || driversLoading || maintenanceLoading

  const fleetHealth = useMemo(() => {
    const healthScores = vehicles.map((v: any) => {
      const dbScore = v.health_score ?? v.healthScore
      if (typeof dbScore === 'number' && !Number.isNaN(dbScore)) return dbScore
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
      if (!lastTest) return false
      try { return new Date(lastTest) < twelveMonthsAgo } catch { return false }
    }).length
    return { expiringRegistrations, expiringMedicalCards, overdueDrugTests, totalAlerts: expiringRegistrations + expiringMedicalCards + overdueDrugTests }
  }, [vehicles, drivers])

  // Chart data
  const healthDistributionData = [
    { name: 'Excellent (90+)', value: fleetHealth.excellent, fill: '#10B981' },
    { name: 'Good (70-89)', value: fleetHealth.good, fill: '#34d399' },
    { name: 'Fair (50-69)', value: fleetHealth.fair, fill: '#F59E0B' },
    { name: 'Poor (<50)', value: fleetHealth.poor, fill: '#EF4444' },
  ].filter(d => d.value > 0)

  // Sorted vehicle rows for the data table
  const sortedVehicles = useMemo(() => {
    const rows = vehicles.map((v: any) => {
      // Check for live GPS update (Smartcar syncs every 5 min)
      const lastGps = v.lastGpsUpdate ?? v.last_gps_update ?? v.last_sync_at ?? v.updated_at
      const isLive = lastGps ? (Date.now() - new Date(lastGps).getTime()) < 10 * 60 * 1000 : false

      return {
        id: v.id,
        name: formatVehicleName(v),
        status: (v.status || 'unknown').toLowerCase(),
        mileage: v.mileage ?? v.odometer ?? 0,
        fuel: v.fuel_level ?? v.fuelLevel ?? v.battery_percent ?? v.batteryPercent ?? null,
        isLive,
        location: (() => {
          // Priority 1: Top-level lat/lng (Smartcar writes these directly)
          if (v.latitude != null && v.longitude != null) return `${Number(v.latitude).toFixed(4)}, ${Number(v.longitude).toFixed(4)}`
          // Priority 2: Nested location object
          const loc = v.location ?? v.current_location ?? v.lastKnownLocation
          if (!loc) return '--'
          if (typeof loc === 'string') return loc
          if (typeof loc === 'object' && loc !== null) {
            if (loc.address) return loc.address
            if (loc.name) return loc.name
            if (loc.city) return loc.city
            if (loc.formatted_address) return loc.formatted_address
            if (loc.lat != null && loc.lng != null) return `${Number(loc.lat).toFixed(4)}, ${Number(loc.lng).toFixed(4)}`
            if (loc.latitude != null && loc.longitude != null) return `${Number(loc.latitude).toFixed(4)}, ${Number(loc.longitude).toFixed(4)}`
            return '--'
          }
          return '--'
        })(),
        raw: v,
      }
    })
    rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'vehicle') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
      else if (sortKey === 'mileage') cmp = a.mileage - b.mileage
      else if (sortKey === 'fuel') cmp = (a.fuel ?? -1) - (b.fuel ?? -1)
      else if (sortKey === 'location') cmp = String(a.location).localeCompare(String(b.location))
      return sortAsc ? cmp : -cmp
    })
    return rows
  }, [vehicles, sortKey, sortAsc])

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sortArrow = (key: typeof sortKey) =>
    sortKey === key ? (sortAsc ? ' \u2191' : ' \u2193') : ''

  // HOS percentage helper
  const hosTotal = hosCompliance.statuses.driving + hosCompliance.statuses.on_duty + hosCompliance.statuses.off_duty + hosCompliance.statuses.sleeper
  const hosPct = (val: number) => hosTotal > 0 ? Math.round((val / hosTotal) * 100) : 0

  if (loading) {
    return (
      <div className="flex flex-col gap-0">
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-0">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-96 flex-1" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  // Hero metrics data
  const utilizationPct = (fleetStats?.totalVehicles ?? 0) > 0
    ? Math.round(((fleetStats?.activeVehicles ?? 0) / (fleetStats?.totalVehicles ?? 1)) * 100)
    : 0
  const heroMetrics: HeroMetric[] = [
    {
      label: 'Fleet Utilization',
      value: `${utilizationPct}%`,
      icon: Gauge,
      change: utilizationPct >= 70 ? 3 : -2,
      trend: utilizationPct >= 70 ? 'up' : 'down',
      accent: 'emerald',
    },
    {
      label: 'Avg Safety Score',
      value: safetyMetrics.avgSafety > 0 ? safetyMetrics.avgSafety : 0,
      icon: Shield,
      change: safetyMetrics.avgSafety >= 80 ? 2 : safetyMetrics.avgSafety >= 60 ? 0 : -4,
      trend: safetyMetrics.avgSafety >= 80 ? 'up' : safetyMetrics.avgSafety >= 60 ? 'neutral' : 'down',
      accent: 'amber',
    },
    {
      label: 'Open Work Orders',
      value: maintenanceOverview.openWorkOrders,
      icon: ClipboardList,
      change: maintenanceOverview.emergencyCount > 0 ? -maintenanceOverview.emergencyCount : 0,
      trend: maintenanceOverview.emergencyCount > 3 ? 'down' : 'neutral',
      accent: 'rose',
    },
    {
      label: 'Compliance Alerts',
      value: complianceAlerts.totalAlerts,
      icon: ShieldAlert,
      trend: complianceAlerts.totalAlerts > 5 ? 'down' : complianceAlerts.totalAlerts > 0 ? 'neutral' : 'up',
      accent: 'gray',
    },
  ]

  return (
    <div className="flex flex-col gap-0 overflow-y-auto">
      {/* ── Hero Metrics Strip ────────────────────────────────── */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.06] bg-[#111]" />

      {/* ── 60 / 40 Split Layout ──────────────────────────────── */}
      <div className="flex gap-0 min-h-0 flex-1">
        {/* LEFT 60% — Vehicle Data Table */}
        <div className="flex-[6] border-r border-white/[0.06] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-[#1a1a1a]">
              <tr className="border-b border-white/[0.06]">
                {([
                  ['vehicle', 'Vehicle'],
                  ['status', 'Status'],
                  ['mileage', 'Mileage'],
                  ['fuel', 'Fuel / Battery'],
                  ['location', 'Location'],
                ] as const).map(([key, label]) => (
                  <th
                    key={key}
                    className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35 cursor-pointer select-none hover:text-white/60 transition-colors${key === 'mileage' ? ' text-right' : ''}`}
                    onClick={() => handleSort(key)}
                  >
                    {label}{sortArrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedVehicles.slice(0, 25).map(row => (
                <tr
                  key={row.id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.03] cursor-pointer transition-colors"
                  onClick={() => push({
                    type: 'vehicle-details',
                    label: row.name,
                    data: { vehicleId: String(row.id), vehicle: row.raw },
                  })}
                >
                  <td className="px-4 py-2.5">
                    <span className="text-[13px] font-medium text-white/80">{row.name}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-white/60">
                      <span className={`inline-block h-2 w-2 rounded-full ${statusDotColor(row.status)}`} />
                      {formatEnum(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[12px] text-white/60 tabular-nums">{formatNumber(row.mileage)} mi</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {row.fuel != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.fuel > 30 ? 'bg-emerald-400' : row.fuel > 15 ? 'bg-amber-400' : 'bg-rose-400'}`}
                            style={{ width: `${Math.min(100, row.fuel)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-white/40 tabular-nums">{row.fuel}%</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-white/20">--</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] text-white/40 truncate max-w-[140px] inline-flex items-center gap-1">
                      {row.isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="Live GPS" />}
                      {row.location}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedVehicles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-white/30 text-sm">No vehicles found</td>
                </tr>
              )}
            </tbody>
          </table>
          {sortedVehicles.length > 25 && (
            <div className="px-4 py-2 border-t border-white/[0.04] text-center">
              <button
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                onClick={() => push({ type: 'vehicles-list', label: 'All Vehicles', data: {} })}
              >
                View all {sortedVehicles.length} vehicles
              </button>
            </div>
          )}
        </div>

        {/* RIGHT 40% — Stacked Info Panels */}
        <div className="flex-[4] overflow-y-auto flex flex-col">
          {/* Fleet Health Donut (120px compact) */}
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="h-4 w-4 text-white/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Fleet Health</span>
              <span className="ml-auto text-[24px] font-bold text-white tabular-nums leading-none">{fleetHealth.avgScore}</span>
            </div>
            {healthDistributionData.length > 0 ? (
              <ResponsivePieChart title="" data={healthDistributionData} height={120} innerRadius={35} showPercentages compact />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-white/20 text-xs">No health data</div>
            )}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[
                { label: 'Excellent', count: fleetHealth.excellent, color: 'text-emerald-400' },
                { label: 'Good', count: fleetHealth.good, color: 'text-emerald-300' },
                { label: 'Fair', count: fleetHealth.fair, color: 'text-amber-400' },
                { label: 'Poor', count: fleetHealth.poor, color: 'text-rose-400' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className={`text-sm font-semibold ${item.color}`}>{item.count}</p>
                  <p className="text-[10px] text-white/30">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Alerts (3-5 most urgent, clickable) */}
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <Siren className="h-4 w-4 text-white/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">Active Alerts</span>
              {complianceAlerts.totalAlerts + maintenanceOverview.emergencyCount > 0 && (
                <span className="ml-auto text-[10px] font-bold text-rose-400 bg-rose-400/10 rounded px-1.5 py-0.5 tabular-nums">
                  {complianceAlerts.totalAlerts + maintenanceOverview.emergencyCount}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              {maintenanceOverview.emergencyCount > 0 && (
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-rose-950/30 border border-rose-800/30 hover:bg-rose-950/50 transition-colors cursor-pointer"
                  onClick={() => push({ type: 'work-orders-list', label: 'Emergency Work Orders', data: { filter: 'emergency' } })}
                >
                  <Siren className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-rose-300">{maintenanceOverview.emergencyCount} emergency work order{maintenanceOverview.emergencyCount !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-rose-300/50">Immediate attention required</p>
                  </div>
                </button>
              )}
              {complianceAlerts.expiringRegistrations > 0 && (
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-amber-950/20 border border-amber-800/20 hover:bg-amber-950/40 transition-colors cursor-pointer"
                  onClick={() => push({ type: 'compliance-item', label: 'Registration Expiry', data: { category: 'registration', alertType: 'Registration Expiry' } })}
                >
                  <Car className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-amber-300">{complianceAlerts.expiringRegistrations} expiring registration{complianceAlerts.expiringRegistrations !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-amber-300/50">Within 30 days</p>
                  </div>
                </button>
              )}
              {complianceAlerts.expiringMedicalCards > 0 && (
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-amber-950/20 border border-amber-800/20 hover:bg-amber-950/40 transition-colors cursor-pointer"
                  onClick={() => push({ type: 'compliance-item', label: 'Medical Card Expiry', data: { category: 'medical-card', alertType: 'Medical Card Expiry' } })}
                >
                  <UserCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-amber-300">{complianceAlerts.expiringMedicalCards} expiring medical card{complianceAlerts.expiringMedicalCards !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-amber-300/50">Within 30 days</p>
                  </div>
                </button>
              )}
              {complianceAlerts.overdueDrugTests > 0 && (
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 rounded bg-rose-950/20 border border-rose-800/20 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  onClick={() => push({ type: 'compliance-item', label: 'Drug Test Overdue', data: { category: 'drug-test', alertType: 'Drug Test Overdue' } })}
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-rose-300">{complianceAlerts.overdueDrugTests} overdue drug test{complianceAlerts.overdueDrugTests !== 1 ? 's' : ''}</p>
                    <p className="text-[10px] text-rose-300/50">Over 12 months since last test</p>
                  </div>
                </button>
              )}
              {complianceAlerts.totalAlerts === 0 && maintenanceOverview.emergencyCount === 0 && (
                <div className="flex items-center gap-2 px-3 py-3">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] text-white/40">No active alerts</span>
                </div>
              )}
            </div>
          </div>

          {/* HOS Compliance Progress Bars */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="h-4 w-4 text-white/40" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/35">HOS Compliance</span>
              <span className="ml-auto text-[11px] text-white/25 tabular-nums">{formatNumber(hosCompliance.totalHoursAvailable)}h avail</span>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Driving', value: hosCompliance.statuses.driving, pct: hosPct(hosCompliance.statuses.driving), color: 'bg-emerald-500' },
                { label: 'On Duty', value: hosCompliance.statuses.on_duty, pct: hosPct(hosCompliance.statuses.on_duty), color: 'bg-emerald-400/70' },
                { label: 'Off Duty', value: hosCompliance.statuses.off_duty, pct: hosPct(hosCompliance.statuses.off_duty), color: 'bg-white/20' },
                { label: 'Sleeper', value: hosCompliance.statuses.sleeper, pct: hosPct(hosCompliance.statuses.sleeper), color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/50">{item.label}</span>
                    <span className="text-[11px] text-white/60 tabular-nums font-medium">{item.value} ({item.pct}%)</span>
                  </div>
                  <ProgressBar value={item.pct} color={item.color} />
                </div>
              ))}
            </div>
          </div>
        </div>
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
    const scores = vehicles.map((v: any) => {
      const dbScore = v.health_score ?? v.healthScore
      if (dbScore != null && !Number.isNaN(Number(dbScore))) return Number(dbScore)
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
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
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
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header with Add Vehicle */}
      <div className="flex items-center justify-end">
        <AddVehicleDialog onAdd={handleAddVehicle} />
      </div>

      {/* Fleet Statistics - Hero Metrics Strip */}
      <HeroMetrics metrics={[
        { label: 'Total Vehicles', value: safeStats.totalVehicles, icon: Car, accent: 'emerald' as const },
        { label: 'Active Vehicles', value: safeStats.activeVehicles, icon: Gauge, accent: 'emerald' as const },
        { label: 'Fleet Health', value: avgHealthScore != null ? `${avgHealthScore}%` : '--', icon: HeartPulse, trend: (avgHealthScore != null ? (avgHealthScore >= 80 ? 'up' : avgHealthScore >= 60 ? 'neutral' : 'down') : 'neutral') as 'up' | 'down' | 'neutral', accent: 'amber' as const },
        { label: 'Avg Fuel Level', value: `${formatNumber(safeStats.averageFuelLevel || 0, 1)}%`, icon: Fuel, accent: 'gray' as const },
      ]} className="border-b border-white/[0.06] bg-[#111] -mx-4" />

      {/* Fleet Alerts */}
      {(lowFuelVehicles.length > 0 || highMileageVehicles.length > 0) && (
        <Section
          title="Fleet Alerts"
          description={`${lowFuelVehicles.length + highMileageVehicles.length} vehicles need attention`}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <div className="flex flex-col gap-1">
            {lowFuelVehicles.slice(0, 5).map((v: any) => (
              <div
                key={`fuel-${v.id}`}
                className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2 cursor-pointer hover:bg-white/[0.05] transition-colors"
                onClick={() => push({
                  type: 'vehicle-details',
                  label: formatVehicleName(v),
                  data: { vehicleId: String(v.id), vehicle: v },
                })}
              >
                <div className="flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-white/80">
                      {formatVehicleName(v)}
                    </p>
                    <p className="text-[10px] text-white/40">Fuel: {v.fuel_level != null ? `${v.fuel_level}%` : 'N/A'}</p>
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
                className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2 cursor-pointer hover:bg-white/[0.05] transition-colors"
                onClick={() => push({
                  type: 'vehicle-details',
                  label: formatVehicleName(v),
                  data: { vehicleId: String(v.id), vehicle: v },
                })}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  <div>
                    <p className="text-xs font-medium text-white/80">
                      {formatVehicleName(v)}
                    </p>
                    <p className="text-[10px] text-white/40">Mileage: {formatNumber(v.mileage)} mi</p>
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

      {/* Main content area */}
      <div className="flex flex-col gap-3">
        <div className="shrink-0" style={{ minHeight: '400px' }}>
          <Section
            title="Live Fleet Tracking"
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

        <div className="shrink-0">
          <Section
            title="Vehicle Telemetry"
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

        <div className="shrink-0">
          <Section
            title="Virtual Garage"
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
              title="EV Charging Management"
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
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
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
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Driver Statistics - Hero Metrics Strip */}
      <HeroMetrics metrics={[
        { label: 'Total Drivers', value: safeStats.totalDrivers, icon: Users, accent: 'emerald' as const },
        { label: 'On Duty', value: safeStats.activeDrivers, icon: UserIcon, accent: 'emerald' as const },
        { label: 'Avg Safety Score', value: computedAvgSafetyScore, icon: Shield, trend: (computedAvgSafetyScore >= 80 ? 'up' : computedAvgSafetyScore >= 60 ? 'neutral' : 'down') as 'up' | 'down' | 'neutral', accent: 'amber' as const },
        { label: 'HOS Driving', value: driversDrivingCount, icon: Activity, accent: 'gray' as const },
      ]} className="border-b border-white/[0.06] bg-[#111] -mx-4" />

      {/* Main content */}
      <div className="grid grid-cols-2 gap-3">
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
                violations: point.violations
              }))}
              dataKeys={['safety_score', 'violations']}
              colors={['hsl(var(--success))', 'hsl(var(--destructive))']}
              height={120}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No performance trend data available</div>
          )}
        </Section>

        <Section
          title="Top Performers"
          description="Drivers with highest safety scores"
          icon={<Award className="h-4 w-4" />}
        >
          {topPerformers.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {topPerformers.slice(0, 5).map((driver: any, index) => (
                <div
                  key={driver.id}
                  className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${driver.name}`}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.06] text-white/80 text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold text-white/80">{driver.name}</p>
                        {(driver.employment_type || driver.employmentType) && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            {formatEnum(driver.employment_type || driver.employmentType)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40">{driver.licenseNumber}</p>
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
                      <p className="text-xs font-semibold text-white/80">{driver.safetyScore || 0}/100</p>
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No records found</div>
          )}
        </Section>
      </div>

      {/* Drivers Needing Attention */}
      {(lowSafetyDrivers.length > 0 || driversWithViolations.length > 0 || expiringLicenses.length > 0) && (
        <Section
          title="Drivers Needing Attention"
          description={`${lowSafetyDrivers.length + driversWithViolations.length + expiringLicenses.length} items requiring review`}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-white/40 font-medium mb-0.5">Low Safety Scores ({lowSafetyDrivers.length})</p>
              {lowSafetyDrivers.slice(0, 3).map((driver: any) => (
                <div
                  key={`safety-${driver.id}`}
                  className="rounded border border-white/[0.06] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white/80 truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-white/40">Score: {driver.safetyScore}</p>
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">Low</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-white/40 font-medium mb-0.5">With Violations ({driversWithViolations.length})</p>
              {driversWithViolations.slice(0, 3).map((driver: any) => (
                <div
                  key={`viol-${driver.id}`}
                  className="rounded border border-white/[0.06] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white/80 truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-white/40">{driver.violationCount} violations</p>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Review</Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-white/40 font-medium mb-0.5">Expiring Licenses ({expiringLicenses.length})</p>
              {expiringLicenses.slice(0, 3).map((driver: any) => (
                <div
                  key={`lic-${driver.id}`}
                  className="rounded border border-white/[0.06] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: driver.id, type: 'driver', label: driver.name, data: { driverId: driver.id, driverName: driver.name } }); } }}
                >
                  <p className="text-xs font-medium text-white/80 truncate">{driver.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] text-white/40">Exp: {formatDate(driver.licenseExpiry)}</p>
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
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
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
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Operations Statistics - Hero Metrics Strip */}
      <HeroMetrics metrics={[
        { label: 'Active Routes', value: safeStats.activeJobs, icon: RouteIcon, accent: 'emerald' as const },
        { label: 'Pending Tasks', value: safeStats.openTasks, icon: CheckSquare, accent: 'amber' as const },
        { label: 'Total Fuel Cost', value: formatCurrency(safeStats.totalFuelCost || 0), icon: Fuel, accent: 'rose' as const },
        { label: 'Completion Rate', value: `${formatNumber(safeStats.completionRate, 1)}%`, icon: TrendingUp, accent: 'emerald' as const },
      ]} className="border-b border-white/[0.06] bg-[#111] -mx-4" />

      {/* Trend Charts */}
      <div className="grid grid-cols-2 gap-3">
        <Section
          title="Route Completion Trend"
          description="Completed routes over the past 7 days"
          icon={<LineChart className="h-4 w-4" />}
        >
          {completionTrendData.length > 0 ? (
            <ResponsiveLineChart
              title="Route Completion"
              data={completionTrendData}
              dataKeys={['completed', 'target']}
              colors={['hsl(var(--success))', 'hsl(var(--muted-foreground))']}
              height={120}
              compact
            />
          ) : (
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No trend data available</div>
          )}
        </Section>
        <Section
          title="Fuel Consumption"
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No fuel data available</div>
          )}
        </Section>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-2 gap-3">
        <Section
          title={`Active Routes (${routes.length})`}
          description="Real-time route tracking"
          icon={<Map className="h-4 w-4" />}
        >
          {routes.length > 0 ? (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
              {routes.slice(0, 5).map(route => (
                <div
                  key={route.id}
                  className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${route.name || 'Route'}`}
                  onClick={() => push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } })}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push({ id: route.id, type: 'route', label: route.name || 'Route', data: { routeId: route.id } }); } }}
                >
                  <div className="flex items-center gap-2">
                    <RouteIcon className="h-4 w-4 text-white/40" />
                    <div>
                      <p className="text-xs font-semibold text-white/80">{route.name || `${formatEnum(route.routeType || 'route')} Route`}</p>
                      <p className="text-[10px] text-white/40">
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No active routes</div>
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
                <div key={transaction.id} className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-xs font-semibold text-white/80">
                        {vehicleNameMap[transaction.vehicleId] || 'Unknown Vehicle'}
                      </p>
                      {(transaction.station_brand || transaction.stationBrand) && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {transaction.station_brand || transaction.stationBrand}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-white/40">
                      {transaction.amount} gal @ {formatCurrency(transaction.pricePerUnit || 0)}/gal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white/80">{formatCurrency(transaction.cost)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <p className="text-[10px] text-white/40">{transaction.location || '--'}</p>
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No fuel transactions</div>
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
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  const maintenanceError = errors.workOrders || errors.requests || errors.predictions
  if (maintenanceError) {
    return (
      <div className="p-4">
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
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Maintenance Statistics - Hero Metrics Strip */}
      <HeroMetrics metrics={[
        { label: 'Open Work Orders', value: openOrders.length, icon: ClipboardList, accent: 'emerald' as const },
        { label: 'Urgent Orders', value: safeMetrics.urgentOrders, icon: AlertTriangle, trend: (safeMetrics.urgentOrders > 3 ? 'down' : safeMetrics.urgentOrders > 0 ? 'neutral' : 'up') as 'up' | 'down' | 'neutral', accent: 'rose' as const },
        { label: 'Total Downtime', value: `${formatNumber(totalDowntimeHours, 1)} hrs`, icon: Timer, trend: (totalDowntimeHours > 100 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral', accent: 'amber' as const },
        { label: 'Parts Inventory', value: formatCurrency(inventoryMetrics?.totalValue || 0), icon: Package, accent: 'gray' as const },
      ]} className="border-b border-white/[0.06] bg-[#111] -mx-4" />

      {/* Cost Breakdown Row */}
      {(costBreakdown.partsCost > 0 || costBreakdown.laborCost > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded border border-white/[0.06] bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] text-white/40">Total Cost</p>
            <p className="text-sm font-bold text-white/80">{formatCurrency(safeMetrics.totalCost)}</p>
          </div>
          <div className="rounded border border-white/[0.06] bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] text-white/40">Parts Cost</p>
            <p className="text-sm font-bold text-white/80">{formatCurrency(costBreakdown.partsCost)}</p>
          </div>
          <div className="rounded border border-white/[0.06] bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] text-white/40">Labor Cost</p>
            <p className="text-sm font-bold text-white/80">{formatCurrency(costBreakdown.laborCost)}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col gap-3">
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
                  order.is_emergency || order.isEmergency ? 'border-rose-800/40 bg-rose-950/20' : 'border-white/[0.06] bg-white/[0.03]'
                }`}>
                  <div className="flex items-center gap-2">
                    <Tool className={`h-4 w-4 ${
                      order.priority === 'high' || order.priority === 'urgent' ? 'text-rose-400' :
                      order.priority === 'medium' ? 'text-white/60' : 'text-white/40'
                    }`} />
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-semibold text-white/80">{order.title || `${formatEnum(order.type || 'maintenance')} Maintenance`}</p>
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
                      <p className="text-[10px] text-white/40">
                        {order.vehicleName || 'Unknown Vehicle'} · Created: {formatDate(order.createdAt)}
                        {(order.parts_cost || order.partsCost || order.labor_cost || order.laborCost) && (
                          <span className="ml-1">
                            Parts: {formatCurrency(Number(order.parts_cost || order.partsCost || 0))} | Labor: {formatCurrency(Number(order.labor_cost || order.laborCost || 0))}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No active work orders</div>
          )}
        </Section>

        {/* Schedule + Overdue */}
        <div className="grid grid-cols-2 gap-3">
          <Section
            title="Upcoming Maintenance"
            description="Scheduled preventive maintenance"
            icon={<Calendar className="h-4 w-4" />}
          >
            {upcomingOrders.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1">
                {upcomingOrders.slice(0, 4).map((maintenance) => (
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2">
                    <div>
                      <p className="text-xs font-semibold text-white/80">{maintenance.title || `${formatEnum(maintenance.type || 'maintenance')} Maintenance`}</p>
                      <p className="text-[10px] text-white/40">
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
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">No scheduled maintenance</div>
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
                      <div className="flex items-center gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-rose-200 truncate">{overdue.title || `${formatEnum(overdue.type || 'Maintenance')} Maintenance`}</p>
                          <p className="text-[10px] text-rose-300/70">
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
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">No overdue maintenance</div>
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
            <div className="grid gap-3 grid-cols-3">
              {parts.map((item: any) => {
                const quantity = Number(item.quantityOnHand ?? item.quantity_on_hand ?? 0)
                const reorderPoint = Number(item.reorderPoint ?? item.reorder_point ?? 0)
                const status = quantity <= reorderPoint ? 'low-stock' : 'in-stock'
                return (
                  <div key={item.id || item.partNumber || item.name} className="rounded border border-white/[0.06] bg-white/[0.03] p-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-white/80">{item.name || item.partNumber || 'Part'}</p>
                      <Badge variant={status === 'in-stock' ? 'default' : 'destructive'} className="text-[10px] px-1 py-0">
                        {status === 'in-stock' ? 'In Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-white/40">
                      Qty: {quantity} {item.unitOfMeasure || item.unit_of_measure || ''} · Reorder: {reorderPoint}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No parts inventory available</div>
          )}
        </Section>

        {/* Predictive Alerts */}
        {highConfidencePredictions.length > 0 && (
          <Section
            title="Predictive Alerts"
            description={`${highConfidencePredictions.length} high-confidence predictions`}
            icon={<Activity className="h-4 w-4" />}
          >
            <div className="flex flex-col gap-1">
              {highConfidencePredictions.slice(0, 6).map((prediction: any) => (
                <div key={prediction.id} className={`flex items-center justify-between rounded border p-2 ${
                  prediction.severity === 'critical' ? 'border-rose-800/40 bg-rose-950/20' :
                  prediction.severity === 'high' ? 'border-amber-800/40 bg-amber-950/20' :
                  'border-white/[0.06] bg-white/[0.03]'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-3.5 w-3.5 ${
                      prediction.severity === 'critical' ? 'text-rose-400' :
                      prediction.severity === 'high' ? 'text-amber-400' : 'text-white/40'
                    }`} />
                    <div>
                      <p className="text-xs font-medium text-white/80">
                        {prediction.vehicleName || 'Unknown Vehicle'} - {prediction.issue || 'Predicted Issue'}
                      </p>
                      <p className="text-[10px] text-white/40">
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
    { name: 'Available', value: statusDistribution.available || 0, fill: '#34d399' },
    { name: 'Maintenance', value: statusDistribution.maintenance || 0, fill: '#F59E0B' },
    { name: 'Retired', value: statusDistribution.retired || 0, fill: '#6b7280' },
  ].filter((entry) => entry.value > 0)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Asset Statistics - Hero Metrics Strip */}
      <HeroMetrics metrics={[
        { label: 'Total Assets', value: metrics.totalAssets, icon: Box, accent: 'emerald' as const },
        { label: 'Assets in Use', value: metrics.activeAssets, icon: Truck, accent: 'emerald' as const },
        { label: 'Maintenance Due', value: metrics.inMaintenance, icon: Wrench, accent: 'amber' as const },
        { label: 'Asset Value', value: formatCurrency(metrics.totalValue), icon: DollarSign, accent: 'gray' as const },
      ]} className="border-b border-white/[0.06] bg-[#111] -mx-4" />

      {/* Main content */}
      <div className="flex flex-col gap-3">
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
                  <div key={asset.id} className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-white/40" />
                      <div>
                        <p className="text-xs font-semibold text-white/80">{asset.assetTag || asset.name} - {asset.name}</p>
                        <p className="text-[10px] text-white/40">
                          {formatEnum(asset.type)} · {asset.location}
                          {(asset.department || asset.dept) && (
                            <span className="ml-1">· {asset.department || asset.dept}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
            <div className="flex items-center justify-center h-20 text-white/40 text-sm">No assets available</div>
          )}
        </Section>

        {/* Utilization + Maintenance Schedule */}
        <div className="grid grid-cols-2 gap-3">
          <Section
            title="Asset Utilization"
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
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">No utilization data available</div>
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
                  <div key={maintenance.id} className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-2">
                    <div>
                      <p className="text-xs font-semibold text-white/80">{maintenance.assetTag || maintenance.name} - {maintenance.name}</p>
                      <p className="text-[10px] text-white/40">
                        {formatEnum(maintenance.type)} · Due: {formatDate(maintenance.nextServiceDate || maintenance.lastServiceDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">No asset maintenance due</div>
            )}
          </Section>
        </div>

        {/* Asset Categories Breakdown */}
        <Section
          title="Asset Categories"
          description="Breakdown by equipment type"
          icon={<Package className="h-4 w-4" />}
        >
          <div className="grid gap-3 grid-cols-3">
            {(inventoryByCategory.length > 0 ? inventoryByCategory : Object.entries(typeDistribution).map(([key, value]) => ({
              name: key,
              count: value,
              value: 0,
              items: value
            }))).map((cat) => (
              <div key={cat.name} className="rounded border border-white/[0.06] bg-white/[0.03] p-2">
                <p className="text-xs font-semibold text-white/80">{formatEnum(cat.name)}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-[10px] text-white/40">{cat.count} assets</p>
                  <p className="text-[10px] font-semibold text-white/80">{cat.value ? formatCurrency(cat.value) : '--'}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Asset Lifecycle + High-Value Assets + Low Stock */}
        <div className="grid grid-cols-3 gap-3">
          <Section
            title="Asset Lifecycle"
            description="Age distribution of assets"
            icon={<Clock className="h-4 w-4" />}
          >
            {(() => {
              const lcData = [
                { name: 'New (<1yr)', value: lifecycleData.new, fill: '#10B981' },
                { name: 'Operational (1-5yr)', value: lifecycleData.operational, fill: '#34d399' },
                { name: 'Aging (5-10yr)', value: lifecycleData.aging, fill: '#F59E0B' },
                { name: 'End of Life (10yr+)', value: lifecycleData.endOfLife, fill: '#EF4444' },
              ].filter(d => d.value > 0)
              return lcData.length > 0 ? (
                <ResponsivePieChart title="Lifecycle" data={lcData} height={120} innerRadius={30} showPercentages compact />
              ) : (
                <div className="flex items-center justify-center h-20 text-white/40 text-sm">No lifecycle data</div>
              )
            })()}
          </Section>

          <Section
            title="High-Value Assets"
            description="Top assets by current value"
            icon={<DollarSign className="h-4 w-4" />}
          >
            {highValueAssets.length > 0 ? (
              <div className="flex flex-col gap-1">
                {highValueAssets.slice(0, 5).map((asset: any) => (
                  <div key={asset.id} className="flex items-center justify-between rounded border border-white/[0.06] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                    role="button" tabIndex={0}
                    onClick={() => handleViewAsset(asset.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewAsset(asset.id); } }}
                  >
                    <div>
                      <p className="text-xs font-medium text-white/80 truncate">{asset.name}</p>
                      <p className="text-[10px] text-white/40">{formatEnum(asset.type)} · {formatEnum(asset.condition)}</p>
                    </div>
                    <p className="text-xs font-semibold text-white/80">{formatCurrency(asset.currentValue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">No assets</div>
            )}
          </Section>

          <Section
            title="Low Stock Alert"
            description="Inventory items at or below reorder point"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {lowStockItems.length > 0 || outOfStockItems.length > 0 ? (
              <div className="flex flex-col gap-1">
                {outOfStockItems.slice(0, 3).map((item: any) => (
                  <div key={`oos-${item.id}`} className="flex items-center justify-between rounded border border-rose-800/40 bg-rose-950/20 p-4">
                    <div>
                      <p className="text-xs font-medium text-white/80 truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40">{item.category}</p>
                    </div>
                    <Badge variant="destructive" className="text-[10px] px-1 py-0">Out of Stock</Badge>
                  </div>
                ))}
                {lowStockItems.slice(0, 3).map((item: any) => (
                  <div key={`low-${item.id}`} className="flex items-center justify-between rounded border border-amber-800/40 bg-amber-950/20 p-4">
                    <div>
                      <p className="text-xs font-medium text-white/80 truncate">{item.name}</p>
                      <p className="text-[10px] text-white/40">Qty: {item.quantity} / Reorder: {item.reorderPoint}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Low Stock</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-white/40 text-sm">All stock levels OK</div>
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
  const { user } = useAuth()

  const tabs: VTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      content: (
        <QueryErrorBoundary>
          <OverviewTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'fleet',
      label: 'Fleet',
      icon: Car,
      content: (
        <QueryErrorBoundary>
          <FleetTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'drivers',
      label: 'Drivers',
      icon: Users,
      content: (
        <QueryErrorBoundary>
          <DriversTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: Box,
      content: (
        <QueryErrorBoundary>
          <AssetsTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: OperationsIcon,
      content: (
        <QueryErrorBoundary>
          <OperationsTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      content: (
        <QueryErrorBoundary>
          <MaintenanceTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: UserCheck,
      content: (
        <QueryErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-40" /></div>}>
            <VehicleAssignmentManagement />
          </Suspense>
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: CalendarCheck,
      content: (
        <QueryErrorBoundary>
          <Suspense fallback={<div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-40" /></div>}>
            <ReservationCalendarView />
          </Suspense>
        </QueryErrorBoundary>
      ),
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Page Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Car className="h-5 w-5 text-emerald-400" />
          <div>
            <h1 className="text-xl font-semibold text-white/90 tracking-tight">Fleet Operations</h1>
            <p className="text-[12px] text-white/35 mt-0.5">Fleet management, driver tracking, and operations control</p>
          </div>
        </div>
      </div>

      {/* VerticalTabs with sidebar navigation */}
      <div className="flex-1 min-h-0">
        <VerticalTabs tabs={tabs} defaultTab="overview" />
      </div>
    </div>
  )
}
