/**
 * FleetHub - BOLD DARK THEME REDESIGN
 *
 * COMPLETE VISUAL TRANSFORMATION:
 * - Dark slate-900 foundation with vibrant neon accents
 * - Asymmetric grid layouts with overlapping cards
 * - Glowing borders and dramatic shadows
 * - Bold typography (text-6xl hero numbers)
 * - Smooth animations with framer-motion
 * - Modern dark map integration
 * - Circular progress rings
 * - Command palette style interactions
 *
 * Route: /fleet
 */

import {
    Car as FleetIcon,
    MapTrifold,
    Speedometer,
    Pulse,
    Package,
    Video,
    Lightning,
    MapPin,
    Warning,
    TrendUp,
    AlertCircle,
    TrendDown,
    Activity,
    Gauge,
    Calendar,
    Bell,
    ArrowRight,
    CheckCircle,
    Fire,
    Drop,
    Engine,
    Target
} from '@phosphor-icons/react'
import React, { Suspense, lazy, Component, ReactNode, ErrorInfo, useState, memo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

// Lazy load heavy components for performance
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const LiveFleetMap = lazy(() => import('@/components/Maps/LiveFleetMap').then(m => ({ default: m.LiveFleetMap })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))

import { AddVehicleDialog } from '@/components/dialogs/AddVehicleDialog'
import { Button } from '@/components/ui/button'
import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'

// Role-specific dashboards
import { FleetManagerDashboard } from '@/components/dashboards/roles/FleetManagerDashboard'
import { DriverDashboard } from '@/components/dashboards/roles/DriverDashboard'
import { DispatcherDashboard } from '@/components/dashboards/roles/DispatcherDashboard'
import { MaintenanceManagerDashboard } from '@/components/dashboards/roles/MaintenanceManagerDashboard'
import { AdminDashboard } from '@/components/dashboards/roles/AdminDashboard'

// ============================================================================
// TAB ERROR BOUNDARY - Graceful error handling per tab
// ============================================================================
interface TabErrorBoundaryState {
    hasError: boolean
    error?: Error
}

class TabErrorBoundary extends Component<{ children: ReactNode; tabName: string }, TabErrorBoundaryState> {
    constructor(props: { children: ReactNode; tabName: string }) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): TabErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error(`Tab "${this.props.tabName}" error:`, error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full p-3 bg-slate-900"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="bg-slate-800/80 backdrop-blur-xl rounded-lg border border-amber-500/30 p-3 text-center max-w-md shadow-[0_0_30px_rgba(251,191,36,0.2)]">
                        <Warning className="w-16 h-16 text-amber-400 mx-auto mb-2" aria-hidden="true" />
                        <h3 className="text-sm font-bold text-white mb-2">Tab Temporarily Unavailable</h3>
                        <p className="text-base text-slate-300 mb-3 leading-relaxed">
                            The {this.props.tabName} feature is currently unavailable. Our team has been notified.
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                            className="border-amber-400 text-amber-400 hover:bg-amber-400/10"
                            aria-label={`Retry loading ${this.props.tabName}`}
                        >
                            Try Again
                        </Button>
                    </div>
                </motion.div>
            )
        }
        return this.props.children
    }
}

// ============================================================================
// DARK THEME LOADING FALLBACK with Neon Shimmer
// ============================================================================
const TabLoadingFallback = memo(function TabLoadingFallback() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 space-y-2 bg-slate-900 min-h-screen"
            role="status"
            aria-label="Loading tab content"
            aria-busy="true"
        >
            <Skeleton className="h-8 w-1/4 bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[...Array(4)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-40 rounded-lg bg-slate-800 animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>
            <span className="sr-only">Loading, please wait...</span>
        </motion.div>
    )
})

// ============================================================================
// NEON METRIC CARD - Bold Dark Design with Glowing Accents
// ============================================================================
interface MetricCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ReactNode
    trend?: {
        value: string
        isPositive: boolean
    }
    color: 'cyan' | 'emerald' | 'violet' | 'amber'
    delay?: number
    large?: boolean
}

