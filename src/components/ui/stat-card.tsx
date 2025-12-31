/**
 * Premium Statistics Card Component
 *
 * Features:
 * - Glassmorphism effect
 * - Gradient accents
 * - Trend indicators (up/down)
 * - Animated counters
 * - Hover effects
 * - Entrance animations with framer-motion
 */

import { ArrowUp, ArrowDown, Minus } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

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

const variantStyles = {
    default: {
        bg: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80',
        border: 'border-slate-700/50',
        accent: 'from-slate-400 to-slate-500',
        iconBg: 'bg-slate-700/50',
        iconColor: 'text-slate-400'
    },
    primary: {
        bg: 'bg-gradient-to-br from-blue-900/40 to-blue-950/60',
        border: 'border-blue-500/30',
        accent: 'from-blue-400 to-blue-500',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400'
    },
    success: {
        bg: 'bg-gradient-to-br from-emerald-900/40 to-emerald-950/60',
        border: 'border-emerald-500/30',
        accent: 'from-emerald-400 to-emerald-500',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-400'
    },
    warning: {
        bg: 'bg-gradient-to-br from-amber-900/40 to-amber-950/60',
        border: 'border-amber-500/30',
        accent: 'from-amber-400 to-amber-500',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400'
    },
    danger: {
        bg: 'bg-gradient-to-br from-red-900/40 to-red-950/60',
        border: 'border-red-500/30',
        accent: 'from-red-400 to-red-500',
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-400'
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
                // Base - compact padding
                'relative overflow-hidden rounded-lg border p-3',
                // Glassmorphism
                'backdrop-blur-xl shadow-lg',
                // Hover effects - removed scale since we use whileHover
                'transition-shadow duration-200 hover:shadow-xl',
                // Clickable styling - removed scale classes since we use whileHover/whileTap
                isClickable && 'cursor-pointer hover:border-opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500/50',
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

            {/* Drilldown indicator for clickable cards */}
            {isClickable && (
                <div className="absolute bottom-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">Click to drill down →</span>
                </div>
            )}
        </motion.div>
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
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative inline-flex items-center justify-center"
        >
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
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-bold text-white"
                >
                    {progress}%
                </motion.span>
                {label && <span className="text-[10px] text-slate-400">{label}</span>}
                {sublabel && <span className="text-[8px] text-slate-500">{sublabel}</span>}
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
