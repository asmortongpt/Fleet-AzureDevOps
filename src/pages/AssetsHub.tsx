/**
 * AssetsHub - Consolidated Asset Management Hub
 * Route: /assets
 */

import {
    Barcode as AssetsIcon,
    ListDashes,
    Engine,
    Package
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AssetsHub() {
    const tabs: HubTab[] = [
        {
            id: 'assets',
            label: 'Assets',
            icon: <ListDashes className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Asset Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Total Assets</CardTitle></CardHeader><CardContent className="text-2xl font-bold">256</CardContent></Card>
                        <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">234</CardContent></Card>
                        <Card><CardHeader><CardTitle>In Maintenance</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-yellow-500">18</CardContent></Card>
                        <Card><CardHeader><CardTitle>Retired</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-gray-500">4</CardContent></Card>
                    </div>
                </div>
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
