/**
 * SafetyInspectionDrilldowns - Excel-style inspection matrices with full data visibility
 * Provides comprehensive inspection tracking with advanced filtering and export capabilities
 */

import { ColumnDef } from '@tanstack/react-table'
import {
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  Download,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { DataGrid } from '@/components/common/DataGrid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDrilldown } from '@/contexts/DrilldownContext'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============ TYPE DEFINITIONS ============

interface InspectionData {
  id: string
  inspection_number: string
  date: string
  time?: string
  vehicle_id?: string
  vehicle_name?: string
  inspector_id: string
  inspector_name: string
  inspector_phone?: string
  inspector_email?: string
  result: 'passed' | 'failed' | 'conditional' | 'pending'
  score?: number
  violations: number
  critical_items: number
  status: string
  next_due?: string
  type: 'safety' | 'pre-trip' | 'annual' | 'roadside' | 'periodic'
  location?: string
  certification_number?: string
  notes?: string
}

interface InspectionViolation {
  id: string
  inspection_id: string
  category: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  regulation_reference?: string
  corrective_action_required: boolean
  corrective_action?: string
  due_date?: string
  resolved: boolean
  resolved_date?: string
  resolved_by?: string
  cost_to_fix?: number
}

// ============ DEMO DATA ============

const demoInspections: InspectionData[] = [
  {
    id: 'insp-001',
    inspection_number: 'SI-2025-001',
    date: '2025-12-14',
    time: '09:30 AM',
    vehicle_id: 'veh-demo-1001',
    vehicle_name: 'Ford F-150 #1001',
    inspector_id: 'emp-101',
    inspector_name: 'Sarah Johnson',
    inspector_phone: '(850) 555-0101',
    inspector_email: 'sjohnson@ctafleet.com',
    result: 'passed',
    score: 98,
    violations: 0,
    critical_items: 0,
    status: 'Complete',
    next_due: '2026-01-14',
    type: 'safety',
    location: 'North Service Center',
    certification_number: 'CERT-2025-001-FL',
    notes: 'All safety systems operational. Excellent condition.',
  },
  {
    id: 'insp-002',
    inspection_number: 'SI-2025-002',
    date: '2025-12-13',
    time: '02:15 PM',
    vehicle_id: 'veh-demo-1002',
    vehicle_name: 'Chevrolet Silverado #1002',
    inspector_id: 'emp-101',
    inspector_name: 'Sarah Johnson',
    inspector_phone: '(850) 555-0101',
    inspector_email: 'sjohnson@ctafleet.com',
    result: 'failed',
    score: 72,
    violations: 3,
    critical_items: 2,
    status: 'Action Required',
    next_due: '2025-12-20',
    type: 'annual',
    location: 'North Service Center',
    notes: 'Multiple safety violations found. Immediate repair required.',
  },
  {
    id: 'insp-003',
    inspection_number: 'SI-2025-003',
    date: '2025-12-12',
    time: '11:00 AM',
    vehicle_id: 'veh-demo-1015',
    vehicle_name: 'Mercedes Sprinter #1015',
    inspector_id: 'emp-102',
    inspector_name: 'Michael Davis',
    inspector_phone: '(850) 555-0102',
    inspector_email: 'mdavis@ctafleet.com',
    result: 'conditional',
    score: 85,
    violations: 1,
    critical_items: 0,
    status: 'Conditional',
    next_due: '2025-12-26',
    type: 'pre-trip',
    location: 'South Depot',
    notes: 'Minor wiper blade wear. Can operate with restriction.',
  },
  {
    id: 'insp-004',
    inspection_number: 'SI-2025-004',
    date: '2025-12-11',
    time: '08:45 AM',
    vehicle_id: 'veh-demo-1008',
    vehicle_name: 'Ford Transit #1008',
    inspector_id: 'emp-102',
    inspector_name: 'Michael Davis',
    inspector_phone: '(850) 555-0102',
    inspector_email: 'mdavis@ctafleet.com',
    result: 'passed',
    score: 95,
    violations: 0,
    critical_items: 0,
    status: 'Complete',
    next_due: '2026-06-11',
    type: 'roadside',
    location: 'I-10 East Mile Marker 192',
    certification_number: 'DOT-RS-2025-FL-0441',
    notes: 'DOT roadside inspection - passed all checks.',
  },
  {
    id: 'insp-005',
    inspection_number: 'SI-2025-005',
    date: '2025-12-10',
    time: '03:30 PM',
    vehicle_id: 'veh-demo-1003',
    vehicle_name: 'Ram 1500 #1003',
    inspector_id: 'emp-103',
    inspector_name: 'Lisa Chen',
    inspector_phone: '(850) 555-0103',
    inspector_email: 'lchen@ctafleet.com',
    result: 'passed',
    score: 92,
    violations: 0,
    critical_items: 0,
    status: 'Complete',
    next_due: '2026-01-10',
    type: 'periodic',
    location: 'East Facility',
    notes: '30-day periodic inspection completed successfully.',
  },
]

const demoViolations: InspectionViolation[] = [
  {
    id: 'viol-001',
    inspection_id: 'insp-002',
    category: 'Brake System',
    severity: 'critical',
    description: 'Front brake pads worn below minimum thickness (2mm measured, 3mm required)',
    regulation_reference: 'FMCSA 393.47',
    corrective_action_required: true,
    corrective_action: 'Replace front brake pads and rotors',
    due_date: '2025-12-15',
    resolved: false,
    cost_to_fix: 450.00,
  },
  {
    id: 'viol-002',
    inspection_id: 'insp-002',
    category: 'Lighting',
    severity: 'critical',
    description: 'Left tail light inoperative - brake signal not functioning',
    regulation_reference: 'FMCSA 393.25',
    corrective_action_required: true,
    corrective_action: 'Replace tail light assembly and check wiring harness',
    due_date: '2025-12-15',
    resolved: false,
    cost_to_fix: 125.00,
  },
  {
    id: 'viol-003',
    inspection_id: 'insp-002',
    category: 'Windshield',
    severity: 'minor',
    description: 'Windshield wiper blade streaking on driver side',
    regulation_reference: 'FMCSA 393.78',
    corrective_action_required: false,
    corrective_action: 'Replace wiper blade',
    due_date: '2025-12-20',
    resolved: false,
    cost_to_fix: 25.00,
  },
  {
    id: 'viol-004',
    inspection_id: 'insp-003',
    category: 'Windshield',
    severity: 'minor',
    description: 'Wiper blades showing minor wear but still functional',
    regulation_reference: 'FMCSA 393.78',
    corrective_action_required: false,
    corrective_action: 'Replace during next scheduled maintenance',
    due_date: '2025-12-26',
    resolved: false,
    cost_to_fix: 30.00,
  },
]

// ============ EXCEL-STYLE INSPECTION MATRIX ============

export function InspectionsMatrixView() {
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: inspections } = useSWR<InspectionData[]>(
    '/api/inspections',
    fetcher,
    {
      fallbackData: demoInspections,
      shouldRetryOnError: false,
    }
  )

  const filteredData = useMemo(() => {
    if (!inspections) return []

    return inspections.filter((inspection) => {
      const matchesResult = resultFilter === 'all' || inspection.result === resultFilter
      const matchesType = typeFilter === 'all' || inspection.type === typeFilter
      const matchesSearch =
        !searchQuery ||
        inspection.inspection_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.vehicle_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.inspector_name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesResult && matchesType && matchesSearch
    })
  }, [inspections, resultFilter, typeFilter, searchQuery])

  const columns: ColumnDef<InspectionData>[] = [
    {
      accessorKey: 'inspection_number',
      header: 'Inspection #',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.inspection_number}</div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => (
        <div>
          <div>{new Date(row.original.date).toLocaleDateString()}</div>
          {row.original.time && (
            <div className="text-xs text-muted-foreground">{row.original.time}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'vehicle_name',
      header: 'Vehicle',
      cell: ({ row }) => row.original.vehicle_name || '-',
    },
    {
      accessorKey: 'inspector_name',
      header: 'Inspector',
      cell: ({ row }) => row.original.inspector_name,
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => {
        const result = row.original.result
        const variant =
          result === 'passed' ? 'default' : result === 'failed' ? 'destructive' : 'secondary'
        return (
          <div className="flex items-center gap-2">
            {result === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
            {result === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
            {result === 'conditional' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
            <Badge variant={variant} className="capitalize">
              {result}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'score',
      header: 'Score %',
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
      accessorKey: 'violations',
      header: 'Violations',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.violations === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            <span className="font-bold text-red-500">{row.original.violations}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'critical_items',
      header: 'Critical Items',
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.critical_items === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            <span className="font-bold text-red-500">{row.original.critical_items}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => row.original.status,
    },
    {
      accessorKey: 'next_due',
      header: 'Next Due',
      cell: ({ row }) => {
        if (!row.original.next_due) return '-'
        const dueDate = new Date(row.original.next_due)
        const today = new Date()
        const daysUntil = Math.floor(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        return (
          <div>
            <div>{dueDate.toLocaleDateString()}</div>
            {daysUntil <= 7 && daysUntil > 0 && (
              <div className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {daysUntil} days
              </div>
            )}
            {daysUntil <= 0 && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Overdue
              </div>
            )}
          </div>
        )
      },
    },
  ]

  const handleExportToExcel = () => {
    // Prepare CSV data
    const headers = [
      'Inspection #',
      'Date',
      'Time',
      'Vehicle',
      'Inspector',
      'Result',
      'Score %',
      'Violations',
      'Critical Items',
      'Status',
      'Next Due',
    ]

    const csvData = filteredData.map((inspection) => [
      inspection.inspection_number,
      new Date(inspection.date).toLocaleDateString(),
      inspection.time || '',
      inspection.vehicle_name || '',
      inspection.inspector_name,
      inspection.result,
      inspection.score !== undefined ? `${inspection.score}%` : '',
      inspection.violations.toString(),
      inspection.critical_items.toString(),
      inspection.status,
      inspection.next_due ? new Date(inspection.next_due).toLocaleDateString() : '',
    ])

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inspections-matrix-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Calculate summary stats
  const totalInspections = filteredData.length
  const passedCount = filteredData.filter((i) => i.result === 'passed').length
  const failedCount = filteredData.filter((i) => i.result === 'failed').length
  const violationsCount = filteredData.reduce((sum, i) => sum + i.violations, 0)
  const passRate = totalInspections > 0 ? Math.round((passedCount / totalInspections) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalInspections}</div>
            <div className="text-xs text-slate-400">Total Inspections</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-2xl font-bold text-green-400">{passedCount}</div>
            </div>
            <div className="text-xs text-slate-400">Passed ({passRate}%)</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <XCircle className="w-5 h-5 text-red-400" />
              <div className="text-2xl font-bold text-red-400">{failedCount}</div>
            </div>
            <div className="text-xs text-slate-400">Failed</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div className="text-2xl font-bold text-amber-400">{violationsCount}</div>
            </div>
            <div className="text-xs text-slate-400">Total Violations</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Export Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={resultFilter} onValueChange={setResultFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="conditional">Conditional</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="pre-trip">Pre-Trip</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
                <SelectItem value="roadside">Roadside</SelectItem>
                <SelectItem value="periodic">Periodic</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportToExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Excel-Style Inspection Matrix */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
            All Safety Inspections - Excel View ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataGrid
            data={filteredData}
            columns={columns}
            pageSize={20}
            enableInspector={true}
            inspectorType="safety-inspection"
            compactMode={true}
            stickyHeader={true}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ INSPECTION DETAIL PANEL ============

interface InspectionDetailPanelProps {
  inspectionId: string
}

export function SafetyInspectionDetailPanel({ inspectionId }: InspectionDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: inspection, error, isLoading, mutate } = useSWR<InspectionData>(
    `/api/inspections/${inspectionId}`,
    fetcher,
    {
      fallbackData: demoInspections.find((i) => i.id === inspectionId),
      shouldRetryOnError: false,
    }
  )

  const { data: violations } = useSWR<InspectionViolation[]>(
    inspectionId ? `/api/inspections/${inspectionId}/violations` : null,
    fetcher,
    {
      fallbackData: demoViolations.filter((v) => v.inspection_id === inspectionId),
      shouldRetryOnError: false,
    }
  )

  const handleViewVehicle = () => {
    if (inspection?.vehicle_id) {
      push({
        id: `vehicle-${inspection.vehicle_id}`,
        type: 'vehicle',
        label: inspection.vehicle_name || 'Vehicle Details',
        data: { vehicleId: inspection.vehicle_id },
      })
    }
  }

  const handleContactInspector = (email?: string, phone?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`
    } else if (phone) {
      window.location.href = `tel:${phone}`
    }
  }

  const getStatusColor = (
    status: string
  ): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'failed':
        return 'destructive'
      case 'conditional':
        return 'default'
      case 'passed':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSeverityColor = (
    severity: string
  ): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'major':
        return 'default'
      case 'minor':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {inspection && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Inspection #{inspection.inspection_number}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(inspection.date).toLocaleDateString()}{' '}
                {inspection.time && `at ${inspection.time}`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(inspection.result)} className="capitalize">
                  {inspection.result}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {inspection.type.replace('-', ' ')}
                </Badge>
                {inspection.score && (
                  <Badge variant={inspection.score >= 90 ? 'secondary' : 'default'}>
                    Score: {inspection.score}%
                  </Badge>
                )}
              </div>
            </div>
            <ClipboardCheck className="h-12 w-12 text-blue-400" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inspection.violations}</div>
                {inspection.critical_items > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {inspection.critical_items} critical
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next Inspection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {inspection.next_due
                    ? new Date(inspection.next_due).toLocaleDateString()
                    : 'Not scheduled'}
                </div>
                {inspection.next_due && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor(
                      (new Date(inspection.next_due).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days away
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Inspector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{inspection.inspector_name}</div>
                <div className="flex gap-2 mt-2">
                  {inspection.inspector_phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() =>
                        handleContactInspector(undefined, inspection.inspector_phone)
                      }
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  {inspection.inspector_email && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleContactInspector(inspection.inspector_email)}
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inspection Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <Button variant="link" className="p-0 h-auto font-medium" onClick={handleViewVehicle}>
                    {inspection.vehicle_name || 'View Vehicle'}
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{inspection.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Inspection Type</p>
                  <p className="font-medium capitalize">{inspection.type.replace('-', ' ')}</p>
                </div>
                {inspection.certification_number && (
                  <div>
                    <p className="text-sm text-muted-foreground">Certification #</p>
                    <p className="font-medium">{inspection.certification_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Violations */}
          {violations && violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Violations Found ({violations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {violations.map((violation) => (
                  <Card
                    key={violation.id}
                    className="border-l-4"
                    style={{
                      borderLeftColor:
                        violation.severity === 'critical'
                          ? '#dc2626'
                          : violation.severity === 'major'
                          ? '#f59e0b'
                          : '#6b7280',
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                              <span className="font-medium">{violation.category}</span>
                            </div>
                            <p className="text-sm">{violation.description}</p>
                            {violation.regulation_reference && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Regulation: {violation.regulation_reference}
                              </p>
                            )}
                          </div>
                          {violation.resolved ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                        </div>

                        {violation.corrective_action && (
                          <div className="pt-2 border-t">
                            <p className="text-sm font-medium">Corrective Action:</p>
                            <p className="text-sm text-muted-foreground">
                              {violation.corrective_action}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              {violation.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    Due: {new Date(violation.due_date).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {violation.cost_to_fix && (
                                <div className="flex items-center gap-1">
                                  <span>Est. Cost: ${violation.cost_to_fix.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {violation.resolved && violation.resolved_date && (
                          <div className="pt-2 border-t text-sm">
                            <span className="text-muted-foreground">Resolved on </span>
                            <span className="font-medium">
                              {new Date(violation.resolved_date).toLocaleDateString()}
                            </span>
                            {violation.resolved_by && (
                              <span className="text-muted-foreground"> by {violation.resolved_by}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {inspection.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Inspector Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Contact Inspector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Inspector
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{inspection.inspector_name}</p>
                <div className="flex gap-3">
                  {inspection.inspector_phone && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleContactInspector(undefined, inspection.inspector_phone)
                      }
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {inspection.inspector_phone}
                    </Button>
                  )}
                  {inspection.inspector_email && (
                    <Button
                      variant="outline"
                      onClick={() => handleContactInspector(inspection.inspector_email)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {inspection.inspector_email}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
