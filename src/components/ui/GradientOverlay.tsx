import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * GradientOverlay - Data visualization gradients and overlays
 *
 * Features:
 * - Heat map gradients for density visualization
 * - Status overlays for zones/regions
 * - Animated gradient transitions
 * - Performance metrics visualization
 * - Configurable color schemes
 */

interface GradientOverlayProps {
  className?: string;
}

/**
 * HeatmapGradient - Gradient for heat map visualization
 */
interface HeatmapGradientProps extends GradientOverlayProps {
  /** Intensity value 0-100 */
  intensity: number;
  /** Color scheme */
  colorScheme?: "traffic" | "performance" | "temperature" | "custom";
  /** Custom colors [low, mid, high] */
  customColors?: [string, string, string];
  /** Show intensity label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: "top" | "bottom" | "center";
}

export function HeatmapGradient({
  intensity,
  colorScheme = "traffic",
  customColors,
  showLabel = false,
  labelPosition = "center",
  className,
}: HeatmapGradientProps) {
  const colorSchemes = {
    traffic: {
      low: "#22c55e",    // green
      mid: "#eab308",    // yellow
      high: "#ef4444",   // red
    },
    performance: {
      low: "#ef4444",    // red
      mid: "#eab308",    // yellow
      high: "#22c55e",   // green
    },
    temperature: {
      low: "#3b82f6",    // blue
      mid: "#f59e0b",    // orange
      high: "#ef4444",   // red
    },
    custom: customColors
      ? { low: customColors[0], mid: customColors[1], high: customColors[2] }
      : { low: "#3b82f6", mid: "#8b5cf6", high: "#ec4899" },
  };

  const colors = colorSchemes[colorScheme];

  // Calculate color based on intensity
  const getColor = () => {
    if (intensity < 50) {
      // Interpolate between low and mid
      const ratio = intensity / 50;
      return interpolateColor(colors.low, colors.mid, ratio);
    } else {
      // Interpolate between mid and high
      const ratio = (intensity - 50) / 50;
      return interpolateColor(colors.mid, colors.high, ratio);
    }
  };

  const backgroundColor = getColor();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity / 100 }}
      transition={{ duration: 0.5 }}
      className={cn("relative", className)}
      style={{
        background: `radial-gradient(circle, ${backgroundColor}80, ${backgroundColor}20)`,
      }}
    >
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "absolute inset-x-0 flex items-center justify-center",
            labelPosition === "top" && "top-2",
            labelPosition === "center" && "top-1/2 -translate-y-1/2",
            labelPosition === "bottom" && "bottom-2"
          )}
        >
          <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
            {Math.round(intensity)}%
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * ZoneOverlay - Colored overlay for zones/regions
 */
interface ZoneOverlayProps extends GradientOverlayProps {
  /** Zone status */
  status: "safe" | "caution" | "danger" | "restricted" | "maintenance";
  /** Overlay opacity 0-1 */
  opacity?: number;
  /** Zone label */
  label?: string;
  /** Show border */
  showBorder?: boolean;
  /** Show pattern */
  showPattern?: boolean;
  children?: ReactNode;
}

export function ZoneOverlay({
  status,
  opacity = 0.3,
  label,
  showBorder = true,
  showPattern = false,
  className,
  children,
}: ZoneOverlayProps) {
  const statusConfig = {
    safe: {
      color: "#22c55e",
      borderColor: "#16a34a",
      pattern: "dots",
    },
    caution: {
      color: "#eab308",
      borderColor: "#ca8a04",
      pattern: "diagonal",
    },
    danger: {
      color: "#ef4444",
      borderColor: "#dc2626",
      pattern: "cross",
    },
    restricted: {
      color: "#8b5cf6",
      borderColor: "#7c3aed",
      pattern: "diagonal",
    },
    maintenance: {
      color: "#f59e0b",
      borderColor: "#d97706",
      pattern: "diagonal",
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("relative", className)}
      style={{
        backgroundColor: `${config.color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
        border: showBorder ? `2px solid ${config.borderColor}` : "none",
      }}
    >
      {showPattern && (
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: getPattern(config.pattern, config.borderColor),
          }}
        />
      )}

      {label && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-2"
        >
          <div
            className="px-3 py-1 rounded-md text-white text-xs font-semibold shadow-lg"
            style={{ backgroundColor: config.borderColor }}
          >
            {label}
          </div>
        </motion.div>
      )}

      {children}
    </motion.div>
  );
}

/**
 * MetricGradient - Animated gradient for metric visualization
 */
interface MetricGradientProps extends GradientOverlayProps {
  /** Metric value 0-100 */
  value: number;
  /** Direction of gradient */
  direction?: "horizontal" | "vertical" | "radial";
  /** Color stops */
  colors?: string[];
  /** Animate on value change */
  animated?: boolean;
}

export function MetricGradient({
  value,
  direction = "horizontal",
  colors = ["#3b82f6", "#8b5cf6", "#ec4899"],
  animated = true,
  className,
}: MetricGradientProps) {
  const getGradient = () => {
    const colorStops = colors.join(", ");
    switch (direction) {
      case "horizontal":
        return `linear-gradient(to right, ${colorStops})`;
      case "vertical":
        return `linear-gradient(to bottom, ${colorStops})`;
      case "radial":
        return `radial-gradient(circle, ${colorStops})`;
      default:
        return `linear-gradient(to right, ${colorStops})`;
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: getGradient(),
        }}
        initial={animated ? { opacity: 0, scale: 0.8 } : false}
        animate={animated ? { opacity: value / 100, scale: 1 } : { opacity: value / 100 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

/**
 * PerformanceGradient - Gradient bar for performance metrics
 */
interface PerformanceGradientProps extends GradientOverlayProps {
  /** Current value */
  value: number;
  /** Maximum value */
  max: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color scheme */
  variant?: "success" | "warning" | "danger" | "info";
  /** Height */
  height?: number;
}

export function PerformanceGradient({
  value,
  max,
  showLabel = true,
  variant = "info",
  height = 8,
  className,
}: PerformanceGradientProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const variantColors = {
    success: ["#22c55e", "#16a34a"],
    warning: ["#eab308", "#ca8a04"],
    danger: ["#ef4444", "#dc2626"],
    info: ["#3b82f6", "#2563eb"],
  };

  const [startColor, endColor] = variantColors[variant];

  return (
    <div className={cn("relative w-full", className)}>
      {/* Background track */}
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {/* Progress bar */}
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            background: `linear-gradient(to right, ${startColor}, ${endColor})`,
          }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>
      </div>

      {/* Label */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 right-0 text-xs font-semibold text-gray-700"
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}

/**
 * AnimatedBackground - Animated gradient background
 */
interface AnimatedBackgroundProps extends GradientOverlayProps {
  /** Color palette */
  colors?: string[];
  /** Animation speed (seconds) */
  speed?: number;
  /** Blur amount */
  blur?: number;
  children?: ReactNode;
}

export function AnimatedBackground({
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"],
  speed = 10,
  blur = 100,
  className,
  children,
}: AnimatedBackgroundProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Gradient blobs */}
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${40 + i * 10}%`,
            height: `${40 + i * 10}%`,
            backgroundColor: color,
            filter: `blur(${blur}px)`,
          }}
          animate={{
            x: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            y: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
            ],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * Helper functions
 */

// Interpolate between two hex colors
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex = (x: number) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// Generate pattern SVG
function getPattern(type: string, color: string): string {
  const encodedColor = encodeURIComponent(color);
  switch (type) {
    case "dots":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='${encodedColor}'/%3E%3C/svg%3E")`;
    case "diagonal":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20L20 0' stroke='${encodedColor}' stroke-width='2'/%3E%3C/svg%3E")`;
    case "cross":
      return `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10L20 10M10 0L10 20' stroke='${encodedColor}' stroke-width='2'/%3E%3C/svg%3E")`;
    default:
      return "none";
  }
}
