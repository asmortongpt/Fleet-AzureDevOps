/**
 * SafetyTrainingTracker - Training compliance and certification tracking
 * Supports OSHA-required training, expiration alerts, and completion tracking
 */

import { GraduationCap, Calendar, CheckCircle, AlertTriangle, Clock, TrendingUp, Download, Award as Certificate } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatDate } from '@/utils/format-helpers'

interface TrainingRecord {
    id: string
    employee_id: string
    employee_name: string
    training_type: string
    completion_date: string
    expiration_date: string
    status: 'current' | 'expiring_soon' | 'expired' | 'pending'
    certificate_number?: string
    instructor?: string
    score?: number
}

interface TrainingStats {
    total_employees: number
    compliant_employees: number
    pending_training: number
    expired_certifications: number
    expiring_soon: number
    compliance_rate: number
}

const OSHA_REQUIRED_TRAINING = [
    'Forklift Operation (29 CFR 1910.178)',
    'Hazard Communication (29 CFR 1910.1200)',
    'Lockout/Tagout (29 CFR 1910.147)',
    'Personal Protective Equipment (29 CFR 1910.132)',
    'Emergency Action Plan (29 CFR 1910.38)',
    'Flame Extinguisher Use (29 CFR 1910.157)',
    'Bloodborne Pathogens (29 CFR 1910.1030)',
    'Respiratory Protection (29 CFR 1910.134)',
    'Confined Space Entry (29 CFR 1910.146)',
    'Powered Industrial Trucks'
]

type SafetyTrainingApiRecord = {
    id: string
    driver_id: string
    employee_name: string
    training_type: string
    completion_date: string | null
    expiry_date: string | null
    certificate_number?: string | null
    instructor_name?: string | null
    score?: number | null
}

