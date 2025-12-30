/**
 * ProcurementHub - Premium Procurement Management Hub
 * Route: /procurement
 */

import {
    Package as ProcurementIcon,
    Storefront,
    Cube,
    ShoppingCart,
    FileText,
    Scan,
    GasPump,
    CurrencyDollar
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownLevel } from '@/types/drilldown'

function VendorsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Vendor Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Vendors" value="34" variant="primary" icon={<Storefront className="w-6 h-6" />} onClick={() => push({ type: 'active-vendors', data: { title: 'Active Vendors' }, id: 'active-vendors' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Pending Orders" value="8" variant="warning" onClick={() => push({ type: 'vendors', data: { title: 'Pending Orders' }, id: 'pending-orders' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="This Month" value="$45.2K" variant="success" icon={<CurrencyDollar className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Monthly Spend' }, id: 'monthly-spend' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Overdue Invoices" value="$2.1K" variant="danger" onClick={() => push({ type: 'vendors', data: { title: 'Overdue Invoices' }, id: 'overdue-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'vendors', data: { title: 'Budget' }, id: 'budget' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Budget Used</h3>
                    <ProgressRing progress={72} color="blue" label="$72K" sublabel="of $100K monthly" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'vendors', data: { title: 'Vendor Metrics' }, id: 'vendor-metrics' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Metrics</h3>
                    <QuickStat label="Avg Lead Time" value="3.2 days" trend="down" />
                    <QuickStat label="On-Time Delivery" value="94%" trend="up" />
                    <QuickStat label="Quality Rating" value="4.6/5" />
                </div>
            </div>
        </div>
    )
}

function PartsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Parts Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total SKUs" value="1,245" variant="primary" icon={<Cube className="w-6 h-6" />} onClick={() => push({ type: 'total-skus', data: { title: 'Total SKUs' }, id: 'total-skus' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="In Stock" value="1,180" variant="success" onClick={() => push({ type: 'parts-inventory', data: { title: 'In Stock' }, id: 'in-stock' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Low Stock" value="42" variant="warning" onClick={() => push({ type: 'low-stock', data: { title: 'Low Stock Items' }, id: 'low-stock' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Out of Stock" value="23" variant="danger" onClick={() => push({ type: 'out-of-stock', data: { title: 'Out of Stock' }, id: 'out-of-stock' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function OrdersContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Purchase Orders</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Open POs" value="12" variant="primary" icon={<ShoppingCart className="w-6 h-6" />} onClick={() => push({ type: 'open-pos', data: { title: 'Open POs' }, id: 'open-pos' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="In Transit" value="8" variant="warning" onClick={() => push({ type: 'in-transit-pos', data: { title: 'In Transit' }, id: 'in-transit' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Received" value="156" variant="success" onClick={() => push({ type: 'purchase-orders', data: { title: 'Received' }, id: 'received' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Total Value" value="$124K" variant="default" onClick={() => push({ type: 'purchase-orders', data: { title: 'Total Value' }, id: 'total-value' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function InvoicesContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Invoices & Billing</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Pending" value="18" variant="warning" icon={<FileText className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Pending Invoices' }, id: 'pending-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Approved" value="12" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Approved Invoices' }, id: 'approved-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Paid This Month" value="$89K" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Paid This Month' }, id: 'paid-this-month' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Overdue" value="$4.2K" variant="danger" onClick={() => push({ type: 'vendors', data: { title: 'Overdue Invoices' }, id: 'overdue-invoices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function ReceiptsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Receipt Processing</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Scanned Today" value="24" variant="primary" icon={<Scan className="w-6 h-6" />} onClick={() => push({ type: 'vendors', data: { title: 'Scanned Today' }, id: 'scanned-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Pending Review" value="8" variant="warning" onClick={() => push({ type: 'vendors', data: { title: 'Pending Review' }, id: 'pending-review' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Processed" value="456" variant="success" onClick={() => push({ type: 'vendors', data: { title: 'Processed Receipts' }, id: 'processed-receipts' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function FuelContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Fuel Purchasing</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Cards Active" value="156" variant="primary" icon={<GasPump className="w-6 h-6" />} onClick={() => push({ type: 'fuel-cards', data: { title: 'Fuel Cards' }, id: 'fuel-cards' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Gallons Today" value="2,450" variant="default" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Gallons Today' }, id: 'gallons-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Cost Today" value="$7,840" variant="warning" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Cost Today' }, id: 'cost-today' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Avg Price/Gal" value="$3.20" variant="default" onClick={() => push({ type: 'fuel-purchasing', data: { title: 'Fuel Prices' }, id: 'fuel-prices' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

export function ProcurementHub() {
    const tabs: HubTab[] = [
        { id: 'vendors', label: 'Vendors', icon: <Storefront className="w-4 h-4" />, content: <VendorsContent /> },
        { id: 'parts', label: 'Parts', icon: <Cube className="w-4 h-4" />, content: <PartsContent /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" />, content: <OrdersContent /> },
        { id: 'invoices', label: 'Invoices', icon: <FileText className="w-4 h-4" />, content: <InvoicesContent /> },
        { id: 'receipts', label: 'Receipts', icon: <Scan className="w-4 h-4" />, content: <ReceiptsContent /> },
        { id: 'fuel', label: 'Fuel', icon: <GasPump className="w-4 h-4" />, content: <FuelContent /> },
    ]

    return (
        <HubPage
            title="Procurement Hub"
            icon={<ProcurementIcon className="w-6 h-6" />}
            description="Vendors, parts, orders, and fuel purchasing"
            tabs={tabs}
            defaultTab="vendors"
        />
    )
}

export default ProcurementHub