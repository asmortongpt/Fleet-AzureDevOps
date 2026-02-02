/**
 * FloatingKPIStrip - Floating metrics bar over the map canvas
 *
 * Shows 6 key KPI chips. Each chip is clickable to open a panel.
 * Glass-morphism design with dawn gradient hover accent.
 * Hides when a panel is open.
 */
import {
  Truck,
  Activity,
  Wrench,
  AlertTriangle,
  Gauge,
  Users,
} from 'lucide-react'
import { useCallback } from 'react'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

interface KPIChip {
  label: string
  value: string | number
  icon: React.ReactNode
  moduleId: string
  color: string
  bgColor: string
}

const defaultKPIs: KPIChip[] = [
  {
    label: 'Total Vehicles',
    value: '847',
    icon: <Truck className="w-3.5 h-3.5" />,
    moduleId: 'fleet',
    color: 'text-[#41B2E3]',
    bgColor: 'bg-[#41B2E3]/10',
  },
  {
    label: 'Active',
    value: '623',
    icon: <Activity className="w-3.5 h-3.5" />,
    moduleId: 'live-fleet-dashboard',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
  },
  {
    label: 'In Maintenance',
    value: '47',
    icon: <Wrench className="w-3.5 h-3.5" />,
    moduleId: 'garage',
    color: 'text-[#F0A000]',
    bgColor: 'bg-[#F0A000]/10',
  },
  {
    label: 'Alerts',
    value: '12',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    moduleId: 'safety-alerts',
    color: 'text-[#DD3903]',
    bgColor: 'bg-[#DD3903]/10',
  },
  {
    label: 'Utilization',
    value: '87%',
    icon: <Gauge className="w-3.5 h-3.5" />,
    moduleId: 'fleet-optimizer',
    color: 'text-violet-400',
    bgColor: 'bg-violet-400/10',
  },
  {
    label: 'Drivers',
    value: '412',
    icon: <Users className="w-3.5 h-3.5" />,
    moduleId: 'driver-mgmt',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/10',
  },
]

export function FloatingKPIStrip() {
  const { openPanel, isOpen } = usePanel()

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

  // Hide when a panel is open
  if (isOpen) return null

  return (
    <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
      <div className="flex items-center gap-2.5 flex-wrap pointer-events-auto">
        {defaultKPIs.map(kpi => (
          <button
            key={kpi.label}
            onClick={() => handleChipClick(kpi)}
            className={cn(
              'group relative flex items-center gap-2.5 px-3.5 py-2 rounded-xl',
              'bg-[#0A0E27]/85 backdrop-blur-xl',
              'border border-white/[0.08]',
              'hover:border-white/[0.15] hover:bg-[#0A0E27]/92',
              'transition-all duration-250 shadow-lg shadow-black/20'
            )}
          >
            {/* Icon with colored background */}
            <span className={cn('flex items-center justify-center w-7 h-7 rounded-lg', kpi.bgColor, kpi.color)}>
              {kpi.icon}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-white/40 leading-none hidden lg:block">{kpi.label}</span>
              <span className="text-sm font-semibold text-white tabular-nums leading-tight">{kpi.value}</span>
            </div>

            {/* Dawn gradient underline on hover */}
            <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-[#F0A000] to-[#DD3903] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
          </button>
        ))}
      </div>
    </div>
  )
}
