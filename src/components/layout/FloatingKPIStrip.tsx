/**
 * FloatingKPIStrip - Premium Cinematic Metrics Over Map
 *
 * Displays 6 key intelligence indicators with high-fidelity micro-interactions.
 * Integrates directly with ArchonY's master design system tokens.
 * Fetches live data from /api/dashboard/stats.
 */
import {
  Truck,
  Activity,
  Wrench,
  AlertTriangle,
  Gauge,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

interface KPIChip {
  label: string
  value: string | number
  icon: React.ReactNode
  moduleId: string
  color: string
  glowColor: string
}

function buildKPIs(stats: {
  total_vehicles?: number
  active_vehicles?: number
  maintenance_vehicles?: number
  total_drivers?: number
  open_work_orders?: number
}): KPIChip[] {
  const total = stats.total_vehicles ?? 0
  const active = stats.active_vehicles ?? 0
  const maint = stats.maintenance_vehicles ?? 0
  const drivers = stats.total_drivers ?? 0
  const alerts = stats.open_work_orders ?? 0
  const capacity = total > 0 ? Math.round((active / total) * 100) : 0

  return [
    {
      label: 'Vehicles',
      value: total,
      icon: <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'fleet',
      color: '#41B2E3',
      glowColor: 'rgba(65,178,227,0.3)',
    },
    {
      label: 'Online',
      value: active,
      icon: <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'live-fleet-dashboard',
      color: '#10B981',
      glowColor: 'rgba(16,185,129,0.3)',
    },
    {
      label: 'In Service',
      value: maint,
      icon: <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'garage',
      color: '#F0A000',
      glowColor: 'rgba(240,160,0,0.3)',
    },
    {
      label: 'Work Orders',
      value: alerts,
      icon: <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'safety-alerts',
      color: '#DD3903',
      glowColor: 'rgba(221,57,3,0.3)',
    },
    {
      label: 'Capacity',
      value: `${capacity}%`,
      icon: <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'fleet-optimizer',
      color: '#A855F7',
      glowColor: 'rgba(168,85,247,0.3)',
    },
    {
      label: 'Personnel',
      value: drivers,
      icon: <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />,
      moduleId: 'driver-mgmt',
      color: '#38BDF8',
      glowColor: 'rgba(56,189,248,0.3)',
    },
  ]
}

export function FloatingKPIStrip() {
  const { openPanel, isOpen } = usePanel()
  const [kpis, setKpis] = useState<KPIChip[]>(() => buildKPIs({}))

  useEffect(() => {
    let cancelled = false

    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats', { credentials: 'include' })
        if (!res.ok) return
        const json = await res.json()
        const data = json.data ?? json
        if (!cancelled) {
          setKpis(buildKPIs(data))
        }
      } catch {
        // keep defaults on error
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const handleChipClick = useCallback(
    (kpi: KPIChip) => {
      import('@/config/module-registry').then(({ getModule }) => {
        const mod = getModule(kpi.moduleId)
        if (!mod) return
        openPanel({
          id: `kpi-${kpi.moduleId}-${Date.now()}`,
          moduleId: mod.id,
          title: mod.label,
          width: mod.panelWidth,
          category: mod.category,
        })
      })
    },
    [openPanel]
  )

  return (
    <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10 pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-none pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {!isOpen && kpis.map((kpi, index) => (
            <motion.button
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1]
              }}
              onClick={() => handleChipClick(kpi)}
              className={cn(
                'group relative flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl',
                'bg-[#0A0E27]/80 backdrop-blur-2xl',
                'border border-white/10',
                'hover:border-white/20 hover:bg-[#0A0E27]/90 transition-all duration-300 shadow-2xl',
                'active:scale-95 shrink-0 sm:shrink'
              )}
            >
              {/* Dynamic Aura Glow */}
              <div
                className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                style={{ backgroundColor: kpi.color }}
              />

              {/* Icon Container */}
              <div
                className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/[0.05] transition-transform group-hover:scale-110"
                style={{ color: kpi.color }}
              >
                {kpi.icon}
              </div>

              <div className="flex flex-col items-start">
                <span className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-[0.15em] leading-none mb-0.5">
                  {kpi.label}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white tabular-nums leading-none">
                  {kpi.value}
                </span>
              </div>

              {/* Active Underline */}
              <div
                className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-[1.5px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ backgroundColor: kpi.color, boxShadow: `0 2px 10px ${kpi.glowColor}` }}
              />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
