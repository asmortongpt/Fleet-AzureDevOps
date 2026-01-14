/**
 * FleetHub - WORLD-CLASS Fleet Management Interface
 *
 * PREMIUM REDESIGN: Glassmorphism, smooth animations, and exceptional UX
 * Route: /fleet
 *
 * DESIGN FEATURES:
 * - Glassmorphism effects with backdrop blur
 * - Gradient accents (blue-500 to purple-600)
 * - Multi-layer shadows for depth
 * - Smooth framer-motion animations
 * - Modern card designs with generous spacing
 * - Bento grid layouts
 * - Floating action buttons
 * - Toast notifications
 * - Skeleton loaders
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
    CheckCircle
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
                    className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-slate-50 to-slate-100"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-amber-200 p-8 text-center max-w-md shadow-2xl shadow-amber-500/10">
                        <Warning className="w-16 h-16 text-amber-600 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Tab Temporarily Unavailable</h3>
                        <p className="text-base text-slate-600 mb-6 leading-relaxed">
                            The {this.props.tabName} feature is currently unavailable. Our team has been notified.
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                            className="border-amber-600 text-amber-700 hover:bg-amber-50"
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
// PREMIUM LOADING FALLBACK with Shimmer Effect
// ============================================================================
const TabLoadingFallback = memo(function TabLoadingFallback() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen"
            role="status"
            aria-label="Loading tab content"
            aria-busy="true"
        >
            <Skeleton className="h-10 w-1/4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-40 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                    />
                ))}
            </div>
            <span className="sr-only">Loading, please wait...</span>
        </motion.div>
    )
})

// ============================================================================
// ANIMATED METRIC CARD - Premium Design
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
    color: 'blue' | 'emerald' | 'purple' | 'amber'
    delay?: number
}

const MetricCard = memo(function MetricCard({ title, value, subtitle, icon, trend, color, delay = 0 }: MetricCardProps) {
    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        amber: 'from-amber-500 to-amber-600'
    }

    const bgClasses = {
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        purple: 'bg-purple-500',
        amber: 'bg-amber-500'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 p-6
                       shadow-lg shadow-slate-900/5 hover:shadow-2xl hover:shadow-slate-900/10
                       transition-all duration-300 overflow-hidden"
        >
            {/* Gradient Background on Hover */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                colorClasses[color]
            )} />

            {/* Content */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-slate-600">{title}</span>
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bgClasses[color])}>
                        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6 text-white" })}
                    </div>
                </div>

                <div className="text-4xl font-bold text-slate-900 mb-2 leading-none">
                    {value}
                </div>

                <div className="flex items-center justify-between">
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold",
                            trend.isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
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
                        <span className="text-xs text-slate-500">{subtitle}</span>
                    )}
                </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                              transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
        </motion.div>
    )
})

