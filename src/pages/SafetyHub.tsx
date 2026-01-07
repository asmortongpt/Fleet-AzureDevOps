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

import { HubPage, HubTab, HubTabItem } from '@/components/ui/hub-page'
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
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-emerald-600 hover:shadow-lg transition-all duration-200" onClick={() => push({ type: 'safety-score-detail', data: { title: 'Safety Score' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Safety Score</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={92} color="green" label="92%" sublabel="Fleet-wide" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200" onClick={() => push({ type: 'incidents', data: { title: 'Safety Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Safety Metrics</h3>
                    <div className="space-y-1">
                        <QuickStat label="Near Misses" value="8" trend="down" />
                        <QuickStat label="Training Complete" value="96%" trend="up" />
                        <QuickStat label="Violations" value="2" />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 cursor-pointer hover:border-blue-600 hover:shadow-lg transition-all duration-200" onClick={() => push({ type: 'incidents', data: { title: 'Response Time' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-6">Response Time</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={88} color="blue" label="88%" sublabel="4.2 min avg" />
                    </div>
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
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Safety Alerts</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Alerts" value="6" variant="warning" icon={<Bell className="w-6 h-6" />} onClick={() => push({ type: 'safety-alerts', data: { title: 'Active Alerts', filter: 'active' }, id: 'active-alerts' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Critical" value="1" variant="danger" onClick={() => push({ type: 'safety-alerts', data: { title: 'Critical Alerts', filter: 'critical' }, id: 'critical-alerts' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Acknowledged" value="4" variant="success" onClick={() => push({ type: 'safety-alerts', data: { title: 'Acknowledged Alerts', filter: 'acknowledged' }, id: 'acknowledged-alerts' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Auto-Resolved" value="12" variant="default" onClick={() => push({ type: 'safety-alerts', data: { title: 'Auto-Resolved Alerts', filter: 'auto-resolved' }, id: 'auto-resolved-alerts' } as Omit<DrilldownLevel, "timestamp">)} />
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