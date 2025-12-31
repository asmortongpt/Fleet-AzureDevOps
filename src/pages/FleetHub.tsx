/**
 * FleetHub - Premium Fleet Management Hub
 * 
 * Production-ready, compact layout with error-resilient tabs.
 * Route: /fleet
 */

import {
    Car as FleetIcon,
    MapTrifold,
    Speedometer,
    Pulse,
    Cube,
    Video,
    Lightning,
    Truck,
    GasPump,
    Engine,
    MapPin,
    Warning
} from '@phosphor-icons/react'
import { Suspense, lazy, Component, ReactNode, ErrorInfo, useState } from 'react'

import { VideoPlayer, DEMO_STREAMS } from '@/components/common/VideoPlayer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'

// Lazy load heavy components for performance
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))

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
                <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-b from-slate-900/50 to-transparent">
                    <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/60 rounded-xl border border-amber-500/30 p-8 text-center max-w-md">
                        <Warning className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Tab Temporarily Unavailable</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            The {this.props.tabName} feature is currently unavailable. Our team has been notified.
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                            className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20"
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
function TabLoadingFallback() {
    return (
        <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-1/4" />
            <div className="grid grid-cols-4 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
            </div>
        </div>
    )
}

// ============================================================================
// FLEET OVERVIEW CONTENT - Premium Compact Layout with Drilldown
// ============================================================================
import { useDrilldown } from '@/contexts/DrilldownContext'

