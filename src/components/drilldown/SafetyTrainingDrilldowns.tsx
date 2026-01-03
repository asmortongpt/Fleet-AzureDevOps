/**
 * SafetyTrainingDrilldowns - Complete training and certification tracking
 * Includes training records, certifications, expiry tracking, and instructor contact info
 */

import {
  GraduationCap,
  Award,
  Calendar,
  User,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp
} from 'lucide-react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Progress } from '@/components/ui/progress'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============ TYPE DEFINITIONS ============

interface TrainingRecord {
  id: string
  employee_id: string
  employee_name: string
  course_name: string
  course_code: string
  category: 'safety' | 'compliance' | 'technical' | 'leadership' | 'operational'
  instructor_id?: string
  instructor_name?: string
  instructor_phone?: string
  instructor_email?: string
  date_completed: string
  date_expires?: string
  score?: number
  status: 'completed' | 'in-progress' | 'scheduled' | 'expired' | 'failed'
  certification_number?: string
  hours: number
  location?: string
  notes?: string
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
  renewal_course?: string
  renewal_cost?: number
  contact_name?: string
  contact_phone?: string
  contact_email?: string
}

interface TrainingSchedule {
  id: string
  course_name: string
  course_code: string
  scheduled_date: string
  scheduled_time?: string
  instructor_name: string
  location: string
  max_capacity: number
  enrolled: number
  duration_hours: number
  category: string
  required_for?: string[]
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
    instructor_id: 'inst-001',
    instructor_name: 'Robert Martinez',
    instructor_phone: '(850) 555-0201',
    instructor_email: 'rmartinez@ctafleet.com',
    date_completed: '2025-11-15',
    date_expires: '2028-11-15',
    score: 95,
    status: 'completed',
    certification_number: 'DDC-2025-FL-1542',
    hours: 8,
    location: 'North Training Center',
    notes: 'Excellent performance, scored 95% on final exam'
  },
  {
    id: 'train-002',
    employee_id: 'emp-202',
    employee_name: 'Sarah Johnson',
    course_name: 'Hazmat Transportation Safety',
    course_code: 'HAZMAT-201',
    category: 'compliance',
    instructor_id: 'inst-002',
    instructor_name: 'Dr. Emily Chen',
    instructor_phone: '(850) 555-0202',
    instructor_email: 'echen@ctafleet.com',
    date_completed: '2025-10-22',
    date_expires: '2026-10-22',
    score: 88,
    status: 'completed',
    certification_number: 'HAZMAT-2025-3821',
    hours: 16,
    location: 'South Training Facility'
  },
  {
    id: 'train-003',
    employee_id: 'emp-203',
    employee_name: 'Michael Davis',
    course_name: 'First Aid & CPR',
    course_code: 'FA-CPR-101',
    category: 'safety',
    instructor_id: 'inst-003',
    instructor_name: 'Jennifer Lopez, RN',
    instructor_phone: '(850) 555-0203',
    instructor_email: 'jlopez@ctafleet.com',
    date_completed: '2024-06-10',
    date_expires: '2026-06-10',
    score: 100,
    status: 'completed',
    certification_number: 'CPR-2024-FL-9821',
    hours: 4,
    location: 'Medical Training Room'
  },
  {
    id: 'train-004',
    employee_id: 'emp-204',
    employee_name: 'Lisa Chen',
    course_name: 'Forklift Operation Certification',
    course_code: 'FORK-101',
    category: 'operational',
    instructor_id: 'inst-004',
    instructor_name: 'David Wilson',
    instructor_phone: '(850) 555-0204',
    instructor_email: 'dwilson@ctafleet.com',
    date_completed: '2025-12-01',
    date_expires: '2028-12-01',
    score: 92,
    status: 'completed',
    certification_number: 'FORK-2025-5623',
    hours: 8,
    location: 'Warehouse Training Area'
  },
  {
    id: 'train-005',
    employee_id: 'emp-205',
    employee_name: 'Tom Wilson',
    course_name: 'DOT Hours of Service Compliance',
    course_code: 'DOT-HOS-301',
    category: 'compliance',
    instructor_id: 'inst-001',
    instructor_name: 'Robert Martinez',
    instructor_phone: '(850) 555-0201',
    instructor_email: 'rmartinez@ctafleet.com',
    date_completed: '2025-01-15',
    date_expires: '2026-01-15',
    score: 85,
    status: 'completed',
    certification_number: 'HOS-2025-1129',
    hours: 4,
    location: 'Online Virtual Classroom'
  }
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
    contact_name: 'Florida DMV Customer Service',
    contact_phone: '(850) 617-2000',
    contact_email: 'flhsmv@flhsmv.gov'
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
    renewal_course: 'Hazmat Recertification - HAZMAT-301',
    renewal_cost: 450.00,
    contact_name: 'TSA Background Check Office',
    contact_phone: '(866) 289-9673',
    contact_email: 'hazmat@tsa.dhs.gov'
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
    contact_name: 'Red Cross Training Center',
    contact_phone: '(850) 878-6080',
    contact_email: 'training@redcross.org'
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
    contact_name: 'OSHA Training',
    contact_phone: '(800) 321-6742',
    contact_email: 'training@osha.gov'
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
    contact_name: 'Dr. Amanda Rodriguez',
    contact_phone: '(850) 555-7700',
    contact_email: 'arodriguez@dotmedical.com'
  }
]

