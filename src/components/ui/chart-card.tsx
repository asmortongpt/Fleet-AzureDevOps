import { Info, RefreshCw, Download } from "lucide-react"
import { ComponentProps, ReactNode } from "react"

import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card"

import { cn } from "@/lib/utils"


interface ChartCardProps extends ComponentProps<"div"> {
  title: string
  description?: string
  dataSource?: string
  lastUpdated?: Date
  chart: ReactNode
  actions?: ReactNode
  metadata?: {
    min?: number
    max?: number
    average?: number
    total?: number
    unit?: string
  }
  onRefresh?: () => void
  onExport?: () => void
  showLegend?: boolean
  legend?: ReactNode
  helpText?: string
  loading?: boolean
}

export function ChartCard({
  title,
  description,
  dataSource,
  lastUpdated,
  chart,
  actions,
  metadata,
  onRefresh,
  onExport,
  showLegend = false,
  legend,
  helpText,
  loading = false,
  className,
  ...props
}: ChartCardProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)} {...props}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              {title}
              {helpText && (
                <button
                  className="text-muted-foreground hover:text-foreground transition-colors touch-icon-btn"
                  title={helpText}
                  aria-label={`Help for ${title}`}
                >
                  <Info className="w-4 h-4" />
                </button>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1.5">{description}</CardDescription>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 touch-spacing">
            {onRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={loading}
                className="touch-icon-btn"
                aria-label="Refresh chart data"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            )}
            {onExport && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onExport}
                className="touch-icon-btn"
                aria-label="Export chart data"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            {actions}
          </div>
        </div>

        {/* Metadata Bar */}
        {(dataSource || lastUpdated) && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t">
            {dataSource && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Source:</span>
                <span>{dataSource}</span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Updated:</span>
                <span>{formatRelativeTime(lastUpdated)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Chart */}
        <div className="flex-1 min-h-[200px] w-full" role="img" aria-label={title}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-muted-foreground animate-pulse">Loading chart...</div>
            </div>
          ) : (
            chart
          )}
        </div>

        {/* Legend */}
        {showLegend && legend && (
          <div className="border-t pt-4">
            {legend}
          </div>
        )}

        {/* Statistics Summary */}
        {metadata && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
            {metadata.min !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground font-medium">Min</div>
                <div className="text-sm font-semibold metric-number">
                  {metadata.min}
                  {metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.max !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground font-medium">Max</div>
                <div className="text-sm font-semibold metric-number">
                  {metadata.max}
                  {metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.average !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground font-medium">Average</div>
                <div className="text-sm font-semibold metric-number">
                  {metadata.average.toFixed(1)}
                  {metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.total !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground font-medium">Total</div>
                <div className="text-sm font-semibold metric-number">
                  {metadata.total.toLocaleString()}
                  {metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}
