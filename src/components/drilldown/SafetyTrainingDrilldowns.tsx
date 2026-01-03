/**
 * SafetyTrainingDrilldowns - Excel-style training and certification matrices
 * Complete employee training records and certification tracking with advanced filtering and export
 */

import {
  GraduationCap,
  Award,
  Calendar,
  User,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataGrid } from '@/components/common/DataGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============ TYPE DEFINITIONS ============

interface TrainingRecord {
  id: string
  employee_id: string
  employee_name: string
  course_name: string
  course_code: string
  category: 'safety' | 'compliance' | 'technical' | 'leadership' | 'operational'
  instructor_name?: string
  date_completed: string
  date_expires?: string
  score?: number
  status: 'completed' | 'in-progress' | 'scheduled' | 'expired' | 'failed'
  certification_number?: string
  hours: number
  location?: string
}

interface Certification {
  id: string
  employee_id: string
  employee_name: string
  certification_name: string
  certification_type: 'cdl' | 'forklift' | 'hazmat' | 'first-aid' | 'safety' | 'other'
  issuing_authority: string
  issue_date: string
  expiry_date: string
  certification_number: string
  status: 'active' | 'expiring-soon' | 'expired' | 'suspended'
  renewal_required: boolean
  renewal_cost?: number
  days_until_expiry?: number
}

// ============ DEMO DATA ============

const demoTrainingRecords: TrainingRecord[] = [
  {
    id: 'train-001',
    employee_id: 'emp-201',
    employee_name: 'John Smith',
    course_name: 'Defensive Driving Certification',
    course_code: 'DDC-101',
    category: 'safety',
    instructor_name: 'Robert Martinez',
    date_completed: '2025-11-15',
    date_expires: '2028-11-15',
    score: 95,
    status: 'completed',
    certification_number: 'DDC-2025-FL-1542',
    hours: 8,
    location: 'North Training Center',
  },
  {
    id: 'train-002',
    employee_id: 'emp-202',
    employee_name: 'Sarah Johnson',
    course_name: 'Hazmat Transportation Safety',
    course_code: 'HAZMAT-201',
    category: 'compliance',
    instructor_name: 'Dr. Emily Chen',
    date_completed: '2025-10-22',
    date_expires: '2026-10-22',
    score: 88,
    status: 'completed',
    certification_number: 'HAZMAT-2025-3821',
    hours: 16,
    location: 'South Training Facility',
  },
  {
    id: 'train-003',
    employee_id: 'emp-203',
    employee_name: 'Michael Davis',
    course_name: 'First Aid & CPR',
    course_code: 'FA-CPR-101',
    category: 'safety',
    instructor_name: 'Jennifer Lopez, RN',
    date_completed: '2024-06-10',
    date_expires: '2026-06-10',
    score: 100,
    status: 'completed',
    certification_number: 'CPR-2024-FL-9821',
    hours: 4,
    location: 'Medical Training Room',
  },
  {
    id: 'train-004',
    employee_id: 'emp-204',
    employee_name: 'Lisa Chen',
    course_name: 'Forklift Operation Certification',
    course_code: 'FORK-101',
    category: 'operational',
    instructor_name: 'David Wilson',
    date_completed: '2025-12-01',
    date_expires: '2028-12-01',
    score: 92,
    status: 'completed',
    certification_number: 'FORK-2025-5623',
    hours: 8,
    location: 'Warehouse Training Area',
  },
  {
    id: 'train-005',
    employee_id: 'emp-205',
    employee_name: 'Tom Wilson',
    course_name: 'DOT Hours of Service Compliance',
    course_code: 'DOT-HOS-301',
    category: 'compliance',
    instructor_name: 'Robert Martinez',
    date_completed: '2025-01-15',
    date_expires: '2026-01-15',
    score: 85,
    status: 'completed',
    certification_number: 'HOS-2025-1129',
    hours: 4,
    location: 'Online Virtual Classroom',
  },
]

