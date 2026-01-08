/**
 * Shared MetricCard component
 * Eliminates duplication between FleetMetricsBar, AssetStatsBar, and similar components
 */
import { ReactNode } from "react"

import { Card } from "@/components/ui/card"

export interface MetricCardProps {
  label: string
  value: string | number
  icon: ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'default'
  onClick?: () => void
  className?: string
}

const variantStyles = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  default: "bg-muted text-muted-foreground"
}

/**
 * Single metric card with icon, value, and label
 */
export function MetricCard({
  label,
  value,
  icon,
  variant = 'default',
  onClick,
  className = ""
}: MetricCardProps) {
  return (
    <Card
      className={`p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export interface MetricsBarProps {
  metrics: MetricCardProps[]
  columns?: {
    base?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: string
}

/**
 * Container for multiple metric cards with responsive grid
 */
export function MetricsBar({
  metrics,
  columns = { base: 2, sm: 3, lg: 5 },
  gap = "4"
}: MetricsBarProps) {
  const gridCols = [
    columns.base && `grid-cols-${columns.base}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  ].filter(Boolean).join(' ')

  return (
    <div className={`grid ${gridCols} gap-${gap}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}

/**
 * Example usage:
 *
 * <MetricsBar
 *   metrics={[
 *     {
 *       label: "Total Vehicles",
 *       value: 120,
 *       icon: <Car className="w-5 h-5" />,
 *       variant: "primary",
 *       onClick: () => handleClick("total")
 *     },
 *     {
 *       label: "Active",
 *       value: 95,
 *       icon: <Car className="w-5 h-5" />,
 *       variant: "success"
 *     }
 *   ]}
 * />
 */
