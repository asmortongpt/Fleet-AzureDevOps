/**
 * AnalyticsHub - Consolidated Analytics & Reporting Hub
 * 
 * Consolidates 8 analytics-related screens:
 * - Executive Dashboard → Executive Tab
 * - Analytics Dashboard → Dashboard Tab
 * - Fleet Analytics → Fleet Tab
 * - Data Workbench → Workbench Tab
 * - Fleet Optimizer → Optimizer Tab
 * - Cost Analysis → Costs Tab
 * - Custom Reports → Reports Tab
 * 
 * Route: /analytics
 */

import {
    ChartLine as AnalyticsIcon,
    PresentationChart,
    ChartBar,
    Database,
    Gauge,
    CurrencyDollar,
    FileText
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

const ExecutiveDashboard = lazy(() => import('@/components/modules/analytics/ExecutiveDashboard'))
const DataWorkbench = lazy(() => import('@/components/modules/analytics/DataWorkbench'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function AnalyticsHub() {
    const tabs: HubTab[] = [
        {
            id: 'executive',
            label: 'Executive',
            icon: <PresentationChart className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <ExecutiveDashboard />
                </Suspense>
            ),
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <ChartBar className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">Fleet analytics and KPIs.</p>
                </div>
            ),
        },
        {
            id: 'workbench',
            label: 'Workbench',
            icon: <Database className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <DataWorkbench />
                </Suspense>
            ),
        },
        {
            id: 'optimizer',
            label: 'Optimizer',
            icon: <Gauge className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Fleet Optimizer</h2>
                    <p className="text-muted-foreground">Optimization recommendations.</p>
                </div>
            ),
        },
        {
            id: 'costs',
            label: 'Costs',
            icon: <CurrencyDollar className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Cost Analysis</h2>
                    <p className="text-muted-foreground">Total cost of ownership analysis.</p>
                </div>
            ),
        },
        {
            id: 'reports',
            label: 'Reports',
            icon: <FileText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Custom Reports</h2>
                    <p className="text-muted-foreground">Report builder and templates.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Analytics Hub"
            icon={<AnalyticsIcon className="w-6 h-6" />}
            description="Dashboards, reports, and fleet optimization"
            tabs={tabs}
            defaultTab="executive"
        />
    )
}

export default AnalyticsHub