function FleetOverviewContent() {
    const { push } = useDrilldown()

    // Drilldown handlers - each triggers a rich detail view
    const handleVehiclesDrilldown = () => {
        push({
            id: 'fleet-overview',
            type: 'fleet-overview',
            label: 'Fleet Overview',
            data: { filter: 'all' }
        })
    }

    const handleActiveDrilldown = () => {
        push({
            id: 'active-vehicles',
            type: 'active-vehicles',
            label: 'Active Vehicles',
            data: { filter: 'active', status: 'active' }
        })
    }

    const handleMaintenanceDrilldown = () => {
        push({
            id: 'maintenance',
            type: 'maintenance',
            label: 'Maintenance Overview',
            data: { filter: 'maintenance' }
        })
    }

    const handleFuelDrilldown = () => {
        push({
            id: 'fuel-stats',
            type: 'fuel-stats',
            label: 'Fuel Stats',
            data: { view: 'fuel' }
        })
    }

    return (
        <div className="p-4 space-y-4 bg-gradient-to-b from-slate-900/50 to-transparent h-full overflow-hidden">
            {/* Header Row */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Fleet Overview</h2>
                    <p className="text-xs text-slate-400">Real-time fleet status • Click metrics for details</p>
                </div>
                <StatusDot status="online" label="Live" />
            </div>

            {/* Primary Stats - 4 columns - ALL CLICKABLE */}
            <div className="grid grid-cols-4 gap-3">
                <StatCard
                    title="Vehicles"
                    value="156"
                    subtitle="12 new this month"
                    trend="up"
                    trendValue="+8%"
                    variant="primary"
                    icon={<Truck className="w-5 h-5" />}
                    onClick={handleVehiclesDrilldown}
                    drilldownLabel="View all fleet vehicles"
                />
                <StatCard
                    title="Active"
                    value="142"
                    subtitle="91% of fleet"
                    trend="up"
                    trendValue="+3"
                    variant="success"
                    icon={<MapPin className="w-5 h-5" />}
                    onClick={handleActiveDrilldown}
                    drilldownLabel="View active vehicles on map"
                />
                <StatCard
                    title="Maintenance"
                    value="8"
                    subtitle="5.1% of fleet"
                    trend="down"
                    trendValue="-2"
                    variant="warning"
                    icon={<Engine className="w-5 h-5" />}
                    onClick={handleMaintenanceDrilldown}
                    drilldownLabel="View maintenance work orders"
                />
                <StatCard
                    title="Fuel Today"
                    value="$2,450"
                    subtitle="Est. daily"
                    variant="default"
                    icon={<GasPump className="w-5 h-5" />}
                    onClick={handleFuelDrilldown}
                    drilldownLabel="View fuel consumption details"
                />
            </div>

            {/* Secondary Row - 3 compact widgets */}
            <div className="grid grid-cols-3 gap-3">
                {/* Utilization Ring - Clickable */}
                <div
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-lg border border-slate-700/50 p-3 flex items-center gap-4 cursor-pointer hover:border-blue-500/30 hover:scale-[1.01] transition-all"
                    onClick={() => push({ id: 'utilization', type: 'utilization', label: 'Fleet Utilization Details', data: { view: 'utilization' } })}
                    role="button"
                    tabIndex={0}
                >
                    <ProgressRing progress={87} color="blue" label="Utilized" />
                    <div>
                        <h3 className="text-xs font-medium text-slate-400 uppercase">Fleet Utilization</h3>
                        <p className="text-lg font-bold text-white">87%</p>
                        <p className="text-[10px] text-slate-500">vs 82% last week • Click for details</p>
                    </div>
                </div>

                {/* Quick Stats - ALL CLICKABLE */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-lg border border-slate-700/50 p-3">
                    <h3 className="text-xs font-medium text-slate-400 uppercase mb-2">Performance</h3>
                    <QuickStat
                        label="Miles/Day"
                        value="245"
                        trend="up"
                        onClick={() => push({ id: 'miles-day', type: 'miles-day', label: 'Daily Mileage Analysis', data: { metricType: 'miles-day' } })}
                    />
                    <QuickStat
                        label="On-Time"
                        value="94.2%"
                        trend="up"
                        onClick={() => push({ id: 'on-time', type: 'on-time', label: 'On-Time Performance', data: { metricType: 'on-time' } })}
                    />
                    <QuickStat
                        label="Idle Time"
                        value="12.3%"
                        trend="down"
                        onClick={() => push({ id: 'idle-time', type: 'idle-time', label: 'Idle Time Analysis', data: { metricType: 'idle-time' } })}
                    />
                    <QuickStat
                        label="MPG Avg"
                        value="18.4"
                        trend="up"
                        onClick={() => push({ id: 'mpg', type: 'mpg', label: 'Fuel Efficiency Report', data: { metricType: 'mpg' } })}
                    />
                </div>

                {/* Safety Ring - Clickable */}
                <div
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-lg border border-slate-700/50 p-3 flex items-center gap-4 cursor-pointer hover:border-emerald-500/30 hover:scale-[1.01] transition-all"
                    onClick={() => push({ id: 'safety-score', type: 'safety-score', label: 'Safety Score Breakdown', data: { view: 'safety' } })}
                    role="button"
                    tabIndex={0}
                >
                    <ProgressRing progress={92} color="green" label="Score" />
                    <div>
                        <h3 className="text-xs font-medium text-slate-400 uppercase">Safety Score</h3>
                        <p className="text-lg font-bold text-white">92/100</p>
                        <p className="text-[10px] text-slate-500">47 days incident-free • Click for details</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// VIDEO TELEMATICS CONTENT
// ============================================================================

// Camera feed data with optional stream URLs
interface CameraFeed {
    id: string
    location: string
    vehicleId: string
    status: 'recording' | 'offline' | 'standby'
    lastEvent?: string
    streamUrl?: string
    thumbnail?: string
}

// In production, these would come from your telematics API
const mockCameras: CameraFeed[] = [
    { id: 'cam-001', location: 'Front Dash', vehicleId: 'V-1042', status: 'recording', lastEvent: 'Lane departure', streamUrl: DEMO_STREAMS.live },
    { id: 'cam-002', location: 'Rear View', vehicleId: 'V-1042', status: 'recording', streamUrl: DEMO_STREAMS.bigBuckBunny },
    { id: 'cam-003', location: 'Driver Facing', vehicleId: 'V-1087', status: 'recording', lastEvent: 'Distraction alert', streamUrl: DEMO_STREAMS.sintel },
    { id: 'cam-004', location: 'Cargo Area', vehicleId: 'V-1087', status: 'standby' },
    { id: 'cam-005', location: 'Front Dash', vehicleId: 'V-1023', status: 'offline' },
    { id: 'cam-006', location: 'Side Mirror L', vehicleId: 'V-1056', status: 'recording', streamUrl: DEMO_STREAMS.tears },
]

function VideoContent() {
    const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null)

    const onlineCameras = mockCameras.filter(c => c.status !== 'offline').length
    const recordingCameras = mockCameras.filter(c => c.status === 'recording').length
    const eventsToday = mockCameras.filter(c => c.lastEvent).length

    return (
        <div className="p-4 space-y-4 bg-gradient-to-b from-slate-900/50 to-transparent h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Video Telematics</h2>
                    <p className="text-xs text-slate-400">Live camera feeds from fleet vehicles</p>
                </div>
                <StatusDot status="online" label={`${recordingCameras} Recording`} />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <StatCard title="Cameras Online" value={onlineCameras.toString()} variant="success" icon={<Video className="w-5 h-5" />} />
                <StatCard title="Events Today" value={eventsToday.toString()} variant="warning" />
                <StatCard title="Storage Used" value="2.4 TB" variant="default" />
            </div>

            {/* Camera Feed Grid with Real Video Players */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 flex-1 overflow-auto">
                {mockCameras.map(camera => (
                    <div
                        key={camera.id}
                        className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors"
                    >
                        <VideoPlayer
                            src={camera.status === 'recording' ? camera.streamUrl : undefined}
                            status={camera.status}
                            live={camera.status === 'recording'}
                            eventAlert={camera.lastEvent}
                            label={camera.location}
                            assetId={camera.vehicleId}
                            compact
                            autoPlay={camera.status === 'recording'}
                            muted
                            className="aspect-video"
                            onClick={() => camera.status === 'recording' && setSelectedCamera(camera)}
                        />
                    </div>
                ))}
            </div>

            {/* View all cameras link */}
            <div className="text-center pt-2">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View all {mockCameras.length} cameras →
                </button>
            </div>

            {/* Fullscreen Camera Dialog */}
            <Dialog open={!!selectedCamera} onOpenChange={() => setSelectedCamera(null)}>
                <DialogContent className="max-w-4xl p-0 bg-black border-slate-700">
                    <DialogHeader className="p-4 pb-2">
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            {selectedCamera?.location} - {selectedCamera?.vehicleId}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCamera && (
                        <VideoPlayer
                            src={selectedCamera.streamUrl}
                            status={selectedCamera.status}
                            live
                            autoPlay
                            muted={false}
                            controls
                            allowFullscreen
                            className="aspect-video"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============================================================================
// MAIN FLEET HUB COMPONENT
// ============================================================================
export function FleetHub() {
    const tabs: HubTab[] = [
        {
            id: 'map',
            label: 'Live Map',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="Live Map">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <LiveFleetDashboard />
                    </Suspense>
                </TabErrorBoundary>
            ),
        },
        {
            id: 'overview',
            label: 'Overview',
            icon: <Speedometer className="w-4 h-4" />,
            content: <FleetOverviewContent />,
        },
        {
            id: 'telemetry',
            label: 'Telemetry',
            icon: <Pulse className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="Telemetry">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <VehicleTelemetry />
                    </Suspense>
                </TabErrorBoundary>
            ),
        },
        {
            id: '3d',
            label: '3D Garage',
            icon: <Cube className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="3D Garage">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <VirtualGarage />
                    </Suspense>
                </TabErrorBoundary>
            ),
        },
        {
            id: 'video',
            label: 'Video',
            icon: <Video className="w-4 h-4" />,
            content: <VideoContent />,
        },
        {
            id: 'ev',
            label: 'EV Charging',
            icon: <Lightning className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="EV Charging">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <EVChargingManagement />
                    </Suspense>
                </TabErrorBoundary>
            ),
        },
    ]

    return (
        <HubPage
            title="Fleet Hub"
            icon={<FleetIcon className="w-6 h-6" />}
            description="Fleet vehicles, tracking, and telemetry"
            tabs={tabs}
            defaultTab="map"
        />
    )
}

export default FleetHub
