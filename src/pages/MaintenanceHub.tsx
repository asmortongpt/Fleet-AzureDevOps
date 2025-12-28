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

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

function GarageContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent min-h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Garage & Service</h2>
                    <p className="text-slate-400 mt-1">Maintenance bay status and work orders</p>
                </div>
                <StatusDot status="online" label="Shop Open" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Work Orders" value="12" subtitle="4 urgent" variant="primary" icon={<ClipboardText className="w-6 h-6" />} onClick={() => push({ type: 'work-orders', data: { title: 'Work Orders' } })} />
                <StatCard title="In Progress" value="5" subtitle="2 technicians" variant="warning" icon={<Wrench className="w-6 h-6" />} onClick={() => push({ type: 'in-progress', data: { title: 'In Progress' } })} />
                <StatCard title="Completed Today" value="8" trend="up" trendValue="+3" variant="success" onClick={() => push({ type: 'garage-overview', data: { title: 'Completed Today' } })} />
                <StatCard title="Parts Waiting" value="3" variant="danger" onClick={() => push({ type: 'garage-overview', data: { title: 'Parts Waiting' } })} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'bay-utilization', data: { title: 'Bay Utilization' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Bay Utilization</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={75} color="blue" label="5 of 8" sublabel="bays in use" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'maintenance-calendar', data: { title: 'Weekly Schedule' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">This Week</h3>
                    <div className="space-y-1">
                        <QuickStat label="Scheduled" value="24" />
                        <QuickStat label="Completed" value="18" trend="up" />
                        <QuickStat label="Avg Repair Time" value="3.2 hrs" trend="down" />
                        <QuickStat label="Parts Cost" value="$4,250" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'garage-overview', data: { title: 'Efficiency Score' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Efficiency</h3>
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
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Predictive Maintenance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Predictions Active" value="156" variant="primary" icon={<ChartLine className="w-6 h-6" />} onClick={() => push({ type: 'predictions-active', data: { title: 'Active Predictions' } })} />
                <StatCard title="Alerts" value="8" variant="warning" onClick={() => push({ type: 'predictive-maintenance', data: { title: 'Alerts' } })} />
                <StatCard title="Prevented Failures" value="12" variant="success" trend="up" trendValue="this month" onClick={() => push({ type: 'predictive-maintenance', data: { title: 'Prevented Failures' } })} />
                <StatCard title="Savings" value="$28K" variant="success" onClick={() => push({ type: 'predictive-maintenance', data: { title: 'Cost Savings' } })} />
            </div>
        </div>
    )
}

function CalendarContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Maintenance Calendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Today" value="4" variant="primary" icon={<CalendarDots className="w-6 h-6" />} onClick={() => push({ type: 'maintenance-today', data: { title: 'Today\'s Schedule' } })} />
                <StatCard title="This Week" value="18" variant="default" onClick={() => push({ type: 'maintenance-calendar', data: { title: 'Weekly Schedule' } })} />
                <StatCard title="Overdue" value="2" variant="danger" onClick={() => push({ type: 'maintenance-overdue', data: { title: 'Overdue' } })} />
            </div>
        </div>
    )
}

function RequestsContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Maintenance Requests</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="New Requests" value="6" variant="primary" />
                <StatCard title="In Review" value="4" variant="warning" />
                <StatCard title="Approved" value="8" variant="success" />
                <StatCard title="Completed" value="45" variant="default" />
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
