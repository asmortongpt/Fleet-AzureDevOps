/**
 * StatCard Component
 * Responsive, animated card for displaying key metrics
 */

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  description?: string
  className?: string
  loading?: boolean
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
}: StatCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400'
    if (trend === 'down') return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getTrendBg = () => {
    if (trend === 'up') return 'bg-green-50 dark:bg-green-950/30'
    if (trend === 'down') return 'bg-red-50 dark:bg-red-950/30'
    return 'bg-gray-50 dark:bg-gray-950/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={cn('h-full', className)}
    >
      <Card className="h-full border-2 hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={cn('p-2 rounded-lg', getTrendBg())}>
            <Icon className={cn('h-4 w-4', getTrendColor())} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold tracking-tight">{value}</div>
                {change !== undefined && (
                  <div
                    className={cn(
                      'text-sm font-medium flex items-center gap-1',
                      getTrendColor()
                    )}
                  >
                    <span>{change > 0 ? '+' : ''}{change}%</span>
                    {trend === 'up' && '↑'}
                    {trend === 'down' && '↓'}
                  </div>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
