/**
 * TimelineStrip — Horizontal scrollable event timeline
 *
 * Color-coded events with timestamps. Used by dashboard bottom bar and compliance hub.
 */
import { cn } from '@/lib/utils'

export interface TimelineEvent {
  id: string
  label: string
  time: string
  type: 'dispatch' | 'alert' | 'maintenance' | 'compliance' | 'info'
}

interface TimelineStripProps {
  events: TimelineEvent[]
  collapsed?: boolean
  onToggle?: () => void
  className?: string
}

const typeColors: Record<string, string> = {
  dispatch: '#10b981',
  alert: '#f59e0b',
  maintenance: '#6b7280',
  compliance: '#ef4444',
  info: '#3b82f6',
}

export function TimelineStrip({ events, collapsed = true, onToggle, className }: TimelineStripProps) {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-4 w-full h-10 px-5',
          className,
        )}
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em]">Activity</span>
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          {events.slice(0, 3).map(e => (
            <div key={e.id} className="flex items-center gap-2 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: typeColors[e.type] }} />
              <span className="text-[11px] text-white/40">{e.label}</span>
              <span className="text-[10px] text-white/20">{e.time}</span>
            </div>
          ))}
        </div>
        <span className="text-[10px] text-white/20">▲</span>
      </button>
    )
  }

  return (
    <div
      className={cn('flex flex-col', className)}
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 h-8 hover:bg-white/[0.02]"
      >
        <span className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.1em]">Activity</span>
        <span className="text-[10px] text-white/20 ml-auto">▼</span>
      </button>
      <div className="px-5 pb-4 flex flex-col gap-2 overflow-y-auto max-h-[200px]">
        {events.map(e => (
          <div key={e.id} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeColors[e.type] }} />
            <span className="text-[12px] text-white/60 flex-1">{e.label}</span>
            <span className="text-[11px] text-white/25 tabular-nums shrink-0">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
