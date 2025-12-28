/**
 * AnalyticsHub - Premium Analytics & Reporting Hub
 * Route: /analytics
 */

import {
    ChartLine as AnalyticsIcon,
    PresentationChart,
    ChartBar,
    Database,
    Gauge,
    CurrencyDollar,
    FileText,
    TrendUp
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

function ExecutiveContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent min-h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Executive Dashboard</h2>
                    <p className="text-slate-400 mt-1">High-level KPIs and business metrics</p>
                </div>
                <StatusDot status="online" label="Real-time" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Fleet Utilization" value="87%" trend="up" trendValue="+5%" variant="success" icon={<Gauge className="w-6 h-6" />} onClick={() => push({ type: 'fleet-kpis', data: { title: 'Fleet Utilization' } })} />
                <StatCard title="Cost per Mile" value="$0.42" trend="down" trendValue="-3¢" variant="success" icon={<CurrencyDollar className="w-6 h-6" />} onClick={() => push({ type: 'cost-analysis', data: { title: 'Cost per Mile' } })} />
                <StatCard title="On-Time Rate" value="94%" trend="up" trendValue="+2%" variant="primary" onClick={() => push({ type: 'executive-dashboard', data: { title: 'On-Time Performance' } })} />
                <StatCard title="Safety Score" value="92" trend="up" trendValue="+4" variant="success" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Safety Score' } })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Revenue Trend' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Revenue Trend</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={112} color="green" label="$1.2M" sublabel="MTD vs target" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Key Metrics' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Key Metrics</h3>
                    <div className="space-y-1">
                        <QuickStat label="Total Revenue" value="$1.24M" trend="up" />
                        <QuickStat label="Operating Costs" value="$890K" trend="down" />
                        <QuickStat label="Margin" value="28%" trend="up" />
                        <QuickStat label="Customer NPS" value="72" trend="up" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Goal Progress' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Goal Progress</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={78} color="blue" label="Q4 Goals" sublabel="12 of 15 complete" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function DashboardContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Active Reports" value="24" variant="primary" icon={<ChartBar className="w-6 h-6" />} onClick={() => push({ type: 'executive-dashboard', data: { title: 'Active Reports' } })} />
                <StatCard title="Scheduled" value="12" variant="default" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Scheduled Reports' } })} />
                <StatCard title="This Week" value="156" variant="success" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Weekly Reports' } })} />
                <StatCard title="Data Points" value="2.4M" variant="default" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Data Overview' } })} />
            </div>
        </div>
    )
}

function WorkbenchContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Data Workbench</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Queries" value="45" variant="primary" icon={<Database className="w-6 h-6" />} onClick={() => push({ type: 'executive-dashboard', data: { title: 'Saved Queries' } })} />
                <StatCard title="Saved Views" value="18" variant="default" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Saved Views' } })} />
                <StatCard title="Exports" value="23" variant="success" onClick={() => push({ type: 'executive-dashboard', data: { title: 'Exports' } })} />
            </div>
        </div>
    )
}

function OptimizerContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Fleet Optimizer</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Recommendations" value="8" variant="primary" icon={<TrendUp className="w-6 h-6" />} onClick={() => push({ type: 'optimization-recommendations', data: { title: 'Recommendations' } })} />
                <StatCard title="Implemented" value="24" variant="success" onClick={() => push({ type: 'fleet-optimizer', data: { title: 'Implemented' } })} />
                <StatCard title="Est. Savings" value="$45K" variant="success" onClick={() => push({ type: 'fleet-optimizer', data: { title: 'Estimated Savings' } })} />
                <StatCard title="ROI" value="340%" variant="success" onClick={() => push({ type: 'fleet-optimizer', data: { title: 'ROI Analysis' } })} />
            </div>
        </div>
    )
}

function CostsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Cost Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total TCO" value="$2.4M" variant="primary" icon={<CurrencyDollar className="w-6 h-6" />} onClick={() => push({ type: 'total-tco', data: { title: 'Total Cost of Ownership' } })} />
                <StatCard title="Per Vehicle" value="$15.4K" variant="default" onClick={() => push({ type: 'cost-analysis', data: { title: 'Per Vehicle Cost' } })} />
                <StatCard title="Fuel Cost" value="$890K" variant="warning" onClick={() => push({ type: 'fuel-cost', data: { title: 'Fuel Cost Analysis' } })} />
                <StatCard title="Savings YTD" value="$124K" variant="success" onClick={() => push({ type: 'cost-analysis', data: { title: 'Savings YTD' } })} />
            </div>
        </div>
    )
}

function ReportsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Custom Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Templates" value="18" variant="primary" icon={<FileText className="w-6 h-6" />} />
                <StatCard title="Scheduled" value="12" variant="default" />
                <StatCard title="Generated" value="245" variant="success" />
            </div>
        </div>
    )
}

export function AnalyticsHub() {
    const tabs: HubTab[] = [
        { id: 'executive', label: 'Executive', icon: <PresentationChart className="w-4 h-4" />, content: <ExecutiveContent /> },
        { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="w-4 h-4" />, content: <DashboardContent /> },
        { id: 'workbench', label: 'Workbench', icon: <Database className="w-4 h-4" />, content: <WorkbenchContent /> },
        { id: 'optimizer', label: 'Optimizer', icon: <Gauge className="w-4 h-4" />, content: <OptimizerContent /> },
        { id: 'costs', label: 'Costs', icon: <CurrencyDollar className="w-4 h-4" />, content: <CostsContent /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" />, content: <ReportsContent /> },
    ]

    return (
        <HubPage
            title="Analytics Hub"
            icon={<AnalyticsIcon className="w-6 h-6" />}
            description="Dashboards, reports, and fleet optimization"
            tabs={tabs}
            defaultTab="executive"
        />
    )
}

export default AnalyticsHub
