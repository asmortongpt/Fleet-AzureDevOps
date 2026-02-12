/**
 * PanelManager - Orchestrates the right-side panel rendering
 *
 * Handles side panel mode (400-600px) and full takeover mode (100% width).
 * Glass-morphism design consistent with ArchonY branding.
 */
import { Suspense, useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { usePanel } from '@/contexts/PanelContext'
import { getModule } from '@/config/module-registry'
import { PanelBreadcrumbs } from './PanelBreadcrumbs'
import { cn } from '@/lib/utils'

const panelWidthMap: Record<string, string> = {
  narrow: 'w-full lg:w-[400px]',
  medium: 'w-full lg:w-[480px]',
  wide: 'w-full lg:w-[600px]',
  takeover: 'w-full',
}

function PanelLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-2 border-[#41B2E3]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-[#41B2E3] border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-muted-foreground tracking-wider">Loading module...</span>
      </div>
    </div>
  )
}

export function PanelManager() {
  const {
    state,
    currentPanel,
    popPanel,
    closeAll,
    panelDepth,
    isOpen,
    isTakeover,
  } = usePanel()

  // Escape key closes top panel
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (panelDepth > 1) {
          popPanel()
        } else {
          closeAll()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, panelDepth, popPanel, closeAll])

  if (!isOpen || !currentPanel) return null

  const mod = getModule(currentPanel.moduleId)
  const Component = mod?.component

  const widthClass = isTakeover
    ? 'w-full'
    : panelWidthMap[currentPanel.width] ?? panelWidthMap.medium

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-0 z-20 flex flex-col',
        'bg-background/95 backdrop-blur-xl',
        'border-l border-border/50',
        'shadow-[-12px_0_40px_rgba(0,0,0,0.5)]',
        'transition-all duration-300 ease-out',
        'max-w-full',
        widthClass
      )}
      role="dialog"
      aria-label={currentPanel.title}
      aria-modal={isTakeover}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-border/50 shrink-0 bg-background/95">
        {/* Back button */}
        {panelDepth > 1 && (
          <button
            onClick={popPanel}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}

        {/* Breadcrumbs */}
        <div className="flex-1 min-w-0">
          <PanelBreadcrumbs />
        </div>

        {/* Close button */}
        <button
          onClick={closeAll}
          className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0"
          aria-label="Close panel"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Dawn gradient accent under panel header */}
      <div className="h-[1px] bg-gradient-to-r from-[#F0A000]/30 via-[#FF8A00]/20 to-transparent" />

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {Component && (
          <Suspense fallback={<PanelLoadingFallback />}>
            <div className="h-full">
              <Component />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  )
}