const demoCertifications: Certification[] = [
  {
    id: 'cert-001',
    employee_id: 'emp-201',
    employee_name: 'John Smith',
    certification_name: 'Commercial Driver License - Class A',
    certification_type: 'cdl',
    issuing_authority: 'Florida DHSMV',
    issue_date: '2023-03-15',
    expiry_date: '2027-03-15',
    certification_number: 'FL-CDL-A-8821455',
    status: 'active',
    renewal_required: false,
    days_until_expiry: 456,
  },
  {
    id: 'cert-002',
    employee_id: 'emp-202',
    employee_name: 'Sarah Johnson',
    certification_name: 'Hazmat Endorsement',
    certification_type: 'hazmat',
    issuing_authority: 'TSA',
    issue_date: '2024-08-10',
    expiry_date: '2026-01-10',
    certification_number: 'TSA-H-2024-FL-9923',
    status: 'expiring-soon',
    renewal_required: true,
    renewal_cost: 450.00,
    days_until_expiry: 37,
  },
  {
    id: 'cert-003',
    employee_id: 'emp-203',
    employee_name: 'Michael Davis',
    certification_name: 'American Red Cross CPR/First Aid',
    certification_type: 'first-aid',
    issuing_authority: 'American Red Cross',
    issue_date: '2024-06-10',
    expiry_date: '2026-06-10',
    certification_number: 'ARC-CPR-2024-88214',
    status: 'active',
    renewal_required: false,
    days_until_expiry: 188,
  },
  {
    id: 'cert-004',
    employee_id: 'emp-204',
    employee_name: 'Lisa Chen',
    certification_name: 'OSHA Forklift Operator',
    certification_type: 'forklift',
    issuing_authority: 'OSHA Training Institute',
    issue_date: '2025-12-01',
    expiry_date: '2028-12-01',
    certification_number: 'OSHA-FORK-2025-3421',
    status: 'active',
    renewal_required: false,
    days_until_expiry: 1095,
  },
  {
    id: 'cert-005',
    employee_id: 'emp-205',
    employee_name: 'Tom Wilson',
    certification_name: 'DOT Medical Examiner Certificate',
    certification_type: 'safety',
    issuing_authority: 'DOT Certified Medical Examiner',
    issue_date: '2024-12-20',
    expiry_date: '2025-12-20',
    certification_number: 'DOT-MED-2024-FL-5521',
    status: 'expiring-soon',
    renewal_required: true,
    renewal_cost: 125.00,
    days_until_expiry: 16,
  },
]

// ============ TRAINING RECORDS MATRIX ============

