/**
 * VehicleRail — Compact vehicle list for dashboard right panel
 *
 * 360px width. Grouped by status. Compact rows with status dot,
 * make/model, location, fuel/battery bar.
 */
import { useState } from 'react'
import { Search, MapPin, Battery, Fuel, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface RailVehicle {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  location?: string
  fuelPercent?: number
  batteryPercent?: number
  onClick?: () => void
}

interface VehicleRailProps {
  vehicles: RailVehicle[]
  selectedId?: string
  onSelect?: (id: string) => void
  className?: string
}

const statusColors = {
  active: '#10b981',
  idle: '#f59e0b',
  offline: '#6b7280',
}

const statusLabels = {
  active: 'Active',
  idle: 'Idle',
  offline: 'Offline',
}

export function VehicleRail({ vehicles, selectedId, onSelect, className }: VehicleRailProps) {
  const [search, setSearch] = useState('')
  const [expandedGroup, setExpandedGroup] = useState<string | null>('active')

  const filtered = vehicles.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  )

  const groups = (['active', 'idle', 'offline'] as const).map(status => ({
    status,
    vehicles: filtered.filter(v => v.status === status),
  })).filter(g => g.vehicles.length > 0)

  return (
    <div className={cn('w-[360px] h-full flex flex-col bg-[var(--surface-1)] border-l border-white/[0.05]', className)}>
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04]">
          <Search className="h-3.5 w-3.5 text-white/25" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vehicles..."
            className="bg-transparent text-[12px] text-white/80 placeholder:text-white/20 outline-none flex-1"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.status}>
            <button
              onClick={() => setExpandedGroup(expandedGroup === group.status ? null : group.status)}
              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-white/[0.02]"
            >
              <div className="w-2 h-2 rounded-full" style={{ background: statusColors[group.status] }} />
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em]">
                {statusLabels[group.status]}
              </span>
              <span className="text-[10px] text-white/20 tabular-nums">{group.vehicles.length}</span>
              {expandedGroup === group.status
                ? <ChevronUp className="h-3 w-3 text-white/20 ml-auto" />
                : <ChevronDown className="h-3 w-3 text-white/20 ml-auto" />
              }
            </button>
            {expandedGroup === group.status && group.vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => { v.onClick?.(); onSelect?.(v.id) }}
                className={cn(
                  'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors',
                  selectedId === v.id ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]',
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: statusColors[v.status] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white/75 truncate">{v.name}</div>
                  {v.location && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-white/20" />
                      <span className="text-[10px] text-white/25 truncate">{v.location}</span>
                    </div>
                  )}
                </div>
                {v.batteryPercent !== undefined && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Battery className="h-3 w-3 text-white/20" />
                    <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.batteryPercent}%`,
                          background: v.batteryPercent > 20 ? '#10b981' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                )}
                {v.fuelPercent !== undefined && !v.batteryPercent && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Fuel className="h-3 w-3 text-white/20" />
                    <div className="w-10 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${v.fuelPercent}%`,
                          background: v.fuelPercent > 25 ? '#10b981' : '#f59e0b',
                        }}
                      />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
