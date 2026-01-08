/**
 * DrilldownBreadcrumbs - Navigation breadcrumb trail for drill-down system
 * Shows current location in navigation hierarchy and enables quick navigation back
 */

import { CaretRight, House } from '@phosphor-icons/react'

import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

export function DrilldownBreadcrumbs() {
  const { levels, goToLevel, reset } = useDrilldown()

  // Only show breadcrumbs when we're in a drill-down
  if (levels.length === 0) return null

  return (
    <nav
      data-testid="breadcrumb"
      className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 border-b border-slate-700 overflow-x-auto"
      aria-label="Breadcrumb"
    >
      {/* Home button */}
      <button
        onClick={reset}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors whitespace-nowrap shrink-0"
        data-testid="breadcrumb-0"
        aria-label="Go to home"
      >
        <House className="w-4 h-4" weight="fill" />
        <span className="text-sm font-medium">Home</span>
      </button>

      {/* Breadcrumb trail */}
      {levels.map((level, index) => (
        <div key={level.id} className="flex items-center gap-2 shrink-0">
          <CaretRight className="w-4 h-4 text-slate-600" />
          <button
            onClick={() => goToLevel(index)}
            className={cn(
              "text-sm whitespace-nowrap transition-colors",
              index === levels.length - 1
                ? "text-white font-semibold"
                : "text-slate-400 hover:text-white font-medium"
            )}
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
