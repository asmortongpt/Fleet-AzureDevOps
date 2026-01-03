/**
 * SafetyComplianceDrilldowns - Comprehensive compliance violation tracking
 * Includes violations, citations, remediation plans, and responsible contacts
 */

import {
  Shield,
  AlertTriangle,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Building,
  Scale,
  AlertOctagon,
  TrendingDown,
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

interface ComplianceViolation {
  id: string
  violation_number: string
  type: 'dot' | 'osha' | 'epa' | 'fmcsa' | 'state' | 'local'
  category: string
  severity: 'critical' | 'major' | 'minor'
  description: string
  regulation_reference: string
  issue_date: string
  violation_date?: string
  location?: string
  vehicle_id?: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  issuing_authority: string
  inspector_name?: string
  citation_number?: string
  fine_amount?: number
  fine_paid: boolean
  fine_due_date?: string
  status: 'open' | 'under-review' | 'remediation-in-progress' | 'resolved' | 'appealed'
  resolution_date?: string
  points_assessed?: number
}

interface RemediationPlan {
  id: string
  violation_id: string
  plan_name: string
  description: string
  responsible_person_id: string
  responsible_person_name: string
  responsible_person_title: string
  responsible_person_phone?: string
  responsible_person_email?: string
  start_date: string
  target_completion_date: string
  actual_completion_date?: string
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue'
  completion_percentage: number
  estimated_cost?: number
  actual_cost?: number
  corrective_actions: CorrectiveAction[]
}

interface CorrectiveAction {
  id: string
  action: string
  assigned_to: string
  due_date: string
  completed: boolean
  completed_date?: string
  notes?: string
}

interface Citation {
  id: string
  citation_number: string
  issuing_authority: string
  issue_date: string
  violation_type: string
  description: string
  fine_amount: number
  fine_paid: boolean
  fine_paid_date?: string
  payment_method?: string
  court_date?: string
  court_location?: string
  status: 'pending' | 'paid' | 'contested' | 'dismissed'
  attorney_assigned?: string
  attorney_phone?: string
  attorney_email?: string
}

// ============ DEMO DATA ============

const demoViolations: ComplianceViolation[] = [
  {
    id: 'viol-001',
    violation_number: 'DOT-2025-FL-00124',
    type: 'dot',
    category: 'Hours of Service',
    severity: 'major',
    description: 'Driver exceeded 11-hour driving limit by 2.5 hours on 2025-11-15',
    regulation_reference: '49 CFR 395.3(a)(1)',
    issue_date: '2025-11-20',
    violation_date: '2025-11-15',
    location: 'I-10 East, Mile Marker 245',
    vehicle_id: 'veh-demo-1001',
    vehicle_name: 'Ford F-150 #1001',
    driver_id: 'drv-001',
    driver_name: 'John Smith',
    issuing_authority: 'Florida Highway Patrol',
    inspector_name: 'Officer Michael Johnson',
    citation_number: 'FHP-2025-118821',
    fine_amount: 1250.00,
    fine_paid: false,
    fine_due_date: '2026-01-20',
    status: 'remediation-in-progress',
    points_assessed: 4
  },
  {
    id: 'viol-002',
    violation_number: 'OSHA-2025-FL-00056',
    type: 'osha',
    category: 'Fall Protection',
    severity: 'critical',
    description: 'Worker observed on elevated platform without proper fall protection equipment',
    regulation_reference: '29 CFR 1926.501',
    issue_date: '2025-12-01',
    violation_date: '2025-11-28',
    location: 'North Service Center - Bay 3',
    issuing_authority: 'OSHA Jacksonville Area Office',
    inspector_name: 'Sarah Martinez, CSHO',
    fine_amount: 14502.00,
    fine_paid: false,
    fine_due_date: '2026-01-15',
    status: 'under-review',
    points_assessed: 0
  },
  {
    id: 'viol-003',
    violation_number: 'FMCSA-2025-FL-00392',
    type: 'fmcsa',
    category: 'Vehicle Maintenance',
    severity: 'major',
    description: 'Commercial vehicle operated with defective brakes (less than 50% effectiveness)',
    regulation_reference: '49 CFR 396.3(a)(1)',
    issue_date: '2025-11-25',
    violation_date: '2025-11-25',
    location: 'DOT Weigh Station - I-75 North',
    vehicle_id: 'veh-demo-1002',
    vehicle_name: 'Chevrolet Silverado #1002',
    driver_id: 'drv-002',
    driver_name: 'Sarah Johnson',
    issuing_authority: 'FMCSA',
    inspector_name: 'Inspector David Lee',
    citation_number: 'FMCSA-CV-2025-3821',
    fine_amount: 2500.00,
    fine_paid: true,
    status: 'resolved',
    resolution_date: '2025-12-10',
    points_assessed: 6
  },
  {
    id: 'viol-004',
    violation_number: 'EPA-2025-FL-00018',
    type: 'epa',
    category: 'Hazardous Waste Storage',
    severity: 'minor',
    description: 'Improper labeling of hazardous waste containers in storage area',
    regulation_reference: '40 CFR 262.34',
    issue_date: '2025-11-30',
    violation_date: '2025-11-28',
    location: 'South Facility - Hazmat Storage Building',
    issuing_authority: 'EPA Region 4',
    inspector_name: 'Jennifer Wilson, Environmental Specialist',
    fine_amount: 500.00,
    fine_paid: false,
    fine_due_date: '2026-01-30',
    status: 'remediation-in-progress',
    points_assessed: 0
  },
  {
    id: 'viol-005',
    violation_number: 'STATE-2025-FL-00821',
    type: 'state',
    category: 'Weight Limits',
    severity: 'minor',
    description: 'Vehicle exceeded gross vehicle weight rating by 450 pounds',
    regulation_reference: 'Florida Statute 316.545',
    issue_date: '2025-12-05',
    violation_date: '2025-12-05',
    location: 'US-27 South, Weigh Station',
    vehicle_id: 'veh-demo-1015',
    vehicle_name: 'Mercedes Sprinter #1015',
    driver_id: 'drv-015',
    driver_name: 'Tom Wilson',
    issuing_authority: 'Florida Department of Transportation',
    citation_number: 'FDOT-WT-2025-5521',
    fine_amount: 250.00,
    fine_paid: true,
    status: 'resolved',
    resolution_date: '2025-12-12',
    points_assessed: 1
  }
]

const demoRemediationPlans: RemediationPlan[] = [
  {
    id: 'plan-001',
    violation_id: 'viol-001',
    plan_name: 'HOS Compliance Enhancement Program',
    description: 'Implement comprehensive driver training and ELD monitoring to prevent future hours of service violations',
    responsible_person_id: 'emp-301',
    responsible_person_name: 'Robert Chen',
    responsible_person_title: 'Fleet Safety Manager',
    responsible_person_phone: '(850) 555-0301',
    responsible_person_email: 'rchen@ctafleet.com',
    start_date: '2025-11-22',
    target_completion_date: '2026-01-15',
    status: 'in-progress',
    completion_percentage: 60,
    estimated_cost: 5000.00,
    corrective_actions: [
      {
        id: 'action-001',
        action: 'Conduct mandatory HOS training for all drivers',
        assigned_to: 'Training Department',
        due_date: '2025-12-15',
        completed: true,
        completed_date: '2025-12-10',
        notes: '42 drivers completed training'
      },
      {
        id: 'action-002',
        action: 'Implement real-time ELD monitoring alerts',
        assigned_to: 'IT Department',
        due_date: '2025-12-30',
        completed: true,
        completed_date: '2025-12-20',
        notes: 'Alert system configured and tested'
      },
      {
        id: 'action-003',
        action: 'Review and update dispatch scheduling procedures',
        assigned_to: 'Operations Manager',
        due_date: '2026-01-10',
        completed: false,
        notes: 'In progress - 75% complete'
      }
    ]
  },
  {
    id: 'plan-002',
    violation_id: 'viol-002',
    plan_name: 'Fall Protection Compliance Program',
    description: 'Ensure all employees working at heights have proper equipment and training',
    responsible_person_id: 'emp-302',
    responsible_person_name: 'Amanda Rodriguez',
    responsible_person_title: 'Safety Coordinator',
    responsible_person_phone: '(850) 555-0302',
    responsible_person_email: 'arodriguez@ctafleet.com',
    start_date: '2025-12-02',
    target_completion_date: '2026-01-05',
    status: 'in-progress',
    completion_percentage: 40,
    estimated_cost: 15000.00,
    actual_cost: 8500.00,
    corrective_actions: [
      {
        id: 'action-004',
        action: 'Purchase fall protection equipment for all technicians',
        assigned_to: 'Procurement',
        due_date: '2025-12-15',
        completed: true,
        completed_date: '2025-12-12',
        notes: 'Ordered 25 harness kits'
      },
      {
        id: 'action-005',
        action: 'Conduct fall protection certification training',
        assigned_to: 'Safety Department',
        due_date: '2025-12-30',
        completed: false,
        notes: 'Scheduled for Dec 28-29'
      },
      {
        id: 'action-006',
        action: 'Install anchor points in all elevated work areas',
        assigned_to: 'Facilities',
        due_date: '2026-01-05',
        completed: false
      }
    ]
  },
  {
    id: 'plan-003',
    violation_id: 'viol-004',
    plan_name: 'Hazardous Waste Labeling Correction',
    description: 'Update all hazardous waste container labels to EPA compliance standards',
    responsible_person_id: 'emp-303',
    responsible_person_name: 'Dr. Jennifer Liu',
    responsible_person_title: 'Environmental Compliance Officer',
    responsible_person_phone: '(850) 555-0303',
    responsible_person_email: 'jliu@ctafleet.com',
    start_date: '2025-12-01',
    target_completion_date: '2025-12-20',
    status: 'in-progress',
    completion_percentage: 85,
    estimated_cost: 1200.00,
    actual_cost: 950.00,
    corrective_actions: [
      {
        id: 'action-007',
        action: 'Order EPA-compliant hazmat labels',
        assigned_to: 'Procurement',
        due_date: '2025-12-05',
        completed: true,
        completed_date: '2025-12-03'
      },
      {
        id: 'action-008',
        action: 'Re-label all hazardous waste containers',
        assigned_to: 'Hazmat Team',
        due_date: '2025-12-15',
        completed: true,
        completed_date: '2025-12-14',
        notes: 'All 32 containers relabeled and inspected'
      },
      {
        id: 'action-009',
        action: 'Conduct hazmat storage training for staff',
        assigned_to: 'Environmental Officer',
        due_date: '2025-12-20',
        completed: false,
        notes: 'Scheduled for Dec 19'
      }
    ]
  }
]

// ============ VIOLATIONS LIST VIEW ============

export function ViolationsListView({ filter }: { filter?: string }) {
  const { data: violations } = useSWR<ComplianceViolation[]>(
    filter ? `/api/compliance/violations?filter=${filter}` : '/api/compliance/violations',
    fetcher,
    {
      fallbackData: demoViolations,
      shouldRetryOnError: false
    }
  )

  const filteredViolations = useMemo(() => {
    if (!filter || !violations) return violations || []

    switch (filter) {
      case 'open':
        return violations.filter(v => v.status === 'open' || v.status === 'under-review' || v.status === 'remediation-in-progress')
      case 'critical':
        return violations.filter(v => v.severity === 'critical')
      case 'unpaid-fines':
        return violations.filter(v => v.fine_amount && !v.fine_paid)
      case 'overdue':
        return violations.filter(v => v.fine_due_date && new Date(v.fine_due_date) < new Date() && !v.fine_paid)
      default:
        return violations
    }
  }, [violations, filter])

  const getSeverityColor = (severity: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'major': return 'default'
      case 'minor': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'resolved': return 'secondary'
      case 'remediation-in-progress': return 'default'
      case 'under-review': return 'outline'
      case 'open': return 'destructive'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<ComplianceViolation>[] = [
    {
      key: 'issue_date',
      header: 'Date',
      sortable: true,
      render: (violation) => new Date(violation.issue_date).toLocaleDateString(),
    },
    {
      key: 'violation_number',
      header: 'Violation #',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (violation) => (
        <Badge variant={getSeverityColor(violation.severity)}>
          {violation.severity}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (violation) => (
        <Badge variant={getStatusColor(violation.status)} className="capitalize">
          {violation.status.replace('-', ' ')}
        </Badge>
      ),
    },
    {
      key: 'fine_amount',
      header: 'Fine',
      sortable: true,
      render: (violation) => {
        if (!violation.fine_amount) return '-'
        return (
          <div className="text-right">
            <div className="font-bold">${violation.fine_amount.toFixed(2)}</div>
            {violation.fine_paid ? (
              <div className="text-xs text-green-500 flex items-center gap-1 justify-end">
                <CheckCircle className="w-3 h-3" />
                Paid
              </div>
            ) : (
              <div className="text-xs text-red-500 flex items-center gap-1 justify-end">
                <XCircle className="w-3 h-3" />
                Unpaid
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'issuing_authority',
      header: 'Authority',
      sortable: true,
    },
  ]

  // Calculate summary stats
  const totalViolations = filteredViolations.length
  const openCount = filteredViolations.filter(v => v.status === 'open' || v.status === 'under-review' || v.status === 'remediation-in-progress').length
  const criticalCount = filteredViolations.filter(v => v.severity === 'critical').length
  const totalFines = filteredViolations.reduce((sum, v) => sum + (v.fine_amount || 0), 0)
  const unpaidFines = filteredViolations.filter(v => !v.fine_paid).reduce((sum, v) => sum + (v.fine_amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{totalViolations}</div>
            <div className="text-xs text-slate-400">Total Violations</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertOctagon className="w-5 h-5 text-red-400" />
              <div className="text-2xl font-bold text-red-400">{openCount}</div>
            </div>
            <div className="text-xs text-slate-400">Open/In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-900/30 border-orange-700/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div className="text-2xl font-bold text-orange-400">{criticalCount}</div>
            </div>
            <div className="text-xs text-slate-400">Critical Severity</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">${unpaidFines.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Unpaid Fines</div>
          </CardContent>
        </Card>
      </div>

      {/* Total Fines */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-sm flex items-center justify-between">
            <span>Total Fines Assessment</span>
            <span className="text-2xl font-bold text-red-400">${totalFines.toFixed(2)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Paid: ${(totalFines - unpaidFines).toFixed(2)}</span>
            <span>Unpaid: ${unpaidFines.toFixed(2)}</span>
          </div>
          <Progress value={((totalFines - unpaidFines) / totalFines) * 100} className="h-3 mt-2" />
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            Compliance Violations ({filteredViolations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredViolations}
            columns={columns}
            recordType="compliance-violation"
            getRecordId={(violation) => violation.id}
            getRecordLabel={(violation) => `Violation ${violation.violation_number}`}
            getRecordData={(violation) => ({ violationId: violation.id })}
            emptyMessage="No violations found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============ VIOLATION DETAIL PANEL ============

interface ViolationDetailPanelProps {
  violationId: string
}

export function ComplianceViolationDetailPanel({ violationId }: ViolationDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: violation, error, isLoading, mutate } = useSWR<ComplianceViolation>(
    `/api/compliance/violations/${violationId}`,
    fetcher,
    {
      fallbackData: demoViolations.find(v => v.id === violationId),
      shouldRetryOnError: false
    }
  )

  const { data: remediationPlan } = useSWR<RemediationPlan>(
    violationId ? `/api/compliance/violations/${violationId}/remediation` : null,
    fetcher,
    {
      fallbackData: demoRemediationPlans.find(p => p.violation_id === violationId),
      shouldRetryOnError: false
    }
  )

  const handleContactResponsible = (email?: string, phone?: string) => {
    if (email) {
      window.location.href = `mailto:${email}`
    } else if (phone) {
      window.location.href = `tel:${phone}`
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

  const getStatusColor = (status: string): 'destructive' | 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'resolved': return 'secondary'
      case 'remediation-in-progress': return 'default'
      case 'under-review': return 'outline'
      case 'open': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {violation && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Violation #{violation.violation_number}</h3>
              <p className="text-sm text-muted-foreground">
                Issued {new Date(violation.issue_date).toLocaleDateString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getSeverityColor(violation.severity)}>
                  {violation.severity}
                </Badge>
                <Badge variant={getStatusColor(violation.status)} className="capitalize">
                  {violation.status.replace('-', ' ')}
                </Badge>
                <Badge variant="outline" className="uppercase">
                  {violation.type}
                </Badge>
              </div>
            </div>
            <AlertOctagon className="h-12 w-12 text-red-400" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            {violation.fine_amount && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fine Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">
                    ${violation.fine_amount.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {violation.fine_paid ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Paid</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-xs text-red-500">Unpaid</span>
                      </>
                    )}
                  </div>
                  {violation.fine_due_date && !violation.fine_paid && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(violation.fine_due_date).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {violation.points_assessed && violation.points_assessed > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Points Assessed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{violation.points_assessed}</div>
                  <p className="text-xs text-muted-foreground mt-1">CSA/Safety points</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Authority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{violation.issuing_authority}</div>
                {violation.inspector_name && (
                  <p className="text-xs text-muted-foreground mt-1">{violation.inspector_name}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Violation Details */}
          <Card>
            <CardHeader>
              <CardTitle>Violation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{violation.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{violation.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Regulation Reference</p>
                <p className="font-medium font-mono text-sm">{violation.regulation_reference}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                {violation.violation_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Violation Date</p>
                    <p className="font-medium">{new Date(violation.violation_date).toLocaleDateString()}</p>
                  </div>
                )}
                {violation.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{violation.location}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Remediation Plan */}
          {remediationPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Remediation Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">{remediationPlan.plan_name}</h4>
                  <p className="text-sm text-muted-foreground">{remediationPlan.description}</p>
                </div>

                {/* Responsible Person */}
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Responsible Person</p>
                          <p className="font-medium">{remediationPlan.responsible_person_name}</p>
                          <p className="text-sm text-muted-foreground">{remediationPlan.responsible_person_title}</p>
                        </div>
                        <div className="flex gap-3">
                          {remediationPlan.responsible_person_phone && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactResponsible(undefined, remediationPlan.responsible_person_phone)}
                            >
                              <Phone className="h-3 w-3 mr-2" />
                              Call
                            </Button>
                          )}
                          {remediationPlan.responsible_person_email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactResponsible(remediationPlan.responsible_person_email)}
                            >
                              <Mail className="h-3 w-3 mr-2" />
                              Email
                            </Button>
                          )}
                        </div>
                      </div>
                      <User className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completion Progress</span>
                    <span className="text-sm font-bold">{remediationPlan.completion_percentage}%</span>
                  </div>
                  <Progress value={remediationPlan.completion_percentage} className="h-3" />
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(remediationPlan.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target Completion</p>
                    <p className="font-medium">{new Date(remediationPlan.target_completion_date).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Corrective Actions */}
                <div className="pt-2 border-t">
                  <h5 className="font-medium mb-3">Corrective Actions</h5>
                  <div className="space-y-2">
                    {remediationPlan.corrective_actions.map((action) => (
                      <Card key={action.id} className="border-l-4" style={{
                        borderLeftColor: action.completed ? '#22c55e' : '#6b7280'
                      }}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {action.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <p className="text-sm font-medium">{action.action}</p>
                              </div>
                              <div className="ml-6 mt-1 text-xs text-muted-foreground">
                                <div>Assigned to: {action.assigned_to}</div>
                                <div>Due: {new Date(action.due_date).toLocaleDateString()}</div>
                                {action.completed && action.completed_date && (
                                  <div className="text-green-500">
                                    Completed: {new Date(action.completed_date).toLocaleDateString()}
                                  </div>
                                )}
                                {action.notes && (
                                  <div className="mt-1">{action.notes}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Cost */}
                {(remediationPlan.estimated_cost || remediationPlan.actual_cost) && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      {remediationPlan.estimated_cost && (
                        <div>
                          <p className="text-muted-foreground">Estimated Cost</p>
                          <p className="font-medium">${remediationPlan.estimated_cost.toFixed(2)}</p>
                        </div>
                      )}
                      {remediationPlan.actual_cost && (
                        <div>
                          <p className="text-muted-foreground">Actual Cost</p>
                          <p className="font-medium">${remediationPlan.actual_cost.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact Responsible Person */}
          {remediationPlan && (
            <div className="flex gap-3">
              {remediationPlan.responsible_person_phone && (
                <Button
                  className="flex-1"
                  onClick={() => handleContactResponsible(undefined, remediationPlan.responsible_person_phone)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call {remediationPlan.responsible_person_name}
                </Button>
              )}
              {remediationPlan.responsible_person_email && (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => handleContactResponsible(remediationPlan.responsible_person_email)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email {remediationPlan.responsible_person_name}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
