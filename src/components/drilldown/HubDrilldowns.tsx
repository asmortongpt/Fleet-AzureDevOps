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


// ============ DRIVERS HUB DRILLDOWNS ============

export function DriversRosterDrilldown() {
    const { push } = useDrilldown()
    const drivers = generateDemoDrivers(48)

    const onDuty = drivers.filter(d => d.status === 'on-duty')
    const offDuty = drivers.filter(d => d.status === 'off-duty')
    const onLeave = drivers.filter(d => d.status === 'inactive')

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
                            onClick={() => push({ type: 'driver', data: driver })}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${driver.status === 'on-duty' ? 'bg-emerald-500/20' :
                                        driver.status === 'off-duty' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                                    }`}>
                                    <User className={`w-4 h-4 ${driver.status === 'on-duty' ? 'text-emerald-400' :
                                            driver.status === 'off-duty' ? 'text-amber-400' : 'text-slate-400'
                                        }`} weight="fill" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName} {driver.lastName}</div>
                                    <div className="text-xs text-slate-400">{driver.licenseNumber}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`${driver.status === 'on-duty' ? 'border-emerald-500 text-emerald-400' :
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
    const drivers = generateDemoDrivers(48)

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
                            onClick={() => push({ type: 'driver', data: driver })}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                </div>
                                <div>
                                    <div className="font-medium text-white">{driver.firstName} {driver.lastName}</div>
                                    <div className="text-xs text-slate-400">Safety Score: {driver.safetyScore}</div>
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
    const drivers = generateDemoDrivers(48)
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
    const workOrders = generateDemoWorkOrders(24)

    const inProgress = workOrders.filter(wo => wo.status === 'in_progress')
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
                        <div className="text-2xl font-bold text-amber-400">{inProgress.length}</div>
                        <div className="text-xs text-slate-400">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">{pending.length}</div>
                        <div className="text-xs text-slate-400">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{completed.length}</div>
                        <div className="text-xs text-slate-400">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Work Orders */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-400" />
                        Active Work Orders
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {inProgress.slice(0, 5).map(wo => (
                        <div
                            key={wo.id}
                            className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors"
                            onClick={() => push({ type: 'workOrder', data: wo })}
                        >
                            <div>
                                <div className="font-medium text-white">{wo.description}</div>
                                <div className="text-xs text-slate-400">WO #{wo.workOrderNumber}</div>
                            </div>
                            <Badge variant="outline" className="border-amber-500 text-amber-400">
                                {wo.priority}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function PredictiveMaintenanceDrilldown() {
    const vehicles = generateDemoVehicles(50)

    // Simulate predictions
    const predictions = vehicles.slice(0, 15).map(v => ({
        vehicle: v,
        component: ['Engine', 'Transmission', 'Brakes', 'Battery', 'AC', 'Tires'][Math.floor(Math.random() * 6)],
        probability: Math.floor(Math.random() * 40) + 60,
        daysUntil: Math.floor(Math.random() * 30) + 5,
    }))

    const highRisk = predictions.filter(p => p.probability >= 85)
    const mediumRisk = predictions.filter(p => p.probability >= 70 && p.probability < 85)

    return (
        <div className="space-y-6">
            {/* Risk Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">{highRisk.length}</div>
                        <div className="text-xs text-slate-400">High Risk</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">{mediumRisk.length}</div>
                        <div className="text-xs text-slate-400">Medium Risk</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">$28K</div>
                        <div className="text-xs text-slate-400">Est. Savings</div>
                    </CardContent>
                </Card>
            </div>

            {/* Predictions List */}
            <Card className modeName="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <ChartLine className="w-5 h-5 text-purple-400" />
                        Predicted Failures
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {predictions.slice(0, 8).map((pred, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{pred.vehicle.vehicleNumber}</div>
                                <div className="text-xs text-slate-400">{pred.component} - {pred.daysUntil} days</div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${pred.probability >= 85 ? 'text-red-400' : pred.probability >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {pred.probability}%
                                </div>
                                <div className="text-xs text-slate-400">probability</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function MaintenanceCalendarDrilldown() {
    const workOrders = generateDemoWorkOrders(40)

    // Group by timeframe
    const today = workOrders.slice(0, 4)
    const thisWeek = workOrders.slice(0, 18)
    const overdue = workOrders.filter(wo => wo.status === 'pending').slice(0, 2)

    return (
        <div className="space-y-6">
            {/* Calendar Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <CalendarDots className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">{today.length}</div>
                        <div className="text-xs text-slate-400">Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">{thisWeek.length}</div>
                        <div className="text-xs text-slate-400">This Week</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-4 text-center">
                        <Warning className="w-6 h-6 text-red-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-red-400">{overdue.length}</div>
                        <div className="text-xs text-slate-400">Overdue</div>
                    </CardContent>
                </Card>
            </div>

            {/* Today's Schedule */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Today's Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {today.map((wo, idx) => (
                        <div key={wo.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="text-slate-400 text-sm w-16">{['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'][idx]}</div>
                                <div>
                                    <div className="font-medium text-white">{wo.description}</div>
                                    <div className="text-xs text-slate-400">{wo.vehicleId?.slice(0, 8)}</div>
                                </div>
                            </div>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                                Scheduled
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ ANALYTICS HUB DRILLDOWNS ============

export function ExecutiveDashboardDrilldown() {
    return (
        <div className="space-y-6">
            {/* Key KPIs */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Gauge className="w-5 h-5 text-emerald-400" />
                            <div className="flex items-center text-emerald-400 text-xs">
                                <TrendUp className="w-3 h-3 mr-1" /> +5%
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">87%</div>
                        <div className="text-xs text-slate-400">Fleet Utilization</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <CurrencyDollar className="w-5 h-5 text-emerald-400" />
                            <div className="flex items-center text-emerald-400 text-xs">
                                <TrendDown className="w-3 h-3 mr-1" /> -3¢
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">$0.42</div>
                        <div className="text-xs text-slate-400">Cost per Mile</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-5 h-5 text-blue-400" />
                            <div className="flex items-center text-blue-400 text-xs">
                                <TrendUp className="w-3 h-3 mr-1" /> +2%
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">94%</div>
                        <div className="text-xs text-slate-400">On-Time Rate</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <div className="flex items-center text-emerald-400 text-xs">
                                <TrendUp className="w-3 h-3 mr-1" /> +4
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">92</div>
                        <div className="text-xs text-slate-400">Safety Score</div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <CurrencyDollar className="w-5 h-5 text-emerald-400" />
                        Financial Overview
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { label: 'Total Revenue', value: '$1.24M', trend: 'up' },
                        { label: 'Operating Costs', value: '$890K', trend: 'down' },
                        { label: 'Net Margin', value: '28%', trend: 'up' },
                        { label: 'YoY Growth', value: '+12%', trend: 'up' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">{item.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{item.value}</span>
                                {item.trend === 'up' ? (
                                    <TrendUp className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <TrendDown className="w-4 h-4 text-emerald-400" />
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function CostAnalysisDrilldown() {
    return (
        <div className="space-y-6">
            {/* Cost Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Total Cost of Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Fuel', value: '$890K', percent: 37, color: 'bg-amber-500' },
                        { label: 'Maintenance', value: '$456K', percent: 19, color: 'bg-blue-500' },
                        { label: 'Insurance', value: '$312K', percent: 13, color: 'bg-purple-500' },
                        { label: 'Depreciation', value: '$384K', percent: 16, color: 'bg-slate-500' },
                        { label: 'Labor', value: '$358K', percent: 15, color: 'bg-emerald-500' },
                    ].map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.label}</span>
                                <span className="text-white">{item.value} ({item.percent}%)</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.percent}%` }} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Per Vehicle Metrics */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-white">$15.4K</div>
                        <div className="text-xs text-slate-400">Avg per Vehicle/Year</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">$124K</div>
                        <div className="text-xs text-slate-400">Savings YTD</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function FleetOptimizerDrilldown() {
    const recommendations = [
        { title: 'Optimize Route Planning', savings: '$12,500', impact: 'high', status: 'pending' },
        { title: 'Consolidate Fuel Stations', savings: '$8,200', impact: 'medium', status: 'pending' },
        { title: 'Reduce Idle Time', savings: '$6,800', impact: 'high', status: 'in-progress' },
        { title: 'Right-size Fleet', savings: '$15,000', impact: 'high', status: 'pending' },
        { title: 'Preventive Maintenance', savings: '$4,500', impact: 'medium', status: 'implemented' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">8</div>
                        <div className="text-xs text-slate-400">Active Recommendations</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">$45K</div>
                        <div className="text-xs text-slate-400">Potential Savings</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-900/30 border-purple-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">340%</div>
                        <div className="text-xs text-slate-400">Est. ROI</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <TrendUp className="w-5 h-5 text-emerald-400" />
                        Optimization Opportunities
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{rec.title}</div>
                                <div className="text-xs text-emerald-400">{rec.savings} potential savings</div>
                            </div>
                            <Badge variant="outline" className={`${rec.status === 'implemented' ? 'border-emerald-500 text-emerald-400' :
                                    rec.status === 'in-progress' ? 'border-amber-500 text-amber-400' :
                                        'border-blue-500 text-blue-400'
                                }`}>
                                {rec.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
