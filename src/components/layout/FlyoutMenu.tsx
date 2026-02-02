/**
 * FlyoutMenu - Sub-module listing that flies out from the IconRail
 *
 * Positioned below the header (top offset matches header height).
 * Lists sub-modules for the hovered category from module-registry.
 */
import { useCallback } from 'react'
import { usePanel } from '@/contexts/PanelContext'
import { getModulesByCategory, getModule, type ModuleCategory } from '@/config/module-registry'
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
  const { state, setFlyout, openPanel } = usePanel()
  const { flyoutCategory } = state

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      const mod = getModule(moduleId)
      if (!mod) return
      openPanel({
        id: `panel-${mod.id}-${Date.now()}`,
        moduleId: mod.id,
        title: mod.label,
        width: mod.panelWidth,
        category: mod.category,
      })
      setFlyout(null)
    },
    [openPanel, setFlyout]
  )

  if (!flyoutCategory) return null

  const modules = getModulesByCategory(flyoutCategory)

  return (
    <div
      className="absolute left-14 top-0 bottom-0 z-40 flex"
    >
      <div
        className={cn(
          'w-56 h-full bg-[#0A0E27]/97 backdrop-blur-2xl',
          'border-r border-white/[0.06]',
          'shadow-[4px_0_24px_rgba(0,0,0,0.5)]',
          'overflow-y-auto scrollbar-none',
        )}
      >
        {/* Category header */}
        <div className="sticky top-0 bg-[#0A0E27]/97 backdrop-blur px-4 pt-4 pb-2 border-b border-white/[0.06]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#41B2E3]/80">
            {categoryLabels[flyoutCategory]}
          </h3>
        </div>

        {/* Module list */}
        <div className="p-2">
          {modules.map(mod => (
            <button
              key={mod.id}
              onClick={() => handleSelectModule(mod.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150',
                'text-white/55 hover:text-white hover:bg-white/[0.05]',
                'focus:outline-none focus:ring-1 focus:ring-[#41B2E3]/40',
              )}
            >
              {mod.label}
            </button>
          ))}

          {modules.length === 0 && (
            <p className="text-xs text-white/25 px-3 py-6 text-center">
              No modules available
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
