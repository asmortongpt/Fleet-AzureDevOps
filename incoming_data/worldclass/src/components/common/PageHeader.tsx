/**
 * PageHeader - Reusable page header component with stats cards
 *
 * Consistent page header layout with title, subtitle, action buttons,
 * and optional stat cards. Used across all major modules.
 *
 * Features:
 * - Title and subtitle
 * - Action buttons (primary and secondary)
 * - Stat cards with icons, values, trends
 * - Responsive layout
 * - Loading states for stats
 *
 * Usage:
 * ```tsx
 * <PageHeader
 *   title="Virtual Garage"
 *   subtitle="Manage all fleet assets"
 *   actions={<Button>Add Vehicle</Button>}
 *   stats={[
 *     { label: 'Total Assets', value: 145, icon: <Package /> },
 *     { label: 'Active', value: 120, trend: { value: 12, direction: 'up' } }
 *   ]}
 * />
 * ```
 */

import { TrendUp, TrendDown } from "@phosphor-icons/react"
import { ReactNode } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================================
// TYPES
// ============================================================================

export interface StatTrend {
  /** Trend value (e.g., percentage or absolute change) */
  value: number
  /** Trend direction */
  direction: "up" | "down"
  /** Label for trend (e.g., "vs last month") */
  label?: string
}

export interface StatCard {
  /** Stat label */
  label: string
  /** Stat value */
  value: number | string
  /** Optional icon */
  icon?: ReactNode
  /** Optional trend indicator */
  trend?: StatTrend
  /** Value color (for highlighting critical stats) */
  valueColor?: string
  /** Loading state */
  isLoading?: boolean
  /** Format function for value */
  format?: (value: number | string) => string
}

export interface PageHeaderProps {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Action buttons (right side) */
  actions?: ReactNode
  /** Stat cards to display below header */
  stats?: StatCard[]
  /** Additional className */
  className?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PageHeader({
  title,
  subtitle,
  actions,
  stats,
  className = ""
}: PageHeaderProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header section */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Stats section */}
      {stats && stats.length > 0 && (
        <div className={`grid gap-4 ${
          stats.length === 1 ? "grid-cols-1" :
          stats.length === 2 ? "grid-cols-2" :
          stats.length === 3 ? "grid-cols-3" :
          stats.length === 4 ? "grid-cols-4" :
          stats.length === 5 ? "grid-cols-5" :
          "grid-cols-6"
        }`}>
          {stats.map((stat, index) => (
            <StatCardComponent key={index} {...stat} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCardComponent({
  label,
  value,
  icon,
  trend,
  valueColor,
  isLoading,
  format
}: StatCard) {
  // Format value
  const formattedValue = format ? format(value) : value

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className={`text-2xl font-bold ${valueColor || ""}`}>
              {formattedValue}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trend.direction === "up" ? (
                  <TrendUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    trend.direction === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {trend.value > 0 ? "+" : ""}{trend.value}
                  {typeof trend.value === "number" && trend.value % 1 !== 0 ? "%" : ""}
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
