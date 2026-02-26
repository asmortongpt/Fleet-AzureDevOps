import { TrendingUp, TrendingDown, Minus, Info, ChevronRight } from "lucide-react"
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

  // Calculate trend if not provided
  const calculatedTrend =
    trend ||
    (previousValue !== undefined
      ? Number(value) > previousValue
        ? "up"
        : Number(value) < previousValue
          ? "down"
          : "flat"
      : undefined)

  // Calculate change percentage if not provided
  const calculatedChange =
    change !== undefined
      ? change
      : previousValue !== undefined && previousValue !== 0
        ? ((Number(value) - previousValue) / previousValue) * 100
        : undefined

  // Format the value
  const formattedValue = formatValue(value, format, unit)

  // Determine if trend is positive (depends on context)
  const isPositiveTrend = calculatedTrend === "up"
  const isNegativeTrend = calculatedTrend === "down"

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[rgba(0,204,254,0.08)] bg-[#221060] shadow-sm transition-all",
        isClickable && "cursor-pointer hover:shadow-md hover:border-[#00CCFE]/30",
        loading && "animate-pulse",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Left accent border */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00CCFE]" />

      <div className="pb-3 px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-[rgba(255,255,255,0.65)] truncate flex items-center gap-2">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              {title}
            </div>
            {subtitle && (
              <p className="text-xs text-[rgba(255,255,255,0.40)] mt-1">{subtitle}</p>
            )}
          </div>
          {isClickable && (
            <ChevronRight className="w-4 h-4 text-[rgba(255,255,255,0.40)] group-hover:text-[#00CCFE] transition-colors flex-shrink-0" />
          )}
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <span className="font-['Montserrat',sans-serif] font-semibold text-3xl text-white">
            {loading ? "..." : formattedValue}
          </span>
        </div>

        {/* Trend and Change */}
        {!loading && calculatedTrend && calculatedChange !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md",
                isPositiveTrend && "bg-success/10 text-success",
                isNegativeTrend && "bg-destructive/10 text-destructive",
                calculatedTrend === "flat" && "bg-[#2A1878] text-[rgba(255,255,255,0.65)]"
              )}
            >
              {isPositiveTrend && <TrendingUp className="w-3.5 h-3.5" />}
              {isNegativeTrend && <TrendingDown className="w-3.5 h-3.5" />}
              {calculatedTrend === "flat" && <Minus className="w-3.5 h-3.5" />}
              <span className="font-medium">
                {calculatedChange > 0 ? "+" : ""}
                {calculatedChange.toFixed(1)}%
              </span>
            </div>
            <span className="text-[rgba(255,255,255,0.65)]">{period}</span>
          </div>
        )}

        {/* Target Progress */}
        {!loading && target !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[rgba(255,255,255,0.65)]">Target</span>
              <span className="font-medium text-white">
                {formatValue(target, format, unit)}
              </span>
            </div>
            <div className="h-1.5 bg-[#2A1878] rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all rounded-full",
                  Number(value) >= target ? "bg-success" : "bg-[#00CCFE]"
                )}
                style={{
                  width: `${Math.min((Number(value) / target) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Confidence Indicator */}
        {!loading && confidence !== undefined && (
          <div className="flex items-center gap-1.5 text-xs text-[rgba(255,255,255,0.65)]">
            <Info className="w-3.5 h-3.5" />
            <span>
              {(confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format values
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
