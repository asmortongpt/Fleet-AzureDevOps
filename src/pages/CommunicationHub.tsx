/**
 * CommunicationHub - Premium Communication Hub
 * Route: /communication
 */

import {
    ChatsCircle as CommunicationIcon,
    Robot,
    MicrosoftTeamsLogo,
    Envelope,
    Chat,
    PaperPlaneTilt,
    Sparkle
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat, StatusDot } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function AIContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
                <StatusDot status="online" label="Ready" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Queries Today" value="145" variant="primary" icon={<Sparkle className="w-6 h-6" />} onClick={() => push({ type: 'ai-agent', data: { title: 'AI Queries' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Avg Response" value="1.2s" variant="success" onClick={() => push({ type: 'ai-agent', data: { title: 'Response Time' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Satisfaction" value="94%" variant="success" onClick={() => push({ type: 'ai-satisfaction', data: { title: 'Satisfaction' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Conversations" value="89" variant="default" onClick={() => push({ type: 'ai-conversations', data: { title: 'Conversations' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'ai-agent', data: { title: 'Resolution Rate' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Resolution Rate</h3>
                    <ProgressRing progress={87} color="green" label="Resolved" sublabel="without escalation" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'ai-agent', data: { title: 'AI Usage' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Usage</h3>
                    <QuickStat label="Fleet Queries" value="45%" />
                    <QuickStat label="Maintenance" value="28%" />
                    <QuickStat label="Compliance" value="18%" />
                    <QuickStat label="Other" value="9%" />
                </div>
            </div>
        </div>
    )
}

function TeamsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Teams Integration</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Connected Users" value="48" variant="primary" icon={<MicrosoftTeamsLogo className="w-6 h-6" />} onClick={() => push({ type: 'messages', data: { title: 'Connected Users' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Messages Today" value="234" variant="success" onClick={() => push({ type: 'messages-today', data: { title: 'Messages Today' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Channels" value="12" variant="default" onClick={() => push({ type: 'channels', data: { title: 'Channels' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Automations" value="8" variant="success" onClick={() => push({ type: 'automations', data: { title: 'Automations' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function EmailContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Email Center</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Sent Today" value="156" variant="primary" icon={<PaperPlaneTilt className="w-6 h-6" />} onClick={() => push({ type: 'email', data: { title: 'Emails Sent' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Templates" value="24" variant="default" onClick={() => push({ type: 'email-templates', data: { title: 'Email Templates' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Open Rate" value="42%" variant="success" onClick={() => push({ type: 'open-rate', data: { title: 'Open Rate' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Scheduled" value="12" variant="warning" onClick={() => push({ type: 'scheduled-emails', data: { title: 'Scheduled Emails' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function LogContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Communication Log</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Messages" value="4,567" variant="primary" icon={<Chat className="w-6 h-6" />} onClick={() => push({ type: 'communication-history', data: { title: 'Total Messages' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="This Week" value="456" variant="success" onClick={() => push({ type: 'communication-history', data: { title: 'This Week' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Flagged" value="12" variant="warning" onClick={() => push({ type: 'flagged', data: { title: 'Flagged Messages' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Archived" value="3.2K" variant="default" onClick={() => push({ type: 'archived', data: { title: 'Archived' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

export function CommunicationHub() {
    const tabs: HubTab[] = [
        { id: 'ai', label: 'AI Assistant', icon: <Robot className="w-4 h-4" />, content: <AIContent /> },
        { id: 'teams', label: 'Teams', icon: <MicrosoftTeamsLogo className="w-4 h-4" />, content: <TeamsContent /> },
        { id: 'email', label: 'Email', icon: <Envelope className="w-4 h-4" />, content: <EmailContent /> },
        { id: 'log', label: 'Log', icon: <Chat className="w-4 h-4" />, content: <LogContent /> },
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