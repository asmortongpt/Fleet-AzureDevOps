/**
 * StatCard — Tesla/Rivian minimal visualization stat card
 *
 * Clean metric display with optional sparkline.
 * No borders, no shadows, just content.
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
}: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-white/30'
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  const getSparklineColor = () => {
    if (trend === 'up') return '#10B981'
    if (trend === 'down') return '#F43F5E'
    return 'rgba(255,255,255,0.2)'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full', className)}>
      <div className="relative h-full rounded-2xl border border-white/[0.04] bg-[#111111] p-4 overflow-hidden">
        <div className="flex items-start justify-between mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.04] text-white/30">
            <Icon className="h-3.5 w-3.5" />
          </div>
          {change !== undefined && (
            <div className={cn('flex items-center gap-0.5 text-[11px] font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 bg-white/[0.04] animate-pulse rounded-lg" />
            <div className="h-3 w-28 bg-white/[0.03] animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-xl font-semibold tracking-tight text-white leading-tight tabular-nums">
              {value}
            </div>
            <p className="text-[10px] font-medium text-white/35 uppercase tracking-wider mt-1">
              {title}
            </p>
            {description && (
              <p className="text-[10px] text-white/20 mt-0.5">
                {description}
              </p>
            )}
            {hasSparkline && (
              <div className="mt-2 -mx-1">
                <ResponsiveContainer width="100%" height={24}>
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
  )
}
