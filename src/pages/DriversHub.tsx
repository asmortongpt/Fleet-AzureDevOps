/**
 * DriversHub - Consolidated Driver Management Hub
 * 
 * Consolidates 6 driver-related screens into one hub page:
 * - Drivers Management → List Tab
 * - Driver Performance → Performance Tab
 * - Driver Scorecard → Scorecard Tab
 * - Personal Use → Personal Tab
 * - Personal Use Policy → Policy Tab
 * 
 * Route: /drivers
 */

import {
    Users as DriversIcon,
    UserList,
    ChartLine,
    Trophy,
    Car,
    FileText
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

// Lazy load components
const DriverPerformance = lazy(() => import('@/components/modules/drivers/DriverPerformance'))
const DriverScorecard = lazy(() => import('@/components/modules/drivers/DriverScorecard'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function DriversHub() {
    const tabs: HubTab[] = [
        {
            id: 'list',
            label: 'Drivers',
            icon: <UserList className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Drivers List</h2>
                    <p className="text-muted-foreground">Driver roster and profiles. Coming soon...</p>
                </div>
            ),
        },
        {
            id: 'performance',
            label: 'Performance',
            icon: <ChartLine className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <DriverPerformance />
                </Suspense>
            ),
        },
        {
            id: 'scorecard',
            label: 'Scorecard',
            icon: <Trophy className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <DriverScorecard />
                </Suspense>
            ),
        },
        {
            id: 'personal',
            label: 'Personal Use',
            icon: <Car className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Use Tracking</h2>
                    <p className="text-muted-foreground">Personal vs business mileage. Coming soon...</p>
                </div>
            ),
        },
        {
            id: 'policy',
            label: 'Policy',
            icon: <FileText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Use Policy</h2>
                    <p className="text-muted-foreground">Policy configuration. Coming soon...</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Drivers Hub"
            icon={<DriversIcon className="w-6 h-6" />}
            description="Driver management, performance, and compliance"
            tabs={tabs}
            defaultTab="list"
        />
    )
}

export default DriversHub
