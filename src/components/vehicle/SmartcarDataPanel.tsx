/**
 * SmartcarDataPanel — Displays all Smartcar signal data for a connected vehicle.
 *
 * Groups signals into categories: Location, Battery/Fuel, Security, Diagnostics,
 * Tires, Oil, and Vehicle Info. Only renders sections where data is available.
 */

import {
  MapPin,
  Gauge,
  Battery,
  Fuel,
  Lock,
  Unlock,
  Wrench,
  CircleDot,
  Car,
  Compass,
  Zap,
  Activity,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { useSmartcar, type SmartcarSignals } from '@/hooks/use-smartcar'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format-helpers'

interface SmartcarDataPanelProps {
  vehicleId: string
  className?: string
}

// ---------------------------------------------------------------------------
// Signal Card
// ---------------------------------------------------------------------------

function SignalCard({
  icon: Icon,
  label,
  value,
  unit,
  subtext,
  colorClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number | null | undefined
  unit?: string
  subtext?: string
  colorClass?: string
}) {
  if (value == null) return null

  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="h-3 w-3 text-white/30" />
        <span className="text-[10px] text-white/40 font-medium">{label}</span>
      </div>
      <div className={cn('text-sm font-bold text-white leading-tight', colorClass)}>
        {typeof value === 'number' ? formatNumber(value, 1) : value}
        {unit && <span className="text-[10px] text-white/30 font-normal ml-0.5">{unit}</span>}
      </div>
      {subtext && <p className="text-[9px] text-white/25 mt-0.5">{subtext}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Signal Section
// ---------------------------------------------------------------------------

function SignalSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  // Don't render if no visible children
  const hasContent = children != null
  if (!hasContent) return null

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3 w-3 text-white/40" />
        <h5 className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{title}</h5>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tire pressure helpers
// ---------------------------------------------------------------------------

function tirePsiFromKpa(kpa: number | null): number | null {
  if (kpa == null) return null
  return kpa * 0.14503773 // kPa to PSI
}

function tirePressureColor(psi: number | null): string {
  if (psi == null) return ''
  if (psi >= 30 && psi <= 36) return 'text-emerald-400'
  if (psi >= 25 || psi <= 42) return 'text-amber-400'
  return 'text-rose-400'
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SmartcarDataPanel({ vehicleId, className }: SmartcarDataPanelProps) {
  const { isConnected, signals, isLoadingSignals } = useSmartcar(vehicleId)
  const [expanded, setExpanded] = useState(true)

  if (!isConnected) return null

  if (isLoadingSignals) {
    return (
      <div className={cn('rounded-lg bg-[#242424] border border-white/[0.08] p-3', className)}>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading Smartcar signals...
        </div>
      </div>
    )
  }

  if (!signals) return null

  const hasAnyData = Object.values(signals).some(v => v != null)
  if (!hasAnyData) return null

  // Tire pressures in PSI
  const flPsi = tirePsiFromKpa(signals.tires?.frontLeft ?? null)
  const frPsi = tirePsiFromKpa(signals.tires?.frontRight ?? null)
  const blPsi = tirePsiFromKpa(signals.tires?.backLeft ?? null)
  const brPsi = tirePsiFromKpa(signals.tires?.backRight ?? null)
  const hasTires = flPsi != null || frPsi != null || blPsi != null || brPsi != null

  return (
    <div className={cn('rounded-lg bg-[#242424] border border-white/[0.08]', className)}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-white/[0.02] transition-colors"
        aria-label={expanded ? 'Collapse Smartcar data' : 'Expand Smartcar data'}
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-white/70">Live Vehicle Data</span>
          <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0">
            Smartcar
          </Badge>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-white/30" />
          : <ChevronDown className="h-3.5 w-3.5 text-white/30" />
        }
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-3">

          {/* Location & Movement */}
          {(signals.location || signals.odometer || signals.speed) && (
            <SignalSection title="Location & Movement" icon={MapPin}>
              <SignalCard
                icon={MapPin}
                label="GPS"
                value={signals.location ? `${signals.location.latitude.toFixed(4)}, ${signals.location.longitude.toFixed(4)}` : null}
              />
              <SignalCard icon={Gauge} label="Odometer" value={signals.odometer?.distance} unit="mi" />
              <SignalCard icon={Gauge} label="Speed" value={signals.speed?.speed} unit="mph" />
              {signals.location && (
                <SignalCard icon={Compass} label="Heading" value={null} />
              )}
            </SignalSection>
          )}

          {/* Battery & Charging (EV) */}
          {(signals.battery || signals.charge) && (
            <SignalSection title="Battery & Charging" icon={Battery}>
              <SignalCard
                icon={Battery}
                label="Charge"
                value={signals.battery?.percentRemaining != null ? `${Math.round(signals.battery.percentRemaining * 100)}` : null}
                unit="%"
                colorClass={
                  signals.battery?.percentRemaining != null
                    ? signals.battery.percentRemaining >= 0.5 ? 'text-emerald-400' : signals.battery.percentRemaining >= 0.2 ? 'text-amber-400' : 'text-rose-400'
                    : undefined
                }
              />
              <SignalCard icon={Gauge} label="EV Range" value={signals.battery?.range} unit="mi" />
              <SignalCard
                icon={Zap}
                label="Charging"
                value={signals.charge?.state ?? null}
                colorClass={signals.charge?.state === 'CHARGING' ? 'text-emerald-400' : undefined}
              />
              {signals.charge?.isPluggedIn != null && (
                <SignalCard icon={Zap} label="Plugged In" value={signals.charge.isPluggedIn ? 'Yes' : 'No'} />
              )}
            </SignalSection>
          )}

          {/* Fuel */}
          {signals.fuel && (
            <SignalSection title="Fuel" icon={Fuel}>
              <SignalCard
                icon={Fuel}
                label="Fuel Level"
                value={signals.fuel.percentRemaining != null ? `${Math.round(signals.fuel.percentRemaining * 100)}` : null}
                unit="%"
                colorClass={
                  signals.fuel.percentRemaining >= 0.25 ? 'text-emerald-400' : 'text-rose-400'
                }
              />
              <SignalCard icon={Gauge} label="Fuel Range" value={signals.fuel.range} unit="mi" />
            </SignalSection>
          )}

          {/* Security */}
          {signals.lockStatus && (
            <SignalSection title="Security" icon={Lock}>
              <SignalCard
                icon={signals.lockStatus.isLocked ? Lock : Unlock}
                label="Lock Status"
                value={signals.lockStatus.isLocked == null ? null : signals.lockStatus.isLocked ? 'Locked' : 'Unlocked'}
                colorClass={signals.lockStatus.isLocked ? 'text-emerald-400' : 'text-amber-400'}
              />
            </SignalSection>
          )}

          {/* Diagnostics */}
          {signals.diagnostics && (
            <SignalSection title="Diagnostics" icon={Wrench}>
              <SignalCard
                icon={Activity}
                label="DTC Codes"
                value={signals.diagnostics.dtcCount}
                colorClass={signals.diagnostics.dtcCount === 0 ? 'text-emerald-400' : 'text-rose-400'}
              />
              {signals.diagnostics.milStatus != null && (
                <SignalCard
                  icon={Activity}
                  label="Check Engine"
                  value={signals.diagnostics.milStatus ? 'ON' : 'OFF'}
                  colorClass={signals.diagnostics.milStatus ? 'text-rose-400' : 'text-emerald-400'}
                />
              )}
              {signals.diagnostics.dtcCodes.length > 0 && (
                <div className="col-span-2 text-[10px] text-white/40 font-mono">
                  {signals.diagnostics.dtcCodes.join(', ')}
                </div>
              )}
            </SignalSection>
          )}

          {/* Engine Oil */}
          {signals.oil && signals.oil.lifeRemaining != null && (
            <SignalSection title="Engine Oil" icon={CircleDot}>
              <SignalCard
                icon={CircleDot}
                label="Oil Life"
                value={`${Math.round(signals.oil.lifeRemaining * 100)}`}
                unit="%"
                colorClass={signals.oil.lifeRemaining >= 0.3 ? 'text-emerald-400' : signals.oil.lifeRemaining >= 0.15 ? 'text-amber-400' : 'text-rose-400'}
              />
            </SignalSection>
          )}

          {/* Tires */}
          {hasTires && (
            <SignalSection title="Tire Pressure" icon={CircleDot}>
              <SignalCard icon={CircleDot} label="FL" value={flPsi} unit="PSI" colorClass={tirePressureColor(flPsi)} />
              <SignalCard icon={CircleDot} label="FR" value={frPsi} unit="PSI" colorClass={tirePressureColor(frPsi)} />
              <SignalCard icon={CircleDot} label="BL" value={blPsi} unit="PSI" colorClass={tirePressureColor(blPsi)} />
              <SignalCard icon={CircleDot} label="BR" value={brPsi} unit="PSI" colorClass={tirePressureColor(brPsi)} />
            </SignalSection>
          )}

          {/* Vehicle Info */}
          {(signals.vehicleInfo || signals.vin) && (
            <SignalSection title="Vehicle Info" icon={Car}>
              {signals.vin && (
                <div className="col-span-2">
                  <SignalCard icon={Car} label="VIN" value={signals.vin} />
                </div>
              )}
              <SignalCard icon={Car} label="Color" value={signals.vehicleInfo?.exteriorColor} />
              <SignalCard icon={Car} label="Trim" value={signals.vehicleInfo?.trimLevel} />
            </SignalSection>
          )}
        </div>
      )}
    </div>
  )
}
