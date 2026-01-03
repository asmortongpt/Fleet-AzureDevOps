/**
 * SafetyInspectionDrilldowns - Complete inspection drilldown views
 * Includes inspection results, violations, follow-up actions, and inspector info
 */

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
  Tool,
  Clock,
  Car,
  TrendingUp,
  TrendingDown
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

interface InspectionData {
  id: string
  inspection_number: string
  vehicle_id?: string
  vehicle_name?: string
  inspector_id: string
  inspector_name: string
  inspector_phone?: string
  inspector_email?: string
  date: string
  time?: string
  type: 'safety' | 'pre-trip' | 'annual' | 'roadside' | 'periodic'
  status: 'passed' | 'failed' | 'conditional' | 'pending'
  overall_score?: number
  violations: number
  critical_violations: number
  non_critical_violations: number
  notes?: string
  next_inspection_date?: string
  certification_number?: string
  location?: string
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

interface InspectionItem {
  id: string
  inspection_id: string
  component: string
  result: 'pass' | 'fail' | 'na'
  notes?: string
  photo_url?: string
}

// ============ DEMO DATA ============

const demoInspections: InspectionData[] = [
  {
    id: 'insp-001',
    inspection_number: 'SI-2025-001',
    vehicle_id: 'veh-demo-1001',
    vehicle_name: 'Ford F-150 #1001',
    inspector_id: 'emp-101',
    inspector_name: 'Sarah Johnson',
    inspector_phone: '(850) 555-0101',
    inspector_email: 'sjohnson@ctafleet.com',
    date: '2025-12-14',
    time: '09:30 AM',
    type: 'safety',
    status: 'passed',
    overall_score: 98,
    violations: 0,
    critical_violations: 0,
    non_critical_violations: 0,
    notes: 'All safety systems operational. Excellent condition.',
    next_inspection_date: '2026-01-14',
    certification_number: 'CERT-2025-001-FL',
    location: 'North Service Center'
  },
  {
    id: 'insp-002',
    inspection_number: 'SI-2025-002',
    vehicle_id: 'veh-demo-1002',
    vehicle_name: 'Chevrolet Silverado #1002',
    inspector_id: 'emp-101',
    inspector_name: 'Sarah Johnson',
    inspector_phone: '(850) 555-0101',
    inspector_email: 'sjohnson@ctafleet.com',
    date: '2025-12-13',
    time: '02:15 PM',
    type: 'annual',
    status: 'failed',
    overall_score: 72,
    violations: 3,
    critical_violations: 2,
    non_critical_violations: 1,
    notes: 'Multiple safety violations found. Immediate repair required.',
    next_inspection_date: '2025-12-20',
    location: 'North Service Center'
  },
  {
    id: 'insp-003',
    inspection_number: 'SI-2025-003',
    vehicle_id: 'veh-demo-1015',
    vehicle_name: 'Mercedes Sprinter #1015',
    inspector_id: 'emp-102',
    inspector_name: 'Michael Davis',
    inspector_phone: '(850) 555-0102',
    inspector_email: 'mdavis@ctafleet.com',
    date: '2025-12-12',
    time: '11:00 AM',
    type: 'pre-trip',
    status: 'conditional',
    overall_score: 85,
    violations: 1,
    critical_violations: 0,
    non_critical_violations: 1,
    notes: 'Minor wiper blade wear. Can operate with restriction.',
    next_inspection_date: '2025-12-26',
    location: 'South Depot'
  },
  {
    id: 'insp-004',
    inspection_number: 'SI-2025-004',
    vehicle_id: 'veh-demo-1008',
    vehicle_name: 'Ford Transit #1008',
    inspector_id: 'emp-102',
    inspector_name: 'Michael Davis',
    inspector_phone: '(850) 555-0102',
    inspector_email: 'mdavis@ctafleet.com',
    date: '2025-12-11',
    time: '08:45 AM',
    type: 'roadside',
    status: 'passed',
    overall_score: 95,
    violations: 0,
    critical_violations: 0,
    non_critical_violations: 0,
    notes: 'DOT roadside inspection - passed all checks.',
    next_inspection_date: '2026-06-11',
    certification_number: 'DOT-RS-2025-FL-0441',
    location: 'I-10 East Mile Marker 192'
  },
  {
    id: 'insp-005',
    inspection_number: 'SI-2025-005',
    vehicle_id: 'veh-demo-1003',
    vehicle_name: 'Ram 1500 #1003',
    inspector_id: 'emp-103',
    inspector_name: 'Lisa Chen',
    inspector_phone: '(850) 555-0103',
    inspector_email: 'lchen@ctafleet.com',
    date: '2025-12-10',
    time: '03:30 PM',
    type: 'periodic',
    status: 'passed',
    overall_score: 92,
    violations: 0,
    critical_violations: 0,
    non_critical_violations: 0,
    notes: '30-day periodic inspection completed successfully.',
    next_inspection_date: '2026-01-10',
    location: 'East Facility'
  }
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
    cost_to_fix: 450.00
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
    cost_to_fix: 125.00
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
    cost_to_fix: 25.00
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
    cost_to_fix: 30.00
  }
]

