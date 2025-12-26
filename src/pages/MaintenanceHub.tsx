/**
 * MaintenanceHub - Consolidated Maintenance Management Hub
 * Route: /maintenance
 */

import {
    Wrench as MaintenanceIcon,
    Warehouse,
    ChartLine,
    CalendarDots,
    ClipboardText
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function MaintenanceHub() {
    const tabs: HubTab[] = [
        {
            id: 'garage',
            label: 'Garage',
            icon: <Warehouse className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Garage & Service</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Work Orders</CardTitle></CardHeader><CardContent className="text-2xl font-bold">12</CardContent></Card>
                        <Card><CardHeader><CardTitle>In Progress</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500">5</CardContent></Card>
                        <Card><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">89</CardContent></Card>
                        <Card><CardHeader><CardTitle>Overdue</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-500">2</CardContent></Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'predictive',
            label: 'Predictive',
            icon: <ChartLine className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Predictive Maintenance</h2>
                    <p className="text-muted-foreground">AI-powered maintenance predictions and alerts.</p>
                </div>
            ),
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <CalendarDots className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance Calendar</h2>
                    <p className="text-muted-foreground">Scheduled maintenance view.</p>
                </div>
            ),
        },
        {
            id: 'requests',
            label: 'Requests',
            icon: <ClipboardText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Maintenance Requests</h2>
                    <p className="text-muted-foreground">Work order requests queue.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Maintenance Hub"
            icon={<MaintenanceIcon className="w-6 h-6" />}
            description="Garage services and predictive maintenance"
            tabs={tabs}
            defaultTab="garage"
        />
    )
}

export default MaintenanceHub
