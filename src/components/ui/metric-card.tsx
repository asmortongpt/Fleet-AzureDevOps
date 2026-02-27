import { ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  delta?: { value: number; direction: 'up' | 'down' }
  icon?: ReactNode
  status?: 'success' | 'warning' | 'danger' | 'neutral'
  className?: string
  onClick?: () => void
}

const statusColors = {
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  neutral: 'text-white/40',
}

const deltaColors = {
  up: 'text-emerald-400',
  down: 'text-red-400',
}

function AnimatedValue({ value }: { value: string | number }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (typeof value === 'number' && typeof prevRef.current === 'number') {
      const start = prevRef.current
      const end = value
      const duration = 400
      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = start + (end - start) * eased

        setDisplay(
          Number.isInteger(end) ? Math.round(current) : parseFloat(current.toFixed(1))
        )

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    } else {
      setDisplay(value)
    }
    prevRef.current = value
  }, [value])

  return <>{typeof display === 'number' ? display.toLocaleString() : display}</>
}

export function MetricCard({
  label,
  value,
  delta,
  icon,
  status = 'neutral',
  className,
  onClick,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4',
        'transition-all duration-[var(--duration-fast)]',
        'hover:border-[var(--border-default)] hover:bg-[var(--surface-3)]',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-[var(--text-sm)] text-[var(--text-secondary)] font-medium">
          {label}
        </span>
        {icon && (
          <span className={cn('size-4', statusColors[status])}>
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums tracking-tight">
          <AnimatedValue value={value} />
        </span>

        {delta && (
          <span className={cn('text-[var(--text-xs)] font-medium flex items-center gap-0.5', deltaColors[delta.direction])}>
            {delta.direction === 'up' ? '▲' : '▼'}
            {Math.abs(delta.value)}%
          </span>
        )}
      </div>
    </div>
  )
}

interface MetricCardRowProps {
  children: ReactNode
  className?: string
}

export function MetricCardRow({ children, className }: MetricCardRowProps) {
  return (
    <div className={cn(
      'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6',
      className
    )}>
      {children}
    </div>
  )
}
