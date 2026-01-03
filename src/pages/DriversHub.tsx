/**
 * DriversHub - Premium Driver Management Hub
 * Route: /drivers
 */

import {
    Users as DriversIcon,
    Users,
    UserList,
    ChartLine,
    Trophy,
    Car,
    FileText,
    Medal,
    Star
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard, ProgressRing, StatusDot, QuickStat } from '@/components/ui/stat-card'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'

function DriversListContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent min-h-full">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Driver Roster</h2>
                    <p className="text-slate-400 mt-1">Active driver management and status</p>
                </div>
                <StatusDot status="online" label="42 Active Now" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Drivers" value="48" subtitle="3 new this month" variant="primary" icon={<Users className="w-6 h-6" />} onClick={() => push({ type: 'total-drivers', data: { title: 'Total Drivers' }, id: 'total-drivers' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="On Duty" value="42" trend="up" trendValue="+2" variant="success" onClick={() => push({ type: 'on-duty', data: { title: 'On Duty Drivers' }, id: 'on-duty' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="On Leave" value="4" variant="warning" onClick={() => push({ type: 'drivers-roster', data: { title: 'Drivers On Leave', filter: 'leave' }, id: 'drivers-roster-leave' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Training" value="2" variant="default" onClick={() => push({ type: 'drivers-roster', data: { title: 'Drivers In Training', filter: 'training' }, id: 'drivers-roster-training' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'driver-scorecard', data: { title: 'Certification Status' }, id: 'driver-scorecard' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Certification Rate</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={96} color="green" label="Certified" sublabel="46 of 48 current" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'driver-performance-hub', data: { title: 'Performance Metrics' }, id: 'driver-performance-hub' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Performance</h3>
                    <div className="space-y-1">
                        <QuickStat label="Avg Rating" value="4.7/5" trend="up" />
                        <QuickStat label="On-Time %" value="94.2%" trend="up" />
                        <QuickStat label="Safety Score" value="92" />
                        <QuickStat label="Tenure Avg" value="3.2 yrs" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-slate-600/50 transition-colors" onClick={() => push({ type: 'drivers-roster', data: { title: 'Driver Availability' }, id: 'drivers-roster-availability' } as Omit<DrilldownLevel, "timestamp">)}>
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">Availability</h3>
                    <div className="flex items-center justify-center">
                        <ProgressRing progress={88} color="blue" label="Available" sublabel="Today" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function PerformanceContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Driver Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Top Performers" value="12" variant="success" icon={<Star className="w-6 h-6" />} onClick={() => push({ type: 'top-performers', data: { title: 'Top Performers' }, id: 'top-performers' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Meeting Target" value="28" variant="primary" onClick={() => push({ type: 'driver-performance-hub', data: { title: 'Meeting Target' }, id: 'driver-performance-hub-target' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Needs Coaching" value="6" variant="warning" onClick={() => push({ type: 'needs-coaching', data: { title: 'Needs Coaching' }, id: 'needs-coaching' } as Omit<DrilldownLevel, "timestamp">)} />
                <StatCard title="Improvement" value="2" variant="danger" onClick={() => push({ type: 'driver-performance-hub', data: { title: 'Needs Improvement' }, id: 'driver-performance-hub-improvement' } as Omit<DrilldownLevel, "timestamp">)} />
            </div>
        </div>
    )
}

function ScorecardContent() {
    const { push } = useDrilldown()

    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Driver Scorecard</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Fleet Avg Score" value="87" variant="primary" icon={<Trophy className="w-6 h-6" />} />
                <StatCard title="Top Score" value="98" variant="success" />
                <StatCard title="This Month" value="+4%" trend="up" variant="success" />
                <StatCard title="Awards Given" value="15" variant="default" icon={<Medal className="w-6 h-6" />} />
            </div>
        </div>
    )
}

function PersonalUseContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Personal Use Tracking</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Tracked Drivers" value="34" variant="primary" icon={<Car className="w-6 h-6" />} />
                <StatCard title="Personal Miles" value="2,450" variant="default" />
                <StatCard title="Compliance" value="98%" variant="success" />
            </div>
        </div>
    )
}

function PolicyContent() {
    return (
        <div className="p-6 space-y-6 bg-gradient-to-b from-slate-900/50 to-transparent">
            <h2 className="text-2xl font-bold text-white">Personal Use Policy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Active Policies" value="3" variant="primary" icon={<FileText className="w-6 h-6" />} />
                <StatCard title="Drivers Enrolled" value="34" variant="default" />
                <StatCard title="Compliance Rate" value="98%" variant="success" />
            </div>
        </div>
    )
}

export function DriversHub() {
    const tabs: HubTab[] = [
        { id: 'list', label: 'Drivers', icon: <UserList className="w-4 h-4" />, content: <DriversListContent /> },
        { id: 'performance', label: 'Performance', icon: <ChartLine className="w-4 h-4" />, content: <PerformanceContent /> },
        { id: 'scorecard', label: 'Scorecard', icon: <Trophy className="w-4 h-4" />, content: <ScorecardContent /> },
        { id: 'personal', label: 'Personal Use', icon: <Car className="w-4 h-4" />, content: <PersonalUseContent /> },
        { id: 'policy', label: 'Policy', icon: <FileText className="w-4 h-4" />, content: <PolicyContent /> },
    ]

    return (
        <HubPage
            title="Drivers Hub"
            icon={<DriversIcon className="w-6 h-6" />}
            description="Driver management, performance, and compliance"
            tabs={tabs}
            defaultTab="list"
        />
    )
}

export default DriversHub