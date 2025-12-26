/**
 * CommunicationHub - Consolidated Communication Hub
 * 
 * Consolidates 4 communication-related screens:
 * - AI Assistant → AI Tab
 * - Teams Integration → Teams Tab
 * - Email Center → Email Tab
 * - Communication Log → Log Tab
 * 
 * Route: /communication
 */

import {
    ChatsCircle as CommunicationIcon,
    Robot,
    MicrosoftTeamsLogo,
    Envelope,
    Chat
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { HubPage, HubTab } from '@/components/ui/hub-page'

const AIAssistant = lazy(() => import('@/components/modules/tools/AIAssistant'))

function TabLoadingFallback() {
    return <div className="p-6"><LoadingSkeleton /></div>
}

export function CommunicationHub() {
    const tabs: HubTab[] = [
        {
            id: 'ai',
            label: 'AI Assistant',
            icon: <Robot className="w-4 h-4" />,
            content: (
                <Suspense fallback={<TabLoadingFallback />}>
                    <AIAssistant />
                </Suspense>
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
