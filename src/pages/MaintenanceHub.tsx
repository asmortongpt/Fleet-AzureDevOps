/**
 * MaintenanceHub - Premium Maintenance Management Hub
 * Route: /maintenance
 */

import {
    Wrench as MaintenanceIcon,
    Wrench,
    Warehouse,
    ChartLine,
    CalendarDots,
    ClipboardText
} from '@phosphor-icons/react'

import { HubPage, HubTab, HubSection, HubGrid } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function GarageContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 min-h-full overflow-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Garage & Service</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Maintenance bay status and work orders</p>
                </div>
                <StatusDot status="online" label="Shop Open" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Work Orders"
                    value="12"
                    subtitle="4 urgent"
                    variant="primary"
                    icon={<ClipboardText className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'work-orders', label: 'Work Orders', data: { title: 'Work Orders' }, id: 'work-orders' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="In Progress"
                    value="5"
                    subtitle="2 technicians"
                    variant="warning"
                    icon={<Wrench className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'in-progress', label: 'In Progress', data: { title: 'In Progress' }, id: 'in-progress' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Completed Today"
                    value="8"
                    trend="up"
                    trendValue="+3"
                    variant="success"
                    onClick={() => push({ type: 'garage-overview', label: 'Completed Today', data: { title: 'Completed Today' }, id: 'completed-today' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Parts Waiting"
                    value="3"
                    variant="danger"
                    onClick={() => push({ type: 'garage-overview', label: 'Parts Waiting', data: { title: 'Parts Waiting' }, id: 'parts-waiting' } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div
                    className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => push({ type: 'bay-utilization', label: 'Bay Utilization', data: { title: 'Bay Utilization' }, id: 'bay-utilization' } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Bay Utilization</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={75} color="blue" label="5 of 8" sublabel="bays in use" />
                    </div>
                </div>

                <div
                    className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-border transition-all duration-300"
                    onClick={() => push({ type: 'maintenance-calendar', label: 'Weekly Schedule', data: { title: 'Weekly Schedule' }, id: 'weekly-schedule' } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">This Week</h3>
                    <div className="space-y-0.5">
                        <QuickStat label="Scheduled" value="24" />
                        <QuickStat label="Completed" value="18" trend="up" />
                        <QuickStat label="Avg Repair Time" value="3.2 hrs" trend="down" />
                        <QuickStat label="Parts Cost" value="$4,250" />
                    </div>
                </div>

                <div
                    className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-success/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => push({ type: 'garage-overview', label: 'Efficiency Score', data: { title: 'Efficiency Score' }, id: 'efficiency-score' } as Omit<DrilldownLevel, "timestamp">)}
                    role="button"
                    tabIndex={0}
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Efficiency</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={88} color="green" label="Score" sublabel="vs 82% last month" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function PredictiveContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Predictive Maintenance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Predictions Active"
                    value="156"
                    variant="primary"
                    icon={<ChartLine className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'predictions-active', label: 'Active Predictions', data: { title: 'Active Predictions' }, id: 'predictions-active' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Alerts"
                    value="8"
                    variant="warning"
                    onClick={() => push({ type: 'predictive-maintenance', label: 'Alerts', data: { title: 'Alerts' }, id: 'alerts' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Prevented Failures"
                    value="12"
                    variant="success"
                    trend="up"
                    trendValue="this month"
                    onClick={() => push({ type: 'predictive-maintenance', label: 'Prevented Failures', data: { title: 'Prevented Failures' }, id: 'prevented-failures' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Savings"
                    value="$28K"
                    variant="success"
                    onClick={() => push({ type: 'predictive-maintenance', label: 'Cost Savings', data: { title: 'Cost Savings' }, id: 'cost-savings' } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function CalendarContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Maintenance Calendar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    title="Today"
                    value="4"
                    variant="primary"
                    icon={<CalendarDots className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'maintenance-today', label: 'Today\'s Schedule', data: { title: 'Today\'s Schedule' }, id: 'today-schedule' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="This Week"
                    value="18"
                    variant="default"
                    onClick={() => push({ type: 'maintenance-calendar', label: 'Weekly Schedule', data: { title: 'Weekly Schedule' }, id: 'weekly-schedule' } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Overdue"
                    value="2"
                    variant="danger"
                    onClick={() => push({ type: 'maintenance-overdue', label: 'Overdue', data: { title: 'Overdue' }, id: 'overdue' } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>
        </div>
    )
}

function RequestsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Maintenance Requests</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="New Requests"
                    value="6"
                    variant="primary"
                    onClick={() => push({ type: 'maintenance-requests-list', label: 'New Requests', id: 'new-requests', data: { status: 'new' } })}
                />
                <StatCard
                    title="In Review"
                    value="4"
                    variant="warning"
                    onClick={() => push({ type: 'maintenance-requests-list', label: 'In Review', id: 'in-review-requests', data: { status: 'in-review' } })}
                />
                <StatCard
                    title="Approved"
                    value="8"
                    variant="success"
                    onClick={() => push({ type: 'maintenance-requests-list', label: 'Approved', id: 'approved-requests', data: { status: 'approved' } })}
                />
                <StatCard
                    title="Completed"
                    value="45"
                    variant="default"
                    onClick={() => push({ type: 'maintenance-requests-list', label: 'Completed', id: 'completed-requests', data: { status: 'completed' } })}
                />
            </div>
        </div>
    )
}

export function MaintenanceHub() {
    const tabs: HubTab[] = [
        { id: 'garage', label: 'Garage', icon: <Warehouse className="w-4 h-4" />, content: <GarageContent /> },
        { id: 'predictive', label: 'Predictive', icon: <ChartLine className="w-4 h-4" />, content: <PredictiveContent /> },
        { id: 'calendar', label: 'Calendar', icon: <CalendarDots className="w-4 h-4" />, content: <CalendarContent /> },
        { id: 'requests', label: 'Requests', icon: <ClipboardText className="w-4 h-4" />, content: <RequestsContent /> },
    ]

    return (
        <HubPage
            title="Maintenance Hub"
            icon={<MaintenanceIcon className="w-6 h-6" />}
            description="Garage services and predictive maintenance"
            tabs={tabs}
            defaultTab="garage"
        />
    )
}

export default MaintenanceHub
