/**
 * OperationsHub - Consolidated Operations Management Hub
 * 
 * Consolidates 6 operations-related screens into one hub page:
 * - Dispatch Console → Dispatch Tab
 * - Route Optimization → Routes Tab
 * - Route Management → Routes Tab
 * - Task Management → Tasks Tab
 * - Maintenance Scheduling → Calendar Tab
 * 
 * Route: /operations
 */

import {
    Broadcast as OperationsIcon,
    MapTrifold,
    RadioButton,
    CheckSquare,
    CalendarDots
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

// Lazy load components
const DispatchConsole = lazy(() => import('@/components/modules/operations/DispatchConsole'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function OperationsHub() {
    const tabs: HubTab[] = [
        {
            id: 'dispatch',
            label: 'Dispatch',
            icon: <RadioButton className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <DispatchConsole />
                </Suspense>
            ),
        },
        {
            id: 'routes',
            label: 'Routes',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Route Management</h2>
                    <p className="text-muted-foreground">Route optimization and management. Coming soon...</p>
                </div>
            ),
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: <CheckSquare className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Task Management</h2>
                    <p className="text-muted-foreground">Work orders and task assignments. Coming soon...</p>
                </div>
            ),
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <CalendarDots className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Operations Calendar</h2>
                    <p className="text-muted-foreground">Scheduling and calendar view. Coming soon...</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Operations Hub"
            icon={<OperationsIcon className="w-6 h-6" />}
            description="Dispatch, routing, and task management"
            tabs={tabs}
            defaultTab="dispatch"
        />
    )
}

export default OperationsHub
