/**
 * AdminHub - Premium Administration Hub
 * Route: /admin
 */

import {
    Gear as AdminIcon,
    ChartBar,
    Bell,
    FolderOpen,
    Brain,
    FileText,
    GearSix,
    Users,
    Key,
    CloudArrowUp
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat, StatusDot } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

function DashboardContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                <StatusDot status="online" label="All Systems Operational" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Users" value="156" variant="primary" icon={<Users className="w-6 h-6" />} onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Users', data: { title: 'Users' } })} />
                <StatCard title="Active Sessions" value="42" variant="success" onClick={() => push({ id: 'active-sessions', type: 'active-sessions', label: 'Active Sessions', data: { title: 'Active Sessions' } })} />
                <StatCard title="API Calls Today" value="12.4K" variant="default" icon={<CloudArrowUp className="w-6 h-6" />} onClick={() => push({ id: 'system-health', type: 'system-health', label: 'API Calls', data: { title: 'API Calls' } })} />
                <StatCard title="Uptime" value="99.9%" variant="success" onClick={() => push({ id: 'uptime', type: 'uptime', label: 'Uptime', data: { title: 'Uptime' } })} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'System Health', data: { title: 'System Health' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">System Health</h3>
                    <ProgressRing progress={98} color="green" label="Healthy" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Resources', data: { title: 'Resources' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Resources</h3>
                    <QuickStat label="CPU Usage" value="24%" />
                    <QuickStat label="Memory" value="4.2 GB" />
                    <QuickStat label="Storage" value="67%" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'API Health', data: { title: 'API Health' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">API Health</h3>
                    <ProgressRing progress={100} color="green" label="100%" sublabel="endpoints healthy" />
                </div>
            </div>
        </div>
    )
}

function AlertsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Alerts & Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Alerts" value="3" variant="warning" icon={<Bell className="w-6 h-6" />} onClick={() => push({ id: 'system-alerts', type: 'system-alerts', label: 'Active Alerts', data: { title: 'Active Alerts' } })} />
                <StatCard title="Critical" value="0" variant="success" onClick={() => push({ id: 'critical-alerts', type: 'critical-alerts', label: 'Critical Alerts', data: { title: 'Critical Alerts' } })} />
                <StatCard title="Resolved Today" value="12" variant="success" onClick={() => push({ id: 'resolved-today', type: 'resolved-today', label: 'Resolved Today', data: { title: 'Resolved Today' } })} />
                <StatCard title="Suppressed" value="2" variant="default" onClick={() => push({ id: 'suppressed', type: 'suppressed', label: 'Suppressed', data: { title: 'Suppressed' } })} />
            </div>
        </div>
    )
}

function DocumentsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Document Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Documents" value="1,245" variant="primary" icon={<FolderOpen className="w-6 h-6" />} onClick={() => push({ id: 'files', type: 'files', label: 'Total Documents', data: { title: 'Total Documents' } })} />
                <StatCard title="Shared" value="456" variant="default" onClick={() => push({ id: 'shared-files', type: 'shared-files', label: 'Shared Files', data: { title: 'Shared Files' } })} />
                <StatCard title="Uploaded Today" value="24" variant="success" onClick={() => push({ id: 'uploaded-today', type: 'uploaded-today', label: 'Uploaded Today', data: { title: 'Uploaded Today' } })} />
                <StatCard title="Storage Used" value="24 GB" variant="default" onClick={() => push({ id: 'files', type: 'files', label: 'Storage', data: { title: 'Storage Used' } })} />
            </div>
        </div>
    )
}

function PolicyContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Policy Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Policies" value="24" variant="primary" icon={<Brain className="w-6 h-6" />} onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Active Policies', data: { title: 'Active Policies' } })} />
                <StatCard title="Rules" value="156" variant="default" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Rules', data: { title: 'Rules' } })} />
                <StatCard title="Violations" value="3" variant="warning" onClick={() => push({ id: 'system-alerts', type: 'system-alerts', label: 'Violations', data: { title: 'Violations' } })} />
                <StatCard title="Auto-Enforced" value="89%" variant="success" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Auto-Enforced', data: { title: 'Auto-Enforced' } })} />
            </div>
        </div>
    )
}

function FormsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Form Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Templates" value="18" variant="primary" icon={<FileText className="w-6 h-6" />} onClick={() => push({ id: 'files', type: 'files', label: 'Form Templates', data: { title: 'Form Templates' } })} />
                <StatCard title="Submissions" value="456" variant="success" onClick={() => push({ id: 'files', type: 'files', label: 'Submissions', data: { title: 'Submissions' } })} />
                <StatCard title="Pending Review" value="12" variant="warning" onClick={() => push({ id: 'system-alerts', type: 'system-alerts', label: 'Pending Review', data: { title: 'Pending Review' } })} />
            </div>
        </div>
    )
}

function SettingsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Configurations" value="45" variant="primary" icon={<GearSix className="w-6 h-6" />} onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Configurations', data: { title: 'Configurations' } })} />
                <StatCard title="Integrations" value="12" variant="success" onClick={() => push({ id: 'system-health', type: 'system-health', label: 'Integrations', data: { title: 'Integrations' } })} />
                <StatCard title="API Keys" value="8" variant="default" icon={<Key className="w-6 h-6" />} onClick={() => push({ id: 'system-health', type: 'system-health', label: 'API Keys', data: { title: 'API Keys' } })} />
            </div>
        </div>
    )
}

export function AdminHub() {
    const tabs: HubTab[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="w-4 h-4" />, content: <DashboardContent /> },
        { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" />, content: <AlertsContent /> },
        { id: 'documents', label: 'Documents', icon: <FolderOpen className="w-4 h-4" />, content: <DocumentsContent /> },
        { id: 'policy', label: 'Policy', icon: <Brain className="w-4 h-4" />, content: <PolicyContent /> },
        { id: 'forms', label: 'Forms', icon: <FileText className="w-4 h-4" />, content: <FormsContent /> },
        { id: 'settings', label: 'Settings', icon: <GearSix className="w-4 h-4" />, content: <SettingsContent /> },
    ]

    return (
        <HubPage
            title="Admin Hub"
            icon={<AdminIcon className="w-6 h-6" />}
            description="System administration and configuration"
            tabs={tabs}
            defaultTab="dashboard"
        />
    )
}

export default AdminHub
