/**
 * ChartCard — Tesla/Rivian minimal chart wrapper
 *
 * Clean container for charts with optional metadata.
 * No visual noise, just content.
 */
import { Info, RefreshCw, Download } from "lucide-react"
import { ComponentProps, ReactNode } from "react"

import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card"

import { cn } from "@/lib/utils"
import { formatDate, formatNumber } from "@/utils/format-helpers"


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
  const {
    onDrag, onDragStart, onDragEnd, onDragEnter, onDragLeave, onDragOver,
    onAnimationStart, onAnimationEnd, onAnimationIteration,
    ...cardProps
  } = props
  return (
    <Card className={cn("h-full flex flex-col", className)} {...cardProps}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-[13px] flex items-center gap-2">
              {title}
              {helpText && (
                <button
                  className="text-white/20 hover:text-white/40 transition-colors"
                  title={helpText}
                  aria-label={`Help for ${title}`}
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRefresh}
                disabled={loading}
                className="h-7 w-7 p-0 text-white/20 hover:text-white/40 hover:bg-white/[0.04]"
                aria-label="Refresh chart data"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              </Button>
            )}
            {onExport && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onExport}
                className="h-7 w-7 p-0 text-white/20 hover:text-white/40 hover:bg-white/[0.04]"
                aria-label="Export chart data"
              >
                <Download className="w-3.5 h-3.5" />
              </Button>
            )}
            {actions}
          </div>
        </div>

        {(dataSource || lastUpdated) && (
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/20 mt-2 pt-2 border-t border-white/[0.04]">
            {dataSource && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-white/30">Source:</span>
                <span>{dataSource}</span>
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-white/30">Updated:</span>
                <span>{formatRelativeTime(lastUpdated)}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-2">
        <div className="flex-1 min-h-[200px] w-full" role="img" aria-label={title}>
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-white/20 animate-pulse text-[13px]">Loading chart...</div>
            </div>
          ) : (
            chart
          )}
        </div>

        {showLegend && legend && (
          <div className="border-t border-white/[0.04] pt-2">
            {legend}
          </div>
        )}

        {metadata && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/[0.04] pt-3">
            {metadata.min !== undefined && (
              <div>
                <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Min</div>
                <div className="text-[13px] font-semibold text-white tabular-nums">
                  {metadata.min}{metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.max !== undefined && (
              <div>
                <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Max</div>
                <div className="text-[13px] font-semibold text-white tabular-nums">
                  {metadata.max}{metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.average !== undefined && (
              <div>
                <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Average</div>
                <div className="text-[13px] font-semibold text-white tabular-nums">
                  {metadata.average.toFixed(1)}{metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
            {metadata.total !== undefined && (
              <div>
                <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">Total</div>
                <div className="text-[13px] font-semibold text-white tabular-nums">
                  {formatNumber(metadata.total)}{metadata.unit && ` ${metadata.unit}`}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

  return formatDate(date)
}
