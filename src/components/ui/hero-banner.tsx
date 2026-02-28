/**
 * HeroBanner — Large metric display panel (120px)
 *
 * 42px numbers, sparkline trends, gradient background.
 * Used by Business Management hub.
 */
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
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

export function HeroBanner({ metrics, className }: HeroBannerProps) {
  return (
    <div
      className={cn('w-full rounded-2xl overflow-hidden', className)}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex divide-x divide-white/[0.06]">
        {metrics.map((m, i) => {
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : null
          const trendColor = m.trend === 'up' ? '#10b981' : m.trend === 'down' ? '#ef4444' : '#6b7280'
          return (
            <div key={i} className="flex-1 px-8 py-7 flex items-center gap-5">
              <div className="flex flex-col min-w-0">
                <div className="text-[42px] font-bold tracking-tight text-white leading-none tabular-nums">
                  {m.value}
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mt-2">
                  {m.label}
                </span>
              </div>
              <div className="flex flex-col items-end gap-2 ml-auto">
                {m.change !== undefined && TrendIcon && (
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: trendColor }}>
                    <TrendIcon className="h-3 w-3" />
                    <span>{m.change > 0 ? '+' : ''}{m.change}%</span>
                  </div>
                )}
                {m.sparkData && m.sparkData.length > 0 && (
                  <div className="w-20 h-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={m.sparkData}>
                        <Line type="monotone" dataKey="v" stroke={trendColor} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
