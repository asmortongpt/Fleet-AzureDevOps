/**
 * HeroBanner — Compact financial metrics strip
 *
 * Dense single-row layout matching HeroMetrics matrix.
 * Professional, government-grade styling.
 */
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BannerMetric {
  label: string
  value: string
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  sparkData?: { v: number }[]
}

interface HeroBannerProps {
  metrics: BannerMetric[]
  className?: string
}

const accentColors = {
  up: '#10b981',
  down: '#ef4444',
  neutral: '#6b7280',
}

export function HeroBanner({ metrics, className }: HeroBannerProps) {
  return (
    <div
      className={cn('w-full flex items-stretch', className)}
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {metrics.map((m, i) => {
        const Icon = m.icon
        const trendColor = accentColors[m.trend || 'neutral']
        const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : null
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
              style={{ background: `${trendColor}15` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: trendColor }} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-white/35 leading-none">
                {m.label}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-[18px] font-semibold text-white leading-none tabular-nums">
                  {m.value}
                </span>
                {m.change !== undefined && TrendIcon && (
                  <span className="flex items-center gap-0.5 text-[11px] font-medium leading-none" style={{ color: trendColor }}>
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
