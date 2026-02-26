/**
 * CompactHeader - ArchonY "Command Bar" header
 *
 * 48px header with ArchonY branding, search command trigger, notifications, and user avatar.
 * Blue Skies accent gradient bar at bottom.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'

import { useAuth } from '@/contexts'
import { usePanel } from '@/contexts/PanelContext'

/** CTA square logo mark - deep purple bg, white CTA text, Blue Skies gradient bar */
export function CTAMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="6" fill="#1A0648" />
      <text x="16" y="20" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" textAnchor="middle" letterSpacing="0.5">
        CTA
      </text>
      <rect x="6" y="24" width="20" height="2.5" rx="1" fill="url(#ctaDawn)" />
      <defs>
        <linearGradient id="ctaDawn" x1="6" y1="25" x2="26" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(0,204,254,0.5)" />
          <stop offset="1" stopColor="rgba(0,204,254,0.15)" />
        </linearGradient>
      </defs>
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
    <header className="relative shrink-0 z-20">
      {/* Main header bar — 48px, deepest surface */}
      <div className="flex items-center justify-between h-12 px-3 sm:px-4 bg-[#0D0320]" style={{ borderBottom: '1px solid rgba(0,204,254,0.08)' }}>
        {/* Left: CTA Logo + ArchonY branding */}
        <div className="flex items-center gap-2 shrink-0">
          <CTAMark className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-white font-bold text-sm" style={{ fontFamily: '"Cinzel", Georgia, serif' }}>ArchonY</span>
            <span className="text-[rgba(255,255,255,0.40)] text-[10px] font-medium tracking-widest uppercase hidden lg:inline">Fleet Command</span>
          </div>
        </div>

        {/* Center: Search command bar trigger */}
        <button
          onClick={handleSearchClick}
          className="flex items-center gap-2 px-4 h-8 rounded-lg bg-[#1A0648] border border-[rgba(0,204,254,0.08)] text-[rgba(255,255,255,0.40)] text-xs hover:border-[rgba(0,204,254,0.20)] hover:text-[rgba(255,255,255,0.65)] transition-all max-w-[400px] w-full mx-2 sm:mx-4"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden truncate">Search...</span>
          <span className="hidden sm:inline truncate">Search vehicles, drivers, routes... (⌘K)</span>
          <kbd className="hidden sm:flex items-center gap-0.5 ml-auto shrink-0 text-[10px] text-[rgba(255,255,255,0.30)] bg-[rgba(0,204,254,0.06)] rounded px-1.5 py-0.5 border border-[rgba(0,204,254,0.08)]">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Right: Notifications + User avatar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Notification bell with count badge */}
          <button
            aria-label="Notifications"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[rgba(255,255,255,0.65)] hover:text-white hover:bg-[rgba(0,204,254,0.08)] transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#FF4300] text-white text-[8px] flex items-center justify-center font-bold">
              3
            </span>
          </button>

          {/* User avatar */}
          <button
            aria-label="User profile"
            className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-[rgba(0,204,254,0.15)]"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#1F3076] to-[#0D0320] flex items-center justify-center rounded-full">
              <User className="w-4 h-4 text-[rgba(255,255,255,0.65)]" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom accent: 3px Blue Skies gradient bar */}
      <div className="h-[3px] bg-gradient-to-r from-[#00CCFE] via-[#1F3076] to-transparent" />
    </header>
  )
}