const demoTrainingSchedule: TrainingSchedule[] = [
  {
    id: 'sched-001',
    course_name: 'Defensive Driving Refresher',
    course_code: 'DDC-102',
    scheduled_date: '2026-01-10',
    scheduled_time: '9:00 AM - 5:00 PM',
    instructor_name: 'Robert Martinez',
    location: 'North Training Center',
    max_capacity: 20,
    enrolled: 15,
    duration_hours: 8,
    category: 'safety',
    required_for: ['All Drivers']
  },
  {
    id: 'sched-002',
    course_name: 'Winter Driving Safety',
    course_code: 'WDS-101',
    scheduled_date: '2026-01-15',
    scheduled_time: '1:00 PM - 5:00 PM',
    instructor_name: 'Robert Martinez',
    location: 'Online Virtual Classroom',
    max_capacity: 50,
    enrolled: 32,
    duration_hours: 4,
    category: 'safety',
    required_for: ['Northern Routes Drivers']
  },
  {
    id: 'sched-003',
    course_name: 'Emergency Response Procedures',
    course_code: 'ERP-201',
    scheduled_date: '2026-01-20',
    scheduled_time: '8:00 AM - 12:00 PM',
    instructor_name: 'Jennifer Lopez, RN',
    location: 'South Training Facility',
    max_capacity: 25,
    enrolled: 18,
    duration_hours: 4,
    category: 'safety',
    required_for: ['Hazmat Drivers', 'Fleet Supervisors']
  }
]

// ============ TRAINING RECORDS VIEW ============

