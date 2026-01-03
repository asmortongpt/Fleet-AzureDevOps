/**
 * Premium Statistics Card Component
 * 
 * Features:
 * - Glassmorphism effect
 * - Gradient accents
 * - Trend indicators (up/down)
 * - Animated counters
 * - Hover effects
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

// Liquid Glass UI - Solid colors with frosted glass effect
const variantStyles = {
    default: {
        bg: 'bg-slate-900/95',
        border: 'border-slate-700/60',
        accent: 'from-slate-300 to-slate-400',
        iconBg: 'bg-slate-800/80',
        iconColor: 'text-slate-300'
    },
    primary: {
        bg: 'bg-blue-950/95',
        border: 'border-blue-400/40',
        accent: 'from-blue-300 to-blue-400',
        iconBg: 'bg-blue-900/80',
        iconColor: 'text-blue-300'
    },
    success: {
        bg: 'bg-emerald-950/95',
        border: 'border-emerald-400/40',
        accent: 'from-emerald-300 to-emerald-400',
        iconBg: 'bg-emerald-900/80',
        iconColor: 'text-emerald-300'
    },
    warning: {
        bg: 'bg-amber-950/95',
        border: 'border-amber-400/40',
        accent: 'from-amber-300 to-amber-400',
        iconBg: 'bg-amber-900/80',
        iconColor: 'text-amber-300'
    },
    danger: {
        bg: 'bg-red-950/95',
        border: 'border-red-400/40',
        accent: 'from-red-300 to-red-400',
        iconBg: 'bg-red-900/80',
        iconColor: 'text-red-300'
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
    const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'

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
                // Base - compact padding
                'relative overflow-hidden rounded-lg border p-3',
                // Glassmorphism
                'backdrop-blur-xl shadow-lg',
                // Hover effects
                'transition-all duration-200 hover:shadow-xl',
                // Clickable styling
                isClickable && 'cursor-pointer hover:scale-[1.02] hover:border-opacity-80 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/50',
                // Variant styles
                styles.bg,
                styles.border,
                className
            )}
        >
            {/* Gradient accent line at top */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r',
                styles.accent
            )} />

            {/* Glow effect */}
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl" />

            <div className="relative flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">{title}</p>
                    <p className={cn(
                        'text-xl font-bold tracking-tight bg-gradient-to-r bg-clip-text text-transparent',
                        styles.accent
                    )}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-[10px] text-slate-500 truncate">{subtitle}</p>
                    )}
                    {trend && (
                        <div className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
                            <TrendIcon className="w-3 h-3" weight="bold" />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {icon && (
                    <div className={cn(
                        'p-2 rounded-lg shrink-0',
                        styles.iconBg,
                        styles.iconColor
                    )}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Drilldown indicator - visual only, no text */}
            {isClickable && (
                <div className="absolute bottom-1.5 right-1.5 opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 animate-pulse" />
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
    blue: 'stroke-blue-500',
    green: 'stroke-emerald-500',
    yellow: 'stroke-amber-500',
    red: 'stroke-red-500'
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
                    className="text-slate-700/50"
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
                <span className="text-lg font-bold text-white">{progress}%</span>
                {label && <span className="text-[10px] text-slate-400">{label}</span>}
                {sublabel && <span className="text-[8px] text-slate-500">{sublabel}</span>}
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
    online: 'bg-emerald-500',
    offline: 'bg-slate-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
}

export function StatusDot({ status, label }: StatusDotProps) {
    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                {status === 'online' && (
                    <span className={cn(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                        statusColors[status]
                    )} />
                )}
                <span className={cn(
                    'relative inline-flex rounded-full h-3 w-3',
                    statusColors[status]
                )} />
            </span>
            {label && <span className="text-sm text-slate-400">{label}</span>}
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
                'flex items-center justify-between py-1 border-b border-slate-700/50 last:border-0',
                isClickable && 'cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 transition-colors'
            )}
        >
            <span className="text-xs text-slate-400">{label}</span>
            <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-white">{value}</span>
                {trend && (
                    <span className={trend === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                        {trend === 'up' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                    </span>
                )}
                {isClickable && <span className="text-slate-600 text-xs">→</span>}
            </div>
        </div>
    )
}