// ============ INSPECTION LIST VIEW ============

export function InspectionListView({ filter }: { filter?: string }) {
  const { data: inspections } = useSWR<InspectionData[]>(
    filter ? `/api/inspections?filter=${filter}` : '/api/inspections',
    fetcher,
    {
      fallbackData: demoInspections,
      shouldRetryOnError: false
    }
  )

  const filteredInspections = useMemo(() => {
    if (!filter || !inspections) return inspections || []

    switch (filter) {
      case 'failed':
        return inspections.filter(i => i.status === 'failed')
      case 'due':
        return inspections.filter(i => {
          if (!i.next_inspection_date) return false
          const dueDate = new Date(i.next_inspection_date)
          const today = new Date()
          const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return daysUntilDue <= 7 && daysUntilDue >= 0
        })
      case 'overdue':
        return inspections.filter(i => {
          if (!i.next_inspection_date) return false
          return new Date(i.next_inspection_date) < new Date()
        })
      case 'violations':
        return inspections.filter(i => i.violations > 0)
      default:
        return inspections
    }
  }, [inspections, filter])

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'failed': return 'destructive'
      case 'conditional': return 'default'
      case 'passed': return 'secondary'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<InspectionData>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (inspection) => (
        <div>
          <div className="font-medium">{new Date(inspection.date).toLocaleDateString()}</div>
          {inspection.time && <div className="text-xs text-muted-foreground">{inspection.time}</div>}
        </div>
      ),
    },
    {
      key: 'inspection_number',
      header: 'Inspection #',
      sortable: true,
    },
    {
      key: 'vehicle_name',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (inspection) => inspection.vehicle_id,
        getRecordLabel: (inspection) => inspection.vehicle_name || 'Vehicle',
      },
      render: (inspection) => inspection.vehicle_name || '-',
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (inspection) => (
        <Badge variant="outline" className="capitalize">
          {inspection.type.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (inspection) => (
        <div className="flex items-center gap-2">
          {inspection.status === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
          {inspection.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
          {inspection.status === 'conditional' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
          <Badge variant={getStatusColor(inspection.status)}>
            {inspection.status}
          </Badge>
        </div>
      ),
    },
    {
      key: 'violations',
      header: 'Violations',
      sortable: true,
      render: (inspection) => (
        <div className="text-center">
          {inspection.violations === 0 ? (
            <span className="text-muted-foreground">0</span>
          ) : (
            <div className="font-bold text-red-500">
              {inspection.violations}
              {inspection.critical_violations > 0 && (
                <span className="ml-1 text-xs">({inspection.critical_violations} critical)</span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'inspector_name',
      header: 'Inspector',
      sortable: true,
    },
  ]

  // Calculate summary stats
  const totalInspections = filteredInspections.length
  const passedCount = filteredInspections.filter(i => i.status === 'passed').length
  const failedCount = filteredInspections.filter(i => i.status === 'failed').length
  const violationsCount = filteredInspections.reduce((sum, i) => sum + i.violations, 0)
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
            <div className="text-xs text-slate-400">Passed</div>
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
            <div className="text-xs text-slate-400">Violations</div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rate */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <span>Inspection Pass Rate</span>
            <span className="text-2xl font-bold">{passRate}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={passRate} className="h-3" />
          <div className="flex justify-between text-xs text-slate-400 mt-2">
            <span>{passedCount} passed</span>
            <span>{failedCount} failed</span>
          </div>
        </CardContent>
      </Card>

      {/* Inspection Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-400" />
            {filter ? `Filtered Inspections (${filteredInspections.length})` : `All Inspections (${filteredInspections.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredInspections}
            columns={columns}
            recordType="safety-inspection"
            getRecordId={(inspection) => inspection.id}
            getRecordLabel={(inspection) => `Inspection ${inspection.inspection_number}`}
            getRecordData={(inspection) => ({ inspectionId: inspection.id })}
            emptyMessage="No inspections found"
            compact
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
      fallbackData: demoInspections.find(i => i.id === inspectionId),
      shouldRetryOnError: false
    }
  )

  const { data: violations } = useSWR<InspectionViolation[]>(
    inspectionId ? `/api/inspections/${inspectionId}/violations` : null,
    fetcher,
    {
      fallbackData: demoViolations.filter(v => v.inspection_id === inspectionId),
      shouldRetryOnError: false
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

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'failed': return 'destructive'
      case 'conditional': return 'default'
      case 'passed': return 'secondary'
      default: return 'outline'
    }
  }

  const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'major': return 'default'
      case 'minor': return 'secondary'
      default: return 'outline'
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
                {new Date(inspection.date).toLocaleDateString()} {inspection.time && `at ${inspection.time}`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(inspection.status)} className="capitalize">
                  {inspection.status}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {inspection.type.replace('-', ' ')}
                </Badge>
                {inspection.overall_score && (
                  <Badge variant={inspection.overall_score >= 90 ? 'secondary' : 'default'}>
                    Score: {inspection.overall_score}%
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
                <div className="text-2xl font-bold">
                  {inspection.violations}
                </div>
                {inspection.critical_violations > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {inspection.critical_violations} critical
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
                  {inspection.next_inspection_date
                    ? new Date(inspection.next_inspection_date).toLocaleDateString()
                    : 'Not scheduled'
                  }
                </div>
                {inspection.next_inspection_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.floor((new Date(inspection.next_inspection_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days away
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
                <div className="text-sm font-bold">
                  {inspection.inspector_name}
                </div>
                <div className="flex gap-2 mt-2">
                  {inspection.inspector_phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2"
                      onClick={() => handleContactInspector(undefined, inspection.inspector_phone)}
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
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={handleViewVehicle}
                  >
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
                  <Card key={violation.id} className="border-l-4" style={{
                    borderLeftColor: violation.severity === 'critical' ? '#dc2626' : violation.severity === 'major' ? '#f59e0b' : '#6b7280'
                  }}>
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
                            <p className="text-sm text-muted-foreground">{violation.corrective_action}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              {violation.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {new Date(violation.due_date).toLocaleDateString()}</span>
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
                            <span className="font-medium">{new Date(violation.resolved_date).toLocaleDateString()}</span>
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
                      onClick={() => handleContactInspector(undefined, inspection.inspector_phone)}
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

          {/* Actions */}
          {inspection.vehicle_id && (
            <Button onClick={handleViewVehicle} className="w-full">
              <Car className="h-4 w-4 mr-2" />
              View Vehicle Details
            </Button>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
