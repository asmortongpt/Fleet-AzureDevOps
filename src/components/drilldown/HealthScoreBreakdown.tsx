/**
 * HealthScoreBreakdown — pushable drilldown panel showing vehicle health details.
 * Renders an overall score ring, 8 metric bars, critical alerts, and a service CTA.
 * All data comes from real telemetry records via GET /api/vehicles/:id/condition.
 */

import { Activity, AlertTriangle, Droplet, Battery, Gauge, Wrench, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format-helpers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TirePressure {
  pressure: number
  recommendedPressure: number
}

interface ConditionData {
  engine: { oilLife: number }
  battery: { health: number }
  brakes: { frontPadLife: number; rearPadLife: number }
  tires: {
    frontLeft: TirePressure
    frontRight: TirePressure
    rearLeft: TirePressure
    rearRight: TirePressure
  }
}

export interface HealthScoreBreakdownProps {
  vehicleId: string
  vehicleName?: string
  condition?: ConditionData
  healthScore?: number // 0-100, from vehicle data
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

function tirePercent(t: TirePressure): number {
  if (!t.recommendedPressure || t.recommendedPressure <= 0) return 0
  return clamp(Math.round((t.pressure / t.recommendedPressure) * 100), 0, 100)
}

function barColor(pct: number): string {
  if (pct >= 60) return 'bg-emerald-500'
  if (pct >= 30) return 'bg-amber-500'
  return 'bg-rose-500'
}

function ringStroke(pct: number): string {
  if (pct >= 80) return 'stroke-emerald-500'
  if (pct >= 60) return 'stroke-amber-500'
  return 'stroke-rose-500'
}

interface Metric {
  key: string
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}

interface CriticalAlert {
  label: string
  value: number
  severity: 'warning' | 'critical'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HealthScoreBreakdown({
  vehicleId,
  vehicleName,
  condition: conditionProp,
  healthScore = 0,
}: HealthScoreBreakdownProps) {
  const { push } = useDrilldown()

  // Fetch real condition data from the database
  const { data: conditionResponse, isLoading } = useSWR(
    vehicleId ? `/api/vehicles/${vehicleId}/condition` : null,
    apiFetcher,
    { shouldRetryOnError: false }
  )

  // Unwrap from response formatter: { success, data: ConditionData }
  const fetchedCondition: ConditionData | undefined =
    conditionResponse?.data ?? conditionResponse

  // Use prop if provided, otherwise use fetched data
  const condition = conditionProp ?? fetchedCondition

  // Build the 8 metrics from real condition data
  const metrics: Metric[] = useMemo(() => {
    if (!condition) return []
    return [
      { key: 'oil', label: 'Oil Life', value: clamp(Math.round(condition.engine.oilLife), 0, 100), icon: Droplet },
      { key: 'battery', label: 'Battery Health', value: clamp(Math.round(condition.battery.health), 0, 100), icon: Battery },
      { key: 'front-brakes', label: 'Front Brake Pads', value: clamp(Math.round(condition.brakes.frontPadLife), 0, 100), icon: Gauge },
      { key: 'rear-brakes', label: 'Rear Brake Pads', value: clamp(Math.round(condition.brakes.rearPadLife), 0, 100), icon: Gauge },
      { key: 'tire-fl', label: 'Tire FL', value: tirePercent(condition.tires.frontLeft), icon: Activity },
      { key: 'tire-fr', label: 'Tire FR', value: tirePercent(condition.tires.frontRight), icon: Activity },
      { key: 'tire-rl', label: 'Tire RL', value: tirePercent(condition.tires.rearLeft), icon: Activity },
      { key: 'tire-rr', label: 'Tire RR', value: tirePercent(condition.tires.rearRight), icon: Activity },
    ]
  }, [condition])

  // Compute the overall score from real metrics or fall back to prop
  const overall = condition && metrics.length > 0
    ? Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length)
    : clamp(healthScore, 0, 100)

  // Critical alerts: oil < 15%, battery < 50%, brakes < 20%
  const alerts: CriticalAlert[] = useMemo(() => {
    const out: CriticalAlert[] = []
    for (const m of metrics) {
      if (m.key === 'oil' && m.value < 15) {
        out.push({ label: 'Oil Life Critical', value: m.value, severity: 'critical' })
      } else if (m.key === 'battery' && m.value < 50) {
        out.push({ label: 'Battery Low', value: m.value, severity: m.value < 25 ? 'critical' : 'warning' })
      } else if ((m.key === 'front-brakes' || m.key === 'rear-brakes') && m.value < 20) {
        out.push({
          label: m.key === 'front-brakes' ? 'Front Brakes Worn' : 'Rear Brakes Worn',
          value: m.value,
          severity: m.value < 10 ? 'critical' : 'warning',
        })
      }
    }
    return out
  }, [metrics])

  // SVG score ring constants
  const RADIUS = 54
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dashOffset = CIRCUMFERENCE - (overall / 100) * CIRCUMFERENCE

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
        <span className="ml-3 text-sm text-white/40">Loading condition data...</span>
      </div>
    )
  }

  // No data state (no telemetry records found)
  if (!condition) {
    return (
      <div className="space-y-4 p-1">
        {vehicleName && (
          <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
            Health Breakdown — {vehicleName}
          </p>
        )}
        <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-6 text-center">
          <Activity className="h-8 w-8 mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/60 font-medium">No Telemetry Data</p>
          <p className="text-xs text-white/40 mt-1">
            Connect an OBD2 adapter or telematics provider to see real-time health metrics.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      {vehicleName && (
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
          Health Breakdown — {vehicleName}
        </p>
      )}

      {/* Overall score ring */}
      <div className="relative flex items-center justify-center rounded-lg bg-[#242424] border border-white/[0.08] p-4">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Background track */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            className="text-white/[0.06]"
            strokeWidth="10"
          />
          {/* Score arc */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            className={ringStroke(overall)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold text-white">{formatNumber(overall)}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Overall</span>
        </div>
      </div>

      {/* Metric bars */}
      <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3 space-y-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40 mb-1">Component Health</p>

        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.key} className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0 text-white/40" />
              <span className="w-28 shrink-0 text-xs text-white/60 truncate">{m.label}</span>
              <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', barColor(m.value))}
                  style={{ width: `${m.value}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-medium text-white/80">
                {formatNumber(m.value)}%
              </span>
            </div>
          )
        })}
      </div>

      {/* Critical alerts */}
      {alerts.length > 0 && (
        <div className="rounded-lg bg-[#242424] border border-white/[0.08] p-3 space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-white/40">Critical Alerts</p>

          {alerts.map((a, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-xs',
                a.severity === 'critical'
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{a.label}</span>
              <span className="font-semibold">{formatNumber(a.value)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Service CTA */}
      {alerts.length > 0 && (
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors py-2.5 text-sm font-semibold text-white"
          onClick={() => push({
            type: 'create-work-order',
            label: 'Schedule Service',
            data: { vehicleId, vehicleName },
          })}
        >
          <Wrench className="h-4 w-4" />
          Schedule Service
        </button>
      )}
    </div>
  )
}
