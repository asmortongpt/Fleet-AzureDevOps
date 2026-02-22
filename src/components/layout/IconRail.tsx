/**
 * IconRail - Left icon navigation rail
 *
 * 6 category icons vertically stacked. Hover/click opens FlyoutMenu.
 * Active category shows gold left-edge indicator.
 * CTA square logo at bottom.
 */
import {
  Truck,
  Route,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useCallback, type ReactNode } from 'react'

import type { ModuleCategory } from '@/config/module-registry'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

interface CategoryDef {
  id: ModuleCategory
  label: string
  icon: ReactNode
}

const categories: CategoryDef[] = [
  { id: 'fleet', label: 'Fleet', icon: <Truck className="w-5 h-5" /> },
  { id: 'operations', label: 'Ops', icon: <Route className="w-5 h-5" /> },
  { id: 'maintenance', label: 'Maint.', icon: <Wrench className="w-5 h-5" /> },
  { id: 'safety', label: 'Safety', icon: <ShieldCheck className="w-5 h-5" /> },
  { id: 'analytics', label: 'Reports', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'admin', label: 'Admin', icon: <Settings className="w-5 h-5" /> },
]

const hubDescriptions: Record<string, string> = {
  fleet: 'Fleet Dashboard',
  operations: 'Fleet Operations',
  maintenance: 'Maintenance & Work Orders',
  safety: 'Compliance & Safety',
  analytics: 'Business & Reports',
  admin: 'Admin & Configuration',
}

export function IconRail() {
  const { state, setFlyout } = usePanel()
  const { activeCategory, flyoutCategory } = state

  const handleMouseEnter = useCallback(
    (cat: ModuleCategory) => {
      setFlyout(cat)
    },
    [setFlyout]
  )

  const handleClick = useCallback(
    (cat: ModuleCategory) => {
      setFlyout(flyoutCategory === cat ? null : cat)
    },
    [flyoutCategory, setFlyout]
  )

  return (
    <nav
      className="relative flex flex-col items-center w-12 lg:w-14 h-full shrink-0 bg-[#1a1a1a] border-r border-white/10 z-30"
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Category icons */}
      <div className="flex flex-col items-center gap-1 pt-3 flex-1">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          const isHovered = flyoutCategory === cat.id

          return (
            <div key={cat.id} className="relative">
              {/* Active indicator - White left bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
              )}

              <button
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onClick={() => handleClick(cat.id)}
                aria-label={cat.label}
                title={hubDescriptions[cat.id] || cat.label}
                className={cn(
                  'flex flex-col items-center justify-center w-10 h-11 lg:w-11 lg:h-12 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-white bg-white/15'
                    : isHovered
                      ? 'text-white bg-white/10'
                      : 'text-white/40 hover:text-white/70'
                )}
              >
                {cat.icon}
                <span className={cn(
                  'text-[7px] lg:text-[8px] mt-0.5 font-medium tracking-wide',
                  isActive ? 'text-white/80' : 'text-inherit'
                )}>
                  {cat.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom: CTA logo mark */}
      <div className="pb-3 flex flex-col items-center">
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-[#242424] flex flex-col items-center justify-center border border-white/10">
          <span className="text-[9px] font-extrabold text-white/80 tracking-wide leading-none">CTA</span>
          <div className="w-5 h-[2px] mt-1 rounded-full bg-gradient-to-r from-white/40 to-white/15" />
        </div>
      </div>
    </nav>
  )
}
