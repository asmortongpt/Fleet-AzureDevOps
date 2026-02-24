/**
 * FleetStatsDrilldowns - Rich detail views for fleet-level metrics
 * Each component provides comprehensive drill-through with lists, charts, and actions
 */

import {
    Truck, AlertCircle, Wrench, Fuel, Activity,
    TrendingUp, TrendingDown, MapPin, Calendar, BarChart3,
    CheckCircle, XCircle, AlertTriangle, Zap, Users, Gauge
} from 'lucide-react'
import React from 'react'

import { formatVehicleShortName } from '@/utils/vehicle-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEnum } from '@/utils/format-enum'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useFleetData } from '@/hooks/use-fleet-data'
import { formatCurrency, formatNumber } from '@/utils/format-helpers'

// Reusable stat row component
function StatRow({ label, value, trend, icon: Icon }: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: any;
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0">
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="font-semibold">{value}</span>
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-emerald-600" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>
        </div>
    )
}

// Fleet Overview Drilldown - Shows all vehicles summary
export function FleetOverviewDrilldown() {
    const { push } = useDrilldown()
    const { vehicles: rawVehicles } = useFleetData()
    const vehicles = rawVehicles || []

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
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2">
                        <div className="text-base font-bold text-emerald-400">{vehicles.length}</div>
                        <div className="text-sm text-emerald-400">Total Fleet Size</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2">
                        <div className="text-base font-bold text-emerald-600">
                            {Math.round((byStatus.active.length / vehicles.length) * 100)}%
                        </div>
                        <div className="text-sm text-emerald-700">Utilization Rate</div>
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
                                <span className="text-sm font-bold">{list.length}</span>
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
                    <StatRow label="Avg. Mileage" value={`${formatNumber(Math.round(vehicles.reduce((a, v) => a + v.mileage, 0) / vehicles.length))} mi`} icon={Gauge} />
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
    const { vehicles: rawVehicles } = useFleetData()
    const vehicles = (rawVehicles || []).filter((v: any) => v.status === 'active')

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                    {vehicles.length} Active Vehicles
                </Badge>
                <span className="text-sm text-muted-foreground">Real-time status</span>
            </div>

            <div className="space-y-2">
                {vehicles.slice(0, 20).map(vehicle => (
                    <Card
                        key={vehicle.id}
                        className="cursor-pointer bg-[#242424] hover:bg-white/[0.08] border-white/[0.08] transition-colors"
                        onClick={() => push({
                            id: vehicle.id,
                            type: 'vehicle',
                            label: vehicle.number,
                            data: { vehicleId: vehicle.id }
                        })}
                    >
                        <CardContent className="p-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <Truck className="h-5 w-5 text-emerald-700" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{vehicle.number}</div>
                                        <div className="text-sm text-muted-foreground">{vehicle.name}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-medium">{vehicle.driver?.split(' ').pop() || '—'}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {vehicle.location.address.split(',')[1]?.trim() || 'On Route'}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                                <span>Fuel: {vehicle.fuelLevel}%</span>
                                <span>|</span>
                                <span>{formatNumber(vehicle.mileage)} mi</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {vehicles.length > 20 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                    Showing 20 of {vehicles.length} active vehicles
                </div>
            )}
        </div>
    )
}

// Maintenance Drilldown
export function MaintenanceDrilldown() {
    const { push } = useDrilldown()
    const { workOrders: rawWorkOrders } = useFleetData()
    const workOrders = rawWorkOrders || []

    const byStatus = {
        overdue: workOrders.filter(w => w.dueDate && new Date(w.dueDate) < new Date() && w.status !== 'completed' && w.status !== 'cancelled'),
        inProgress: workOrders.filter(w => w.status === 'in-progress'),
        scheduled: workOrders.filter(w => w.dueDate && new Date(w.dueDate) >= new Date() && w.status === 'pending'),
        completed: workOrders.filter(w => w.status === 'completed')
    }

    const byPriority = {
        urgent: workOrders.filter(w => w.priority === 'urgent'),
        high: workOrders.filter(w => w.priority === 'high'),
        medium: workOrders.filter(w => w.priority === 'medium'),
        low: workOrders.filter(w => w.priority === 'low')
    }

    return (
        <div className="space-y-2">
            {/* Status Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-red-500/30 bg-red-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <div>
                                <div className="text-sm font-bold text-red-700">{byStatus.overdue.length}</div>
                                <div className="text-xs text-red-600">Overdue</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-amber-500/30 bg-amber-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-amber-500" />
                            <div>
                                <div className="text-sm font-bold text-amber-700">{byStatus.inProgress.length}</div>
                                <div className="text-xs text-amber-600">In Progress</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/30 bg-emerald-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-emerald-400" />
                            <div>
                                <div className="text-sm font-bold text-emerald-400">{byStatus.scheduled.length}</div>
                                <div className="text-xs text-emerald-400">Scheduled</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/30 bg-emerald-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <div>
                                <div className="text-sm font-bold text-emerald-700">{byStatus.completed.length}</div>
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
                <CardContent>
                    <div className="space-y-2">
                        {workOrders.slice(0, 10).map(order => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium">{order.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {order.vehicleId} • Due: {order.dueDate || '—'}
                                    </div>
                                </div>
                                <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                    {formatEnum(order.status)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Fuel Management Drilldown
export function FuelManagementDrilldown() {
    const { push } = useDrilldown()
    const { fuelTransactions: rawTransactions } = useFleetData()
    const transactions = rawTransactions || []

    const totalCost = transactions.reduce((sum, t) => sum + (t.cost ?? 0), 0)
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0)
    const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0

    const byVehicleType = {
        sedan: transactions.filter(t => t.vehicleType === 'sedan'),
        suv: transactions.filter(t => t.vehicleType === 'suv'),
        truck: transactions.filter(t => t.vehicleType === 'truck'),
        van: transactions.filter(t => t.vehicleType === 'van')
    }

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-emerald-400" />
                            <div>
                                <div className="text-sm font-bold text-emerald-400">{transactions.length}</div>
                                <div className="text-xs text-emerald-400">Total Transactions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-emerald-600" />
                            <div>
                                <div className="text-sm font-bold text-emerald-600">{formatCurrency(totalCost)}</div>
                                <div className="text-xs text-emerald-700">Total Cost</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-amber-500" />
                            <div>
                                <div className="text-sm font-bold text-amber-500">{formatCurrency(avgCostPerGallon)}</div>
                                <div className="text-xs text-amber-400">Avg. Cost/Gallon</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions by Vehicle Type */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">By Vehicle Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {Object.entries(byVehicleType).map(([type, list]) => (
                        <div key={type} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span>{formatEnum(type)}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{list.length}</span>
                                <span className="text-sm text-muted-foreground">
                                    {formatCurrency(list.reduce((sum, t) => sum + (t.cost ?? 0), 0))}
                                </span>
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
                <CardContent>
                    <div className="space-y-2">
                        {transactions.slice(0, 10).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium">{tx.vehicleId}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {tx.date} • {(tx.locationData?.address?.split(',')[0] || 'Unknown Location')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">{formatCurrency(tx.cost ?? 0)}</div>
                                    <div className="text-xs text-muted-foreground">{tx.gallons.toFixed(2)} gal</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Additional Fleet Stats Drilldowns
export function FuelStatsDrilldown() {
    const { fuelTransactions: rawTransactions, vehicles: rawVehicles } = useFleetData()
    const transactions = rawTransactions || []
    const vehicles = rawVehicles || []

    const totalCost = transactions.reduce((sum, t: any) => sum + (t.cost ?? t.totalCost ?? 0), 0)
    const totalGallons = transactions.reduce((sum, t: any) => sum + (t.gallons ?? 0), 0)
    const avgCostPerGallon = totalGallons > 0 ? totalCost / totalGallons : 0

    // Fuel efficiency by vehicle type
    const byType: Record<string, { gallons: number; cost: number; count: number }> = {}
    transactions.forEach((t: any) => {
        const type = t.vehicleType || 'unknown'
        if (!byType[type]) byType[type] = { gallons: 0, cost: 0, count: 0 }
        byType[type].gallons += t.gallons ?? 0
        byType[type].cost += t.cost ?? t.totalCost ?? 0
        byType[type].count += 1
    })

    // Top 5 highest fuel consumers by vehicle
    const byVehicle: Record<string, { vehicleId: string; cost: number; gallons: number }> = {}
    transactions.forEach((t: any) => {
        const vId = t.vehicleId || t.vehicle_id || 'unknown'
        if (!byVehicle[vId]) byVehicle[vId] = { vehicleId: vId, cost: 0, gallons: 0 }
        byVehicle[vId].cost += t.cost ?? t.totalCost ?? 0
        byVehicle[vId].gallons += t.gallons ?? 0
    })
    const topConsumers = Object.values(byVehicle)
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5)

    // Resolve vehicle number from id
    const vehicleMap = new Map(vehicles.map((v: any) => [v.id, v]))

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-400">{formatCurrency(totalCost)}</div>
                        <div className="text-xs text-emerald-400">Total Fuel Cost</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-600">{formatNumber(Math.round(totalGallons))} gal</div>
                        <div className="text-xs text-emerald-700">Total Gallons</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="pt-4">
                    <StatRow label="Avg. Cost/Gallon" value={formatCurrency(avgCostPerGallon)} icon={Fuel} />
                    <StatRow label="Total Transactions" value={formatNumber(transactions.length)} icon={Activity} />
                    <StatRow label="Avg. Per Transaction" value={transactions.length > 0 ? formatCurrency(totalCost / transactions.length) : '$0'} icon={BarChart3} />
                </CardContent>
            </Card>

            {/* Efficiency by Vehicle Type */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Fuel by Vehicle Type
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Object.entries(byType).map(([type, data]) => {
                        const pct = totalCost > 0 ? (data.cost / totalCost) * 100 : 0
                        return (
                            <div key={type} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="capitalize text-muted-foreground">{type}</span>
                                    <span className="font-semibold">{formatCurrency(data.cost)} ({formatNumber(Math.round(data.gallons))} gal)</span>
                                </div>
                                <Progress value={pct} className="h-2" />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Top 5 Consumers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Top 5 Fuel Consumers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {topConsumers.map((item, idx) => {
                            const v = vehicleMap.get(item.vehicleId) as any
                            return (
                                <div key={item.vehicleId} className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                        <span className="text-sm font-medium">{v?.number || v?.name || item.vehicleId}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">{formatCurrency(item.cost)}</div>
                                        <div className="text-xs text-muted-foreground">{formatNumber(Math.round(item.gallons))} gal</div>
                                    </div>
                                </div>
                            )
                        })}
                        {topConsumers.length === 0 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">No fuel transaction data available</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function PerformanceMetricsDrilldown() {
    const { vehicles: rawVehicles, drivers: rawDrivers, workOrders: rawWorkOrders, routes: rawRoutes } = useFleetData()
    const vehicles = rawVehicles || []
    const drivers = rawDrivers || []
    const workOrders = rawWorkOrders || []
    const routes = rawRoutes || []

    // Fleet utilization rate
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length
    const utilizationRate = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0

    // Average vehicle uptime (non-service / non-offline)
    const uptimeVehicles = vehicles.filter((v: any) => v.status !== 'service' && v.status !== 'offline').length
    const uptimeRate = vehicles.length > 0 ? Math.round((uptimeVehicles / vehicles.length) * 100) : 0

    // Routes completed vs planned
    const completedRoutes = routes.filter((r: any) => r.status === 'completed').length
    const plannedRoutes = routes.filter((r: any) => r.status === 'planned').length
    const inProgressRoutes = routes.filter((r: any) => r.status === 'in-progress').length
    const totalRoutes = routes.length

    // Work order completion rate
    const completedOrders = workOrders.filter((w: any) => w.status === 'completed').length
    const woCompletionRate = workOrders.length > 0 ? Math.round((completedOrders / workOrders.length) * 100) : 0

    // Average response time (days from created to completed for completed work orders)
    const completedWOs = workOrders.filter((w: any) => w.status === 'completed' && (w.completedDate || w.completed_at) && (w.createdDate || w.created_at))
    const avgResponseDays = completedWOs.length > 0
        ? completedWOs.reduce((sum: number, w: any) => {
            const created = new Date(w.createdDate || w.created_at)
            const completed = new Date(w.completedDate || w.completed_at)
            return sum + Math.max(0, (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
        }, 0) / completedWOs.length
        : 0

    return (
        <div className="space-y-2">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-400">{utilizationRate}%</div>
                        <div className="text-xs text-emerald-400">Fleet Utilization</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-600">{uptimeRate}%</div>
                        <div className="text-xs text-emerald-700">Vehicle Uptime</div>
                    </CardContent>
                </Card>
            </div>

            {/* Route Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Route Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Total Routes" value={formatNumber(totalRoutes)} icon={MapPin} />
                    <StatRow label="Completed" value={formatNumber(completedRoutes)} icon={CheckCircle} trend="up" />
                    <StatRow label="In Progress" value={formatNumber(inProgressRoutes)} icon={Activity} />
                    <StatRow label="Planned" value={formatNumber(plannedRoutes)} icon={Calendar} />
                    {totalRoutes > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Completion Rate</span>
                                <span>{Math.round((completedRoutes / totalRoutes) * 100)}%</span>
                            </div>
                            <Progress value={(completedRoutes / totalRoutes) * 100} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Work Order Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" /> Work Order Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Total Work Orders" value={formatNumber(workOrders.length)} icon={Wrench} />
                    <StatRow label="Completed" value={formatNumber(completedOrders)} icon={CheckCircle} trend="up" />
                    <StatRow label="Completion Rate" value={`${woCompletionRate}%`} icon={BarChart3} />
                    <StatRow label="Avg. Resolution Time" value={`${avgResponseDays.toFixed(1)} days`} icon={Calendar} />
                    {workOrders.length > 0 && (
                        <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>WO Completion</span>
                                <span>{woCompletionRate}%</span>
                            </div>
                            <Progress value={woCompletionRate} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fleet Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Fleet Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Total Vehicles" value={formatNumber(vehicles.length)} icon={Truck} />
                    <StatRow label="Active Drivers" value={formatNumber(drivers.filter((d: any) => d.status === 'active').length)} icon={Users} />
                    <StatRow label="Active Vehicles" value={formatNumber(activeVehicles)} icon={Activity} />
                    <StatRow label="In Maintenance" value={formatNumber(vehicles.filter((v: any) => v.status === 'service').length)} icon={Wrench} />
                </CardContent>
            </Card>
        </div>
    )
}

export function DriverStatsDrilldown() {
    const { push } = useDrilldown()
    const { drivers: rawDrivers, incidents: rawIncidents } = useFleetData()
    const drivers = rawDrivers || []
    const incidents = rawIncidents || []

    // Driver status breakdown
    const activeDrivers = drivers.filter((d: any) => d.status === 'active')
    const offDutyDrivers = drivers.filter((d: any) => d.status === 'off-duty' || d.status === 'off_duty')
    const onLeaveDrivers = drivers.filter((d: any) => d.status === 'on-leave' || d.status === 'on_leave')
    const suspendedDrivers = drivers.filter((d: any) => d.status === 'suspended')

    // Safety scores
    const driversWithScores = drivers.filter((d: any) => typeof d.safetyScore === 'number' || typeof d.safety_score === 'number')
    const avgSafetyScore = driversWithScores.length > 0
        ? Math.round(driversWithScores.reduce((sum: number, d: any) => sum + (d.safetyScore ?? d.safety_score ?? 0), 0) / driversWithScores.length)
        : 0

    // Score distribution
    const scoreExcellent = driversWithScores.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) >= 90).length
    const scoreGood = driversWithScores.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 75 && s < 90 }).length
    const scoreFair = driversWithScores.filter((d: any) => { const s = d.safetyScore ?? d.safety_score ?? 0; return s >= 60 && s < 75 }).length
    const scorePoor = driversWithScores.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) < 60).length

    // Top 5 drivers by safety score
    const topDrivers = [...driversWithScores]
        .sort((a: any, b: any) => (b.safetyScore ?? b.safety_score ?? 0) - (a.safetyScore ?? a.safety_score ?? 0))
        .slice(0, 5)

    return (
        <div className="space-y-2">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-400">{drivers.length}</div>
                        <div className="text-xs text-emerald-400">Total Drivers</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="text-base font-bold text-emerald-600">{avgSafetyScore}</div>
                        <div className="text-xs text-emerald-700">Avg. Safety Score</div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" /> Status Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { label: 'Active', count: activeDrivers.length, color: 'text-emerald-600' },
                        { label: 'Off Duty', count: offDutyDrivers.length, color: 'text-amber-500' },
                        { label: 'On Leave', count: onLeaveDrivers.length, color: 'text-blue-500' },
                        { label: 'Suspended', count: suspendedDrivers.length, color: 'text-red-500' },
                    ].map(({ label, count, color }) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="w-20 text-sm text-muted-foreground">{label}</div>
                            <div className="flex-1">
                                <Progress value={drivers.length > 0 ? (count / drivers.length) * 100 : 0} className="h-2" />
                            </div>
                            <span className={`font-semibold text-sm ${color}`}>{count}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Safety Score Distribution */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Gauge className="h-4 w-4" /> Safety Score Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { label: 'Excellent (90+)', count: scoreExcellent, variant: 'default' as const, className: 'bg-emerald-600 hover:bg-emerald-700' },
                        { label: 'Good (75-89)', count: scoreGood, variant: 'default' as const, className: 'bg-blue-600 hover:bg-blue-700' },
                        { label: 'Fair (60-74)', count: scoreFair, variant: 'default' as const, className: 'bg-amber-500 hover:bg-amber-600' },
                        { label: 'Needs Improvement (<60)', count: scorePoor, variant: 'destructive' as const, className: '' },
                    ].map(({ label, count, variant, className }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <Badge variant={variant} className={className}>{count}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Incident Summary */}
            <Card>
                <CardContent className="pt-4">
                    <StatRow label="Total Incidents" value={formatNumber(incidents.length)} icon={AlertCircle} />
                </CardContent>
            </Card>

            {/* Top 5 Drivers */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Top 5 Drivers by Safety
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {topDrivers.map((driver: any, idx: number) => {
                            const score = driver.safetyScore ?? driver.safety_score ?? 0
                            return (
                                <div
                                    key={driver.id}
                                    className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0 cursor-pointer hover:bg-white/[0.04] rounded px-1 -mx-1 transition-colors"
                                    onClick={() => push({
                                        id: `driver-${driver.id}`,
                                        type: 'driver',
                                        label: driver.name || `Driver ${driver.id}`,
                                        data: { driverId: driver.id }
                                    })}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground w-5">#{idx + 1}</span>
                                        <div>
                                            <div className="text-sm font-medium">{driver.name || `${driver.firstName || driver.first_name || ''} ${driver.lastName || driver.last_name || ''}`.trim() || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{driver.department || '—'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-blue-400' : score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                                            {score}
                                        </span>
                                        <Gauge className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            )
                        })}
                        {topDrivers.length === 0 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">No driver safety data available</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function UtilizationDrilldown() {
    const { push } = useDrilldown()
    const { vehicles: rawVehicles } = useFleetData()
    const vehicles = rawVehicles || []

    const activeVehicles = vehicles.filter((v: any) => v.status === 'active')
    const idleVehicles = vehicles.filter((v: any) => v.status === 'idle')
    const serviceVehicles = vehicles.filter((v: any) => v.status === 'service')
    const offlineVehicles = vehicles.filter((v: any) => v.status === 'offline')
    const chargingVehicles = vehicles.filter((v: any) => v.status === 'charging')
    const emergencyVehicles = vehicles.filter((v: any) => v.status === 'emergency')

    const utilizationRate = vehicles.length > 0 ? Math.round((activeVehicles.length / vehicles.length) * 100) : 0
    const inServiceCount = serviceVehicles.length

    const statusBreakdown = [
        { label: 'Active', vehicles: activeVehicles, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
        { label: 'Idle', vehicles: idleVehicles, color: 'bg-amber-500', textColor: 'text-amber-400' },
        { label: 'In Service', vehicles: serviceVehicles, color: 'bg-red-500', textColor: 'text-red-400' },
        { label: 'Offline', vehicles: offlineVehicles, color: 'bg-gray-500', textColor: 'text-gray-400' },
        { label: 'Charging', vehicles: chargingVehicles, color: 'bg-blue-500', textColor: 'text-blue-400' },
        { label: 'Emergency', vehicles: emergencyVehicles, color: 'bg-purple-500', textColor: 'text-purple-400' },
    ].filter(s => s.vehicles.length > 0)

    return (
        <div className="space-y-2">
            {/* Utilization Rate Hero */}
            <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className="text-2xl font-bold text-emerald-400">{utilizationRate}%</div>
                            <div className="text-sm text-emerald-400">Fleet Utilization Rate</div>
                        </div>
                        <Activity className="h-8 w-8 text-emerald-400/40" />
                    </div>
                    <Progress value={utilizationRate} className="h-3" />
                    <div className="flex justify-between mt-1 text-xs text-emerald-700">
                        <span>{activeVehicles.length} active</span>
                        <span>{vehicles.length} total</span>
                    </div>
                </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Status Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {statusBreakdown.map(({ label, vehicles: statusVehicles, color, textColor }) => {
                        const pct = vehicles.length > 0 ? (statusVehicles.length / vehicles.length) * 100 : 0
                        return (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold ${textColor}`}>{statusVehicles.length}</span>
                                        <span className="text-xs text-muted-foreground">({Math.round(pct)}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Underutilized Vehicles */}
            {idleVehicles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" /> Underutilized Vehicles ({idleVehicles.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {idleVehicles.slice(0, 8).map((vehicle: any) => (
                                <div
                                    key={vehicle.id}
                                    className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0 cursor-pointer hover:bg-white/[0.04] rounded px-1 -mx-1 transition-colors"
                                    onClick={() => push({
                                        id: `vehicle-${vehicle.id}`,
                                        type: 'vehicle',
                                        label: vehicle.number || vehicle.name || `Vehicle ${vehicle.id}`,
                                        data: { vehicleId: vehicle.id }
                                    })}
                                >
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-amber-500" />
                                        <div>
                                            <div className="text-sm font-medium">{vehicle.number || vehicle.name}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{vehicle.type}</div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Idle</Badge>
                                </div>
                            ))}
                            {idleVehicles.length > 8 && (
                                <div className="text-center text-xs text-muted-foreground py-1">
                                    +{idleVehicles.length - 8} more idle vehicles
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Service / Maintenance */}
            <Card>
                <CardContent className="pt-4">
                    <StatRow label="Vehicles in Service" value={inServiceCount} icon={Wrench} />
                    <StatRow label="Vehicles Offline" value={offlineVehicles.length} icon={XCircle} />
                    <StatRow label="Avg. Fleet Mileage" value={vehicles.length > 0 ? `${formatNumber(Math.round(vehicles.reduce((a: number, v: any) => a + (v.mileage ?? 0), 0) / vehicles.length))} mi` : '0 mi'} icon={Gauge} />
                    <StatRow label="Avg. Fuel Level" value={vehicles.length > 0 ? `${Math.round(vehicles.reduce((a: number, v: any) => a + (v.fuelLevel ?? 0), 0) / vehicles.length)}%` : '0%'} icon={Fuel} />
                </CardContent>
            </Card>
        </div>
    )
}

export function SafetyScoreDrilldown() {
    const { drivers: rawDrivers, incidents: rawIncidents, inspections: rawInspections } = useFleetData()
    const drivers = rawDrivers || []
    const incidents = rawIncidents || []
    const inspections = rawInspections || []

    // Fleet average safety score
    const driversWithScores = drivers.filter((d: any) => typeof d.safetyScore === 'number' || typeof d.safety_score === 'number')
    const avgSafetyScore = driversWithScores.length > 0
        ? Math.round(driversWithScores.reduce((sum: number, d: any) => sum + (d.safetyScore ?? d.safety_score ?? 0), 0) / driversWithScores.length)
        : 0

    // Incidents by severity
    const criticalIncidents = incidents.filter((i: any) => i.severity === 'critical').length
    const severeIncidents = incidents.filter((i: any) => i.severity === 'severe' || i.severity === 'high').length
    const moderateIncidents = incidents.filter((i: any) => i.severity === 'moderate' || i.severity === 'medium').length
    const minorIncidents = incidents.filter((i: any) => i.severity === 'minor' || i.severity === 'low').length

    // Inspections breakdown
    const passedInspections = inspections.filter((i: any) => i.passed_inspection === true || i.status === 'completed').length
    const failedInspections = inspections.filter((i: any) => i.passed_inspection === false || i.status === 'failed').length
    const pendingInspections = inspections.filter((i: any) => i.status === 'scheduled' || i.status === 'in_progress').length

    // Safety trend: compute from score distribution
    const highScoreDrivers = driversWithScores.filter((d: any) => (d.safetyScore ?? d.safety_score ?? 0) >= 80).length
    const safetyTrendPct = driversWithScores.length > 0 ? Math.round((highScoreDrivers / driversWithScores.length) * 100) : 0

    // Score quality label
    const scoreLabel = avgSafetyScore >= 90 ? 'Excellent' : avgSafetyScore >= 75 ? 'Good' : avgSafetyScore >= 60 ? 'Fair' : 'Needs Improvement'
    const scoreColor = avgSafetyScore >= 90 ? 'text-emerald-400' : avgSafetyScore >= 75 ? 'text-blue-400' : avgSafetyScore >= 60 ? 'text-amber-500' : 'text-red-500'

    return (
        <div className="space-y-2">
            {/* Safety Score Hero */}
            <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <div className={`text-3xl font-bold ${scoreColor}`}>{avgSafetyScore}</div>
                            <div className="text-sm text-emerald-400">Fleet Safety Score</div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className={`${avgSafetyScore >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                {scoreLabel}
                            </Badge>
                        </div>
                    </div>
                    <Progress value={avgSafetyScore} className="h-3" />
                    <div className="flex justify-between mt-1 text-xs text-emerald-700">
                        <span>{driversWithScores.length} drivers scored</span>
                        <span>{safetyTrendPct}% above 80</span>
                    </div>
                </CardContent>
            </Card>

            {/* Incidents Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Incidents ({incidents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { label: 'Critical', count: criticalIncidents, variant: 'destructive' as const, className: '' },
                        { label: 'Severe', count: severeIncidents, variant: 'default' as const, className: 'bg-orange-600 hover:bg-orange-700' },
                        { label: 'Moderate', count: moderateIncidents, variant: 'default' as const, className: 'bg-amber-500 hover:bg-amber-600' },
                        { label: 'Minor', count: minorIncidents, variant: 'secondary' as const, className: '' },
                    ].map(({ label, count, variant, className }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.08] last:border-0">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <Badge variant={variant} className={className}>{count}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Inspections */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Inspections ({inspections.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {[
                        { label: 'Passed', count: passedInspections, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500' },
                        { label: 'Failed', count: failedInspections, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500' },
                        { label: 'Pending', count: pendingInspections, icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500' },
                    ].map(({ label, count, icon: StatusIcon, color, bg }) => {
                        const pct = inspections.length > 0 ? (count / inspections.length) * 100 : 0
                        return (
                            <div key={label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <StatusIcon className={`h-4 w-4 ${color}`} />
                                        <span className="text-muted-foreground">{label}</span>
                                    </div>
                                    <span className={`font-semibold ${color}`}>{count}</span>
                                </div>
                                <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                                    <div className={`h-full ${bg} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )
                    })}
                    {inspections.length > 0 && (
                        <div className="pt-2 text-center">
                            <span className="text-sm text-muted-foreground">
                                Pass Rate: <span className="font-semibold text-foreground">{Math.round((passedInspections / inspections.length) * 100)}%</span>
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Safety Trend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" /> Safety Trend
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <StatRow label="Drivers Scoring 80+" value={`${highScoreDrivers} of ${driversWithScores.length}`} icon={TrendingUp} trend={safetyTrendPct >= 70 ? 'up' : 'down'} />
                    <StatRow label="Fleet Safety Rating" value={scoreLabel} icon={Gauge} />
                    <StatRow label="Total Incidents" value={formatNumber(incidents.length)} icon={AlertTriangle} />
                    <StatRow label="Inspections Completed" value={formatNumber(passedInspections + failedInspections)} icon={CheckCircle} />
                </CardContent>
            </Card>
        </div>
    )
}

export function VehicleListDrilldown() {
    const { currentLevel, push } = useDrilldown()
    const { vehicles: apiVehicles } = useFleetData()

    // Get vehicles from drilldown data or API
    const vehicles = currentLevel?.data?.vehicles || apiVehicles || []
    const filter = currentLevel?.data?.filter || currentLevel?.data?.status

    // Apply filter if provided
    const filteredVehicles = filter
        ? vehicles.filter((v: any) =>
            v.status === filter ||
            (filter === 'maintenance' && (v.status === 'maintenance' || v.status === 'service'))
        )
        : vehicles

    // Define columns for the data table
    const columns = [
        {
            key: 'number',
            header: 'Vehicle #',
            sortable: true,
            render: (vehicle: any) => (
                <span className="font-mono font-medium">
                    {vehicle.vehicleNumber || vehicle.number || `V-${vehicle.id}`}
                </span>
            )
        },
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (vehicle: any) => vehicle.name || '-'
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (vehicle: any) => (
                <Badge
                    variant={
                        vehicle.status === 'active' || vehicle.status === 'completed' ? 'default' :
                            vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'destructive' :
                            vehicle.status === 'assigned' || vehicle.status === 'dispatched' || vehicle.status === 'en_route' || vehicle.status === 'on_site' ? 'default' :
                                'secondary'
                    }
                    className={
                        vehicle.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'bg-amber-500 hover:bg-amber-600' :
                            vehicle.status === 'assigned' ? 'bg-indigo-500 hover:bg-indigo-600' :
                            vehicle.status === 'dispatched' ? 'bg-orange-500 hover:bg-orange-600' :
                            vehicle.status === 'en_route' ? 'bg-sky-500 hover:bg-sky-600' :
                            vehicle.status === 'on_site' ? 'bg-yellow-500 hover:bg-yellow-600' :
                            vehicle.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                ''
                    }
                >
                    {formatEnum(vehicle.status)}
                </Badge>
            )
        },
        {
            key: 'location',
            header: 'Last Location',
            render: (vehicle: any) => {
                const address = vehicle.location?.address || vehicle.lastKnownLocation
                if (!address) return '-'
                // Show city and state only
                const parts = address.split(',')
                return parts.length > 1 ? `${parts[parts.length - 2]?.trim()}, ${parts[parts.length - 1]?.trim()}` : address
            }
        },
        {
            key: 'fuelLevel',
            header: 'Fuel',
            sortable: true,
            render: (vehicle: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-white/[0.1] dark:bg-white/[0.1] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${vehicle.fuelLevel > 50 ? 'bg-emerald-500' :
                                vehicle.fuelLevel > 25 ? 'bg-amber-500' :
                                    'bg-red-500'
                                }`}
                            style={{ width: `${vehicle.fuelLevel}%` }}
                        />
                    </div>
                    <span className="text-sm text-muted-foreground">{vehicle.fuelLevel}%</span>
                </div>
            )
        },
        {
            key: 'mileage',
            header: 'Mileage',
            sortable: true,
            render: (vehicle: any) => `${formatNumber(vehicle.mileage ?? 0)} mi`
        }
    ]

    return (
        <div className="space-y-2">
            {/* Header with summary */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold">
                        {filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Vehicles` : 'All Vehicles'}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-bold">{filteredVehicles.length}</div>
                                <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <div>
                                <div className="text-sm font-bold text-emerald-600">
                                    {filteredVehicles.filter((v: any) => v.status === 'active').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Active</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <div>
                                <div className="text-sm font-bold text-amber-600">
                                    {filteredVehicles.filter((v: any) => v.status === 'maintenance' || v.status === 'service').length}
                                </div>
                                <div className="text-xs text-muted-foreground">Maintenance</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <div className="text-sm font-bold">
                                    {Math.round(filteredVehicles.reduce((sum: number, v: any) => sum + (v.fuelLevel || 0), 0) / filteredVehicles.length)}%
                                </div>
                                <div className="text-xs text-muted-foreground">Avg Fuel</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Vehicle Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Vehicle Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredVehicles.map((vehicle: any) => (
                            <div
                                key={vehicle.id}
                                className="p-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => push({
                                    id: `vehicle-${vehicle.id}`,
                                    type: 'vehicle',
                                    label: vehicle.vehicleNumber || vehicle.number || vehicle.name || `Vehicle ${vehicle.id}`,
                                    data: { vehicleId: vehicle.id, ...vehicle }
                                })}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className={`w-10 h-8 rounded-full flex items-center justify-center ${vehicle.status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                            vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                            vehicle.status === 'assigned' ? 'bg-indigo-100 dark:bg-indigo-900/30' :
                                            vehicle.status === 'dispatched' ? 'bg-orange-100 dark:bg-orange-900/30' :
                                            vehicle.status === 'en_route' ? 'bg-sky-100 dark:bg-sky-900/30' :
                                            vehicle.status === 'on_site' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                            vehicle.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                'bg-white/[0.06] dark:bg-[#1a1a1a]'
                                            }`}>
                                            <Truck className={`h-5 w-5 ${vehicle.status === 'active' ? 'text-emerald-600 dark:text-emerald-700' :
                                                vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'text-amber-600 dark:text-amber-400' :
                                                vehicle.status === 'assigned' ? 'text-indigo-600 dark:text-indigo-400' :
                                                vehicle.status === 'dispatched' ? 'text-orange-600 dark:text-orange-400' :
                                                vehicle.status === 'en_route' ? 'text-sky-600 dark:text-sky-400' :
                                                vehicle.status === 'on_site' ? 'text-yellow-600 dark:text-yellow-400' :
                                                vehicle.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' :
                                                    'text-white/40'
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">
                                                {vehicle.vehicleNumber || vehicle.number || `V-${vehicle.id}`}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {vehicle.name || formatVehicleShortName(vehicle)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-sm font-medium">{formatNumber(vehicle.mileage ?? 0)} mi</div>
                                            <div className="text-xs text-muted-foreground">Fuel: {vehicle.fuelLevel}%</div>
                                        </div>
                                        {columns[2].render && columns[2].render(vehicle)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredVehicles.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <XCircle className="h-9 w-12 mx-auto mb-3 opacity-50" />
                            <p>No vehicles found matching the filter</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}