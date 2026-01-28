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

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'

// Reusable stat row component
function StatRow({ label, value, trend, icon: Icon }: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    icon?: any;
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
    const vehicles: any[] = []

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
                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2">
                        <div className="text-base font-bold text-blue-800">{vehicles.length}</div>
                        <div className="text-sm text-blue-400">Total Fleet Size</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2">
                        <div className="text-base font-bold text-emerald-500">
                            {Math.round((byStatus.active.length / vehicles.length) * 100)}%
                        </div>
                        <div className="text-sm text-emerald-400">Utilization Rate</div>
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
    const vehicles = [].filter(v => v.status === 'active')

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    {vehicles.length} Active Vehicles
                </Badge>
                <span className="text-sm text-muted-foreground">Real-time status</span>
            </div>

            <div className="space-y-2">
                {vehicles.slice(0, 20).map(vehicle => (
                    <Card
                        key={vehicle.id}
                        className="cursor-pointer bg-slate-800/40 hover:bg-slate-700/60 border-slate-700/50 transition-colors"
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
                                        <Truck className="h-5 w-5 text-emerald-400" />
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
                            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                                <span>Fuel: {vehicle.fuelLevel}%</span>
                                <span>|</span>
                                <span>{vehicle.mileage.toLocaleString()} mi</span>
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
    const workOrders: any[] = []

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
                <Card className="border-blue-500/30 bg-blue-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-800" />
                            <div>
                                <div className="text-sm font-bold text-blue-700">{byStatus.scheduled.length}</div>
                                <div className="text-xs text-blue-800">Scheduled</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-emerald-500/30 bg-emerald-500/10">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
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
                                        {order.vehicleId} • Due: {order.dueDate || 'N/A'}
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
    const transactions: any[] = []

    const totalCost = transactions.reduce((sum, t) => sum + (t.cost ?? 0), 0)
    const totalGallons = transactions.reduce((sum, t) => sum + t.gallons, 0)
    const avgCostPerGallon = totalGallons > 0 ? (totalCost / totalGallons).toFixed(2) : '0.00'

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
                <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-blue-800" />
                            <div>
                                <div className="text-sm font-bold text-blue-800">{transactions.length}</div>
                                <div className="text-xs text-blue-400">Total Transactions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-emerald-500" />
                            <div>
                                <div className="text-sm font-bold text-emerald-500">${totalCost.toFixed(2)}</div>
                                <div className="text-xs text-emerald-400">Total Cost</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-800/50 backdrop-blur-sm">
                    <CardContent className="pt-2 pb-3">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-amber-500" />
                            <div>
                                <div className="text-sm font-bold text-amber-500">${avgCostPerGallon}</div>
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
                            <span className="capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{list.length}</span>
                                <span className="text-sm text-muted-foreground">
                                    ${(list.reduce((sum, t) => sum + (t.cost ?? 0), 0)).toFixed(2)}
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
                                    <div className="font-semibold">${(tx.cost ?? 0).toFixed(2)}</div>
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
    const { currentLevel, push } = useDrilldown()

    // Get vehicles from drilldown data or generate demo vehicles
    const vehicles = currentLevel?.data?.vehicles || []
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
                        vehicle.status === 'active' ? 'default' :
                            vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'destructive' :
                                'secondary'
                    }
                    className={
                        vehicle.status === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' :
                            vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'bg-amber-500 hover:bg-amber-600' :
                                ''
                    }
                >
                    {vehicle.status}
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
                    <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
            render: (vehicle: any) => `${vehicle.mileage?.toLocaleString() || '0'} mi`
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
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
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
                                                'bg-slate-100 dark:bg-slate-800'
                                            }`}>
                                            <Truck className={`h-5 w-5 ${vehicle.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' :
                                                vehicle.status === 'maintenance' || vehicle.status === 'service' ? 'text-amber-600 dark:text-amber-400' :
                                                    'text-slate-500'
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">
                                                {vehicle.vehicleNumber || vehicle.number || `V-${vehicle.id}`}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Unknown Vehicle'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-sm font-medium">{vehicle.mileage?.toLocaleString() || '0'} mi</div>
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