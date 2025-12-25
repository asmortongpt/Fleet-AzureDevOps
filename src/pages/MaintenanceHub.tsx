/**
 * MaintenanceHub - Consolidated Maintenance Management Hub
 * 
 * Consolidates 5 maintenance-related screens into one hub page:
 * - Garage & Service → Garage Tab
 * - Predictive Maintenance → Predictive Tab
 * - Maintenance Calendar → Calendar Tab
 * - Maintenance Requests → Requests Tab
 * 
 * Route: /maintenance
 */

import {
    Wrench as MaintenanceIcon,
    Warehouse,
    ChartLine,
    CalendarDots,
    ClipboardText
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

// Lazy load components
const GarageService = lazy(() => import('@/components/modules/maintenance/GarageService'))
const PredictiveMaintenance = lazy(() => import('@/components/modules/maintenance/PredictiveMaintenance'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function MaintenanceHub() {
    const tabs: HubTab[] = [
        {
            id: 'garage',
            label: 'Garage',
            icon: <Warehouse className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <GarageService />
                </Suspense>
            ),
        },
        {
            id: 'predictive',
            label: 'Predictive',
            icon: <ChartLine className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <PredictiveMaintenance />
                </Suspense>
            ),
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <CalendarDots className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance Calendar</h2>
                    <p className="text-muted-foreground">Scheduled maintenance view. Coming soon...</p>
                </div>
            ),
        },
        {
            id: 'requests',
            label: 'Requests',
            icon: <ClipboardText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
                    <p className="text-muted-foreground">Work order requests queue. Coming soon...</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Maintenance Hub"
            icon={<MaintenanceIcon className="w-6 h-6" />}
            description="Garage services and predictive maintenance"
            tabs={tabs}
            defaultTab="garage"
        />
    )
}

export default MaintenanceHub
