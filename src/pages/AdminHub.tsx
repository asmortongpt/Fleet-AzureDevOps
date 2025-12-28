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

function DashboardContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                <StatusDot status="online" label="All Systems Operational" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Users" value="156" variant="primary" icon={<Users className="w-6 h-6" />} />
                <StatCard title="Active Sessions" value="42" variant="success" />
                <StatCard title="API Calls Today" value="12.4K" variant="default" icon={<CloudArrowUp className="w-6 h-6" />} />
                <StatCard title="Uptime" value="99.9%" variant="success" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">System Health</h3>
                    <ProgressRing progress={98} color="green" label="Healthy" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Resources</h3>
                    <QuickStat label="CPU Usage" value="24%" />
                    <QuickStat label="Memory" value="4.2 GB" />
                    <QuickStat label="Storage" value="67%" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">API Health</h3>
                    <ProgressRing progress={100} color="green" label="100%" sublabel="endpoints healthy" />
                </div>
            </div>
        </div>
    )
}

function AlertsContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Alerts & Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Alerts" value="3" variant="warning" icon={<Bell className="w-6 h-6" />} />
                <StatCard title="Critical" value="0" variant="success" />
                <StatCard title="Resolved Today" value="12" variant="success" />
                <StatCard title="Suppressed" value="2" variant="default" />
            </div>
        </div>
    )
}

function DocumentsContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Document Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Documents" value="1,245" variant="primary" icon={<FolderOpen className="w-6 h-6" />} />
                <StatCard title="Shared" value="456" variant="default" />
                <StatCard title="Uploaded Today" value="24" variant="success" />
                <StatCard title="Storage Used" value="24 GB" variant="default" />
            </div>
        </div>
    )
}

function PolicyContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Policy Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Policies" value="24" variant="primary" icon={<Brain className="w-6 h-6" />} />
                <StatCard title="Rules" value="156" variant="default" />
                <StatCard title="Violations" value="3" variant="warning" />
                <StatCard title="Auto-Enforced" value="89%" variant="success" />
            </div>
        </div>
    )
}

function FormsContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Form Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Templates" value="18" variant="primary" icon={<FileText className="w-6 h-6" />} />
                <StatCard title="Submissions" value="456" variant="success" />
                <StatCard title="Pending Review" value="12" variant="warning" />
            </div>
        </div>
    )
}

function SettingsContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Configurations" value="45" variant="primary" icon={<GearSix className="w-6 h-6" />} />
                <StatCard title="Integrations" value="12" variant="success" />
                <StatCard title="API Keys" value="8" variant="default" icon={<Key className="w-6 h-6" />} />
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
