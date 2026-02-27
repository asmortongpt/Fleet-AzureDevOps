/**
 * VehicleHUD - Game-style Heads-Up Display for Vehicle Stats
 *
 * Displays key vehicle metrics in a modern, game-inspired UI panel:
 * - Mileage / Odometer
 * - Oil Life %
 * - Brake Life %
 * - Tire Health
 * - Active DTCs
 * - Real-time telemetry
 *
 * Created: 2025-11-24
 */

import { Gauge, Car, Zap, AlertTriangle, Fuel, Thermometer, Droplet, Cog, Disc } from 'lucide-react'

// Icon aliases
const Engine = Cog
const Drop = Droplet
const Tire = Disc

import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'

interface VehicleStats {
  // Basic Info
  name: string
  make: string
  model: string
  year: number
  vin?: string
  licensePlate?: string

  // Usage Stats
  mileage?: number
  engineHours?: number

  // Health Percentages (0-100)
  oilLife?: number
  brakeLife?: number
  tireHealth?: number
  batteryHealth?: number

  // Real-time Telemetry
  rpm?: number
  speed?: number
  coolantTemp?: number
  fuelLevel?: number
  batteryVoltage?: number
  engineLoad?: number

  // Alerts
  dtcCodes?: string[]
  checkEngineLight?: boolean
  activeWarnings?: string[]
}

interface VehicleHUDProps {
  stats: VehicleStats
  className?: string
  compact?: boolean
}

// Stat Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  percentage,
  warning,
  className
}: {
  icon: any
  label: string
  value: string | number
  unit?: string
  percentage?: number
  warning?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 p-2.5 rounded-lg bg-white/[0.04]',
        'border border-white/[0.04]',
        warning && 'border-red-500/30 bg-red-950/20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('w-3.5 h-3.5', warning ? 'text-red-400' : 'text-emerald-400/70')} />
        <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'text-sm font-bold tabular-nums',
          warning ? 'text-red-400' : 'text-white'
        )}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </span>
        {unit && <span className="text-[10px] text-white/30">{unit}</span>}
      </div>
      {percentage !== undefined && (
        <div className="mt-0.5">
          <Progress
            value={percentage}
            className="h-1 bg-white/[0.06]"
          />
        </div>
      )}
    </div>
  )
}

// Circular Gauge Component
function CircularGauge({
  value,
  max,
  label,
  unit,
  icon: Icon,
  warning = false
}: {
  value: number
  max: number
  label: string
  unit: string
  icon: any
  warning?: boolean
}) {
  const percentage = Math.min(100, (value / max) * 100)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            className="text-white/[0.08]"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-500',
              warning ? 'text-red-500' : percentage > 70 ? 'text-emerald-500' : percentage > 40 ? 'text-amber-500' : 'text-red-500'
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn('w-4 h-4 mb-0.5', warning ? 'text-red-400' : 'text-emerald-400/70')} />
          <span className="text-sm font-bold text-white tabular-nums">{value}</span>
          <span className="text-[10px] text-white/30">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] text-white/40 mt-1">{label}</span>
    </div>
  )
}

