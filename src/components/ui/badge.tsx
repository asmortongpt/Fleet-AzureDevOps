import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm [a&]:hover:bg-destructive/90",
        success:
          "border-transparent bg-success text-white shadow-sm [a&]:hover:bg-success/90",
        warning:
          "border-transparent bg-warning text-white shadow-sm [a&]:hover:bg-warning/90",
        info:
          "border-transparent bg-[#dbeafe] text-[#1e3a8a] shadow-sm [a&]:hover:bg-[#bfdbfe]",
        outline:
          "text-foreground border-border/50 bg-transparent [a&]:hover:bg-muted/50",
        ghost:
          "border-transparent text-muted-foreground bg-muted/50 [a&]:hover:bg-muted",
        // Subtle variants with lighter backgrounds
        "primary-subtle":
          "border-transparent bg-primary/10 text-primary [a&]:hover:bg-primary/20",
        "destructive-subtle":
          "border-transparent bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20",
        "success-subtle":
          "border-transparent bg-success/10 text-success [a&]:hover:bg-success/20",
        "warning-subtle":
          "border-transparent bg-warning/10 text-warning [a&]:hover:bg-warning/20",
        // Status variants for real-time indicators
        online:
          "border-transparent bg-success/20 text-success animate-pulse",
        offline:
          "border-transparent bg-muted text-muted-foreground",
        pending:
          "border-transparent bg-warning/20 text-warning",
        error:
          "border-transparent bg-destructive/20 text-destructive",
      },
      size: {
        default: "h-6 text-xs",
        sm: "h-5 text-[10px] px-2",
        lg: "h-7 text-sm px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

// Dot badge for notification counts
interface DotBadgeProps extends ComponentProps<"span"> {
  count?: number
  max?: number
  variant?: "primary" | "destructive" | "success" | "warning"
}

function DotBadge({
  count,
  max = 99,
  variant = "destructive",
  className,
  ...props
}: DotBadgeProps) {
  const displayCount = count && count > max ? `${max}+` : count

  const variants = {
    primary: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-success text-white",
    warning: "bg-warning text-white",
  }

  if (!count || count === 0) return null

  return (
    <span
      data-slot="dot-badge"
      className={cn(
        "inline-flex items-center justify-center min-w-3 h-3 px-1.5 rounded-full text-[10px] font-bold",
        "shadow-sm animate-scale-in",
        variants[variant],
        className
      )}
      {...props}
    >
      {displayCount}
    </span>
  )
}

// Status badge with dot indicator
interface StatusBadgeProps extends ComponentProps<"span"> {
  status: "online" | "offline" | "busy" | "away"
  label?: string
}

function StatusBadge({
  status,
  label,
  className,
  ...props
}: StatusBadgeProps) {
  const statusConfig = {
    online: { color: "bg-success", label: label || "Online" },
    offline: { color: "bg-muted-foreground", label: label || "Offline" },
    busy: { color: "bg-destructive", label: label || "Busy" },
    away: { color: "bg-warning", label: label || "Away" },
  }

  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
        "bg-muted/50 text-foreground",
        className
      )}
      {...props}
    >
      <span className={cn("w-2 h-2 rounded-full", config.color, status === "online" && "animate-pulse")} />
      {config.label}
    </span>
  )
}

export { Badge, badgeVariants, DotBadge, StatusBadge }
