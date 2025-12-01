import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUp, ArrowDown, Minus } from "@phosphor-icons/react"

export interface MetricCardProps {
  /** Metric label/title */
  label: string
  /** Main metric value */
  value: number | string
  /** Optional unit (e.g., "mi", "%", "vehicles") */
  unit?: string
  /** Change percentage vs previous period */
  change?: number
  /** Trend direction */
  trend?: "up" | "down" | "neutral"
  /** Icon to display */
  icon?: ReactNode
  /** Click handler */
  onClick?: () => void
  /** Loading state */
  loading?: boolean
  /** Variant for different status colors */
  variant?: "default" | "success" | "warning" | "danger" | "info"
}

/**
 * Professional metric card component for dashboard KPIs
 *
 * Features:
 * - Modern minimalistic design
 * - Responsive sizing
 * - Interactive hover states
 * - Trend indicators with colors
 * - WCAG AAA contrast compliance
 * - Loading skeleton state
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Active Vehicles"
 *   value={127}
 *   change={2.5}
 *   trend="up"
 *   icon={<Truck weight="duotone" />}
 * />
 * ```
 */
export function MetricCard({
  label,
  value,
  unit,
  change,
  trend,
  icon,
  onClick,
  loading = false,
  variant = "default",
}: MetricCardProps) {
  // Variant color mappings
  const variantStyles = {
    default: "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600",
    success: "border-emerald-200 dark:border-emerald-900 hover:border-emerald-400 dark:hover:border-emerald-600",
    warning: "border-amber-200 dark:border-amber-900 hover:border-amber-400 dark:hover:border-amber-600",
    danger: "border-red-200 dark:border-red-900 hover:border-red-400 dark:hover:border-red-600",
    info: "border-blue-200 dark:border-blue-900 hover:border-blue-400 dark:hover:border-blue-600",
  }

  const iconColorStyles = {
    default: "text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400",
    success: "text-emerald-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    warning: "text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-400",
    danger: "text-red-400 group-hover:text-red-600 dark:group-hover:text-red-400",
    info: "text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-400",
  }

  // Trend color mappings
  const trendColors = {
    up: "text-emerald-600 dark:text-emerald-500",
    down: "text-red-600 dark:text-red-500",
    neutral: "text-slate-600 dark:text-slate-400",
  }

  // Trend icons
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus

  const CardWrapper = onClick ? "button" : "div"

  return (
    <CardWrapper
      onClick={onClick}
      className={`group relative text-left w-full ${onClick ? "cursor-pointer" : ""}`}
      aria-label={`${label}: ${value}${unit ? ` ${unit}` : ""}`}
    >
      <Card
        className={`
          border transition-all duration-200
          ${variantStyles[variant]}
          ${onClick ? "hover:shadow-md active:shadow-sm" : ""}
          ${loading ? "animate-pulse" : ""}
        `}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
              {label}
            </span>
            {icon && (
              <span className={`transition-colors duration-200 ${iconColorStyles[variant]}`}>
                {icon}
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-2">
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          ) : (
            <>
              {/* Main value */}
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  {value}
                </span>
                {unit && (
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {unit}
                  </span>
                )}
              </div>

              {/* Change indicator */}
              {change !== undefined && trend && (
                <div className="flex items-center gap-1.5">
                  <TrendIcon
                    className={`w-3.5 h-3.5 ${trendColors[trend]}`}
                    weight="bold"
                  />
                  <span className={`text-xs font-medium ${trendColors[trend]}`}>
                    {Math.abs(change).toFixed(1)}%{" "}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      vs last period
                    </span>
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  )
}

/**
 * Skeleton loader for MetricCard
 * Use while data is loading
 */
export function MetricCardSkeleton() {
  return (
    <Card className="border border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}
