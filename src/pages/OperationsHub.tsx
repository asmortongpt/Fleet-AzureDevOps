/**
 * OperationsHub - Premium Operations Management Hub
 * Route: /operations
 */

import {
    Broadcast as OperationsIcon,
    MapTrifold,
    RadioButton,
    CheckSquare,
    CalendarDots,
    Truck,
    Package,
    Clock,
    Warning
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown } from '@/contexts/DrilldownContext'

/**
 * Premium Dispatch Tab Content
 */
function DispatchContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent min-h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dispatch Console</h2>
                    <p className="text-slate-400 mt-1">Real-time job management and driver assignments</p>
                </div>
                <StatusDot status="online" label="Live Updates" />
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Active Jobs"
                    value="24"
                    subtitle="6 starting within hour"
                    trend="up"
                    trendValue="+4"
                    variant="primary"
                    icon={<Package className="w-6 h-6" />}
                    onClick={() => push({ type: 'active-jobs', data: { title: 'Active Jobs' } })}
                />
                <StatCard
                    title="In Transit"
                    value="18"
                    subtitle="On schedule"
                    variant="success"
                    icon={<Truck className="w-6 h-6" />}
                    onClick={() => push({ type: 'in-transit', data: { title: 'In Transit' } })}
                />
                <StatCard
                    title="Completed Today"
                    value="156"
                    subtitle="Target: 160"
                    trend="up"
                    trendValue="+12%"
                    variant="success"
                    icon={<CheckSquare className="w-6 h-6" />}
                    onClick={() => push({ type: 'dispatch', data: { title: 'Completed Today' } })}
                />
                <StatCard
                    title="Delayed"
                    value="3"
                    subtitle="1 critical"
                    trend="down"
                    trendValue="-2"
                    variant="danger"
                    icon={<Warning className="w-6 h-6" />}
                    onClick={() => push({ type: 'delayed', data: { title: 'Delayed Jobs' } })}
                />
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* On-Time Rate */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'dispatch', data: { title: 'On-Time Performance' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">On-Time Rate</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={94} color="green" label="Today" sublabel="vs 91% yesterday" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'dispatch', data: { title: 'Metrics' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Today's Metrics</h3>
                    <div className="space-y-1">
                        <QuickStat label="Avg Delivery Time" value="42 min" trend="down" />
                        <QuickStat label="Jobs/Driver" value="8.2" trend="up" />
                        <QuickStat label="Distance Covered" value="2,847 mi" />
                        <QuickStat label="Customer Rating" value="4.8/5" trend="up" />
                    </div>
                </div>

                {/* Capacity */}
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'dispatch', data: { title: 'Driver Capacity' } })}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Driver Capacity</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={78} color="blue" label="Utilized" sublabel="17 drivers available" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function RoutesContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Route Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Active Routes" value="45" variant="primary" icon={<MapTrifold className="w-6 h-6" />} onClick={() => push({ type: 'active-routes', data: { title: 'Active Routes' } })} />
                <StatCard title="Optimized Today" value="12" variant="success" trend="up" trendValue="28% savings" onClick={() => push({ type: 'optimized-today', data: { title: 'Optimized Routes' } })} />
                <StatCard title="Avg Duration" value="2.4 hrs" variant="default" onClick={() => push({ type: 'routes', data: { title: 'Route Duration' } })} />
            </div>
        </div>
    )
}

function TasksContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Task Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Open Tasks" value="34" variant="primary" onClick={() => push({ type: 'open-tasks', data: { title: 'Open Tasks' } })} />
                <StatCard title="In Progress" value="12" variant="warning" onClick={() => push({ type: 'tasks', data: { title: 'In Progress' } })} />
                <StatCard title="Completed" value="89" variant="success" onClick={() => push({ type: 'tasks', data: { title: 'Completed Tasks' } })} />
                <StatCard title="Overdue" value="2" variant="danger" onClick={() => push({ type: 'overdue-tasks', data: { title: 'Overdue Tasks' } })} />
            </div>
        </div>
    )
}

function CalendarContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Operations Calendar</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Scheduled Today" value="24" variant="primary" icon={<CalendarDots className="w-6 h-6" />} />
                <StatCard title="This Week" value="156" variant="default" />
                <StatCard title="Driver Shifts" value="42" variant="success" />
            </div>
        </div>
    )
}

export function OperationsHub() {
    const tabs: HubTab[] = [
        {
            id: 'dispatch',
            label: 'Dispatch',
            icon: <RadioButton className="w-4 h-4" />,
            content: <DispatchContent />,
        },
        {
            id: 'routes',
            label: 'Routes',
            icon: <MapTrifold className="w-4 h-4" />,
            content: <RoutesContent />,
        },
        {
            id: 'tasks',
            label: 'Tasks',
            icon: <CheckSquare className="w-4 h-4" />,
            content: <TasksContent />,
        },
        {
            id: 'calendar',
            label: 'Calendar',
            icon: <CalendarDots className="w-4 h-4" />,
            content: <CalendarContent />,
        },
    ]

    return (
        <HubPage
            title="Operations Hub"
            icon={<OperationsIcon className="w-6 h-6" />}
            description="Dispatch, routing, and task management"
            tabs={tabs}
            defaultTab="dispatch"
        />
    )
}

export default OperationsHub
