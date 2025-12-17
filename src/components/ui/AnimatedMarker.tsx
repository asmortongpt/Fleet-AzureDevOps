import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedMarkerProps extends Omit<HTMLMotionProps<"div">, "children"> {
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
 * AnimatedMarker - Smooth map marker transitions with Framer Motion
 *
 * Features:
 * - Entry/exit animations
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
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
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
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isActive ? 1.2 : 1,
        opacity: 1
      }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{
        scale: isActive ? 1.3 : 1.1,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 17
      }}
      className={cn(
        "relative rounded-full border-2 flex items-center justify-center",
        "cursor-pointer shadow-lg transition-shadow",
        "backdrop-blur-sm",
        sizeClasses[size],
        colorClasses,
        isActive && "ring-4 ring-white/50",
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
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            colorClasses
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 0, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * AnimatedMarkerCluster - Marker for clustered vehicles
 */
interface AnimatedMarkerClusterProps extends Omit<HTMLMotionProps<"div">, "children"> {
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
    sm: "w-10 h-10 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-14 h-14 text-base",
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{
        scale: 1.15,
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.4)"
      }}
      whileTap={{ scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 15
      }}
      className={cn(
        "relative rounded-full border-3 flex items-center justify-center",
        "cursor-pointer shadow-xl",
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
      <motion.div
        className="absolute inset-0 rounded-full bg-blue-400"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}

/**
 * AnimatedMarkerRoute - Animated route line endpoint marker
 */
interface AnimatedMarkerRouteProps extends Omit<HTMLMotionProps<"div">, "children"> {
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
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 20
      }}
      className={cn(
        "relative w-8 h-8 rounded-full border-2 flex items-center justify-center",
        "shadow-lg cursor-pointer",
        config.color,
        className
      )}
      role="button"
      aria-label={`${type} marker ${label ? `- ${label}` : ""}`}
      {...props}
    >
      <div className="text-white font-bold text-xs">{config.icon}</div>
      {label && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium bg-black/75 text-white px-2 py-1 rounded shadow-lg"
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  );
}
