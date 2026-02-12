/**
 * OSHAComplianceDashboard - OSHA 300 Log and compliance metrics dashboard
 * Tracks recordable incidents, DART rate, TRIR, and regulatory compliance
 */

import { ShieldCheck, AlertTriangle, FileText, TrendingDown, TrendingUp, Calendar, Clipboard, Download, HeartPulse as FirstAid } from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { swrFetcher } from '@/lib/fetcher'

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
    total_hours_worked: number | null
    number_of_employees: number | null
    trir: number | null // Total Recordable Incident Rate
    dart_rate: number | null // Days Away, Restricted, or Transferred Rate
    lwdi_rate: number | null // Lost Workday Injury Rate
    near_misses: number | null
    compliance_score: number | null
}

type OSHAApiRow = Partial<OSHA300Entry> & {
    id: string
    employee_full_name?: string | null
    employee_name?: string | null
    metadata?: any
}

type OSHAListPayload = {
    data: OSHAApiRow[]
}

type UiKpisPayload = {
    data?: { personnelTotal?: number }
}

export function OSHAComplianceDashboard() {
    const { data: oshaPayload } = useSWR<OSHAListPayload>('/api/osha-compliance/300-log?limit=250', swrFetcher, {
        revalidateOnFocus: false
    })
    const { data: kpisPayload } = useSWR<UiKpisPayload>('/api/ui/kpis', swrFetcher, {
        revalidateOnFocus: false
    })

    const entries = useMemo<OSHA300Entry[]>(() => {
        const rows = oshaPayload?.data ?? []

        return rows.map((row) => {
            const meta = row.metadata || {}
            const employeeName = (row.employee_name || row.employee_full_name || 'Unknown').toString()

            return {
                id: row.id,
                case_number: (row.case_number || '').toString(),
                employee_name: employeeName,
                job_title: (row.job_title || '').toString(),
                incident_date: (row.incident_date || '').toString(),
                location: (row.location || '').toString(),
                injury_type: (row.injury_type || '').toString(),
                body_part: (row.body_part || '').toString(),
                days_away_from_work: Number(row.days_away_from_work || 0),
                days_job_transfer_restriction: Number(row.days_job_transfer_restriction || 0),
                death: Boolean(meta.fatality || meta.death || row.death),
                injury: Boolean(meta.injury || row.injury),
                skin_disorder: Boolean(meta.skin_disorder || row.skin_disorder),
                respiratory_condition: Boolean(meta.respiratory_condition || row.respiratory_condition),
                poisoning: Boolean(meta.poisoning || row.poisoning),
                hearing_loss: Boolean(meta.hearing_loss || row.hearing_loss),
                other: Boolean(meta.other || row.other),
            }
        })
    }, [oshaPayload?.data])

    const metrics = useMemo<OSHAMetrics>(() => {
        const total_employees = kpisPayload?.data?.personnelTotal ?? null

        // Total hours worked is environment-specific; leave null until backed by a labor-hours source.
        const total_hours = null as number | null

        const calcRate = (cases: number): number | null => {
            if (!total_hours || total_hours <= 0) return null
            return (cases * 200000) / total_hours
        }

        const dart_cases = entries.filter(e => e.days_away_from_work > 0 || e.days_job_transfer_restriction > 0).length
        const lwdi_cases = entries.filter(e => e.days_away_from_work > 0).length

        const trir = calcRate(entries.length)
        const dart_rate = calcRate(dart_cases)
        const lwdi_rate = calcRate(lwdi_cases)

        return {
            total_recordable_incidents: entries.length,
            total_hours_worked: total_hours,
            number_of_employees: total_employees,
            trir: trir === null ? null : Math.round(trir * 100) / 100,
            dart_rate: dart_rate === null ? null : Math.round(dart_rate * 100) / 100,
            lwdi_rate: lwdi_rate === null ? null : Math.round(lwdi_rate * 100) / 100,
            near_misses: null,
            compliance_score: null
        }
    }, [entries, kpisPayload?.data?.personnelTotal])

    const getInjuryClassification = (entry: OSHA300Entry) => {
        if (entry.death) return 'Fatality'
        if (entry.days_away_from_work > 0) return 'Days Away From Work'
        if (entry.days_job_transfer_restriction > 0) return 'Job Transfer/Restriction'
        return 'Other Recordable'
    }

    const getTRIRStatus = (trir: number | null) => {
        // Industry average for warehousing is around 4.5-5.5
        if (trir === null) return { label: '—', color: 'text-slate-700', variant: 'outline' as const }
        if (trir < 3.0) return { label: 'Excellent', color: 'text-green-400', variant: 'default' as const }
        if (trir < 5.0) return { label: 'Good', color: 'text-blue-700', variant: 'secondary' as const }
        if (trir < 7.0) return { label: 'Fair', color: 'text-yellow-400', variant: 'secondary' as const }
        return { label: 'Needs Improvement', color: 'text-red-400', variant: 'destructive' as const }
    }

    const trirStatus = getTRIRStatus(metrics.trir)

    return (
        <div className="space-y-2 p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        OSHA Compliance Dashboard
                    </h2>
                    <p className="text-slate-700 mt-1">OSHA 300 Log and regulatory compliance metrics</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Clipboard className="w-4 h-4" />
                            TRIR
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-700">
                            Total Recordable Incident Rate
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">{metrics.trir ?? '—'}</span>
                            <Badge variant={trirStatus.variant} className="text-xs">
                                {trirStatus.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-700">
                            <TrendingDown className="w-3 h-3 text-green-400" />
                            <span>YoY trend requires labor-hours source</span>
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
                        <CardDescription className="text-xs text-slate-700">
                            Days Away, Restricted, or Transferred
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">{metrics.dart_rate ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-700">
                            <TrendingDown className="w-3 h-3 text-green-400" />
                            <span>YoY trend requires labor-hours source</span>
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
                        <CardDescription className="text-xs text-slate-700">
                            Overall OSHA Compliance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">
                                {metrics.compliance_score === null ? '—' : `${metrics.compliance_score}%`}
                            </span>
                        </div>
                        <Progress value={metrics.compliance_score || 0} className="h-2 mb-2" />
                        <div className="flex items-center gap-1 text-xs text-slate-700">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span>Compliance scoring requires an audit/rubric source</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Recordable Incidents
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-700">
                            Current Year Total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">{metrics.total_recordable_incidents}</span>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1">
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
                                <FileText className="w-3 h-3" />
                                OSHA 300 Log - Year {new Date().getFullYear()}
                            </CardTitle>
                            <CardDescription className="text-slate-700 mt-1">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
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
                                <div className="text-xs text-slate-700">Annual summary for current year</div>
                            </div>
                            <Badge variant="secondary">Feb 1, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                            <div>
                                <div className="text-slate-300 font-medium">Electronic Submission</div>
                                <div className="text-xs text-slate-700">Submit to OSHA Injury Tracking Application</div>
                            </div>
                            <Badge variant="secondary">Mar 2, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                            <div>
                                <div className="text-slate-300 font-medium">Annual Safety Review</div>
                                <div className="text-xs text-slate-700">Management review of safety program</div>
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
