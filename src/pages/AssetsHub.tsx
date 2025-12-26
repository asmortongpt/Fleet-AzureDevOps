/**
 * AssetsHub - Consolidated Asset Management Hub
 * 
 * Consolidates 3 asset-related screens:
 * - Asset Management → Assets Tab
 * - Equipment Dashboard → Equipment Tab
 * - Inventory Tracking → Inventory Tab
 * 
 * Route: /assets
 */

import {
    Barcode as AssetsIcon,
    ListDashes,
    Engine,
    Package
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

const AssetManagement = lazy(() => import('@/components/modules/assets/AssetManagement'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function AssetsHub() {
    const tabs: HubTab[] = [
        {
            id: 'assets',
            label: 'Assets',
            icon: <ListDashes className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <AssetManagement />
                </Suspense>
            ),
        },
        {
            id: 'equipment',
            label: 'Equipment',
            icon: <Engine className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Equipment Dashboard</h2>
                    <p className="text-muted-foreground">Heavy equipment and machinery tracking.</p>
                </div>
            ),
        },
        {
            id: 'inventory',
            label: 'Inventory',
            icon: <Package className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Inventory Tracking</h2>
                    <p className="text-muted-foreground">Asset inventory and location tracking.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Assets Hub"
            icon={<AssetsIcon className="w-6 h-6" />}
            description="Equipment and inventory management"
            tabs={tabs}
            defaultTab="assets"
        />
    )
}

export default AssetsHub
