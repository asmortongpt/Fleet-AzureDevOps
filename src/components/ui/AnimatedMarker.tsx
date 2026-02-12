// motion removed - React 19 incompatible
import { ReactNode, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface AnimatedMarkerProps extends HTMLAttributes<HTMLDivElement> {
  /** Marker content (icon, number, etc.) */
  children: ReactNode;
  /** Whether the marker is active/selected */
  isActive?: boolean;
  /** Whether the marker is in a warning state */
  isWarning?: boolean;
  /** Whether the marker is in an error state */
  isError?: boolean;
  /** Whether to show pulse animation */
  showPulse?: boolean;
  /** Vehicle status for color coding */
  status?: "active" | "idle" | "maintenance" | "offline";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom className */
  className?: string;
}

/**
 * AnimatedMarker - Map marker with status indicators
 *
 * Features:
 * - Hover effects with scale and shadow
 * - Pulse animation for active vehicles
 * - Status-based color coding
 * - Accessibility support
 */
export function AnimatedMarker({
  children,
  isActive = false,
  isWarning = false,
  isError = false,
  showPulse = false,
  status = "active",
  size = "md",
  className,
  ...props
}: AnimatedMarkerProps) {
  // Size variants
  const sizeClasses = {
    sm: "w-4 h-4 text-xs",
    md: "w-10 h-8 text-sm",
    lg: "w-12 h-9 text-base",
  };

  // Status colors
  const statusColors = {
    active: "bg-green-500 border-green-600",
    idle: "bg-yellow-500 border-yellow-600",
    maintenance: "bg-orange-500 border-orange-600",
    offline: "bg-gray-500 border-gray-600",
  };

  // Override colors if error or warning
  let colorClasses = statusColors[status];
  if (isError) {
    colorClasses = "bg-red-500 border-red-600";
  } else if (isWarning) {
    colorClasses = "bg-orange-500 border-orange-600";
  }

  return (
    <div
      className={cn(
        "relative rounded-full border-2 flex items-center justify-center",
        "cursor-pointer shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-lg",
        "backdrop-blur-sm",
        sizeClasses[size],
        colorClasses,
        isActive && "ring-4 ring-white/50 scale-[1.2]",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`Map marker - ${status}`}
      {...props}
    >
      {/* Content */}
      <div className="relative z-10 text-white font-semibold">
        {children}
      </div>

      {/* Pulse animation for active vehicles */}
      {showPulse && (
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-ping opacity-50",
            colorClasses
          )}
        />
      )}

      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current animate-pulse"
        />
      )}
    </div>
  );
}

/**
 * AnimatedMarkerCluster - Marker for clustered vehicles
 */
interface AnimatedMarkerClusterProps extends HTMLAttributes<HTMLDivElement> {
  count: number;
  isActive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AnimatedMarkerCluster({
  count,
  isActive = false,
  size = "md",
  className,
  ...props
}: AnimatedMarkerClusterProps) {
  const sizeClasses = {
    sm: "w-10 h-8 text-xs",
    md: "w-12 h-9 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <div
      className={cn(
        "relative rounded-full border-3 flex items-center justify-center",
        "cursor-pointer shadow-sm transition-all duration-200 hover:scale-[1.15] hover:shadow-lg",
        "bg-gradient-to-br from-blue-500 to-blue-600",
        "border-blue-700",
        sizeClasses[size],
        isActive && "ring-4 ring-white/60",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`${count} vehicles clustered`}
      {...props}
    >
      <div className="text-white font-bold">{count}</div>

      {/* Ripple effect */}
      <div
        className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"
      />
    </div>
  );
}

/**
 * AnimatedMarkerRoute - Animated route line endpoint marker
 */
interface AnimatedMarkerRouteProps extends HTMLAttributes<HTMLDivElement> {
  type: "start" | "end" | "waypoint";
  label?: string;
  className?: string;
}

export function AnimatedMarkerRoute({
  type,
  label,
  className,
  ...props
}: AnimatedMarkerRouteProps) {
  const typeConfig = {
    start: { color: "bg-green-500 border-green-600", icon: "S" },
    end: { color: "bg-red-500 border-red-600", icon: "E" },
    waypoint: { color: "bg-blue-500 border-blue-600", icon: "•" },
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn(
        "relative w-4 h-4 rounded-full border-2 flex items-center justify-center",
        "shadow-sm cursor-pointer",
        config.color,
        className
      )}
      role="button"
      aria-label={`${type} marker ${label ? `- ${label}` : ""}`}
      {...props}
    >
      <div className="text-white font-bold text-xs">{config.icon}</div>
      {label && (
        <div
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-black/75 text-white px-2 py-1 rounded shadow-sm"
        >
          {label}
        </div>
      )}
    </div>
  );
}
