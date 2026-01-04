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
    Warning
} from '@phosphor-icons/react'
import React, { Suspense, lazy } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

// Lazy load map component
const RouteMap = lazy(() => import('@/components/Maps/RouteMap').then(m => ({ default: m.RouteMap })))

/**
 * Premium Dispatch Tab Content
 */
function DispatchContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 min-h-full overflow-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Dispatch Console</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Real-time job management and driver assignments</p>
                </div>
                <StatusDot status="online" label="Live Updates" />
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    title="Active Jobs"
                    value="24"
                    subtitle="6 starting within hour"
                    trend="up"
                    trendValue="+4"
                    variant="primary"
                    icon={<Package className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'active-jobs', label: 'Active Jobs', data: { title: 'Active Jobs' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="In Transit"
                    value="18"
                    subtitle="On schedule"
                    variant="success"
                    icon={<Truck className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'in-transit', label: 'In Transit', data: { title: 'In Transit' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Completed Today"
                    value="156"
                    subtitle="Target: 160"
                    trend="up"
                    trendValue="+12%"
                    variant="success"
                    icon={<CheckSquare className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'dispatch', label: 'Completed Today', data: { title: 'Completed Today' } } as Omit<DrilldownLevel, "timestamp">)}
                />
                <StatCard
                    title="Delayed"
                    value="3"
                    subtitle="1 critical"
                    trend="down"
                    trendValue="-2"
                    variant="danger"
                    icon={<Warning className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'delayed', label: 'Delayed Jobs', data: { title: 'Delayed Jobs' } } as Omit<DrilldownLevel, "timestamp">)}
                />
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* On-Time Rate */}
                <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" onClick={() => push({ type: 'dispatch', label: 'On-Time Performance', data: { title: 'On-Time Performance' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">On-Time Rate</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={94} color="green" label="Today" sublabel="vs 91% yesterday" />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-border transition-all duration-300" onClick={() => push({ type: 'dispatch', label: 'Metrics', data: { title: 'Metrics' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Today's Metrics</h3>
                    <div className="space-y-0.5">
                        <QuickStat label="Avg Delivery Time" value="42 min" trend="down" />
                        <QuickStat label="Jobs/Driver" value="8.2" trend="up" />
                        <QuickStat label="Distance Covered" value="2,847 mi" />
                        <QuickStat label="Customer Rating" value="4.8/5" trend="up" />
                    </div>
                </div>

                {/* Capacity */}
                <div className="bg-card/80 backdrop-blur-xl rounded-xl border border-border/50 p-4 sm:p-6 cursor-pointer hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300" onClick={() => push({ type: 'dispatch', label: 'Driver Capacity', data: { title: 'Driver Capacity' } } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Driver Capacity</h3>
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
        <div className="h-full flex flex-col bg-gradient-to-b from-background to-background/95">
            {/* Stats Header */}
            <div className="p-4 sm:p-6 space-y-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Route Management</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <StatCard title="Active Routes" value="45" variant="primary" icon={<MapTrifold className="w-5 h-5 sm:w-6 sm:h-6" />} onClick={() => push({ type: 'active-routes', label: 'Active Routes', data: { title: 'Active Routes' } } as Omit<DrilldownLevel, "timestamp">)} />
                    <StatCard title="Optimized Today" value="12" variant="success" trend="up" trendValue="28% savings" onClick={() => push({ type: 'optimized-today', label: 'Optimized Routes', data: { title: 'Optimized Routes' } } as Omit<DrilldownLevel, "timestamp">)} />
                    <StatCard title="Avg Duration" value="2.4 hrs" variant="default" onClick={() => push({ type: 'routes', label: 'Route Duration', data: { title: 'Route Duration' } } as Omit<DrilldownLevel, "timestamp">)} />
                </div>
            </div>

            {/* Route Map */}
            <div className="flex-1 min-h-0">
                <Suspense fallback={<div className="h-full flex items-center justify-center"><Skeleton className="h-full w-full rounded-none" /></div>}>
                    <RouteMap />
                </Suspense>
            </div>
        </div>
    )
}

function TasksContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Task Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard title="Open Tasks" value="34" variant="primary" onClick={() => push({ type: 'open-tasks', label: 'Open Tasks', data: { title: 'Open Tasks' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="In Progress" value="12" variant="warning" onClick={() => push({ type: 'tasks', label: 'In Progress', data: { title: 'In Progress' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Completed" value="89" variant="success" onClick={() => push({ type: 'tasks', label: 'Completed Tasks', data: { title: 'Completed Tasks' } } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Overdue" value="2" variant="danger" onClick={() => push({ type: 'overdue-tasks', label: 'Overdue Tasks', data: { title: 'Overdue Tasks' } } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function CalendarContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-background to-background/95 overflow-auto">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Operations Calendar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard
                    title="Scheduled Today"
                    value="24"
                    variant="primary"
                    icon={<CalendarDots className="w-5 h-5 sm:w-6 sm:h-6" />}
                    onClick={() => push({ type: 'calendar-list', label: 'Scheduled Today', id: 'scheduled-today', data: { timeframe: 'today' } })}
                />
                <StatCard
                    title="This Week"
                    value="156"
                    variant="default"
                    onClick={() => push({ type: 'calendar-list', label: 'Weekly Schedule', id: 'scheduled-week', data: { timeframe: 'week' } })}
                />
                <StatCard
                    title="Driver Shifts"
                    value="42"
                    variant="success"
                    onClick={() => push({ type: 'calendar-list', label: 'Driver Shifts', id: 'driver-shifts', data: { type: 'shifts' } })}
                />
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