/**
 * AssetsHub - Premium Asset Management Hub
 * Route: /assets
 */

import {
    Barcode as AssetsIcon,
    ListDashes,
    Engine,
    Package,
    MapPin,
    Tag
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

function AssetsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Asset Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Assets"
                    value="256"
                    variant="primary"
                    icon={<Tag className="w-6 h-6" />}
                    onClick={() => push({ type: 'asset-list', id: 'all-assets', data: { filter: 'all' } })}
                />
                <StatCard
                    title="Active"
                    value="234"
                    variant="success"
                    onClick={() => push({ type: 'asset-list', id: 'active-assets', data: { filter: 'active' } })}
                />
                <StatCard
                    title="In Maintenance"
                    value="18"
                    variant="warning"
                    onClick={() => push({ type: 'asset-list', id: 'maintenance-assets', data: { filter: 'maintenance' } })}
                />
                <StatCard
                    title="Retired"
                    value="4"
                    variant="default"
                    onClick={() => push({ type: 'asset-list', id: 'retired-assets', data: { filter: 'inactive' } })}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors"
                    onClick={() => push({ type: 'asset-list', id: 'surplus-assets', data: { filter: 'surplus' } })}
                >
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Utilization</h3>
                    <ProgressRing progress={91} color="green" label="Active" sublabel="234 of 256" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Value</h3>
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Equipment Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Heavy Equipment"
                    value="24"
                    variant="primary"
                    icon={<Engine className="w-6 h-6" />}
                    onClick={() => push({ type: 'equipment-list', id: 'heavy-equipment', data: { category: 'heavy' } })}
                />
                <StatCard
                    title="In Use"
                    value="18"
                    variant="success"
                    onClick={() => push({ type: 'equipment-list', id: 'in-use-equipment', data: { category: 'light' } })}
                />
                <StatCard
                    title="Available"
                    value="4"
                    variant="default"
                    onClick={() => push({ type: 'equipment-list', id: 'available-equipment', data: { category: 'specialized' } })}
                />
                <StatCard
                    title="Service Due"
                    value="2"
                    variant="warning"
                    onClick={() => push({ type: 'equipment-list', id: 'service-due-equipment', data: { category: 'tools' } })}
                />
            </div>
        </div>
    )
}

function InventoryContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Inventory Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Items"
                    value="1,456"
                    variant="primary"
                    icon={<Package className="w-6 h-6" />}
                    onClick={() => push({ type: 'inventory-list', id: 'all-inventory', data: { filter: 'all' } })}
                />
                <StatCard
                    title="Tracked"
                    value="1,420"
                    variant="success"
                    icon={<MapPin className="w-6 h-6" />}
                    onClick={() => push({ type: 'inventory-list', id: 'high-value-inventory', data: { filter: 'high-value' } })}
                />
                <StatCard
                    title="Low Stock"
                    value="24"
                    variant="warning"
                    onClick={() => push({ type: 'inventory-list', id: 'low-stock', data: { filter: 'low-stock' } })}
                />
                <StatCard
                    title="Reorder Pending"
                    value="8"
                    variant="default"
                    onClick={() => push({ type: 'inventory-list', id: 'out-of-stock', data: { filter: 'out-of-stock' } })}
                />
            </div>
        </div>
    )
}

export function AssetsHub() {
    const tabs: HubTab[] = [
        { id: 'assets', label: 'Assets', icon: <ListDashes className="w-4 h-4" />, content: <AssetsContent /> },
        { id: 'equipment', label: 'Equipment', icon: <Engine className="w-4 h-4" />, content: <EquipmentContent /> },
        { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" />, content: <InventoryContent /> },
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
