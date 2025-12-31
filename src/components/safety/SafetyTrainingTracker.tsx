/**
 * SafetyTrainingTracker - Training compliance and certification tracking
 * Supports OSHA-required training, expiration alerts, and completion tracking
 */

import { useState, useMemo } from 'react'
import {
    GraduationCap,
    Certificate,
    Calendar,
    CheckCircle,
    Warning,
    Clock,
    TrendUp,
    Download
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

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
    'Fire Extinguisher Use (29 CFR 1910.157)',
    'Bloodborne Pathogens (29 CFR 1910.1030)',
    'Respiratory Protection (29 CFR 1910.134)',
    'Confined Space Entry (29 CFR 1910.146)',
    'Powered Industrial Trucks'
]

const DEMO_TRAINING_DATA: TrainingRecord[] = [
    {
        id: '1',
        employee_id: 'EMP-001',
        employee_name: 'John Smith',
        training_type: 'Forklift Operation (29 CFR 1910.178)',
        completion_date: '2024-01-15',
        expiration_date: '2027-01-15',
        status: 'current',
        certificate_number: 'CERT-2024-001',
        instructor: 'Mike Johnson',
        score: 95
    },
    {
        id: '2',
        employee_id: 'EMP-002',
        employee_name: 'Sarah Williams',
        training_type: 'Hazard Communication (29 CFR 1910.1200)',
        completion_date: '2024-11-01',
        expiration_date: '2025-02-15',
        status: 'expiring_soon',
        certificate_number: 'CERT-2024-045',
        score: 88
    },
    {
        id: '3',
        employee_id: 'EMP-003',
        employee_name: 'Mike Davis',
        training_type: 'Lockout/Tagout (29 CFR 1910.147)',
        completion_date: '2023-06-20',
        expiration_date: '2024-11-20',
        status: 'expired',
        certificate_number: 'CERT-2023-089'
    },
    {
        id: '4',
        employee_id: 'EMP-004',
        employee_name: 'Emily Brown',
        training_type: 'Personal Protective Equipment (29 CFR 1910.132)',
        completion_date: '',
        expiration_date: '',
        status: 'pending'
    }
]

export function SafetyTrainingTracker() {
    const [selectedFilter, setSelectedFilter] = useState<string>('all')
    const [trainingData] = useState<TrainingRecord[]>(DEMO_TRAINING_DATA)

    const stats = useMemo<TrainingStats>(() => {
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
            compliance_rate: Math.round((compliant / total) * 100)
        }
    }, [trainingData])

    const filteredData = useMemo(() => {
        if (selectedFilter === 'all') return trainingData
        return trainingData.filter(record => record.status === selectedFilter)
    }, [trainingData, selectedFilter])

    const getStatusBadge = (status: TrainingRecord['status']) => {
        const variants = {
            current: { variant: 'default' as const, icon: <CheckCircle className="w-3 h-3" />, label: 'Current', color: 'bg-green-500' },
            expiring_soon: { variant: 'secondary' as const, icon: <Warning className="w-3 h-3" />, label: 'Expiring Soon', color: 'bg-yellow-500' },
            expired: { variant: 'destructive' as const, icon: <Warning className="w-3 h-3" />, label: 'Expired', color: 'bg-red-500' },
            pending: { variant: 'outline' as const, icon: <Clock className="w-3 h-3" />, label: 'Pending', color: 'bg-gray-500' }
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

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <GraduationCap className="w-6 h-6" />
                        Safety Training Compliance
                    </h2>
                    <p className="text-slate-400 mt-1">Track OSHA-required training and certifications</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">Compliance Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{stats.compliance_rate}%</span>
                            <TrendUp className="w-4 h-4 text-green-400" />
                        </div>
                        <Progress value={stats.compliance_rate} className="mt-2 h-2" />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">Compliant Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="text-3xl font-bold text-white">{stats.compliant_employees}</span>
                            <span className="text-slate-400">/ {stats.total_employees}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Warning className="w-5 h-5 text-yellow-400" />
                            <span className="text-3xl font-bold text-white">{stats.expiring_soon}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Within 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">Expired</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Warning className="w-5 h-5 text-red-400" />
                            <span className="text-3xl font-bold text-white">{stats.expired_certifications}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Requires renewal</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/10 border-slate-500/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-slate-300">Pending Training</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <span className="text-3xl font-bold text-white">{stats.pending_training}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Not started</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Table */}
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                            <Certificate className="w-5 h-5" />
                            Training Records
                        </CardTitle>
                        <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-600 text-white">
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
                            <TableRow className="border-slate-700 hover:bg-slate-800/50">
                                <TableHead className="text-slate-300">Employee</TableHead>
                                <TableHead className="text-slate-300">Training Type</TableHead>
                                <TableHead className="text-slate-300">Completion Date</TableHead>
                                <TableHead className="text-slate-300">Expiration</TableHead>
                                <TableHead className="text-slate-300">Status</TableHead>
                                <TableHead className="text-slate-300">Certificate</TableHead>
                                <TableHead className="text-slate-300">Score</TableHead>
                                <TableHead className="text-slate-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((record) => {
                                const daysUntilExpiration = getDaysUntilExpiration(record.expiration_date)

                                return (
                                    <TableRow key={record.id} className="border-slate-700 hover:bg-slate-800/30">
                                        <TableCell className="font-medium text-white">
                                            <div>
                                                <div>{record.employee_name}</div>
                                                <div className="text-xs text-slate-400">{record.employee_id}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300 max-w-xs">
                                            <div className="truncate" title={record.training_type}>
                                                {record.training_type}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {record.completion_date ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {new Date(record.completion_date).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {record.expiration_date ? (
                                                <div>
                                                    <div>{new Date(record.expiration_date).toLocaleDateString()}</div>
                                                    {daysUntilExpiration !== null && (
                                                        <div className={`text-xs ${
                                                            daysUntilExpiration < 0 ? 'text-red-400' :
                                                            daysUntilExpiration < 30 ? 'text-yellow-400' :
                                                            'text-slate-400'
                                                        }`}>
                                                            {daysUntilExpiration < 0 ?
                                                                `Expired ${Math.abs(daysUntilExpiration)} days ago` :
                                                                `${daysUntilExpiration} days remaining`
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(record.status)}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {record.certificate_number || <span className="text-slate-500">-</span>}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {record.score ? (
                                                <span className={record.score >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                                                    {record.score}%
                                                </span>
                                            ) : (
                                                <span className="text-slate-500">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                {record.status === 'pending' && (
                                                    <Button size="sm" variant="outline">Schedule</Button>
                                                )}
                                                {(record.status === 'expired' || record.status === 'expiring_soon') && (
                                                    <Button size="sm" variant="outline">Renew</Button>
                                                )}
                                                {record.certificate_number && (
                                                    <Button size="sm" variant="ghost">View Cert</Button>
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
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="text-white text-sm">OSHA Required Training Reference</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        {OSHA_REQUIRED_TRAINING.map((training, index) => (
                            <div key={index} className="text-xs text-slate-300 bg-slate-800/30 rounded px-2 py-1">
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
