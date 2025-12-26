/**
 * FleetHub - Consolidated Fleet Management Hub
 * 
 * Consolidates 12 fleet-related screens into one hub page:
 * - Live Fleet Dashboard (Map Tab) ← live-fleet-dashboard
 * - Fleet Dashboard (Overview Tab) ← dashboard
 * - GPS Tracking → Map Tab
 * - GIS Command Center → Map Tab
 * - Traffic Cameras → Map Tab
 * - Geofences → Map Tab
 * - Vehicle Telemetry → Telemetry Tab
 * - Virtual Garage → 3D Tab
 * - Video Telematics → Video Tab
 * - EV Charging → EV Tab
 * - Map Layers → Map Tab
 * 
 * Route: /fleet
 */

import {
    Car as FleetIcon,
    MapTrifold,
    Speedometer,
    Pulse,
    Cube,
    Video,
    Lightning
} from '@phosphor-icons/react'
import { Suspense, lazy } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

// Lazy load heavy components for performance
const LiveFleetDashboard = lazy(() => import('@/components/dashboard/LiveFleetDashboard').then(m => ({ default: m.LiveFleetDashboard })))
const VehicleTelemetry = lazy(() => import('@/components/modules/fleet/VehicleTelemetry').then(m => ({ default: m.VehicleTelemetry })))
const VirtualGarage = lazy(() => import('@/components/modules/fleet/VirtualGarage').then(m => ({ default: m.VirtualGarage })))
const EVChargingManagement = lazy(() => import('@/components/modules/charging/EVChargingManagement').then(m => ({ default: m.EVChargingManagement })))

/**
 * Loading fallback for lazy-loaded tabs
 */
function TabLoadingFallback() {
    return (
        <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
}

/**
 * FleetHub consolidates all fleet-related screens into a single hub
 * with tabbed navigation for different views.
 */
export function FleetHub() {
    const tabs: HubTab[] = [
        {
            id: 'map',
            label: 'Live Map',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <LiveFleetDashboard />
                </Suspense>
            ),
        },
        {
            id: 'overview',
            label: 'Overview',
            icon: <Speedometer className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Fleet Overview</h2>
                    <p className="text-muted-foreground">
                        Fleet statistics and KPIs dashboard. Coming soon...
                    </p>
                </div>
            ),
        },
        {
            id: 'telemetry',
            label: 'Telemetry',
            icon: <Pulse className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <VehicleTelemetry />
                </Suspense>
            ),
        },
        {
            id: '3d',
            label: '3D Garage',
            icon: <Cube className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <VirtualGarage />
                </Suspense>
            ),
        },
        {
            id: 'video',
            label: 'Video',
            icon: <Video className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Video Telematics</h2>
                    <p className="text-muted-foreground">
                        Dashcam video monitoring and playback. Coming soon...
                    </p>
                </div>
            ),
        },
        {
            id: 'ev',
            label: 'EV Charging',
            icon: <Lightning className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <EVChargingManagement />
                </Suspense>
            ),
        },
    ]

    return (
        <HubPage
            title="Fleet Hub"
            icon={<FleetIcon className="w-6 h-6" />}
            description="Manage your fleet vehicles, tracking, and telemetry"
            tabs={tabs}
            defaultTab="map"
        />
    )
}

export default FleetHub
