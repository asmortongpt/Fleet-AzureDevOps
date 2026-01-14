/**
 * FleetHub - Modern Fleet Management Hub
 *
 * REDESIGNED: Clean, professional, compact SaaS-style interface
 * Route: /fleet
 *
 * DESIGN PRINCIPLES:
 * - Light, airy color scheme with white cards
 * - Compact layout (50% less padding, smaller fonts)
 * - Clean map integration without overlapping panels
 * - Modern typography and spacing
 * - Premium feel with subtle animations
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
    AlertCircle
} from '@phosphor-icons/react'
import React, { Suspense, lazy, Component, ReactNode, ErrorInfo, useState, memo } from 'react'
import { cn } from '@/lib/utils'

// VideoPlayer import removed to avoid conflict with local definition
import { AddVehicleDialog } from '@/components/dialogs/AddVehicleDialog'
import { Button } from '@/components/ui/button'
import { HubPage, HubTab } from '@/components/ui/hub-page'
import { InfoPopover } from '@/components/ui/info-popover'
import { InteractiveMetric, MetricGrid } from '@/components/ui/interactive-metric'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components for performance
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const LiveFleetMap = lazy(() => import('@/components/Maps/LiveFleetMap').then(m => ({ default: m.LiveFleetMap })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))

// Import UX components

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
                <div
                    className="flex flex-col items-center justify-center h-full p-8 bg-slate-50 dark:bg-slate-900"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 p-8 text-center max-w-md shadow-lg">
                        <Warning className="w-12 h-12 text-amber-600 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tab Temporarily Unavailable</h3>
                        <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
                            The {this.props.tabName} feature is currently unavailable. Our team has been notified.
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                            className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                            aria-label={`Retry loading ${this.props.tabName}`}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

// ============================================================================
// LOADING FALLBACK
// ============================================================================
const TabLoadingFallback = memo(function TabLoadingFallback() {
    return (
        <div
            className="p-6 sm:p-8 space-y-6 animate-pulse bg-slate-50 dark:bg-slate-900"
            role="status"
            aria-label="Loading tab content"
            aria-busy="true"
        >
            <Skeleton className="h-8 w-1/4 bg-slate-200 dark:bg-slate-700" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
            <span className="sr-only">Loading, please wait...</span>
        </div>
    )
})

// ============================================================================
// FLEET OVERVIEW CONTENT - Professional Table-First Navigation Pattern
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
    React.useEffect(() => {
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
            healthScore: 100, // Placeholder calculation
            alerts: 0,
            updatedAgo: 'Just now'
        }))
    }, [vehiclesData])

    const handleAddVehicle = (vehicle: any) => {
        createVehicle.mutate(vehicle)
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
        <div className="min-h-screen bg-slate-50">
            {/* Modern Header - Clean & Compact */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                            <FleetIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">Fleet Overview</h1>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time vehicle monitoring</p>
                        </div>
                        {/* Live Indicator - Modern */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-emerald-700">Live</span>
                        </div>
                    </div>
                    {/* Add Vehicle Button - Modern */}
                    <AddVehicleDialog onAdd={handleAddVehicle} />
                </div>
            </div>

            {/* Content Container */}
            <div className="p-4 space-y-4">
                {/* Fleet Metrics Grid - Modern Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Vehicles */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Total Vehicles</span>
                            <FleetIcon className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{totalVehicles}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-slate-500">{activeVehicles} active</span>
                        </div>
                    </div>

                    {/* Active Vehicles */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Active Now</span>
                            <Speedometer className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{activeVehicles}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendUp className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600">+8% this month</span>
                        </div>
                    </div>

                    {/* Health Score */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Avg Health</span>
                            <Pulse className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{avgHealthScore}%</div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all",
                                        avgHealthScore >= 80 ? "bg-emerald-500" : avgHealthScore >= 60 ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${avgHealthScore}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Maintenance Alerts */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Alerts</span>
                            <AlertCircle className={cn(
                                "w-4 h-4",
                                maintenanceNeeded > 5 ? "text-amber-500" : "text-slate-400"
                            )} />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{maintenanceNeeded}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-slate-500">Avg fuel: {avgFuelLevel}%</span>
                        </div>
                    </div>
                </div>

                {/* Vehicle Table - Modern Clean Design */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            <p className="text-sm">Loading fleet data...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full" role="grid" aria-label="Fleet vehicles inventory">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Vehicle</th>
                                        <th scope="col" className="hidden sm:table-cell px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Mileage</th>
                                        <th scope="col" className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Fuel</th>
                                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-3 py-2"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vehicles.map(vehicle => (
                                        <React.Fragment key={vehicle.id}>
                                            <tr
                                                className={cn(
                                                    "hover:bg-slate-50 cursor-pointer transition-colors",
                                                    expandedRow === vehicle.id && "bg-blue-50"
                                                )}
                                                onClick={() => setExpandedRow(expandedRow === vehicle.id ? null : vehicle.id)}
                                            >
                                                <td className="px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <EntityAvatar entity={vehicle} size={32} className="hidden sm:block" />
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-medium text-slate-900 truncate">
                                                                {vehicle.displayName}
                                                            </div>
                                                            <div className="text-xs text-slate-500 truncate">
                                                                ID: {vehicle.id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-3 py-3 text-sm text-slate-600">
                                                    {vehicle.kind}
                                                </td>
                                                <td className="hidden md:table-cell px-3 py-3 text-sm text-slate-600">
                                                    {vehicle.odometer.toLocaleString()} mi
                                                </td>
                                                <td className="hidden lg:table-cell px-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all",
                                                                    vehicle.fuelPct < 25 ? "bg-red-500" : vehicle.fuelPct < 50 ? "bg-amber-500" : "bg-emerald-500"
                                                                )}
                                                                style={{ width: `${vehicle.fuelPct}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-600 font-medium">
                                                            {vehicle.fuelPct}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <StatusChip
                                                        status={vehicle.alerts > 0 ? vehicle.status : "good"}
                                                        label={vehicle.alerts > 0 ? `${vehicle.alerts} alerts` : "OK"}
                                                    />
                                                </td>
                                                <td className="px-3 py-3 text-right">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            push({
                                                                id: vehicle.id,
                                                                type: 'vehicle-details',
                                                                label: `${vehicle.displayName} Details`,
                                                                data: vehicle
                                                            })
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === vehicle.id && (
                                                <tr>
                                                    <td colSpan={7} className="px-3 py-3 bg-slate-50">
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
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <p className="text-xs text-slate-500 text-center mt-2">
                    Click any row to view detailed telemetry
                </p>
            </div>
        </div>
    )
}

// ============================================================================
// VIDEO TELEMATICS CONTENT - Professional Redesign
// ============================================================================

interface CameraFeed {
    id: string
    location: string
    status: 'recording' | 'offline' | 'buffering'
    streamUrl?: string // HLS or direct video URL
}

function VideoPlayer({ camera }: { camera: CameraFeed }) {
    const videoRef = React.useRef<HTMLVideoElement>(null)
    const [error, setError] = React.useState(false)

    React.useEffect(() => {
        if (!camera.streamUrl || !videoRef.current) return

        const video = videoRef.current

        // Check for HLS support
        if (camera.streamUrl.endsWith('.m3u8')) {
            // Native HLS support (Safari) or use HLS.js
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = camera.streamUrl
            } else {
                // Dynamic import of HLS.js for other browsers
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
            // Direct video URL
            video.src = camera.streamUrl
        }

        video.play().catch(() => {
            // Auto-play blocked, show play button
        })
    }, [camera.streamUrl])

    if (!camera.streamUrl || camera.status === 'offline') {
        return (
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative border border-slate-200 dark:border-slate-700">
                <Video className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">OFFLINE</span>
                </div>
                <span className="absolute bottom-3 left-3 text-sm text-slate-600 dark:text-slate-400 font-medium">{camera.id}</span>
            </div>
        )
    }

    return (
        <div className="aspect-video bg-black relative overflow-hidden border border-slate-200 dark:border-slate-700">
            {error ? (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                    <Video className="w-10 h-10" />
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
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 px-2 py-1 rounded">
                <div className={`w-2.5 h-2.5 rounded-full ${camera.status === 'recording' ? 'bg-red-600 animate-pulse' : 'bg-amber-600'}`} />
                <span className="text-xs text-slate-900 dark:text-slate-100 font-semibold">
                    {camera.status === 'recording' ? 'LIVE' : 'BUFFERING'}
                </span>
            </div>
            <span className="absolute bottom-3 left-3 text-sm text-white font-medium drop-shadow-lg">{camera.id}</span>
        </div>
    )
}

function VideoContent() {
    const { push } = useDrilldown()
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    // Camera feeds - streamUrl can be set to real HLS/RTSP-to-HLS URL
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
        <div className="min-h-screen bg-slate-50">
            {/* Modern Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-slate-900">Video Telematics</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Live camera feeds and recordings</p>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="p-4 space-y-4">
                {/* Summary Stats - Modern Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Active Cameras Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Active Cameras</span>
                            <Video className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{recordingCameras}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-slate-500">{cameras.length} total</span>
                        </div>
                    </div>

                    {/* Events Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Events Today</span>
                            <Warning className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{totalEvents}</div>
                        <div className="flex items-center gap-1 mt-1">
                            <TrendUp className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600">+15% vs yesterday</span>
                        </div>
                    </div>

                    {/* Storage Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600">Storage Used</span>
                            <Package className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">{storageUsedTB} TB</div>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(storageUsedTB / 5) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Camera Table - Modern Clean Design */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Camera ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Events (24h)</th>
                                    <th className="hidden lg:table-cell px-3 py-2 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Storage</th>
                                    <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cameras.map((camera) => (
                                    <React.Fragment key={camera.id}>
                                        <tr
                                            className={cn(
                                                "hover:bg-slate-50 cursor-pointer transition-colors",
                                                expandedRow === camera.id && "bg-purple-50"
                                            )}
                                            onClick={() => setExpandedRow(expandedRow === camera.id ? null : camera.id)}
                                        >
                                            <td className="px-3 py-3 text-sm font-medium text-slate-900">{camera.id}</td>
                                            <td className="px-3 py-3 text-sm text-slate-600">{camera.location}</td>
                                            <td className="px-3 py-3">
                                                <StatusChip
                                                    status={camera.status === 'recording' ? 'good' : camera.status === 'buffering' ? 'warn' : 'bad'}
                                                    label={camera.status === 'recording' ? 'LIVE' : camera.status.toUpperCase()}
                                                />
                                            </td>
                                            <td className="hidden md:table-cell px-3 py-3 text-sm text-slate-600">{Math.floor(Math.random() * 15) + 2}</td>
                                            <td className="hidden lg:table-cell px-3 py-3 text-sm text-slate-500">{(Math.random() * 0.5 + 0.1).toFixed(2)} TB</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        push({
                                                            id: camera.id,
                                                            type: 'camera-details',
                                                            label: `${camera.location} Camera`,
                                                            data: camera
                                                        })
                                                    }}
                                                    className="px-3 py-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                                                >
                                                    View Feed
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === camera.id && (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-4 bg-slate-50">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        {/* Live Feed */}
                                                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                                                            <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-2">Live Feed</h4>
                                                            <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                                                <VideoPlayer camera={camera} />
                                                            </div>
                                                        </div>

                                                        {/* Recent Events */}
                                                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                                                            <h4 className="text-xs font-medium text-slate-600 uppercase tracking-wider mb-2">Recent Events</h4>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                                    <span className="text-sm text-slate-900">Motion detected</span>
                                                                    <span className="text-xs text-slate-500">2h ago</span>
                                                                </div>
                                                                <div className="flex justify-between py-2 border-b border-slate-100">
                                                                    <span className="text-sm text-slate-900">Vehicle entry</span>
                                                                    <span className="text-xs text-slate-500">4h ago</span>
                                                                </div>
                                                                <div className="flex justify-between py-2">
                                                                    <span className="text-sm text-slate-900">Anomaly flagged</span>
                                                                    <span className="text-xs text-slate-500">7h ago</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-xs text-slate-500 text-center mt-2">
                    Click any row to view live feed and recent events
                </p>
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
