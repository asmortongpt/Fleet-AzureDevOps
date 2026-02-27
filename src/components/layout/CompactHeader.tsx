/**
 * CompactHeader — Minimal top bar
 *
 * Search-dominant bar with live clock, notifications, user avatar.
 * Height: h-12 (48px). No brand text (logo lives in IconRail).
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { useAuth } from '@/contexts'
import { usePanel } from '@/contexts/PanelContext'

function LiveClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const [time, setTime] = useState(fmt)

  useEffect(() => {
    const interval = setInterval(() => setTime(fmt()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="text-[13px] font-medium text-white/30 tabular-nums tracking-wide">
      {time}
    </span>
  )
}

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
    <header className="shrink-0 z-20 h-12 flex items-center px-4 bg-[#0a0a0a] border-b border-white/[0.04] gap-3">
      {/* Search — dominant element, takes remaining space */}
      <button
        onClick={handleSearchClick}
        className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-white/[0.04] text-white/30 text-[13px] hover:bg-white/[0.06] hover:text-white/40 transition-colors flex-1 min-w-0 max-w-[560px]"
      >
        <Search className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline truncate">Search vehicles, drivers, routes...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 ml-auto text-[11px] text-white/20 shrink-0">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Clock + Notifications + Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <LiveClock />

        <button
          aria-label="Notifications"
          className="flex items-center justify-center w-8 h-8 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
        </button>

        <button
          aria-label="User profile"
          className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden"
        >
          <div className="w-full h-full bg-white/[0.06] flex items-center justify-center rounded-lg">
            <User className="w-4 h-4 text-white/30" />
          </div>
        </button>
      </div>
    </header>
  )
}
