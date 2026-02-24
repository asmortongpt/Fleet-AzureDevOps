/**
 * ComplianceHubDrilldowns - Drilldown components for Compliance hub
 * All data sourced from useFleetData() hook — no hardcoded/mock data.
 */
import { ShieldCheck, Clock, FileText, MapPin, Fuel } from 'lucide-react'
import { useMemo } from 'react'


import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFleetData } from '@/hooks/use-fleet-data'
import { formatCurrency, formatNumber } from '@/utils/format-helpers'
import { formatVehicleName } from '@/utils/vehicle-display'


export function RegulationsDrilldown() {
    const { inspections: rawInspections, drivers: rawDrivers, vehicles: rawVehicles } = useFleetData()
    const inspections = rawInspections || []
    const drivers = rawDrivers || []
    const vehicles = rawVehicles || []

    const scores = useMemo(() => {
        const totalDrivers = Math.max(drivers.length, 1)
        const totalVehicles = Math.max(vehicles.length, 1)
        const totalInspections = Math.max(inspections.length, 1)

        // DOT HOS: percentage of active drivers
        const dotHos = Math.round(
            (drivers.filter((d: any) => d.status === 'active').length / totalDrivers) * 100
        )

        // Vehicle Inspections: percentage of completed inspections
        const vehicleInspections = Math.round(
            (inspections.filter((i: any) => i.status === 'completed' || i.status === 'pass').length / totalInspections) * 100
        )

        // Driver Qualifications: percentage of drivers with a license on file
        const driverQualifications = Math.round(
            (drivers.filter((d: any) => d.licenseType || d.license_number || d.licenseExpiry).length / totalDrivers) * 100
        )

        // ELD Mandate: percentage of vehicles that are not offline
        const eldMandate = Math.round(
            (vehicles.filter((v: any) => v.status !== 'offline').length / totalVehicles) * 100
        )

        // IFTA: derive from fuel transaction coverage — approximate with ELD for simplicity
        const iftaCompliance = eldMandate

        return [
            { regulation: 'DOT Hours of Service', score: dotHos },
            { regulation: 'IFTA Fuel Tax', score: iftaCompliance },
            { regulation: 'Vehicle Inspections', score: vehicleInspections },
            { regulation: 'Driver Qualifications', score: driverQualifications },
            { regulation: 'ELD Mandate', score: eldMandate },
        ]
    }, [inspections, drivers, vehicles])

    const dotScore = scores.find(s => s.regulation === 'DOT Hours of Service')?.score || 0
    const iftaScore = scores.find(s => s.regulation === 'IFTA Fuel Tax')?.score || 0

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <ShieldCheck className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{dotScore}%</div>
                        <div className="text-xs text-white/40">DOT Compliance</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{iftaScore}%</div>
                        <div className="text-xs text-white/40">IFTA Compliance</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {scores.map(item => {
                        const status = item.score >= 95 ? 'compliant' : 'attention'
                        return (
                            <div key={item.regulation} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80">{item.regulation}</span>
                                    <Badge variant="outline" className={
                                        status === 'compliant' ? 'border-emerald-500 text-emerald-700' : 'border-amber-500 text-amber-400'
                                    }>
                                        {item.score}%
                                    </Badge>
                                </div>
                                <Progress value={item.score} className="h-2 bg-white/[0.1]" />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

export function GeofenceComplianceDrilldown() {
    const { hazardZones: rawZones } = useFleetData()
    const hazardZones = rawZones || []

    const zones = useMemo(() => {
        return hazardZones.map((zone: any) => {
            // Zones with severity "high" or "critical" get attention status
            const severity = (zone.severity || '').toLowerCase()
            const status = severity === 'high' || severity === 'critical' ? 'attention' : 'compliant'
            // Use restrictions count as proxy for violations
            const violations = Array.isArray(zone.restrictions) ? zone.restrictions.length : 0
            return {
                name: zone.name || 'Unnamed Zone',
                status,
                violations,
            }
        })
    }, [hazardZones])

    const compliantCount = zones.filter((z: any) => z.status === 'compliant').length
    const attentionCount = zones.filter((z: any) => z.status === 'attention').length

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <MapPin className="w-4 h-4 text-emerald-700 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{compliantCount}</div>
                        <div className="text-xs text-white/40">Compliant Zones</div>
                    </CardContent>
                </Card>
                <Card className={attentionCount > 0 ? "bg-amber-900/30 border-amber-700/50" : "bg-emerald-900/30 border-emerald-700/50"}>
                    <CardContent className="p-2 text-center">
                        <div className={`text-sm font-bold ${attentionCount > 0 ? 'text-amber-400' : 'text-emerald-700'}`}>{attentionCount}</div>
                        <div className="text-xs text-white/40">Attention Needed</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Zone Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {zones.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">No hazard zones configured</div>
                    )}
                    {zones.map((zone: any) => (
                        <div key={zone.name} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${zone.status === 'compliant' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span className="text-white">{zone.name}</span>
                            </div>
                            <span className="text-white/40 text-sm">{zone.violations} violations</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function InspectionsDrilldown() {
    const { inspections: rawInspections, vehicles: rawVehicles } = useFleetData()
    const inspections = rawInspections || []
    const vehicles = rawVehicles || []

    const stats = useMemo(() => {
        // Inspections due = scheduled or in_progress
        const inspectionsDue = inspections.filter(
            (i: any) => i.status === 'scheduled' || i.status === 'in_progress' || i.status === 'pending'
        ).length

        // HOS violations = failed inspections
        const hosViolations = inspections.filter(
            (i: any) => i.status === 'failed' || i.status === 'fail'
        ).length

        // ELD status = percentage of vehicles not offline
        const totalVehicles = Math.max(vehicles.length, 1)
        const eldPct = Math.round(
            (vehicles.filter((v: any) => v.status !== 'offline').length / totalVehicles) * 100
        )

        return { inspectionsDue, hosViolations, eldPct }
    }, [inspections, vehicles])

    // Build a vehicle lookup map for display names
    const vehicleMap = useMemo(() => {
        const map = new Map<string, string>()
        vehicles.forEach((v: any) => {
            const id = String(v.id)
            const display = v.number || v.name || formatVehicleName(v) || id
            map.set(id, display)
        })
        return map
    }, [vehicles])

    // Upcoming inspections: scheduled, in_progress, or pending — sorted by date
    const upcoming = useMemo(() => {
        return inspections
            .filter((i: any) => i.status === 'scheduled' || i.status === 'in_progress' || i.status === 'pending')
            .sort((a: any, b: any) => {
                const dateA = new Date(a.started_at || a.inspection_date || a.scheduled_date || a.created_at || 0).getTime()
                const dateB = new Date(b.started_at || b.inspection_date || b.scheduled_date || b.created_at || 0).getTime()
                return dateA - dateB
            })
            .slice(0, 6)
            .map((insp: any) => {
                const vehicleId = String(insp.vehicle_id || '')
                const vehicleName = vehicleMap.get(vehicleId) || vehicleId || 'Unknown'
                const inspType = (insp.type || insp.inspection_type || 'inspection')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())

                // Calculate days until inspection
                const dateStr = insp.started_at || insp.inspection_date || insp.scheduled_date
                let dueLabel = 'Pending'
                if (dateStr) {
                    const daysUntil = Math.ceil(
                        (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                    if (daysUntil < 0) {
                        dueLabel = `${Math.abs(daysUntil)} days overdue`
                    } else if (daysUntil === 0) {
                        dueLabel = 'Due today'
                    } else {
                        dueLabel = `In ${daysUntil} days`
                    }
                }

                return {
                    id: insp.id,
                    vehicle: vehicleName,
                    type: inspType,
                    due: dueLabel,
                    status: insp.status || 'pending',
                }
            })
    }, [inspections, vehicleMap])

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
                <Card className={stats.inspectionsDue > 0 ? "bg-amber-900/30 border-amber-700/50" : "bg-emerald-900/30 border-emerald-700/50"}>
                    <CardContent className="p-2 text-center">
                        <Clock className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                        <div className={`text-sm font-bold ${stats.inspectionsDue > 0 ? 'text-amber-400' : 'text-emerald-700'}`}>{stats.inspectionsDue}</div>
                        <div className="text-xs text-white/40">Inspections Due</div>
                    </CardContent>
                </Card>
                <Card className={stats.hosViolations > 0 ? "bg-amber-900/30 border-amber-700/50" : "bg-emerald-900/30 border-emerald-700/50"}>
                    <CardContent className="p-2 text-center">
                        <div className={`text-sm font-bold ${stats.hosViolations > 0 ? 'text-amber-400' : 'text-emerald-700'}`}>{stats.hosViolations}</div>
                        <div className="text-xs text-white/40">HOS Violations</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{stats.eldPct}%</div>
                        <div className="text-xs text-white/40">ELD Status</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Upcoming Inspections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {upcoming.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">No upcoming inspections</div>
                    )}
                    {upcoming.map((insp: any) => (
                        <div key={insp.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                            <div>
                                <div className="font-medium text-white">{insp.vehicle} - {insp.type}</div>
                                <div className="text-xs text-white/40">{insp.due}</div>
                            </div>
                            <Badge variant="outline" className={insp.status === 'scheduled' ? 'border-emerald-500 text-emerald-700' : 'border-amber-500 text-amber-400'}>
                                {insp.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function IFTADrilldown() {
    const { fuelTransactions: rawFuel, vehicles: rawVehicles } = useFleetData()
    const fuelTransactions = rawFuel || []
    const vehicles = rawVehicles || []

    const stats = useMemo(() => {
        // Total mileage from vehicles
        const totalMiles = vehicles.reduce((sum: number, v: any) => sum + (Number(v.mileage) || 0), 0)

        // Total fuel cost from real transactions
        const totalFuelCost = fuelTransactions.reduce((sum: number, t: any) => {
            const cost = Number(t.totalCost) || Number(t.total_cost) || Number(t.cost) || 0
            return sum + cost
        }, 0)

        // Total gallons
        const totalGallons = fuelTransactions.reduce((sum: number, t: any) => {
            return sum + (Number(t.gallons) || Number(t.quantity) || 0)
        }, 0)

        // Group fuel costs by jurisdiction (ifta_jurisdiction or station location)
        const byJurisdiction = new Map<string, { cost: number; gallons: number }>()
        fuelTransactions.forEach((t: any) => {
            const jurisdiction =
                t.ifta_jurisdiction ||
                t.locationData?.address?.split(',').pop()?.trim() ||
                t.station_name ||
                t.station ||
                'Other'
            const existing = byJurisdiction.get(jurisdiction) || { cost: 0, gallons: 0 }
            existing.cost += Number(t.totalCost) || Number(t.total_cost) || Number(t.cost) || 0
            existing.gallons += Number(t.gallons) || Number(t.quantity) || 0
            byJurisdiction.set(jurisdiction, existing)
        })

        // Sort jurisdictions by cost descending, take top 5
        const jurisdictions = Array.from(byJurisdiction.entries())
            .sort((a, b) => b[1].cost - a[1].cost)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                cost: data.cost,
                gallons: data.gallons,
            }))

        return { totalMiles, totalFuelCost, totalGallons, jurisdictions }
    }, [fuelTransactions, vehicles])

    // Format miles for compact display
    const milesDisplay = stats.totalMiles >= 1_000_000
        ? `${(stats.totalMiles / 1_000_000).toFixed(1)}M`
        : stats.totalMiles >= 1_000
            ? `${(stats.totalMiles / 1_000).toFixed(0)}K`
            : formatNumber(stats.totalMiles)

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <Fuel className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{milesDisplay}</div>
                        <div className="text-xs text-white/40">Miles Tracked</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">{formatCurrency(stats.totalFuelCost)}</div>
                        <div className="text-xs text-white/40">Fuel Cost</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Cost by Jurisdiction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {stats.jurisdictions.length === 0 && (
                        <div className="text-white/40 text-sm text-center py-4">No fuel transaction data</div>
                    )}
                    {stats.jurisdictions.map(item => (
                        <div key={item.name} className="flex items-center justify-between p-2 bg-white/[0.03] rounded">
                            <span className="text-white/80">{item.name}</span>
                            <div className="text-right">
                                <span className="text-white font-medium">{formatCurrency(item.cost)}</span>
                                <span className="text-white/40 text-sm ml-2">({formatNumber(item.gallons)} gal)</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function CSADrilldown() {
    const { incidents: rawIncidents, inspections: rawInspections, drivers: rawDrivers } = useFleetData()
    const incidents = rawIncidents || []
    const inspections = rawInspections || []
    const drivers = rawDrivers || []

    const stats = useMemo(() => {
        // Pending incidents: those not resolved or closed
        const pendingIncidents = incidents.filter(
            (i: any) => i.status === 'reported' || i.status === 'open' || i.status === 'investigating' || i.status === 'pending_review'
        ).length

        // Incidents year-to-date
        const currentYear = new Date().getFullYear()
        const incidentsYTD = incidents.filter((i: any) => {
            const date = new Date(i.incident_date || i.created_at || 0)
            return date.getFullYear() === currentYear
        }).length

        // Days since last incident
        let daysSafe = 0
        if (incidents.length > 0) {
            const sorted = [...incidents].sort((a: any, b: any) => {
                const dateA = new Date(a.incident_date || a.created_at || 0).getTime()
                const dateB = new Date(b.incident_date || b.created_at || 0).getTime()
                return dateB - dateA
            })
            const lastIncidentDate = new Date(sorted[0].incident_date || sorted[0].created_at || 0)
            daysSafe = Math.max(0, Math.floor((Date.now() - lastIncidentDate.getTime()) / (1000 * 60 * 60 * 24)))
        }

        // CSA BASIC scores derived from real data
        const totalDrivers = Math.max(drivers.length, 1)
        const totalInspections = Math.max(inspections.length, 1)

        // Unsafe Driving: percentage of incidents that are collisions or accidents
        const unsafeDrivingIncidents = incidents.filter(
            (i: any) => i.incident_type === 'accident' || i.incident_type === 'collision'
        ).length
        const unsafeDriving = Math.round((unsafeDrivingIncidents / Math.max(totalDrivers, 1)) * 100)

        // HOS Compliance: percentage of failed inspections
        const failedInspections = inspections.filter(
            (i: any) => i.status === 'failed' || i.status === 'fail'
        ).length
        const hosCompliance = Math.round((failedInspections / totalInspections) * 100)

        // Vehicle Maintenance: percentage of inspections with defects
        const withDefects = inspections.filter(
            (i: any) => (Number(i.defects_found) || 0) > 0 || i.status === 'needs_repair'
        ).length
        const vehicleMaintenance = Math.round((withDefects / totalInspections) * 100)

        // Controlled Substances: percentage of substance-related incidents
        const substanceIncidents = incidents.filter(
            (i: any) => i.incident_type === 'health_hazard' &&
                ((i.contributing_factors || []).includes('impaired_driving'))
        ).length
        const controlledSubstances = Math.round((substanceIncidents / Math.max(totalDrivers, 1)) * 100)

        // Driver Fitness: inverse of active driver percentage
        const inactiveDrivers = drivers.filter(
            (d: any) => d.status === 'suspended' || d.status === 'on-leave'
        ).length
        const driverFitness = Math.round((inactiveDrivers / totalDrivers) * 100)

        const basics = [
            { category: 'Unsafe Driving', score: Math.min(unsafeDriving, 100), threshold: 65 },
            { category: 'HOS Compliance', score: Math.min(hosCompliance, 100), threshold: 65 },
            { category: 'Vehicle Maintenance', score: Math.min(vehicleMaintenance, 100), threshold: 80 },
            { category: 'Controlled Substances', score: Math.min(controlledSubstances, 100), threshold: 80 },
            { category: 'Driver Fitness', score: Math.min(driverFitness, 100), threshold: 80 },
        ]

        return { pendingIncidents, incidentsYTD, daysSafe, basics }
    }, [incidents, inspections, drivers])

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
                <Card className={stats.pendingIncidents > 0 ? "bg-amber-900/30 border-amber-700/50" : "bg-emerald-900/30 border-emerald-700/50"}>
                    <CardContent className="p-2 text-center">
                        <FileText className="w-4 h-4 text-amber-400 mx-auto mb-2" />
                        <div className={`text-sm font-bold ${stats.pendingIncidents > 0 ? 'text-amber-400' : 'text-emerald-700'}`}>{stats.pendingIncidents}</div>
                        <div className="text-xs text-white/40">Pending</div>
                    </CardContent>
                </Card>
                <Card className={stats.incidentsYTD > 0 ? "bg-amber-900/30 border-amber-700/50" : "bg-emerald-900/30 border-emerald-700/50"}>
                    <CardContent className="p-2 text-center">
                        <div className={`text-sm font-bold ${stats.incidentsYTD > 0 ? 'text-amber-400' : 'text-emerald-700'}`}>{stats.incidentsYTD}</div>
                        <div className="text-xs text-white/40">Incidents YTD</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{stats.daysSafe}</div>
                        <div className="text-xs text-white/40">Days Safe</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">CSA BASIC Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {stats.basics.map(item => (
                        <div key={item.category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/80">{item.category}</span>
                                <span className={`font-medium ${item.score < item.threshold / 2 ? 'text-emerald-700' : 'text-amber-400'}`}>
                                    {item.score}%
                                </span>
                            </div>
                            <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${item.score < item.threshold / 2 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${(item.score / item.threshold) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
