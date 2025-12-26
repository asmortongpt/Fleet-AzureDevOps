/**
 * ComplianceHub - Consolidated Compliance Management Hub
 * 
 * Consolidates 5 compliance-related screens:
 * - Compliance Dashboard → Dashboard Tab
 * - Compliance Map → Map Tab
 * - OSHA Forms → OSHA Tab
 * - DOT Compliance → DOT Tab
 * - IFTA Compliance → IFTA Tab
 * 
 * Route: /compliance
 */

import {
    Shield as ComplianceIcon,
    ChartBar,
    MapTrifold,
    FirstAid,
    Truck,
    Receipt
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'

const ComplianceDashboard = lazy(() => import('@/components/modules/compliance/ComplianceDashboard'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function ComplianceHub() {
    const tabs: HubTab[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <ChartBar className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <ComplianceDashboard />
                </Suspense>
            ),
        },
        {
            id: 'map',
            label: 'Map',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Compliance Map</h2>
                    <p className="text-muted-foreground">Geographic compliance visualization.</p>
                </div>
            ),
        },
        {
            id: 'dot',
            label: 'DOT',
            icon: <Truck className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">DOT Compliance</h2>
                    <p className="text-muted-foreground">Department of Transportation requirements.</p>
                </div>
            ),
        },
        {
            id: 'ifta',
            label: 'IFTA',
            icon: <Receipt className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">IFTA Compliance</h2>
                    <p className="text-muted-foreground">Fuel tax reporting and compliance.</p>
                </div>
            ),
        },
        {
            id: 'osha',
            label: 'OSHA',
            icon: <FirstAid className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">OSHA Safety Forms</h2>
                    <p className="text-muted-foreground">Workplace safety documentation.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Compliance Hub"
            icon={<ComplianceIcon className="w-6 h-6" />}
            description="DOT, IFTA, and safety compliance management"
            tabs={tabs}
            defaultTab="dashboard"
        />
    )
}

export default ComplianceHub
