import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white/90 text-[#1a1a1a] shadow-sm font-bold",
        secondary:
          "border-transparent bg-white/10 text-white/90 shadow-sm font-bold",
        destructive:
          "border-transparent bg-rose-600 text-white shadow-sm font-bold",
        success:
          "border-transparent bg-emerald-600 text-white shadow-sm font-bold",
        warning:
          "border-transparent bg-amber-500 text-white shadow-sm font-bold",
        info:
          "border-transparent bg-sky-600 text-white shadow-sm font-bold",
        outline:
          "text-white/80 border-white/20 bg-transparent hover:bg-white/5 backdrop-blur-sm",
        ghost:
          "border-transparent text-muted-foreground bg-muted/50 hover:bg-muted",
        // Subtle variants with lighter backgrounds
        "primary-subtle":
          "border-transparent bg-white/10 text-white/80 hover:bg-white/15 font-bold ring-1 ring-white/10",
        "destructive-subtle":
          "border-transparent bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 font-bold ring-1 ring-rose-500/20",
        "success-subtle":
          "border-transparent bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 font-bold ring-1 ring-emerald-500/20",
        "warning-subtle":
          "border-transparent bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 font-bold ring-1 ring-amber-500/20",
        // Status variants for real-time indicators
        online:
          "border-transparent bg-emerald-600 text-white shadow-sm animate-pulse font-bold",
        offline:
          "border-transparent bg-muted text-muted-foreground font-bold",
        pending:
          "border-transparent bg-amber-500 text-white shadow-sm font-bold",
        error:
          "border-transparent bg-rose-600 text-white shadow-sm font-bold",
      },
      size: {
        default: "h-7 text-xs px-3",
        sm: "h-6 text-[10px] px-2.5 py-0.5",
        lg: "h-8 text-sm px-4 py-1",
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
