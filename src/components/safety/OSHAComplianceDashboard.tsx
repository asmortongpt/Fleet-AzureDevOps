/**
 * OSHAComplianceDashboard - OSHA 300 Log and compliance metrics dashboard
 * Tracks recordable incidents, DART rate, TRIR, and regulatory compliance
 */

import { ShieldCheck, AlertTriangle, FileText, TrendingDown, TrendingUp, Calendar, Clipboard, Download, HeartPulse as FirstAid } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
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
import { apiFetcher } from '@/lib/api-fetcher'
import { formatDate } from '@/utils/format-helpers'

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

export function OSHAComplianceDashboard() {
    const { data: oshaPayload } = useSWR<OSHAApiRow[]>('/api/osha-compliance/300-log?limit=250', apiFetcher, {
        revalidateOnFocus: false
    })
    const { data: driversPayload } = useSWR<any[]>('/api/drivers?limit=500', apiFetcher, {
        revalidateOnFocus: false
    })

    const entries = useMemo<OSHA300Entry[]>(() => {
        const raw = oshaPayload ?? []
        const rows = Array.isArray(raw) ? raw : []

        return rows.map((row) => {
            const meta = row.metadata || {}
            const employeeName = (row.employee_name || row.employee_full_name || '—').toString()

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
    }, [oshaPayload])

    const metrics = useMemo<OSHAMetrics>(() => {
        // Use drivers count as personnel total (drivers are the primary workforce)
        const driversArr = Array.isArray(driversPayload) ? driversPayload : []
        const total_employees = driversArr.length > 0 ? driversArr.length : null

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
    }, [entries, driversPayload])

    const getInjuryClassification = (entry: OSHA300Entry) => {
        if (entry.death) return 'Fatality'
        if (entry.days_away_from_work > 0) return 'Days Away From Work'
        if (entry.days_job_transfer_restriction > 0) return 'Job Transfer/Restriction'
        return 'Other Recordable'
    }

    const getTRIRStatus = (trir: number | null) => {
        // Industry average for warehousing is around 4.5-5.5
        if (trir === null) return { label: '—', color: 'text-[var(--text-tertiary)]', variant: 'outline' as const }
        if (trir < 3.0) return { label: 'Excellent', color: 'text-green-400', variant: 'default' as const }
        if (trir < 5.0) return { label: 'Good', color: 'text-emerald-400', variant: 'secondary' as const }
        if (trir < 7.0) return { label: 'Fair', color: 'text-yellow-400', variant: 'secondary' as const }
        return { label: 'Needs Improvement', color: 'text-red-400', variant: 'destructive' as const }
    }

    const trirStatus = getTRIRStatus(metrics.trir)

    const handleDownloadOSHA300 = useCallback(() => {
        const toastId = toast.loading('Generating OSHA 300 Log...')
        const header = ['Case #', 'Employee', 'Job Title', 'Date', 'Location', 'Injury Type', 'Body Part', 'Classification', 'Days Away', 'Days Restricted']
        const rows = entries.map(e => [
            e.case_number, e.employee_name, e.job_title, e.incident_date,
            e.location, e.injury_type, e.body_part, getInjuryClassification(e),
            e.days_away_from_work, e.days_job_transfer_restriction
        ])
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `osha-300-log-${new Date().getFullYear()}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('OSHA 300 Log downloaded', { id: toastId })
    }, [entries])

    const handleDownloadOSHA300A = useCallback(() => {
        const toastId = toast.loading('Generating OSHA 300A Summary...')
        const year = new Date().getFullYear()
        const totalDeaths = entries.filter(e => e.death).length
        const totalDaysAway = entries.reduce((sum, e) => sum + e.days_away_from_work, 0)
        const totalDaysRestricted = entries.reduce((sum, e) => sum + e.days_job_transfer_restriction, 0)
        const totalInjuries = entries.filter(e => e.injury).length
        const totalSkin = entries.filter(e => e.skin_disorder).length
        const totalResp = entries.filter(e => e.respiratory_condition).length
        const totalPoisoning = entries.filter(e => e.poisoning).length
        const totalHearing = entries.filter(e => e.hearing_loss).length
        const totalOther = entries.filter(e => e.other).length

        const header = ['Metric', 'Value']
        const rows = [
            ['Year', String(year)],
            ['Total Recordable Cases', String(entries.length)],
            ['Deaths', String(totalDeaths)],
            ['Total Days Away From Work', String(totalDaysAway)],
            ['Total Days Job Transfer/Restriction', String(totalDaysRestricted)],
            ['Injuries', String(totalInjuries)],
            ['Skin Disorders', String(totalSkin)],
            ['Respiratory Conditions', String(totalResp)],
            ['Poisoning', String(totalPoisoning)],
            ['Hearing Loss', String(totalHearing)],
            ['Other', String(totalOther)],
            ['Number of Employees', String(metrics.number_of_employees ?? 'N/A')],
            ['Total Hours Worked', String(metrics.total_hours_worked ?? 'N/A')],
        ]
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `osha-300a-summary-${year}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('OSHA 300A Summary downloaded', { id: toastId })
    }, [entries, metrics])

    return (
        <div className="space-y-2 p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        OSHA Compliance Dashboard
                    </h2>
                    <p className="text-[var(--text-tertiary)] mt-1">OSHA 300 Log and regulatory compliance metrics</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleDownloadOSHA300}>
                        <Download className="w-4 h-4" />
                        OSHA 300 Log
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleDownloadOSHA300A}>
                        <Download className="w-4 h-4" />
                        OSHA 300A Summary
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <Clipboard className="w-4 h-4" />
                            TRIR
                        </CardTitle>
                        <CardDescription className="text-xs text-[var(--text-tertiary)]">
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
                        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <TrendingDown className="w-3 h-3 text-green-400" />
                            <span>YoY trend requires labor-hours source</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            Industry avg: 4.5-5.5
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <FirstAid className="w-4 h-4" />
                            DART Rate
                        </CardTitle>
                        <CardDescription className="text-xs text-[var(--text-tertiary)]">
                            Days Away, Restricted, or Transferred
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">{metrics.dart_rate ?? '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <TrendingDown className="w-3 h-3 text-green-400" />
                            <span>YoY trend requires labor-hours source</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2">
                            Target: &lt; 2.5
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            Compliance Score
                        </CardTitle>
                        <CardDescription className="text-xs text-[var(--text-tertiary)]">
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
                        <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span>Compliance scoring requires an audit/rubric source</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Recordable Incidents
                        </CardTitle>
                        <CardDescription className="text-xs text-[var(--text-tertiary)]">
                            Current Year Total
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-base font-bold text-white">{metrics.total_recordable_incidents}</span>
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] space-y-1">
                            <div>Lost Time: {entries.filter(e => e.days_away_from_work > 0).length}</div>
                            <div>Restricted: {entries.filter(e => e.days_job_transfer_restriction > 0).length}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OSHA 300 Log Table */}
            <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="w-3 h-3" />
                                OSHA 300 Log - Year {new Date().getFullYear()}
                            </CardTitle>
                            <CardDescription className="text-[var(--text-tertiary)] mt-1">
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
                                <TableRow className="border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">
                                    <TableHead className="text-[var(--text-primary)]">Case #</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Employee</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Job Title</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Date</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Location</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Injury/Illness</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Body Part</TableHead>
                                    <TableHead className="text-[var(--text-primary)]">Classification</TableHead>
                                    <TableHead className="text-[var(--text-primary)] text-center">Days Away</TableHead>
                                    <TableHead className="text-[var(--text-primary)] text-center">Days Restricted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries.map((entry) => (
                                    <TableRow key={entry.id} className="border-[var(--border-subtle)] hover:bg-[var(--surface-3)]/30">
                                        <TableCell className="font-medium text-white">
                                            {entry.case_number}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {entry.employee_name}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {entry.job_title}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {formatDate(entry.incident_date)}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {entry.location}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {entry.injury_type}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {entry.body_part}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {getInjuryClassification(entry)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-[var(--text-primary)]">
                                            {entry.days_away_from_work || '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-[var(--text-primary)]">
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
                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader>
                        <CardTitle className="text-white text-sm">OSHA Recordkeeping Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-[var(--text-primary)]">
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

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader>
                        <CardTitle className="text-white text-sm">Upcoming Deadlines</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[var(--surface-3)]/30 rounded">
                            <div>
                                <div className="text-[var(--text-primary)] font-medium">OSHA 300A Summary Posting</div>
                                <div className="text-xs text-[var(--text-tertiary)]">Annual summary for current year</div>
                            </div>
                            <Badge variant="secondary">Feb 1, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--surface-3)]/30 rounded">
                            <div>
                                <div className="text-[var(--text-primary)] font-medium">Electronic Submission</div>
                                <div className="text-xs text-[var(--text-tertiary)]">Submit to OSHA Injury Tracking Application</div>
                            </div>
                            <Badge variant="secondary">Mar 2, 2025</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--surface-3)]/30 rounded">
                            <div>
                                <div className="text-[var(--text-primary)] font-medium">Annual Safety Review</div>
                                <div className="text-xs text-[var(--text-tertiary)]">Management review of safety program</div>
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
