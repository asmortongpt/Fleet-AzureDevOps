/**
 * CompactMetricCard — Tesla/Rivian minimal compact metric
 *
 * Small, clean, typography-driven.
 */
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

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
  onClick,
  className,
  testId,
  valueTestId
}: CompactMetricCardProps) {
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-white/30"
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-white/[0.04] bg-[#111111] p-3",
        onClick && "cursor-pointer hover:bg-[#161616] transition-colors duration-150",
        className
      )}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      data-testid={testId}
    >
      {icon && (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-white/30 shrink-0">
          {icon}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium text-white/35 uppercase tracking-wider truncate" title={title}>
          {title}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className="text-[15px] font-semibold text-white tabular-nums truncate"
            title={String(value)}
            data-testid={valueTestId}
          >
            {value}
          </span>
          {change !== undefined && (
            <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", trendColor)}>
              <TrendIcon className="w-3 h-3" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {subtitle && (
          <div className="text-[10px] text-white/20 truncate mt-0.5" title={subtitle}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}
