/**
 * PanelBreadcrumbs - Navigation trail for the panel stack
 */
import { ChevronRight, Home } from 'lucide-react'

import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

export function PanelBreadcrumbs() {
  const { state, goToPanel, closeAll, panelDepth } = usePanel()

  if (panelDepth === 0) return null

  return (
    <nav
      aria-label="Panel navigation"
      className="flex items-center gap-1 px-3 py-1.5 text-xs min-h-[28px] overflow-x-auto scrollbar-none"
    >
      <button
        onClick={closeAll}
        className="flex items-center gap-1 text-[--cta-blue-skies] hover:text-white transition-colors shrink-0"
        aria-label="Return to map"
      >
        <Home className="w-3 h-3" />
      </button>

      {state.stack.map((entry, idx) => {
        const isLast = idx === state.stack.length - 1
        const label =
          entry.title.length > 24 ? entry.title.slice(0, 24) + '\u2026' : entry.title

        return (
          <span key={entry.id} className="flex items-center gap-1 shrink-0">
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
            <button
              onClick={() => !isLast && goToPanel(idx)}
              disabled={isLast}
              className={cn(
                'transition-colors truncate max-w-[160px]',
                isLast
                  ? 'text-foreground font-medium cursor-default'
                  : 'text-muted-foreground hover:text-[--cta-blue-skies] cursor-pointer'
              )}
            >
              {label}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
