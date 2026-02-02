/**
 * AssetsHub - Premium Asset Management Hub
 * Route: /assets
 */

import { Barcode as AssetsIcon, List, Cog, Package, MapPin, Tag } from 'lucide-react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

function AssetsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Asset Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Total Assets"
                    value="256"
                    variant="primary"
                    icon={<Tag className="w-4 h-4" />}
                    onClick={() => push({ type: 'asset', label: 'Total Assets', data: { filter: 'all' } })}
                />
                <StatCard
                    title="Active"
                    value="234"
                    variant="success"
                    onClick={() => push({ type: 'asset', label: 'Active Assets', data: { filter: 'active' } })}
                />
                <StatCard
                    title="In Maintenance"
                    value="18"
                    variant="warning"
                    onClick={() => push({ type: 'asset', label: 'Assets In Maintenance', data: { filter: 'maintenance' } })}
                />
                <StatCard
                    title="Retired"
                    value="4"
                    variant="default"
                    onClick={() => push({ type: 'asset', label: 'Retired Assets', data: { filter: 'retired' } })}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'utilization', label: 'Asset Utilization', data: { activeCount: 234, totalCount: 256, rate: 91 } })}
                >
                    <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-2">Utilization</h3>
                    <ProgressRing progress={91} color="green" label="Active" sublabel="234 of 256" />
                </div>
                <div
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-md border border-slate-700/50 p-3 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'asset-value', label: 'Asset Value Analysis', data: { totalValue: 4200000, depreciation: 320000, avgAge: 3.4 } })}
                >
                    <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide mb-2">Value</h3>
                    <QuickStat
                        label="Total Value"
                        value="$4.2M"
                        onClick={() => push({ type: 'asset-list', id: 'high-value-assets', data: { filter: 'high-value' } })}
                    />
                    <QuickStat
                        label="Depreciation"
                        value="$320K"
                        onClick={() => push({ type: 'asset-list', id: 'low-value-assets', data: { filter: 'low-value' } })}
                    />
                    <QuickStat
                        label="Avg Age"
                        value="3.4 yrs"
                        onClick={() => push({ type: 'asset-list', id: 'critical-assets', data: { filter: 'critical' } })}
                    />
                </div>
            </div>
        </div>
    )
}

function EquipmentContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Equipment Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Heavy Equipment"
                    value="24"
                    variant="primary"
                    icon={<Cog className="w-4 h-4" />}
                    onClick={() => push({ type: 'equipment', label: 'Heavy Equipment', data: { filter: 'heavy' } })}
                />
                <StatCard
                    title="In Use"
                    value="18"
                    variant="success"
                    onClick={() => push({ type: 'equipment', label: 'Equipment In Use', data: { filter: 'in-use' } })}
                />
                <StatCard
                    title="Available"
                    value="4"
                    variant="default"
                    onClick={() => push({ type: 'equipment', label: 'Available Equipment', data: { filter: 'available' } })}
                />
                <StatCard
                    title="Service Due"
                    value="2"
                    variant="warning"
                    onClick={() => push({ type: 'equipment', label: 'Equipment Service Due', data: { filter: 'service-due' } })}
                />
            </div>
        </div>
    )
}

function InventoryContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Inventory Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <StatCard
                    title="Total Items"
                    value="1,456"
                    variant="primary"
                    icon={<Package className="w-4 h-4" />}
                    onClick={() => push({ type: 'parts-inventory', label: 'Total Inventory', data: { filter: 'all' } })}
                />
                <StatCard
                    title="Tracked"
                    value="1,420"
                    variant="success"
                    icon={<MapPin className="w-4 h-4" />}
                    onClick={() => push({ type: 'parts-inventory', label: 'Tracked Items', data: { filter: 'tracked' } })}
                />
                <StatCard
                    title="Low Stock"
                    value="24"
                    variant="warning"
                    onClick={() => push({ type: 'low-stock', label: 'Low Stock Items', data: { filter: 'low-stock' } })}
                />
                <StatCard
                    title="Reorder Pending"
                    value="8"
                    variant="default"
                    onClick={() => push({ type: 'purchase-orders', label: 'Reorder Pending', data: { filter: 'pending' } })}
                />
            </div>
        </div>
    )
}

export function AssetsHub() {
    const tabs: HubTab[] = [
        { id: 'assets', label: 'Assets', icon: <List className="w-4 h-4" />, content: <AssetsContent /> },
        { id: 'equipment', label: 'Equipment', icon: <Cog className="w-4 h-4" />, content: <EquipmentContent /> },
        { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, content: <InventoryContent /> },
    ]

    return (
        <HubPage
            title="Assets Hub"
            icon={<AssetsIcon className="w-4 h-4" />}
            description="Equipment and inventory management"
            tabs={tabs}
            defaultTab="assets"
        />
    )
}

export default AssetsHub
