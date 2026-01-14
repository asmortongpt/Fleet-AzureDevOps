import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

// Export type for tooltip props
export type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>

/**
 * Metric Tooltip with Comparisons
 * Specialized tooltip for showing rich metric context with comparisons and benchmarks
 */
interface MetricTooltipProps {
  children: React.ReactNode
  title: string
  currentValue: string
  comparison?: {
    label: string
    value: string
    trend?: "up" | "down"
  }
  benchmark?: {
    label: string
    value: string
  }
  description?: string
}

function MetricTooltip({
  children,
  title,
  currentValue,
  comparison,
  benchmark,
  description
}: MetricTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="p-0 max-w-sm bg-popover border-border/50 shadow-sm">
        <div className="p-3 space-y-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-base font-bold text-foreground mt-0.5">
              {currentValue}
            </p>
          </div>

          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          {comparison && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">{comparison.label}</span>
              <span className={cn(
                "text-xs font-semibold",
                comparison.trend === "up" ? "text-success" : comparison.trend === "down" ? "text-destructive" : "text-foreground"
              )}>
                {comparison.value}
              </span>
            </div>
          )}

          {benchmark && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">{benchmark.label}</span>
              <span className="text-xs font-semibold text-foreground">
                {benchmark.value}
              </span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, MetricTooltip }