export function TrainingRecordsView({ filter }: { filter?: string }) {
  const { data: trainingRecords } = useSWR<TrainingRecord[]>(
    filter ? `/api/training/records?filter=${filter}` : '/api/training/records',
    fetcher,
    {
      fallbackData: demoTrainingRecords,
      shouldRetryOnError: false
    }
  )

  const filteredRecords = useMemo(() => {
    if (!filter || !trainingRecords) return trainingRecords || []

    switch (filter) {
      case 'completed':
        return trainingRecords.filter(r => r.status === 'completed')
      case 'in-progress':
        return trainingRecords.filter(r => r.status === 'in-progress')
      case 'scheduled':
        return trainingRecords.filter(r => r.status === 'scheduled')
      case 'expired':
        return trainingRecords.filter(r => r.status === 'expired' || (r.date_expires && new Date(r.date_expires) < new Date()))
      default:
        return trainingRecords
    }
  }, [trainingRecords, filter])

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'completed': return 'secondary'
      case 'in-progress': return 'default'
      case 'scheduled': return 'outline'
      case 'expired': return 'destructive'
      case 'failed': return 'destructive'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<TrainingRecord>[] = [
    {
      key: 'employee_name',
      header: 'Employee',
      sortable: true,
      drilldown: {
        recordType: 'driver',
        getRecordId: (record) => record.employee_id,
        getRecordLabel: (record) => record.employee_name,
      },
    },
    {
      key: 'course_name',
      header: 'Course',
      sortable: true,
      render: (record) => (
        <div>
          <div className="font-medium">{record.course_name}</div>
          <div className="text-xs text-muted-foreground">{record.course_code}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (record) => (
        <Badge variant="outline" className="capitalize">
          {record.category}
        </Badge>
      ),
    },
    {
      key: 'date_completed',
      header: 'Completed',
      sortable: true,
      render: (record) => new Date(record.date_completed).toLocaleDateString(),
    },
    {
      key: 'date_expires',
      header: 'Expires',
      sortable: true,
      render: (record) => {
        if (!record.date_expires) return '-'
        const expiryDate = new Date(record.date_expires)
        const today = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div>
            <div>{expiryDate.toLocaleDateString()}</div>
            {daysUntilExpiry < 30 && daysUntilExpiry > 0 && (
              <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                {daysUntilExpiry} days
              </div>
            )}
            {daysUntilExpiry <= 0 && (
              <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <XCircle className="w-3 h-3" />
                Expired
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (record) => (
        <Badge variant={getStatusColor(record.status)} className="capitalize">
          {record.status}
        </Badge>
      ),
    },
    {
      key: 'instructor_name',
      header: 'Instructor',
      sortable: true,
      render: (record) => record.instructor_name || '-',
    },
  ]

  // Calculate summary stats
  const totalRecords = filteredRecords.length
  const completedCount = filteredRecords.filter(r => r.status === 'completed').length
  const expiringCount = filteredRecords.filter(r => {
    if (!r.date_expires) return false
    const daysUntilExpiry = Math.floor((new Date(r.date_expires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30
  }).length
  const expiredCount = filteredRecords.filter(r => {
    if (!r.date_expires) return false
    return new Date(r.date_expires) < new Date()
  }).length
  const avgScore = filteredRecords.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / filteredRecords.filter(r => r.score).length || 0

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
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="text-2xl font-bold text-red-400">{expiredCount}</div>
            </div>
            <div className="text-xs text-slate-400">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Average Score */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <span>Average Training Score</span>
            <span className="text-2xl font-bold">{avgScore.toFixed(1)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={avgScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Training Records Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            Training Records ({filteredRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredRecords}
            columns={columns}
            recordType="training-record"
            getRecordId={(record) => record.id}
            getRecordLabel={(record) => `${record.course_name} - ${record.employee_name}`}
            getRecordData={(record) => ({ trainingId: record.id })}
            emptyMessage="No training records found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ CERTIFICATIONS VIEW ============

export function CertificationsView({ filter }: { filter?: string }) {
  const { data: certifications } = useSWR<Certification[]>(
    filter ? `/api/certifications?filter=${filter}` : '/api/certifications',
    fetcher,
    {
      fallbackData: demoCertifications,
      shouldRetryOnError: false
    }
  )

  const filteredCerts = useMemo(() => {
    if (!filter || !certifications) return certifications || []

    switch (filter) {
      case 'active':
        return certifications.filter(c => c.status === 'active')
      case 'expiring-soon':
        return certifications.filter(c => c.status === 'expiring-soon')
      case 'expired':
        return certifications.filter(c => c.status === 'expired')
      case 'renewal-required':
        return certifications.filter(c => c.renewal_required)
      default:
        return certifications
    }
  }, [certifications, filter])

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'active': return 'secondary'
      case 'expiring-soon': return 'default'
      case 'expired': return 'destructive'
      case 'suspended': return 'destructive'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<Certification>[] = [
    {
      key: 'employee_name',
      header: 'Employee',
      sortable: true,
      drilldown: {
        recordType: 'driver',
        getRecordId: (cert) => cert.employee_id,
        getRecordLabel: (cert) => cert.employee_name,
      },
    },
    {
      key: 'certification_name',
      header: 'Certification',
      sortable: true,
      render: (cert) => (
        <div>
          <div className="font-medium">{cert.certification_name}</div>
          <div className="text-xs text-muted-foreground">{cert.certification_number}</div>
        </div>
      ),
    },
    {
      key: 'certification_type',
      header: 'Type',
      sortable: true,
      render: (cert) => (
        <Badge variant="outline" className="capitalize">
          {cert.certification_type.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      key: 'expiry_date',
      header: 'Expires',
      sortable: true,
      render: (cert) => {
        const expiryDate = new Date(cert.expiry_date)
        const today = new Date()
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <div>
            <div>{expiryDate.toLocaleDateString()}</div>
            {daysUntilExpiry < 60 && daysUntilExpiry > 0 && (
              <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                {daysUntilExpiry} days
              </div>
            )}
            {daysUntilExpiry <= 0 && (
              <div className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <XCircle className="w-3 h-3" />
                Expired
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cert) => (
        <div className="flex items-center gap-2">
          {cert.status === 'active' && <CheckCircle className="w-4 h-4 text-green-500" />}
          {cert.status === 'expiring-soon' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          {cert.status === 'expired' && <XCircle className="w-4 h-4 text-red-500" />}
          <Badge variant={getStatusColor(cert.status)} className="capitalize">
            {cert.status.replace('-', ' ')}
          </Badge>
        </div>
      ),
    },
    {
      key: 'renewal_required',
      header: 'Renewal',
      render: (cert) => cert.renewal_required ? (
        <div className="text-xs">
          <div className="font-medium text-amber-500">Required</div>
          {cert.renewal_cost && <div className="text-muted-foreground">${cert.renewal_cost}</div>}
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Not required</span>
      ),
    },
  ]

  // Calculate summary stats
  const totalCerts = filteredCerts.length
  const activeCount = filteredCerts.filter(c => c.status === 'active').length
  const expiringCount = filteredCerts.filter(c => c.status === 'expiring-soon').length
  const expiredCount = filteredCerts.filter(c => c.status === 'expired').length
  const renewalCost = filteredCerts.filter(c => c.renewal_required).reduce((sum, c) => sum + (c.renewal_cost || 0), 0)

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
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="text-2xl font-bold text-red-400">{expiredCount}</div>
            </div>
            <div className="text-xs text-slate-400">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Renewal Cost */}
      {renewalCost > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center justify-between">
              <span>Estimated Renewal Cost</span>
              <span className="text-2xl font-bold text-amber-400">${renewalCost.toFixed(2)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              {filteredCerts.filter(c => c.renewal_required).length} certifications require renewal
            </p>
          </CardContent>
        </Card>
      )}

      {/* Certifications Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Certifications ({filteredCerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredCerts}
            columns={columns}
            recordType="certification"
            getRecordId={(cert) => cert.id}
            getRecordLabel={(cert) => `${cert.certification_name} - ${cert.employee_name}`}
            getRecordData={(cert) => ({ certificationId: cert.id })}
            emptyMessage="No certifications found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ TRAINING SCHEDULE VIEW ============

export function TrainingScheduleView() {
  const { data: schedule } = useSWR<TrainingSchedule[]>(
    '/api/training/schedule',
    fetcher,
    {
      fallbackData: demoTrainingSchedule,
      shouldRetryOnError: false
    }
  )

  const columns: DrilldownColumn<TrainingSchedule>[] = [
    {
      key: 'scheduled_date',
      header: 'Date',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{new Date(item.scheduled_date).toLocaleDateString()}</div>
          {item.scheduled_time && <div className="text-xs text-muted-foreground">{item.scheduled_time}</div>}
        </div>
      ),
    },
    {
      key: 'course_name',
      header: 'Course',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.course_name}</div>
          <div className="text-xs text-muted-foreground">{item.course_code}</div>
        </div>
      ),
    },
    {
      key: 'instructor_name',
      header: 'Instructor',
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
    },
    {
      key: 'enrolled',
      header: 'Enrollment',
      render: (item) => (
        <div className="text-center">
          <div className="font-medium">{item.enrolled} / {item.max_capacity}</div>
          <Progress value={(item.enrolled / item.max_capacity) * 100} className="h-2 mt-1" />
        </div>
      ),
    },
    {
      key: 'duration_hours',
      header: 'Duration',
      render: (item) => `${item.duration_hours} hours`,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50">
        <CardContent className="p-6 text-center">
          <Award className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <div className="text-4xl font-bold text-white">{schedule?.length || 0}</div>
          <div className="text-sm text-slate-400">Upcoming Training Sessions</div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Training Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={schedule || []}
            columns={columns}
            recordType="training-schedule"
            getRecordId={(item) => item.id}
            getRecordLabel={(item) => item.course_name}
            getRecordData={(item) => ({ scheduleId: item.id })}
            emptyMessage="No upcoming training sessions"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}
