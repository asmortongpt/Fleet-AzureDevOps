/**
 * SinglePageShell — Root layout for CTA Fleet application
 *
 * Fixed viewport (100vh x 100vw, overflow-hidden).
 * Layout: IconRail (64px left) + CompactHeader (56px top) + Content
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
            <>
              <MapCanvas />
              <FloatingKPIStrip />
              <PanelManager />
              <BottomDrawer />
            </>
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
