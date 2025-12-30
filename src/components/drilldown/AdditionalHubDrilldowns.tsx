/**
 * AdditionalHubDrilldowns - Drilldown components for Safety, Operations, and Procurement hubs
 */
import {
    Warning, ShieldCheck, VideoCamera, Truck, Package, MapTrifold, Play, Eye
} from '@phosphor-icons/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    const { push: _push } = useDrilldown()
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
                    <CardTitle className="text-white text-lg">Route Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Content for route optimization would go here */}
                </CardContent>
            </Card>
        </div>
    )
}