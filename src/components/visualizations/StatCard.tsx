/**
 * StatCard — Premium metric display card
 *
 * Gradient accent top-line, glass depth, hover glow,
 * animated value with optional sparkline.
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
  accentColor?: 'emerald' | 'amber' | 'rose' | 'blue'
}

const accentColors = {
  emerald: {
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16, 185, 129, 0.12)',
    iconBg: 'rgba(16, 185, 129, 0.10)',
    iconBorder: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245, 158, 11, 0.12)',
    iconBg: 'rgba(245, 158, 11, 0.10)',
    iconBorder: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#f59e0b',
  },
  rose: {
    gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    glow: 'rgba(244, 63, 94, 0.12)',
    iconBg: 'rgba(244, 63, 94, 0.10)',
    iconBorder: 'rgba(244, 63, 94, 0.15)',
    iconColor: '#f43f5e',
  },
  blue: {
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    glow: 'rgba(59, 130, 246, 0.12)',
    iconBg: 'rgba(59, 130, 246, 0.10)',
    iconBorder: 'rgba(59, 130, 246, 0.15)',
    iconColor: '#3b82f6',
  },
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
  const trendColor = trend === 'up' ? 'text-[var(--status-success)]' : trend === 'down' ? 'text-[var(--status-danger)]' : 'text-[var(--text-tertiary)]'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const accent = accentColors[accentColor]

  const getSparklineColor = () => {
    if (trend === 'up') return 'var(--status-success)'
    if (trend === 'down') return 'var(--status-danger)'
    return 'var(--text-tertiary)'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full', className)}>
      <div className="premium-stat relative h-full p-5 overflow-hidden group">
        {/* Icon + Trend row */}
        <div className="relative z-10 flex items-start justify-between mb-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{
              background: accent.iconBg,
              border: `1px solid ${accent.iconBorder}`,
              boxShadow: `0 0 12px ${accent.glow}`,
            }}
          >
            <Icon className="h-4 w-4" style={{ color: accent.iconColor }} />
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full',
              trend === 'up' && 'bg-emerald-500/10 text-emerald-400',
              trend === 'down' && 'bg-rose-500/10 text-rose-400',
              trend === 'neutral' && 'bg-white/5 text-white/40',
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="relative z-10 space-y-2">
            <div className="h-8 w-24 bg-white/5 animate-pulse rounded-lg" />
            <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
          </div>
        ) : (
          <div className="relative z-10">
            <div className="text-2xl font-bold tracking-tight text-white leading-none tabular-nums">
              {value}
            </div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mt-2">
              {title}
            </p>
            {description && (
              <p className="text-[11px] text-white/25 mt-0.5">
                {description}
              </p>
            )}
            {hasSparkline && (
              <div className="mt-3 -mx-1">
                <ResponsiveContainer width="100%" height={28}>
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
          </div>
        )}
      </div>
    </div>
  )
}
