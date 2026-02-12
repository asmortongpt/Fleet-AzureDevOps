/**
 * IconRail - Left 56px icon navigation rail for the ArchonY SPA
 *
 * 6 category icons vertically stacked. Hover/click opens FlyoutMenu.
 * Active category shows BLUE SKIES left-edge indicator.
 * CTA square logo at bottom with dawn gradient bar.
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
  { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'admin', label: 'Admin', icon: <Settings className="w-5 h-5" /> },
]

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
    <aside
      className="relative flex flex-col items-center w-12 lg:w-14 h-full shrink-0 bg-background/90 border-r border-border/50 z-30"
    >
      {/* Dawn gradient accent bar at top */}
      <div className="w-full h-[3px] bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903] shrink-0" />

      {/* Category icons */}
      <div className="flex flex-col items-center gap-1 pt-4 flex-1">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id
          const isHovered = flyoutCategory === cat.id

          return (
            <div key={cat.id} className="relative">
              {/* Active indicator - BLUE SKIES left bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#41B2E3] shadow-[0_0_8px_rgba(0,212,255,0.5)]" />
              )}

              <button
                onMouseEnter={() => handleMouseEnter(cat.id)}
                onClick={() => handleClick(cat.id)}
                aria-label={cat.label}
                title={cat.label}
                className={cn(
                  'flex flex-col items-center justify-center w-10 h-11 lg:w-11 lg:h-12 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-[#41B2E3] bg-[#41B2E3]/[0.08]'
                    : isHovered
                      ? 'text-foreground bg-muted/40'
                      : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {cat.icon}
                <span className={cn(
                  'text-[7px] lg:text-[8px] mt-0.5 font-medium tracking-wide',
                  isActive ? 'text-[#41B2E3]/70' : 'text-inherit'
                )}>
                  {cat.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom: CTA square logo mark - Option 2 from ADELE branding doc (page 6) */}
      <div className="pb-3 flex flex-col items-center">
        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-card/80 flex flex-col items-center justify-center border border-border/50 shadow-lg">
          <span className="text-[9px] font-extrabold text-foreground tracking-wide leading-none">CTA</span>
          <div className="w-5 h-[2px] mt-1 rounded-full bg-gradient-to-r from-[#FDB813] to-[#FF5722]" />
        </div>
      </div>
    </aside>
  )
}
