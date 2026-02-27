/**
 * CompactHeader — Minimal top bar
 *
 * Tesla/Rivian minimal: logo + search + actions, nothing else.
 * Ultra-clean with generous spacing and zero visual noise.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'

import { useAuth } from '@/contexts'
import { usePanel } from '@/contexts/PanelContext'

export function CTAMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <text x="14" y="18" fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, system-ui, sans-serif" textAnchor="middle" letterSpacing="1">
        CTA
      </text>
    </svg>
  )
}

export function CompactHeader() {
  const { toggleCommandPalette } = usePanel()
  const { user } = useAuth()

  const handleSearchClick = useCallback(() => {
    toggleCommandPalette()
  }, [toggleCommandPalette])

  return (
    <header className="shrink-0 z-20 h-14 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-white/[0.04]">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[15px] font-semibold text-white tracking-tight">CTA Fleet</span>
      </div>

      {/* Center: Search */}
      <button
        onClick={handleSearchClick}
        className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white/[0.04] text-white/30 text-[13px] hover:bg-white/[0.06] hover:text-white/40 transition-colors max-w-[400px] w-full mx-8"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Search vehicles, drivers, routes...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 ml-auto text-[11px] text-white/20">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          aria-label="Notifications"
          className="flex items-center justify-center w-9 h-9 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors relative"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
        </button>

        <button
          aria-label="User profile"
          className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden"
        >
          <div className="w-full h-full bg-white/[0.06] flex items-center justify-center rounded-xl">
            <User className="w-[18px] h-[18px] text-white/30" />
          </div>
        </button>
      </div>
    </header>
  )
}
