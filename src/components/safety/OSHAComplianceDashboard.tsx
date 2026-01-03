/**
 * OSHAComplianceDashboard - OSHA 300 Log and compliance metrics dashboard
 * Tracks recordable incidents, DART rate, TRIR, and regulatory compliance
 */

import { useState, useMemo } from 'react'
import {
    ShieldCheck,
    Warning,
    FirstAid,
    FileText,
    TrendDown,
    TrendUp,
    Calendar,
    ClipboardText,
    Download
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface OSHA300Entry {
    id: string
    case_number: string
    employee_name: string
    job_title: string
    incident_date: string
    location: string
    injury_type: string
    body_part: string
    days_away_from_work: number
    days_job_transfer_restriction: number
    death: boolean
    injury: boolean
    skin_disorder: boolean
    respiratory_condition: boolean
    poisoning: boolean
    hearing_loss: boolean
    other: boolean
}

interface OSHAMetrics {
    total_recordable_incidents: number
    total_hours_worked: number
    number_of_employees: number
    trir: number // Total Recordable Incident Rate
    dart_rate: number // Days Away, Restricted, or Transferred Rate
    lwdi_rate: number // Lost Workday Injury Rate
    near_misses: number
    compliance_score: number
}

const DEMO_OSHA_300_ENTRIES: OSHA300Entry[] = [
    {
        id: '1',
        case_number: '2024-001',
        employee_name: 'John Doe',
        job_title: 'Forklift Operator',
        incident_date: '2024-03-15',
        location: 'Warehouse A',
        injury_type: 'Laceration',
        body_part: 'Left Hand',
        days_away_from_work: 3,
        days_job_transfer_restriction: 5,
        death: false,
        injury: true,
        skin_disorder: false,
        respiratory_condition: false,
        poisoning: false,
        hearing_loss: false,
        other: false
    },
    {
        id: '2',
        case_number: '2024-002',
        employee_name: 'Jane Smith',
        job_title: 'Warehouse Associate',
        incident_date: '2024-06-22',
        location: 'Loading Dock',
        injury_type: 'Strain/Sprain',
        body_part: 'Lower Back',
        days_away_from_work: 0,
        days_job_transfer_restriction: 10,
        death: false,
        injury: true,
        skin_disorder: false,
        respiratory_condition: false,
        poisoning: false,
        hearing_loss: false,
        other: false
    },
    {
        id: '3',
        case_number: '2024-003',
        employee_name: 'Mike Johnson',
        job_title: 'Mechanic',
        incident_date: '2024-09-08',
        location: 'Maintenance Shop',
        injury_type: 'Chemical Burn',
        body_part: 'Right Arm',
        days_away_from_work: 5,
        days_job_transfer_restriction: 0,
        death: false,
        injury: false,
        skin_disorder: true,
        respiratory_condition: false,
        poisoning: false,
        hearing_loss: false,
        other: false
    }
]

export function OSHAComplianceDashboard() {
    const [entries] = useState<OSHA300Entry[]>(DEMO_OSHA_300_ENTRIES)

    const metrics = useMemo<OSHAMetrics>(() => {
        const total_hours = 150 * 2080 // 150 employees * 2080 hours/year
        const total_employees = 150

        // TRIR = (Number of recordable cases × 200,000) / Total hours worked
        const trir = (entries.length * 200000) / total_hours

        // DART Rate = (Number of DART cases × 200,000) / Total hours worked
        const dart_cases = entries.filter(e => e.days_away_from_work > 0 || e.days_job_transfer_restriction > 0).length
        const dart_rate = (dart_cases * 200000) / total_hours

        // LWDI Rate = (Number of lost workday cases × 200,000) / Total hours worked
        const lwdi_cases = entries.filter(e => e.days_away_from_work > 0).length
        const lwdi_rate = (lwdi_cases * 200000) / total_hours

        return {
            total_recordable_incidents: entries.length,
            total_hours_worked: total_hours,
            number_of_employees: total_employees,
            trir: Math.round(trir * 100) / 100,
            dart_rate: Math.round(dart_rate * 100) / 100,
            lwdi_rate: Math.round(lwdi_rate * 100) / 100,
            near_misses: 8,
            compliance_score: 94
        }
    }, [entries])

    const getInjuryClassification = (entry: OSHA300Entry) => {
        if (entry.death) return 'Fatality'
        if (entry.days_away_from_work > 0) return 'Days Away From Work'
        if (entry.days_job_transfer_restriction > 0) return 'Job Transfer/Restriction'
        return 'Other Recordable'
    }

    const getTRIRStatus = (trir: number) => {
        // Industry average for warehousing is around 4.5-5.5
        if (trir < 3.0) return { label: 'Excellent', color: 'text-green-400', variant: 'default' as const }
        if (trir < 5.0) return { label: 'Good', color: 'text-blue-400', variant: 'secondary' as const }
        if (trir < 7.0) return { label: 'Fair', color: 'text-yellow-400', variant: 'secondary' as const }
        return { label: 'Needs Improvement', color: 'text-red-400', variant: 'destructive' as const }
    }

    const trirStatus = getTRIRStatus(metrics.trir)

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6" />
                        OSHA Compliance Dashboard
                    </h2>
                    <p className="text-slate-400 mt-1">OSHA 300 Log and regulatory compliance metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        OSHA 300 Log
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        OSHA 300A Summary
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <ClipboardText className="w-4 h-4" />
                            TRIR
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                            Total Recordable Incident Rate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{metrics.trir}</span>
                            <Badge variant={trirStatus.variant} className="text-xs">
                                {trirStatus.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <TrendDown className="w-3 h-3 text-green-400" />
                            <span>12% improvement YoY</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Industry avg: 4.5-5.5
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FirstAid className="w-4 h-4" />
                            DART Rate
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                            Days Away, Restricted, or Transferred
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{metrics.dart_rate}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <TrendDown className="w-3 h-3 text-green-400" />
                            <span>8% improvement YoY</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Target: &lt; 2.5
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Compliance Score
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                            Overall OSHA Compliance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{metrics.compliance_score}%</span>
                        </div>
                        <Progress value={metrics.compliance_score} className="h-2 mb-2" />
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <TrendUp className="w-3 h-3 text-green-400" />
                            <span>+3% this quarter</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Warning className="w-4 h-4" />
                            Recordable Incidents
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400">
                            Current Year Total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-3xl font-bold text-white">{metrics.total_recordable_incidents}</span>
                        </div>
                        <div className="text-xs text-slate-400 space-y-1">
                            <div>Lost Time: {entries.filter(e => e.days_away_from_work > 0).length}</div>
                            <div>Restricted: {entries.filter(e => e.days_job_transfer_restriction > 0).length}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OSHA 300 Log Table */}
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                OSHA 300 Log - Year {new Date().getFullYear()}
                            </CardTitle>
                            <CardDescription className="text-slate-400 mt-1">
                                Log of work-related injuries and illnesses (29 CFR 1904)
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-2">
                            <Calendar className="w-3 h-3" />
                            {entries.length} Entries
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                    <TableHead className="text-slate-300">Case #</TableHead>
                                    <TableHead className="text-slate-300">Employee</TableHead>
                                    <TableHead className="text-slate-300">Job Title</TableHead>
                                    <TableHead className="text-slate-300">Date</TableHead>
                                    <TableHead className="text-slate-300">Location</TableHead>
                                    <TableHead className="text-slate-300">Injury/Illness</TableHead>
                                    <TableHead className="text-slate-300">Body Part</TableHead>
                                    <TableHead className="text-slate-300">Classification</TableHead>
                                    <TableHead className="text-slate-300 text-center">Days Away</TableHead>
                                    <TableHead className="text-slate-300 text-center">Days Restricted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry) => (
                                    <TableRow key={entry.id} className="border-slate-700 hover:bg-slate-800/30">
                                        <TableCell className="font-medium text-white">
                                            {entry.case_number}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {entry.employee_name}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {entry.job_title}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {new Date(entry.incident_date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {entry.location}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {entry.injury_type}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {entry.body_part}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {getInjuryClassification(entry)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-slate-300">
                                            {entry.days_away_from_work || '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-slate-300">
                                            {entry.days_job_transfer_restriction || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Requirements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                    <CardHeader>
                        <CardTitle className="text-white text-sm">OSHA Recordkeeping Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-300">
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-green-400" />
                            <span>Maintain OSHA 300 Log for 5 years</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-green-400" />
                            <span>Post OSHA 300A Summary (Feb 1 - Apr 30)</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-green-400" />
                            <span>Report fatalities within 8 hours</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-green-400" />
                            <span>Report in-patient hospitalizations within 24 hours</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <ShieldCheck className="w-4 h-4 mt-0.5 text-green-400" />
                            <span>Electronic submission if 250+ employees</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                    <CardHeader>
                        <CardTitle className="text-white text-sm">Upcoming Deadlines</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                            <div>
                                <div className="text-slate-300 font-medium">OSHA 300A Summary Posting</div>
                                <div className="text-xs text-slate-400">Annual summary for current year</div>
                            </div>
                            <Badge variant="secondary">Feb 1, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                            <div>
                                <div className="text-slate-300 font-medium">Electronic Submission</div>
                                <div className="text-xs text-slate-400">Submit to OSHA Injury Tracking Application</div>
                            </div>
                            <Badge variant="secondary">Mar 2, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                            <div>
                                <div className="text-slate-300 font-medium">Annual Safety Review</div>
                                <div className="text-xs text-slate-400">Management review of safety program</div>
                            </div>
                            <Badge variant="secondary">Jan 15, 2025</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default OSHAComplianceDashboard
