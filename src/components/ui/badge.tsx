import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium font-['Montserrat',sans-serif] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[#1F3076] text-white border-transparent",
        secondary:
          "bg-[#1F3076]/60 text-white/90 border-transparent",
        destructive:
          "bg-[#FF4300]/20 text-[#FF4300] border border-[#FF4300]/30",
        success:
          "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30",
        warning:
          "bg-[#FDC016]/20 text-[#FDC016] border border-[#FDC016]/30",
        info:
          "bg-[#00CCFE]/20 text-[#00CCFE] border border-[#00CCFE]/30",
        outline:
          "border-[rgba(0,204,254,0.15)] text-[rgba(255,255,255,0.65)] bg-transparent hover:bg-white/5 backdrop-blur-sm",
        ghost:
          "border-transparent text-[rgba(255,255,255,0.5)] bg-[#221060]/50 hover:bg-[#221060]",
        // Subtle variants with lighter backgrounds
        "primary-subtle":
          "border-transparent bg-[#1F3076]/30 text-white/80 hover:bg-[#1F3076]/50 font-bold ring-1 ring-[#1F3076]/40",
        "destructive-subtle":
          "bg-[#FF4300]/15 text-[#FF4300] hover:bg-[#FF4300]/25 font-bold ring-1 ring-[#FF4300]/20 border-transparent",
        "success-subtle":
          "bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25 font-bold ring-1 ring-[#10B981]/20 border-transparent",
        "warning-subtle":
          "bg-[#FDC016]/15 text-[#FDC016] hover:bg-[#FDC016]/25 font-bold ring-1 ring-[#FDC016]/20 border-transparent",
        // Status variants for real-time indicators
        online:
          "border-transparent bg-[#10B981] text-white shadow-sm animate-pulse font-bold",
        offline:
          "border-transparent bg-[#221060] text-[rgba(255,255,255,0.5)] font-bold",
        pending:
          "border-transparent bg-[#FDC016] text-white shadow-sm font-bold",
        error:
          "border-transparent bg-[#FF4300] text-white shadow-sm font-bold",
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
    primary: "bg-[#1F3076] text-white",
    destructive: "bg-[#FF4300] text-white",
    success: "bg-[#10B981] text-white",
    warning: "bg-[#FDC016] text-white",
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
    online: { color: "bg-[#10B981]", label: label || "Online" },
    offline: { color: "bg-[rgba(255,255,255,0.3)]", label: label || "Offline" },
    busy: { color: "bg-[#FF4300]", label: label || "Busy" },
    away: { color: "bg-[#FDC016]", label: label || "Away" },
  }

  const config = statusConfig[status]

  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
        "bg-[#221060]/50 text-white",
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
