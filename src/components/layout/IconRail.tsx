/**
 * IconRail - Left icon navigation rail (ArchonY redesign)
 *
 * 64px wide, icon-only. Fixed left, full height.
 * Top: CTA monogram logo mark.
 * Middle: 5 hub icons with active gradient indicator.
 * Bottom: Search, Help, User avatar.
 */
import {
  Map,
  ShieldCheck,
  BarChart3,
  Users,
  Settings,
  Search,
  HelpCircle,
  User,
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
  { id: 'fleet', label: 'Fleet Command', icon: <Map className="w-5 h-5" /> },
  { id: 'safety', label: 'Safety & Compliance', icon: <ShieldCheck className="w-5 h-5" /> },
  { id: 'analytics', label: 'Business Intelligence', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'operations', label: 'People & Communication', icon: <Users className="w-5 h-5" /> },
  { id: 'admin', label: 'Admin & Configuration', icon: <Settings className="w-5 h-5" /> },
]

export function IconRail() {
  const { state, setFlyout } = usePanel()
  const { activeCategory } = state

  const handleClick = useCallback(
    (cat: ModuleCategory) => {
      // Navigate to hub; keep setFlyout for backward compatibility
      setFlyout(cat)
    },
    [setFlyout]
  )

  return (
    <nav
      className="relative flex flex-col items-center w-16 h-full shrink-0 bg-[#0D0320] z-30"
      role="navigation"
      aria-label="Main Navigation"
    >
      {/* Top: CTA monogram logo mark */}
      <div className="pt-4 pb-2 flex flex-col items-center">
        <div className="w-10 h-10 rounded-lg bg-[#1A0648] border border-[rgba(0,204,254,0.15)] flex items-center justify-center">
          <span className="text-[11px] font-extrabold text-white tracking-wider leading-none">
            CTA
          </span>
        </div>
        {/* Gradient divider */}
        <div className="w-8 h-[3px] mt-3 rounded-full bg-gradient-to-r from-[#00CCFE] to-transparent" />
      </div>

      {/* Hub icons */}
      <div className="flex flex-col items-center gap-2 pt-4 flex-1">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id

          return (
            <div key={cat.id} className="relative">
              {/* Active indicator - left gradient bar */}
              {isActive && (
                <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-gradient-to-b from-[#00CCFE] to-[#1F3076]" />
              )}

              <button
                onClick={() => handleClick(cat.id)}
                title={cat.label}
                aria-label={cat.label}
                className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-200',
                  isActive
                    ? 'text-[#00CCFE]'
                    : 'text-[rgba(255,255,255,0.40)] hover:text-white'
                )}
              >
                {cat.icon}
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom section: Search, Help, User */}
      <div className="pb-4 flex flex-col items-center gap-2">
        <button
          title="Search"
          aria-label="Search"
          className="flex items-center justify-center w-11 h-11 rounded-lg text-[rgba(255,255,255,0.40)] hover:text-white transition-colors duration-200"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          title="Help"
          aria-label="Help"
          className="flex items-center justify-center w-11 h-11 rounded-lg text-[rgba(255,255,255,0.40)] hover:text-white transition-colors duration-200"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <button
          title="User Profile"
          aria-label="User Profile"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#1A0648] border border-[rgba(0,204,254,0.08)] text-[rgba(255,255,255,0.65)] hover:text-white transition-colors duration-200"
        >
          <User className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
