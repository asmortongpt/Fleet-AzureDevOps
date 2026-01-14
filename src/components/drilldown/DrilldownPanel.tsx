/**
 * DrilldownPanel - Standardized wrapper for all drill-down views
 * Provides consistent header, close button, back navigation, and keyboard handling
 */

import { X, ArrowLeft } from '@phosphor-icons/react'
import React, { useEffect } from 'react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

export interface DrilldownPanelProps {
  /** Main content of the panel */
  children: React.ReactNode
  /** Panel title displayed in header */
  title?: string
  /** Panel subtitle/description */
  subtitle?: string
  /** Optional actions to display in header */
  headerActions?: React.ReactNode
  /** Additional className for customization */
  className?: string
  /** Show back button (default: true if can go back) */
  showBackButton?: boolean
  /** Custom close handler (default: reset drilldown) */
  onClose?: () => void
}

/**
 * DrilldownPanel provides a consistent fullscreen panel for drill-down views.
 *
 * Features:
 * - Standardized header with title, subtitle, and actions
 * - Close button (X) that resets drill-down
 * - Back button (←) that pops one level
 * - Escape key handler for closing
 * - Consistent styling and layout
 * - Accessibility attributes
 *
 * @example
 * <DrilldownPanel
 *   title="Incident #12345"
 *   subtitle="Reported on Jan 3, 2026"
 *   headerActions={<Button>Export</Button>}
 * >
 *   <IncidentDetails incident={incident} />
 * </DrilldownPanel>
 */
export function DrilldownPanel({
  children,
  title,
  subtitle,
  headerActions,
  className,
  showBackButton = true,
  onClose
}: DrilldownPanelProps) {
  const { pop, reset, canGoBack } = useDrilldown()

  // Handle Escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onClose) {
          onClose()
        } else if (canGoBack) {
          pop()
        } else {
          reset()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [pop, reset, canGoBack, onClose])

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      reset()
    }
  }

  const handleBack = () => {
    if (canGoBack) {
      pop()
    }
  }

  return (
    <div
      data-testid="drilldown-panel"
      className={cn(
        "fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 overflow-auto",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drilldown-panel-title" : undefined}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 shadow-sm z-10">
        <div className="flex items-center justify-between p-2 gap-2">
          {/* Left: Back button + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && canGoBack && (
              <button
                onClick={handleBack}
                className="shrink-0 p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Go back"
                data-testid="back-button"
              >
                <ArrowLeft className="w-3 h-3 text-slate-400" weight="bold" />
              </button>
            )}

            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id="drilldown-panel-title"
                  className="text-base font-bold text-white truncate"
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Middle: Header actions */}
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}

          {/* Right: Close button */}
          <button
            data-testid="close-drilldown"
            onClick={handleClose}
            className="shrink-0 p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close panel"
          >
            <X className="w-3 h-3 text-slate-400" weight="bold" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div data-testid="drilldown-content" className="p-3">
        {children}
      </div>
    </div>
  )
}
