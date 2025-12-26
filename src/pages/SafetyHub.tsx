/**
 * SafetyHub - Consolidated Safety Management Hub
 * 
 * Consolidates 3 safety-related screens:
 * - Incident Management → Incidents Tab
 * - Video Telematics → Video Tab
 * - Safety Alerts → Alerts Tab
 * 
 * Route: /safety
 */

import {
    Warning as SafetyIcon,
    WarningCircle,
    VideoCamera,
    Bell
} from '@phosphor-icons/react'
import React from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'

export function SafetyHub() {
    const tabs: HubTab[] = [
        {
            id: 'incidents',
            label: 'Incidents',
            icon: <WarningCircle className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Incident Management</h2>
                    <p className="text-muted-foreground">Safety incidents and accident reports.</p>
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
