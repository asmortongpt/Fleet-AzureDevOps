/**
 * MobileTabBar - Bottom tab bar for tablet/mobile breakpoints
 *
 * Replaces the IconRail when viewport < 1024px.
 * 6 icons + labels in a horizontal strip.
 */
import {
  Truck,
  Route,
  Wrench,
  ShieldCheck,
  BarChart3,
  Settings,
  MapPin,
} from 'lucide-react'
import { useCallback, type ReactNode } from 'react'
import { usePanel } from '@/contexts/PanelContext'
import { getModule, type ModuleCategory } from '@/config/module-registry'
import { cn } from '@/lib/utils'

interface TabDef {
  id: ModuleCategory | 'map'
  label: string
  icon: ReactNode
  moduleId?: string
}

const tabs: TabDef[] = [
  { id: 'map', label: 'Map', icon: <MapPin className="w-4 h-4" /> },
  { id: 'fleet', label: 'Fleet', icon: <Truck className="w-4 h-4" />, moduleId: 'fleet' },
  { id: 'operations', label: 'Ops', icon: <Route className="w-4 h-4" />, moduleId: 'dispatch-console' },
  { id: 'maintenance', label: 'Maint', icon: <Wrench className="w-4 h-4" />, moduleId: 'garage' },
  { id: 'safety', label: 'Safety', icon: <ShieldCheck className="w-4 h-4" />, moduleId: 'safety' },
  { id: 'analytics', label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, moduleId: 'financial' },
]

export function MobileTabBar() {
  const { state, openPanel, closeAll } = usePanel()
  const { activeCategory } = state

  const handleTabClick = useCallback(
    (tab: TabDef) => {
      if (tab.id === 'map') {
        closeAll()
        return
      }
      if (!tab.moduleId) return
      const mod = getModule(tab.moduleId)
      if (!mod) return
      openPanel({
        id: `tab-${mod.id}-${Date.now()}`,
        moduleId: mod.id,
        title: mod.label,
        width: 'takeover', // Always full-width on mobile
        category: mod.category,
      })
    },
    [openPanel, closeAll]
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[--cta-midnight]/95 backdrop-blur-xl border-t border-white/10 safe-bottom lg:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => {
          const isActive =
            (tab.id === 'map' && !state.stack.length) ||
            (tab.id !== 'map' && activeCategory === tab.id)

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive ? 'text-[--cta-blue-skies]' : 'text-white/40'
              )}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-[10px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
