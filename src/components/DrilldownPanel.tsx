/**
 * DrilldownPanel - Animated slide-in panel for drilldown content
 * Displays nested data with smooth animations and accessibility support
 */

// motion removed - React 19 incompatible
import { X, ArrowLeft, Loader2 } from 'lucide-react'
import React, { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

interface DrilldownPanelProps {
  children?: React.ReactNode
  className?: string
}

export function DrilldownPanel({ children, className }: DrilldownPanelProps) {
  const { currentLevel, pop, reset, canGoBack } = useDrilldown()

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentLevel) {
        e.preventDefault()
        reset()
      } else if (e.key === 'Backspace' && canGoBack && currentLevel) {
        // Only if not in an input field
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          pop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentLevel, canGoBack, pop, reset])

  // Lock body scroll when panel is open
  useEffect(() => {
    if (currentLevel) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [currentLevel])

  return (
    <>
      {currentLevel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={reset}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            className={cn(
              'fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 xl:w-2/5',
              'bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-sm z-50',
              'flex flex-col',
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drilldown-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b border-slate-800/50 bg-slate-900/20 backdrop-filter backdrop-blur-sm">
              <div className="flex items-center space-x-2">
                {canGoBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={pop}
                    className="h-9 w-9 p-0"
                    aria-label="Go back one level"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2
                  id="drilldown-title"
                  className="text-sm font-semibold truncate"
                >
                  {currentLevel.label}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="h-9 w-9 p-0"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-2 md:p-3 pb-24 md:pb-3">
                {children}
              </div>
            </ScrollArea>

            {/* Footer hint */}
            <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground text-center">
              Press <kbd className="px-2 py-1 bg-background border rounded">Esc</kbd> to close
              {canGoBack && (
                <>
                  {' '} or <kbd className="px-2 py-1 bg-background border rounded">Backspace</kbd> to go back
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

interface DrilldownContentProps {
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
  children: React.ReactNode
}

export function DrilldownContent({
  loading,
  error,
  onRetry,
  children,
}: DrilldownContentProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-destructive">
            Error loading data
          </p>
          <p className="text-xs text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return <>{children}</>
}
