/**
 * MobileTabBar - Bottom tab bar for tablet/mobile breakpoints
 *
 * Replaces the IconRail when viewport < 1024px.
 * 5 icons + labels in a horizontal strip matching the 5-hub model.
 */
import {
  Map,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
} from 'lucide-react'
import { useCallback, type ReactNode } from 'react'

import { getModule, type ModuleCategory } from '@/config/module-registry'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

interface TabDef {
  id: ModuleCategory | 'admin'
  label: string
  icon: ReactNode
  moduleId?: string
}

const tabs: TabDef[] = [
  { id: 'fleet', label: 'Fleet', icon: <Map className="w-4 h-4" />, moduleId: 'fleet' },
  { id: 'safety', label: 'Safety', icon: <ShieldCheck className="w-4 h-4" />, moduleId: 'safety' },
  { id: 'analytics', label: 'Business', icon: <BarChart3 className="w-4 h-4" />, moduleId: 'financial' },
  { id: 'operations', label: 'People', icon: <Users className="w-4 h-4" />, moduleId: 'dispatch-console' },
  { id: 'admin', label: 'Admin', icon: <Settings className="w-4 h-4" /> },
]

export function MobileTabBar() {
  const { state, openPanel, closeAll } = usePanel()
  const { activeCategory } = state

  const handleTabClick = useCallback(
    (tab: TabDef) => {
      if (!tab.moduleId) {
        // Admin tab - navigate without a module
        closeAll()
        return
      }
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0D0320] backdrop-blur-xl border-t border-[rgba(0,204,254,0.08)] safe-bottom lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-12 sm:h-14">
        {tabs.map(tab => {
          const isActive = activeCategory === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive ? 'text-[#00CCFE]' : 'text-[rgba(255,255,255,0.40)]'
              )}
              aria-label={tab.label}
            >
              {tab.icon}
              <span className="text-[9px] sm:text-[10px]">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
