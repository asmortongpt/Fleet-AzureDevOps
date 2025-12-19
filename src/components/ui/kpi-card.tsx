import { TrendingUp, TrendingDown, Minus, Info, ChevronRight } from "lucide-react"
import { ComponentProps, ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "./card"

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
      ? value > previousValue
        ? "up"
        : value < previousValue
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
    <Card
      className={cn(
        "group transition-all",
        isClickable && "cursor-pointer hover:shadow-md hover:border-primary/50",
        loading && "animate-pulse",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium text-muted-foreground truncate flex items-center gap-2">
              {icon && <span className="flex-shrink-0">{icon}</span>}
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
            )}
          </div>
          {isClickable && (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Main Value */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold metric-number">
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
                calculatedTrend === "flat" && "bg-muted text-muted-foreground"
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
            <span className="text-muted-foreground">{period}</span>
          </div>
        )}

        {/* Target Progress */}
        {!loading && target !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Target</span>
              <span className="font-medium">
                {formatValue(target, format, unit)}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all rounded-full",
                  Number(value) >= target ? "bg-success" : "bg-primary"
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
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5" />
            <span>
              {(confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        )}
      </CardContent>
    </Card>
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
