/**
 * SinglePageShell — Root layout for CTA Fleet application
 *
 * Fixed viewport (100vh x 100vw, overflow-hidden).
 * Layout: IconRail (64px left) + CompactHeader (48px top) + Content
 *
 * Map mode: TickerBar (top) + MapCanvas + VehicleRail (right, desktop) + TimelineStrip (bottom)
 * Module mode: Full-bleed module content
 */
import { useState, useEffect, memo } from 'react'

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
import { VehicleRail } from '@/components/ui/vehicle-rail'
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
    <div className="h-screen w-screen overflow-hidden flex bg-[#0a0a0a] cta-hub">
      {/* Left: Icon Rail (desktop only) */}
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
        {/* Top: Header */}
        <CompactHeader />

        {/* Content: Module content OR Map + Overlays */}
        <div className={cn("flex-1 relative overflow-hidden", !isDesktop && "pb-14")}>
          {moduleContent ? (
            <div className="w-full h-full overflow-hidden">
              {moduleContent}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* TickerBar pinned at top of map area */}
              <div className="shrink-0 z-10">
                <FloatingKPIStrip />
              </div>

              {/* Map + VehicleRail row */}
              <div className="flex-1 flex min-h-0 relative">
                {/* Map fills remaining space */}
                <div className="flex-1 relative min-w-0">
                  <MapCanvas />
                  <PanelManager />
                </div>

                {/* VehicleRail on right (desktop only, 360px) */}
                {isDesktop && (
                  <VehicleRail vehicles={[]} />
                )}
              </div>

              {/* TimelineStrip at bottom */}
              <div className="shrink-0 z-10">
                <BottomDrawer />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile: Bottom tab bar */}
      {!isDesktop && <MobileTabBar />}

      {/* Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* AI Assistant */}
      <AIAssistantFloatingButton hubType="fleet" />
    </div>
  )
})
