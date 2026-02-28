/**
 * HeroMetrics — Compact metrics matrix strip
 *
 * Dense single-row layout: label · value · trend, separated by subtle dividers.
 * Professional, government-grade styling — no oversized type or flashy accents.
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
    <div
      className={cn('flex w-full items-stretch', className)}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {metrics.map((m, i) => {
        const color = accentColors[m.accent || 'emerald']
        const Icon = m.icon
        const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus
        return (
          <div
            key={i}
            className={cn(
              'flex-1 flex items-center gap-3 px-4 py-2.5',
              i > 0 && 'border-l border-white/[0.06]',
            )}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md shrink-0"
              style={{ background: `${color}15` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/35 leading-none">
                {m.label}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-semibold text-white leading-none tabular-nums">
                  {m.value}
                </span>
                {m.change !== undefined && (
                  <span className={cn(
                    'flex items-center gap-0.5 text-[11px] font-medium leading-none',
                    m.trend === 'up' && 'text-emerald-400',
                    m.trend === 'down' && 'text-rose-400',
                    m.trend === 'neutral' && 'text-white/25',
                  )}>
                    <TrendIcon className="h-3 w-3" />
                    {m.change > 0 ? '+' : ''}{m.change}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
