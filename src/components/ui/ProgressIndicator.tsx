// motion removed - React 19 incompatible

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
          <div
            className="absolute top-0 left-0 h-full bg-gray-300 rounded-full transition-all duration-300"
            style={{ width: `${bufferPercentage}%` }}
          />
        )}

        {/* Progress bar */}
        {indeterminate ? (
          <div
            className={cn("absolute top-0 h-full rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]", variantColors[variant])}
            style={{ width: "30%" }}
          />
        ) : (
          <div
            className={cn("h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out", variantColors[variant])}
            style={{ width: `${percentage}%` }}
          >
            {/* Shine effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            />
          </div>
        )}
      </div>

      {/* Label */}
      {showLabel && !indeterminate && (
        <div
          className="absolute -top-5 right-0 text-xs font-semibold text-gray-700"
        >
          {Math.round(percentage)}%
        </div>
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            className="animate-spin origin-center"
            style={{ transformOrigin: "50% 50%" }}
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        )}
      </svg>

      {/* Center label */}
      {showLabel && !indeterminate && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
          style={{ color }}
        >
          {Math.round(percentage)}%
        </div>
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
    pending: { bg: "bg-gray-200", text: "text-gray-700", border: "border-gray-300" },
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
              !isLast && (isHorizontal ? "flex-1" : "mb-2")
            )}
          >
            {/* Step circle */}
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              className={cn(
                "relative flex items-center justify-center w-10 h-8 rounded-full border-2 font-semibold text-sm transition-colors",
                config.bg,
                config.text,
                config.border,
                onStepClick && "cursor-pointer",
                !isHorizontal && "mb-2"
              )}
            >
              {step.status === "completed" ? (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 10L9 13L14 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : step.status === "error" ? (
                "✕"
              ) : (
                index + 1
              )}

              {/* Active pulse */}
              {step.status === "active" && (
                <div
                  className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50"
                />
              )}
            </button>

            {/* Step label */}
            <div
              className={cn(
                "text-sm font-medium",
                isHorizontal ? "ml-2" : "text-center",
                step.status === "active" ? "text-blue-800" : "text-slate-700"
              )}
            >
              {step.label}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  "bg-gray-300 relative overflow-hidden",
                  isHorizontal ? "flex-1 h-0.5 mx-2" : "w-0.5 h-8 mx-auto"
                )}
              >
                {step.status === "completed" && (
                  <div
                    className="absolute inset-0 bg-green-500"
                    style={{ width: isHorizontal ? "100%" : undefined, height: !isHorizontal ? "100%" : undefined }}
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
    <div
      className={cn("border rounded-lg p-2 bg-white shadow-sm", className)}
    >
      <div className="flex items-start gap-3">
        {/* File icon */}
        <div
          className={cn(
            "w-10 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
            status === "success" && "bg-green-100 text-green-600",
            status === "error" && "bg-red-100 text-red-600",
            status === "uploading" && "bg-blue-100 text-blue-800"
          )}
        >
          {status === "success" ? "✓" : status === "error" ? "✕" : "📄"}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-xs text-gray-700 mt-0.5">
                {formatBytes(uploadedBytes)} / {formatBytes(fileSize)}
                {speed && status === "uploading" && ` • ${formatSpeed(speed)}`}
              </p>
            </div>

            {/* Cancel button */}
            {onCancel && status === "uploading" && (
              <button
                onClick={onCancel}
                className="text-gray-700 hover:text-slate-700 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
            <p
              className="text-xs text-green-600 font-medium mt-2"
            >
              Upload complete
            </p>
          )}
          {status === "error" && (
            <p
              className="text-xs text-red-600 font-medium mt-2"
            >
              Upload failed
            </p>
          )}
        </div>
      </div>
    </div>
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
      <div
        className="animate-spin"
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
      </div>
      {label && (
        <p
          className="text-sm text-slate-700"
        >
          {label}
        </p>
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
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
