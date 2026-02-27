/**
 * MetricCard — Tesla/Rivian minimal dashboard metric
 *
 * Clean, flat, typography-driven. No glass morphism,
 * no gradient overlays, no hover lift effects.
 */
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import { ReactNode } from "react"

import { formatNumber } from "@/utils/format-helpers"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  label: string
  value: number | string
  unit?: string
  change?: number
  trend?: "up" | "down" | "neutral"
  icon?: ReactNode
  onClick?: () => void
  loading?: boolean
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

export function MetricCard({
  label,
  value,
  unit,
  change,
  trend,
  icon,
  onClick,
  loading = false,
}: MetricCardProps) {
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-white/30"
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus

  const Wrapper = onClick ? "button" : "div"

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "text-left w-full rounded-2xl border border-white/[0.04] bg-[#111111] p-4",
        onClick && "cursor-pointer hover:bg-[#161616] transition-colors duration-150",
        loading && "animate-pulse"
      )}
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      {/* Label + Icon */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className="text-white/20">{icon}</span>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-24 bg-white/[0.04] rounded-lg" />
          <div className="h-4 w-16 bg-white/[0.03] rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xl font-semibold text-white tracking-tight tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-[12px] text-white/30 font-medium">{unit}</span>
            )}
          </div>

          {change !== undefined && trend && (
            <div className="flex items-center gap-1.5">
              <div className={cn("flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="w-3 h-3" />
                <span className="text-[11px] font-medium tabular-nums">
                  {formatNumber(Math.abs(change), 1)}%
                </span>
              </div>
              <span className="text-[11px] text-white/20">vs last period</span>
            </div>
          )}
        </>
      )}
    </Wrapper>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-[#111111] p-4 animate-pulse">
      <div className="h-3 w-20 bg-white/[0.04] rounded mb-3" />
      <div className="h-7 w-24 bg-white/[0.04] rounded-lg mb-2" />
      <div className="h-3 w-16 bg-white/[0.03] rounded" />
    </div>
  )
}
