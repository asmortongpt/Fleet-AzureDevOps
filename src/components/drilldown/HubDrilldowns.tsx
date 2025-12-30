/**
 * HubDrilldowns - Rich drilldown components for Drivers, Maintenance, and Analytics hubs
 */
import {
    User, Star, Trophy, Clock, Shield, ChartLine, Wrench,
    CheckCircle, Warning, ArrowRight, TrendUp, TrendDown, CalendarDots,
    CurrencyDollar, Gauge
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { generateDemoDrivers, generateDemoWorkOrders, generateDemoVehicles } from '@/lib/demo-data'
import { DrilldownLevel } from '@/types/drilldown'

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
    const drivers = generateDemoDrivers(48) as Driver[]

    const onDuty = drivers.filter(d => d.status === 'active')
    const offDuty = drivers.filter(d => d.status === 'off-duty')
    const onLeave = drivers.filter(d => d.status === 'on-leave')

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-white">{drivers.length}</div>
                        <div className="text-sm text-slate-400">Total Drivers</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-emerald-400">{onDuty.length}</div>
                        <div className="text-sm text-slate-400">On Duty</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-amber-400">{offDuty.length}</div>
                        <div className="text-sm text-slate-400">Off Duty</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-slate-300">{onLeave.length}</div>
                        <div className="text-sm text-slate-400">On Leave</div>
                    </CardContent>
                </Card>
            </div>

            {/* Driver List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Driver Roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {drivers.slice(0, 10).map(driver => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => push({ type: 'driver', data: driver } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${driver.status === 'active' ? 'bg-emerald-500/20' :
                                        driver.status === 'off-duty' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                                    }`}>
                                    <User className={`w-4 h-4 ${driver.status === 'active' ? 'text-emerald-400' :
                                            driver.status === 'off-duty' ? 'text-amber-400' : 'text-slate-400'
                                        }`} weight="fill" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName ?? 'Unknown'} {driver.lastName ?? 'Driver'}</div>
                                    <div className="text-xs text-slate-400">{driver.licenseNumber ?? 'N/A'}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${driver.status === 'active' ? 'border-emerald-500 text-emerald-400' :
                                        driver.status === 'off-duty' ? 'border-amber-500 text-amber-400' : 'border-slate-500 text-slate-400'
                                    }`}>
                                    {driver.status}
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-slate-500" />
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
    const drivers = generateDemoDrivers(48) as Driver[]

    // Calculate performance tiers
    const topPerformers = drivers.filter(d => (d.safetyScore || 0) >= 90)
    const meetingTarget = drivers.filter(d => (d.safetyScore || 0) >= 75 && (d.safetyScore || 0) < 90)
    const needsCoaching = drivers.filter(d => (d.safetyScore || 0) >= 60 && (d.safetyScore || 0) < 75)
    const improvement = drivers.filter(d => (d.safetyScore || 0) < 60)

    return (
        <div className="space-y-6">
            {/* Performance Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <ChartLine className="w-5 h-5 text-blue-400" />
                        Performance Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-emerald-400">Top Performers (90+)</span>
                            <span className="text-white">{topPerformers.length}</span>
                        </div>
                        <Progress value={(topPerformers.length / drivers.length) * 100} className="h-2 bg-slate-700">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(topPerformers.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-blue-400">Meeting Target (75-89)</span>
                            <span className="text-white">{meetingTarget.length}</span>
                        </div>
                        <Progress value={(meetingTarget.length / drivers.length) * 100} className="h-2 bg-slate-700">
                            <div className="h-full bg-blue-500 transition-all" style={{ width: `${(meetingTarget.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-amber-400">Needs Coaching (60-74)</span>
                            <span className="text-white">{needsCoaching.length}</span>
                        </div>
                        <Progress value={(needsCoaching.length / drivers.length) * 100} className="h-2 bg-slate-700">
                            <div className="h-full bg-amber-500 transition-all" style={{ width: `${(needsCoaching.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-red-400">Needs Improvement (&lt;60)</span>
                            <span className="text-white">{improvement.length}</span>
                        </div>
                        <Progress value={(improvement.length / drivers.length) * 100} className="h-2 bg-slate-700">
                            <div className="h-full bg-red-500 transition-all" style={{ width: `${(improvement.length / drivers.length) * 100}%` }} />
                        </Progress>
                    </div>
                </CardContent>
            </Card>

            {/* Top Performers List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-400" weight="fill" />
                        Top Performers
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {topPerformers.slice(0, 5).map((driver, idx) => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => push({ type: 'driver', data: driver } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName ?? 'Unknown'} {driver.lastName ?? 'Driver'}</div>
                                    <div className="text-xs text-slate-400">Safety Score: {driver.safetyScore ?? 0}</div>
                                </div>
                            </div>
                            <Trophy className="w-5 h-5 text-amber-400" weight="fill" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function DriverScorecardDrilldown() {
    const drivers = generateDemoDrivers(48) as Driver[]
    const avgScore = Math.round(drivers.reduce((sum, d) => sum + (d.safetyScore || 85), 0) / drivers.length)
    const topScore = Math.max(...drivers.map(d => d.safetyScore || 85))

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <Trophy className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-white">{avgScore}</div>
                        <div className="text-sm text-slate-400">Fleet Average</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" weight="fill" />
                        <div className="text-3xl font-bold text-white">{topScore}</div>
                        <div className="text-sm text-slate-400">Highest Score</div>
                    </CardContent>
                </Card>
            </div>

            {/* Score Categories */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Score Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Safe Driving', score: 94, icon: Shield },
                        { label: 'Fuel Efficiency', score: 88, icon: Gauge },
                        { label: 'On-Time Performance', score: 91, icon: Clock },
                        { label: 'Customer Ratings', score: 87, icon: Star },
                        { label: 'Compliance', score: 96, icon: CheckCircle },
                    ].map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <item.icon className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-300">{item.label}</span>
                                </div>
                                <span className="text-white font-medium">{item.score}%</span>
                            </div>
                            <Progress value={item.score} className="h-1.5 bg-slate-700" />
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
    const workOrders = generateDemoWorkOrders(24) as WorkOrder[]

    const inProgress = workOrders.filter(wo => wo.status === 'in-progress')
    const pending = workOrders.filter(wo => wo.status === 'pending')
    const completed = workOrders.filter(wo => wo.status === 'completed')

    return (
        <div className="space-y-6">
            {/* Bay Status */}
            <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(bay => {
                    const isOccupied = bay <= 5
                    return (
                        <Card key={bay} className={`${isOccupied ? 'bg-blue-900/30 border-blue-700/50' : 'bg-slate-800/50 border-slate-700'}`}>
                            <CardContent className="p-3 text-center">
                                <div className={`text-lg font-bold ${isOccupied ? 'text-blue-400' : 'text-slate-500'}`}>Bay {bay}</div>
                                <div className="text-xs text-slate-400">{isOccupied ? 'In Use' : 'Open'}</div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Work Order Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <Wrench className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-amber-400">{inProgress.length}</div>
                        <div className="text-sm text-slate-400">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Warning className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-slate-300">{pending.length}</div>
                        <div className="text-sm text-slate-400">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-3xl font-bold text-emerald-400">{completed.length}</div>
                        <div className="text-sm text-slate-400">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Work Orders List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Active Work Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {workOrders.slice(0, 8).map(wo => (
                        <div
                            key={wo.id}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => push({ type: 'workorder', data: wo } as Omit<DrilldownLevel, "timestamp">)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${wo.status === 'in-progress' ? 'bg-amber-500/20' :
                                        wo.status === 'pending' ? 'bg-slate-500/20' : 'bg-emerald-500/20'
                                    }`}>
                                    <Wrench className={`w-4 h-4 ${wo.status === 'in-progress' ? 'text-amber-400' :
                                            wo.status === 'pending' ? 'text-slate-400' : 'text-emerald-400'
                                        }`} weight="fill" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">WO-{wo.workOrderNumber ?? 'N/A'}</div>
                                    <div className="text-xs text-slate-400">{wo.status}</div>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}