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

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { HubPage, type HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'
import { logger } from '@/utils/logger'

function ExecutiveContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2 bg-gradient-to-b from-background to-background/95 min-h-full overflow-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-sm sm:text-base lg:text-sm font-bold text-foreground">Executive Dashboard</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">High-level KPIs and business metrics</p>
                </div>
                <StatusDot status="online" label="Real-time" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2">
                <StatCard
                    title="Fleet Utilization"
                    value="87%"
                    trend="up"
                    trendValue="+5%"
                    variant="success"
                    icon={<Gauge className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'fleet-kpis', data: { title: 'Fleet Utilization' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Cost per Mile"
                    value="$0.42"
                    trend="down"
                    trendValue="-3¢"
                    variant="success"
                    icon={<CurrencyDollar className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'cost-analysis', data: { title: 'Cost per Mile' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="On-Time Rate"
                    value="94%"
                    trend="up"
                    trendValue="+2%"
                    variant="primary"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'On-Time Performance' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Safety Score"
                    value="92"
                    trend="up"
                    trendValue="+4"
                    variant="success"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Safety Score' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-2">
                <div
                    className="bg-card/80 backdrop-blur-xl rounded-md border border-border/50 p-2 sm:p-3 cursor-pointer hover:border-success/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Revenue Trend' } } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue Trend</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={112} color="green" label="$1.2M" sublabel="MTD vs target" />
                    </div>
                </div>

                <div
                    className="bg-card/80 backdrop-blur-xl rounded-md border border-border/50 p-2 sm:p-3 cursor-pointer hover:border-border transition-all duration-300"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Key Metrics' } } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Metrics</h3>
                    <div className="space-y-0.5">
                        <QuickStat label="Total Revenue" value="$1.24M" trend="up" />
                        <QuickStat label="Operating Costs" value="$890K" trend="down" />
                        <QuickStat label="Margin" value="28%" trend="up" />
                        <QuickStat label="Customer NPS" value="72" trend="up" />
                    </div>
                </div>

                <div
                    className="bg-card/80 backdrop-blur-xl rounded-md border border-border/50 p-2 sm:p-3 cursor-pointer hover:border-primary/40 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Goal Progress' } } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Goal Progress</h3>
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
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-sm sm:text-base lg:text-sm font-bold text-foreground">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2">
                <StatCard
                    title="Active Reports"
                    value="24"
                    variant="primary"
                    icon={<ChartBar className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Active Reports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Scheduled"
                    value="12"
                    variant="default"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Scheduled Reports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="This Week"
                    value="156"
                    variant="success"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Weekly Reports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Data Points"
                    value="2.4M"
                    variant="default"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Data Overview' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function WorkbenchContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-sm sm:text-base lg:text-sm font-bold text-foreground">Data Workbench</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
                <StatCard
                    title="Queries"
                    value="45"
                    variant="primary"
                    icon={<Database className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Saved Queries' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Saved Views"
                    value="18"
                    variant="default"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Saved Views' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Exports"
                    value="23"
                    variant="success"
                    onClick={() => push({ type: 'executive-dashboard', data: { title: 'Exports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function OptimizerContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-sm sm:text-base lg:text-sm font-bold text-foreground">Fleet Optimizer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2">
                <StatCard
                    title="Recommendations"
                    value="8"
                    variant="primary"
                    icon={<TrendUp className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'optimization-recommendations', data: { title: 'Recommendations' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Implemented"
                    value="24"
                    variant="success"
                    onClick={() => push({ type: 'fleet-optimizer', data: { title: 'Implemented' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Est. Savings"
                    value="$45K"
                    variant="success"
                    onClick={() => push({ type: 'fleet-optimizer', data: { title: 'Estimated Savings' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="ROI"
                    value="340%"
                    variant="success"
                    onClick={() => push({ type: 'fleet-optimizer', data: { title: 'ROI Analysis' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function CostsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-2 sm:p-3 space-y-2 sm:space-y-2 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-sm sm:text-base lg:text-sm font-bold text-foreground">Cost Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-2">
                <StatCard
                    title="Total TCO"
                    value="$2.4M"
                    variant="primary"
                    icon={<CurrencyDollar className="w-3 h-3 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'total-tco', data: { title: 'Total Cost of Ownership' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Per Vehicle"
                    value="$15.4K"
                    variant="default"
                    onClick={() => push({ type: 'cost-analysis', data: { title: 'Per Vehicle Cost' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Fuel Cost"
                    value="$890K"
                    variant="warning"
                    onClick={() => push({ type: 'fuel-cost', data: { title: 'Fuel Cost Analysis' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Savings YTD"
                    value="$124K"
                    variant="success"
                    onClick={() => push({ type: 'cost-analysis', data: { title: 'Savings YTD' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function ReportsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-3 space-y-2 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-sm font-bold text-white">Custom Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <StatCard
                    title="Templates"
                    value="18"
                    variant="primary"
                    icon={<FileText className="w-4 h-4" />}
                    onClick={() => push({ type: 'report-templates', data: { title: 'Report Templates' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Scheduled"
                    value="12"
                    variant="default"
                    onClick={() => push({ type: 'scheduled-reports', data: { title: 'Scheduled Reports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Generated"
                    value="245"
                    variant="success"
                    onClick={() => push({ type: 'generated-reports', data: { title: 'Generated Reports' } } as Omit<DrilldownLevel, "timestamp">)}
                />
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
            icon={<AnalyticsIcon className="w-4 h-4" />}
            description="Dashboards, reports, and fleet optimization"
            tabs={tabs}
            defaultTab="executive"
        />
    )
}

const WrappedAnalyticsHub = () => (
    <ErrorBoundary
        onError={(error, errorInfo) => {
            logger.error('AnalyticsHub error', error, {
                component: 'AnalyticsHub',
                errorInfo
            })
        }}
    >
        <AnalyticsHub />
    </ErrorBoundary>
)

export default WrappedAnalyticsHub
