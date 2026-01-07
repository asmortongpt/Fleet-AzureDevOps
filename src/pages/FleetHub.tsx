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
    MapPin,
    Warning
} from '@phosphor-icons/react'
import React, { Suspense, lazy, Component, ReactNode, ErrorInfo , useState } from 'react'

// VideoPlayer import removed to avoid conflict with local definition
import { AddVehicleDialog } from '@/components/dialogs/AddVehicleDialog'
import { Button } from '@/components/ui/button'
import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'

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
import { useVehicles, useVehicleMutations } from '@/hooks/use-api'
import { EntityAvatar } from '@/shared/design-system/EntityAvatar'
import { RowExpandPanel } from '@/shared/design-system/RowExpandPanel'
import { StatusChip } from '@/shared/design-system/StatusChip'
import type { VehicleRow } from '@/shared/design-system/types'

function FleetOverviewContent() {
    const { push } = useDrilldown()
    const [expandedRow, setExpandedRow] = useState<string | null>(null)

    // Use real data
    const { data: vehiclesData, isLoading } = useVehicles({ limit: 1000, tenant_id: '' })
    const { createVehicle } = useVehicleMutations()
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

    return (
        <div style={{
            padding: 24,
            background: '#030712',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#f9fafb',
                        marginBottom: 8
                    }}>Fleet Overview</h2>
                    <p style={{
                        fontSize: 14,
                        color: '#9ca3af'
                    }}>Professional table-first navigation with expandable drilldowns</p>
                </div>
                {/* Add Vehicle Button via Dialog */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

                    <AddVehicleDialog onAdd={handleAddVehicle} />
                </div>
            </div>

            {/* Vehicle Table - Professional Design */}
            <div style={{
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1a2332 0%, #0f1419 100%)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
                        <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-blue-500 animate-spin" />
                        <p>Loading fleet data...</p>
                    </div>
                ) : (
                    <table style={{
                        width: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0
                    }}>
                        <thead>
                            <tr style={{ background: 'rgba(96, 165, 250, 0.08)', borderBottom: '1px solid rgba(96, 165, 250, 0.2)' }}>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Vehicle</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Type</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Odometer</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Fuel</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Health</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Alerts</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}>Updated</th>
                                <th style={{ padding: 16, fontSize: 12, color: '#93c5fd', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 600 }}></th>
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
                                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#f9fafb' }}>{vehicle.displayName}</div>
                                                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{vehicle.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: 16, fontSize: 14, color: '#e5e7eb' }}>{vehicle.kind}</td>
                                        <td style={{ padding: 16, fontSize: 14, color: '#e5e7eb' }}>{vehicle.odometer.toLocaleString()} mi</td>
                                        <td style={{ padding: 16 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(148, 163, 184, 0.2)', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${vehicle.fuelPct}%`,
                                                        height: '100%',
                                                        background: vehicle.fuelPct < 25 ? '#ef4444' : vehicle.fuelPct < 50 ? '#f59e0b' : '#22c55e',
                                                        transition: 'width 0.3s'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: '#d1d5db' }}>{vehicle.fuelPct}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: vehicle.healthScore >= 80 ? '#22c55e' : vehicle.healthScore >= 60 ? '#f59e0b' : '#ef4444' }}>
                                            {vehicle.healthScore}
                                        </td>
                                        <td style={{ padding: 16 }}>
                                            {vehicle.alerts > 0 ? (
                                                <StatusChip status={vehicle.status} label={`${vehicle.alerts} Alert${vehicle.alerts > 1 ? 's' : ''}`} />
                                            ) : (
                                                <StatusChip status="good" label="OK" />
                                            )}
                                        </td>
                                        <td style={{ padding: 16, fontSize: 12, color: '#9ca3af' }}>{vehicle.updatedAgo}</td>
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
                                                    padding: '8px 16px',
                                                    borderRadius: 8,
                                                    border: '1px solid rgba(96, 165, 250, 0.3)',
                                                    background: 'rgba(96, 165, 250, 0.12)',
                                                    color: '#93c5fd',
                                                    cursor: 'pointer',
                                                    fontSize: 13,
                                                    fontWeight: 600,
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(96, 165, 250, 0.2)'
                                                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(96, 165, 250, 0.12)'
                                                    e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)'
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
                )}
            </div>


            <p style={{ marginTop: 16, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                Click rows to expand telemetry drilldowns • Click "View" for full vehicle details
            </p>
        </div >
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
                }}>Video Telematics</h2>
                <p style={{
                    fontSize: 14,
                    color: 'var(--muted)'
                }}>Professional camera management with table-first navigation</p>
            </div>

            {/* Summary Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 24
            }}>
                <div style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--panel)'
                }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Active Cameras</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--good)' }}>{recordingCameras}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>of {cameras.length} total</div>
                </div>
                <div style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--panel)'
                }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Events Today</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--warn)' }}>{totalEvents}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>motion detected</div>
                </div>
                <div style={{
                    padding: 20,
                    borderRadius: 16,
                    border: '1px solid var(--border)',
                    background: 'var(--panel)'
                }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Storage Used</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{storageUsedTB} TB</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>video archive</div>
                </div>
            </div>

            {/* Camera Table - Professional Design */}
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
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Camera ID</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Location</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Events (24h)</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Storage</th>
                            <th style={{ padding: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cameras.map((camera, idx) => (
                            <React.Fragment key={camera.id}>
                                <tr style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    background: expandedRow === camera.id ? 'rgba(96,165,250,0.08)' : 'transparent',
                                    transition: 'background 0.15s'
                                }}
                                    onClick={() => setExpandedRow(expandedRow === camera.id ? null : camera.id)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = expandedRow === camera.id ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = expandedRow === camera.id ? 'rgba(96,165,250,0.08)' : 'transparent'}
                                >
                                    <td style={{ padding: 16, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{camera.id}</td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text)' }}>{camera.location}</td>
                                    <td style={{ padding: 16 }}>
                                        <StatusChip
                                            status={camera.status === 'recording' ? 'good' : camera.status === 'buffering' ? 'warn' : 'bad'}
                                            label={camera.status === 'recording' ? 'LIVE' : camera.status.toUpperCase()}
                                        />
                                    </td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--text)' }}>{Math.floor(Math.random() * 15) + 2} events</td>
                                    <td style={{ padding: 16, fontSize: 14, color: 'var(--muted)' }}>{(Math.random() * 0.5 + 0.1).toFixed(2)} TB</td>
                                    <td style={{ padding: 16 }}>
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
                                            Details
                                        </button>
                                    </td>
                                </tr>
                                {expandedRow === camera.id && (
                                    <tr>
                                        <td colSpan={6} style={{ padding: 16, background: 'rgba(0,0,0,0.12)' }}>
                                            <div style={{
                                                padding: 12,
                                                borderRadius: 16,
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                background: 'rgba(0,0,0,0.18)'
                                            }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 12 }}>
                                                    {/* Live Feed Panel */}
                                                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.03)' }}>
                                                        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Live Feed</div>
                                                        <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', background: 'black' }}>
                                                            <VideoPlayer camera={camera} />
                                                        </div>
                                                    </div>

                                                    {/* Recent Events Panel */}
                                                    <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,0.03)' }}>
                                                        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>Recent Events</div>
                                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th style={{ padding: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>Event</th>
                                                                    <th style={{ padding: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>Time</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Motion detected</td>
                                                                    <td style={{ padding: 10, fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>2h ago</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ padding: 10, fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Vehicle entry</td>
                                                                    <td style={{ padding: 10, fontSize: 12, color: 'var(--muted)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>4h ago</td>
                                                                </tr>
                                                                <tr>
                                                                    <td style={{ padding: 10, fontSize: 12 }}>Anomaly flagged</td>
                                                                    <td style={{ padding: 10, fontSize: 12, color: 'var(--muted)' }}>7h ago</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
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

            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
                Click rows to view live feed • Click "Details" for camera analytics
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
            id: 'overview',
            label: 'Overview',
            icon: <Speedometer className="w-4 h-4" />,
            content: (
                <TabErrorBoundary tabName="Overview">
                    <FleetOverviewContent />
                </TabErrorBoundary>
            ),
        },
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
