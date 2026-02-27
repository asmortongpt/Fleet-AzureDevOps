/**
 * PanelManager - Orchestrates the right-side panel rendering
 *
 * Handles side panel mode (400-600px) and full takeover mode (100% width).
 * Glass-morphism design consistent with CTA Fleet branding.
 */
import { ArrowLeft, X } from 'lucide-react'
import { Suspense, useEffect } from 'react'

import { PanelBreadcrumbs } from './PanelBreadcrumbs'

import { getModule } from '@/config/module-registry'
import { usePanel } from '@/contexts/PanelContext'
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
          <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-[var(--text-tertiary)] tracking-wider">Loading module...</span>
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
        'bg-[var(--surface-1)]',
        'border-l border-[var(--border-subtle)]',
        'transition-all duration-300 ease-out',
        'max-w-full',
        widthClass
      )}
      role="dialog"
      aria-label={currentPanel.title}
      aria-modal={isTakeover}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--surface-1)]">
        {/* Back button */}
        {panelDepth > 1 && (
          <button
            onClick={popPanel}
            className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-glass)] transition-all"
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
          className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg text-[var(--text-tertiary)] hover:text-white hover:bg-[var(--surface-glass)] transition-all shrink-0"
          aria-label="Close panel"
        >
          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Subtle accent under panel header */}
      <div className="h-px bg-[var(--surface-glass)]" />

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
