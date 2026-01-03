/**
 * Professional Statistics Card Component
 *
 * Features:
 * - Clean corporate design
 * - Subtle shadows and borders
 * - Trend indicators (up/down)
 * - Professional color variants
 * - Accessible and keyboard-navigable
 */

import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    icon?: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    className?: string
    /** Click handler for drilldown */
    onClick?: () => void
    /** Label for the drilldown action */
    drilldownLabel?: string
}

// Professional Corporate UI - Clean design with subtle accents
const variantStyles = {
    default: {
        bg: 'bg-card',
        border: 'border-border',
        accent: 'from-slate-600 to-slate-700',
        iconBg: 'bg-secondary/50',
        iconColor: 'text-muted-foreground',
        valueColor: 'text-foreground'
    },
    primary: {
        bg: 'bg-card',
        border: 'border-primary/20',
        accent: 'from-blue-600 to-blue-700',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        valueColor: 'text-foreground'
    },
    success: {
        bg: 'bg-card',
        border: 'border-success/20',
        accent: 'from-emerald-600 to-emerald-700',
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        valueColor: 'text-foreground'
    },
    warning: {
        bg: 'bg-card',
        border: 'border-warning/20',
        accent: 'from-amber-600 to-amber-700',
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        valueColor: 'text-foreground'
    },
    danger: {
        bg: 'bg-card',
        border: 'border-destructive/20',
        accent: 'from-red-600 to-red-700',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        valueColor: 'text-foreground'
    }
}

export function StatCard({
    title,
    value,
    subtitle,
    trend,
    trendValue,
    icon,
    variant = 'default',
    className,
    onClick,
    drilldownLabel = 'View Details'
}: StatCardProps) {
    const isClickable = !!onClick
    const styles = variantStyles[variant]

    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
    const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'

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
                // Base - professional padding and rounded corners
                'relative overflow-hidden rounded-lg border p-4',
                // Professional shadow
                'shadow-sm',
                // Subtle hover effects
                'transition-all duration-200 hover:shadow-md',
                // Clickable styling - subtle interaction
                isClickable && 'cursor-pointer hover:border-primary/30 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-primary/20',
                // Variant styles
                styles.bg,
                styles.border,
                className
            )}
        >
            {/* Subtle accent line at top - professional touch */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-60',
                styles.accent
            )} />

            <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
                    <p className={cn(
                        'text-2xl font-bold tracking-tight',
                        styles.valueColor
                    )}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                            <TrendIcon className="w-3.5 h-3.5" weight="bold" />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {icon && (
                    <div className={cn(
                        'p-2.5 rounded-lg shrink-0',
                        styles.iconBg,
                        styles.iconColor
                    )}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Drilldown indicator - subtle chevron */}
            {isClickable && (
                <div className="absolute bottom-2 right-2 opacity-40 group-hover:opacity-80 transition-opacity">
                    <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            )}
        </div>
    )
}

/**
 * Progress Ring Component
 */
interface ProgressRingProps {
    progress: number
    size?: number
    strokeWidth?: number
    color?: 'blue' | 'green' | 'yellow' | 'red'
    label?: string
    sublabel?: string
}

const ringColors = {
    blue: 'stroke-primary',
    green: 'stroke-success',
    yellow: 'stroke-warning',
    red: 'stroke-destructive'
}

export function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 6,
    color = 'blue',
    label,
    sublabel
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn('transition-all duration-700 ease-out', ringColors[color])}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{progress}%</span>
                {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
                {sublabel && <span className="text-[8px] text-muted-foreground/80">{sublabel}</span>}
            </div>
        </div>
    )
}

/**
 * Status Dot with pulse animation
 */
interface StatusDotProps {
    status: 'online' | 'offline' | 'warning' | 'error'
    label?: string
}

const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    warning: 'bg-warning',
    error: 'bg-destructive'
}

export function StatusDot({ status, label }: StatusDotProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
                {status === 'online' && (
                    <span className={cn(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
                        statusColors[status]
                    )} />
                )}
                <span className={cn(
                    'relative inline-flex rounded-full h-2.5 w-2.5',
                    statusColors[status]
                )} />
            </span>
            {label && <span className="text-sm text-muted-foreground font-medium">{label}</span>}
        </div>
    )
}

/**
 * Quick Stat Row for compact displays
 */
interface QuickStatProps {
    label: string
    value: string | number
    trend?: 'up' | 'down'
    /** Click handler for drilldown */
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
                'flex items-center justify-between py-2 border-b border-border last:border-0',
                isClickable && 'cursor-pointer hover:bg-muted/30 rounded px-2 -mx-2 transition-colors'
            )}
        >
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">{value}</span>
                {trend && (
                    <span className={trend === 'up' ? 'text-success' : 'text-destructive'}>
                        {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    </span>
                )}
                {isClickable && <span className="text-muted-foreground text-xs">→</span>}
            </div>
        </div>
    )
}
