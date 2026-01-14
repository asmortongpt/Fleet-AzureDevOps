/**
 * SafetyComplianceDrilldowns - Excel-style compliance violation and incident matrices
 * Complete regulatory compliance tracking with advanced filtering and export capabilities
 */

import { ColumnDef } from '@tanstack/react-table'
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  Scale,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { DataGrid } from '@/components/common/DataGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============ TYPE DEFINITIONS ============

interface ComplianceViolation {
  id: string
  violation_number: string
  date: string
  type: 'dot' | 'osha' | 'epa' | 'fmcsa' | 'state' | 'local'
  severity: 'critical' | 'major' | 'minor'
  category: string
  description: string
  vehicle_id?: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  citation_number?: string
  fine_amount?: number
  paid: boolean
  due_date?: string
  status: 'open' | 'under-review' | 'remediation-in-progress' | 'resolved' | 'appealed'
  responsible_person?: string
  regulation_reference: string
}

interface SafetyIncident {
  id: string
  incident_number: string
  date: string
  time: string
  location: string
  type: 'accident' | 'injury' | 'near-miss' | 'property-damage' | 'environmental'
  severity: 'critical' | 'major' | 'minor'
  injured: number
  vehicle_id?: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  description: string
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  cost: number
  root_cause?: string
}

// ============ DEMO DATA ============

const demoViolations: ComplianceViolation[] = [
  {
    id: 'viol-001',
    violation_number: 'DOT-2025-FL-00124',
    date: '2025-11-20',
    type: 'dot',
    severity: 'major',
    category: 'Hours of Service',
    description: 'Driver exceeded 11-hour driving limit by 2.5 hours on 2025-11-15',
    regulation_reference: '49 CFR 395.3(a)(1)',
    vehicle_id: 'veh-demo-1001',
    vehicle_name: 'Ford F-150 #1001',
    driver_id: 'drv-001',
    driver_name: 'John Smith',
    citation_number: 'FHP-2025-118821',
    fine_amount: 1250.00,
    paid: false,
    due_date: '2026-01-20',
    status: 'remediation-in-progress',
    responsible_person: 'Robert Chen',
  },
  {
    id: 'viol-002',
    violation_number: 'OSHA-2025-FL-00056',
    date: '2025-12-01',
    type: 'osha',
    severity: 'critical',
    category: 'Fall Protection',
    description: 'Worker observed on elevated platform without proper fall protection equipment',
    regulation_reference: '29 CFR 1926.501',
    fine_amount: 14502.00,
    paid: false,
    due_date: '2026-01-15',
    status: 'under-review',
    responsible_person: 'Amanda Rodriguez',
  },
  {
    id: 'viol-003',
    violation_number: 'FMCSA-2025-FL-00392',
    date: '2025-11-25',
    type: 'fmcsa',
    severity: 'major',
    category: 'Vehicle Maintenance',
    description: 'Commercial vehicle operated with defective brakes (less than 50% effectiveness)',
    regulation_reference: '49 CFR 396.3(a)(1)',
    vehicle_id: 'veh-demo-1002',
    vehicle_name: 'Chevrolet Silverado #1002',
    driver_id: 'drv-002',
    driver_name: 'Sarah Johnson',
    citation_number: 'FMCSA-CV-2025-3821',
    fine_amount: 2500.00,
    paid: true,
    status: 'resolved',
    responsible_person: 'Robert Chen',
  },
  {
    id: 'viol-004',
    violation_number: 'EPA-2025-FL-00018',
    date: '2025-11-30',
    type: 'epa',
    severity: 'minor',
    category: 'Hazardous Waste Storage',
    description: 'Improper labeling of hazardous waste containers in storage area',
    regulation_reference: '40 CFR 262.34',
    fine_amount: 500.00,
    paid: false,
    due_date: '2026-01-30',
    status: 'remediation-in-progress',
    responsible_person: 'Dr. Jennifer Liu',
  },
  {
    id: 'viol-005',
    violation_number: 'STATE-2025-FL-00821',
    date: '2025-12-05',
    type: 'state',
    severity: 'minor',
    category: 'Weight Limits',
    description: 'Vehicle exceeded gross vehicle weight rating by 450 pounds',
    regulation_reference: 'Florida Statute 316.545',
    vehicle_id: 'veh-demo-1015',
    vehicle_name: 'Mercedes Sprinter #1015',
    driver_id: 'drv-015',
    driver_name: 'Tom Wilson',
    citation_number: 'FDOT-WT-2025-5521',
    fine_amount: 250.00,
    paid: true,
    status: 'resolved',
    responsible_person: 'Robert Chen',
  },
]

