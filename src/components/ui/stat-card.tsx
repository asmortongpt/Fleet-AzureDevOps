/**
 * Professional Statistics Card Component
 *
 * Features:
 * - Clean corporate design with responsive layout
 * - Subtle shadows and borders
 * - Trend indicators (up/down)
 * - Professional color variants
 * - Accessible and keyboard-navigable
 * - Smooth animations and transitions
 */

import { ArrowUp, ArrowDown, Minus, CaretRight } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    icon?: React.ReactNode
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'sm' | 'default' | 'lg'
    className?: string
    onClick?: () => void
    drilldownLabel?: string
}

const variantStyles = {
    default: {
        bg: 'bg-card',
        border: 'border-border/50',
        hoverBorder: 'hover:border-border',
        accent: 'from-muted-foreground/50 to-muted-foreground/30',
        iconBg: 'bg-muted/50',
        iconColor: 'text-muted-foreground',
        valueColor: 'text-foreground'
    },
    primary: {
        bg: 'bg-card',
        border: 'border-primary/20',
        hoverBorder: 'hover:border-primary/40',
        accent: 'from-primary to-primary/70',
        iconBg: 'bg-primary/10',
        iconColor: 'text-primary',
        valueColor: 'text-foreground'
    },
    success: {
        bg: 'bg-card',
        border: 'border-success/20',
        hoverBorder: 'hover:border-success/40',
        accent: 'from-success to-success/70',
        iconBg: 'bg-success/10',
        iconColor: 'text-success',
        valueColor: 'text-foreground'
    },
    warning: {
        bg: 'bg-card',
        border: 'border-warning/20',
        hoverBorder: 'hover:border-warning/40',
        accent: 'from-warning to-warning/70',
        iconBg: 'bg-warning/10',
        iconColor: 'text-warning',
        valueColor: 'text-foreground'
    },
    danger: {
        bg: 'bg-card',
        border: 'border-destructive/20',
        hoverBorder: 'hover:border-destructive/40',
        accent: 'from-destructive to-destructive/70',
        iconBg: 'bg-destructive/10',
        iconColor: 'text-destructive',
        valueColor: 'text-foreground'
    },
    info: {
        bg: 'bg-card',
        border: 'border-blue-500/20',
        hoverBorder: 'hover:border-blue-500/40',
        accent: 'from-blue-500 to-blue-500/70',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-800',
        valueColor: 'text-foreground'
    }
}

