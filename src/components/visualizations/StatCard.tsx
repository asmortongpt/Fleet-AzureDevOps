/**
 * StatCard — Premium KPI metric card
 *
 * Large bold value, colored left accent bar, trend badge,
 * icon with tinted background, generous spacing.
 */

import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { type ReactNode } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number | ReactNode
  change?: number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
  loading?: boolean
  sparklineData?: { value: number }[]
  showSparkline?: boolean
  accentColor?: 'emerald' | 'amber' | 'rose' | 'cyan'
}

const accents = {
  emerald: { bar: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)', text: '#34d399' },
  amber:   { bar: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)', text: '#fbbf24' },
  rose:    { bar: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.18)',  text: '#fb7185' },
  cyan:    { bar: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.18)',  text: '#22d3ee' },
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  description,
  className,
  loading = false,
  sparklineData,
  showSparkline = true,
  accentColor = 'emerald',
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const accent = accents[accentColor]

  const getSparklineColor = () => {
    if (trend === 'up') return '#10b981'
    if (trend === 'down') return '#f43f5e'
    return '#6b7280'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full', className)}>
      <div
        className="relative h-full rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Colored left accent bar */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{ background: accent.bar, boxShadow: `0 0 8px ${accent.bar}40` }}
        />

        <div className="p-5 pl-6">
          {/* Top row: icon + trend */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
            >
              <Icon className="h-5 w-5" style={{ color: accent.bar }} />
            </div>
            {change !== undefined && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full',
                trend === 'up' && 'bg-emerald-500/12 text-emerald-400',
                trend === 'down' && 'bg-rose-500/12 text-rose-400',
                trend === 'neutral' && 'bg-white/5 text-white/40',
              )}>
                <TrendIcon className="h-3.5 w-3.5" />
                <span>{change > 0 ? '+' : ''}{change}%</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-9 w-28 bg-white/5 animate-pulse rounded-xl" />
              <div className="h-3.5 w-36 bg-white/5 animate-pulse rounded" />
            </div>
          ) : (
            <>
              {/* Large value */}
              <div className="text-[28px] font-bold tracking-tight text-white leading-none tabular-nums mb-1.5">
                {value}
              </div>

              {/* Title */}
              <p className="text-[12px] font-semibold text-white/35 uppercase tracking-[0.08em]">
                {title}
              </p>

              {/* Description */}
              {description && (
                <p className="text-[12px] text-white/25 mt-1">
                  {description}
                </p>
              )}

              {/* Sparkline */}
              {hasSparkline && (
                <div className="mt-3 -mx-1">
                  <ResponsiveContainer width="100%" height={32}>
                    <LineChart data={sparklineData}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={getSparklineColor()}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
