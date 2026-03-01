/**
 * KanbanBoard — Urgency-based column layout
 *
 * Used by Compliance hub. Cards grouped by status columns.
 * Compact single-line cards for data density.
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
  const populated = columns.filter(col => col.items.length > 0)
  if (populated.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-white/20 text-sm', className)}>
        No compliance items found
      </div>
    )
  }
  const empty = columns.filter(col => col.items.length === 0)

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {empty.length > 0 && (
        <div className="flex items-center gap-1.5 px-1">
          {empty.map(col => (
            <div key={col.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${col.accent}10`, border: `1px solid ${col.accent}20` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.accent }} />
              <span className="text-[9px] font-medium" style={{ color: `${col.accent}aa` }}>{col.title}</span>
              <span className="text-[9px] font-bold" style={{ color: `${col.accent}60` }}>0</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {populated.map(col => (
          <div key={col.id} className="flex flex-col">
            <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col.accent, boxShadow: `0 0 6px ${col.accent}60` }} />
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.08em]">
                {col.title}
              </span>
              <span className="text-[11px] font-bold text-white/25 tabular-nums ml-auto">
                {col.count}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {col.items.map(item => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="flex items-center gap-2 text-left px-3 py-1.5 rounded-md transition-colors hover:bg-white/[0.06] group"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderLeft: `3px solid ${item.badgeColor || col.accent}`,
                  }}
                >
                  <span className="text-[12px] font-medium text-white/70 truncate flex-1 group-hover:text-white/90">{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[10px] text-white/30 truncate max-w-[100px] shrink-0">{item.subtitle}</span>
                  )}
                  {item.badge && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{
                        background: `${item.badgeColor || col.accent}20`,
                        color: item.badgeColor || col.accent,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
