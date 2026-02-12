/**
 * StatCard Component - Professional enterprise metric card
 */

// motion removed - React 19 incompatible
import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface StatCardProps {
  title: string
  value: string | number
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
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
    if (trend === 'down') return 'text-rose-600 dark:text-rose-400'
    return 'text-muted-foreground'
  }

  const getIconBg = () => {
    if (trend === 'up') return 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
    if (trend === 'down') return 'bg-rose-100/80 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
    return 'bg-primary/10 text-primary'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5" />
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const getSparklineColor = () => {
    if (trend === 'up') return '#10b981'
    if (trend === 'down') return '#f43f5e'
    return '#64748b'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full', className)}>
      <div className="h-full rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cta-card cta-stat">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', getIconBg())}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              trend === 'up' && 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
              trend === 'down' && 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
              trend === 'neutral' && 'bg-muted text-muted-foreground'
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
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              {title}
            </p>
            {description && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {description}
              </p>
            )}
            {hasSparkline && (
              <div className="mt-2 -mx-1">
                <ResponsiveContainer width="100%" height={36}>
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
