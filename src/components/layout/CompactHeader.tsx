/**
 * CompactHeader - CTA Fleet branding header bar
 *
 * Features the CTA Fleet wordmark with Navy (#1A1847) background and Gold (#F0A000) accents,
 * search trigger, notifications, user avatar.
 * Gold accent bar and gradient along the top and bottom edges.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'

import { useAuth } from '@/contexts'
import { usePanel } from '@/contexts/PanelContext'

/**
 * CTA Fleet logo - Capital Technology Alliance branding
 * Navy background (#1A1847) with Gold accents (#F0A000)
 */
function CTAFleetLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Gold accent bar */}
      <rect x="0" y="0" width="4" height="52" fill="#F0A000" />

      {/* CTA text - main branding */}
      <text x="16" y="35" fill="white" fontSize="24" fontWeight="900" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="2">
        CTA
      </text>

      {/* Gold separator dot */}
      <circle cx="98" cy="28" r="3" fill="#F0A000" />

      {/* FLEET text */}
      <text x="110" y="35" fill="white" fontSize="24" fontWeight="700" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="1.5">
        FLEET
      </text>

      {/* Capital Technology Alliance tagline */}
      <text x="16" y="48" fill="#F0A000" fontSize="7" fontWeight="600" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="1.5">
        INTELLIGENT PERFORMANCE
      </text>
      <defs>
        <linearGradient id="arcGradient" x1="10" y1="24" x2="270" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0A000" />
          <stop offset="1" stopColor="#DD3903" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** CTA square logo mark - Option 2 from ADELE (navy bg, white CTA, dawn gradient bar) */
function CTAMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="32" height="32" rx="4" fill="#2F3359" />
      <text x="16" y="20" fill="white" fontSize="11" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" textAnchor="middle" letterSpacing="0.5">
        CTA
      </text>
      {/* Dawn gradient bar */}
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
      <div className="flex items-center justify-between h-10 sm:h-11 px-2 sm:px-4 bg-background/90 backdrop-blur-sm border-b border-border/50">
        {/* Left: CTA Fleet Logo */}
        <div className="sm:hidden shrink-0 w-7 h-7 rounded-lg bg-[#1A1847] flex items-center justify-center border-l-2 border-[#F0A000]">
          <span className="text-[10px] font-extrabold text-white">CTA</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <CTAFleetLogo className="h-8 w-auto" />
        </div>

        {/* Center: Search bar */}
        <button
          onClick={handleSearchClick}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-muted/40 border border-border/50 text-muted-foreground text-xs hover:bg-muted/60 transition-all max-w-[200px] sm:max-w-[320px] w-full mx-2 sm:mx-6"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden truncate">Search...</span>
          <span className="hidden sm:inline truncate">Search modules, vehicles, drivers...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 ml-auto shrink-0 text-[10px] text-muted-foreground bg-muted/40 rounded px-1.5 py-0.5 border border-border/50">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all relative"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DD3903] ring-2 ring-[#0A0E27]" />
          </button>

          {/* User avatar */}
          <button
            aria-label="User profile"
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#2F3359] to-[#0A0E27] flex items-center justify-center border border-border/50 rounded-lg">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      </div>

      {/* Dawn gradient accent bar - signature CTA brand element */}
      <div className="h-[2px] bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]" />
    </header>
  )
}

export { CTAMark, ArchonYLogo }
