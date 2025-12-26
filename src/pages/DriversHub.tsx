/**
 * DriversHub - Consolidated Driver Management Hub
 * Route: /drivers
 */

import {
    Users as DriversIcon,
    UserList,
    ChartLine,
    Trophy,
    Car,
    FileText
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function DriversHub() {
    const tabs: HubTab[] = [
        {
            id: 'list',
            label: 'Drivers',
            icon: <UserList className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Driver Roster</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Total Drivers</CardTitle></CardHeader><CardContent className="text-2xl font-bold">48</CardContent></Card>
                        <Card><CardHeader><CardTitle>Active</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">42</CardContent></Card>
                        <Card><CardHeader><CardTitle>On Leave</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-yellow-500">4</CardContent></Card>
                        <Card><CardHeader><CardTitle>Training</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500">2</CardContent></Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'performance',
            label: 'Performance',
            icon: <ChartLine className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Driver Performance</h2>
                    <p className="text-muted-foreground">Performance metrics and analytics.</p>
                </div>
            ),
        },
        {
            id: 'scorecard',
            label: 'Scorecard',
            icon: <Trophy className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Driver Scorecard</h2>
                    <p className="text-muted-foreground">Safety scores and rankings.</p>
                </div>
            ),
        },
        {
            id: 'personal',
            label: 'Personal Use',
            icon: <Car className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Use Tracking</h2>
                    <p className="text-muted-foreground">Personal vs business mileage.</p>
                </div>
            ),
        },
        {
            id: 'policy',
            label: 'Policy',
            icon: <FileText className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Personal Use Policy</h2>
                    <p className="text-muted-foreground">Policy configuration.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Drivers Hub"
            icon={<DriversIcon className="w-6 h-6" />}
            description="Driver management, performance, and compliance"
            tabs={tabs}
            defaultTab="list"
        />
    )
}

export default DriversHub
