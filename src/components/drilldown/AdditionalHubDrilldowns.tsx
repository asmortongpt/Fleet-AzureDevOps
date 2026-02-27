/**
 * AdditionalHubDrilldowns - Drilldown components for Safety, Operations, and Procurement hubs
 * All data sourced from useFleetData() — no hardcoded/mock data.
 */
import {
    AlertTriangle, ShieldCheck, Video, Truck, Package, Map, Play, Eye,
    ClipboardList, Building2, Wrench, ShoppingCart, Fuel, Loader2
} from 'lucide-react'
import { useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useFleetData } from '@/hooks/use-fleet-data'
import { formatEnum } from '@/utils/format-enum'
import { formatCurrency, formatDate, formatNumber, formatTime } from '@/utils/format-helpers'


/** Shared loading spinner used across all drilldowns */
function DrilldownLoader({ label }: { label: string }) {
    return (
        <Card className="bg-[#111111] border-white/[0.04]">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                <span className="text-xs text-white/40">Loading {label}...</span>
            </CardContent>
        </Card>
    )
}

/** Shared empty-state card */
function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
    return (
        <Card className="bg-[#111111] border-white/[0.04]">
            <CardContent className="p-6 flex flex-col items-center justify-center gap-2">
                <Icon className="w-5 h-5 text-white/20" />
                <span className="text-xs text-white/40">No {label} found</span>
            </CardContent>
        </Card>
    )
}


// ============ SAFETY HUB DRILLDOWNS ============