const MetricCard = memo(function MetricCard({ title, value, subtitle, icon, trend, color, delay = 0, large = false }: MetricCardProps) {
    const colorClasses = {
        cyan: {
            glow: 'shadow-[0_0_30px_rgba(34,211,238,0.2)]',
            ring: 'ring-cyan-400/30',
            bg: 'bg-cyan-400',
            text: 'text-cyan-400',
            hover: 'group-hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]'
        },
        emerald: {
            glow: 'shadow-[0_0_30px_rgba(52,211,153,0.2)]',
            ring: 'ring-emerald-400/30',
            bg: 'bg-emerald-400',
            text: 'text-emerald-400',
            hover: 'group-hover:shadow-[0_0_40px_rgba(52,211,153,0.4)]'
        },
        violet: {
            glow: 'shadow-[0_0_30px_rgba(139,92,246,0.2)]',
            ring: 'ring-violet-500/30',
            bg: 'bg-violet-500',
            text: 'text-violet-500',
            hover: 'group-hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]'
        },
        amber: {
            glow: 'shadow-[0_0_30px_rgba(251,191,36,0.2)]',
            ring: 'ring-amber-400/30',
            bg: 'bg-amber-400',
            text: 'text-amber-400',
            hover: 'group-hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]'
        }
    }

    const colors = colorClasses[color]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
                "group relative bg-slate-800/50 backdrop-blur-xl rounded-3xl border p-3",
                "shadow-sm transition-all duration-300 overflow-hidden",
                `ring-2 ${colors.ring} ${colors.glow} ${colors.hover}`
            )}
        >
            {/* Gradient Background on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-violet-500/5
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
                    <div className={cn("w-12 h-9 rounded-md flex items-center justify-center", colors.bg)}>
                        {React.cloneElement(icon as React.ReactElement, { className: "w-4 h-4 text-slate-900", weight: "bold" })}
                    </div>
                </div>

                <div className={cn(
                    "font-black text-white mb-2 leading-none",
                    large ? "text-6xl" : "text-sm"
                )}>
                    {value}
                </div>

                <div className="flex items-center justify-between">
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                            trend.isPositive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                        )}>
                            {trend.isPositive ? (
                                <TrendUp className="w-3 h-3" weight="bold" />
                            ) : (
                                <TrendDown className="w-3 h-3" weight="bold" />
                            )}
                            <span>{trend.value}</span>
                        </div>
                    )}
                    {subtitle && (
                        <span className={cn("text-xs font-medium", colors.text)}>{subtitle}</span>
                    )}
                </div>
            </div>

            {/* Neon Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent
                              transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
        </motion.div>
    )
})

// ============================================================================
// CIRCULAR PROGRESS RING - Neon Style
// ============================================================================
interface CircularProgressProps {
    percentage: number
    size?: number
    strokeWidth?: number
    color: 'cyan' | 'emerald' | 'violet' | 'amber'
    label: string
}

const CircularProgress = memo(function CircularProgress({
    percentage,
    size = 120,
    strokeWidth = 8,
    color,
    label
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

    const colorMap = {
        cyan: 'stroke-cyan-400',
        emerald: 'stroke-emerald-400',
        violet: 'stroke-violet-500',
        amber: 'stroke-amber-400'
    }

    return (
        <div className="relative flex flex-col items-center gap-2">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-slate-700"
                />
                {/* Progress Circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={colorMap[color]}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    style={{
                        strokeDasharray: circumference,
                        filter: `drop-shadow(0 0 8px rgba(34, 211, 238, 0.6))`
                    }}
                />
                {/* Center Text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-sm font-black fill-white transform rotate-90"
                    style={{ transformOrigin: 'center' }}
                >
                    {percentage}%
                </text>
            </svg>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
    )
})

// ============================================================================
// STATUS HEATMAP - Visual Grid Overview
// ============================================================================
interface HeatmapCellProps {
    id: string
    status: 'active' | 'idle' | 'maintenance' | 'offline'
    onClick: () => void
}

const HeatmapCell = memo(function HeatmapCell({ id, status, onClick }: HeatmapCellProps) {
    const statusColors = {
        active: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]',
        idle: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]',
        maintenance: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]',
        offline: 'bg-slate-600'
    }

    return (
        <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
                "w-4 h-4 rounded-lg transition-all duration-200 cursor-pointer",
                statusColors[status]
            )}
            title={`Vehicle ${id} - ${status}`}
        />
    )
})

// ============================================================================
// FLEET OVERVIEW CONTENT - BOLD DARK REDESIGN
// ============================================================================
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useVehicles, useVehicleMutations } from '@/hooks/use-api'
import { EntityAvatar } from '@/shared/design-system/EntityAvatar'
import { RowExpandPanel } from '@/shared/design-system/RowExpandPanel'
import { StatusChip } from '@/shared/design-system/StatusChip'
import type { VehicleRow } from '@/shared/design-system/types'

function FleetOverviewContent() {
    const { push } = useDrilldown()
    const [expandedRow, setExpandedRow] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    // Use real data with auto-refresh
    const { data: vehiclesData, isLoading, dataUpdatedAt } = useVehicles({ limit: 1000, tenant_id: '' })
    const { createVehicle } = useVehicleMutations()

    // Update last refresh timestamp when data changes
    useEffect(() => {
        if (dataUpdatedAt) {
            setLastUpdate(new Date(dataUpdatedAt))
        }
    }, [dataUpdatedAt])

    const vehicles: VehicleRow[] = React.useMemo(() => {
        if (!vehiclesData) return []
        return (Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData as any).data || []).map((v: any) => ({
            entityType: 'vehicle',
            id: v.id,
            displayName: v.number ? `${v.number} - ${v.name || `${v.year} ${v.make} ${v.model}`}` : (v.name || `${v.year} ${v.make} ${v.model}`),
            status: v.status,
            kind: v.type,
            odometer: v.mileage || 0,
            fuelPct: v.fuelLevel || 0,
            healthScore: 100,
            alerts: 0,
            updatedAgo: 'Just now'
        }))
    }, [vehiclesData])

    const handleAddVehicle = (vehicle: any) => {
        createVehicle.mutate(vehicle)
        toast.success('Vehicle added successfully!', {
            icon: '🚗',
            style: {
                borderRadius: '12px',
                background: '#22d3ee',
                color: '#0f172a',
            }
        })
    }

    // Calculate fleet metrics
    const totalVehicles = vehicles.length
    const activeVehicles = vehicles.filter(v => (v.status as string).toLowerCase() === 'active' || (v.status as string).toLowerCase() === 'operational').length
    const maintenanceNeeded = vehicles.filter(v => v.alerts > 0).length
    const avgFuelLevel = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + v.fuelPct, 0) / vehicles.length)
        : 0
    const avgHealthScore = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
        : 0

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Animated Gradient Mesh Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-cyan-900/20 via-slate-900 to-violet-900/20" />
            <div className="fixed inset-0 opacity-30"
                 style={{
                     backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
                 }}
            />

            {/* Floating Header - Dark Glass */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-50 bg-slate-800/50 backdrop-blur-xl border-b border-cyan-400/20 px-3 py-2
                         shadow-[0_0_30px_rgba(34,211,238,0.1)]"
            >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
                    <div className="flex items-center gap-2">
                        <motion.div
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                            className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500
                                     flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                        >
                            <FleetIcon className="w-4 h-4 text-slate-900" weight="bold" />
                        </motion.div>
                        <div>
                            <h1 className="text-base font-black text-white leading-none mb-1">Fleet Command</h1>
                            <p className="text-sm text-cyan-400 font-medium">Real-time monitoring and analytics</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live Indicator - Neon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 px-2 py-2 rounded-md bg-emerald-400/10
                                     shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/30"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                            />
                            <span className="text-sm font-bold text-emerald-400">LIVE</span>
                        </motion.div>

                        {/* Last Updated */}
                        <div className="hidden md:flex items-center gap-2 px-2 py-2 rounded-md bg-slate-700/50 ring-1 ring-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">
                                {lastUpdate.toLocaleTimeString()}
                            </span>
                        </div>

                        {/* Add Vehicle Button */}
                        <AddVehicleDialog onAdd={handleAddVehicle} />
                    </div>
                </div>
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 p-3 space-y-2">
                {/* ASYMMETRIC HERO METRICS - Bold Layout */}
                <div className="grid grid-cols-12 gap-2">
                    {/* Large Feature Card - 7 columns */}
                    <div className="col-span-12 lg:col-span-7">
                        <MetricCard
                            title="Active Vehicles"
                            value={activeVehicles}
                            subtitle={`${totalVehicles} total fleet`}
                            icon={<Speedometer />}
                            trend={{ value: '+8% today', isPositive: true }}
                            color="cyan"
                            delay={0}
                            large={true}
                        />
                    </div>

                    {/* Stacked Smaller Cards - 5 columns */}
                    <div className="col-span-12 lg:col-span-5 space-y-2">
                        <MetricCard
                            title="Health Score"
                            value={`${avgHealthScore}%`}
                            subtitle="fleet average"
                            icon={<Pulse />}
                            trend={{ value: avgHealthScore >= 90 ? 'Excellent' : 'Good', isPositive: avgHealthScore >= 80 }}
                            color="emerald"
                            delay={0.1}
                        />
                        <MetricCard
                            title="Maintenance"
                            value={maintenanceNeeded}
                            subtitle={`${avgFuelLevel}% avg fuel`}
                            icon={<AlertCircle />}
                            color="amber"
                            delay={0.2}
                        />
                    </div>
                </div>

                {/* Status Heatmap - Visual Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-violet-500/20 p-3
                             shadow-[0_0_30px_rgba(139,92,246,0.1)] ring-2 ring-violet-500/20"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-base font-black text-white mb-1">Fleet Status Heatmap</h3>
                            <p className="text-sm text-slate-400">Real-time vehicle status overview</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                <span className="text-slate-400">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                <span className="text-slate-400">Idle</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                <span className="text-slate-400">Maintenance</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded bg-slate-600" />
                                <span className="text-slate-400">Offline</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-12 sm:grid-cols-16 md:grid-cols-20 gap-3">
                        {vehicles.slice(0, 60).map((vehicle, i) => {
                            const statusMap: { [key: string]: 'active' | 'idle' | 'maintenance' | 'offline' } = {
                                active: 'active',
                                operational: 'active',
                                idle: 'idle',
                                maintenance: 'maintenance',
                                offline: 'offline'
                            }
                            const status = statusMap[(vehicle.status as string).toLowerCase()] || 'idle'

                            return (
                                <HeatmapCell
                                    key={vehicle.id}
                                    id={vehicle.id}
                                    status={status}
                                    onClick={() => push({
                                        id: vehicle.id,
                                        type: 'vehicle-details',
                                        label: vehicle.displayName,
                                        data: vehicle
                                    })}
                                />
                            )
                        })}
                    </div>
                </motion.div>

                {/* Circular Progress Rings & Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Circular Metrics */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-cyan-400/20 p-3
                                 shadow-[0_0_30px_rgba(34,211,238,0.1)] ring-2 ring-cyan-400/20"
                    >
                        <h3 className="text-sm font-bold text-white mb-3">Performance Metrics</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <CircularProgress percentage={avgHealthScore} color="emerald" label="Health" />
                            <CircularProgress percentage={avgFuelLevel} color="cyan" label="Fuel" />
                            <CircularProgress percentage={Math.round((activeVehicles / totalVehicles) * 100)} color="violet" label="Active" />
                            <CircularProgress percentage={85} color="amber" label="Efficiency" />
                        </div>
                    </motion.div>

                    {/* Activity Timeline */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-violet-500/20 p-3
                                 shadow-[0_0_30px_rgba(139,92,246,0.1)] ring-2 ring-violet-500/20"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
                            >
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {[
                                { icon: CheckCircle, color: 'emerald', text: 'Vehicle FL-2847 completed route', time: '2m ago' },
                                { icon: Warning, color: 'amber', text: 'Low fuel alert for TX-9201', time: '15m ago' },
                                { icon: Activity, color: 'cyan', text: 'Daily inspection passed for CA-5623', time: '1h ago' },
                                { icon: Bell, color: 'violet', text: 'Maintenance scheduled for NY-1134', time: '2h ago' },
                                { icon: Fire, color: 'amber', text: 'High engine temp - FL-5555', time: '3h ago' }
                            ].map((activity, i) => {
                                const colorMap: any = {
                                    emerald: { bg: 'bg-emerald-400/10', icon: 'text-emerald-400', glow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
                                    amber: { bg: 'bg-amber-400/10', icon: 'text-amber-400', glow: 'shadow-[0_0_10px_rgba(251,191,36,0.3)]' },
                                    cyan: { bg: 'bg-cyan-400/10', icon: 'text-cyan-400', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.3)]' },
                                    violet: { bg: 'bg-violet-500/10', icon: 'text-violet-500', glow: 'shadow-[0_0_10px_rgba(139,92,246,0.3)]' }
                                }
                                const style = colorMap[activity.color]

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 + i * 0.1 }}
                                        className="flex items-center gap-2 p-3 rounded-md hover:bg-slate-700/30 transition-colors cursor-pointer"
                                    >
                                        <div className={cn("w-10 h-8 rounded-lg flex items-center justify-center", style.bg, style.glow)}>
                                            <activity.icon className={cn("w-3 h-3", style.icon)} weight="bold" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{activity.text}</p>
                                            <p className="text-xs text-slate-500">{activity.time}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Vehicle Table - Dark Premium Design */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50
                             shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                    <div className="px-3 py-2 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
                        <h3 className="text-sm font-bold text-white">Fleet Inventory</h3>
                        <p className="text-sm text-slate-400 mt-1">Click any vehicle for detailed telemetry</p>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-12 h-9 rounded-full border-4 border-slate-700 border-t-cyan-400
                                         shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                            />
                            <p className="text-sm text-slate-400 font-medium">Loading fleet data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" role="grid" aria-label="Fleet vehicles inventory">
                                <thead className="bg-slate-800/80 border-b border-slate-700">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Vehicle</th>
                                        <th scope="col" className="hidden sm:table-cell px-3 py-2 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="hidden md:table-cell px-3 py-2 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Mileage</th>
                                        <th scope="col" className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Fuel</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-bold text-cyan-400 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    <AnimatePresence>
                                        {vehicles.map((vehicle, i) => (
                                            <React.Fragment key={vehicle.id}>
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={cn(
                                                        "hover:bg-cyan-400/5 cursor-pointer transition-all duration-200",
                                                        expandedRow === vehicle.id && "bg-cyan-400/10"
                                                    )}
                                                    onClick={() => setExpandedRow(expandedRow === vehicle.id ? null : vehicle.id)}
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <EntityAvatar entity={vehicle} size={40} className="ring-2 ring-cyan-400/30" />
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-white truncate">
                                                                    {vehicle.displayName}
                                                                </div>
                                                                <div className="text-xs text-slate-500 truncate">
                                                                    ID: {vehicle.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-3 py-2 text-sm font-medium text-slate-300">
                                                        {vehicle.kind}
                                                    </td>
                                                    <td className="hidden md:table-cell px-3 py-2 text-sm text-slate-300">
                                                        {vehicle.odometer.toLocaleString()} mi
                                                    </td>
                                                    <td className="hidden lg:table-cell px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${vehicle.fuelPct}%` }}
                                                                    transition={{ delay: 0.3, duration: 0.8 }}
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        vehicle.fuelPct < 25 ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]" :
                                                                        vehicle.fuelPct < 50 ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" :
                                                                        "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                                                                    )}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-white font-semibold min-w-[3rem] text-right">
                                                                {vehicle.fuelPct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <StatusChip
                                                            status={vehicle.alerts > 0 ? vehicle.status : "good"}
                                                            label={vehicle.alerts > 0 ? `${vehicle.alerts} alerts` : "OK"}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                push({
                                                                    id: vehicle.id,
                                                                    type: 'vehicle-details',
                                                                    label: `${vehicle.displayName} Details`,
                                                                    data: vehicle
                                                                })
                                                            }}
                                                            size="sm"
                                                            className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                                                        >
                                                            Details
                                                        </Button>
                                                    </td>
                                                </motion.tr>
                                                <AnimatePresence>
                                                    {expandedRow === vehicle.id && (
                                                        <motion.tr
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        >
                                                            <td colSpan={7} className="px-3 py-3 bg-slate-900/50">
                                                                <RowExpandPanel
                                                                    anomalies={[
                                                                        { status: 'good', label: 'Engine Temp: Normal' },
                                                                        { status: 'warn', label: 'Tire Pressure: Low' },
                                                                        { status: vehicle.fuelPct < 25 ? 'bad' : 'good', label: `Fuel: ${vehicle.fuelPct}%` }
                                                                    ]}
                                                                    records={[
                                                                        { id: 'REC-001', summary: 'Routine maintenance completed', timestamp: '2h ago', severity: 'info' },
                                                                        { id: 'REC-002', summary: 'Low tire pressure detected', timestamp: '5h ago', severity: 'warn' }
                                                                    ]}
                                                                    onOpenRecord={(id) => push({
                                                                        id,
                                                                        type: 'record-details',
                                                                        label: `Record ${id}`,
                                                                        data: { recordId: id }
                                                                    })}
                                                                />
                                                            </td>
                                                        </motion.tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

// ============================================================================
// VIDEO TELEMATICS CONTENT - Dark Theme
// ============================================================================

interface CameraFeed {
    id: string
    location: string
    status: 'recording' | 'offline' | 'buffering'
    streamUrl?: string
}

function VideoPlayer({ camera }: { camera: CameraFeed }) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
        if (!camera.streamUrl || !videoRef.current) return

        const video = videoRef.current

        if (camera.streamUrl.endsWith('.m3u8')) {
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = camera.streamUrl
            } else {
                import('hls.js').then(({ default: Hls }) => {
                    if (Hls.isSupported()) {
                        const hls = new Hls()
                        hls.loadSource(camera.streamUrl!)
                        hls.attachMedia(video)
                        hls.on(Hls.Events.ERROR, () => setError(true))
                    }
                }).catch(() => setError(true))
            }
        } else {
            video.src = camera.streamUrl
        }

        video.play().catch(() => {})
    }, [camera.streamUrl])

    if (!camera.streamUrl || camera.status === 'offline') {
        return (
            <div className="aspect-video bg-slate-800 flex items-center justify-center relative
                          border border-slate-700 rounded-md overflow-hidden">
                <Video className="w-12 h-9 text-slate-600" />
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-700/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-xs text-slate-300 font-bold">OFFLINE</span>
                </div>
                <span className="absolute bottom-3 left-3 text-sm text-slate-400 font-semibold">{camera.id}</span>
            </div>
        )
    }

    return (
        <div className="aspect-video bg-black relative overflow-hidden rounded-md border-2 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            {error ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Video className="w-12 h-9" />
                </div>
            ) : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    autoPlay
                />
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 rounded-full bg-white"
                />
                <span className="text-xs text-white font-bold">
                    {camera.status === 'recording' ? 'LIVE' : 'BUFFERING'}
                </span>
            </div>
            <span className="absolute bottom-3 left-3 text-sm text-white font-semibold drop-shadow-sm">{camera.id}</span>
        </div>
    )
}

function VideoContent() {
    const { push } = useDrilldown()
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    const cameras: CameraFeed[] = [
        { id: 'CAM-001', location: 'Front Gate', status: 'recording', streamUrl: undefined },
        { id: 'CAM-002', location: 'Loading Bay A', status: 'recording', streamUrl: undefined },
        { id: 'CAM-003', location: 'Parking Lot', status: 'recording', streamUrl: undefined },
        { id: 'CAM-004', location: 'Service Bay', status: 'offline', streamUrl: undefined },
        { id: 'CAM-005', location: 'Depot North', status: 'recording', streamUrl: undefined },
        { id: 'CAM-006', location: 'Fleet Exit', status: 'recording', streamUrl: undefined },
    ]

    const recordingCameras = cameras.filter(c => c.status === 'recording').length
    const totalEvents = 23
    const storageUsedTB = 2.4

    return (
        <div className="min-h-screen bg-slate-900">
            <div className="fixed inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900 to-pink-900/20" />

            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-50 bg-slate-800/50 backdrop-blur-xl border-b border-violet-500/20 px-3 py-2 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
            >
                <div className="flex items-center gap-2">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-pink-600
                                  flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                        <Video className="w-7 h-7 text-white" weight="bold" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white leading-none mb-1">Video Telematics</h1>
                        <p className="text-sm text-violet-400">Live camera feeds and event monitoring</p>
                    </div>
                </div>
            </motion.div>

            {/* Content Container */}
            <div className="relative z-10 p-3 space-y-2">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <MetricCard
                        title="Active Cameras"
                        value={recordingCameras}
                        subtitle={`${cameras.length} total`}
                        icon={<Video />}
                        color="violet"
                        delay={0}
                    />
                    <MetricCard
                        title="Events Today"
                        value={totalEvents}
                        icon={<Warning />}
                        trend={{ value: '+15% vs yesterday', isPositive: true }}
                        color="amber"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Storage Used"
                        value={`${storageUsedTB} TB`}
                        subtitle={`${Math.round((storageUsedTB / 5) * 100)}% capacity`}
                        icon={<Package />}
                        color="cyan"
                        delay={0.2}
                    />
                </div>

                {/* Camera Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50
                             shadow-[0_0_30px_rgba(0,0,0,0.3)] overflow-hidden"
                >
                    <div className="px-3 py-2 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-900">
                        <h3 className="text-sm font-bold text-white">Camera Feeds</h3>
                        <p className="text-sm text-slate-400 mt-1">Click any camera to view live feed</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-800/80 border-b border-slate-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-violet-400 uppercase tracking-wider">Camera ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-violet-400 uppercase tracking-wider">Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-violet-400 uppercase tracking-wider">Status</th>
                                    <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-bold text-violet-400 uppercase tracking-wider">Events (24h)</th>
                                    <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-bold text-violet-400 uppercase tracking-wider">Storage</th>
                                    <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {cameras.map((camera, i) => (
                                    <React.Fragment key={camera.id}>
                                        <motion.tr
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.05 }}
                                            className={cn(
                                                "hover:bg-violet-500/5 cursor-pointer transition-all duration-200",
                                                expandedRow === camera.id && "bg-violet-500/10"
                                            )}
                                            onClick={() => setExpandedRow(expandedRow === camera.id ? null : camera.id)}
                                        >
                                            <td className="px-3 py-2 text-sm font-semibold text-white">{camera.id}</td>
                                            <td className="px-3 py-2 text-sm font-medium text-slate-300">{camera.location}</td>
                                            <td className="px-3 py-2">
                                                <StatusChip
                                                    status={camera.status === 'recording' ? 'good' : camera.status === 'buffering' ? 'warn' : 'bad'}
                                                    label={camera.status === 'recording' ? 'LIVE' : camera.status.toUpperCase()}
                                                />
                                            </td>
                                            <td className="hidden md:table-cell px-3 py-2 text-sm text-slate-300 font-medium">
                                                {Math.floor(Math.random() * 15) + 2}
                                            </td>
                                            <td className="hidden lg:table-cell px-3 py-2 text-sm text-slate-400">
                                                {(Math.random() * 0.5 + 0.1).toFixed(2)} TB
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        push({
                                                            id: camera.id,
                                                            type: 'camera-details',
                                                            label: `${camera.location} Camera`,
                                                            data: camera
                                                        })
                                                    }}
                                                    size="sm"
                                                    className="bg-violet-500 hover:bg-violet-400 text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                                                >
                                                    View Feed
                                                </Button>
                                            </td>
                                        </motion.tr>
                                        <AnimatePresence>
                                            {expandedRow === camera.id && (
                                                <motion.tr
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <td colSpan={6} className="px-3 py-3 bg-slate-900/50">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                            <div className="bg-slate-800 rounded-md border border-slate-700 p-2 shadow-md">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Feed</h4>
                                                                <VideoPlayer camera={camera} />
                                                            </div>

                                                            <div className="bg-slate-800 rounded-md border border-slate-700 p-2 shadow-md">
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Events</h4>
                                                                <div className="space-y-3">
                                                                    {[
                                                                        { text: 'Motion detected', time: '2h ago' },
                                                                        { text: 'Vehicle entry', time: '4h ago' },
                                                                        { text: 'Anomaly flagged', time: '7h ago' }
                                                                    ].map((event, idx) => (
                                                                        <div key={idx} className="flex justify-between py-2 border-b border-slate-700 last:border-0">
                                                                            <span className="text-sm font-medium text-white">{event.text}</span>
                                                                            <span className="text-xs text-slate-500">{event.time}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

// ============================================================================
// MAIN FLEET HUB COMPONENT - Role-Based View Switching
// ============================================================================
export function FleetHub() {
    const { user } = useAuth();

    // Role detection - normalize role string for comparison
    const normalizeRole = (role: string): string => {
        return role.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
    };

    const userRole = user?.role ? normalizeRole(user.role) : '';

    // Determine if user should see role-specific dashboard or full tabbed interface
    // Admins get full tabbed interface, other roles get workflow-optimized dashboards
    const shouldShowRoleDashboard = () => {
        const adminRoles = ['super_admin', 'superadmin', 'admin', 'tenant_admin'];
        return !adminRoles.includes(userRole);
    };

    // Render role-specific dashboard
    if (shouldShowRoleDashboard() && user) {
        switch (userRole) {
            case 'fleet_manager':
            case 'manager':
            case 'fleetmanager':
                return <FleetManagerDashboard />;

            case 'driver':
            case 'user':
                return <DriverDashboard />;

            case 'dispatcher':
                return <DispatcherDashboard />;

            case 'maintenance_manager':
            case 'mechanic':
            case 'technician':
                return <MaintenanceManagerDashboard />;

            default:
                // For unknown roles, show FleetManagerDashboard as default
                return <FleetManagerDashboard />;
        }
    }

    // Admin users see full tabbed interface
    const tabs: HubTab[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: <Speedometer className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="Overview">
                    <FleetOverviewContent />
                </TabErrorBoundary>
            ),
            ariaLabel: 'View fleet overview and vehicle inventory'
        },
        {
            id: 'google-maps',
            label: 'Live Tracking',
            icon: <MapPin className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="Live Tracking">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <LiveFleetMap />
                    </Suspense>
                </TabErrorBoundary>
            ),
            ariaLabel: 'View live vehicle tracking on Google Maps'
        },
        {
            id: 'map',
            label: 'Advanced Map',
            icon: <MapTrifold className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="Advanced Map">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <LiveFleetDashboard />
                    </Suspense>
                </TabErrorBoundary>
            ),
            ariaLabel: 'View advanced fleet map with telemetry overlays'
        },
        {
            id: 'telemetry',
            label: 'Telemetry',
            icon: <Pulse className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="Telemetry">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <VehicleTelemetry />
                    </Suspense>
                </TabErrorBoundary>
            ),
            ariaLabel: 'View real-time vehicle telemetry data'
        },
        {
            id: '3d',
            label: '3D Garage',
            icon: <Package className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="3D Garage">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <VirtualGarage />
                    </Suspense>
                </TabErrorBoundary>
            ),
            ariaLabel: 'View 3D virtual garage with vehicle models'
        },
        {
            id: 'video',
            label: 'Video',
            icon: <Video className="w-4 h-4" aria-hidden="true" />,
            content: <VideoContent />,
            ariaLabel: 'View video telematics and camera feeds'
        },
        {
            id: 'ev',
            label: 'EV Charging',
            icon: <Lightning className="w-4 h-4" aria-hidden="true" />,
            content: (
                <TabErrorBoundary tabName="EV Charging">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <EVChargingManagement />
                    </Suspense>
                </TabErrorBoundary>
            ),
            ariaLabel: 'Manage electric vehicle charging stations'
        },
    ]

    return (
        <HubPage
            title="Fleet Hub"
            icon={<FleetIcon className="w-4 h-4" aria-hidden="true" />}
            description="Fleet vehicles, tracking, and telemetry"
            tabs={tabs}
            defaultTab="overview"
        />
    )
}

export default FleetHub