const demoIncidents: SafetyIncident[] = [
  {
    id: 'inc-001',
    incident_number: 'INC-2025-001',
    date: '2025-12-10',
    time: '14:30',
    location: 'I-10 West, Mile Marker 112',
    type: 'accident',
    severity: 'major',
    injured: 1,
    vehicle_id: 'veh-demo-1003',
    vehicle_name: 'Ram 1500 #1003',
    driver_id: 'drv-003',
    driver_name: 'Michael Davis',
    description: 'Rear-end collision at traffic light. Driver sustained minor injuries.',
    status: 'investigating',
    cost: 8500.00,
    root_cause: 'Following too closely in wet conditions',
  },
  {
    id: 'inc-002',
    incident_number: 'INC-2025-002',
    date: '2025-12-08',
    time: '09:15',
    location: 'North Service Center - Garage Bay 3',
    type: 'injury',
    severity: 'minor',
    injured: 1,
    description: 'Technician cut hand while removing sharp metal panel',
    status: 'resolved',
    cost: 450.00,
    root_cause: 'Improper PPE - gloves not worn',
  },
  {
    id: 'inc-003',
    incident_number: 'INC-2025-003',
    date: '2025-12-05',
    time: '11:45',
    location: 'US-27 North, Parking Area',
    type: 'near-miss',
    severity: 'critical',
    injured: 0,
    vehicle_id: 'veh-demo-1008',
    vehicle_name: 'Ford Transit #1008',
    driver_id: 'drv-008',
    driver_name: 'Lisa Chen',
    description: 'Vehicle brake failure narrowly avoided collision with pedestrian',
    status: 'investigating',
    cost: 0,
    root_cause: 'Missed preventive maintenance - brake inspection overdue',
  },
  {
    id: 'inc-004',
    incident_number: 'INC-2025-004',
    date: '2025-11-28',
    time: '16:20',
    location: 'South Facility - Loading Dock',
    type: 'property-damage',
    severity: 'minor',
    injured: 0,
    vehicle_id: 'veh-demo-1015',
    vehicle_name: 'Mercedes Sprinter #1015',
    driver_id: 'drv-015',
    driver_name: 'Tom Wilson',
    description: 'Vehicle backed into loading dock post, minor damage to rear bumper',
    status: 'resolved',
    cost: 1200.00,
    root_cause: 'Inadequate spotter assistance during backing maneuver',
  },
  {
    id: 'inc-005',
    incident_number: 'INC-2025-005',
    date: '2025-11-22',
    time: '07:30',
    location: 'East Facility - Fuel Area',
    type: 'environmental',
    severity: 'major',
    injured: 0,
    description: 'Diesel fuel spill during refueling - approximately 15 gallons',
    status: 'closed',
    cost: 3200.00,
    root_cause: 'Faulty fuel nozzle automatic shutoff',
  },
]

// ============ VIOLATIONS MATRIX ============

