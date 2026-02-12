/**
 * SinglePageShell - Root layout for the ArchonY single-page application
 *
 * Fixed viewport (100vh x 100vw, overflow-hidden). No page scrolling.
 * Layout: IconRail (56px left) + CompactHeader (44px top) + MapCanvas + Panels
 *
 * Responsive:
 * - Desktop (>=1024px): Icon rail + map + side/takeover panels
 * - Tablet/Mobile (<1024px): Bottom tab bar + full-width panels
 */
import { useState, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { usePanel } from '@/contexts/PanelContext'
import { IconRail } from './IconRail'
import { FlyoutMenu } from './FlyoutMenu'
import { CompactHeader } from './CompactHeader'
import { MapCanvas } from './MapCanvas'
import { FloatingKPIStrip } from './FloatingKPIStrip'
import { PanelManager } from './PanelManager'
import { BottomDrawer } from './BottomDrawer'
import { CommandPalette } from './CommandPalette'
import { MobileTabBar } from './MobileTabBar'

export const SinglePageShell = memo(function SinglePageShell() {
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
    <div className="h-screen w-screen overflow-hidden flex cta-hub">
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top: Compact Header with ArchonY branding */}
        <CompactHeader />

        {/* Content: Map + Overlays */}
        <div className={cn("flex-1 relative overflow-hidden", !isDesktop && "pb-14")}>
          {/* Map (always mounted behind everything) */}
          <MapCanvas />

          {/* Floating KPI strip over map */}
          <FloatingKPIStrip />

          {/* Right panel system */}
          <PanelManager />

          {/* Bottom activity drawer */}
          <BottomDrawer />
        </div>
      </div>

      {/* Mobile/Tablet: Bottom tab bar */}
      {!isDesktop && <MobileTabBar />}

      {/* Command Palette overlay (Cmd+K) */}
      <CommandPalette />
    </div>
  )
})
