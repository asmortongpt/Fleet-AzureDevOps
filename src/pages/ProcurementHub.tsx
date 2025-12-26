/**
 * ProcurementHub - Consolidated Procurement Management Hub
 * Route: /procurement
 */

import {
    Package as ProcurementIcon,
    Storefront,
    Cube,
    ShoppingCart,
    FileText,
    Scan,
    GasPump
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProcurementHub() {
    const tabs: HubTab[] = [
        {
            id: 'vendors',
            label: 'Vendors',
            icon: <Storefront className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Vendor Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Active Vendors</CardTitle></CardHeader><CardContent className="text-2xl font-bold">34</CardContent></Card>
                        <Card><CardHeader><CardTitle>Pending Orders</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-yellow-500">8</CardContent></Card>
                        <Card><CardHeader><CardTitle>This Month</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">$45.2K</CardContent></Card>
                        <Card><CardHeader><CardTitle>Overdue</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-500">$2.1K</CardContent></Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'parts',
            label: 'Parts',
            icon: <Cube className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Parts Inventory</h2>
                    <p className="text-muted-foreground">Spare parts and supplies management.</p>
                </div>
            ),
        },
        {
            id: 'orders',
            label: 'Orders',
            icon: <ShoppingCart className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Purchase Orders</h2>
                    <p className="text-muted-foreground">Order management and tracking.</p>
                </div>
            ),
        },
        {
            id: 'invoices',
            label: 'Invoices',
            icon: <FileText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Invoices & Billing</h2>
                    <p className="text-muted-foreground">Invoice processing and payment.</p>
                </div>
            ),
        },
        {
            id: 'receipts',
            label: 'Receipts',
            icon: <Scan className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Receipt Processing</h2>
                    <p className="text-muted-foreground">OCR receipt scanning and categorization.</p>
                </div>
            ),
        },
        {
            id: 'fuel',
            label: 'Fuel',
            icon: <GasPump className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Fuel Purchasing</h2>
                    <p className="text-muted-foreground">Fuel card management and purchasing.</p>
                </div>
            ),
        },
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
