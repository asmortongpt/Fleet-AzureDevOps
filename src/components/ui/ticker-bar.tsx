/**
 * TickerBar — Live metrics bar with sparklines
 *
 * Full-width glass bar pinned to top of map.
 * 6 metrics with inline sparklines, clickable to open hubs.
 */
import { LucideIcon } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export interface TickerMetric {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  sparkData?: { v: number }[]
  onClick?: () => void
}

interface TickerBarProps {
  metrics: TickerMetric[]
  className?: string
}

export function TickerBar({ metrics, className }: TickerBarProps) {
  return (
    <div
      className={cn(
        'flex items-center w-full rounded-xl overflow-hidden',
        className,
      )}
      style={{
        background: 'rgba(8,8,10,0.85)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {metrics.map((m, i) => {
        const Icon = m.icon
        const trendColor = m.trend === 'up' ? '#10b981' : m.trend === 'down' ? '#ef4444' : '#6b7280'
        return (
          <button
            key={i}
            onClick={m.onClick}
            className="flex-1 flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.03] transition-colors"
          >
            <Icon className="h-4 w-4 text-white/30 shrink-0" />
            <span className="text-[11px] text-white/40 font-medium">{m.label}</span>
            <span className="text-[14px] font-bold text-white tabular-nums">{m.value}</span>
            {m.change !== undefined && (
              <span className="text-[10px] font-medium" style={{ color: trendColor }}>
                {m.change > 0 ? '▲' : m.change < 0 ? '▼' : '–'}{Math.abs(m.change)}%
              </span>
            )}
            {m.sparkData && m.sparkData.length > 0 && (
              <div className="w-12 h-4 ml-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={m.sparkData}>
                    <Line type="monotone" dataKey="v" stroke={trendColor} strokeWidth={1} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
