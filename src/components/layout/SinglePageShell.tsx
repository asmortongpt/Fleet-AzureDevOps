/**
 * SinglePageShell - Root layout for ArchonY Fleet Command
 *
 * Fixed viewport (100vh x 100vw, overflow-hidden). No page scrolling.
 * Layout: NavRail (64px left) + CommandBar (48px top) + Content + DetailPanel (conditional)
 *         + ActivityBar (48px bottom, collapsible)
 *
 * Responsive:
 * - Desktop (>=1024px): Nav rail + content + side/takeover panels
 * - Tablet/Mobile (<1024px): Bottom tab bar + full-width panels
 */
import { useState, useEffect, memo } from 'react'

import { ActivityBar } from './ActivityBar'
import { BottomDrawer } from './BottomDrawer'
import { CommandPalette } from './CommandPalette'
import { CompactHeader } from './CompactHeader'
import { FloatingKPIStrip } from './FloatingKPIStrip'
import { FlyoutMenu } from './FlyoutMenu'
import { IconRail } from './IconRail'
import { MapCanvas } from './MapCanvas'
import { MobileTabBar } from './MobileTabBar'
import { PanelManager } from './PanelManager'

import { AIAssistantFloatingButton } from '@/components/ai/AIAssistantButton'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

interface SinglePageShellProps {
  moduleContent?: React.ReactNode
}

export const SinglePageShell = memo(function SinglePageShell({ moduleContent }: SinglePageShellProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const { setFlyout } = usePanel()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    const check = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsDesktop(window.innerWidth >= 1024)
      }, 100)
    }

    check()
    window.addEventListener('resize', check)
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', check)
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#0D0320] cta-hub">
      {/* Left: Nav Rail (desktop only) */}
      {isDesktop && (
        <div
          className="relative flex shrink-0"
          onMouseLeave={() => setFlyout(null)}
        >
          <IconRail />
          <FlyoutMenu />
        </div>
      )}

      {/* Main content area */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top: Command Bar */}
        <CompactHeader />

        {/* Content area with Surface-1 background */}
        <div className={cn(
          "flex-1 relative overflow-hidden bg-[#1A0648] rounded-tl-lg",
          !isDesktop && "pb-14 rounded-tl-none"
        )}>
          {moduleContent ? (
            <div className="w-full h-full overflow-hidden">
              {moduleContent}
            </div>
          ) : (
            <>
              {/* Map (always mounted behind everything) */}
              <MapCanvas />

              {/* Floating KPI strip over map */}
              <FloatingKPIStrip />

              {/* Right panel system */}
              <PanelManager />

              {/* Bottom activity drawer */}
              <BottomDrawer />
            </>
          )}
        </div>

        {/* Activity Bar (desktop only) */}
        {isDesktop && <ActivityBar />}
      </main>

      {/* Mobile/Tablet: Bottom tab bar */}
      {!isDesktop && <MobileTabBar />}

      {/* Command Palette overlay (Cmd+K) */}
      <CommandPalette />

      {/* Draggable AI Assistant floating button */}
      <AIAssistantFloatingButton hubType="fleet" />
    </div>
  )
})