export function SafetyTrainingTracker() {
    const { push } = useDrilldown()
    const [selectedFilter, setSelectedFilter] = useState<string>('all')

    const { data: statsPayload } = useSWR<TrainingStats>('/api/safety-training/compliance-stats', apiFetcher, {
        revalidateOnFocus: false
    })

    const { data: listPayload, isLoading: isLoadingList } = useSWR<SafetyTrainingApiRecord[]>(
        '/api/safety-training?limit=500',
        apiFetcher,
        { revalidateOnFocus: false }
    )

    const trainingData = useMemo<TrainingRecord[]>(() => {
        const raw = listPayload ?? []
        const rows = Array.isArray(raw) ? raw : []
        const now = Date.now()
        const soonCutoff = now + 30 * 24 * 60 * 60 * 1000

        return rows.map((row) => {
            const completion = row.completion_date || ''
            const expiry = row.expiry_date || ''

            let status: TrainingRecord['status'] = 'pending'
            if (completion) {
                if (expiry) {
                    const expiryMs = new Date(expiry).getTime()
                    if (Number.isFinite(expiryMs) && expiryMs <= now) status = 'expired'
                    else if (Number.isFinite(expiryMs) && expiryMs <= soonCutoff) status = 'expiring_soon'
                    else status = 'current'
                } else {
                    status = 'current'
                }
            }

            return {
                id: row.id,
                employee_id: row.driver_id,
                employee_name: row.employee_name,
                training_type: row.training_type,
                completion_date: completion,
                expiration_date: expiry,
                status,
                certificate_number: row.certificate_number || undefined,
                instructor: row.instructor_name || undefined,
                score: row.score ?? undefined,
            }
        })
    }, [listPayload])

    const stats = useMemo<TrainingStats>(() => {
        if (statsPayload) return statsPayload

        const total = trainingData.length
        const compliant = trainingData.filter(t => t.status === 'current').length
        const pending = trainingData.filter(t => t.status === 'pending').length
        const expired = trainingData.filter(t => t.status === 'expired').length
        const expiring = trainingData.filter(t => t.status === 'expiring_soon').length

        return {
            total_employees: total,
            compliant_employees: compliant,
            pending_training: pending,
            expired_certifications: expired,
            expiring_soon: expiring,
            compliance_rate: total > 0 ? Math.round((compliant / total) * 100) : 0
        }
    }, [statsPayload, trainingData])

    const filteredData = useMemo(() => {
        if (selectedFilter === 'all') return trainingData
        return trainingData.filter(record => record.status === selectedFilter)
    }, [trainingData, selectedFilter])

    const getStatusBadge = (status: TrainingRecord['status']) => {
        const variants = {
            current: { variant: 'default' as const, icon: <CheckCircle className="w-3 h-3" />, label: 'Current', color: 'bg-green-500' },
            expiring_soon: { variant: 'secondary' as const, icon: <AlertTriangle className="w-3 h-3" />, label: 'Expiring Soon', color: 'bg-yellow-500' },
            expired: { variant: 'destructive' as const, icon: <AlertTriangle className="w-3 h-3" />, label: 'Expired', color: 'bg-red-500' },
            pending: { variant: 'outline' as const, icon: <Clock className="w-3 h-3" />, label: 'Pending', color: 'bg-white/30' }
        }

        const config = variants[status]

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                {config.icon}
                {config.label}
            </Badge>
        )
    }

    const getDaysUntilExpiration = (expirationDate: string) => {
        if (!expirationDate) return null
        const today = new Date()
        const expDate = new Date(expirationDate)
        const diffTime = expDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const handleExportReport = useCallback(() => {
        const toastId = toast.loading('Generating training report...')
        const header = ['Employee', 'Employee ID', 'Training Type', 'Completion Date', 'Expiration Date', 'Status', 'Certificate', 'Score']
        const rows = filteredData.map(r => [
            r.employee_name, r.employee_id, r.training_type,
            r.completion_date, r.expiration_date, r.status,
            r.certificate_number || '', r.score != null ? String(r.score) : ''
        ])
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `safety-training-report-${new Date().toISOString().slice(0, 10)}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Training report downloaded', { id: toastId })
    }, [filteredData])

    const handleScheduleTraining = useCallback((record: TrainingRecord) => {
        push({
            id: `schedule-training-${record.id}`,
            type: 'training-schedule',
            label: `Schedule: ${record.training_type}`,
            data: {
                trainingId: record.id,
                employeeId: record.employee_id,
                employeeName: record.employee_name,
                trainingType: record.training_type,
                action: 'schedule',
            },
        })
    }, [push])

    const handleRenewCertification = useCallback((record: TrainingRecord) => {
        push({
            id: `renew-cert-${record.id}`,
            type: 'training-renewal',
            label: `Renew: ${record.training_type}`,
            data: {
                trainingId: record.id,
                employeeId: record.employee_id,
                employeeName: record.employee_name,
                trainingType: record.training_type,
                expirationDate: record.expiration_date,
                certificateNumber: record.certificate_number,
                action: 'renew',
            },
        })
    }, [push])

    const handleViewCertificate = useCallback((record: TrainingRecord) => {
        push({
            id: `cert-${record.id}`,
            type: 'training-certificate',
            label: `Certificate: ${record.certificate_number}`,
            data: {
                trainingId: record.id,
                employeeId: record.employee_id,
                employeeName: record.employee_name,
                trainingType: record.training_type,
                certificateNumber: record.certificate_number,
                completionDate: record.completion_date,
                expirationDate: record.expiration_date,
                score: record.score,
                instructor: record.instructor,
            },
        })
    }, [push])

    return (
        <div className="space-y-2 p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Safety Training Compliance
                    </h2>
                    <p className="text-[var(--text-tertiary)] mt-1">Track OSHA-required training and certifications</p>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleExportReport}>
                    <Download className="w-4 h-4" />
                    Export Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Compliance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-base font-bold text-white">{stats.compliance_rate}%</span>
                            <TrendingUp className="w-4 h-4 text-green-400" />
                        </div>
                        <Progress value={stats.compliance_rate} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Compliant Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-base font-bold text-white">{stats.compliant_employees}</span>
                            <span className="text-[var(--text-tertiary)]">/ {stats.total_employees}</span>
                        </div>
                        {isLoadingList && <p className="text-xs text-[var(--text-tertiary)] mt-1">Loading…</p>}
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-yellow-400" />
                            <span className="text-base font-bold text-white">{stats.expiring_soon}</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Within 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            <span className="text-base font-bold text-white">{stats.expired_certifications}</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Requires renewal</p>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Pending Training</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                            <span className="text-base font-bold text-white">{stats.pending_training}</span>
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">Not started</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Certificate className="w-3 h-3" />
                            Training Records
                        </CardTitle>
                        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                            <SelectTrigger className="w-[180px] bg-[var(--surface-2)] border-[var(--border-subtle)] text-white">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="current">Current</SelectItem>
                                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[var(--border-subtle)] hover:bg-[var(--surface-2)]">
                                <TableHead className="text-[var(--text-primary)]">Employee</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Training Type</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Completion Date</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Expiration</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Status</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Certificate</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Score</TableHead>
                                <TableHead className="text-[var(--text-primary)]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((record) => {
                                const daysUntilExpiration = getDaysUntilExpiration(record.expiration_date)

                                return (
                                    <TableRow key={record.id} className="border-[var(--border-subtle)] hover:bg-[var(--surface-3)]/30">
                                        <TableCell className="font-medium text-white">
                                            <div>
                                                <div>{record.employee_name}</div>
                                                <div className="text-xs text-[var(--text-tertiary)]">{record.employee_id}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)] max-w-xs">
                                            <div className="truncate" title={record.training_type}>
                                                {record.training_type}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {record.completion_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                                                    {formatDate(record.completion_date)}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {record.expiration_date ? (
                                                <div>
                                                    <div>{formatDate(record.expiration_date)}</div>
                                                    {daysUntilExpiration !== null && (
                                                        <div className={`text-xs ${
                                                            daysUntilExpiration < 0 ? 'text-red-400' :
                                                            daysUntilExpiration < 30 ? 'text-yellow-400' :
                                                            'text-[var(--text-tertiary)]'
                                                        }`}>
                                                            {daysUntilExpiration < 0 ?
                                                                `Expired ${Math.abs(daysUntilExpiration)} days ago` :
                                                                `${daysUntilExpiration} days remaining`
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(record.status)}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {record.certificate_number || <span className="text-[var(--text-tertiary)]">-</span>}
                                        </TableCell>
                                        <TableCell className="text-[var(--text-primary)]">
                                            {record.score ? (
                                                <span className={record.score >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                                                    {record.score}%
                                                </span>
                                            ) : (
                                                <span className="text-[var(--text-tertiary)]">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {record.status === 'pending' && (
                                                    <Button size="sm" variant="outline" onClick={() => handleScheduleTraining(record)}>Schedule</Button>
                                                )}
                                                {(record.status === 'expired' || record.status === 'expiring_soon') && (
                                                    <Button size="sm" variant="outline" onClick={() => handleRenewCertification(record)}>Renew</Button>
                                                )}
                                                {record.certificate_number && (
                                                    <Button size="sm" variant="ghost" onClick={() => handleViewCertificate(record)}>View Cert</Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* OSHA Required Training Reference */}
            <Card className="bg-[var(--surface-2)] border-[var(--border-subtle)]">
                <CardHeader>
                    <CardTitle className="text-white text-sm">OSHA Required Training Reference</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {OSHA_REQUIRED_TRAINING.map((training) => (
                            <div key={training} className="text-xs text-[var(--text-primary)] bg-[var(--surface-3)]/30 rounded px-2 py-1">
                                {training}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SafetyTrainingTracker
