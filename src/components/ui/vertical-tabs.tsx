/**
 * VerticalTabs — Sidebar tab navigation within content area
 *
 * 180px left sidebar with tabs. Active tab has emerald left border.
 * Used by Fleet Ops and Admin hubs.
 */
import { ReactNode, useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VTab {
  id: string
  label: string
  icon?: LucideIcon
  badge?: string | number
  content: ReactNode
}

interface VerticalTabsProps {
  tabs: VTab[]
  defaultTab?: string
  onTabChange?: (tabId: string) => void
  className?: string
}

export function VerticalTabs({ tabs, defaultTab, onTabChange, className }: VerticalTabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  const handleChange = (id: string) => {
    setActive(id)
    onTabChange?.(id)
  }

  const activeTab = tabs.find(t => t.id === active)

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <nav className="w-[180px] shrink-0 border-r border-white/[0.06] py-2 flex flex-col gap-0.5">
        {tabs.map(tab => {
          const isActive = tab.id === active
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleChange(tab.id)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium transition-colors relative',
                isActive
                  ? 'text-white bg-white/[0.05]'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.02]',
              )}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                  style={{ background: '#10b981' }}
                />
              )}
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="ml-auto text-[10px] font-semibold text-white/25 tabular-nums">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {activeTab?.content}
      </div>
    </div>
  )
}
