/**
 * CompactHeader — Minimal top bar
 *
 * Search-dominant bar with live clock, notifications, user avatar.
 * Height: h-12 (48px). No brand text (logo lives in IconRail).
 */
import { Search, User, Command, LogOut, Settings, UserCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { NotificationBell } from '@/components/common/NotificationBell'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts'
import { useNavigation } from '@/contexts/NavigationContext'
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
  const { setActiveModule } = useNavigation()

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
        <span className="hidden sm:inline truncate">Search modules...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 ml-auto text-[11px] text-white/20 shrink-0">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right: Clock + Notifications + Avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <LiveClock />

        <NotificationBell onNavigate={setActiveModule} />

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="User profile"
              className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden hover:ring-1 hover:ring-white/20 transition-all"
            >
              <div className="w-full h-full bg-white/[0.06] flex items-center justify-center rounded-lg">
                <User className="w-4 h-4 text-white/30" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModule('profile')}>
              <UserCircle className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setActiveModule('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-red-400" onClick={() => window.location.href = '/login'}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
