/**
 * CompactHeader - Branded header bar for the ArchonY SPA
 *
 * Features the ArchonY wordmark with sweeping arc (matching ADELE branding),
 * search trigger, notifications, user avatar.
 * Dawn gradient accent bar (Golden Hour -> Noon) along the bottom edge.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'
import { usePanel } from '@/contexts/PanelContext'
import { useAuth } from '@/contexts'

/**
 * ArchonY logo SVG - recreates the "Intelligent Pivot" logo from the ADELE branding document.
 * Sweeping arc over bold tech-forward lettering with "INTELLIGENT PERFORMANCE" tagline.
 */
function ArchonYLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Sweeping arc - the signature design element from ADELE doc */}
      <path
        d="M2 28C30 8 80 2 140 6C200 10 250 4 278 16"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Second arc with dawn gradient */}
      <path
        d="M10 24C60 10 120 6 180 10C220 14 258 8 270 18"
        stroke="url(#arcGradient)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      {/* ARCHON text */}
      <text x="18" y="36" fill="white" fontSize="22" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="3">
        ARCHON
      </text>
      {/* Dot separator */}
      <circle cx="172" cy="30" r="2.5" fill="#41B2E3" />
      {/* Y character */}
      <text x="182" y="36" fill="white" fontSize="22" fontWeight="800" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="3">
        Y
      </text>
      {/* INTELLIGENT PERFORMANCE tagline */}
      <text x="64" y="48" fill="white" fillOpacity="0.35" fontSize="6.5" fontWeight="500" fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif" letterSpacing="3.5">
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
        {/* Left: ArchonY wordmark */}
        <div className="sm:hidden shrink-0 w-7 h-7 rounded-lg bg-[#2F3359] flex items-center justify-center">
          <span className="text-[10px] font-extrabold text-white">A</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <ArchonYLogo className="h-8 w-auto" />
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
