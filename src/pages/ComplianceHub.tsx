/**
 * ComplianceHub - Premium Compliance Management Hub
 * Route: /compliance
 */

import {
    Shield as ComplianceIcon,
    ChartBar,
    MapTrifold,
    FirstAid,
    Truck,
    Receipt,
    CheckCircle,
    Warning
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, QuickStat } from '@/components/ui/stat-card'

function DashboardContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Compliance Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Overall Score" value="94%" variant="success" icon={<CheckCircle className="w-6 h-6" />} />
                <StatCard title="DOT Compliance" value="98%" variant="success" />
                <StatCard title="IFTA Compliance" value="100%" variant="success" />
                <StatCard title="Violations" value="2" variant="warning" icon={<Warning className="w-6 h-6" />} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">DOT Status</h3>
                    <ProgressRing progress={98} color="green" label="Compliant" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Metrics</h3>
                    <QuickStat label="Audits Passed" value="12/12" trend="up" />
                    <QuickStat label="Docs Current" value="156" />
                    <QuickStat label="Expiring Soon" value="4" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">OSHA Status</h3>
                    <ProgressRing progress={92} color="green" label="Score" />
                </div>
            </div>
        </div>
    )
}

function MapContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Compliance Map</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Regions" value="12" variant="primary" icon={<MapTrifold className="w-6 h-6" />} />
                <StatCard title="Compliant Zones" value="10" variant="success" />
                <StatCard title="Attention Needed" value="2" variant="warning" />
            </div>
        </div>
    )
}

function DOTContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">DOT Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Vehicles Compliant" value="152" variant="success" icon={<Truck className="w-6 h-6" />} />
                <StatCard title="Inspections Due" value="8" variant="warning" />
                <StatCard title="HOS Violations" value="0" variant="success" />
                <StatCard title="ELD Status" value="100%" variant="success" />
            </div>
        </div>
    )
}

function IFTAContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">IFTA Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Quarters Filed" value="4/4" variant="success" icon={<Receipt className="w-6 h-6" />} />
                <StatCard title="Miles Tracked" value="2.4M" variant="primary" />
                <StatCard title="Fuel Tax Due" value="$12,450" variant="default" />
            </div>
        </div>
    )
}

function OSHAContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">OSHA Safety Forms</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Forms Complete" value="24" variant="success" icon={<FirstAid className="w-6 h-6" />} />
                <StatCard title="Pending" value="3" variant="warning" />
                <StatCard title="Incidents YTD" value="2" variant="warning" />
                <StatCard title="Days Safe" value="47" variant="success" />
            </div>
        </div>
    )
}

export function ComplianceHub() {
    const tabs: HubTab[] = [
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="w-4 h-4" />, content: <DashboardContent /> },
        { id: 'map', label: 'Map', icon: <MapTrifold className="w-4 h-4" />, content: <MapContent /> },
        { id: 'dot', label: 'DOT', icon: <Truck className="w-4 h-4" />, content: <DOTContent /> },
        { id: 'ifta', label: 'IFTA', icon: <Receipt className="w-4 h-4" />, content: <IFTAContent /> },
        { id: 'osha', label: 'OSHA', icon: <FirstAid className="w-4 h-4" />, content: <OSHAContent /> },
    ]

    return (
        <HubPage
            title="Compliance Hub"
            icon={<ComplianceIcon className="w-6 h-6" />}
            description="DOT, IFTA, and safety compliance management"
            tabs={tabs}
            defaultTab="dashboard"
        />
    )
}

export default ComplianceHub
