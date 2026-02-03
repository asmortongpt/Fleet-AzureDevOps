/**
 * StatCard Component - Enhanced
 * Responsive, animated card with sparklines, gradients, and advanced visual effects
 */

import { motion } from 'framer-motion'
import { LucideIcon, Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    if (trend === 'up') return 'text-emerald-600 dark:text-emerald-700'
    if (trend === 'down') return 'text-rose-600 dark:text-rose-400'
    return 'text-slate-600 dark:text-slate-700'
  }

  const getTrendBg = () => {
    if (trend === 'up') return 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40'
    if (trend === 'down') return 'bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/40'
    return 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/40 dark:to-slate-900/40'
  }

  const getCardBg = () => {
    if (trend === 'up') return 'bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30'
    if (trend === 'down') return 'bg-gradient-to-br from-white to-rose-50/30 dark:from-slate-950 dark:to-rose-950/20 border-rose-200/50 dark:border-rose-800/30'
    return 'bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-950 dark:to-slate-900/20'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3" strokeWidth={3} />
    if (trend === 'down') return <TrendingDown className="h-3 w-3" strokeWidth={3} />
    return <Minus className="h-3 w-3" strokeWidth={3} />
  }

  const getSparklineColor = () => {
    if (trend === 'up') return '#10b981'
    if (trend === 'down') return '#f43f5e'
    return '#64748b'
  }

  const hasSparkline = showSparkline && Array.isArray(sparklineData) && sparklineData.length > 0
  const sparkline = sparklineData || []

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={cn('h-full', className)}
    >
      <Card className={cn(
        'h-full border-2 shadow-md hover:shadow-xl transition-all duration-300',
        'backdrop-blur-sm',
        getCardBg()
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
            {title}
          </CardTitle>
          <motion.div
            className={cn('p-2.5 rounded-xl shadow-sm', getTrendBg())}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Icon className={cn('h-5 w-5', getTrendColor())} />
          </motion.div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 w-28 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded-lg" />
              <div className="h-4 w-36 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded" />
              {showSparkline && (
                <div className="h-12 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse rounded" />
              )}
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-3 mb-2">
                <motion.div
                  className="text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  {value}
                </motion.div>
                {change !== undefined && (
                  <motion.div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                      'shadow-sm',
                      trend === 'up' && 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
                      trend === 'down' && 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300',
                      trend === 'neutral' && 'bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                    )}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {getTrendIcon()}
                    <span>{change > 0 ? '+' : ''}{change}%</span>
                  </motion.div>
                )}
              </div>
              {description && (
                <motion.p
                  className="text-xs text-muted-foreground font-medium mb-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {description}
                </motion.p>
              )}
              {hasSparkline && (
                <motion.div
                  className="mt-3 -mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <ResponsiveContainer width="100%" height={50}>
                    <LineChart data={sparkline}>
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={getSparklineColor()}
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
