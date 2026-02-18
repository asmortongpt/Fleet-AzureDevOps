/**
 * CompactHeader - CTA Fleet branding header bar
 *
 * Clean navy header with CTA branding, search, and user controls.
 * Gold dawn gradient accent bar at bottom.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'

import { useAuth } from '@/contexts'
import { usePanel } from '@/contexts/PanelContext'

/** CTA square logo mark - navy bg, white CTA text, dawn gradient bar */
export function CTAMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="6" fill="#1A1847" />
      <text x="16" y="20" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" textAnchor="middle" letterSpacing="0.5">
        CTA
      </text>
      <rect x="6" y="24" width="20" height="2.5" rx="1" fill="url(#ctaDawn)" />
      <defs>
        <linearGradient id="ctaDawn" x1="6" y1="25" x2="26" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0A000" />
          <stop offset="1" stopColor="#DD3903" />
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
      {/* Main header bar */}
      <div className="flex items-center justify-between h-11 sm:h-12 px-3 sm:px-4 bg-[#1A1847]">
        {/* Left: CTA Logo + Fleet label */}
        <div className="flex items-center gap-2 shrink-0">
          <CTAMark className="w-7 h-7 sm:w-8 sm:h-8" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-wide">CTA Fleet</span>
            <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase hidden lg:inline">Intelligent Performance</span>
          </div>
        </div>

        {/* Center: Search bar */}
        <button
          onClick={handleSearchClick}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-white/50 text-xs hover:bg-white/15 hover:text-white/70 transition-all max-w-[180px] sm:max-w-[320px] w-full mx-2 sm:mx-4"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden truncate">Search...</span>
          <span className="hidden sm:inline truncate">Search fleet, drivers, assets...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 ml-auto shrink-0 text-[10px] text-white/30 bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            aria-label="Notifications"
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#F0A000] ring-2 ring-[#1A1847]" />
          </button>

          <button
            aria-label="User profile"
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#2F3359] to-[#1A1847] flex items-center justify-center rounded-lg border border-white/10">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60" />
            </div>
          </button>
        </div>
      </div>

      {/* Dawn gradient accent bar */}
      <div className="h-[2px] bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]" />
    </header>
  )
}
