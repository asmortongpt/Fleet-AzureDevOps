/**
 * OperationsHub - Consolidated Operations Management Hub
 * Route: /operations
 */

import {
    Broadcast as OperationsIcon,
    MapTrifold,
    RadioButton,
    CheckSquare,
    CalendarDots
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function OperationsHub() {
    const tabs: HubTab[] = [
        {
            id: 'dispatch',
            label: 'Dispatch',
            icon: <RadioButton className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Dispatch Console</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Active Jobs</CardTitle></CardHeader><CardContent className="text-2xl font-bold">24</CardContent></Card>
                        <Card><CardHeader><CardTitle>In Transit</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500">18</CardContent></Card>
                        <Card><CardHeader><CardTitle>Completed</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">156</CardContent></Card>
                        <Card><CardHeader><CardTitle>Delayed</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-500">3</CardContent></Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'routes',
            label: 'Routes',
            icon: <MapTrifold className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Route Management</h2>
                    <p className="text-muted-foreground">Route optimization and management.</p>
                </div>
            ),
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: <CheckSquare className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Task Management</h2>
                    <p className="text-muted-foreground">Work orders and task assignments.</p>
                </div>
            ),
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <CalendarDots className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Operations Calendar</h2>
                    <p className="text-muted-foreground">Scheduling and calendar view.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Operations Hub"
            icon={<OperationsIcon className="w-6 h-6" />}
            description="Dispatch, routing, and task management"
            tabs={tabs}
            defaultTab="dispatch"
        />
    )
}

export default OperationsHub
