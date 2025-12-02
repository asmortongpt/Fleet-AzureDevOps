/**
 * DrilldownBreadcrumbs - Breadcrumb navigation for drilldown levels
 * Shows the path through nested data with clickable navigation
 */

import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function DrilldownBreadcrumbs() {
  const { levels, goToLevel, reset } = useDrilldown()

  if (levels.length === 0) {
    return null
  }

  return (
    <nav
      className="flex items-center space-x-2 px-4 py-3 bg-muted/50 border-b"
      aria-label="Breadcrumb navigation"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={reset}
        className="h-8 px-2"
        aria-label="Return to home"
      >
        <Home className="h-4 w-4" />
      </Button>

      {levels.map((level, index) => (
        <React.Fragment key={`${level.id}-${index}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToLevel(index)}
            className={cn(
              "h-8 px-3 text-sm font-medium",
              index === levels.length - 1
                ? "text-foreground cursor-default"
                : "text-muted-foreground hover:text-foreground"
            )}
            disabled={index === levels.length - 1}
            aria-current={index === levels.length - 1 ? "page" : undefined}
          >
            {level.label}
          </Button>
        </React.Fragment>
      ))}
    </nav>
  )
}
