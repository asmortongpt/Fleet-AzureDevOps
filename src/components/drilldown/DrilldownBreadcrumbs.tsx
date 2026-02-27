/**
 * DrilldownBreadcrumbs - Navigation breadcrumb trail for drill-down system
 * Shows current location in navigation hierarchy and enables quick navigation back
 */

import { ChevronRight, Home } from 'lucide-react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

export function DrilldownBreadcrumbs() {
  const { levels, goToLevel, reset } = useDrilldown()

  // Only show breadcrumbs when we're in a drill-down
  if (levels.length === 0) return null

  return (
    <nav
      data-testid="breadcrumb"
      className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b"
      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}
      aria-label="Breadcrumb"
    >
      {/* Home button */}
      <button
        onClick={reset}
        className="flex items-center gap-2 transition-colors duration-[var(--duration-fast)] whitespace-nowrap shrink-0 hover:text-white"
        style={{ color: 'var(--text-tertiary)' }}
        data-testid="breadcrumb-0"
        aria-label="Go to home"
      >
        <Home className="w-4 h-4" />
        <span className="text-[var(--text-sm)] font-medium">Home</span>
      </button>

      {/* Breadcrumb trail */}
      {levels.map((level, index) => (
        <div key={level.id} className="flex items-center gap-2 shrink-0">
          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <button
            onClick={() => goToLevel(index)}
            className={cn(
              "text-[var(--text-sm)] whitespace-nowrap transition-colors duration-[var(--duration-fast)]",
              index === levels.length - 1
                ? "font-semibold"
                : "font-medium hover:text-white"
            )}
            style={{ color: index === levels.length - 1 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            data-testid={`breadcrumb-${index + 1}`}
            aria-current={index === levels.length - 1 ? "page" : undefined}
          >
            {level.label}
          </button>
        </div>
      ))}
    </nav>
  )
}