const sizeStyles = {
    sm: {
        padding: 'p-3',
        title: 'text-xs',
        value: 'text-lg sm:text-xl',
        subtitle: 'text-xs',
        icon: 'p-1.5',
        iconSize: 'w-4 h-4'
    },
    default: {
        padding: 'p-4',
        title: 'text-xs',
        value: 'text-xl sm:text-2xl',
        subtitle: 'text-xs',
        icon: 'p-2.5',
        iconSize: 'w-5 h-5'
    },
    lg: {
        padding: 'p-5 sm:p-6',
        title: 'text-xs sm:text-sm',
        value: 'text-2xl sm:text-3xl',
        subtitle: 'text-xs sm:text-sm',
        icon: 'p-3',
        iconSize: 'w-6 h-6'
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
    size = 'default',
    className,
    onClick,
    drilldownLabel = 'View Details'
}: StatCardProps) {
    const isClickable = !!onClick
    const styles = variantStyles[variant]
    const sizes = sizeStyles[size]

    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus
    const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={isClickable ? { scale: 1.02, transition: { duration: 0.2 } } : {}}
            whileTap={isClickable ? { scale: 0.99 } : {}}
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
                // Base
                'group relative overflow-hidden rounded-xl border',
                sizes.padding,
                // Shadow and transitions
                'shadow-sm transition-all duration-300 ease-out',
                // Hover effects
                'hover:shadow-md',
                styles.hoverBorder,
                // Clickable styling
                isClickable && [
                    'cursor-pointer',
                    'hover:-translate-y-0.5',
                    'active:translate-y-0 active:shadow-sm active:scale-[0.99]',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                ],
                // Variant styles
                styles.bg,
                styles.border,
                className
            )}
        >
            {/* Accent line at top */}
            <div className={cn(
                'absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r opacity-80',
                styles.accent,
                'transition-opacity duration-300',
                isClickable && 'group-hover:opacity-100'
            )} />

            <div className="relative flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                    <p className={cn(
                        'font-semibold text-muted-foreground uppercase tracking-wider truncate',
                        sizes.title
                    )}>
                        {title}
                    </p>
                    <p className={cn(
                        'font-bold tracking-tight tabular-nums',
                        sizes.value,
                        styles.valueColor
                    )}>
                        {value}
                    </p>
                    {(subtitle || trend) && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {subtitle && (
                                <p className={cn('text-muted-foreground truncate', sizes.subtitle)}>{subtitle}</p>
                            )}
                            {trend && trendValue && (
                                <div className={cn('flex items-center gap-0.5 font-medium', trendColor, sizes.subtitle)}>
                                    <TrendIcon className="w-3 h-3" weight="bold" />
                                    <span>{trendValue}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {icon && (
                    <div className={cn(
                        'rounded-xl shrink-0 transition-transform duration-300',
                        sizes.icon,
                        styles.iconBg,
                        styles.iconColor,
                        isClickable && 'group-hover:scale-110'
                    )}>
                        <div className={sizes.iconSize}>
                            {icon}
                        </div>
                    </div>
                )}
            </div>

            {/* Drilldown indicator */}
            {isClickable && (
                <div className="absolute bottom-3 right-3 opacity-0 translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-300">
                    <CaretRight className="w-4 h-4 text-primary" weight="bold" />
                </div>
            )}
        </motion.div>
    )
}

/**
 * Progress Ring Component with smooth animations
 */
interface ProgressRingProps {
    progress: number
    size?: number
    strokeWidth?: number
    color?: 'blue' | 'green' | 'yellow' | 'red'
    label?: string
    sublabel?: string
    animate?: boolean
}

const ringColors = {
    blue: 'stroke-primary',
    green: 'stroke-success',
    yellow: 'stroke-warning',
    red: 'stroke-destructive'
}

const ringBgColors = {
    blue: 'text-primary/10',
    green: 'text-success/10',
    yellow: 'text-warning/10',
    red: 'text-destructive/10'
}

export function ProgressRing({
    progress,
    size = 80,
    strokeWidth = 6,
    color = 'blue',
    label,
    sublabel,
    animate = true
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative inline-flex items-center justify-center"
        >
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className={ringBgColors[color]}
                />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    className={cn('transition-all duration-700 ease-out', ringColors[color])}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{progress}%</span>
                {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
                {sublabel && <span className="text-xs text-muted-foreground/70">{sublabel}</span>}
            </div>
        </motion.div>
    )
}

/**
 * Status Dot with pulse animation
 */
interface StatusDotProps {
    status: 'online' | 'offline' | 'warning' | 'error'
    label?: string
    size?: 'sm' | 'default' | 'lg'
}

const statusColors = {
    online: 'bg-success',
    offline: 'bg-muted-foreground',
    warning: 'bg-warning',
    error: 'bg-destructive'
}

const dotSizes = {
    sm: 'h-1.5 w-1.5',
    default: 'h-2.5 w-2.5',
    lg: 'h-3 w-3'
}

export function StatusDot({ status, label, size = 'default' }: StatusDotProps) {
    return (
        <div className="flex items-center gap-2">
            <span className={cn('relative flex', dotSizes[size])}>
                {status === 'online' && (
                    <span className={cn(
                        'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
                        statusColors[status]
                    )} />
                )}
                <span className={cn(
                    'relative inline-flex rounded-full',
                    dotSizes[size],
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
    onClick?: () => void
}

export function QuickStat({ label, value, trend, onClick }: QuickStatProps) {
    const isClickable = !!onClick
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
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
                'flex items-center justify-between py-2.5 border-b border-border/50 last:border-0',
                'transition-all duration-200',
                isClickable && [
                    'cursor-pointer rounded-lg px-2 -mx-2',
                    'hover:bg-muted/40 active:bg-muted/60',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                ]
            )}
        >
            <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-semibold text-foreground tabular-nums">{value}</span>
                {trend && (
                    <span className={cn(
                        'transition-transform duration-200',
                        trend === 'up' ? 'text-success' : 'text-destructive',
                        isClickable && 'group-hover:scale-110'
                    )}>
                        {trend === 'up' ? <ArrowUp className="w-3.5 h-3.5" weight="bold" /> : <ArrowDown className="w-3.5 h-3.5" weight="bold" />}
                    </span>
                )}
                {isClickable && (
                    <CaretRight className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
                )}
            </div>
        </motion.div>
    )
}

/**
 * StatGrid Container - Provides stagger animation for child StatCards
 * Wrap StatCards in this container for coordinated entrance animations
 */
interface StatGridProps {
    children: React.ReactNode
    className?: string
    staggerDelay?: number
}

export function StatGrid({ children, className, staggerDelay = 0.1 }: StatGridProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Metric Badge for inline stats
 */
interface MetricBadgeProps {
    value: string | number
    label?: string
    variant?: 'default' | 'success' | 'warning' | 'danger'
    className?: string
}

const badgeVariants = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive'
}

export function MetricBadge({ value, label, variant = 'default', className }: MetricBadgeProps) {
    return (
        <div className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
            badgeVariants[variant],
            className
        )}>
            <span className="font-semibold tabular-nums">{value}</span>
            {label && <span className="opacity-80">{label}</span>}
        </div>
    )
}
