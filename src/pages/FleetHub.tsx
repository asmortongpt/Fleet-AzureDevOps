/**
 * FleetHub - Premium Fleet Management Hub
 *
 * Production-ready, compact layout with error-resilient tabs.
 * Route: /fleet
 *
 * PROFESSIONALLY REDESIGNED: Clean white cards, high contrast typography, muted colors
 * Following Salesforce Lightning/Microsoft 365 enterprise standards
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
import React, { Suspense, lazy, Component, ReactNode, ErrorInfo } from 'react'

// VideoPlayer import removed to avoid conflict with local definition
import { Button } from '@/components/ui/button'
import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'

// Lazy load heavy components for performance
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const LiveFleetMap = lazy(() => import('@/components/Maps/LiveFleetMap').then(m => ({ default: m.LiveFleetMap })))
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
                <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50 dark:bg-slate-900">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800 p-8 text-center max-w-md shadow-lg">
                        <Warning className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Tab Temporarily Unavailable</h3>
                        <p className="text-base text-slate-600 dark:text-slate-400 mb-6">
                            The {this.props.tabName} feature is currently unavailable. Our team has been notified.
                        </p>
                        <Button
                            onClick={() => this.setState({ hasError: false, error: undefined })}
                            variant="outline"
                            size="sm"
                            className="border-amber-600 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
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
        <div className="p-6 sm:p-8 space-y-6 animate-pulse bg-slate-50 dark:bg-slate-900">
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
        </div>
    )
}

// ============================================================================
// FLEET OVERVIEW CONTENT - Professional Table-First Navigation Pattern
// ============================================================================
import { useDrilldown } from '@/contexts/DrilldownContext'
import { EntityAvatar } from '@/shared/design-system/EntityAvatar'
import { StatusChip } from '@/shared/design-system/StatusChip'
import { RowExpandPanel } from '@/shared/design-system/RowExpandPanel'
import type { VehicleRow } from '@/shared/design-system/types'
import { useState } from 'react'

function FleetOverviewContent() {
    const { push } = useDrilldown()
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    // Sample vehicle data - will be replaced with real API data
    const vehicles: VehicleRow[] = [
        {
            entityType: 'vehicle',
            id: 'VEH-001',
            displayName: 'Truck 42',
            status: 'good',
            kind: 'Semi Truck',
            odometer: 142500,
            fuelPct: 72,
            healthScore: 94,
            alerts: 0,
            updatedAgo: '2m ago'
        },
        {
            entityType: 'vehicle',
            id: 'VEH-002',
            displayName: 'Van 18',
            status: 'warn',
            kind: 'Cargo Van',
            odometer: 89200,
            fuelPct: 45,
            healthScore: 78,
            alerts: 2,
            updatedAgo: '5m ago'
        },
        {
            entityType: 'vehicle',
            id: 'VEH-003',
            displayName: 'Truck 07',
            status: 'bad',
            kind: 'Box Truck',
            odometer: 203400,
            fuelPct: 15,
            healthScore: 52,
            alerts: 5,
            updatedAgo: '1m ago'
        }
    ]

    return (
        <div style={{
            padding: 24,
            background: 'var(--bg)',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h2 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 8
                }}>Fleet Overview</h2>
                <p style={{
                    fontSize: 14,
                    color: 'var(--muted)'
                }}>Professional table-first navigation with expandable drilldowns</p>
            </div>

            {/* Vehicle Table - Professional Design */}
            <div style={{
                border: '1px solid var(--border)',
                borderRadius: 16,
                background: 'var(--panel)',
                overflow: 'hidden'
            }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: 0
                }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Vehicle</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Type</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Odometer</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Fuel</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Health</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Alerts</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Updated</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(vehicle => (
                            <React.Fragment key={vehicle.id}>
                                <tr style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    background: expandedRow === vehicle.id ? 'rgba(96,165,250,0.08)' : 'transparent',
                                    transition: 'background 0.15s'
                                }}
                                    onClick={() => setExpandedRow(expandedRow === vehicle.id ? null : vehicle.id)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = expandedRow === vehicle.id ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = expandedRow === vehicle.id ? 'rgba(96,165,250,0.08)' : 'transparent'}
                                >
                                    <td style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <EntityAvatar entity={vehicle} size={38} />
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{vehicle.displayName}</div>
                                                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{vehicle.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text)' }}>{vehicle.kind}</td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text)' }}>{vehicle.odometer.toLocaleString()} mi</td>
                                    <td style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${vehicle.fuelPct}%`,
                                                    height: '100%',
                                                    background: vehicle.fuelPct < 25 ? 'var(--bad)' : vehicle.fuelPct < 50 ? 'var(--warn)' : 'var(--good)',
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{vehicle.fuelPct}%</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: vehicle.healthScore >= 80 ? 'var(--good)' : vehicle.healthScore >= 60 ? 'var(--warn)' : 'var(--bad)' }}>
                                        {vehicle.healthScore}
                                    </td>
                                    <td style={{ padding: 16 }}>
                                        {vehicle.alerts > 0 ? (
                                            <StatusChip status={vehicle.status} label={`${vehicle.alerts} Alert${vehicle.alerts > 1 ? 's' : ''}`} />
                                        ) : (
                                            <StatusChip status="good" label="OK" />
                                        )}
                                    </td>
                                    <td style={{ padding: 16, fontSize: 12, color: 'var(--muted)' }}>{vehicle.updatedAgo}</td>
                                    <td style={{ padding: 16 }}>
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
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 12,
                                                border: '1px solid var(--border)',
                                                background: 'rgba(96,165,250,0.15)',
                                                color: 'var(--text)',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                fontWeight: 600
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === vehicle.id && (
                                    <tr>
                                        <td colSpan={8} style={{ padding: 16, background: 'rgba(0,0,0,0.12)' }}>
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

            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                Click rows to expand telemetry drilldowns • Click "View" for full vehicle details
            </p>
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

    // Camera feeds - streamUrl can be set to real HLS/RTSP-to-HLS URL
    const cameras: CameraFeed[] = [
        { id: 'CAM-001', location: 'Front Gate', status: 'recording', streamUrl: undefined },
        { id: 'CAM-002', location: 'Loading Bay A', status: 'recording', streamUrl: undefined },
        { id: 'CAM-003', location: 'Parking Lot', status: 'recording', streamUrl: undefined },
        { id: 'CAM-004', location: 'Service Bay', status: 'offline', streamUrl: undefined },
    ]

    const recordingCameras = cameras.filter(c => c.status === 'recording').length

    return (
        <div className="p-6 sm:p-8 space-y-8 bg-slate-50 dark:bg-slate-900 h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Video Telematics</h2>
                    <p className="text-base text-slate-600 dark:text-slate-400">Live camera feeds from fleet vehicles</p>
                </div>
                <StatusDot status="online" label={`${recordingCameras} Recording`} />
            </div>

            {/* Stats - Clean White Cards */}
            <div className="grid grid-cols-3 gap-6">
                <StatCard
                    title="Cameras"
                    value="148"
                    variant="success"
                    icon={<Video className="w-5 h-5" />}
                    onClick={() => push({
                        id: 'cameras-online',
                        type: 'cameras-online',
                        label: 'Cameras Online',
                        data: { filter: 'online' }
                    })}
                    drilldownLabel="View camera status"
                />
                <StatCard
                    title="Events Today"
                    value="23"
                    variant="warning"
                    onClick={() => push({
                        id: 'video-events',
                        type: 'video-events',
                        label: 'Video Events Today',
                        data: { filter: 'today' }
                    })}
                    drilldownLabel="View video events"
                />
                <StatCard
                    title="Storage"
                    value="2.4 TB"
                    variant="default"
                    onClick={() => push({
                        id: 'video-storage',
                        type: 'video-storage',
                        label: 'Video Storage',
                        data: { view: 'storage' }
                    })}
                    drilldownLabel="View storage details"
                />
            </div>

            {/* Camera Grid - Clean Professional Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
                {cameras.map(camera => (
                    <div key={camera.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200 shadow-sm">
                        <VideoPlayer camera={camera} />
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{camera.location}</p>
                        </div>
                    </div>
                ))}
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 text-center font-medium">
                Configure camera stream URLs in the Video Management settings
            </p>
        </div>
    )
}

// ============================================================================
// MAIN FLEET HUB COMPONENT
// ============================================================================
export function FleetHub() {
    const tabs: HubTab[] = [
        {
            id: 'google-maps',
            label: 'Live Tracking',
            icon: <MapPin className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="Live Tracking">
                    <Suspense fallback={<TabLoadingFallback />}>
                        <LiveFleetMap />
                    </Suspense>
                </TabErrorBoundary>
            ),
        },
        {
            id: 'map',
            label: 'Advanced Map',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="Advanced Map">
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
            defaultTab="overview"
        />
    )
}

export default FleetHub
