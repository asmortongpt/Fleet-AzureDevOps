/**
 * StatCard Component - Professional enterprise metric card
 */

// motion removed - React 19 incompatible
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
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3" />
    if (trend === 'down') return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getSparklineColor = () => {
    if (trend === 'up') return '#10B981'
    if (trend === 'down') return '#F43F5E'
    return '#a0a0a0'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full', className)}>
      <div className="relative h-full rounded-lg border border-white/[0.08] bg-[#242424] p-2 shadow-sm overflow-hidden">
        <div className="flex items-start justify-between mb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.06] text-white/60">
            <Icon className="h-3.5 w-3.5" />
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium',
              trend === 'up' && 'text-emerald-400',
              trend === 'down' && 'text-rose-400',
              trend === 'neutral' && 'text-muted-foreground'
            )}>
              {getTrendIcon()}
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-7 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-28 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-lg font-semibold tracking-tight text-foreground leading-tight">
              {value}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            {description && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                {description}
              </p>
            )}
            {hasSparkline && (
              <div className="mt-1 -mx-1">
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
