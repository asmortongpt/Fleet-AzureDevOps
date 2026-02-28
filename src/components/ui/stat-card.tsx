/**
 * StatCard — Tesla/Rivian minimal KPI card
 *
 * Large hero numbers, clean typography hierarchy,
 * no visual noise. Color only for status.
 */

import { ArrowUp, ArrowDown, Minus, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    description?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    change?: number
    icon?: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'default' | 'lg'
    className?: string
    onClick?: () => void
    drilldownLabel?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    description,
    trend,
    trendValue,
    change,
    icon,
    variant = 'default',
    size = 'default',
    className,
    onClick,
    drilldownLabel = 'View Details'
}: StatCardProps) {
    const isClickable = !!onClick
    const displaySubtitle = description || subtitle
    const displayTrendValue = trendValue || (change !== undefined ? `${change > 0 ? '+' : ''}${change}%` : undefined)

    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
    const trendColor = trend === 'up' ? 'text-[var(--accent-primary)]' : trend === 'down' ? 'text-rose-400' : 'text-[var(--text-tertiary)]'

    const sizeMap = {
        sm: { padding: 'p-3', title: 'text-[10px]', value: 'text-lg', sub: 'text-[10px]' },
        default: { padding: 'p-4', title: 'text-[11px]', value: 'text-xl', sub: 'text-[11px]' },
        lg: { padding: 'p-5', title: 'text-[12px]', value: 'text-2xl', sub: 'text-[12px]' },
    }
    const s = sizeMap[size]

    return (
        <div
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick?.()
                }
            }}
            aria-label={isClickable ? `${title}: ${value}. ${drilldownLabel}` : undefined}
            className={cn(
                'group rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]',
                s.padding,
                isClickable && 'cursor-pointer hover:bg-[var(--surface-2)] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20',
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className={cn(
                        'font-medium text-[var(--text-tertiary)] uppercase tracking-wider truncate',
                        s.title
                    )}>
                        {title}
                    </p>
                    <p className={cn(
                        'font-semibold text-white tracking-tight tabular-nums',
                        s.value
                    )}>
                        {value}
                    </p>
                    {(displaySubtitle || trend) && (
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {displaySubtitle && (
                                <p className={cn('text-[var(--text-tertiary)] truncate', s.sub)}>{displaySubtitle}</p>
                            )}
                            {trend && displayTrendValue && (
                                <div className={cn('flex items-center gap-0.5 font-medium', trendColor, s.sub)}>
                                    <TrendIcon className="w-3 h-3" />
                                    <span>{displayTrendValue}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {icon && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[var(--surface-glass)] text-[var(--text-tertiary)] shrink-0">
                        {icon}
                    </div>
                )}
            </div>

            {isClickable && (
                <div className="mt-2 flex items-center gap-1 text-[var(--text-quaternary)] group-hover:text-[var(--text-tertiary)] transition-colors duration-150">
                    <span className="text-[10px] font-medium">{drilldownLabel}</span>
                    <ChevronRight className="w-3 h-3" />
                </div>
            )}
        </div>
    )
}

/**
 * Progress Ring — minimal circular progress
 */
interface ProgressRingProps {
    progress: number
    size?: number
    strokeWidth?: number
    color?: 'teal' | 'green' | 'yellow' | 'red'
    label?: string
    sublabel?: string
    animate?: boolean
}

const ringColors = {
    teal: 'stroke-white/60',
    green: 'stroke-emerald-400',
    yellow: 'stroke-amber-400',
    red: 'stroke-rose-400'
}

export function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 4,
    color = 'teal',
    label,
    sublabel,
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="currentColor" strokeWidth={strokeWidth}
                    className="text-[var(--surface-glass-hover)]"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn('transition-all duration-700 ease-out', ringColors[color])}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-white tabular-nums">{progress}%</span>
                {label && <span className="text-[10px] text-[var(--text-tertiary)] font-medium">{label}</span>}
                {sublabel && <span className="text-[10px] text-[var(--text-quaternary)]">{sublabel}</span>}
            </div>
        </div>
    )
}

/**
 * Status Dot — minimal indicator
 */
interface StatusDotProps {
    status: 'online' | 'offline' | 'warning' | 'error'
    label?: string
    size?: 'sm' | 'default' | 'lg'
}

const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-white/20',
    warning: 'bg-amber-400',
    error: 'bg-rose-400'
}

const dotSizes = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2 w-2',
    lg: 'h-2.5 w-2.5'
}

export function StatusDot({ status, label, size = 'default' }: StatusDotProps) {
    return (
        <div className="flex items-center gap-2">
            <span className={cn('rounded-full', dotSizes[size], statusColors[status])} />
            {label && <span className="text-[12px] text-[var(--text-secondary)] font-medium">{label}</span>}
        </div>
    )
}

/**
 * QuickStat — minimal row stat
 */
interface QuickStatProps {
    label: string
    value: string | number
    trend?: 'up' | 'down'
    onClick?: () => void
}

export function QuickStat({ label, value, trend, onClick }: QuickStatProps) {
    const isClickable = !!onClick
    return (
        <div
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onClick?.()
                }
            }}
            className={cn(
                'flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0',
                isClickable && 'cursor-pointer rounded-lg px-2 -mx-2 hover:bg-white/[0.02] transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/20'
            )}
        >
            <span className="text-[12px] text-[var(--text-tertiary)]">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-white tabular-nums">{value}</span>
                {trend && (
                    <span className={trend === 'up' ? 'text-[var(--accent-primary)]' : 'text-rose-400'}>
                        {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    </span>
                )}
                {isClickable && <ChevronRight className="w-3 h-3 text-[var(--text-quaternary)]" />}
            </div>
        </div>
    )
}

/**
 * StatGrid — container for stat cards
 */
interface StatGridProps {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}

export function StatGrid({ children, className }: StatGridProps) {
    return <div className={className}>{children}</div>
}

/**
 * MetricBadge — inline stat badge
 */
interface MetricBadgeProps {
    value: string | number
    label?: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
    className?: string
}

const badgeVariants = {
    default: 'bg-[var(--surface-glass)] text-[var(--text-secondary)]',
    success: 'bg-[var(--accent-muted)] text-[var(--accent-primary)]',
    warning: 'bg-amber-500/10 text-amber-400',
    danger: 'bg-rose-500/10 text-rose-400'
}

export function MetricBadge({ value, label, variant = 'default', className }: MetricBadgeProps) {
    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium',
            badgeVariants[variant],
            className
        )}>
            <span className="font-semibold tabular-nums">{value}</span>
            {label && <span className="opacity-70">{label}</span>}
        </div>
    )
}
