/**
 * ComplianceHubDrilldowns - Drilldown components for Compliance hub
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    ShieldCheck, Warning, Clock, CheckCircle, FileText,
    MapPin, Truck, GasPump, Certificate, Scale
} from '@phosphor-icons/react'

export function RegulationsDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">98%</div>
                        <div className="text-xs text-slate-400">DOT Compliance</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">100%</div>
                        <div className="text-xs text-slate-400">IFTA Compliance</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { regulation: 'DOT Hours of Service', status: 'compliant', score: 98 },
                        { regulation: 'IFTA Fuel Tax', status: 'compliant', score: 100 },
                        { regulation: 'Vehicle Inspections', status: 'attention', score: 94 },
                        { regulation: 'Driver Qualifications', status: 'compliant', score: 97 },
                        { regulation: 'ELD Mandate', status: 'compliant', score: 100 },
                    ].map(item => (
                        <div key={item.regulation} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.regulation}</span>
                                <Badge variant="outline" className={
                                    item.status === 'compliant' ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400'
                                }>
                                    {item.score}%
                                </Badge>
                            </div>
                            <Progress value={item.score} className="h-2 bg-slate-700" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function GeofenceComplianceDrilldown() {
    const zones = [
        { name: 'Downtown Distribution', status: 'compliant', violations: 0 },
        { name: 'Airport Cargo Area', status: 'compliant', violations: 0 },
        { name: 'Highway Corridor', status: 'attention', violations: 2 },
        { name: 'Industrial Park', status: 'compliant', violations: 0 },
        { name: 'Residential Zone', status: 'compliant', violations: 0 },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <MapPin className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">10</div>
                        <div className="text-xs text-slate-400">Compliant Zones</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">2</div>
                        <div className="text-xs text-slate-400">Attention Needed</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Zone Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {zones.map(zone => (
                        <div key={zone.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${zone.status === 'compliant' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                <span className="text-white">{zone.name}</span>
                            </div>
                            <span className="text-slate-400 text-sm">{zone.violations} violations</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function InspectionsDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-amber-400">8</div>
                        <div className="text-xs text-slate-400">Inspections Due</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">0</div>
                        <div className="text-xs text-slate-400">HOS Violations</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">100%</div>
                        <div className="text-xs text-slate-400">ELD Status</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Upcoming Inspections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { vehicle: 'TRK-001', type: 'Annual DOT', due: 'In 5 days', status: 'scheduled' },
                        { vehicle: 'TRK-008', type: 'Brake Check', due: 'In 7 days', status: 'pending' },
                        { vehicle: 'TRK-015', type: 'Annual DOT', due: 'In 12 days', status: 'pending' },
                        { vehicle: 'TRK-022', type: 'Tire Inspection', due: 'In 14 days', status: 'pending' },
                    ].map(insp => (
                        <div key={insp.vehicle} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{insp.vehicle} - {insp.type}</div>
                                <div className="text-xs text-slate-400">{insp.due}</div>
                            </div>
                            <Badge variant="outline" className={insp.status === 'scheduled' ? 'border-emerald-500 text-emerald-400' : 'border-amber-500 text-amber-400'}>
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
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <GasPump className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">2.4M</div>
                        <div className="text-xs text-slate-400">Miles Tracked</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">$12,450</div>
                        <div className="text-xs text-slate-400">Fuel Tax Due</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Tax by Jurisdiction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { state: 'Texas', miles: '890K', tax: '$4,200' },
                        { state: 'California', miles: '520K', tax: '$3,100' },
                        { state: 'Arizona', miles: '380K', tax: '$2,150' },
                        { state: 'Nevada', miles: '290K', tax: '$1,800' },
                        { state: 'New Mexico', miles: '320K', tax: '$1,200' },
                    ].map(item => (
                        <div key={item.state} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <span className="text-slate-300">{item.state}</span>
                            <div className="text-right">
                                <span className="text-white font-medium">{item.tax}</span>
                                <span className="text-slate-400 text-sm ml-2">({item.miles})</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function CSADrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <FileText className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-amber-400">3</div>
                        <div className="text-xs text-slate-400">Pending</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">2</div>
                        <div className="text-xs text-slate-400">Incidents YTD</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">47</div>
                        <div className="text-xs text-slate-400">Days Safe</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">CSA BASIC Scores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { category: 'Unsafe Driving', score: 12, threshold: 65 },
                        { category: 'HOS Compliance', score: 8, threshold: 65 },
                        { category: 'Vehicle Maintenance', score: 22, threshold: 80 },
                        { category: 'Controlled Substances', score: 0, threshold: 80 },
                        { category: 'Driver Fitness', score: 5, threshold: 80 },
                    ].map(item => (
                        <div key={item.category} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.category}</span>
                                <span className={`font-medium ${item.score < item.threshold / 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {item.score}%
                                </span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
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