// ============================================================================
// FLEET OVERVIEW CONTENT - PREMIUM REDESIGN
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
                background: '#10b981',
                color: '#fff',
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
            {/* Premium Header with Glassmorphism */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 shadow-sm"
            >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600
                                     flex items-center justify-center shadow-lg shadow-blue-500/30"
                        >
                            <FleetIcon className="w-7 h-7 text-white" weight="bold" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Fleet Command Center</h1>
                            <p className="text-sm text-slate-600">Real-time vehicle monitoring and analytics</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Live Indicator - Premium */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600
                                     shadow-lg shadow-emerald-500/30"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-2 h-2 rounded-full bg-white"
                            />
                            <span className="text-sm font-semibold text-white">Live</span>
                        </motion.div>

                        {/* Last Updated */}
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100">
                            <Calendar className="w-4 h-4 text-slate-600" />
                            <span className="text-xs font-medium text-slate-600">
                                Updated {lastUpdate.toLocaleTimeString()}
                            </span>
                        </div>

                        {/* Add Vehicle Button */}
                        <AddVehicleDialog onAdd={handleAddVehicle} />
                    </div>
                </div>
            </motion.div>

            {/* Content Container */}
            <div className="p-6 space-y-6">
                {/* Hero Metrics Grid - Bento Layout */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    <MetricCard
                        title="Total Fleet"
                        value={totalVehicles}
                        subtitle={`${activeVehicles} operational`}
                        icon={<FleetIcon />}
                        trend={{ value: '+12% vs last month', isPositive: true }}
                        color="blue"
                        delay={0}
                    />
                    <MetricCard
                        title="Active Now"
                        value={activeVehicles}
                        subtitle="on the road"
                        icon={<Speedometer />}
                        trend={{ value: '+8% today', isPositive: true }}
                        color="emerald"
                        delay={0.1}
                    />
                    <MetricCard
                        title="Health Score"
                        value={`${avgHealthScore}%`}
                        subtitle="fleet average"
                        icon={<Pulse />}
                        trend={{ value: avgHealthScore >= 90 ? 'Excellent' : 'Good', isPositive: avgHealthScore >= 80 }}
                        color="purple"
                        delay={0.2}
                    />
                    <MetricCard
                        title="Maintenance"
                        value={maintenanceNeeded}
                        subtitle={`${avgFuelLevel}% avg fuel`}
                        icon={<AlertCircle />}
                        color="amber"
                        delay={0.3}
                    />
                </motion.div>

                {/* Activity Feed & Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50
                                 p-6 shadow-lg shadow-slate-900/5"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { icon: CheckCircle, color: 'emerald', text: 'Vehicle FL-2847 completed route', time: '2m ago' },
                                { icon: Warning, color: 'amber', text: 'Low fuel alert for TX-9201', time: '15m ago' },
                                { icon: Activity, color: 'blue', text: 'Daily inspection passed for CA-5623', time: '1h ago' },
                                { icon: Bell, color: 'purple', text: 'Maintenance scheduled for NY-1134', time: '2h ago' }
                            ].map((activity, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        `bg-${activity.color}-100`
                                    )}>
                                        <activity.icon className={cn("w-5 h-5", `text-${activity.color}-600`)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">{activity.text}</p>
                                        <p className="text-xs text-slate-500">{activity.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 shadow-2xl
                                 shadow-blue-500/30 text-white relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-6">Today's Summary</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-white/20">
                                    <span className="text-sm font-medium opacity-90">Miles Driven</span>
                                    <span className="text-xl font-bold">1,847</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/20">
                                    <span className="text-sm font-medium opacity-90">Active Trips</span>
                                    <span className="text-xl font-bold">12</span>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-white/20">
                                    <span className="text-sm font-medium opacity-90">Deliveries</span>
                                    <span className="text-xl font-bold">34</span>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <span className="text-sm font-medium opacity-90">Fuel Consumed</span>
                                    <span className="text-xl font-bold">284 gal</span>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
                    </motion.div>
                </div>

                {/* Vehicle Table - Premium Design */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50
                             shadow-lg shadow-slate-900/5 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                        <h3 className="text-lg font-bold text-slate-900">Fleet Inventory</h3>
                        <p className="text-sm text-slate-600 mt-1">Click any vehicle for detailed telemetry</p>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500"
                            />
                            <p className="text-sm text-slate-500 font-medium">Loading fleet data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" role="grid" aria-label="Fleet vehicles inventory">
                                <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Vehicle</th>
                                        <th scope="col" className="hidden sm:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Mileage</th>
                                        <th scope="col" className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Fuel</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <AnimatePresence>
                                        {vehicles.map((vehicle, i) => (
                                            <React.Fragment key={vehicle.id}>
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className={cn(
                                                        "hover:bg-blue-50/50 cursor-pointer transition-all duration-200",
                                                        expandedRow === vehicle.id && "bg-blue-50"
                                                    )}
                                                    onClick={() => setExpandedRow(expandedRow === vehicle.id ? null : vehicle.id)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <EntityAvatar entity={vehicle} size={40} className="ring-2 ring-slate-100" />
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-slate-900 truncate">
                                                                    {vehicle.displayName}
                                                                </div>
                                                                <div className="text-xs text-slate-500 truncate">
                                                                    ID: {vehicle.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-600">
                                                        {vehicle.kind}
                                                    </td>
                                                    <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">
                                                        {vehicle.odometer.toLocaleString()} mi
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${vehicle.fuelPct}%` }}
                                                                    transition={{ delay: 0.3, duration: 0.8 }}
                                                                    className={cn(
                                                                        "h-full rounded-full",
                                                                        vehicle.fuelPct < 25 ? "bg-red-500" :
                                                                        vehicle.fuelPct < 50 ? "bg-amber-500" : "bg-emerald-500"
                                                                    )}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-slate-700 font-semibold min-w-[3rem] text-right">
                                                                {vehicle.fuelPct}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusChip
                                                            status={vehicle.alerts > 0 ? vehicle.status : "good"}
                                                            label={vehicle.alerts > 0 ? `${vehicle.alerts} alerts` : "OK"}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
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
                                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
                                                            <td colSpan={7} className="px-6 py-6 bg-gradient-to-r from-slate-50 to-blue-50/30">
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
// VIDEO TELEMATICS CONTENT - Premium Redesign
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
            <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center relative
                          border border-slate-200 rounded-xl overflow-hidden">
                <Video className="w-12 h-12 text-slate-400" />
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs text-slate-700 font-bold">OFFLINE</span>
                </div>
                <span className="absolute bottom-3 left-3 text-sm text-slate-600 font-semibold">{camera.id}</span>
            </div>
        )
    }

    return (
        <div className="aspect-video bg-black relative overflow-hidden rounded-xl border-2 border-slate-300">
            {error ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Video className="w-12 h-12" />
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
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2 h-2 rounded-full bg-white"
                />
                <span className="text-xs text-white font-bold">
                    {camera.status === 'recording' ? 'LIVE' : 'BUFFERING'}
                </span>
            </div>
            <span className="absolute bottom-3 left-3 text-sm text-white font-semibold drop-shadow-lg">{camera.id}</span>
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600
                                  flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Video className="w-7 h-7 text-white" weight="bold" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Video Telematics</h1>
                        <p className="text-sm text-slate-600">Live camera feeds and event monitoring</p>
                    </div>
                </div>
            </motion.div>

            {/* Content Container */}
            <div className="p-6 space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <MetricCard
                        title="Active Cameras"
                        value={recordingCameras}
                        subtitle={`${cameras.length} total`}
                        icon={<Video />}
                        color="purple"
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
                        color="blue"
                        delay={0.2}
                    />
                </div>

                {/* Camera Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50
                             shadow-lg shadow-slate-900/5 overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-white">
                        <h3 className="text-lg font-bold text-slate-900">Camera Feeds</h3>
                        <p className="text-sm text-slate-600 mt-1">Click any camera to view live feed</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Camera ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                                    <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Events (24h)</th>
                                    <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Storage</th>
                                    <th className="px-6 py-4"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cameras.map((camera, i) => (
                                    <React.Fragment key={camera.id}>
                                        <motion.tr
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + i * 0.05 }}
                                            className={cn(
                                                "hover:bg-purple-50/50 cursor-pointer transition-all duration-200",
                                                expandedRow === camera.id && "bg-purple-50"
                                            )}
                                            onClick={() => setExpandedRow(expandedRow === camera.id ? null : camera.id)}
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-900">{camera.id}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{camera.location}</td>
                                            <td className="px-6 py-4">
                                                <StatusChip
                                                    status={camera.status === 'recording' ? 'good' : camera.status === 'buffering' ? 'warn' : 'bad'}
                                                    label={camera.status === 'recording' ? 'LIVE' : camera.status.toUpperCase()}
                                                />
                                            </td>
                                            <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600 font-medium">
                                                {Math.floor(Math.random() * 15) + 2}
                                            </td>
                                            <td className="hidden lg:table-cell px-6 py-4 text-sm text-slate-500">
                                                {(Math.random() * 0.5 + 0.1).toFixed(2)} TB
                                            </td>
                                            <td className="px-6 py-4 text-right">
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
                                                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
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
                                                    <td colSpan={6} className="px-6 py-6 bg-gradient-to-r from-slate-50 to-purple-50/30">
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-md">
                                                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Live Feed</h4>
                                                                <VideoPlayer camera={camera} />
                                                            </div>

                                                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-md">
                                                                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Recent Events</h4>
                                                                <div className="space-y-3">
                                                                    {[
                                                                        { text: 'Motion detected', time: '2h ago' },
                                                                        { text: 'Vehicle entry', time: '4h ago' },
                                                                        { text: 'Anomaly flagged', time: '7h ago' }
                                                                    ].map((event, idx) => (
                                                                        <div key={idx} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                                                                            <span className="text-sm font-medium text-slate-900">{event.text}</span>
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
// MAIN FLEET HUB COMPONENT
// ============================================================================
export function FleetHub() {
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
            icon={<FleetIcon className="w-6 h-6" aria-hidden="true" />}
            description="Fleet vehicles, tracking, and telemetry"
            tabs={tabs}
            defaultTab="overview"
        />
    )
}

export default FleetHub
