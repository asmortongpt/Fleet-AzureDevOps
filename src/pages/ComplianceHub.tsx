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
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function DashboardContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Compliance Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Overall Score" value="94%" variant="success" icon={<CheckCircle className="w-6 h-6" />} onClick={() => push({ type: 'regulations', data: { title: 'Overall Score' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="DOT Compliance" value="98%" variant="success" onClick={() => push({ type: 'dot-compliance', data: { title: 'DOT Compliance' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="IFTA Compliance" value="100%" variant="success" onClick={() => push({ type: 'ifta-compliance', data: { title: 'IFTA Compliance' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Violations" value="2" variant="warning" icon={<Warning className="w-6 h-6" />} onClick={() => push({ type: 'regulations', data: { title: 'Violations' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'dot-compliance', data: { title: 'DOT Status' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">DOT Status</h3>
                    <ProgressRing progress={98} color="green" label="Compliant" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'regulations', data: { title: 'Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Metrics</h3>
                    <QuickStat label="Audits Passed" value="12/12" trend="up" />
                    <QuickStat label="Docs Current" value="156" />
                    <QuickStat label="Expiring Soon" value="4" />
                </div>
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'csa', data: { title: 'OSHA Status' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">OSHA Status</h3>
                    <ProgressRing progress={92} color="green" label="Score" />
                </div>
            </div>
        </div>
    )
}

function MapContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Compliance Map</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Regions" value="12" variant="primary" icon={<MapTrifold className="w-6 h-6" />} onClick={() => push({ type: 'geofence-compliance', data: { title: 'Regions' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Compliant Zones" value="10" variant="success" onClick={() => push({ type: 'compliant-zones', data: { title: 'Compliant Zones' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Attention Needed" value="2" variant="warning" onClick={() => push({ type: 'attention-zones', data: { title: 'Attention Needed' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function DOTContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">DOT Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Vehicles Compliant" value="152" variant="success" icon={<Truck className="w-6 h-6" />} onClick={() => push({ type: 'inspections', data: { title: 'Vehicles Compliant' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Inspections Due" value="8" variant="warning" onClick={() => push({ type: 'inspections-due', data: { title: 'Inspections Due' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="HOS Violations" value="0" variant="success" onClick={() => push({ type: 'hos-violations', data: { title: 'HOS Violations' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="ELD Status" value="100%" variant="success" onClick={() => push({ type: 'eld-status', data: { title: 'ELD Status' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function IFTAContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">IFTA Compliance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Quarters Filed" value="4/4" variant="success" icon={<Receipt className="w-6 h-6" />} onClick={() => push({ type: 'ifta', data: { title: 'Quarters Filed' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Miles Tracked" value="2.4M" variant="primary" onClick={() => push({ type: 'miles-tracked', data: { title: 'Miles Tracked' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Fuel Tax Due" value="$12,450" variant="default" onClick={() => push({ type: 'fuel-tax-due', data: { title: 'Fuel Tax Due' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function OSHAContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">OSHA Safety Forms</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Forms Complete" value="24" variant="success" icon={<FirstAid className="w-6 h-6" />} onClick={() => push({ type: 'csa', data: { title: 'Forms Complete' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Pending" value="3" variant="warning" onClick={() => push({ type: 'csa-pending', data: { title: 'Pending Forms' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Incidents YTD" value="2" variant="warning" onClick={() => push({ type: 'incidents-ytd', data: { title: 'Incidents YTD' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Days Safe" value="47" variant="success" onClick={() => push({ type: 'days-safe', data: { title: 'Days Safe' } } as Omit<DrilldownLevel, "timestamp">)} />
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