/**
 * CommunicationHub - Consolidated Communication Hub
 * Route: /communication
 */

import {
    ChatsCircle as CommunicationIcon,
    Robot,
    MicrosoftTeamsLogo,
    Envelope,
    Chat
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function CommunicationHub() {
    const tabs: HubTab[] = [
        {
            id: 'ai',
            label: 'AI Assistant',
            icon: <Robot className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card><CardHeader><CardTitle>Queries Today</CardTitle></CardHeader><CardContent className="text-2xl font-bold">145</CardContent></Card>
                        <Card><CardHeader><CardTitle>Avg Response</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-500">1.2s</CardContent></Card>
                        <Card><CardHeader><CardTitle>Satisfaction</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-blue-500">94%</CardContent></Card>
                    </div>
                    <p className="text-muted-foreground">Ask me anything about your fleet operations.</p>
                </div>
            ),
        },
        {
            id: 'teams',
            label: 'Teams',
            icon: <MicrosoftTeamsLogo className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Teams Integration</h2>
                    <p className="text-muted-foreground">Microsoft Teams messaging and notifications.</p>
                </div>
            ),
        },
        {
            id: 'email',
            label: 'Email',
            icon: <Envelope className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Email Center</h2>
                    <p className="text-muted-foreground">Email notifications and templates.</p>
                </div>
            ),
        },
        {
            id: 'log',
            label: 'Log',
            icon: <Chat className="w-4 h-4" />,
            content: (
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Communication Log</h2>
                    <p className="text-muted-foreground">Message history and audit trail.</p>
                </div>
            ),
        },
    ]

    return (
        <HubPage
            title="Communication Hub"
            icon={<CommunicationIcon className="w-6 h-6" />}
            description="AI assistant, messaging, and notifications"
            tabs={tabs}
            defaultTab="ai"
        />
    )
}

export default CommunicationHub
