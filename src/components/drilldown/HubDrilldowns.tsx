/**
 * HubDrilldowns - Rich drilldown components for Drivers, Maintenance, and Analytics hubs
 */
import {
    User, Star, Trophy, Clock, Shield, ChartLine, Wrench,
    CheckCircle, Warning, ArrowRight, CalendarDots,
    CurrencyDollar, Gauge, Truck, TrendUp, Lightning,
    GasPump, MapPin, CarSimple
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown, DrilldownLevel } from '@/contexts/DrilldownContext'
import { useFleetData } from '@/hooks/use-fleet-data'
import { formatEnum } from '@/utils/format-enum'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'

// Define interfaces for data structures
interface Driver {
    id: string;
    status: 'active' | 'off-duty' | 'on-leave';
    safetyScore?: number;
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
}

interface WorkOrder {
    id: string;
    status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
    workOrderNumber?: string;
}

interface Vehicle {
    id: string;
    vehicleNumber?: string;
}

// ============ DRIVERS HUB DRILLDOWNS ============

export function DriversRosterDrilldown() {
    const { push } = useDrilldown()
    const { drivers: rawDrivers } = useFleetData()
    const drivers = (rawDrivers || []) as Driver[]

    const onDuty = drivers.filter(d => d.status === 'active')
    const offDuty = drivers.filter(d => d.status === 'off-duty')
    const onLeave = drivers.filter(d => d.status === 'on-leave')

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <div className="text-base font-bold text-white">{drivers.length}</div>
                        <div className="text-sm text-white/40">Total Drivers</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-base font-bold text-emerald-700">{onDuty.length}</div>
                        <div className="text-sm text-white/40">On Duty</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-base font-bold text-amber-400">{offDuty.length}</div>
                        <div className="text-sm text-white/40">Off Duty</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <div className="text-base font-bold text-white/80">{onLeave.length}</div>
                        <div className="text-sm text-white/40">On Leave</div>
                    </CardContent>
                </Card>
            </div>

            {/* Driver List */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Driver Roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {drivers.slice(0, 10).map(driver => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg cursor-pointer hover:bg-[#242424] transition-colors"
                            onClick={() => push({ type: 'driver', data: driver } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${driver.status === 'active' ? 'bg-emerald-500/20' :
                                    driver.status === 'off-duty' ? 'bg-amber-500/20' : 'bg-white/[0.05]'
                                    }`}>
                                    <User className={`w-4 h-4 ${driver.status === 'active' ? 'text-emerald-700' :
                                        driver.status === 'off-duty' ? 'text-amber-400' : 'text-white/40'
                                        }`} weight="fill" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName ?? '—'} {driver.lastName ?? ''}</div>
                                    <div className="text-xs text-white/40">{driver.licenseNumber ?? '—'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${driver.status === 'active' ? 'border-emerald-500 text-emerald-700' :
                                    driver.status === 'off-duty' ? 'border-amber-500 text-amber-400' : 'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(driver.status)}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-white/40" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function DriverPerformanceDrilldown() {
    const { push } = useDrilldown()
    const { drivers: rawDrivers } = useFleetData()
    const drivers = (rawDrivers || []) as Driver[]

    // Calculate performance tiers
    const topPerformers = drivers.filter(d => (d.safetyScore || 0) >= 90)
    const meetingTarget = drivers.filter(d => (d.safetyScore || 0) >= 75 && (d.safetyScore || 0) < 90)
    const needsCoaching = drivers.filter(d => (d.safetyScore || 0) >= 60 && (d.safetyScore || 0) < 75)
    const improvement = drivers.filter(d => (d.safetyScore || 0) < 60)

    return (
        <div className="space-y-2">
            {/* Performance Breakdown */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ChartLine className="w-3 h-3 text-emerald-400" />
                        Performance Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-emerald-700">Top Performers (90+)</span>
                            <span className="text-white">{topPerformers.length}</span>
                        </div>
                        <Progress value={(topPerformers.length / drivers.length) * 100} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(topPerformers.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-emerald-400">Meeting Target (75-89)</span>
                            <span className="text-white">{meetingTarget.length}</span>
                        </div>
                        <Progress value={(meetingTarget.length / drivers.length) * 100} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(meetingTarget.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-amber-400">Needs Coaching (60-74)</span>
                            <span className="text-white">{needsCoaching.length}</span>
                        </div>
                        <Progress value={(needsCoaching.length / drivers.length) * 100} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(needsCoaching.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-red-400">Needs Improvement (&lt;60)</span>
                            <span className="text-white">{improvement.length}</span>
                        </div>
                        <Progress value={(improvement.length / drivers.length) * 100} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-red-500 transition-all" style={{ width: `${(improvement.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers List */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Star className="w-3 h-3 text-amber-400" weight="fill" />
                        Top Performers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {topPerformers.slice(0, 5).map((driver, idx) => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg cursor-pointer hover:bg-[#242424] transition-colors"
                            onClick={() => push({ type: 'driver', data: driver } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName ?? '—'} {driver.lastName ?? ''}</div>
                                    <div className="text-xs text-white/40">Safety Score: {driver.safetyScore ?? 0}</div>
                                </div>
                            </div>
                            <Trophy className="w-3 h-3 text-amber-400" weight="fill" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function DriverScorecardDrilldown() {
    const { drivers: rawDrivers, fuelTransactions: rawFuel, routes: rawRoutes, inspections: rawInspections } = useFleetData()
    const drivers = (rawDrivers || []) as Driver[]
    const fuelTransactions = (rawFuel || []) as any[]
    const routes = (rawRoutes || []) as any[]
    const inspections = (rawInspections || []) as any[]

    // Safe Driving: average driver safetyScore
    const safeDriving = drivers.length > 0
        ? Math.round(drivers.reduce((sum, d) => sum + (d.safetyScore || 0), 0) / drivers.length)
        : 0

    // Fuel Efficiency: average MPG as a percentage of 30 MPG target, capped at 100
    const fuelWithMpg = fuelTransactions.filter((t: any) => (t.mpg || 0) > 0)
    const avgMpg = fuelWithMpg.length > 0
        ? fuelWithMpg.reduce((sum: number, t: any) => sum + (t.mpg || 0), 0) / fuelWithMpg.length
        : 0
    const fuelEfficiency = Math.min(100, Math.round((avgMpg / 30) * 100))

    // On-Time Performance: percentage of completed routes
    const totalRoutes = routes.length
    const completedRoutes = routes.filter((r: any) => r.status === 'completed').length
    const onTimePerformance = totalRoutes > 0 ? Math.round((completedRoutes / totalRoutes) * 100) : 0

    // Compliance: percentage of passed inspections
    const totalInspections = inspections.length
    const passedInspections = inspections.filter((i: any) =>
        i.status === 'passed' || i.result === 'pass' || i.result === 'passed'
    ).length
    const compliance = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0

    // Overall: average of all component scores
    const overall = Math.round((safeDriving + fuelEfficiency + onTimePerformance + compliance) / 4)

    const topScore = drivers.length > 0
        ? Math.max(...drivers.map(d => d.safetyScore || 0))
        : 0

    const scoreComponents = [
        { label: 'Safe Driving', score: safeDriving, icon: Shield },
        { label: 'Fuel Efficiency', score: fuelEfficiency, icon: Gauge },
        { label: 'On-Time Performance', score: onTimePerformance, icon: Clock },
        { label: 'Compliance', score: compliance, icon: CheckCircle },
        { label: 'Overall', score: overall, icon: Star },
    ]

    return (
        <div className="space-y-2">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <Trophy className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-base font-bold text-white">{overall}</div>
                        <div className="text-sm text-white/40">Fleet Average</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <Star className="w-4 h-4 text-amber-400 mx-auto mb-2" weight="fill" />
                        <div className="text-base font-bold text-white">{topScore}</div>
                        <div className="text-sm text-white/40">Highest Score</div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Categories */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Score Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {scoreComponents.map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-4 h-4 text-white/40" />
                                    <span className="text-white/80">{item.label}</span>
                                </div>
                                <span className="text-white font-medium">{item.score}%</span>
                            </div>
                            <Progress value={item.score} className="h-1.5 bg-white/[0.1]" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ MAINTENANCE HUB DRILLDOWNS ============

export function GarageDrilldown() {
    const { push } = useDrilldown()
    const { workOrders: rawWorkOrders } = useFleetData()
    const workOrders = (rawWorkOrders || []) as WorkOrder[]

    const inProgress = workOrders.filter(wo => wo.status === 'in-progress')
    const pending = workOrders.filter(wo => wo.status === 'pending')
    const completed = workOrders.filter(wo => wo.status === 'completed')

    return (
        <div className="space-y-2">
            {/* Bay Status */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(bay => {
                    const isOccupied = bay <= 5
                    return (
                        <Card key={bay} className={`${isOccupied ? 'bg-white/[0.04] border-emerald-500/30' : 'bg-[#242424] border-white/[0.08]'}`}>
                            <CardContent className="p-3 text-center">
                                <div className={`text-sm font-bold ${isOccupied ? 'text-emerald-400' : 'text-white/40'}`}>Bay {bay}</div>
                                <div className="text-xs text-white/40">{isOccupied ? 'In Use' : 'Open'}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Work Order Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <Wrench className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                        <div className="text-base font-bold text-amber-400">{inProgress.length}</div>
                        <div className="text-sm text-white/40">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Warning className="w-4 h-4 text-white/40 mx-auto mb-2" />
                        <div className="text-base font-bold text-white/80">{pending.length}</div>
                        <div className="text-sm text-white/40">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <CheckCircle className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
                        <div className="text-base font-bold text-emerald-700">{completed.length}</div>
                        <div className="text-sm text-white/40">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Work Orders List */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Active Work Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {workOrders.slice(0, 8).map(wo => (
                        <div
                            key={wo.id}
                            className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg cursor-pointer hover:bg-[#242424] transition-colors"
                            onClick={() => push({ type: 'workorder', data: wo } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${wo.status === 'in-progress' ? 'bg-amber-500/20' :
                                    wo.status === 'pending' ? 'bg-white/[0.05]' : 'bg-emerald-500/20'
                                    }`}>
                                    <Wrench className={`w-4 h-4 ${wo.status === 'in-progress' ? 'text-amber-400' :
                                        wo.status === 'pending' ? 'text-white/40' : 'text-emerald-700'
                                        }`} weight="fill" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">WO-{wo.workOrderNumber ?? '—'}</div>
                                    <div className="text-xs text-white/40">{formatEnum(wo.status)}</div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/40" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Additional Hub Drilldowns
export function PredictiveMaintenanceDrilldown() {
    const { vehicles: rawVehicles, maintenanceRequests: rawSchedules, workOrders: rawWorkOrders } = useFleetData()
    const vehicles = (rawVehicles || []) as any[]
    const schedules = (rawSchedules || []) as any[]
    const workOrders = (rawWorkOrders || []) as any[]

    const now = new Date()
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Overdue maintenance
    const overdue = schedules.filter((s: any) => {
        const due = s.nextDue || s.next_due
        return due && new Date(due) < now && s.status !== 'completed'
    })

    // Upcoming (due within next 7 days)
    const upcoming = schedules.filter((s: any) => {
        const due = s.nextDue || s.next_due
        if (!due) return false
        const d = new Date(due)
        return d >= now && d <= oneWeekFromNow && s.status !== 'completed'
    })

    // Average fleet mileage
    const avgMileage = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum: number, v: any) => sum + (v.mileage || 0), 0) / vehicles.length)
        : 0

    // Average fleet age
    const currentYear = now.getFullYear()
    const avgAge = vehicles.length > 0
        ? (vehicles.reduce((sum: number, v: any) => sum + (currentYear - (v.year || currentYear)), 0) / vehicles.length).toFixed(1)
        : '0'

    // Open work orders
    const openWOs = workOrders.filter((wo: any) => wo.status === 'pending' || wo.status === 'in-progress')

    // Top 5 vehicles needing attention: overdue schedules + high mileage
    const vehicleAttentionMap = new Map<string, { vehicle: any; score: number }>()
    for (const v of vehicles) {
        const vId = v.id
        const overdueCount = schedules.filter((s: any) => {
            const sVehicleId = s.vehicleId || s.vehicle_id
            const due = s.nextDue || s.next_due
            return sVehicleId === vId && due && new Date(due) < now && s.status !== 'completed'
        }).length
        const openWOCount = workOrders.filter((wo: any) => {
            const woVehicleId = wo.vehicleId || wo.vehicle_id
            return woVehicleId === vId && (wo.status === 'pending' || wo.status === 'in-progress')
        }).length
        const mileageScore = (v.mileage || 0) > 100000 ? 2 : (v.mileage || 0) > 50000 ? 1 : 0
        vehicleAttentionMap.set(vId, { vehicle: v, score: overdueCount * 3 + openWOCount * 2 + mileageScore })
    }
    const topNeedingAttention = [...vehicleAttentionMap.values()]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .filter(item => item.score > 0)

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-2 text-center">
                        <Warning className="w-4 h-4 text-red-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-red-400">{overdue.length}</div>
                        <div className="text-sm text-white/40">Overdue</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <CalendarDots className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-amber-400">{upcoming.length}</div>
                        <div className="text-sm text-white/40">Due This Week</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Gauge className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{formatNumber(avgMileage)}</div>
                        <div className="text-sm text-white/40">Avg Miles</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Truck className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{avgAge} yr</div>
                        <div className="text-sm text-white/40">Avg Fleet Age</div>
                    </CardContent>
                </Card>
            </div>

            {/* Open Work Orders */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Wrench className="w-3 h-3 text-amber-400" weight="fill" />
                        Open Work Orders
                        <Badge variant="outline" className="ml-auto border-amber-500/50 text-amber-400">{openWOs.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Progress value={openWOs.length > 0 ? Math.min(100, (openWOs.length / Math.max(workOrders.length, 1)) * 100) : 0} className="h-2 bg-white/[0.1]">
                        <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, (openWOs.length / Math.max(workOrders.length, 1)) * 100)}%` }} />
                    </Progress>
                    <div className="text-xs text-white/40 mt-1">{openWOs.length} of {workOrders.length} work orders open</div>
                </CardContent>
            </Card>

            {/* Top Vehicles Needing Attention */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Warning className="w-3 h-3 text-red-400" />
                        Vehicles Needing Attention
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {topNeedingAttention.length === 0 ? (
                        <div className="text-sm text-white/40 text-center py-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                            All vehicles are in good standing
                        </div>
                    ) : (
                        topNeedingAttention.map(({ vehicle }) => (
                            <div key={vehicle.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-red-500/20">
                                        <Truck className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">
                                            {formatVehicleName(vehicle) !== 'Unknown Vehicle'
                                                ? formatVehicleName(vehicle)
                                                : `Vehicle #${vehicle.number || vehicle.vehicleNumber || vehicle.id?.slice(-6)}`}
                                        </div>
                                        <div className="text-xs text-white/40">{formatNumber(vehicle.mileage || 0)} mi</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-red-500/50 text-red-400">Needs Service</Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function MaintenanceCalendarDrilldown() {
    const { maintenanceRequests: rawSchedules, workOrders: rawWorkOrders } = useFleetData()
    const schedules = (rawSchedules || []) as any[]
    const workOrders = (rawWorkOrders || []) as any[]

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    const endOfNextWeek = new Date(startOfWeek)
    endOfNextWeek.setDate(startOfWeek.getDate() + 14)

    const getDueDate = (s: any) => s.nextDue || s.next_due || s.dueDate || s.due_date

    // Overdue
    const overdue = schedules.filter((s: any) => {
        const due = getDueDate(s)
        return due && new Date(due) < now && s.status !== 'completed'
    })

    // This week
    const thisWeek = schedules.filter((s: any) => {
        const due = getDueDate(s)
        if (!due) return false
        const d = new Date(due)
        return d >= startOfWeek && d < endOfWeek && s.status !== 'completed'
    })

    // Next week
    const nextWeek = schedules.filter((s: any) => {
        const due = getDueDate(s)
        if (!due) return false
        const d = new Date(due)
        return d >= endOfWeek && d < endOfNextWeek && s.status !== 'completed'
    })

    // Work orders with due dates
    const woWithDueDates = workOrders.filter((wo: any) => {
        const due = wo.dueDate || wo.due_date
        return due && wo.status !== 'completed' && wo.status !== 'cancelled'
    })

    // Combine and sort upcoming items from schedules and work orders
    const upcomingItems: { id: string; label: string; dueDate: string; type: string; priority: string; status: string }[] = []

    for (const s of schedules) {
        const due = getDueDate(s)
        if (!due || s.status === 'completed') continue
        upcomingItems.push({
            id: s.id,
            label: s.serviceType || s.service_type || 'Scheduled Service',
            dueDate: due,
            type: 'schedule',
            priority: s.priority || 'medium',
            status: new Date(due) < now ? 'overdue' : 'upcoming'
        })
    }

    for (const wo of woWithDueDates) {
        const due = wo.dueDate || wo.due_date
        upcomingItems.push({
            id: wo.id,
            label: wo.title || wo.serviceType || `WO-${wo.workOrderNumber || wo.number || ''}`,
            dueDate: due,
            type: 'work-order',
            priority: wo.priority || 'medium',
            status: new Date(due) < now ? 'overdue' : 'upcoming'
        })
    }

    upcomingItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

    const priorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return 'border-red-500 text-red-400'
            case 'high': return 'border-amber-500 text-amber-400'
            case 'medium': return 'border-emerald-500 text-emerald-400'
            default: return 'border-white/20 text-white/60'
        }
    }

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-2 text-center">
                        <Warning className="w-4 h-4 text-red-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-red-400">{overdue.length}</div>
                        <div className="text-sm text-white/40">Overdue</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <CalendarDots className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-amber-400">{thisWeek.length}</div>
                        <div className="text-sm text-white/40">This Week</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <CalendarDots className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{nextWeek.length}</div>
                        <div className="text-sm text-white/40">Next Week</div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Maintenance List */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <CalendarDots className="w-3 h-3 text-emerald-400" weight="fill" />
                        Upcoming Maintenance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {upcomingItems.length === 0 ? (
                        <div className="text-sm text-white/40 text-center py-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                            No upcoming maintenance scheduled
                        </div>
                    ) : (
                        upcomingItems.slice(0, 10).map(item => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${item.status === 'overdue' ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                                        {item.type === 'work-order'
                                            ? <Wrench className={`w-4 h-4 ${item.status === 'overdue' ? 'text-red-400' : 'text-emerald-400'}`} weight="fill" />
                                            : <CalendarDots className={`w-4 h-4 ${item.status === 'overdue' ? 'text-red-400' : 'text-emerald-400'}`} weight="fill" />
                                        }
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{formatEnum(item.label)}</div>
                                        <div className="text-xs text-white/40">{formatDate(item.dueDate)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={priorityColor(item.priority)}>{formatEnum(item.priority)}</Badge>
                                    {item.status === 'overdue' && (
                                        <Badge variant="outline" className="border-red-500/50 text-red-400">Overdue</Badge>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function ExecutiveDashboardDrilldown() {
    const { vehicles: rawVehicles, drivers: rawDrivers, workOrders: rawWorkOrders, incidents: rawIncidents, fuelTransactions: rawFuel } = useFleetData()
    const vehicles = (rawVehicles || []) as any[]
    const drivers = (rawDrivers || []) as any[]
    const workOrders = (rawWorkOrders || []) as any[]
    const incidents = (rawIncidents || []) as any[]
    const fuelTransactions = (rawFuel || []) as any[]

    const activeVehicles = vehicles.filter((v: any) => v.status === 'active' || v.status === 'idle')
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const openWOs = workOrders.filter((wo: any) => wo.status === 'pending' || wo.status === 'in-progress')
    const activeVehiclePct = vehicles.length > 0 ? Math.round((activeVehicles.length / vehicles.length) * 100) : 0

    // Incidents this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyIncidents = incidents.filter((i: any) => {
        const d = i.date || i.incidentDate || i.incident_date || i.createdAt || i.created_at
        return d && new Date(d) >= startOfMonth
    })

    // Total fuel cost
    const totalFuelCost = fuelTransactions.reduce((sum: number, t: any) => sum + (t.totalCost || t.total_cost || t.cost || 0), 0)

    // Average safety score
    const driversWithScores = drivers.filter((d: any) => (d.safetyScore || 0) > 0)
    const avgSafetyScore = driversWithScores.length > 0
        ? Math.round(driversWithScores.reduce((sum: number, d: any) => sum + (d.safetyScore || 0), 0) / driversWithScores.length)
        : 0

    return (
        <div className="space-y-2">
            {/* Fleet Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Truck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{vehicles.length}</div>
                        <div className="text-sm text-white/40">Fleet Size</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <TrendUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-emerald-400">{activeVehiclePct}%</div>
                        <div className="text-sm text-white/40">Active Rate</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <User className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{activeDrivers.length}</div>
                        <div className="text-sm text-white/40">Active Drivers</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <Wrench className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-amber-400">{openWOs.length}</div>
                        <div className="text-sm text-white/40">Open WOs</div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Indicators */}
            <div className="grid grid-cols-2 gap-3">
                <Card className={`${monthlyIncidents.length > 5 ? 'bg-red-900/30 border-red-700/50' : 'bg-[#242424] border-white/[0.08]'}`}>
                    <CardContent className="p-2 text-center">
                        <Warning className={`w-4 h-4 mx-auto mb-1 ${monthlyIncidents.length > 5 ? 'text-red-400' : 'text-white/60'}`} />
                        <div className={`text-base font-bold ${monthlyIncidents.length > 5 ? 'text-red-400' : 'text-white'}`}>{monthlyIncidents.length}</div>
                        <div className="text-sm text-white/40">Incidents This Month</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <GasPump className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{formatCurrency(totalFuelCost)}</div>
                        <div className="text-sm text-white/40">Total Fuel Cost</div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Bars */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ChartLine className="w-3 h-3 text-emerald-400" />
                        Fleet Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">Vehicle Utilization</span>
                            <span className="text-white font-medium">{activeVehiclePct}%</span>
                        </div>
                        <Progress value={activeVehiclePct} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${activeVehiclePct}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">Driver Availability</span>
                            <span className="text-white font-medium">{drivers.length > 0 ? Math.round((activeDrivers.length / drivers.length) * 100) : 0}%</span>
                        </div>
                        <Progress value={drivers.length > 0 ? (activeDrivers.length / drivers.length) * 100 : 0} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500/50 transition-all" style={{ width: `${drivers.length > 0 ? (activeDrivers.length / drivers.length) * 100 : 0}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">Avg Safety Score</span>
                            <span className="text-white font-medium">{avgSafetyScore}</span>
                        </div>
                        <Progress value={avgSafetyScore} className="h-2 bg-white/[0.1]">
                            <div className={`h-full transition-all ${avgSafetyScore >= 80 ? 'bg-emerald-500' : avgSafetyScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${avgSafetyScore}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">WO Completion Rate</span>
                            <span className="text-white font-medium">
                                {workOrders.length > 0 ? Math.round((workOrders.filter((wo: any) => wo.status === 'completed').length / workOrders.length) * 100) : 0}%
                            </span>
                        </div>
                        <Progress value={workOrders.length > 0 ? (workOrders.filter((wo: any) => wo.status === 'completed').length / workOrders.length) * 100 : 0} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${workOrders.length > 0 ? (workOrders.filter((wo: any) => wo.status === 'completed').length / workOrders.length) * 100 : 0}%` }} />
                        </Progress>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function CostAnalysisDrilldown() {
    const { fuelTransactions: rawFuel, workOrders: rawWorkOrders, vehicles: rawVehicles } = useFleetData()
    const fuelTransactions = (rawFuel || []) as any[]
    const workOrders = (rawWorkOrders || []) as any[]
    const vehicles = (rawVehicles || []) as any[]

    // Total fuel cost
    const totalFuelCost = fuelTransactions.reduce((sum: number, t: any) => sum + (t.totalCost || t.total_cost || t.cost || 0), 0)

    // Total maintenance cost from work orders
    const totalMaintenanceCost = workOrders.reduce((sum: number, wo: any) => sum + (wo.cost || wo.estimatedCost || 0), 0)

    // Combined cost
    const totalCost = totalFuelCost + totalMaintenanceCost

    // Cost per vehicle
    const costPerVehicle = vehicles.length > 0 ? Math.round(totalCost / vehicles.length) : 0

    // Average fuel price per gallon
    const fuelWithPrice = fuelTransactions.filter((t: any) => (t.pricePerGallon || t.price_per_gallon || 0) > 0)
    const avgPricePerGallon = fuelWithPrice.length > 0
        ? (fuelWithPrice.reduce((sum: number, t: any) => sum + (t.pricePerGallon || t.price_per_gallon || 0), 0) / fuelWithPrice.length).toFixed(2)
        : '0.00'

    // Top 5 highest cost work orders
    const highCostWOs = [...workOrders]
        .filter((wo: any) => (wo.cost || wo.estimatedCost || 0) > 0)
        .sort((a: any, b: any) => (b.cost || b.estimatedCost || 0) - (a.cost || a.estimatedCost || 0))
        .slice(0, 5)

    // Top 5 most expensive fuel transactions
    const highCostFuel = [...fuelTransactions]
        .sort((a: any, b: any) => (b.totalCost || b.total_cost || b.cost || 0) - (a.totalCost || a.total_cost || a.cost || 0))
        .slice(0, 5)

    // Cost breakdown percentages
    const fuelPct = totalCost > 0 ? Math.round((totalFuelCost / totalCost) * 100) : 0
    const maintPct = totalCost > 0 ? Math.round((totalMaintenanceCost / totalCost) * 100) : 0

    return (
        <div className="space-y-2">
            {/* Cost Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <CurrencyDollar className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{formatCurrency(totalCost)}</div>
                        <div className="text-sm text-white/40">Total Cost</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <GasPump className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-amber-400">{formatCurrency(totalFuelCost)}</div>
                        <div className="text-sm text-white/40">Fuel Cost</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Wrench className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{formatCurrency(totalMaintenanceCost)}</div>
                        <div className="text-sm text-white/40">Maintenance</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <CarSimple className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{formatCurrency(costPerVehicle)}</div>
                        <div className="text-sm text-white/40">Per Vehicle</div>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ChartLine className="w-3 h-3 text-emerald-400" />
                        Cost Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-amber-400">Fuel ({fuelPct}%)</span>
                            <span className="text-white font-medium">{formatCurrency(totalFuelCost)}</span>
                        </div>
                        <Progress value={fuelPct} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${fuelPct}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-emerald-400">Maintenance ({maintPct}%)</span>
                            <span className="text-white font-medium">{formatCurrency(totalMaintenanceCost)}</span>
                        </div>
                        <Progress value={maintPct} className="h-2 bg-white/[0.1]">
                            <div className="h-full bg-emerald-500/50 transition-all" style={{ width: `${maintPct}%` }} />
                        </Progress>
                    </div>
                    <div className="text-xs text-white/40 pt-1">Avg fuel price: ${avgPricePerGallon}/gal</div>
                </CardContent>
            </Card>

            {/* High-Cost Items */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <CurrencyDollar className="w-3 h-3 text-amber-400" />
                        Highest Cost Work Orders
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {highCostWOs.length === 0 ? (
                        <div className="text-sm text-white/40 text-center py-3">No cost data available</div>
                    ) : (
                        highCostWOs.map(wo => (
                            <div key={wo.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-amber-500/20">
                                        <Wrench className="w-4 h-4 text-amber-400" weight="fill" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{wo.title || wo.serviceType || `WO-${wo.workOrderNumber || wo.number || ''}`}</div>
                                        <div className="text-xs text-white/40">{formatEnum(wo.status)}</div>
                                    </div>
                                </div>
                                <span className="text-amber-400 font-medium">{formatCurrency(wo.cost || wo.estimatedCost || 0)}</span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* High-Cost Fuel Transactions */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <GasPump className="w-3 h-3 text-amber-400" />
                        Recent High-Cost Fuel Fills
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {highCostFuel.length === 0 ? (
                        <div className="text-sm text-white/40 text-center py-3">No fuel data available</div>
                    ) : (
                        highCostFuel.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-white/[0.06]">
                                        <GasPump className="w-4 h-4 text-white/60" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{t.vehicleNumber || t.vehicle_number || `Vehicle`}</div>
                                        <div className="text-xs text-white/40">{t.gallons?.toFixed(1) || '—'} gal @ {t.station || '—'}</div>
                                    </div>
                                </div>
                                <span className="text-white font-medium">{formatCurrency(t.totalCost || t.total_cost || t.cost || 0)}</span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export function FleetOptimizerDrilldown() {
    const { vehicles: rawVehicles, routes: rawRoutes, fuelTransactions: rawFuel } = useFleetData()
    const vehicles = (rawVehicles || []) as any[]
    const routes = (rawRoutes || []) as any[]
    const fuelTransactions = (rawFuel || []) as any[]

    // Fleet utilization
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active')
    const idleVehicles = vehicles.filter((v: any) => v.status === 'idle')
    const serviceVehicles = vehicles.filter((v: any) => v.status === 'service')
    const offlineVehicles = vehicles.filter((v: any) => v.status === 'offline')
    const utilizationRate = vehicles.length > 0 ? Math.round((activeVehicles.length / vehicles.length) * 100) : 0

    // Route optimization: completed vs planned
    const completedRoutes = routes.filter((r: any) => r.status === 'completed')
    const plannedRoutes = routes.filter((r: any) => r.status === 'planned')
    const inProgressRoutes = routes.filter((r: any) => r.status === 'in-progress')
    const routeCompletionRate = routes.length > 0 ? Math.round((completedRoutes.length / routes.length) * 100) : 0

    // Fuel efficiency metrics
    const fuelWithMpg = fuelTransactions.filter((t: any) => (t.mpg || 0) > 0)
    const avgMpg = fuelWithMpg.length > 0
        ? (fuelWithMpg.reduce((sum: number, t: any) => sum + (t.mpg || 0), 0) / fuelWithMpg.length).toFixed(1)
        : '0.0'

    // Total gallons consumed
    const totalGallons = fuelTransactions.reduce((sum: number, t: any) => sum + (t.gallons || 0), 0)

    // Total distance from routes
    const totalDistance = routes.reduce((sum: number, r: any) => sum + (r.distance || 0), 0)

    // Vehicles that could be reassigned (idle for potential reallocation)
    const reassignableVehicles = idleVehicles.slice(0, 5)

    return (
        <div className="space-y-2">
            {/* Utilization Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <TrendUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-emerald-400">{utilizationRate}%</div>
                        <div className="text-sm text-white/40">Utilization</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Truck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{activeVehicles.length}</div>
                        <div className="text-sm text-white/40">Active</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <Lightning className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-amber-400">{idleVehicles.length}</div>
                        <div className="text-sm text-white/40">Idle</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <Wrench className="w-4 h-4 text-white/60 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{serviceVehicles.length}</div>
                        <div className="text-sm text-white/40">In Service</div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-emerald-400" weight="fill" />
                        Optimization Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">Fleet Utilization</span>
                            <span className="text-white font-medium">{utilizationRate}%</span>
                        </div>
                        <Progress value={utilizationRate} className="h-2 bg-white/[0.1]">
                            <div className={`h-full transition-all ${utilizationRate >= 70 ? 'bg-emerald-500' : utilizationRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${utilizationRate}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/80">Route Completion</span>
                            <span className="text-white font-medium">{routeCompletionRate}%</span>
                        </div>
                        <Progress value={routeCompletionRate} className="h-2 bg-white/[0.1]">
                            <div className={`h-full transition-all ${routeCompletionRate >= 80 ? 'bg-emerald-500' : routeCompletionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${routeCompletionRate}%` }} />
                        </Progress>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="text-center">
                            <div className="text-sm font-medium text-white">{avgMpg}</div>
                            <div className="text-xs text-white/40">Avg MPG</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-white">{formatNumber(totalGallons)}</div>
                            <div className="text-xs text-white/40">Total Gallons</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-medium text-white">{formatNumber(totalDistance)}</div>
                            <div className="text-xs text-white/40">Total Miles</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Route Status */}
            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        Route Optimization
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                            <div className="text-sm font-bold text-emerald-400">{completedRoutes.length}</div>
                            <div className="text-xs text-white/40">Completed</div>
                        </div>
                        <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                            <div className="text-sm font-bold text-emerald-400">{inProgressRoutes.length}</div>
                            <div className="text-xs text-white/40">In Progress</div>
                        </div>
                        <div className="p-2 bg-white/[0.03] rounded-lg text-center">
                            <div className="text-sm font-bold text-white/80">{plannedRoutes.length}</div>
                            <div className="text-xs text-white/40">Planned</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Idle Vehicles for Reassignment */}
            {reassignableVehicles.length > 0 && (
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Lightning className="w-3 h-3 text-amber-400" />
                            Idle Vehicles — Reassignment Opportunities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {reassignableVehicles.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-amber-500/20">
                                        <Truck className="w-4 h-4 text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {formatVehicleName(v) !== 'Unknown Vehicle'
                                                ? formatVehicleName(v)
                                                : `Vehicle #${v.number || v.vehicleNumber || v.id?.slice(-6)}`}
                                        </div>
                                        <div className="text-xs text-white/40">{formatNumber(v.mileage || 0)} mi | {formatEnum(v.fuelType || 'unknown')}</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-amber-500/50 text-amber-400">Idle</Badge>
                            </div>
                        ))}
                        {offlineVehicles.length > 0 && (
                            <div className="text-xs text-white/40 pt-1">{offlineVehicles.length} vehicle(s) currently offline</div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}