/**
 * AdditionalHubDrilldowns - Drilldown components for Safety, Operations, and Procurement hubs
 */
import {
    Warning, ShieldCheck, VideoCamera, Truck, Package, MapTrifold, CheckCircle, Storefront,
    Cube, ShoppingCart, GasPump, Play, Eye
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useDrilldown } from '@/contexts/DrilldownContext'


// ============ SAFETY HUB DRILLDOWNS ============

export function IncidentsDrilldown() {
    const incidents = [
        { id: '1', type: 'Minor Collision', status: 'open', severity: 'medium', date: '2024-01-15', driver: 'John Smith', vehicle: 'TRK-001' },
        { id: '2', type: 'Near Miss', status: 'under-review', severity: 'low', date: '2024-01-14', driver: 'Jane Doe', vehicle: 'TRK-012' },
        { id: '3', type: 'Hard Braking', status: 'open', severity: 'low', date: '2024-01-14', driver: 'Bob Wilson', vehicle: 'TRK-008' },
        { id: '4', type: 'Speeding', status: 'under-review', severity: 'medium', date: '2024-01-13', driver: 'Alice Brown', vehicle: 'TRK-003' },
        { id: '5', type: 'Property Damage', status: 'open', severity: 'high', date: '2024-01-12', driver: 'Tom Davis', vehicle: 'TRK-015' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-400">3</div>
                        <div className="text-xs text-slate-400">Open</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">5</div>
                        <div className="text-xs text-slate-400">Under Review</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">12</div>
                        <div className="text-xs text-slate-400">Resolved (30d)</div>
                    </CardContent>
                </Card>
            </div>

            {/* Incident List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Warning className="w-5 h-5 text-amber-400" />
                        Recent Incidents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {incidents.map(incident => (
                        <div key={incident.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{incident.type}</div>
                                <div className="text-xs text-slate-400">{incident.driver} • {incident.vehicle} • {incident.date}</div>
                            </div>
                            <Badge variant="outline" className={`${incident.severity === 'high' ? 'border-red-500 text-red-400' :
                                    incident.severity === 'medium' ? 'border-amber-500 text-amber-400' :
                                        'border-slate-500 text-slate-400'
                                }`}>
                                {incident.severity}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function SafetyScoreDetailDrilldown() {
    return (
        <div className="space-y-6">
            {/* Overall Score */}
            <Card className="bg-emerald-900/30 border-emerald-700/50">
                <CardContent className="p-6 text-center">
                    <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <div className="text-4xl font-bold text-white">92</div>
                    <div className="text-sm text-slate-400">Fleet Safety Score</div>
                </CardContent>
            </Card>

            {/* Component Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Score Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Safe Driving Behaviors', score: 94, color: 'bg-emerald-500' },
                        { label: 'Speed Compliance', score: 91, color: 'bg-blue-500' },
                        { label: 'Hours of Service', score: 96, color: 'bg-emerald-500' },
                        { label: 'Vehicle Inspections', score: 88, color: 'bg-amber-500' },
                        { label: 'Incident Prevention', score: 90, color: 'bg-blue-500' },
                    ].map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.label}</span>
                                <span className="text-white font-medium">{item.score}%</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} transition-all`} style={{ width: `${item.score}%` }} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function VideoTelematicsDrilldown() {
    const events = [
        { id: '1', type: 'Hard Braking', vehicle: 'TRK-001', time: '10:34 AM', reviewed: true },
        { id: '2', type: 'Distraction', vehicle: 'TRK-015', time: '09:22 AM', reviewed: false },
        { id: '3', type: 'Lane Departure', vehicle: 'TRK-008', time: '08:45 AM', reviewed: false },
        { id: '4', type: 'Speeding', vehicle: 'TRK-003', time: '08:12 AM', reviewed: true },
        { id: '5', type: 'Near Miss', vehicle: 'TRK-012', time: '07:55 AM', reviewed: false },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <VideoCamera className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">148</div>
                        <div className="text-xs text-slate-400">Cameras Online</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">23</div>
                        <div className="text-xs text-slate-400">Events Today</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Today's Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {events.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Play className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="font-medium text-white">{event.type}</div>
                                    <div className="text-xs text-slate-400">{event.vehicle} • {event.time}</div>
                                </div>
                            </div>
                            {event.reviewed ? (
                                <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                                    <Eye className="w-3 h-3 mr-1" /> Reviewed
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-amber-500 text-amber-400">
                                    Pending
                                </Badge>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ OPERATIONS HUB DRILLDOWNS ============

export function DispatchDrilldown() {
    const { push } = useDrilldown()
    const jobs = [
        { id: '1', status: 'in-transit', destination: '123 Main St, Boston', driver: 'John Smith', eta: '15 min' },
        { id: '2', status: 'pending', destination: '456 Oak Ave, Cambridge', driver: 'Jane Doe', eta: '45 min' },
        { id: '3', status: 'in-transit', destination: '789 Elm Rd, Somerville', driver: 'Bob Wilson', eta: '22 min' },
        { id: '4', status: 'delayed', destination: '321 Pine St, Brookline', driver: 'Alice Brown', eta: 'TBD' },
        { id: '5', status: 'in-transit', destination: '654 Cedar Ln, Newton', driver: 'Tom Davis', eta: '8 min' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">24</div>
                        <div className="text-xs text-slate-400">Active</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">18</div>
                        <div className="text-xs text-slate-400">In Transit</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-900/30 border-purple-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-purple-400">156</div>
                        <div className="text-xs text-slate-400">Completed</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-400">3</div>
                        <div className="text-xs text-slate-400">Delayed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Jobs List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-400" />
                        Active Jobs
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {jobs.map(job => (
                        <div key={job.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Truck className={`w-5 h-5 ${job.status === 'in-transit' ? 'text-emerald-400' :
                                        job.status === 'delayed' ? 'text-red-400' : 'text-slate-400'
                                    }`} />
                                <div>
                                    <div className="font-medium text-white text-sm">{job.destination}</div>
                                    <div className="text-xs text-slate-400">{job.driver} • ETA: {job.eta}</div>
                                </div>
                            </div>
                            <Badge variant="outline" className={`${job.status === 'in-transit' ? 'border-emerald-500 text-emerald-400' :
                                    job.status === 'delayed' ? 'border-red-500 text-red-400' :
                                        'border-slate-500 text-slate-400'
                                }`}>
                                {job.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function RoutesDrilldown() {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <MapTrifold className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">45</div>
                        <div className="text-xs text-slate-400">Active Routes</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">12</div>
                        <div className="text-xs text-slate-400">Optimized Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">2.4h</div>
                        <div className="text-xs text-slate-400">Avg Duration</div>
                    </CardContent>
                </Card>
            </div>

            {/* Route Optimization */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Optimization Savings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { label: 'Distance Saved', value: '287 mi', percent: 28 },
                        { label: 'Time Saved', value: '4.2 hrs', percent: 18 },
                        { label: 'Fuel Saved', value: '45 gal', percent: 22 },
                    ].map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.label}</span>
                                <span className="text-emerald-400 font-medium">{item.value} ({item.percent}%)</span>
                            </div>
                            <Progress value={item.percent} className="h-2 bg-slate-700" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function TasksDrilldown() {
    const tasks = [
        { id: '1', title: 'Vehicle Inspection - TRK-001', status: 'open', priority: 'high', due: 'Today' },
        { id: '2', title: 'Delivery Confirmation', status: 'in-progress', priority: 'medium', due: 'Today' },
        { id: '3', title: 'Driver Check-in', status: 'completed', priority: 'low', due: 'Yesterday' },
        { id: '4', title: 'Route Verification', status: 'open', priority: 'medium', due: 'Tomorrow' },
        { id: '5', title: 'Fuel Card Renewal', status: 'overdue', priority: 'high', due: '2 days ago' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">34</div>
                        <div className="text-xs text-slate-400">Open</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-amber-400">12</div>
                        <div className="text-xs text-slate-400">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">89</div>
                        <div className="text-xs text-slate-400">Completed</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-400">2</div>
                        <div className="text-xs text-slate-400">Overdue</div>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {tasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle className={`w-5 h-5 ${task.status === 'completed' ? 'text-emerald-400' :
                                        task.status === 'overdue' ? 'text-red-400' : 'text-slate-400'
                                    }`} />
                                <div>
                                    <div className="font-medium text-white text-sm">{task.title}</div>
                                    <div className="text-xs text-slate-400">Due: {task.due}</div>
                                </div>
                            </div>
                            <Badge variant="outline" className={`${task.priority === 'high' ? 'border-red-500 text-red-400' :
                                    task.priority === 'medium' ? 'border-amber-500 text-amber-400' :
                                        'border-slate-500 text-slate-400'
                                }`}>
                                {task.priority}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ PROCUREMENT HUB DRILLDOWNS ============

export function VendorsDrilldown() {
    const vendors = [
        { id: '1', name: 'AutoParts Inc', status: 'active', orders: 24, spend: '$12,450' },
        { id: '2', name: 'FleetFuel Co', status: 'active', orders: 156, spend: '$45,200' },
        { id: '3', name: 'TirePro Supply', status: 'active', orders: 18, spend: '$8,900' },
        { id: '4', name: 'MechTools Ltd', status: 'pending', orders: 5, spend: '$2,100' },
        { id: '5', name: 'SafetyGear Plus', status: 'active', orders: 12, spend: '$3,450' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <Storefront className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">34</div>
                        <div className="text-xs text-slate-400">Active Vendors</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">$45.2K</div>
                        <div className="text-xs text-slate-400">This Month</div>
                    </CardContent>
                </Card>
            </div>

            {/* Vendor List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Top Vendors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {vendors.map(vendor => (
                        <div key={vendor.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{vendor.name}</div>
                                <div className="text-xs text-slate-400">{vendor.orders} orders • {vendor.spend}</div>
                            </div>
                            <Badge variant="outline" className={`${vendor.status === 'active' ? 'border-emerald-500 text-emerald-400' :
                                    'border-amber-500 text-amber-400'
                                }`}>
                                {vendor.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function PartsInventoryDrilldown() {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">1,245</div>
                        <div className="text-xs text-slate-400">Total SKUs</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">1,180</div>
                        <div className="text-xs text-slate-400">In Stock</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-amber-400">42</div>
                        <div className="text-xs text-slate-400">Low Stock</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-red-400">23</div>
                        <div className="text-xs text-slate-400">Out of Stock</div>
                    </CardContent>
                </Card>
            </div>

            {/* Inventory Value */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Cube className="w-5 h-5 text-purple-400" />
                        Inventory by Category
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { category: 'Engine Parts', count: 342, value: '$45,200' },
                        { category: 'Brake Components', count: 198, value: '$28,400' },
                        { category: 'Fluids & Oils', count: 156, value: '$8,900' },
                        { category: 'Electrical', count: 234, value: '$32,100' },
                        { category: 'Body Parts', count: 315, value: '$41,500' },
                    ].map(item => (
                        <div key={item.category} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">{item.category}</span>
                            <div className="text-right">
                                <span className="text-white font-medium">{item.count} items</span>
                                <span className="text-slate-400 text-sm ml-2">({item.value})</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function PurchaseOrdersDrilldown() {
    const orders = [
        { id: 'PO-2024-001', vendor: 'AutoParts Inc', status: 'in-transit', value: '$2,450', eta: 'Tomorrow' },
        { id: 'PO-2024-002', vendor: 'TirePro Supply', status: 'open', value: '$1,890', eta: '3 days' },
        { id: 'PO-2024-003', vendor: 'MechTools Ltd', status: 'received', value: '$890', eta: 'Delivered' },
        { id: 'PO-2024-004', vendor: 'SafetyGear Plus', status: 'open', value: '$1,200', eta: '5 days' },
    ]

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <ShoppingCart className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">12</div>
                        <div className="text-xs text-slate-400">Open POs</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">$124K</div>
                        <div className="text-xs text-slate-400">Total Value</div>
                    </CardContent>
                </Card>
            </div>

            {/* Orders List */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {orders.map(order => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{order.id}</div>
                                <div className="text-xs text-slate-400">{order.vendor} • {order.value} • ETA: {order.eta}</div>
                            </div>
                            <Badge variant="outline" className={`${order.status === 'received' ? 'border-emerald-500 text-emerald-400' :
                                    order.status === 'in-transit' ? 'border-amber-500 text-amber-400' :
                                        'border-blue-500 text-blue-400'
                                }`}>
                                {order.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function FuelPurchasingDrilldown() {
    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <GasPump className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">2,450</div>
                        <div className="text-xs text-slate-400">Gallons Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">$7,840</div>
                        <div className="text-xs text-slate-400">Cost Today</div>
                    </CardContent>
                </Card>
            </div>

            {/* Fuel Cards */}
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Fuel Card Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Active Cards</span>
                        <span className="text-emerald-400 font-medium">156</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Average Price/Gal</span>
                        <span className="text-white font-medium">$3.20</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">Monthly Budget</span>
                        <span className="text-white font-medium">$250,000</span>
                    </div>
                    <div className="flex justify-between p-2 bg-slate-900/50 rounded">
                        <span className="text-slate-300">MTD Spend</span>
                        <span className="text-amber-400 font-medium">$187,500 (75%)</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
