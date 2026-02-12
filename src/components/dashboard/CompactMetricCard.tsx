import { TrendingUp, TrendingDown, Minus } from "lucide-react"
// motion removed - React 19 incompatible

import { cn } from "@/lib/utils"

interface CompactMetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  subtitle?: string
  icon?: React.ReactNode
  status?: "success" | "warning" | "error" | "info"
  onClick?: () => void
  className?: string
  testId?: string
  valueTestId?: string
}

export function CompactMetricCard({
  title,
  value,
  change,
  trend = "neutral",
  subtitle,
  icon,
  status = "info",
  onClick,
  className,
  testId,
  valueTestId
}: CompactMetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-3 h-3" />
    if (trend === "down") return <TrendingDown className="w-3 h-3" />
    return <Minus className="w-3 h-3" />
  }

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600 dark:text-green-400"
    if (trend === "down") return "text-red-600 dark:text-red-400"
    return "text-gray-700 dark:text-gray-700"
  }

  const getStatusStyle = () => {
    const styles = {
      success: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900",
      warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
      error: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
      info: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-700 dark:border-blue-900"
    }
    return styles[status]
  }

  return (
    <div
      className={cn("metric-card-compact", className)}
      onClick={onClick}
      data-testid={testId}
    >
      {icon && (
        <div className={cn("metric-icon-container", getStatusStyle())}>
          {icon}
        </div>
      )}

      <div className="metric-content min-w-0 flex-1">
        <div className="metric-label truncate" title={title}>{title}</div>
        <div className="flex items-baseline gap-2">
          <div
            className="metric-value truncate"
            title={String(value)}
            data-testid={valueTestId}
          >
            {value}
          </div>
          {change !== undefined && (
            <div className={cn("metric-trend", getTrendColor())}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {subtitle && (
          <div className="metric-subtitle truncate" title={subtitle}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