export function TrainingRecordsMatrixView() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: trainingRecords } = useSWR<TrainingRecord[]>(
    '/api/training/records',
    fetcher,
    {
      fallbackData: demoTrainingRecords,
      shouldRetryOnError: false,
    }
  )

  const filteredData = useMemo(() => {
    if (!trainingRecords) return []

    return trainingRecords.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || record.category === categoryFilter
      const matchesSearch =
        !searchQuery ||
        record.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.course_code.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [trainingRecords, statusFilter, categoryFilter, searchQuery])

  const columns: ColumnDef<TrainingRecord>[] = [
    {
      accessorKey: 'employee_name',
      header: 'Employee',
      cell: ({ row }) => <div className="font-medium">{row.original.employee_name}</div>,
    },
    {
      accessorKey: 'course_name',
      header: 'Course',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.course_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.course_code}</div>
        </div>
      ),
    },
    {
      accessorKey: 'date_completed',
      header: 'Date Completed',
      cell: ({ row }) => new Date(row.original.date_completed).toLocaleDateString(),
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) =>
        row.original.score !== undefined ? (
          <div
            className={`font-bold ${
              row.original.score >= 90
                ? 'text-green-500'
                : row.original.score >= 75
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
          >
            {row.original.score}%
          </div>
        ) : (
          '-'
        ),
    },
    {
      accessorKey: 'instructor_name',
      header: 'Instructor',
      cell: ({ row }) => row.original.instructor_name || '-',
    },
    {
      accessorKey: 'certification_number',
      header: 'Certification #',
      cell: ({ row }) => row.original.certification_number || '-',
    },
    {
      accessorKey: 'date_expires',
      header: 'Expiry Date',
      cell: ({ row }) => {
        if (!row.original.date_expires) return '-'
        const expiryDate = new Date(row.original.date_expires)
        const daysUntil = Math.floor(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <div>
            <div>{expiryDate.toLocaleDateString()}</div>
            {daysUntil <= 30 && daysUntil > 0 && (
              <div className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {daysUntil} days
              </div>
            )}
            {daysUntil <= 0 && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Expired
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === 'completed'
            ? 'default'
            : status === 'expired'
            ? 'destructive'
            : 'secondary'
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'hours',
      header: 'Hours',
      cell: ({ row }) => `${row.original.hours}h`,
    },
  ]

  const handleExportToExcel = () => {
    const headers = [
      'Employee',
      'Course',
      'Course Code',
      'Date Completed',
      'Score',
      'Instructor',
      'Certification #',
      'Expiry Date',
      'Status',
      'Hours',
    ]

    const csvData = filteredData.map((record) => [
      record.employee_name,
      record.course_name,
      record.course_code,
      new Date(record.date_completed).toLocaleDateString(),
      record.score !== undefined ? `${record.score}%` : '',
      record.instructor_name || '',
      record.certification_number || '',
      record.date_expires ? new Date(record.date_expires).toLocaleDateString() : '',
      record.status,
      record.hours.toString(),
    ])

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `training-records-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary stats
  const totalRecords = filteredData.length
  const completedCount = filteredData.filter((r) => r.status === 'completed').length
  const expiringCount = filteredData.filter((r) => {
    if (!r.date_expires) return false
    const daysUntil = Math.floor(
      (new Date(r.date_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntil > 0 && daysUntil <= 30
  }).length
  const expiredCount = filteredData.filter((r) => {
    if (!r.date_expires) return false
    return new Date(r.date_expires) < new Date()
  }).length
  const avgScore =
    filteredData.filter((r) => r.score).reduce((sum, r) => sum + (r.score || 0), 0) /
      filteredData.filter((r) => r.score).length || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalRecords}</div>
            <div className="text-xs text-slate-400">Total Records</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div className="text-2xl font-bold text-amber-400">{expiringCount}</div>
            </div>
            <div className="text-xs text-slate-400">Expiring Soon</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{avgScore.toFixed(1)}%</div>
            <div className="text-xs text-slate-400">Average Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Export Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search training records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-Style Training Records Matrix */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            All Training Records - Excel View ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            data={filteredData}
            columns={columns}
            pageSize={20}
            enableInspector={true}
            inspectorType="training-record"
            compactMode={true}
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ CERTIFICATIONS MATRIX ============

export function CertificationsMatrixView() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: certifications } = useSWR<Certification[]>(
    '/api/certifications',
    fetcher,
    {
      fallbackData: demoCertifications,
      shouldRetryOnError: false,
    }
  )

  const filteredData = useMemo(() => {
    if (!certifications) return []

    return certifications.filter((cert) => {
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter
      const matchesType = typeFilter === 'all' || cert.certification_type === typeFilter
      const matchesSearch =
        !searchQuery ||
        cert.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certification_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certification_number.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesType && matchesSearch
    })
  }, [certifications, statusFilter, typeFilter, searchQuery])

  const columns: ColumnDef<Certification>[] = [
    {
      accessorKey: 'employee_name',
      header: 'Driver',
      cell: ({ row }) => <div className="font-medium">{row.original.employee_name}</div>,
    },
    {
      accessorKey: 'certification_name',
      header: 'Certification Type',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.certification_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.certification_number}</div>
        </div>
      ),
    },
    {
      accessorKey: 'issue_date',
      header: 'Issue Date',
      cell: ({ row }) => new Date(row.original.issue_date).toLocaleDateString(),
    },
    {
      accessorKey: 'expiry_date',
      header: 'Expiry Date',
      cell: ({ row }) => {
        const expiryDate = new Date(row.original.expiry_date)
        const daysUntil = Math.floor(
          (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <div>
            <div className="font-medium">{expiryDate.toLocaleDateString()}</div>
            {daysUntil <= 60 && daysUntil > 0 && (
              <div className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {daysUntil} days left
              </div>
            )}
            {daysUntil <= 0 && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Expired
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'days_until_expiry',
      header: 'Days Until Expiry',
      cell: ({ row }) => {
        const days = row.original.days_until_expiry || 0
        return (
          <div
            className={`font-bold text-center ${
              days <= 30
                ? 'text-red-500'
                : days <= 60
                ? 'text-amber-500'
                : 'text-green-500'
            }`}
          >
            {days}
          </div>
        )
      },
    },
    {
      accessorKey: 'issuing_authority',
      header: 'Issuing Authority',
      cell: ({ row }) => row.original.issuing_authority,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === 'active'
            ? 'default'
            : status === 'expiring-soon'
            ? 'secondary'
            : 'destructive'
        return (
          <div className="flex items-center gap-2">
            {status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {status === 'expiring-soon' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
            {status === 'expired' && <XCircle className="w-4 h-4 text-red-500" />}
            <Badge variant={variant} className="capitalize">
              {status.replace('-', ' ')}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'renewal_cost',
      header: 'Renewal Cost',
      cell: ({ row }) =>
        row.original.renewal_cost ? (
          <div className="text-right font-medium">${row.original.renewal_cost.toFixed(2)}</div>
        ) : (
          <div className="text-center text-muted-foreground">-</div>
        ),
    },
  ]

  const handleExportToExcel = () => {
    const headers = [
      'Driver',
      'Certification Type',
      'Issue Date',
      'Expiry Date',
      'Days Until Expiry',
      'Issuing Authority',
      'Certification Number',
      'Status',
      'Renewal Cost',
    ]

    const csvData = filteredData.map((cert) => [
      cert.employee_name,
      cert.certification_name,
      new Date(cert.issue_date).toLocaleDateString(),
      new Date(cert.expiry_date).toLocaleDateString(),
      (cert.days_until_expiry || 0).toString(),
      cert.issuing_authority,
      cert.certification_number,
      cert.status,
      cert.renewal_cost ? `$${cert.renewal_cost.toFixed(2)}` : '',
    ])

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certifications-matrix-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary stats
  const totalCerts = filteredData.length
  const activeCount = filteredData.filter((c) => c.status === 'active').length
  const expiringCount = filteredData.filter((c) => c.status === 'expiring-soon').length
  const expiredCount = filteredData.filter((c) => c.status === 'expired').length
  const renewalCost = filteredData
    .filter((c) => c.renewal_required)
    .reduce((sum, c) => sum + (c.renewal_cost || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalCerts}</div>
            <div className="text-xs text-slate-400">Total Certifications</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{activeCount}</div>
            </div>
            <div className="text-xs text-slate-400">Active</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div className="text-2xl font-bold text-amber-400">{expiringCount}</div>
            </div>
            <div className="text-xs text-slate-400">Expiring Soon</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">${renewalCost.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Renewal Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Export Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search certifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cdl">CDL</SelectItem>
                <SelectItem value="hazmat">Hazmat</SelectItem>
                <SelectItem value="first-aid">First Aid</SelectItem>
                <SelectItem value="forklift">Forklift</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-Style Certifications Matrix */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            All Driver Certifications - Excel View ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            data={filteredData}
            columns={columns}
            pageSize={20}
            enableInspector={true}
            inspectorType="certification"
            compactMode={true}
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}
