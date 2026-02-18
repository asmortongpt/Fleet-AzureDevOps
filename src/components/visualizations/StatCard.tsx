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
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
    if (trend === 'down') return 'text-rose-600 dark:text-rose-400'
    return 'text-muted-foreground'
  }

  const getIconBg = () => {
    if (trend === 'up') return 'text-white shadow-sm'
    if (trend === 'down') return 'text-white shadow-sm'
    return 'text-white shadow-sm'
  }

  const getIconGradient = () => {
    if (trend === 'up') return 'linear-gradient(135deg, #10B981, #059669)'
    if (trend === 'down') return 'linear-gradient(135deg, #F43F5E, #E11D48)'
    return 'linear-gradient(135deg, #F0A000, #E67E22)'
  }

  const getAccentGradient = () => {
    if (trend === 'up') return 'linear-gradient(to bottom, #10B981, #059669)'
    if (trend === 'down') return 'linear-gradient(to bottom, #F43F5E, #E11D48)'
    return 'linear-gradient(to bottom, #F0A000, #E67E22)'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5" />
    if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5" />
    return <Minus className="h-3.5 w-3.5" />
  }

  const getSparklineColor = () => {
    if (trend === 'up') return 'hsl(var(--chart-2))'
    if (trend === 'down') return 'hsl(var(--chart-6))'
    return 'hsl(var(--muted-foreground))'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0

  return (
    <div className={cn('h-full animate-fade-in-up', className)}>
      <div className="relative h-full rounded-xl border border-[rgba(240,160,0,0.12)] bg-card/80 backdrop-blur-md p-4 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cta-card cta-stat overflow-hidden">
        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: getAccentGradient() }} />
        {/* Top shimmer line */}
        <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(240, 160, 0, 0.3), transparent)' }} />
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn('flex h-10 w-10 items-center justify-center rounded-xl', getIconBg())}
            style={{ background: getIconGradient(), border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
          >
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
