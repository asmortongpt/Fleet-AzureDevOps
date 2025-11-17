import { Badge } from "@/components/ui/badge"
import { Warning, CheckCircle, Clock, X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export type VehicleStatus =
  | "active"
  | "maintenance"
  | "out-of-service"
  | "emergency"
  | "idle"
  | "in-transit"
  | "parked"

interface StatusBadgeProps {
  status: VehicleStatus | string
  className?: string
  showIcon?: boolean
}

const statusConfig: Record<string, {
  color: string
  icon?: React.ReactNode
  label: string
}> = {
  active: {
    color: "bg-success/10 text-success border-success/20",
    icon: <CheckCircle className="w-3 h-3" weight="fill" aria-hidden="true" />,
    label: "Active"
  },
  "in-transit": {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <CheckCircle className="w-3 h-3" weight="fill" aria-hidden="true" />,
    label: "In Transit"
  },
  parked: {
    color: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
    label: "Parked"
  },
  idle: {
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: <Clock className="w-3 h-3" aria-hidden="true" />,
    label: "Idle"
  },
  maintenance: {
    color: "bg-warning/10 text-warning border-warning/20",
    icon: <Warning className="w-3 h-3" weight="fill" aria-hidden="true" />,
    label: "Maintenance"
  },
  "out-of-service": {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <X className="w-3 h-3" weight="bold" aria-hidden="true" />,
    label: "Out of Service"
  },
  emergency: {
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: <Warning className="w-3 h-3" weight="fill" aria-hidden="true" />,
    label: "Emergency"
  }
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    color: "bg-muted text-muted-foreground border-muted",
    label: status
  }

  return (
    <Badge
      className={cn(
        "flex items-center gap-1 border",
        config.color,
        className
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </Badge>
  )
}
