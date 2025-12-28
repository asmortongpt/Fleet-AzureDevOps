/**
 * FleetStatsDrilldowns - Rich detail views for fleet-level metrics
 * Each component provides comprehensive drill-through with lists, charts, and actions
 */

import {
    Truck, AlertCircle, Wrench, Fuel, Activity, Clock,
    TrendingUp, TrendingDown, MapPin, Calendar, BarChart3,
    CheckCircle, XCircle, AlertTriangle, Zap, Users, Gauge
} from 'lucide-react'
import React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { generateDemoVehicles, generateDemoDrivers, generateDemoFuelTransactions, generateDemoWorkOrders } from '@/lib/demo-data'

// Reusable stat row component
function StatRow({ label, value, trend, icon: Icon }: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: React.ElementType;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="font-semibold">{value}</span>
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
        </div>
    )
}

// Fleet Overview Drilldown - Shows all vehicles summary
export function FleetOverviewDrilldown() {
    const { push } = useDrilldown()
    const vehicles = generateDemoVehicles(100)

    const byStatus = {
        active: vehicles.filter(v => v.status === 'active'),
        idle: vehicles.filter(v => v.status === 'idle'),
        charging: vehicles.filter(v => v.status === 'charging'),
        service: vehicles.filter(v => v.status === 'service'),
        emergency: vehicles.filter(v => v.status === 'emergency'),
        offline: vehicles.filter(v => v.status === 'offline')
    }

    const byType = {
        sedan: vehicles.filter(v => v.type === 'sedan'),
        suv: vehicles.filter(v => v.type === 'suv'),
        truck: vehicles.filter(v => v.type === 'truck'),
        van: vehicles.filter(v => v.type === 'van')
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-blue-700">{vehicles.length}</div>
                        <div className="text-sm text-blue-600">Total Fleet Size</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="pt-4">
                        <div className="text-3xl font-bold text-emerald-700">
                            {Math.round((byStatus.active.length / vehicles.length) * 100)}%
                        </div>
                        <div className="text-sm text-emerald-600">Utilization Rate</div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Status Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Object.entries(byStatus).map(([status, list]) => (
                        <div key={status} className="flex items-center gap-3">
                            <div className="w-20 text-sm capitalize text-muted-foreground">{status}</div>
                            <div className="flex-1">
                                <Progress value={(list.length / vehicles.length) * 100} className="h-2" />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => push({
                                    id: `status-${status}`,
                                    type: 'vehicle-list',
                                    label: `${status.charAt(0).toUpperCase() + status.slice(1)} Vehicles (${list.length})`,
                                    data: { vehicles: list, filter: status }
                                })}
                            >
                                {list.length} →
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Fleet by Type */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Fleet by Type
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(byType).map(([type, list]) => (
                            <Button
                                key={type}
                                variant="outline"
                                className="h-auto py-3 flex-col items-start"
                                onClick={() => push({
                                    id: `type-${type}`,
                                    type: 'vehicle-list',
                                    label: `${type.charAt(0).toUpperCase() + type.slice(1)} Vehicles`,
                                    data: { vehicles: list, filter: type }
                                })}
                            >
                                <span className="text-lg font-bold">{list.length}</span>
                                <span className="text-xs text-muted-foreground capitalize">{type}s</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Fleet Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Avg. Mileage" value={`${Math.round(vehicles.reduce((a, v) => a + v.mileage, 0) / vehicles.length).toLocaleString()} mi`} icon={Gauge} />
                    <StatRow label="Avg. Fuel Level" value={`${Math.round(vehicles.reduce((a, v) => a + v.fuelLevel, 0) / vehicles.length)}%`} icon={Fuel} />
                    <StatRow label="Vehicles Due Service" value={vehicles.filter(v => v.alerts.length > 0).length} icon={Wrench} />
                    <StatRow label="Electric Vehicles" value={vehicles.filter(v => v.fuelType === 'electric').length} icon={Zap} />
                </CardContent>
            </Card>
        </div>
    )
}

// Active Vehicles Drilldown
export function ActiveVehiclesDrilldown() {
    const { push } = useDrilldown()
    const vehicles = generateDemoVehicles(100).filter(v => v.status === 'active')

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                    {vehicles.length} Active Vehicles
                </Badge>
                <span className="text-sm text-muted-foreground">Real-time status</span>
            </div>

            <div className="space-y-2">
                {vehicles.slice(0, 20).map(vehicle => (
                    <Card
                        key={vehicle.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => push({
                            id: vehicle.id,
                            type: 'vehicle',
                            label: vehicle.number,
                            data: { vehicleId: vehicle.id }
                        })}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{vehicle.number}</div>
                                        <div className="text-sm text-muted-foreground">{vehicle.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{vehicle.driver?.split(' ').pop()}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {vehicle.location.address.split(',')[1]?.trim() || 'On Route'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                                <span>Fuel: {vehicle.fuelLevel}%</span>
                                <span>|</span>
                                <span>{vehicle.mileage.toLocaleString()} mi</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {vehicles.length > 20 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                    Showing 20 of {vehicles.length} active vehicles
                </div>
            )}
        </div>
    )
}

// Maintenance Drilldown
export function MaintenanceDrilldown() {
    const { push } = useDrilldown()
    const workOrders = generateDemoWorkOrders(75)

    const byStatus = {
        overdue: workOrders.filter(w => w.status === 'overdue'),
        inProgress: workOrders.filter(w => w.status === 'in-progress'),
        scheduled: workOrders.filter(w => w.status === 'scheduled'),
        completed: workOrders.filter(w => w.status === 'completed')
    }

    const byPriority = {
        urgent: workOrders.filter(w => w.priority === 'urgent'),
        high: workOrders.filter(w => w.priority === 'high'),
        medium: workOrders.filter(w => w.priority === 'medium'),
        low: workOrders.filter(w => w.priority === 'low')
    }

    return (
        <div className="space-y-6">
            {/* Status Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                                <div className="text-2xl font-bold text-red-700">{byStatus.overdue.length}</div>
                                <div className="text-xs text-red-600">Overdue</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-amber-500" />
                            <div>
                                <div className="text-2xl font-bold text-amber-700">{byStatus.inProgress.length}</div>
                                <div className="text-xs text-amber-600">In Progress</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold text-blue-700">{byStatus.scheduled.length}</div>
                                <div className="text-xs text-blue-600">Scheduled</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-200 bg-emerald-50">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <div>
                                <div className="text-2xl font-bold text-emerald-700">{byStatus.completed.length}</div>
                                <div className="text-xs text-emerald-600">Completed</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Priority Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">By Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {Object.entries(byPriority).map(([priority, list]) => (
                        <div key={priority} className="flex items-center justify-between py-2 border-b last:border-0">
                            <Badge variant={priority === 'urgent' ? 'destructive' : priority === 'high' ? 'default' : 'secondary'}>
                                {priority.toUpperCase()}
                            </Badge>
                            <span className="font-semibold">{list.length}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recent Work Orders */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Work Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {workOrders.slice(0, 10).map(wo => (
                        <div
                            key={wo.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: wo.id,
                                type: 'workOrder',
                                label: wo.id,
                                data: { workOrderId: wo.id }
                            })}
                        >
                            <div>
                                <div className="font-medium text-sm">{wo.id}</div>
                                <div className="text-xs text-muted-foreground">{wo.type}</div>
                            </div>
                            <Badge variant={wo.status === 'completed' ? 'secondary' : 'default'} className="text-xs">
                                {wo.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Fuel Stats Drilldown
export function FuelStatsDrilldown() {
    const { push } = useDrilldown()
    const transactions = generateDemoFuelTransactions(250)
    const vehicles = generateDemoVehicles(100)

    const totalGallons = transactions.reduce((a, t) => a + t.gallons, 0)
    const totalCost = transactions.reduce((a, t) => a + t.totalCost, 0)
    const avgPrice = transactions.reduce((a, t) => a + t.pricePerGallon, 0) / transactions.length

    // Group by vehicle
    const byVehicle = new Map<string, typeof transactions>()
    transactions.forEach(t => {
        const existing = byVehicle.get(t.vehicleId) || []
        existing.push(t)
        byVehicle.set(t.vehicleId, existing)
    })

    const topConsumers = Array.from(byVehicle.entries())
        .map(([id, txns]) => ({
            vehicleId: id,
            vehicle: vehicles.find(v => v.id === id) || { number: id, name: 'Unknown' },
            totalGallons: txns.reduce((a, t) => a + t.gallons, 0),
            totalCost: txns.reduce((a, t) => a + t.totalCost, 0)
        }))
        .sort((a, b) => b.totalGallons - a.totalGallons)
        .slice(0, 10)

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-amber-700">${totalCost.toLocaleString()}</div>
                        <div className="text-sm text-amber-600">Total Fuel Spend (90 days)</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-blue-700">{Math.round(totalGallons).toLocaleString()}</div>
                        <div className="text-sm text-blue-600">Total Gallons</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Fuel Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Avg. Price/Gallon" value={`$${avgPrice.toFixed(2)}`} icon={Fuel} />
                    <StatRow label="Transactions" value={transactions.length} icon={BarChart3} />
                    <StatRow label="Avg. Fill-Up" value={`${(totalGallons / transactions.length).toFixed(1)} gal`} icon={Gauge} />
                    <StatRow label="Cost per Vehicle" value={`$${Math.round(totalCost / vehicles.length)}`} icon={Truck} />
                </CardContent>
            </Card>

            {/* Top Consumers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Top Fuel Consumers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {topConsumers.map((item, i) => (
                        <div
                            key={item.vehicleId}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: item.vehicleId,
                                type: 'vehicle',
                                label: item.vehicle.number,
                                data: { vehicleId: item.vehicleId }
                            })}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                                <div>
                                    <div className="font-medium text-sm">{item.vehicle.number}</div>
                                    <div className="text-xs text-muted-foreground">{item.vehicle.name}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">{Math.round(item.totalGallons)} gal</div>
                                <div className="text-xs text-muted-foreground">${item.totalCost.toFixed(0)}</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {transactions.slice(0, 8).map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                                <div className="font-medium text-sm">{t.vehicleId.split('-').pop()?.toUpperCase()}</div>
                                <div className="text-xs text-muted-foreground">{t.date} • {t.location}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">${t.totalCost.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">{t.gallons.toFixed(1)} gal</div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Performance Metrics Drilldown
export function PerformanceMetricsDrilldown({ metricType }: { metricType: string }) {
    const { push } = useDrilldown()
    const vehicles = generateDemoVehicles(100)
    const drivers = generateDemoDrivers(50)

    const metricData: Record<string, any> = {
        'miles-day': {
            title: 'Daily Mileage Analysis',
            value: '142',
            unit: 'avg. miles/day',
            description: 'Average daily mileage across all active vehicles',
            details: [
                { label: 'Highest Daily', value: '287 mi', vehicle: 'TAL-1015' },
                { label: 'Lowest Daily', value: '45 mi', vehicle: 'TAL-1042' },
                { label: 'Fleet Average', value: '142 mi', trend: 'up' },
                { label: 'Target', value: '150 mi' }
            ],
            topPerformers: vehicles.slice(0, 5).map((v, i) => ({
                ...v,
                dailyMiles: 200 - (i * 25)
            }))
        },
        'on-time': {
            title: 'On-Time Performance',
            value: '94.2%',
            unit: 'on-time rate',
            description: 'Percentage of trips completed on schedule',
            details: [
                { label: 'On-Time Deliveries', value: '1,247' },
                { label: 'Late Deliveries', value: '77' },
                { label: 'Early Arrivals', value: '312' },
                { label: 'Average Delay', value: '8 min' }
            ],
            topPerformers: drivers.slice(0, 5).map((d, i) => ({
                ...d,
                onTimeRate: 99 - (i * 2)
            }))
        },
        'idle-time': {
            title: 'Idle Time Analysis',
            value: '12%',
            unit: 'fleet idle rate',
            description: 'Percentage of engine-on time spent idling',
            details: [
                { label: 'Total Idle Hours', value: '342 hrs' },
                { label: 'Fuel Wasted', value: '~$1,240' },
                { label: 'CO2 Impact', value: '2.3 tons' },
                { label: 'Target Rate', value: '< 10%' }
            ],
            worstOffenders: vehicles.slice(0, 5).map((v, i) => ({
                ...v,
                idleRate: 25 - (i * 3)
            }))
        },
        'mpg': {
            title: 'Fuel Efficiency',
            value: '24.8',
            unit: 'avg. MPG',
            description: 'Fleet-wide fuel efficiency metrics',
            details: [
                { label: 'Best MPG', value: '42.5 mpg', vehicle: 'TAL-1003 (Hybrid)' },
                { label: 'Worst MPG', value: '12.3 mpg', vehicle: 'TAL-1087 (Heavy Truck)' },
                { label: 'Improvement YTD', value: '+2.3 mpg', trend: 'up' },
                { label: 'Target', value: '26 mpg' }
            ],
            topPerformers: vehicles.slice(0, 5).map((v, i) => ({
                ...v,
                mpg: 38 - (i * 4)
            }))
        }
    }

    const data = metricData[metricType] || metricData['miles-day']

    return (
        <div className="space-y-6">
            {/* Hero Stat */}
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <CardContent className="pt-6 pb-6 text-center">
                    <div className="text-4xl font-bold">{data.value}</div>
                    <div className="text-sm text-slate-300">{data.unit}</div>
                    <div className="text-xs text-slate-400 mt-2">{data.description}</div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.details.map((d: any, i: number) => (
                        <StatRow
                            key={i}
                            label={d.label}
                            value={d.value}
                            trend={d.trend}
                        />
                    ))}
                </CardContent>
            </Card>

            {/* Top/Worst Performers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {metricType === 'idle-time' ? 'Improvement Needed' : 'Top Performers'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {(data.topPerformers || data.worstOffenders || []).map((item: any, i: number) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: item.id,
                                type: item.safetyScore ? 'driver' : 'vehicle',
                                label: item.name || item.number,
                                data: item.safetyScore ? { driverId: item.id } : { vehicleId: item.id }
                            })}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-slate-400">#{i + 1}</span>
                                <div>
                                    <div className="font-medium text-sm">{item.number || item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.name || item.department}</div>
                                </div>
                            </div>
                            <Badge variant={i === 0 ? 'default' : 'secondary'}>
                                {item.dailyMiles ? `${item.dailyMiles} mi/day` :
                                    item.onTimeRate ? `${item.onTimeRate}%` :
                                        item.idleRate ? `${item.idleRate}% idle` :
                                            item.mpg ? `${item.mpg} mpg` : ''}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Driver Stats Drilldown
export function DriverStatsDrilldown() {
    const { push } = useDrilldown()
    const drivers = generateDemoDrivers(50)

    const activeDrivers = drivers.filter(d => d.status === 'active')
    const offDuty = drivers.filter(d => d.status === 'off-duty')
    const onLeave = drivers.filter(d => d.status === 'on-leave')

    const avgSafetyScore = Math.round(drivers.reduce((a, d) => a + d.safetyScore, 0) / drivers.length)

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <Users className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-emerald-700">{activeDrivers.length}</div>
                        <div className="text-xs text-emerald-600">Active</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <Clock className="h-5 w-5 text-slate-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-slate-700">{offDuty.length}</div>
                        <div className="text-xs text-slate-600">Off Duty</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <Calendar className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <div className="text-xl font-bold text-amber-700">{onLeave.length}</div>
                        <div className="text-xs text-amber-600">On Leave</div>
                    </CardContent>
                </Card>
            </div>

            {/* Safety Score */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Fleet Safety Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <div className="text-4xl font-bold text-emerald-600">{avgSafetyScore}</div>
                        <div className="text-sm text-muted-foreground">out of 100</div>
                        <Progress value={avgSafetyScore} className="mt-4" />
                    </div>
                </CardContent>
            </Card>

            {/* Driver List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Driver Roster</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {drivers.slice(0, 12).map(driver => (
                        <div
                            key={driver.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: driver.id,
                                type: 'driver',
                                label: driver.name,
                                data: { driverId: driver.id }
                            })}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                  ${driver.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                    {driver.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">{driver.name}</div>
                                    <div className="text-xs text-muted-foreground">{driver.department}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={driver.safetyScore >= 90 ? 'default' : 'secondary'} className="text-xs">
                                    {driver.safetyScore}
                                </Badge>
                                <span className={`w-2 h-2 rounded-full ${driver.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Utilization Drilldown
export function UtilizationDrilldown() {
    const vehicles = generateDemoVehicles(100)
    const { push } = useDrilldown()

    const active = vehicles.filter(v => v.status === 'active').length
    const utilizationRate = Math.round((active / vehicles.length) * 100)

    // Simulate utilization by department
    const byDepartment = [
        { name: 'Operations', utilization: 94, vehicles: 35 },
        { name: 'Logistics', utilization: 88, vehicles: 28 },
        { name: 'Field Services', utilization: 82, vehicles: 22 },
        { name: 'Maintenance', utilization: 76, vehicles: 10 },
        { name: 'Executive', utilization: 45, vehicles: 5 }
    ]

    return (
        <div className="space-y-6">
            {/* Overall Utilization */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <CardContent className="pt-6 pb-6">
                    <div className="text-center">
                        <div className="text-5xl font-bold">{utilizationRate}%</div>
                        <div className="text-sm text-indigo-100 mt-1">Fleet Utilization Rate</div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                            <div className="text-lg font-bold">{active}</div>
                            <div className="text-indigo-200">Active</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold">{vehicles.length - active}</div>
                            <div className="text-indigo-200">Idle</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold">{vehicles.length}</div>
                            <div className="text-indigo-200">Total</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* By Department */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Utilization by Department</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {byDepartment.map(dept => (
                        <div key={dept.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{dept.name}</span>
                                <span className="font-medium">{dept.utilization}%</span>
                            </div>
                            <Progress value={dept.utilization} className="h-2" />
                            <div className="text-xs text-muted-foreground">{dept.vehicles} vehicles</div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Underutilized Vehicles */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Underutilized Vehicles
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {vehicles.filter(v => v.status === 'idle' || v.status === 'offline').slice(0, 8).map(v => (
                        <div
                            key={v.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: v.id,
                                type: 'vehicle',
                                label: v.number,
                                data: { vehicleId: v.id }
                            })}
                        >
                            <div>
                                <div className="font-medium text-sm">{v.number}</div>
                                <div className="text-xs text-muted-foreground">{v.name}</div>
                            </div>
                            <Badge variant="outline" className="capitalize">{v.status}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Safety Score Drilldown
export function SafetyScoreDrilldown() {
    const { push } = useDrilldown()
    const drivers = generateDemoDrivers(50)

    const avgScore = Math.round(drivers.reduce((a, d) => a + d.safetyScore, 0) / drivers.length)
    const excellent = drivers.filter(d => d.safetyScore >= 95)
    const good = drivers.filter(d => d.safetyScore >= 85 && d.safetyScore < 95)
    const needsImprovement = drivers.filter(d => d.safetyScore < 85)

    return (
        <div className="space-y-6">
            {/* Score Overview */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <CardContent className="pt-6 pb-6 text-center">
                    <div className="text-5xl font-bold">{avgScore}</div>
                    <div className="text-sm text-emerald-100">Fleet Safety Score</div>
                    <div className="mt-4 flex justify-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>+3 vs last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Distribution */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-50 border-emerald-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-xl font-bold text-emerald-700">{excellent.length}</div>
                        <div className="text-xs text-emerald-600">Excellent (95+)</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-xl font-bold text-blue-700">{good.length}</div>
                        <div className="text-xs text-blue-600">Good (85-94)</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-xl font-bold text-amber-700">{needsImprovement.length}</div>
                        <div className="text-xs text-amber-600">Needs Work (&lt;85)</div>
                    </CardContent>
                </Card>
            </div>

            {/* Safety Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Safety Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Incidents (30 days)" value="2" icon={AlertCircle} />
                    <StatRow label="Hard Brakes" value="47" icon={XCircle} />
                    <StatRow label="Speeding Events" value="23" icon={Gauge} />
                    <StatRow label="Seatbelt Violations" value="0" icon={CheckCircle} />
                </CardContent>
            </Card>

            {/* Driver Rankings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Driver Safety Rankings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...drivers].sort((a, b) => b.safetyScore - a.safetyScore).slice(0, 10).map((d, i) => (
                        <div
                            key={d.id}
                            className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-accent rounded px-2 -mx-2"
                            onClick={() => push({
                                id: d.id,
                                type: 'driver',
                                label: d.name,
                                data: { driverId: d.id }
                            })}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-lg font-bold ${i < 3 ? 'text-emerald-600' : 'text-slate-400'}`}>#{i + 1}</span>
                                <div>
                                    <div className="font-medium text-sm">{d.name}</div>
                                    <div className="text-xs text-muted-foreground">{d.department}</div>
                                </div>
                            </div>
                            <Badge variant={d.safetyScore >= 95 ? 'default' : d.safetyScore >= 85 ? 'secondary' : 'outline'}>
                                {d.safetyScore}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// Vehicle List Drilldown (for filtered lists)
export function VehicleListDrilldown({ vehicles, filter }: { vehicles: any[]; filter: string }) {
    const { push } = useDrilldown()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Badge variant="secondary">{vehicles.length} vehicles</Badge>
                <span className="text-sm text-muted-foreground capitalize">Filter: {filter}</span>
            </div>

            <div className="space-y-2">
                {vehicles.map(vehicle => (
                    <Card
                        key={vehicle.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => push({
                            id: vehicle.id,
                            type: 'vehicle',
                            label: vehicle.number,
                            data: { vehicleId: vehicle.id }
                        })}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                    ${vehicle.status === 'active' ? 'bg-emerald-100' :
                                            vehicle.status === 'service' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                        <Truck className={`h-5 w-5 
                      ${vehicle.status === 'active' ? 'text-emerald-600' :
                                                vehicle.status === 'service' ? 'text-amber-600' : 'text-slate-600'}`} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{vehicle.number}</div>
                                        <div className="text-sm text-muted-foreground">{vehicle.name}</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="capitalize">{vehicle.status}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
