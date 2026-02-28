/**
 * HeroMetrics — Full-width inline metric strip
 *
 * No card containers. Raw numbers on dark background.
 * Colored left border per metric. 36px values, 11px labels, trend arrows.
 */
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HeroMetric {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'emerald' | 'amber' | 'rose' | 'gray'
}

interface HeroMetricsProps {
  metrics: HeroMetric[]
  className?: string
}

const accentColors = {
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#ef4444',
  gray: '#6b7280',
}

export function HeroMetrics({ metrics, className }: HeroMetricsProps) {
  return (
    <div className={cn('flex w-full', className)}>
      {metrics.map((m, i) => {
        const color = accentColors[m.accent || 'emerald']
        const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus
        return (
          <div
            key={i}
            className="flex-1 flex items-center gap-4 px-6 py-5 relative"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="flex flex-col min-w-0">
              <div className="text-[36px] font-bold tracking-tight text-white leading-none tabular-nums">
                {m.value}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35 mt-1.5">
                {m.label}
              </span>
            </div>
            {m.change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                m.trend === 'up' && 'text-emerald-400',
                m.trend === 'down' && 'text-rose-400',
                m.trend === 'neutral' && 'text-white/30',
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{m.change > 0 ? '+' : ''}{m.change}%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
