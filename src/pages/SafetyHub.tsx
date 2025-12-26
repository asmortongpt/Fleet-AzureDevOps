/**
 * SafetyHub - Consolidated Safety Management Hub
 * Route: /safety
 */

import {
    Warning as SafetyIcon,
    WarningCircle,
    VideoCamera,
    Bell
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SafetyHub() {
    const tabs: HubTab[] = [
        {
            id: 'incidents',
            label: 'Incidents',
            icon: <WarningCircle className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Incident Management</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card><CardHeader><CardTitle>Open Incidents</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-red-500">3</CardContent></Card>
                        <Card><CardHeader><CardTitle>Under Review</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-yellow-500">5</CardContent></Card>
                        <Card><CardHeader><CardTitle>Resolved (30d)</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">12</CardContent></Card>
                        <Card><CardHeader><CardTitle>Days Incident Free</CardTitle></CardHeader><CardContent className="text-2xl font-bold">47</CardContent></Card>
                    </div>
                </div>
            ),
        },
        {
            id: 'video',
            label: 'Video',
            icon: <VideoCamera className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Video Telematics</h2>
                    <p className="text-muted-foreground">Dashcam footage and event review.</p>
                </div>
            ),
        },
        {
            id: 'alerts',
            label: 'Alerts',
            icon: <Bell className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Safety Alerts</h2>
                    <p className="text-muted-foreground">Real-time safety notifications.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Safety Hub"
            icon={<SafetyIcon className="w-6 h-6" />}
            description="Incident management and safety monitoring"
            tabs={tabs}
            defaultTab="incidents"
        />
    )
}

export default SafetyHub
