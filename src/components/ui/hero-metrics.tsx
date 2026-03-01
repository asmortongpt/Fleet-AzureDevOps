/**
 * HeroMetrics — Premium metrics strip with glass-morphism, sparklines, and animated counters
 *
 * Each metric card: accent glow border, animated counter, inline sparkline, trend indicator.
 * Used across all hub pages for consistent premium feel.
 */
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sparkline, generateSparklineData } from '@/components/ui/sparkline'
import { AnimatedCounter } from '@/components/ui/animated-counter'
import { useMemo } from 'react'

export interface HeroMetric {
  label: string
  value: string | number
  icon: LucideIcon
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  accent?: 'emerald' | 'amber' | 'rose' | 'gray'
  /** Optional sparkline data points. If omitted, auto-generated from numeric value. */
  sparklineData?: number[]
  /** Set false to hide the sparkline for this metric */
  sparkline?: boolean
  /** Prefix for animated counter (e.g., "$") */
  prefix?: string
  /** Suffix for animated counter (e.g., "%") */
  suffix?: string
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
      className={cn('flex w-full items-stretch premium-stagger', className)}
    >
      {metrics.map((m, i) => (
        <HeroMetricCard key={i} metric={m} index={i} />
      ))}
    </div>
  )
}

function HeroMetricCard({ metric: m, index: i }: { metric: HeroMetric; index: number }) {
  const color = accentColors[m.accent || 'emerald']
  const Icon = m.icon
  const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus

  // Parse numeric value for animated counter
  const numericValue = useMemo(() => {
    if (typeof m.value === 'number') return m.value
    const cleaned = String(m.value).replace(/[^0-9.\-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? null : parsed
  }, [m.value])

  // Determine if value is already formatted (has non-numeric chars like "$", "%", ",")
  const isFormatted = typeof m.value === 'string' && /[^0-9.\-]/.test(m.value)

  // Generate sparkline data
  const sparkData = useMemo(() => {
    if (m.sparkline === false) return null
    if (m.sparklineData) return m.sparklineData
    if (numericValue !== null && numericValue > 0) {
      return generateSparklineData(numericValue, 12, 0.12, i)
    }
    return null
  }, [m.sparklineData, m.sparkline, numericValue, i])

  return (
    <div
      className={cn(
        'flex-1 flex items-center gap-3 px-4 py-3 relative overflow-hidden group/metric',
        'transition-all duration-200',
        i > 0 && 'border-l border-white/[0.06]',
      )}
    >
      {/* Accent glow bar */}
      <div
        className="absolute left-0 top-[15%] bottom-[15%] w-[3px] rounded-full transition-shadow duration-300"
        style={{
          background: color,
          boxShadow: `0 0 12px ${color}80, 0 0 4px ${color}40`,
        }}
      />
      {/* Icon with ring */}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 relative"
        style={{
          background: `${color}12`,
          border: `1px solid ${color}25`,
        }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      {/* Content + Sparkline */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-white/40 leading-none mb-1">
            {m.label}
          </span>
          <div className="flex items-baseline gap-2">
            {numericValue !== null && !isFormatted ? (
              <AnimatedCounter
                value={numericValue}
                prefix={m.prefix}
                suffix={m.suffix}
                className="text-[22px] font-bold leading-none"
                style={{ color: 'rgba(255,255,255,0.95)' } as React.CSSProperties}
              />
            ) : (
              <span
                className="text-[22px] font-bold leading-none tabular-nums"
                style={{ color: 'rgba(255,255,255,0.95)' }}
              >
                {m.value}
              </span>
            )}
            {m.change !== undefined && (
              <span className={cn(
                'flex items-center gap-0.5 text-[11px] font-semibold leading-none',
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
        {/* Sparkline */}
        {sparkData && (
          <div className="ml-auto opacity-80 group-hover/metric:opacity-100 transition-opacity">
            <Sparkline data={sparkData} color={color} width={72} height={26} />
          </div>
        )}
      </div>
      {/* Subtle gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, transparent 60%)`,
        }}
      />
    </div>
  )
}
