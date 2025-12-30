/**
 * SafetyHub - Premium Safety Management Hub
 * Route: /safety
 */

import {
    Warning as SafetyIcon,
    WarningCircle,
    VideoCamera,
    Bell,
    ShieldCheck
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat, StatusDot } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function IncidentsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Incident Management</h2>
                <StatusDot status="online" label="Monitoring Active" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Open Incidents" value="3" variant="danger" icon={<WarningCircle className="w-6 h-6" />} onClick={() => push({ type: 'open-incidents', data: { title: 'Open Incidents' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Under Review" value="5" variant="warning" onClick={() => push({ type: 'under-review', data: { title: 'Under Review' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Resolved (30d)" value="12" variant="success" onClick={() => push({ type: 'incidents', data: { title: 'Resolved Incidents' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Days Incident Free" value="47" variant="success" icon={<ShieldCheck className="w-6 h-6" />} onClick={() => push({ type: 'days-incident-free', data: { title: 'Safety Record' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'safety-score-detail', data: { title: 'Safety Score' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Safety Score</h3>
                    <ProgressRing progress={92} color="green" label="Score" sublabel="Fleet-wide" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'incidents', data: { title: 'Safety Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Metrics</h3>
                    <QuickStat label="Near Misses" value="8" trend="down" />
                    <QuickStat label="Training Complete" value="96%" trend="up" />
                    <QuickStat label="Violations" value="2" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'incidents', data: { title: 'Response Time' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Response Time</h3>
                    <ProgressRing progress={88} color="blue" label="4.2 min" sublabel="avg response" />
                </div>
            </div>
        </div>
    )
}

function VideoContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Video Telematics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Cameras Online" value="148" variant="success" icon={<VideoCamera className="w-6 h-6" />} onClick={() => push({ type: 'cameras-online', data: { title: 'Cameras Online' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Events Today" value="23" variant="warning" onClick={() => push({ type: 'events-today', data: { title: 'Events Today' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Reviewed" value="18" variant="success" onClick={() => push({ type: 'video-telematics', data: { title: 'Reviewed Events' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Storage" value="2.4 TB" variant="default" onClick={() => push({ type: 'video-telematics', data: { title: 'Storage' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function AlertsContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Safety Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Alerts" value="6" variant="warning" icon={<Bell className="w-6 h-6" />} />
                <StatCard title="Critical" value="1" variant="danger" />
                <StatCard title="Acknowledged" value="4" variant="success" />
                <StatCard title="Auto-Resolved" value="12" variant="default" />
            </div>
        </div>
    )
}

export function SafetyHub() {
    const tabs: HubTab[] = [
        { id: 'incidents', label: 'Incidents', icon: <WarningCircle className="w-4 h-4" />, content: <IncidentsContent /> },
        { id: 'video', label: 'Video', icon: <VideoCamera className="w-4 h-4" />, content: <VideoContent /> },
        { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" />, content: <AlertsContent /> },
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