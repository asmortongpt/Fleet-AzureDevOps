/**
 * KPICard — Tesla/Rivian minimal enterprise KPI display
 *
 * Large numbers, clean hierarchy, optional target progress.
 * No visual noise — typography-driven.
 */
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react"
import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface KPICardProps extends ComponentProps<"div"> {
  title: string
  value: number | string
  previousValue?: number
  target?: number
  trend?: "up" | "down" | "flat"
  change?: number
  period?: string
  unit?: string
  format?: "number" | "currency" | "percentage"
  icon?: ReactNode
  onClick?: () => void
  confidence?: number
  subtitle?: string
  loading?: boolean
}

export function KPICard({
  title,
  value,
  previousValue,
  target,
  trend,
  change,
  period = "vs last week",
  unit = "",
  format = "number",
  icon,
  onClick,
  confidence,
  subtitle,
  loading = false,
  className,
  ...props
}: KPICardProps) {
  const isClickable = !!onClick

  const calculatedTrend =
    trend ||
    (previousValue !== undefined
      ? Number(value) > previousValue
        ? "up"
        : Number(value) < previousValue
          ? "down"
          : "flat"
      : undefined)

  const calculatedChange =
    change !== undefined
      ? change
      : previousValue !== undefined && previousValue !== 0
        ? ((Number(value) - previousValue) / previousValue) * 100
        : undefined

  const formattedValue = formatValue(value, format, unit)

  const isPositiveTrend = calculatedTrend === "up"
  const isNegativeTrend = calculatedTrend === "down"

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.04] bg-[#111111] p-4",
        isClickable && "cursor-pointer hover:bg-[#161616] transition-colors duration-150",
        loading && "animate-pulse",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-white/30 shrink-0">{icon}</span>}
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wider truncate">
              {title}
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-white/20 mt-0.5">{subtitle}</p>
          )}
        </div>
        {isClickable && (
          <ChevronRight className="w-4 h-4 text-white/15 shrink-0" />
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-semibold text-white tabular-nums tracking-tight">
          {loading ? "—" : formattedValue}
        </span>
      </div>

      {/* Trend */}
      {!loading && calculatedTrend && calculatedChange !== undefined && (
        <div className="flex items-center gap-2 text-[11px]">
          <div className={cn(
            "flex items-center gap-1",
            isPositiveTrend && "text-emerald-400",
            isNegativeTrend && "text-rose-400",
            calculatedTrend === "flat" && "text-white/30"
          )}>
            {isPositiveTrend && <TrendingUp className="w-3 h-3" />}
            {isNegativeTrend && <TrendingDown className="w-3 h-3" />}
            {calculatedTrend === "flat" && <Minus className="w-3 h-3" />}
            <span className="font-medium tabular-nums">
              {calculatedChange > 0 ? "+" : ""}
              {calculatedChange.toFixed(1)}%
            </span>
          </div>
          <span className="text-white/20">{period}</span>
        </div>
      )}

      {/* Target Progress */}
      {!loading && target !== undefined && (
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/30">Target</span>
            <span className="font-medium text-white/50 tabular-nums">
              {formatValue(target, format, unit)}
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                Number(value) >= target ? "bg-emerald-400" : "bg-white/30"
              )}
              style={{
                width: `${Math.min((Number(value) / target) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Confidence */}
      {!loading && confidence !== undefined && (
        <div className="mt-2 text-[10px] text-white/20">
          {(confidence * 100).toFixed(0)}% confidence
        </div>
      )}
    </div>
  )
}

function formatValue(
  value: number | string,
  format: "number" | "currency" | "percentage",
  unit: string
): string {
  if (typeof value === "string") return value

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case "percentage":
      return `${value.toFixed(1)}%`
    case "number":
    default:
      return new Intl.NumberFormat("en-US").format(value) + (unit ? ` ${unit}` : "")
  }
}
