/**
 * KanbanBoard — Urgency-based column layout
 *
 * Used by Compliance hub. Cards grouped by status columns.
 */
import { cn } from '@/lib/utils'

export interface KanbanColumn {
  id: string
  title: string
  count: number
  accent: string
  items: KanbanItem[]
}

export interface KanbanItem {
  id: string
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: string
  meta?: string
  onClick?: () => void
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  className?: string
}

export function KanbanBoard({ columns, className }: KanbanBoardProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2', className)}>
      {columns.map(col => (
        <div key={col.id} className="flex-1 min-w-[240px] flex flex-col">
          <div className="flex items-center gap-2 px-3 py-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ background: col.accent }} />
            <span className="text-[12px] font-semibold text-white/60 uppercase tracking-[0.08em]">
              {col.title}
            </span>
            <span className="text-[11px] font-bold text-white/25 tabular-nums ml-auto">
              {col.count}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="text-left px-4 py-3 rounded-lg transition-colors hover:bg-white/[0.04]"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-white/80 truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${item.badgeColor || col.accent}20`,
                        color: item.badgeColor || col.accent,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                {item.subtitle && (
                  <p className="text-[11px] text-white/35 mt-1">{item.subtitle}</p>
                )}
                {item.meta && (
                  <p className="text-[10px] text-white/20 mt-1.5">{item.meta}</p>
                )}
              </button>
            ))}
            {col.items.length === 0 && (
              <div className="px-4 py-8 text-center text-[12px] text-white/15">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
