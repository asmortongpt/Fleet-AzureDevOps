import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface MetricsGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

/**
 * Responsive grid layout for metrics cards
 *
 * Features:
 * - Responsive breakpoints (1 col mobile, 2 col tablet, N col desktop)
 * - Consistent spacing
 * - Auto-fit for fewer items
 * - Accessible grid structure
 *
 * @example
 * ```tsx
 * <MetricsGrid columns={4}>
 *   <MetricCard title="Total" value="120" />
 *   <MetricCard title="Active" value="95" />
 *   <MetricCard title="Alerts" value="5" />
 *   <MetricCard title="Service" value="20" />
 * </MetricsGrid>
 * ```
 */
export function MetricsGrid({ children, columns = 4, className }: MetricsGridProps) {
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }

  return (
    <div
      className={cn(
        "grid gap-4 md:gap-6",
        gridClasses[columns],
        className
      )}
      role="region"
      aria-label="Metrics dashboard"
    >
      {children}
    </div>
  )
}
