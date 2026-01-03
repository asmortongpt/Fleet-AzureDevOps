import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * ProgressIndicator - Loading progress indicators for async operations
 *
 * Features:
 * - Determinate and indeterminate progress
 * - Circular and linear variants
 * - Step-based progress for multi-step operations
 * - Success/error states with animations
 * - File upload progress
 * - Auto-hiding on completion
 */

interface BaseProgressProps {
  className?: string;
}

/**
 * LinearProgress - Linear progress bar
 */
interface LinearProgressProps extends BaseProgressProps {
  /** Progress value 0-100 */
  value?: number;
  /** Indeterminate mode (no specific progress) */
  indeterminate?: boolean;
  /** Show percentage label */
  showLabel?: boolean;
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "danger";
  /** Height in pixels */
  height?: number;
  /** Buffer value for buffered progress (like video loading) */
  buffer?: number;
}

export function LinearProgress({
  value = 0,
  indeterminate = false,
  showLabel = false,
  variant = "primary",
  height = 4,
  buffer,
  className,
}: LinearProgressProps) {
  const variantColors = {
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  const percentage = Math.min(Math.max(value, 0), 100);
  const bufferPercentage = buffer ? Math.min(Math.max(buffer, 0), 100) : undefined;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Background track */}
      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden relative"
        style={{ height: `${height}px` }}
      >
        {/* Buffer (if provided) */}
        {bufferPercentage !== undefined && (
          <motion.div
            className="absolute top-0 left-0 h-full bg-gray-300 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${bufferPercentage}%` }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Progress bar */}
        {indeterminate ? (
          <motion.div
            className={cn("absolute top-0 h-full rounded-full", variantColors[variant])}
            style={{ width: "30%" }}
            animate={{
              left: ["-30%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <motion.div
            className={cn("h-full rounded-full relative overflow-hidden", variantColors[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Label */}
      {showLabel && !indeterminate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-5 right-0 text-xs font-semibold text-gray-700"
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}

/**
 * CircularProgress - Circular progress indicator
 */
interface CircularProgressProps extends BaseProgressProps {
  /** Progress value 0-100 */
  value?: number;
  /** Indeterminate mode */
  indeterminate?: boolean;
  /** Show percentage in center */
  showLabel?: boolean;
  /** Size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color variant */
  variant?: "primary" | "success" | "warning" | "danger";
}

export function CircularProgress({
  value = 0,
  indeterminate = false,
  showLabel = true,
  size = 48,
  strokeWidth = 4,
  variant = "primary",
  className,
}: CircularProgressProps) {
  const variantColors = {
    primary: "#3b82f6",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
  };

  const color = variantColors[variant];
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Progress circle */}
        {indeterminate ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset: [circumference, 0],
              rotate: [0, 360],
            }}
            transition={{
              strokeDashoffset: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            }}
            style={{ transformOrigin: "50% 50%" }}
          />
        ) : (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}
      </svg>

      {/* Center label */}
      {showLabel && !indeterminate && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
          style={{ color }}
        >
          {Math.round(percentage)}%
        </motion.div>
      )}
    </div>
  );
}

/**
 * StepProgress - Multi-step progress indicator
 */
interface Step {
  id: string;
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

interface StepProgressProps extends BaseProgressProps {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  onStepClick?: (stepId: string) => void;
}

export function StepProgress({
  steps,
  orientation = "horizontal",
  onStepClick,
  className,
}: StepProgressProps) {
  const isHorizontal = orientation === "horizontal";

  const statusConfig = {
    pending: { bg: "bg-gray-200", text: "text-gray-400", border: "border-gray-300" },
    active: { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" },
    completed: { bg: "bg-green-500", text: "text-white", border: "border-green-500" },
    error: { bg: "bg-red-500", text: "text-white", border: "border-red-500" },
  };

  return (
    <div
      className={cn(
        "flex",
        isHorizontal ? "flex-row items-center" : "flex-col",
        className
      )}
    >
      {steps.map((step, index) => {
        const config = statusConfig[step.status];
        const isLast = index === steps.length - 1;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center",
              isHorizontal ? "flex-row" : "flex-col",
              !isLast && (isHorizontal ? "flex-1" : "mb-4")
            )}
          >
            {/* Step circle */}
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={onStepClick ? { scale: 1.1 } : {}}
              whileTap={onStepClick ? { scale: 0.95 } : {}}
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-colors",
                config.bg,
                config.text,
                config.border,
                onStepClick && "cursor-pointer",
                !isHorizontal && "mb-2"
              )}
            >
              {step.status === "completed" ? (
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <motion.path
                    d="M6 10L9 13L14 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              ) : step.status === "error" ? (
                "✕"
              ) : (
                index + 1
              )}

              {/* Active pulse */}
              {step.status === "active" && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.button>

            {/* Step label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "text-sm font-medium",
                isHorizontal ? "ml-2" : "text-center",
                step.status === "active" ? "text-blue-600" : "text-gray-600"
              )}
            >
              {step.label}
            </motion.div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "bg-gray-300 relative overflow-hidden",
                  isHorizontal ? "flex-1 h-0.5 mx-4" : "w-0.5 h-8 mx-auto"
                )}
              >
                {step.status === "completed" && (
                  <motion.div
                    className="absolute inset-0 bg-green-500"
                    initial={isHorizontal ? { width: 0 } : { height: 0 }}
                    animate={isHorizontal ? { width: "100%" } : { height: "100%" }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * UploadProgress - File upload progress indicator
 */
interface UploadProgressProps extends BaseProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status?: "uploading" | "success" | "error";
  speed?: number; // bytes per second
  onCancel?: () => void;
}

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status = "uploading",
  speed,
  onCancel,
  className,
}: UploadProgressProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const percentage = Math.min(Math.max(progress, 0), 100);
  const uploadedBytes = (fileSize * percentage) / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn("border rounded-lg p-4 bg-white shadow-sm", className)}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            status === "success" && "bg-green-100 text-green-600",
            status === "error" && "bg-red-100 text-red-600",
            status === "uploading" && "bg-blue-100 text-blue-600"
          )}
        >
          {status === "success" ? "✓" : status === "error" ? "✕" : "📄"}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatBytes(uploadedBytes)} / {formatBytes(fileSize)}
                {speed && status === "uploading" && ` • ${formatSpeed(speed)}`}
              </p>
            </div>

            {/* Cancel button */}
            {onCancel && status === "uploading" && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            )}
          </div>

          {/* Progress bar */}
          <LinearProgress
            value={percentage}
            variant={status === "error" ? "danger" : status === "success" ? "success" : "primary"}
            height={6}
          />

          {/* Status message */}
          {status === "success" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-green-600 font-medium mt-2"
            >
              Upload complete
            </motion.p>
          )}
          {status === "error" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-red-600 font-medium mt-2"
            >
              Upload failed
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * LoadingSpinner - Simple animated spinner
 */
interface LoadingSpinnerProps extends BaseProgressProps {
  size?: number;
  color?: string;
  label?: string;
}

export function LoadingSpinner({
  size = 24,
  color = "#3b82f6",
  label,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60"
            strokeDashoffset="15"
            opacity="0.25"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="15 45"
          />
        </svg>
      </motion.div>
      {label && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}

/**
 * PulsingDots - Three pulsing dots loader
 */
export function PulsingDots({ className }: BaseProgressProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
