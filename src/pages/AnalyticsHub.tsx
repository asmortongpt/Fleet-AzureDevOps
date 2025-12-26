/**
 * AnalyticsHub - Consolidated Analytics & Reporting Hub
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

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AnalyticsHub() {
    const tabs: HubTab[] = [
        {
            id: 'executive',
            label: 'Executive',
            icon: <PresentationChart className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Executive Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Fleet Utilization</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">87%</CardContent></Card>
                        <Card><CardHeader><CardTitle>Cost per Mile</CardTitle></CardHeader><CardContent className="text-2xl font-bold">$0.42</CardContent></Card>
                        <Card><CardHeader><CardTitle>On-Time Delivery</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">94%</CardContent></Card>
                        <Card><CardHeader><CardTitle>Safety Score</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500">92</CardContent></Card>
                    </div>
                </div>
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
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Data Workbench</h2>
                    <p className="text-muted-foreground">Custom data exploration and queries.</p>
                </div>
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
