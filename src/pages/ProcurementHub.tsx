/**
 * ProcurementHub - Consolidated Procurement Management Hub
 * 
 * Consolidates 7 procurement-related screens:
 * - Vendor Management → Vendors Tab
 * - Parts Inventory → Parts Tab
 * - Purchase Orders → Orders Tab
 * - Invoices & Billing → Invoices Tab
 * - Receipt Processing → Receipts Tab
 * - Fuel Management → Fuel Tab
 * - Fuel Purchasing → Fuel Tab
 * 
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
import React, { Suspense, lazy } from 'react'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

const VendorManagement = lazy(() => import('@/components/modules/procurement/VendorManagement'))
const FuelPurchasing = lazy(() => import('@/components/modules/fuel/FuelPurchasing'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function ProcurementHub() {
    const tabs: HubTab[] = [
        {
            id: 'vendors',
            label: 'Vendors',
            icon: <Storefront className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <VendorManagement />
                </Suspense>
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
                <Suspense fallback={<TabLoadingFallback />}>
                    <FuelPurchasing />
                </Suspense>
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
