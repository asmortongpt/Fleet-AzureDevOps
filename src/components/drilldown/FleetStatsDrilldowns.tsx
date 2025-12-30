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
                                    <div className="text-sm font-medium">{vehicle.driver?.split(' ').pop() || 'N/A'}</div>
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
                <CardContent>
                    <div className="space-y-2">
                        {workOrders.slice(0, 10).map(order => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                    <div className="font-medium">{order.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {order.vehicle} • Due: {order.dueDate || 'N/A'}
                                    </div>
                                </div>
                                <Badge variant={order.priority === 'urgent' ? 'destructive' : 'secondary'}>
                                    {order.status}
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
    const transactions = generateDemoFuelTransactions(150)

    const totalCost = transactions.reduce((sum, t) => sum + t.cost, 0)
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0)
    const avgCostPerGallon = totalGallons > 0 ? (totalCost / totalGallons).toFixed(2) : '0.00'

    const byVehicleType = {
        sedan: transactions.filter(t => t.vehicleType === 'sedan'),
        suv: transactions.filter(t => t.vehicleType === 'suv'),
        truck: transactions.filter(t => t.vehicleType === 'truck'),
        van: transactions.filter(t => t.vehicleType === 'van')
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-blue-500" />
                            <div>
                                <div className="text-2xl font-bold text-blue-700">{transactions.length}</div>
                                <div className="text-xs text-blue-600">Total Transactions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-emerald-500" />
                            <div>
                                <div className="text-2xl font-bold text-emerald-700">${totalCost.toFixed(2)}</div>
                                <div className="text-xs text-emerald-600">Total Cost</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-amber-500" />
                            <div>
                                <div className="text-2xl font-bold text-amber-700">${avgCostPerGallon}</div>
                                <div className="text-xs text-amber-600">Avg. Cost/Gallon</div>
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
                            <span className="capitalize">{type}</span>
                            <div className="flex items-center gap-4">
                                <span className="font-semibold">{list.length}</span>
                                <span className="text-sm text-muted-foreground">
                                    ${(list.reduce((sum, t) => sum + t.cost, 0)).toFixed(2)}
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
                                    <div className="font-medium">{tx.vehicle}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {tx.date} • {tx.locationData?.address.split(',')[0] || 'Unknown Location'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold">${tx.cost.toFixed(2)}</div>
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
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-5 w-5" /> Fuel Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Detailed fuel statistics will be displayed here
            </CardContent>
        </Card>
    )
}

export function PerformanceMetricsDrilldown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" /> Performance Metrics
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Performance metrics will be displayed here
            </CardContent>
        </Card>
    )
}

export function DriverStatsDrilldown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Driver Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Driver statistics will be displayed here
            </CardContent>
        </Card>
    )
}

export function UtilizationDrilldown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" /> Utilization Details
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Utilization details will be displayed here
            </CardContent>
        </Card>
    )
}

export function SafetyScoreDrilldown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Safety Score Details
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Safety score details will be displayed here
            </CardContent>
        </Card>
    )
}

export function VehicleListDrilldown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" /> Vehicle List
                </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
                Vehicle list will be displayed here
            </CardContent>
        </Card>
    )
}