export function IncidentsDrilldown() {
    const { incidents, isLoading } = useFleetData()

    const statusCounts = useMemo(() => {
        const counts = { open: 0, underReview: 0, resolved: 0 }
        for (const inc of incidents) {
            const s = String(inc.status || '').toLowerCase()
            if (s === 'resolved' || s === 'closed') counts.resolved++
            else if (s === 'under_review' || s === 'under-review' || s === 'investigating') counts.underReview++
            else counts.open++
        }
        return counts
    }, [incidents])

    if (isLoading) return <DrilldownLoader label="incidents" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-red-400">{statusCounts.open}</div>
                        <div className="text-xs text-white/40">Open</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-amber-400">{statusCounts.underReview}</div>
                        <div className="text-xs text-white/40">Under Review</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{statusCounts.resolved}</div>
                        <div className="text-xs text-white/40">Resolved</div>
                    </CardContent>
                </Card>
            </div>

            {/* Incident List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Recent Incidents
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {incidents.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">No incidents recorded</p>
                    )}
                    {incidents.slice(0, 8).map((incident: any) => {
                        const severity = String(incident.severity || 'low').toLowerCase()
                        const incidentType = incident.type || incident.incident_type || 'Incident'
                        const incidentDate = incident.incident_date || incident.date || incident.created_at || ''
                        const driverLabel = incident.driver_name || incident.driver_id || ''
                        const vehicleLabel = incident.vehicle_number || incident.vehicle_id || ''
                        return (
                            <div key={incident.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white">{formatEnum(incidentType)}</div>
                                    <div className="text-xs text-white/40">
                                        {[driverLabel, vehicleLabel, incidentDate ? formatDate(incidentDate) : ''].filter(Boolean).join(' \u2022 ')}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${severity === 'high' || severity === 'critical' ? 'border-red-500 text-red-400' :
                                        severity === 'medium' || severity === 'moderate' ? 'border-amber-500 text-amber-400' :
                                            'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(severity)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function SafetyScoreDetailDrilldown() {
    const { drivers, incidents, inspections, isLoading } = useFleetData()

    const stats = useMemo(() => {
        // Compute average safety score from all drivers that have one
        const scored = drivers.filter((d: any) => typeof d.safetyScore === 'number' || typeof d.safety_score === 'number')
        const avgScore = scored.length > 0
            ? Math.round(scored.reduce((sum: number, d: any) => sum + Number(d.safetyScore ?? d.safety_score ?? 0), 0) / scored.length)
            : 0

        // Compute component scores based on real data distributions
        const totalDrivers = drivers.length || 1

        // Safe Driving: % of drivers with safety score >= 80
        const safeDrivingPct = scored.length > 0
            ? Math.round((scored.filter((d: any) => Number(d.safetyScore ?? d.safety_score ?? 0) >= 80).length / scored.length) * 100)
            : 0

        // Speed Compliance: % of drivers with safety score >= 85
        const speedCompliancePct = scored.length > 0
            ? Math.round((scored.filter((d: any) => Number(d.safetyScore ?? d.safety_score ?? 0) >= 85).length / scored.length) * 100)
            : 0

        // Hours of Service: % of drivers that are active (not suspended)
        const hosPct = Math.round(
            (drivers.filter((d: any) => {
                const st = String(d.status || '').toLowerCase()
                return st !== 'suspended'
            }).length / totalDrivers) * 100
        )

        // Vehicle Inspections: % of inspections that passed
        const passedInspections = inspections.filter((i: any) => {
            const result = String(i.result || i.status || '').toLowerCase()
            return result === 'pass' || result === 'passed' || result === 'completed'
        }).length
        const inspectionPct = inspections.length > 0
            ? Math.round((passedInspections / inspections.length) * 100)
            : 0

        // Incident Prevention: inverse of incident rate (drivers without incidents / total)
        const driversWithIncidents = new Set(incidents.map((i: any) => i.driver_id)).size
        const incidentPreventionPct = Math.round(((totalDrivers - driversWithIncidents) / totalDrivers) * 100)

        return {
            avgScore,
            components: [
                { label: 'Safe Driving Behaviors', score: safeDrivingPct, color: safeDrivingPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500' },
                { label: 'Speed Compliance', score: speedCompliancePct, color: speedCompliancePct >= 90 ? 'bg-emerald-500' : 'bg-amber-500' },
                { label: 'Hours of Service', score: hosPct, color: hosPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500' },
                { label: 'Vehicle Inspections', score: inspectionPct, color: inspectionPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500' },
                { label: 'Incident Prevention', score: incidentPreventionPct, color: incidentPreventionPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500' },
            ]
        }
    }, [drivers, incidents, inspections])

    if (isLoading) return <DrilldownLoader label="safety scores" />

    return (
        <div className="space-y-2">
            {/* Overall Score */}
            <Card className="bg-emerald-900/30 border-emerald-700/50">
                <CardContent className="p-3 text-center">
                    <ShieldCheck className="w-10 h-8 text-emerald-700 mx-auto mb-2" />
                    <div className="text-sm font-bold text-white">{stats.avgScore}</div>
                    <div className="text-sm text-white/40">Fleet Safety Score</div>
                </CardContent>
            </Card>

            {/* Component Breakdown */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Score Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {stats.components.map(item => (
                        <div key={item.label} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/80">{item.label}</span>
                                <span className="text-white font-medium">{item.score}%</span>
                            </div>
                            <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
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
    const { vehicles, incidents, isLoading } = useFleetData()

    const camerasOnline = useMemo(() => {
        // Vehicles that are active represent telematics-equipped units
        return vehicles.filter((v: any) => {
            const st = String(v.status || '').toLowerCase()
            return st === 'active' || st === 'idle' || st === 'charging'
        }).length
    }, [vehicles])

    // Use incidents as "telematics events" — filter to today
    const todayEvents = useMemo(() => {
        const todayStr = new Date().toISOString().slice(0, 10)
        return incidents.filter((inc: any) => {
            const d = inc.incident_date || inc.date || inc.created_at || ''
            return String(d).startsWith(todayStr)
        })
    }, [incidents])

    // Show the most recent incidents as events (fall back to all if none today)
    const displayEvents = useMemo(() => {
        return (todayEvents.length > 0 ? todayEvents : incidents).slice(0, 6)
    }, [todayEvents, incidents])

    if (isLoading) return <DrilldownLoader label="telematics" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <Video className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{camerasOnline}</div>
                        <div className="text-xs text-white/40">Cameras Online</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-amber-400">{todayEvents.length}</div>
                        <div className="text-xs text-white/40">Events Today</div>
                    </CardContent>
                </Card>
            </div>

            {/* Events List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Recent Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {displayEvents.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">No events recorded</p>
                    )}
                    {displayEvents.map((event: any) => {
                        const eventType = event.type || event.incident_type || 'Event'
                        const vehicleLabel = event.vehicle_number || event.vehicle_id || ''
                        const eventDate = event.incident_date || event.date || event.created_at || ''
                        const timeStr = eventDate ? formatTime(eventDate) : ''
                        const isResolved = String(event.status || '').toLowerCase() === 'resolved' || String(event.status || '').toLowerCase() === 'closed'
                        return (
                            <div key={event.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Play className="w-3 h-3 text-emerald-400" />
                                    <div>
                                        <div className="font-medium text-white">{formatEnum(eventType)}</div>
                                        <div className="text-xs text-white/40">{vehicleLabel}{timeStr ? ` \u2022 ${timeStr}` : ''}</div>
                                    </div>
                                </div>
                                {isResolved ? (
                                    <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                                        <Eye className="w-3 h-3 mr-1" /> Reviewed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="border-amber-500 text-amber-400">
                                        Pending
                                    </Badge>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ OPERATIONS HUB DRILLDOWNS ============

export function DispatchDrilldown() {
    const { push: _push } = useDrilldown()
    const { routes, isLoading } = useFleetData()

    const statusCounts = useMemo(() => {
        const counts = { active: 0, inTransit: 0, completed: 0, delayed: 0 }
        for (const r of routes) {
            const s = String(r.status || '').toLowerCase().replace(/-/g, '_')
            if (s === 'completed') counts.completed++
            else if (s === 'in_transit' || s === 'in_progress' || s === 'in-progress') counts.inTransit++
            else if (s === 'delayed' || s === 'cancelled') counts.delayed++
            else counts.active++ // planned, active, pending, etc.
        }
        return counts
    }, [routes])

    // Show active (non-completed) routes as dispatch jobs
    const activeJobs = useMemo(() => {
        return routes
            .filter((r: any) => {
                const s = String(r.status || '').toLowerCase()
                return s !== 'completed' && s !== 'cancelled'
            })
            .slice(0, 8)
    }, [routes])

    if (isLoading) return <DrilldownLoader label="dispatch" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-emerald-400">{statusCounts.active}</div>
                        <div className="text-xs text-white/40">Active</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-emerald-700">{statusCounts.inTransit}</div>
                        <div className="text-xs text-white/40">In Transit</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-amber-400">{statusCounts.completed}</div>
                        <div className="text-xs text-white/40">Completed</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-red-400">{statusCounts.delayed}</div>
                        <div className="text-xs text-white/40">Delayed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Jobs List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Package className="w-3 h-3 text-emerald-400" />
                        Active Jobs
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {activeJobs.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">No active jobs</p>
                    )}
                    {activeJobs.map((job: any) => {
                        const status = String(job.status || 'planned').toLowerCase().replace(/-/g, '_')
                        const destination = job.destinationName || job.destination_name || job.endLocation || job.end_location || job.name || 'Unknown'
                        const origin = job.originName || job.origin_name || job.startLocation || job.start_location || ''
                        const duration = Number(job.estimatedDuration || job.estimated_duration || 0)
                        const etaLabel = duration > 0 ? `${Math.round(duration)} min` : ''
                        return (
                            <div key={job.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Truck className={`w-3 h-3 ${status === 'in_transit' || status === 'in_progress' ? 'text-emerald-700' :
                                            status === 'delayed' || status === 'cancelled' ? 'text-red-400' : 'text-white/40'
                                        }`} />
                                    <div>
                                        <div className="font-medium text-white text-sm">{destination}</div>
                                        <div className="text-xs text-white/40">
                                            {[origin, etaLabel ? `ETA: ${etaLabel}` : ''].filter(Boolean).join(' \u2022 ')}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${status === 'in_transit' || status === 'in_progress' ? 'border-emerald-500 text-emerald-700' :
                                        status === 'delayed' || status === 'cancelled' ? 'border-red-500 text-red-400' :
                                            'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(job.status)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function RoutesDrilldown() {
    const { routes, isLoading } = useFleetData()

    const stats = useMemo(() => {
        const activeRoutes = routes.filter((r: any) => {
            const s = String(r.status || '').toLowerCase()
            return s !== 'completed' && s !== 'cancelled'
        })

        const completedRoutes = routes.filter((r: any) => String(r.status || '').toLowerCase() === 'completed')

        // Average duration from completed routes that have actual or estimated duration
        const durations = completedRoutes
            .map((r: any) => Number(r.actualDuration || r.actual_duration || r.estimatedDuration || r.estimated_duration || 0))
            .filter((d: number) => d > 0)
        const avgDurationMin = durations.length > 0
            ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
            : 0
        const avgDurationHrs = avgDurationMin > 0 ? (avgDurationMin / 60).toFixed(1) : '0'

        return {
            total: routes.length,
            active: activeRoutes.length,
            completed: completedRoutes.length,
            avgDuration: `${avgDurationHrs}h`,
        }
    }, [routes])

    if (isLoading) return <DrilldownLoader label="routes" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <Map className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{stats.active}</div>
                        <div className="text-xs text-white/40">Active Routes</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{stats.completed}</div>
                        <div className="text-xs text-white/40">Completed</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-white/[0.04]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">{stats.avgDuration}</div>
                        <div className="text-xs text-white/40">Avg Duration</div>
                    </CardContent>
                </Card>
            </div>

            {/* Route List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Route Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {routes.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">No routes found</p>
                    )}
                    {routes.slice(0, 8).map((route: any) => {
                        const origin = route.originName || route.origin_name || route.startLocation || route.start_location || 'Origin'
                        const dest = route.destinationName || route.destination_name || route.endLocation || route.end_location || 'Destination'
                        const distance = Number(route.distance || 0)
                        const status = String(route.status || 'planned').toLowerCase()
                        return (
                            <div key={route.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white text-sm">{route.name || `${origin} to ${dest}`}</div>
                                    <div className="text-xs text-white/40">
                                        {distance > 0 ? `${distance.toFixed(1)} mi` : ''}{distance > 0 ? ' \u2022 ' : ''}{origin} \u2192 {dest}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${status === 'in_progress' || status === 'in-progress' || status === 'in_transit' ? 'border-emerald-500 text-emerald-700' :
                                        status === 'completed' ? 'border-amber-500 text-amber-400' :
                                            'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(route.status)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

// ============ PROCUREMENT HUB DRILLDOWNS ============

export function TasksDrilldown() {
    const { workOrders, isLoading } = useFleetData()

    const recentTasks = useMemo(() => {
        return [...workOrders]
            .sort((a: any, b: any) => {
                const da = a.dueDate || a.due_date || a.createdDate || a.created_at || ''
                const db = b.dueDate || b.due_date || b.createdDate || b.created_at || ''
                return String(db).localeCompare(String(da))
            })
            .slice(0, 8)
    }, [workOrders])

    const statusCounts = useMemo(() => {
        const counts = { pending: 0, inProgress: 0, completed: 0 }
        for (const wo of workOrders) {
            const s = String(wo.status || '').toLowerCase().replace(/-/g, '_')
            if (s === 'completed' || s === 'closed') counts.completed++
            else if (s === 'in_progress' || s === 'in-progress') counts.inProgress++
            else counts.pending++
        }
        return counts
    }, [workOrders])

    if (isLoading) return <DrilldownLoader label="tasks" />
    if (workOrders.length === 0) return <EmptyState icon={ClipboardList} label="tasks" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-amber-400">{statusCounts.pending}</div>
                        <div className="text-xs text-white/40">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-400">{statusCounts.inProgress}</div>
                        <div className="text-xs text-white/40">In Progress</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{statusCounts.completed}</div>
                        <div className="text-xs text-white/40">Completed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tasks List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ClipboardList className="w-3 h-3 text-amber-400" />
                        Recent Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {recentTasks.map((wo: any) => {
                        const priority = String(wo.priority || 'medium').toLowerCase()
                        const dueDate = wo.dueDate || wo.due_date || ''
                        return (
                            <div key={wo.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white text-sm">{wo.title || wo.serviceType || wo.number || 'Work Order'}</div>
                                    <div className="text-xs text-white/40">
                                        {[formatEnum(wo.status), dueDate ? `Due: ${formatDate(dueDate)}` : ''].filter(Boolean).join(' \u2022 ')}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${priority === 'high' || priority === 'urgent' ? 'border-red-500 text-red-400' :
                                        priority === 'medium' ? 'border-amber-500 text-amber-400' :
                                            'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(priority)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function VendorsDrilldown() {
    const { facilities, isLoading } = useFleetData()

    const statusCounts = useMemo(() => {
        const counts = { operational: 0, maintenance: 0, closed: 0 }
        for (const f of facilities) {
            const s = String(f.status || '').toLowerCase()
            if (s === 'maintenance') counts.maintenance++
            else if (s === 'closed') counts.closed++
            else counts.operational++
        }
        return counts
    }, [facilities])

    if (isLoading) return <DrilldownLoader label="vendors" />
    if (facilities.length === 0) return <EmptyState icon={Building2} label="vendor locations" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{statusCounts.operational}</div>
                        <div className="text-xs text-white/40">Operational</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-amber-400">{statusCounts.maintenance}</div>
                        <div className="text-xs text-white/40">Maintenance</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-red-400">{statusCounts.closed}</div>
                        <div className="text-xs text-white/40">Closed</div>
                    </CardContent>
                </Card>
            </div>

            {/* Facility List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Building2 className="w-3 h-3 text-emerald-400" />
                        Vendor Locations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {facilities.slice(0, 8).map((facility: any) => {
                        const status = String(facility.status || 'operational').toLowerCase()
                        return (
                            <div key={facility.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white text-sm">{facility.name || 'Facility'}</div>
                                    <div className="text-xs text-white/40">
                                        {[formatEnum(facility.type || facility.serviceType), facility.address || facility.region || ''].filter(Boolean).join(' \u2022 ')}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${status === 'operational' ? 'border-emerald-500 text-emerald-700' :
                                        status === 'maintenance' ? 'border-amber-500 text-amber-400' :
                                            'border-red-500 text-red-400'
                                    }`}>
                                    {formatEnum(status)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function PartsInventoryDrilldown() {
    const { workOrders, isLoading } = useFleetData()

    // Group work orders by category/serviceType to approximate parts usage
    const categoryCounts = useMemo(() => {
        const map: Record<string, number> = {}
        for (const wo of workOrders) {
            const cat = wo.category || wo.serviceType || wo.subcategory || 'General'
            map[cat] = (map[cat] || 0) + 1
        }
        return Object.entries(map)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
    }, [workOrders])

    const totalParts = useMemo(() => {
        return workOrders.reduce((sum: number, wo: any) => {
            if (Array.isArray(wo.parts)) return sum + wo.parts.length
            return sum
        }, 0)
    }, [workOrders])

    if (isLoading) return <DrilldownLoader label="parts inventory" />
    if (workOrders.length === 0) return <EmptyState icon={Wrench} label="parts data" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <Wrench className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{categoryCounts.length}</div>
                        <div className="text-xs text-white/40">Service Categories</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-white/[0.04]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">{totalParts}</div>
                        <div className="text-xs text-white/40">Parts Used</div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Wrench className="w-3 h-3 text-amber-400" />
                        Parts Usage by Category
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {categoryCounts.map(([category, count]) => {
                        const maxCount = categoryCounts[0]?.[1] || 1
                        const pct = Math.round((count / maxCount) * 100)
                        return (
                            <div key={category} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">{formatEnum(category)}</span>
                                    <span className="text-white font-medium">{count} orders</span>
                                </div>
                                <div className="h-1.5 bg-white/[0.1] rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function PurchaseOrdersDrilldown() {
    const { workOrders, isLoading } = useFleetData()

    // Pending/open work orders represent purchase needs
    const pendingOrders = useMemo(() => {
        return workOrders
            .filter((wo: any) => {
                const s = String(wo.status || '').toLowerCase().replace(/-/g, '_')
                return s === 'pending' || s === 'open' || s === 'waiting_parts'
            })
            .sort((a: any, b: any) => {
                const pa = a.priority === 'urgent' ? 0 : a.priority === 'high' ? 1 : a.priority === 'medium' ? 2 : 3
                const pb = b.priority === 'urgent' ? 0 : b.priority === 'high' ? 1 : b.priority === 'medium' ? 2 : 3
                return pa - pb
            })
    }, [workOrders])

    const priorityCounts = useMemo(() => {
        const counts = { urgent: 0, high: 0, medium: 0, low: 0 }
        for (const wo of pendingOrders) {
            const p = String(wo.priority || 'medium').toLowerCase() as keyof typeof counts
            if (p in counts) counts[p]++
        }
        return counts
    }, [pendingOrders])

    if (isLoading) return <DrilldownLoader label="purchase orders" />
    if (workOrders.length === 0) return <EmptyState icon={ShoppingCart} label="purchase orders" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-red-900/30 border-red-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-red-400">{priorityCounts.urgent}</div>
                        <div className="text-xs text-white/40">Urgent</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-amber-400">{priorityCounts.high}</div>
                        <div className="text-xs text-white/40">High</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-400">{priorityCounts.medium}</div>
                        <div className="text-xs text-white/40">Medium</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/[0.04] border-white/[0.04]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/60">{priorityCounts.low}</div>
                        <div className="text-xs text-white/40">Low</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Orders List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <ShoppingCart className="w-3 h-3 text-amber-400" />
                        Pending Purchase Needs
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {pendingOrders.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-4">No pending purchase orders</p>
                    )}
                    {pendingOrders.slice(0, 8).map((wo: any) => {
                        const priority = String(wo.priority || 'medium').toLowerCase()
                        const cost = wo.estimatedCost || wo.estimated_cost || wo.cost || 0
                        return (
                            <div key={wo.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white text-sm">{wo.title || wo.serviceType || wo.number || 'Work Order'}</div>
                                    <div className="text-xs text-white/40">
                                        {[formatEnum(wo.status), cost > 0 ? `Est: ${formatCurrency(Number(cost))}` : ''].filter(Boolean).join(' \u2022 ')}
                                    </div>
                                </div>
                                <Badge variant="outline" className={`${priority === 'urgent' ? 'border-red-500 text-red-400' :
                                        priority === 'high' ? 'border-amber-500 text-amber-400' :
                                            'border-white/[0.12] text-white/40'
                                    }`}>
                                    {formatEnum(priority)}
                                </Badge>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function FuelPurchasingDrilldown() {
    const { fuelTransactions, isLoading } = useFleetData()

    const stats = useMemo(() => {
        const totalGallons = fuelTransactions.reduce((sum: number, ft: any) => sum + Number(ft.gallons || ft.quantity || 0), 0)
        const totalCost = fuelTransactions.reduce((sum: number, ft: any) => sum + Number(ft.totalCost || ft.total_cost || ft.cost || 0), 0)
        const avgPricePerGallon = totalGallons > 0 ? totalCost / totalGallons : 0
        return { totalGallons, totalCost, avgPricePerGallon, count: fuelTransactions.length }
    }, [fuelTransactions])

    const recentTransactions = useMemo(() => {
        return [...fuelTransactions]
            .sort((a: any, b: any) => {
                const da = a.date || a.transaction_date || a.created_at || ''
                const db = b.date || b.transaction_date || b.created_at || ''
                return String(db).localeCompare(String(da))
            })
            .slice(0, 8)
    }, [fuelTransactions])

    if (isLoading) return <DrilldownLoader label="fuel data" />
    if (fuelTransactions.length === 0) return <EmptyState icon={Fuel} label="fuel transactions" />

    return (
        <div className="space-y-2">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <Fuel className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{stats.count}</div>
                        <div className="text-xs text-white/40">Transactions</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{formatNumber(stats.totalGallons)}</div>
                        <div className="text-xs text-white/40">Total Gallons</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#111111] border-white/[0.04]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">${stats.avgPricePerGallon.toFixed(2)}</div>
                        <div className="text-xs text-white/40">Avg $/Gallon</div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions List */}
            <Card className="bg-[#111111] border-white/[0.04]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Fuel className="w-3 h-3 text-amber-400" />
                        Recent Fuel Purchases
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {recentTransactions.map((ft: any) => {
                        const cost = Number(ft.totalCost || ft.total_cost || ft.cost || 0)
                        const gallons = Number(ft.gallons || ft.quantity || 0)
                        const fuelDate = ft.date || ft.transaction_date || ft.created_at || ''
                        const station = ft.station || ft.station_name || ft.station_brand || ft.stationBrand || ''
                        const vehicleLabel = ft.vehicleNumber || ft.vehicle_number || ft.vehicleId || ''
                        return (
                            <div key={ft.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div>
                                    <div className="font-medium text-white text-sm">
                                        {gallons > 0 ? `${gallons.toFixed(1)} gal` : 'Fuel Purchase'}
                                        {station ? ` @ ${station}` : ''}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        {[vehicleLabel, fuelDate ? formatDate(fuelDate) : ''].filter(Boolean).join(' \u2022 ')}
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-white">
                                    {cost > 0 ? formatCurrency(cost) : '--'}
                                </span>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