export function VehicleHUD({ stats, className, compact = false }: VehicleHUDProps) {
  const hasWarning = stats.checkEngineLight || (stats.dtcCodes && stats.dtcCodes.length > 0)

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Warning Banner */}
        {hasWarning && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/50 border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs text-red-300">Check Engine</span>
            {stats.dtcCodes && stats.dtcCodes.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-auto">
                {stats.dtcCodes.length} DTC{stats.dtcCodes.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Primary Stats — Mileage & Fuel */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatCard
            icon={Gauge}
            label="Mileage"
            value={stats.mileage || 0}
            unit="mi"
          />
          <StatCard
            icon={Fuel}
            label="Fuel"
            value={stats.fuelLevel || 0}
            unit="%"
            percentage={stats.fuelLevel}
            warning={(stats.fuelLevel || 0) < 20}
          />
        </div>

        {/* Health Stats — Oil, Brakes, Tires, Battery */}
        <div className="grid grid-cols-2 gap-1.5">
          <StatCard
            icon={Drop}
            label="Oil Life"
            value={stats.oilLife || 0}
            unit="%"
            percentage={stats.oilLife || 0}
            warning={(stats.oilLife || 0) < 20}
          />
          <StatCard
            icon={Tire}
            label="Brakes"
            value={stats.brakeLife || 0}
            unit="%"
            percentage={stats.brakeLife || 0}
            warning={(stats.brakeLife || 0) < 20}
          />
          <StatCard
            icon={Tire}
            label="Tires"
            value={stats.tireHealth || 0}
            unit="%"
            percentage={stats.tireHealth || 0}
            warning={(stats.tireHealth || 0) < 30}
          />
          <StatCard
            icon={Zap}
            label="Battery"
            value={stats.batteryHealth || 0}
            unit="%"
            percentage={stats.batteryHealth || 0}
            warning={(stats.batteryHealth || 0) < 20}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Vehicle Title */}
      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <h3 className="font-bold text-white text-sm">
          {stats.name || formatVehicleName(stats)}
        </h3>
        <div className="flex gap-2 mt-1">
          {stats.licensePlate && (
            <Badge variant="secondary" className="text-xs font-mono">
              {stats.licensePlate}
            </Badge>
          )}
          {stats.vin && (
            <Badge variant="outline" className="text-xs font-mono text-white/40">
              VIN: ...{stats.vin.slice(-6)}
            </Badge>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {hasWarning && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/30 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-sm font-medium text-red-300">Check Engine Light Active</span>
          </div>
          {stats.dtcCodes && stats.dtcCodes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.dtcCodes.map((code) => (
                <Badge key={code} variant="destructive" className="text-xs font-mono">
                  {code}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time Gauges */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
        <CircularGauge
          value={stats.rpm || 0}
          max={8000}
          label="RPM"
          unit="x100"
          icon={Engine}
        />
        <CircularGauge
          value={stats.speed || 0}
          max={120}
          label="Speed"
          unit="mph"
          icon={Car}
        />
        <CircularGauge
          value={stats.fuelLevel || 0}
          max={100}
          label="Fuel"
          unit="%"
          icon={Fuel}
          warning={(stats.fuelLevel || 0) < 20}
        />
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Gauge}
          label="Odometer"
          value={stats.mileage || 0}
          unit="miles"
        />
        <StatCard
          icon={Engine}
          label="Engine Hours"
          value={stats.engineHours || 0}
          unit="hrs"
        />
      </div>

      {/* Health Stats */}
      <div className="space-y-2">
        <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Health Status</h4>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Drop}
            label="Oil Life"
            value={stats.oilLife || 0}
            unit="%"
            percentage={stats.oilLife || 0}
            warning={(stats.oilLife || 0) < 20}
          />
          <StatCard
            icon={Tire}
            label="Brakes"
            value={stats.brakeLife || 0}
            unit="%"
            percentage={stats.brakeLife || 0}
            warning={(stats.brakeLife || 0) < 20}
          />
          <StatCard
            icon={Tire}
            label="Tires"
            value={stats.tireHealth || 0}
            unit="%"
            percentage={stats.tireHealth || 0}
            warning={(stats.tireHealth || 0) < 30}
          />
          <StatCard
            icon={Zap}
            label="Battery"
            value={stats.batteryVoltage?.toFixed(1) || '0.0'}
            unit="V"
            warning={(stats.batteryVoltage || 0) < 11.5}
          />
        </div>
      </div>

      {/* Temperature & Load */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          icon={Thermometer}
          label="Coolant"
          value={stats.coolantTemp || 0}
          unit="°F"
          warning={(stats.coolantTemp || 0) > 220}
        />
        <StatCard
          icon={Engine}
          label="Engine Load"
          value={stats.engineLoad || 0}
          unit="%"
          percentage={stats.engineLoad || 0}
        />
      </div>
    </div>
  )
}

export type { VehicleStats }
export default VehicleHUD
