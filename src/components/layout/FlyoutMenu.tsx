/**
 * FlyoutMenu — Module picker that flies out from the IconRail
 *
 * Minimal panel: category label + module list. No visual noise.
 */
import { useCallback } from 'react'

import { getModulesByCategory, getModule, type ModuleCategory } from '@/config/module-registry'
import { useNavigation } from '@/contexts/NavigationContext'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

const categoryLabels: Record<ModuleCategory, string> = {
  fleet: 'Fleet Management',
  operations: 'Operations',
  maintenance: 'Maintenance',
  safety: 'Safety & Compliance',
  analytics: 'Analytics & Reports',
  admin: 'Administration',
}

export function FlyoutMenu() {
  const { state, setFlyout } = usePanel()
  const { navigateTo } = useNavigation()
  const { flyoutCategory } = state

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      const mod = getModule(moduleId)
      if (!mod) return
      navigateTo(mod.id)
      setFlyout(null)
    },
    [navigateTo, setFlyout]
  )

  if (!flyoutCategory) return null

  const modules = getModulesByCategory(flyoutCategory)

  return (
    <nav
      className="absolute left-16 top-0 bottom-0 z-40 flex"
      role="navigation"
      aria-label={flyoutCategory ? `${categoryLabels[flyoutCategory]} modules` : 'Module navigation'}
    >
      <div
        className={cn(
          'w-52 h-full bg-[var(--surface-1)]',
          'border-r border-[var(--border-subtle)]',
          'shadow-[4px_0_32px_rgba(0,0,0,0.5)]',
          'overflow-y-auto scrollbar-none',
        )}
      >
        {/* Category header */}
        <div className="sticky top-0 bg-[var(--surface-1)] px-5 pt-5 pb-3 border-b border-[var(--border-subtle)]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            {categoryLabels[flyoutCategory]}
          </h2>
        </div>

        {/* Module list */}
        <ul className="p-2">
          {modules.map(mod => (
            <li key={mod.id}>
              <button
                onClick={() => handleSelectModule(mod.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-glass)] transition-colors duration-150 focus:outline-none"
              >
                {mod.label}
              </button>
            </li>
          ))}

          {modules.length === 0 && (
            <p className="text-[13px] text-[var(--text-quaternary)] px-3 py-8 text-center">
              No modules available
            </p>
          )}
        </ul>
      </div>
    </nav>
  )
}
