import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

import { cn } from "@/lib/utils";

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
  data: VehicleTooltipData;
  showDetails?: boolean;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  onViewDetails?: (id: string) => void;
  onTrack?: (id: string) => void;
}

export function InteractiveTooltip({
  children,
  data,
  showDetails = true,
  side = "top",
  align = "center",
  className,
  onViewDetails,
  onTrack,
}: InteractiveTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statusConfig = {
    active: {
      color: "bg-green-500",
      label: "Active",
      textColor: "text-green-700"
    },
    idle: {
      color: "bg-yellow-500",
      label: "Idle",
      textColor: "text-yellow-700"
    },
    maintenance: {
      color: "bg-orange-500",
      label: "Maintenance",
      textColor: "text-orange-700"
    },
    offline: {
      color: "bg-gray-500",
      label: "Offline",
      textColor: "text-gray-700"
    },
  };

  const config = statusConfig[data.status];

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <AnimatePresence>
          {isOpen && (
            <TooltipContent
              side={side}
              align={align}
              className={cn("p-0 border-0 bg-transparent shadow-none", className)}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: side === "top" ? 5 : -5 }}
                transition={{ duration: 0.15 }}
                className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden min-w-[280px] max-w-[320px]"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm leading-tight">{data.name}</h4>
                      <p className="text-xs text-blue-100 mt-0.5">{data.type}</p>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                      "bg-white/20 backdrop-blur-sm"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full", config.color)} />
                      {config.label}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
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
                          <span className="text-gray-500 text-xs">📍</span>
                          <span className="text-gray-700 text-xs flex-1 leading-relaxed">
                            {data.location}
                          </span>
                        </div>
                      )}
                      {data.driver && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">👤</span>
                          <span className="text-gray-700 text-xs font-medium">
                            {data.driver}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Alerts */}
                  {data.alerts && data.alerts.length > 0 && (
                    <div className="space-y-1">
                      {data.alerts.map((alert, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "text-xs p-2 rounded flex items-start gap-2",
                            alert.type === "error" && "bg-red-50 text-red-700",
                            alert.type === "warning" && "bg-yellow-50 text-yellow-700",
                            alert.type === "info" && "bg-blue-50 text-blue-700"
                          )}
                        >
                          <span className="flex-shrink-0">
                            {alert.type === "error" && "⚠️"}
                            {alert.type === "warning" && "⚡"}
                            {alert.type === "info" && "ℹ️"}
                          </span>
                          <span className="flex-1 leading-relaxed">{alert.message}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Last Update */}
                  {data.lastUpdate && (
                    <div className="text-xs text-gray-500 text-center pt-2 border-t">
                      Updated {formatRelativeTime(data.lastUpdate)}
                    </div>
                  )}

                  {/* Actions */}
                  {(onViewDetails || onTrack) && (
                    <div className="flex gap-2 pt-2">
                      {onViewDetails && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onViewDetails(data.id);
                            setIsOpen(false);
                          }}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors"
                        >
                          View Details
                        </motion.button>
                      )}
                      {onTrack && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onTrack(data.id);
                            setIsOpen(false);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md transition-colors"
                        >
                          Track
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </TooltipContent>
          )}
        </AnimatePresence>
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
      warning ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
    )}>
      <div className="flex items-center gap-1 mb-1">
        {icon && <span className="text-xs">{icon}</span>}
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className={cn(
        "text-sm font-semibold",
        warning ? "text-yellow-700" : "text-gray-900"
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
        <AnimatePresence>
          {isOpen && (
            <TooltipContent
              side={side}
              align={align}
              className={cn("p-0 border-0 bg-transparent shadow-none", className)}
              asChild
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="bg-gray-900 text-white px-3 py-2 rounded-md shadow-lg text-sm max-w-xs"
              >
                {content}
              </motion.div>
            </TooltipContent>
          )}
        </AnimatePresence>
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
    return date.toLocaleDateString();
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
  color = "#3b82f6",
  unit,
  children,
}: DataTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={50}>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <AnimatePresence>
          {isOpen && (
            <TooltipContent className="p-0 border-0 bg-transparent shadow-none" asChild>
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.1 }}
                className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 min-w-[120px]"
              >
                <div className="text-xs text-gray-600 mb-1">{label}</div>
                <div className="flex items-baseline gap-1">
                  <div
                    className="text-lg font-bold"
                    style={{ color }}
                  >
                    {value}
                  </div>
                  {unit && <span className="text-xs text-gray-500">{unit}</span>}
                </div>
                {change !== undefined && (
                  <div className={cn(
                    "text-xs font-medium mt-1",
                    change >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
                  </div>
                )}
              </motion.div>
            </TooltipContent>
          )}
        </AnimatePresence>
      </Tooltip>
    </TooltipProvider>
  );
}
