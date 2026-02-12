/**
 * BottomDrawer - Collapsible activity panel at the bottom of the content area
 *
 * Shows a thin 32px grab bar by default. Expands to ~280px for timeline/activity log.
 * Glass-morphism design consistent with ArchonY branding.
 */
import { ChevronUp, ChevronDown, Clock } from 'lucide-react'
import { usePanel } from '@/contexts/PanelContext'
import { cn } from '@/lib/utils'

export function BottomDrawer() {
  const { state, toggleBottomDrawer } = usePanel()
  const { open } = state.bottomDrawer

  return (
    <div
      className={cn(
        'absolute bottom-0 left-0 right-0 z-10',
        'bg-background/95 backdrop-blur-xl border-t border-border/50',
        'transition-all duration-300 ease-in-out',
        open ? 'h-[200px] sm:h-[280px]' : 'h-8'
      )}
    >
      {/* Grab bar */}
      <button
        onClick={toggleBottomDrawer}
        className="w-full flex items-center justify-center gap-2 h-8 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={open ? 'Collapse activity panel' : 'Expand activity panel'}
      >
        <div className="w-8 h-0.5 rounded-full bg-border/50" />
        {open ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <>
            <Clock className="w-3 h-3" />
            <span className="text-[9px] uppercase tracking-[0.15em] font-medium">Activity</span>
            <ChevronUp className="w-3 h-3" />
          </>
        )}
      </button>

      {/* Drawer content */}
      {open && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 overflow-y-auto h-[calc(100%-32px)]">
          <div className="space-y-1">
            {[
              { time: '2m ago', text: 'Vehicle VEH-1234 entered Geofence A', type: 'info' },
              { time: '5m ago', text: 'Driver J. Smith completed route R-456', type: 'success' },
              { time: '8m ago', text: 'Maintenance alert: VEH-0891 oil change due', type: 'warning' },
              { time: '12m ago', text: 'New work order WO-7823 created', type: 'info' },
              { time: '15m ago', text: 'Speed violation detected: VEH-2341', type: 'alert' },
              { time: '20m ago', text: 'Vehicle VEH-0456 started trip', type: 'info' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 text-xs border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground shrink-0 w-12 sm:w-14 text-right tabular-nums font-mono text-[10px] sm:text-[11px]">
                  {item.time}
                </span>
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1 shrink-0',
                  item.type === 'success' ? 'bg-emerald-400' :
                  item.type === 'warning' ? 'bg-[#F0A000]' :
                  item.type === 'alert' ? 'bg-[#DD3903]' :
                  'bg-[#41B2E3]/50'
                )} />
                <span className="text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
