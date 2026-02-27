/**
 * IconRail — Minimal left navigation
 *
 * Tesla/Rivian minimal: monochrome icons, labels at ghost opacity.
 * Active = white icon with subtle bg. Everything else = near-invisible.
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
  { id: 'maintenance', label: 'Maint', icon: <Wrench className="w-5 h-5" /> },
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
    (cat: ModuleCategory) => { setFlyout(cat) },
    [setFlyout]
  )

  const handleClick = useCallback(
    (cat: ModuleCategory) => { setFlyout(flyoutCategory === cat ? null : cat) },
    [flyoutCategory, setFlyout]
  )

  return (
    <nav
      className="relative flex flex-col items-center w-16 h-full shrink-0 bg-[#0a0a0a] border-r border-white/[0.04] z-30"
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Logo area */}
      <div className="h-14 flex items-center justify-center border-b border-white/[0.04] w-full">
        <span className="text-[11px] font-bold text-white/40 tracking-[0.15em]">CTA</span>
      </div>

      {/* Category icons */}
      <div className="flex flex-col items-center gap-1 pt-4 flex-1">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          const isHovered = flyoutCategory === cat.id

          return (
            <button
              key={cat.id}
              onMouseEnter={() => handleMouseEnter(cat.id)}
              onClick={() => handleClick(cat.id)}
              aria-label={cat.label}
              title={hubDescriptions[cat.id] || cat.label}
              className={cn(
                'flex flex-col items-center justify-center w-11 h-11 rounded-xl transition-all duration-150',
                isActive
                  ? 'text-white bg-white/[0.08]'
                  : isHovered
                    ? 'text-white/50 bg-white/[0.04]'
                    : 'text-white/20 hover:text-white/40'
              )}
            >
              {cat.icon}
              <span className={cn(
                'text-[8px] mt-0.5 font-medium',
                isActive ? 'text-white/50' : 'text-inherit'
              )}>
                {cat.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
