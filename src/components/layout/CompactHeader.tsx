/**
 * CompactHeader - CTA Fleet branding header bar
 *
 * Features the CTA Fleet wordmark with Navy (#1A1847) background and Gold (#F0A000) accents,
 * search trigger, notifications, user avatar.
 * Gold accent bar and gradient along the top and bottom edges.
 */
import { Search, Bell, User, Command } from 'lucide-react'
import { useCallback } from 'react'

import { ArchonYLogo } from '@/components/branding/ArchonYLogo'
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
      {/* Main header bar - CTA Navy background */}
      <div className="flex items-center justify-between h-12 sm:h-14 px-3 sm:px-5 bg-[#1A1847]">
        {/* Left: CTA Logo */}
        <div className="sm:hidden shrink-0 w-8 h-8 rounded-lg overflow-hidden">
          <img
            src="/logos/approved-branding/cta-icon-navy.png"
            alt="CTA"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <img
            src="/logos/approved-branding/cta-horizontal-dark.png"
            alt="CTA - Capital Technology Alliance"
            className="h-9 w-auto object-contain"
            style={{ maxWidth: '240px' }}
          />
          <div className="h-6 w-px bg-white/20" />
          <span className="text-white/70 text-xs font-medium tracking-wider uppercase">Fleet</span>
        </div>

        {/* Center: Search bar */}
        <button
          onClick={handleSearchClick}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/60 text-xs hover:bg-white/15 hover:text-white/80 transition-all max-w-[200px] sm:max-w-[360px] w-full mx-2 sm:mx-6"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="sm:hidden truncate">Search...</span>
          <span className="hidden sm:inline truncate">Search modules, vehicles, drivers...</span>
          <kbd className="hidden sm:flex items-center gap-0.5 ml-auto shrink-0 text-[10px] text-white/40 bg-white/10 rounded px-1.5 py-0.5 border border-white/15">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all relative"
          >
            <Bell className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F0A000] ring-2 ring-[#1A1847]" />
          </button>

          {/* User avatar */}
          <button
            aria-label="User profile"
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden"
          >
            <div className="w-full h-full bg-gradient-to-br from-[#F0A000] to-[#DD3903] flex items-center justify-center rounded-lg">
              <User className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Dawn gradient accent bar - signature CTA brand element */}
      <div className="h-[3px] bg-gradient-to-r from-[#F0A000] via-[#FF8A00] to-[#DD3903]" />
    </header>
  )
}

export { CTAMark, CTAFleetLogo }
