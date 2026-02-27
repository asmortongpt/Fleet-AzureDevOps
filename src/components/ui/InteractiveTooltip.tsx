// motion removed - React 19 incompatible
import { ReactNode, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format-helpers";

/**
 * InteractiveTooltip - Rich tooltips with vehicle data and interactive elements
 *
 * Features:
 * - Animated appearance/disappearance
 * - Rich content with vehicle metrics
 * - Status indicators
 * - Interactive elements (buttons, links)
 * - Position-aware rendering
 */

interface VehicleTooltipData {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "maintenance" | "offline";
  speed?: number;
  fuel?: number;
  location?: string;
  driver?: string;
  lastUpdate?: Date;
  alerts?: Array<{ type: "warning" | "error" | "info"; message: string }>;
}

interface InteractiveTooltipProps {
  children: ReactNode;
  content?: ReactNode;
  data?: VehicleTooltipData;
  showDetails?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  onViewDetails?: (id: string) => void;
  onTrack?: (id: string) => void;
  delay?: number;
  asChild?: boolean;
  position?: "top" | "right" | "bottom" | "left";
}

export function InteractiveTooltip({
  children,
  content,
  data,
  showDetails = true,
  side = "top",
  align = "center",
  className,
  onViewDetails,
  onTrack,
  delay = 0,
  asChild = true,
  position,
}: InteractiveTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    active: {
      color: "bg-green-500",
      label: "Active",
      textColor: "text-[var(--accent-primary)]"
    },
    idle: {
      color: "bg-amber-500",
      label: "Idle",
      textColor: "text-amber-400"
    },
    maintenance: {
      color: "bg-orange-500",
      label: "Maintenance",
      textColor: "text-orange-400"
    },
    offline: {
      color: "bg-white/30",
      label: "Offline",
      textColor: "text-[var(--text-tertiary)]"
    },
  };

  // Support both simple content and complex data
  const config = data ? statusConfig[data.status] : null;
  const effectiveSide = (position || side) as "top" | "right" | "bottom" | "left";

  // If simple content is provided, render a simple tooltip
  if (content && !data) {
    return (
      <TooltipProvider delayDuration={delay}>
        <Tooltip open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
          {isOpen && (
            <TooltipContent
              side={effectiveSide}
              align={align}
              className={cn("bg-[var(--surface-2)] text-white border-[var(--border-subtle)]", className)}
            >
              {content}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Complex vehicle data rendering
  return (
    <TooltipProvider delayDuration={delay}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
        {isOpen && data && (
          <TooltipContent
            side={effectiveSide}
            align={align}
            className={cn("p-0 border-0 bg-transparent", className)}
          >
            <div
              className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg overflow-hidden min-w-[280px] max-w-[320px]"
            >
              {/* Header */}
              <div className="bg-emerald-600 px-2 py-3 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm leading-tight">{data.name}</h4>
                    <p className="text-xs text-emerald-100 mt-0.5">{data.type}</p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    "bg-white/20"
                  )}>
                    <div className={cn("w-2 h-2 rounded-full", config?.color)} />
                    {config?.label}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-2 space-y-3">
                {/* Quick Stats */}
                {showDetails && (
                  <div className="grid grid-cols-2 gap-3">
                    {data.speed !== undefined && (
                      <MetricItem
                        label="Speed"
                        value={`${data.speed} mph`}
                        icon="🚗"
                      />
                    )}
                    {data.fuel !== undefined && (
                      <MetricItem
                        label="Fuel"
                        value={`${data.fuel}%`}
                        icon="⛽"
                        warning={data.fuel < 25}
                      />
                    )}
                  </div>
                )}

                {/* Location & Driver */}
                {(data.location || data.driver) && (
                  <div className="space-y-2 text-sm">
                    {data.location && (
                      <div className="flex items-start gap-2">
                        <span className="text-[var(--text-secondary)] text-xs">📍</span>
                        <span className="text-[var(--text-secondary)] text-xs flex-1 leading-relaxed">
                          {data.location}
                        </span>
                      </div>
                    )}
                    {data.driver && (
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)] text-xs">👤</span>
                        <span className="text-[var(--text-secondary)] text-xs font-medium">
                          {data.driver}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Alerts */}
                {data.alerts && data.alerts.length > 0 && (
                  <div className="space-y-1">
                    {data.alerts.map((alert) => (
                      <div
                        key={alert.message}
                        className={cn(
                          "text-xs p-2 rounded flex items-start gap-2",
                          alert.type === "error" && "bg-red-500/10 text-red-400",
                          alert.type === "warning" && "bg-amber-500/10 text-amber-400",
                          alert.type === "info" && "bg-emerald-500/10 text-[var(--accent-primary)]"
                        )}
                      >
                        <span className="flex-shrink-0">
                          {alert.type === "error" && "⚠️"}
                          {alert.type === "warning" && "⚡"}
                          {alert.type === "info" && "ℹ️"}
                        </span>
                        <span className="flex-1 leading-relaxed">{alert.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Last Update */}
                {data.lastUpdate && (
                  <div className="text-xs text-[var(--text-tertiary)] text-center pt-2 border-t border-[var(--border-subtle)]">
                    Updated {formatRelativeTime(data.lastUpdate)}
                  </div>
                )}

                {/* Actions */}
                {(onViewDetails || onTrack) && (
                  <div className="flex gap-2 pt-2">
                    {onViewDetails && (
                      <button
                        onClick={() => {
                          onViewDetails(data.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors"
                      >
                        View Details
                      </button>
                    )}
                    {onTrack && (
                      <button
                        onClick={() => {
                          onTrack(data.id);
                          setIsOpen(false);
                        }}
                        className="flex-1 px-3 py-2 border border-[var(--border-subtle)] hover:bg-[var(--surface-glass)] text-[var(--text-secondary)] text-xs font-medium rounded-md transition-colors"
                      >
                        Track
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * MetricItem - Small metric display for tooltips
 */
interface MetricItemProps {
  label: string;
  value: string;
  icon?: string;
  warning?: boolean;
}

function MetricItem({ label, value, icon, warning }: MetricItemProps) {
  return (
    <div className={cn(
      "p-2 rounded-lg border",
      warning ? "bg-amber-500/10 border-amber-500/20" : "bg-[var(--surface-glass)] border-[var(--border-subtle)]"
    )}>
      <div className="flex items-center gap-1 mb-1">
        {icon && <span className="text-xs">{icon}</span>}
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      </div>
      <div className={cn(
        "text-sm font-semibold",
        warning ? "text-amber-400" : "text-white"
      )}>
        {value}
      </div>
    </div>
  );
}

/**
 * SimpleTooltip - Lightweight animated tooltip
 */
interface SimpleTooltipProps {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
}

export function SimpleTooltip({
  children,
  content,
  side = "top",
  align = "center",
  className,
}: SimpleTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {isOpen && (
          <TooltipContent
            side={side}
            align={align}
            className={cn("p-0 border-0 bg-transparent", className)}
          >
            <div
              className="bg-[var(--surface-2)] text-white px-3 py-2 rounded-md text-sm max-w-xs border border-[var(--border-subtle)]"
            >
              {content}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper function to format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return formatDate(date);
  }
}

/**
 * DataTooltip - Tooltip for data visualization (charts, graphs)
 */
interface DataTooltipProps {
  label: string;
  value: number | string;
  change?: number;
  color?: string;
  unit?: string;
  children: ReactNode;
}

export function DataTooltip({
  label,
  value,
  change,
  color = "hsl(var(--chart-1))",
  unit,
  children,
}: DataTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        {isOpen && (
          <TooltipContent className="p-0 border-0 bg-transparent">
            <div
              className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 min-w-[120px]"
            >
              <div className="text-xs text-[var(--text-tertiary)] mb-1">{label}</div>
              <div className="flex items-baseline gap-1">
                <div
                  className="text-sm font-bold"
                  style={{ color }}
                >
                  {value}
                </div>
                {unit && <span className="text-xs text-[var(--text-tertiary)]">{unit}</span>}
              </div>
              {change !== undefined && (
                <div className={cn(
                  "text-xs font-medium mt-1",
                  change >= 0 ? "text-[var(--accent-primary)]" : "text-rose-400"
                )}>
                  {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
                </div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