export function ViolationsMatrixView() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [paidFilter, setPaidFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: violations } = useSWR<ComplianceViolation[]>(
    '/api/compliance/violations',
    fetcher,
    {
      fallbackData: demoViolations,
      shouldRetryOnError: false,
    }
  )

  const filteredData = useMemo(() => {
    if (!violations) return []

    return violations.filter((violation) => {
      const matchesStatus = statusFilter === 'all' || violation.status === statusFilter
      const matchesSeverity = severityFilter === 'all' || violation.severity === severityFilter
      const matchesPaid =
        paidFilter === 'all' ||
        (paidFilter === 'paid' && violation.paid) ||
        (paidFilter === 'unpaid' && !violation.paid)
      const matchesSearch =
        !searchQuery ||
        violation.violation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        violation.type.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesSeverity && matchesPaid && matchesSearch
    })
  }, [violations, statusFilter, severityFilter, paidFilter, searchQuery])

  const columns: ColumnDef<ComplianceViolation>[] = [
    {
      accessorKey: 'violation_number',
      header: 'Violation #',
      cell: ({ row }) => <div className="font-medium">{row.original.violation_number}</div>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.date).toLocaleDateString(),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="uppercase">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.original.severity
        const variant =
          severity === 'critical' ? 'destructive' : severity === 'major' ? 'default' : 'secondary'
        return (
          <Badge variant={variant} className="capitalize">
            {severity}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => row.original.category,
    },
    {
      accessorKey: 'vehicle_name',
      header: 'Vehicle/Driver',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.original.vehicle_name || '-'}</div>
          {row.original.driver_name && (
            <div className="text-xs text-muted-foreground">{row.original.driver_name}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'citation_number',
      header: 'Citation #',
      cell: ({ row }) => row.original.citation_number || '-',
    },
    {
      accessorKey: 'fine_amount',
      header: 'Fine Amount',
      cell: ({ row }) =>
        row.original.fine_amount ? (
          <div className="text-right font-medium">${row.original.fine_amount.toFixed(2)}</div>
        ) : (
          '-'
        ),
    },
    {
      accessorKey: 'paid',
      header: 'Paid',
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          {row.original.paid ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500">Yes</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">No</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'due_date',
      header: 'Due Date',
      cell: ({ row }) => {
        if (!row.original.due_date) return '-'
        const dueDate = new Date(row.original.due_date)
        const isOverdue = dueDate < new Date() && !row.original.paid

        return (
          <div>
            <div>{dueDate.toLocaleDateString()}</div>
            {isOverdue && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Overdue
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
          status === 'resolved'
            ? 'default'
            : status === 'open'
            ? 'destructive'
            : 'secondary'
        return (
          <Badge variant={variant} className="capitalize">
            {status.replace('-', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'responsible_person',
      header: 'Responsible Person',
      cell: ({ row }) => row.original.responsible_person || '-',
    },
  ]

  const handleExportToExcel = () => {
    const headers = [
      'Violation #',
      'Date',
      'Type',
      'Severity',
      'Category',
      'Vehicle',
      'Driver',
      'Citation #',
      'Fine Amount',
      'Paid',
      'Due Date',
      'Status',
      'Responsible Person',
    ]

    const csvData = filteredData.map((violation) => [
      violation.violation_number,
      new Date(violation.date).toLocaleDateString(),
      violation.type,
      violation.severity,
      violation.category,
      violation.vehicle_name || '',
      violation.driver_name || '',
      violation.citation_number || '',
      violation.fine_amount ? `$${violation.fine_amount.toFixed(2)}` : '',
      violation.paid ? 'Yes' : 'No',
      violation.due_date ? new Date(violation.due_date).toLocaleDateString() : '',
      violation.status,
      violation.responsible_person || '',
    ])

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `compliance-violations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary stats
  const totalViolations = filteredData.length
  const openCount = filteredData.filter(
    (v) => v.status === 'open' || v.status === 'under-review' || v.status === 'remediation-in-progress'
  ).length
  const criticalCount = filteredData.filter((v) => v.severity === 'critical').length
  const totalFines = filteredData.reduce((sum, v) => sum + (v.fine_amount || 0), 0)
  const unpaidFines = filteredData
    .filter((v) => !v.paid)
    .reduce((sum, v) => sum + (v.fine_amount || 0), 0)

  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-white">{totalViolations}</div>
            <div className="text-xs text-slate-400">Total Violations</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertOctagon className="w-3 h-3 text-red-400" />
              <div className="text-sm font-bold text-red-400">{openCount}</div>
            </div>
            <div className="text-xs text-slate-400">Open/In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-900/30 border-orange-700/50">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <div className="text-sm font-bold text-orange-400">{criticalCount}</div>
            </div>
            <div className="text-xs text-slate-400">Critical Severity</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-amber-400">${unpaidFines.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Unpaid Fines</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Fines */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <span>Total Fines Assessment</span>
            <span className="text-sm font-bold text-red-400">${totalFines.toFixed(2)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Paid: ${(totalFines - unpaidFines).toFixed(2)}</span>
            <span>Unpaid: ${unpaidFines.toFixed(2)}</span>
          </div>
          <Progress value={((totalFines - unpaidFines) / totalFines) * 100} className="h-3" />
        </CardContent>
      </Card>

      {/* Filter and Export Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search violations..."
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
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="remediation-in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paidFilter} onValueChange={setPaidFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-Style Violations Matrix */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Scale className="w-3 h-3 text-amber-400" />
            All Compliance Violations - Excel View ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            data={filteredData}
            columns={columns}
            pageSize={20}
            enableInspector={true}
            inspectorType="compliance-violation"
            compactMode={true}
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ INCIDENTS MATRIX ============

export function IncidentsMatrixView() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: incidents } = useSWR<SafetyIncident[]>(
    '/api/safety/incidents',
    fetcher,
    {
      fallbackData: demoIncidents,
      shouldRetryOnError: false,
    }
  )

  const filteredData = useMemo(() => {
    if (!incidents) return []

    return incidents.filter((incident) => {
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter
      const matchesType = typeFilter === 'all' || incident.type === typeFilter
      const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter
      const matchesSearch =
        !searchQuery ||
        incident.incident_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesStatus && matchesType && matchesSeverity && matchesSearch
    })
  }, [incidents, statusFilter, typeFilter, severityFilter, searchQuery])

  const columns: ColumnDef<SafetyIncident>[] = [
    {
      accessorKey: 'incident_number',
      header: 'Incident #',
      cell: ({ row }) => <div className="font-medium">{row.original.incident_number}</div>,
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div>
          <div>{new Date(row.original.date).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">{row.original.time}</div>
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => <div className="text-sm">{row.original.location}</div>,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'severity',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.original.severity
        const variant =
          severity === 'critical' ? 'destructive' : severity === 'major' ? 'default' : 'secondary'
        return (
          <Badge variant={variant} className="capitalize">
            {severity}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'injured',
      header: 'Injured',
      cell: ({ row }) => (
        <div className={`text-center font-bold ${row.original.injured > 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
          {row.original.injured}
        </div>
      ),
    },
    {
      accessorKey: 'vehicle_name',
      header: 'Vehicle',
      cell: ({ row }) => row.original.vehicle_name || '-',
    },
    {
      accessorKey: 'driver_name',
      header: 'Driver',
      cell: ({ row }) => row.original.driver_name || '-',
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate" title={row.original.description}>
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const variant =
          status === 'closed'
            ? 'default'
            : status === 'open'
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
      accessorKey: 'cost',
      header: 'Cost',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          ${row.original.cost.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'root_cause',
      header: 'Root Cause',
      cell: ({ row }) => (
        <div className="text-sm max-w-xs truncate" title={row.original.root_cause}>
          {row.original.root_cause || '-'}
        </div>
      ),
    },
  ]

  const handleExportToExcel = () => {
    const headers = [
      'Incident #',
      'Date',
      'Time',
      'Location',
      'Type',
      'Severity',
      'Injured',
      'Vehicle',
      'Driver',
      'Description',
      'Status',
      'Cost',
      'Root Cause',
    ]

    const csvData = filteredData.map((incident) => [
      incident.incident_number,
      new Date(incident.date).toLocaleDateString(),
      incident.time,
      incident.location,
      incident.type,
      incident.severity,
      incident.injured.toString(),
      incident.vehicle_name || '',
      incident.driver_name || '',
      incident.description.replace(/,/g, ';'),
      incident.status,
      `$${incident.cost.toFixed(2)}`,
      incident.root_cause?.replace(/,/g, ';') || '',
    ])

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safety-incidents-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary stats
  const totalIncidents = filteredData.length
  const openCount = filteredData.filter((i) => i.status === 'open' || i.status === 'investigating').length
  const criticalCount = filteredData.filter((i) => i.severity === 'critical').length
  const totalInjured = filteredData.reduce((sum, i) => sum + i.injured, 0)
  const totalCost = filteredData.reduce((sum, i) => sum + i.cost, 0)

  return (
    <div className="space-y-2">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-white">{totalIncidents}</div>
            <div className="text-xs text-slate-400">Total Incidents</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertOctagon className="w-3 h-3 text-red-400" />
              <div className="text-sm font-bold text-red-400">{openCount}</div>
            </div>
            <div className="text-xs text-slate-400">Open/Investigating</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-900/30 border-orange-700/50">
          <CardContent className="p-2 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <div className="text-sm font-bold text-orange-400">{totalInjured}</div>
            </div>
            <div className="text-xs text-slate-400">Total Injuries</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-2 text-center">
            <div className="text-sm font-bold text-amber-400">${totalCost.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Total Cost</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Export Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
                <SelectItem value="injury">Injury</SelectItem>
                <SelectItem value="near-miss">Near Miss</SelectItem>
                <SelectItem value="property-damage">Property Damage</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-Style Incidents Matrix */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Shield className="w-3 h-3 text-blue-400" />
            All Safety Incidents - Excel View ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            data={filteredData}
            columns={columns}
            pageSize={20}
            enableInspector={true}
            inspectorType="safety-incident"
            compactMode={true}
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Note: Detail panels for individual violations and incidents preserved from original file
// These would be imported and used by the parent Safety Hub module as needed
