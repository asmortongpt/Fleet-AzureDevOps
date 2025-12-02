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

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Gauge,
  Engine,
  Car,
  Lightning,
  Warning,
  GasPump,
  Thermometer,
  GearSix,
  Drop,
  Tire
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

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

// Helper to get color based on percentage
function getHealthColor(value: number): string {
  if (value >= 70) return 'text-green-500'
  if (value >= 40) return 'text-yellow-500'
  return 'text-red-500'
}

function getProgressColor(value: number): string {
  if (value >= 70) return 'bg-green-500'
  if (value >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
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
  icon: React.ElementType
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
        'flex flex-col gap-1 p-3 rounded-lg bg-gradient-to-br from-slate-900/90 to-slate-800/90',
        'border border-slate-700/50 backdrop-blur-sm',
        warning && 'border-red-500/50 bg-red-950/20',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('w-4 h-4', warning ? 'text-red-400' : 'text-blue-400')} />
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'text-xl font-bold tabular-nums',
          warning ? 'text-red-400' : 'text-white'
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {percentage !== undefined && (
        <div className="mt-1">
          <Progress
            value={percentage}
            className="h-1.5 bg-slate-700"
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
  icon: React.ElementType
  warning?: boolean
}) {
  const percentage = Math.min(100, (value / max) * 100)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-700"
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
              warning ? 'text-red-500' : percentage > 70 ? 'text-green-500' : percentage > 40 ? 'text-yellow-500' : 'text-red-500'
            )}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className={cn('w-4 h-4 mb-0.5', warning ? 'text-red-400' : 'text-blue-400')} />
          <span className="text-lg font-bold text-white tabular-nums">{value}</span>
          <span className="text-[10px] text-slate-500">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-1">{label}</span>
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
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-950/50 border border-red-500/50">
            <Warning className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs text-red-300">Check Engine</span>
            {stats.dtcCodes && stats.dtcCodes.length > 0 && (
              <Badge variant="destructive" className="text-xs ml-auto">
                {stats.dtcCodes.length} DTC{stats.dtcCodes.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Gauge}
            label="Mileage"
            value={stats.mileage || 0}
            unit="mi"
          />
          <StatCard
            icon={GasPump}
            label="Fuel"
            value={stats.fuelLevel || 0}
            unit="%"
            percentage={stats.fuelLevel}
            warning={(stats.fuelLevel || 0) < 20}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Vehicle Title */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30">
        <h3 className="font-bold text-white text-lg">
          {stats.name || `${stats.year} ${stats.make} ${stats.model}`}
        </h3>
        <div className="flex gap-2 mt-1">
          {stats.licensePlate && (
            <Badge variant="secondary" className="text-xs font-mono">
              {stats.licensePlate}
            </Badge>
          )}
          {stats.vin && (
            <Badge variant="outline" className="text-xs font-mono text-slate-400">
              VIN: ...{stats.vin.slice(-6)}
            </Badge>
          )}
        </div>
      </div>

      {/* Warning Banner */}
      {hasWarning && (
        <div className="p-3 rounded-lg bg-red-950/50 border border-red-500/50 animate-pulse">
          <div className="flex items-center gap-2">
            <Warning className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-red-300">Check Engine Light Active</span>
          </div>
          {stats.dtcCodes && stats.dtcCodes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {stats.dtcCodes.map((code, i) => (
                <Badge key={i} variant="destructive" className="text-xs font-mono">
                  {code}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real-time Gauges */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
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
          icon={GasPump}
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
          icon={GearSix}
          label="Engine Hours"
          value={stats.engineHours || 0}
          unit="hrs"
        />
      </div>

      {/* Health Stats */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Health Status</h4>
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
            icon={Lightning}
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
