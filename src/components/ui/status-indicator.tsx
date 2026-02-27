import { cn } from '@/lib/utils'

type FleetStatus = 'active' | 'idle' | 'maintenance' | 'offline' | 'alert'

interface StatusIndicatorProps {
  status: FleetStatus
  size?: 'sm' | 'md' | 'lg'
  pulse?: boolean
  label?: string
  className?: string
}

const statusConfig: Record<FleetStatus, { color: string; bg: string; label: string }> = {
  active: {
    color: 'bg-emerald-400',
    bg: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    label: 'Active',
  },
  idle: {
    color: 'bg-amber-400',
    bg: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    label: 'Idle',
  },
  maintenance: {
    color: 'bg-blue-400',
    bg: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    label: 'Maintenance',
  },
  offline: {
    color: 'bg-white/30',
    bg: 'bg-white/5 text-white/40 border-white/10',
    label: 'Offline',
  },
  alert: {
    color: 'bg-red-400',
    bg: 'bg-red-400/10 text-red-400 border-red-400/20',
    label: 'Alert',
  },
}

const sizes = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
}

export function StatusIndicator({
  status,
  size = 'md',
  pulse,
  label,
  className,
}: StatusIndicatorProps) {
  const config = statusConfig[status]
  const shouldPulse = pulse ?? (status === 'active' || status === 'alert')

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex">
        <span className={cn(sizes[size], 'rounded-full', config.color)} />
        {shouldPulse && (
          <span
            className={cn(
              sizes[size],
              'absolute rounded-full animate-ping opacity-75',
              config.color
            )}
          />
        )}
      </span>
      {label !== undefined ? (
        <span className="text-[var(--text-sm)] font-medium">{label}</span>
      ) : null}
    </span>
  )
}

interface StatusBadgeProps {
  status: FleetStatus
  label?: string
  className?: string
}

export function FleetStatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.bg,
        className
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.color)} />
      {label || config.label}
    </span>
  )
}
