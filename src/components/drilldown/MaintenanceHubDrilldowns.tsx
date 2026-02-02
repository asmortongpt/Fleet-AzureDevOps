/**
 * MaintenanceHubDrilldowns - Comprehensive drilldown components for Maintenance Hub
 * Covers:
 * - Preventive Maintenance (PM schedules, due dates, service history)
 * - Repairs (active repairs, history, parts, labor)
 * - Inspections (results, failed items, corrective actions, inspector details)
 * - Service Records (history, warranty, vendor details, cost tracking)
 *
 * All components include:
 * - Real contact information (clickable)
 * - Multi-level drill paths (4-5 levels deep)
 * - Full TypeScript typing
 * - No placeholders
 */

import {
  Wrench,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Car,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ClipboardList,
  FileText,
  TrendingUp,
  History,
  MapPin,
  Shield,
  AlertCircle,
  Users,
  Building,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { DrilldownCard, DrilldownCardGrid } from '@/components/drilldown/DrilldownCard'
import { ExcelStyleTable, ExcelColumn } from '@/components/shared/ExcelStyleTable'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============================================
// TYPE DEFINITIONS
// ============================================

interface PreventiveMaintenanceSchedule {
  id: string
  vehicleId: string
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  serviceType: string
  serviceDescription: string
  lastServiceDate?: string
  lastServiceMileage?: number
  nextDueDate: string
  nextDueMileage?: number
  currentMileage: number
  daysUntilDue: number
  milesUntilDue?: number
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed'
  frequency: string
  estimatedCost: number
  assignedTechnician?: string
  serviceProvider: string
  serviceProviderContact: {
    name: string
    phone: string
    email: string
    address: string
  }
  notes?: string
}

interface ServiceHistoryRecord {
  id: string
  workOrderNumber: string
  serviceDate: string
  serviceType: string
  description: string
  mileage: number
  technician: string
  technicianPhone: string
  technicianEmail: string
  laborHours: number
  laborCost: number
  partsCost: number
  totalCost: number
  status: 'completed' | 'cancelled'
  notes?: string
  warranty?: {
    active: boolean
    expirationDate?: string
    expirationMileage?: number
    provider: string
    coverage: string
  }
}

interface RepairRecord {
  id: string
  workOrderNumber: string
  vehicleId: string
  vehicleNumber: string
  repairType: string
  description: string
  reportedDate: string
  reportedBy: string
  reportedByPhone: string
  reportedByEmail: string
  status: 'reported' | 'diagnosed' | 'in-progress' | 'awaiting-parts' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  diagnosisDate?: string
  diagnosisNotes?: string
  estimatedCost?: number
  actualCost?: number
  assignedTechnician?: string
  technicianPhone?: string
  technicianEmail?: string
  startDate?: string
  completionDate?: string
  partsUsed: Array<{
    partNumber: string
    partName: string
    quantity: number
    unitCost: number
    supplier: string
    supplierContact: string
  }>
  laborEntries: Array<{
    technicianName: string
    hours: number
    rate: number
    description: string
  }>
}

interface InspectionRecord {
  id: string
  inspectionNumber: string
  vehicleId: string
  vehicleNumber: string
  inspectionType: string
  inspectionDate: string
  mileage: number
  inspector: {
    name: string
    certificationNumber: string
    phone: string
    email: string
  }
  location: {
    facilityName: string
    address: string
    phone: string
  }
  overallResult: 'pass' | 'pass-with-advisories' | 'fail'
  score?: number
  itemsInspected: number
  itemsPassed: number
  itemsFailed: number
  itemsAdvisory: number
  inspectionItems: Array<{
    category: string
    item: string
    result: 'pass' | 'fail' | 'advisory'
    notes?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }>
  failedItems: Array<{
    item: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    notes: string
    correctiveAction: string
    actionStatus: 'pending' | 'scheduled' | 'in-progress' | 'completed'
    estimatedCost?: number
  }>
  nextInspectionDue?: string
  expirationDate?: string
  certificationNumber?: string
}

interface ServiceVendor {
  id: string
  vendorName: string
  vendorType: string
  contactPerson: string
  phone: string
  email: string
  address: string
  website?: string
  specialties: string[]
  certifications: string[]
  activeContracts: number
  totalServicesYTD: number
  totalCostYTD: number
  averageRating: number
  responseTime: string
  paymentTerms: string
  notes?: string
}

// ============================================
// PREVENTIVE MAINTENANCE SCHEDULE DETAIL
// ============================================

interface PMScheduleDetailPanelProps {
  scheduleId: string
}

export function PMScheduleDetailPanel({ scheduleId }: PMScheduleDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: schedule, error, isLoading } = useSWR<PreventiveMaintenanceSchedule>(
    `/api/maintenance/drilldowns/pm-schedules/${scheduleId}`,
    fetcher
  )

  const { data: serviceHistory } = useSWR<ServiceHistoryRecord[]>(
    schedule?.vehicleId ? `/api/maintenance/drilldowns/vehicles/${schedule.vehicleId}/service-history?serviceType=${schedule.serviceType}` : null,
    fetcher
  )

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'outline'
      case 'upcoming':
        return 'secondary'
      case 'due-soon':
        return 'default'
      case 'overdue':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {schedule && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{schedule.serviceType}</h3>
              <p className="text-sm text-muted-foreground">
                {schedule.vehicleNumber} • {schedule.vehicleMake} {schedule.vehicleModel} ({schedule.vehicleYear})
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(schedule.status)}>
                  {schedule.status}
                </Badge>
                <Badge variant="outline">{schedule.frequency}</Badge>
              </div>
            </div>
            <Calendar className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <DrilldownCardGrid columns={3} gap="sm">
            <DrilldownCard
              title="Days Until Due"
              value={schedule.daysUntilDue > 0 ? schedule.daysUntilDue : 'Overdue'}
              icon={<Clock className="w-3 h-3" />}
              color={schedule.daysUntilDue < 0 ? 'danger' : schedule.daysUntilDue <= 7 ? 'warning' : 'primary'}
              variant="compact"
            />
            <DrilldownCard
              title="Current Mileage"
              value={schedule.currentMileage.toLocaleString()}
              icon={<Car className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
            <DrilldownCard
              title="Est. Cost"
              value={`$${schedule.estimatedCost.toFixed(0)}`}
              icon={<DollarSign className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Schedule Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Type</p>
                      <p className="font-medium">{schedule.serviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frequency</p>
                      <p className="font-medium">{schedule.frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Due Date</p>
                      <p className="font-medium">{new Date(schedule.nextDueDate).toLocaleDateString()}</p>
                    </div>
                    {schedule.nextDueMileage && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next Due Mileage</p>
                        <p className="font-medium">{schedule.nextDueMileage.toLocaleString()} mi</p>
                      </div>
                    )}
                  </div>

                  {schedule.lastServiceDate && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Last Service</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="font-medium">{new Date(schedule.lastServiceDate).toLocaleDateString()}</p>
                        </div>
                        {schedule.lastServiceMileage && (
                          <div>
                            <p className="text-xs text-muted-foreground">Mileage</p>
                            <p className="font-medium">{schedule.lastServiceMileage.toLocaleString()} mi</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {schedule.serviceDescription && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{schedule.serviceDescription}</p>
                    </div>
                  )}

                  {schedule.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{schedule.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {schedule.assignedTechnician && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assigned Technician
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{schedule.assignedTechnician}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Service History Tab */}
            <TabsContent value="history" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Service History ({schedule.serviceType})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {serviceHistory && serviceHistory.length > 0 ? (
                    <div className="space-y-3">
                      {serviceHistory.slice(0, 5).map((record) => (
                        <div
                          key={record.id}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() =>
                            push({
                              id: `service-record-${record.id}`,
                              type: 'service-record-detail',
                              label: `WO #${record.workOrderNumber}`,
                              data: { serviceRecordId: record.id },
                            })
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm font-medium">
                                  {record.workOrderNumber}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {record.status}
                                </Badge>
                              </div>
                              <p className="text-sm">{record.description}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(record.serviceDate).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Car className="w-3 h-3" />
                                  {record.mileage.toLocaleString()} mi
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${record.totalCost.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {serviceHistory.length > 5 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            push({
                              id: `vehicle-service-history-${schedule.vehicleId}`,
                              type: 'vehicle-service-history',
                              label: `${schedule.vehicleNumber} Service History`,
                              data: { vehicleId: schedule.vehicleId, serviceType: schedule.serviceType },
                            })
                          }
                        >
                          View All {serviceHistory.length} Records
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No service history available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service Provider Tab */}
            <TabsContent value="provider" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Service Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">{schedule.serviceProvider}</p>
                    <p className="text-sm text-muted-foreground">{schedule.serviceProviderContact.address}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.name}</p>
                        <p className="text-xs text-muted-foreground">Primary Contact</p>
                      </div>
                    </div>

                    <a
                      href={`tel:${schedule.serviceProviderContact.phone}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.phone}</p>
                        <p className="text-xs text-muted-foreground">Click to call</p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${schedule.serviceProviderContact.email}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{schedule.serviceProviderContact.email}</p>
                        <p className="text-xs text-muted-foreground">Click to email</p>
                      </div>
                    </a>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      push({
                        id: `vendor-${schedule.serviceProvider}`,
                        type: 'service-vendor-detail',
                        label: schedule.serviceProvider,
                        data: { vendorName: schedule.serviceProvider },
                      })
                    }
                  >
                    View Provider Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vehicle Tab */}
            <TabsContent value="vehicle" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle Number</p>
                      <p className="font-medium">{schedule.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Mileage</p>
                      <p className="font-medium">{schedule.currentMileage.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Make/Model</p>
                      <p className="font-medium">
                        {schedule.vehicleMake} {schedule.vehicleModel}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-medium">{schedule.vehicleYear}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      push({
                        id: `vehicle-${schedule.vehicleId}`,
                        type: 'vehicle-detail',
                        label: schedule.vehicleNumber,
                        data: { vehicleId: schedule.vehicleId },
                      })
                    }
                  >
                    View Full Vehicle Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() =>
                push({
                  id: `schedule-work-order-${scheduleId}`,
                  type: 'create-work-order',
                  label: 'Schedule Service',
                  data: { scheduleId, schedule },
                })
              }
            >
              <Wrench className="w-4 h-4 mr-2" />
              Schedule Service
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// REPAIR DETAIL PANEL
// ============================================

interface RepairDetailPanelProps {
  repairId: string
}

export function RepairDetailPanel({ repairId }: RepairDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: repair, error, isLoading } = useSWR<RepairRecord>(
    `/api/maintenance/drilldowns/repairs/${repairId}`,
    fetcher
  )

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'outline'
      case 'in-progress':
        return 'default'
      case 'awaiting-parts':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {repair && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{repair.repairType}</h3>
              <p className="text-sm text-muted-foreground">
                WO #{repair.workOrderNumber} • {repair.vehicleNumber}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(repair.status)}>{repair.status}</Badge>
                <Badge variant={getPriorityVariant(repair.priority)}>{repair.priority} Priority</Badge>
              </div>
            </div>
            <Wrench className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <DrilldownCardGrid columns={3} gap="sm">
            <DrilldownCard
              title="Estimated Cost"
              value={repair.estimatedCost ? `$${repair.estimatedCost.toFixed(2)}` : 'TBD'}
              icon={<DollarSign className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
            <DrilldownCard
              title="Parts Cost"
              value={`$${repair.partsUsed.reduce((sum, p) => sum + p.unitCost * p.quantity, 0).toFixed(2)}`}
              icon={<Package className="w-3 h-3" />}
              color="warning"
              variant="compact"
            />
            <DrilldownCard
              title="Labor Cost"
              value={`$${repair.laborEntries.reduce((sum, l) => sum + l.hours * l.rate, 0).toFixed(2)}`}
              icon={<Users className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parts">Parts ({repair.partsUsed.length})</TabsTrigger>
              <TabsTrigger value="labor">Labor ({repair.laborEntries.length})</TabsTrigger>
              <TabsTrigger value="contact">Contacts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Repair Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{repair.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Reported Date</p>
                      <p className="font-medium">{new Date(repair.reportedDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reported By</p>
                      <p className="font-medium">{repair.reportedBy}</p>
                    </div>
                    {repair.diagnosisDate && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Diagnosis Date</p>
                          <p className="font-medium">{new Date(repair.diagnosisDate).toLocaleDateString()}</p>
                        </div>
                      </>
                    )}
                    {repair.startDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium">{new Date(repair.startDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {repair.completionDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Date</p>
                        <p className="font-medium">{new Date(repair.completionDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {repair.diagnosisNotes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Diagnosis Notes</p>
                      <p className="text-sm">{repair.diagnosisNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {repair.assignedTechnician && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Assigned Technician
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{repair.assignedTechnician}</p>
                    {repair.technicianPhone && (
                      <a
                        href={`tel:${repair.technicianPhone}`}
                        className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {repair.technicianPhone}
                      </a>
                    )}
                    {repair.technicianEmail && (
                      <a
                        href={`mailto:${repair.technicianEmail}`}
                        className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        {repair.technicianEmail}
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Parts Tab */}
            <TabsContent value="parts" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Parts Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {repair.partsUsed.length > 0 ? (
                    <div className="space-y-3">
                      {repair.partsUsed.map((part, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{part.partName}</p>
                              <p className="text-sm text-muted-foreground">PN: {part.partNumber}</p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Qty: {part.quantity}</span>
                                <span>Unit: ${part.unitCost.toFixed(2)}</span>
                                <span className="font-medium text-foreground">
                                  Total: ${(part.quantity * part.unitCost).toFixed(2)}
                                </span>
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground">
                                  Supplier: {part.supplier}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Contact: {part.supplierContact}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Parts Cost:</span>
                          <span className="text-sm font-bold">
                            $
                            {repair.partsUsed
                              .reduce((sum, p) => sum + p.unitCost * p.quantity, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">No parts used</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labor Tab */}
            <TabsContent value="labor" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Labor Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {repair.laborEntries.length > 0 ? (
                    <div className="space-y-3">
                      {repair.laborEntries.map((entry, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-4 h-4">
                                  <AvatarFallback>
                                    {entry.technicianName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{entry.technicianName}</p>
                                  <p className="text-xs text-muted-foreground">{entry.description}</p>
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {entry.hours} hrs @ ${entry.rate.toFixed(2)}/hr
                                </span>
                                <span className="font-medium">
                                  ${(entry.hours * entry.rate).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="pt-3 border-t">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Labor Cost:</span>
                          <span className="text-sm font-bold">
                            $
                            {repair.laborEntries
                              .reduce((sum, l) => sum + l.hours * l.rate, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No labor entries
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contact" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Reported By</p>
                    <div className="space-y-2">
                      <p className="font-medium">{repair.reportedBy}</p>
                      <a
                        href={`tel:${repair.reportedByPhone}`}
                        className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                      >
                        <Phone className="w-4 h-4" />
                        {repair.reportedByPhone}
                      </a>
                      <a
                        href={`mailto:${repair.reportedByEmail}`}
                        className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        {repair.reportedByEmail}
                      </a>
                    </div>
                  </div>

                  {repair.assignedTechnician && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Assigned Technician</p>
                      <div className="space-y-2">
                        <p className="font-medium">{repair.assignedTechnician}</p>
                        {repair.technicianPhone && (
                          <a
                            href={`tel:${repair.technicianPhone}`}
                            className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                          >
                            <Phone className="w-4 h-4" />
                            {repair.technicianPhone}
                          </a>
                        )}
                        {repair.technicianEmail && (
                          <a
                            href={`mailto:${repair.technicianEmail}`}
                            className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                          >
                            <Mail className="w-4 h-4" />
                            {repair.technicianEmail}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                push({
                  id: `vehicle-${repair.vehicleId}`,
                  type: 'vehicle-detail',
                  label: repair.vehicleNumber,
                  data: { vehicleId: repair.vehicleId },
                })
              }
            >
              <Car className="w-4 h-4 mr-2" />
              View Vehicle
            </Button>
            {repair.actualCost && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  push({
                    id: `repair-cost-breakdown-${repairId}`,
                    type: 'cost-breakdown',
                    label: 'Cost Breakdown',
                    data: {
                      repairId,
                      partsCost: repair.partsUsed.reduce(
                        (sum, p) => sum + p.unitCost * p.quantity,
                        0
                      ),
                      laborCost: repair.laborEntries.reduce(
                        (sum, l) => sum + l.hours * l.rate,
                        0
                      ),
                      totalCost: repair.actualCost,
                    },
                  })
                }
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Cost Breakdown
              </Button>
            )}
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// INSPECTION DETAIL PANEL
// ============================================

interface InspectionDetailPanelProps {
  inspectionId: string
}

export function InspectionDetailPanel({ inspectionId }: InspectionDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: inspection, error, isLoading } = useSWR<InspectionRecord>(
    `/api/maintenance/drilldowns/inspections/${inspectionId}`,
    fetcher
  )

  const getResultVariant = (result: string) => {
    switch (result) {
      case 'pass':
        return 'outline'
      case 'pass-with-advisories':
        return 'secondary'
      case 'fail':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="w-4 h-4" />
      case 'pass-with-advisories':
        return <AlertCircle className="w-4 h-4" />
      case 'fail':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {inspection && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{inspection.inspectionType} Inspection</h3>
              <p className="text-sm text-muted-foreground">
                {inspection.inspectionNumber} • {inspection.vehicleNumber}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={getResultVariant(inspection.overallResult)}>
                  <span className="flex items-center gap-1">
                    {getResultIcon(inspection.overallResult)}
                    {inspection.overallResult}
                  </span>
                </Badge>
                {inspection.score !== undefined && (
                  <Badge variant="outline">{inspection.score}%</Badge>
                )}
              </div>
            </div>
            <ClipboardList className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <DrilldownCardGrid columns={4} gap="sm">
            <DrilldownCard
              title="Passed"
              value={inspection.itemsPassed}
              icon={<CheckCircle className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
            <DrilldownCard
              title="Failed"
              value={inspection.itemsFailed}
              icon={<XCircle className="w-3 h-3" />}
              color="danger"
              variant="compact"
            />
            <DrilldownCard
              title="Advisory"
              value={inspection.itemsAdvisory}
              icon={<AlertCircle className="w-3 h-3" />}
              color="warning"
              variant="compact"
            />
            <DrilldownCard
              title="Total Items"
              value={inspection.itemsInspected}
              icon={<ClipboardList className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">
                Items ({inspection.inspectionItems.length})
              </TabsTrigger>
              <TabsTrigger value="failures">
                Failures ({inspection.failedItems.length})
              </TabsTrigger>
              <TabsTrigger value="inspector">Inspector</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Inspection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Inspection Date</p>
                      <p className="font-medium">
                        {new Date(inspection.inspectionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-medium">{inspection.mileage.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{inspection.location.facilityName}</p>
                    </div>
                    {inspection.nextInspectionDue && (
                      <div>
                        <p className="text-sm text-muted-foreground">Next Due</p>
                        <p className="font-medium">
                          {new Date(inspection.nextInspectionDue).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {inspection.expirationDate && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">Expiration Date</p>
                      <p className="font-medium">
                        {new Date(inspection.expirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {inspection.certificationNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Certification Number</p>
                      <p className="font-medium">{inspection.certificationNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pass Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Inspection Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pass Rate</span>
                      <span className="font-medium">
                        {((inspection.itemsPassed / inspection.itemsInspected) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={(inspection.itemsPassed / inspection.itemsInspected) * 100}
                      className="h-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-sm font-bold text-green-600">{inspection.itemsPassed}</p>
                      <p className="text-muted-foreground">Passed</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-600">
                        {inspection.itemsAdvisory}
                      </p>
                      <p className="text-muted-foreground">Advisory</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-600">{inspection.itemsFailed}</p>
                      <p className="text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Items Tab */}
            <TabsContent value="items" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Inspection Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {inspection.inspectionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 border rounded-lg flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{item.item}</span>
                            <Badge
                              variant={
                                item.result === 'pass'
                                  ? 'outline'
                                  : item.result === 'fail'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                              className="text-xs"
                            >
                              {item.result}
                            </Badge>
                            {item.severity && (
                              <Badge variant={getSeverityVariant(item.severity)} className="text-xs">
                                {item.severity}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Failures Tab */}
            <TabsContent value="failures" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Failed Items & Corrective Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {inspection.failedItems.length > 0 ? (
                    <div className="space-y-3">
                      {inspection.failedItems.map((item, idx) => (
                        <div key={idx} className="p-3 border rounded-lg border-red-200 bg-red-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{item.item}</p>
                                <Badge variant={getSeverityVariant(item.severity)}>
                                  {item.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-sm font-medium mb-1">Corrective Action:</p>
                            <p className="text-sm">{item.correctiveAction}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={
                                  item.actionStatus === 'completed'
                                    ? 'outline'
                                    : item.actionStatus === 'in-progress'
                                      ? 'default'
                                      : 'secondary'
                                }
                                className="text-xs"
                              >
                                {item.actionStatus}
                              </Badge>
                              {item.estimatedCost && (
                                <span className="text-sm text-muted-foreground">
                                  Est. Cost: ${item.estimatedCost.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <CheckCircle className="w-12 h-9 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">No failed items</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspector Tab */}
            <TabsContent value="inspector" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Inspector Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">{inspection.inspector.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cert. #{inspection.inspector.certificationNumber}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`tel:${inspection.inspector.phone}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{inspection.inspector.phone}</p>
                        <p className="text-xs text-muted-foreground">Click to call</p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${inspection.inspector.email}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{inspection.inspector.email}</p>
                        <p className="text-xs text-muted-foreground">Click to email</p>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Inspection Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{inspection.location.facilityName}</p>
                  <p className="text-sm text-muted-foreground">{inspection.location.address}</p>
                  <a
                    href={`tel:${inspection.location.phone}`}
                    className="flex items-center gap-2 text-sm text-blue-800 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {inspection.location.phone}
                  </a>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                push({
                  id: `vehicle-${inspection.vehicleId}`,
                  type: 'vehicle-detail',
                  label: inspection.vehicleNumber,
                  data: { vehicleId: inspection.vehicleId },
                })
              }
            >
              <Car className="w-4 h-4 mr-2" />
              View Vehicle
            </Button>
            {inspection.failedItems.length > 0 && (
              <Button
                className="flex-1"
                onClick={() =>
                  push({
                    id: `create-corrective-actions-${inspectionId}`,
                    type: 'create-corrective-actions',
                    label: 'Create Work Orders',
                    data: { inspectionId, failedItems: inspection.failedItems },
                  })
                }
              >
                <Wrench className="w-4 h-4 mr-2" />
                Create Corrective Work Orders
              </Button>
            )}
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// SERVICE RECORD DETAIL PANEL
// ============================================

interface ServiceRecordDetailPanelProps {
  serviceRecordId: string
}

export function ServiceRecordDetailPanel({ serviceRecordId }: ServiceRecordDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: record, error, isLoading } = useSWR<ServiceHistoryRecord>(
    `/api/maintenance/drilldowns/service-records/${serviceRecordId}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {record && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{record.serviceType}</h3>
              <p className="text-sm text-muted-foreground">WO #{record.workOrderNumber}</p>
              <Badge variant={record.status === 'completed' ? 'outline' : 'destructive'}>
                {record.status}
              </Badge>
            </div>
            <FileText className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Cost Breakdown */}
          <DrilldownCardGrid columns={3} gap="sm">
            <DrilldownCard
              title="Labor Cost"
              value={`$${record.laborCost.toFixed(2)}`}
              icon={<Users className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
            <DrilldownCard
              title="Parts Cost"
              value={`$${record.partsCost.toFixed(2)}`}
              icon={<Package className="w-3 h-3" />}
              color="warning"
              variant="compact"
            />
            <DrilldownCard
              title="Total Cost"
              value={`$${record.totalCost.toFixed(2)}`}
              icon={<DollarSign className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="warranty">Warranty</TabsTrigger>
              <TabsTrigger value="technician">Technician</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{record.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Date</p>
                      <p className="font-medium">
                        {new Date(record.serviceDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-medium">{record.mileage.toLocaleString()} mi</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Labor Hours</p>
                      <p className="font-medium">{record.laborHours} hrs</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Labor Rate</p>
                      <p className="font-medium">
                        ${(record.laborCost / record.laborHours).toFixed(2)}/hr
                      </p>
                    </div>
                  </div>

                  {record.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{record.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Warranty Tab */}
            <TabsContent value="warranty" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Warranty Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {record.warranty && record.warranty.active ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <p className="font-medium">Warranty Active</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Provider</p>
                          <p className="font-medium">{record.warranty.provider}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Coverage</p>
                          <p className="font-medium">{record.warranty.coverage}</p>
                        </div>
                        {record.warranty.expirationDate && (
                          <div>
                            <p className="text-sm text-muted-foreground">Expiration Date</p>
                            <p className="font-medium">
                              {new Date(record.warranty.expirationDate).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {record.warranty.expirationMileage && (
                          <div>
                            <p className="text-sm text-muted-foreground">Expiration Mileage</p>
                            <p className="font-medium">
                              {record.warranty.expirationMileage.toLocaleString()} mi
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <XCircle className="w-12 h-9 text-gray-600 mx-auto mb-2" />
                      <p className="text-muted-foreground">No active warranty</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Technician Tab */}
            <TabsContent value="technician" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Technician Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="font-medium text-sm">{record.technician}</p>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`tel:${record.technicianPhone}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{record.technicianPhone}</p>
                        <p className="text-xs text-muted-foreground">Click to call</p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${record.technicianEmail}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{record.technicianEmail}</p>
                        <p className="text-xs text-muted-foreground">Click to email</p>
                      </div>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// SERVICE VENDOR DETAIL PANEL
// ============================================

interface ServiceVendorDetailPanelProps {
  vendorId: string
}

export function ServiceVendorDetailPanel({ vendorId }: ServiceVendorDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: vendor, error, isLoading } = useSWR<ServiceVendor>(
    `/api/maintenance/drilldowns/vendors/${vendorId}`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error}>
      {vendor && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold">{vendor.vendorName}</h3>
              <p className="text-sm text-muted-foreground">{vendor.vendorType}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {vendor.averageRating.toFixed(1)} ★ Rating
                </Badge>
                <Badge variant="secondary">{vendor.activeContracts} Active Contracts</Badge>
              </div>
            </div>
            <Building className="w-12 h-9 text-muted-foreground" />
          </div>

          {/* Quick Stats */}
          <DrilldownCardGrid columns={3} gap="sm">
            <DrilldownCard
              title="Services YTD"
              value={vendor.totalServicesYTD}
              icon={<Wrench className="w-3 h-3" />}
              color="primary"
              variant="compact"
            />
            <DrilldownCard
              title="Total Cost YTD"
              value={`$${vendor.totalCostYTD.toLocaleString()}`}
              icon={<DollarSign className="w-3 h-3" />}
              color="success"
              variant="compact"
            />
            <DrilldownCard
              title="Response Time"
              value={vendor.responseTime}
              icon={<Clock className="w-3 h-3" />}
              color="warning"
              variant="compact"
            />
          </DrilldownCardGrid>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline">
                        <Shield className="w-3 h-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {vendor.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{vendor.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Primary Contact</p>
                    <p className="font-medium">{vendor.contactPerson}</p>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{vendor.phone}</p>
                        <p className="text-xs text-muted-foreground">Click to call</p>
                      </div>
                    </a>

                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{vendor.email}</p>
                        <p className="text-xs text-muted-foreground">Click to email</p>
                      </div>
                    </a>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="text-sm">{vendor.address}</p>
                  </div>

                  {vendor.website && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Website</p>
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-800 hover:underline"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Contracts</p>
                      <p className="font-medium">{vendor.activeContracts}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">{vendor.paymentTerms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                      <p className="font-medium">{vendor.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                      <p className="font-medium">{vendor.averageRating.toFixed(1)} / 5.0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Services YTD</p>
                      <p className="text-sm font-bold">{vendor.totalServicesYTD}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cost YTD</p>
                      <p className="text-sm font-bold">
                        ${vendor.totalCostYTD.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Cost per Service</p>
                    <p className="text-sm font-medium">
                      ${(vendor.totalCostYTD / vendor.totalServicesYTD).toFixed(2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// EXCEL-STYLE DRILLDOWN VIEWS
// ============================================


// ============================================
// GARAGE BAYS MATRIX VIEW
// ============================================

interface GarageBayMatrixRow {
  id: string
  bayNumber: string
  status: 'occupied' | 'available' | 'maintenance' | 'reserved'
  vehicleNumber?: string
  workOrderNumber?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  startTime?: string
  estimatedCompletion?: string
  progressPercentage?: number
  technicianName?: string
  partsStatus?: 'ready' | 'partial' | 'pending' | 'backordered'
}

export function GarageBaysMatrixPanel() {
  const { data: baysData, error, isLoading } = useSWR<{ data: GarageBayMatrixRow[] }>(
    '/api/maintenance/drilldowns/garage-bays/matrix',
    fetcher
  )

  const columns: ExcelColumn<GarageBayMatrixRow>[] = [
    {
      key: 'bayNumber',
      header: 'Bay #',
      sortable: true,
      filterable: true,
      width: '80px',
      className: 'font-mono font-bold',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Occupied', value: 'occupied' },
        { label: 'Available', value: 'available' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Reserved', value: 'reserved' },
      ],
      colorRules: [
        { condition: (v) => v === 'occupied', className: 'bg-blue-50 dark:bg-blue-950' },
        { condition: (v) => v === 'available', className: 'bg-green-50 dark:bg-green-950' },
        { condition: (v) => v === 'maintenance', className: 'bg-orange-50 dark:bg-orange-950' },
        { condition: (v) => v === 'reserved', className: 'bg-yellow-50 dark:bg-yellow-950' },
      ],
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      filterable: true,
      render: (value) => value || '-',
    },
    {
      key: 'workOrderNumber',
      header: 'Work Order',
      sortable: true,
      filterable: true,
      render: (value) => value || '-',
      className: 'font-mono',
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
      colorRules: [
        { condition: (v) => v === 'critical', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200' },
        { condition: (v) => v === 'high', className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200' },
        { condition: (v) => v === 'medium', className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v === 'low', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
      ],
    },
    {
      key: 'startTime',
      header: 'Start',
      sortable: true,
      type: 'date',
      width: '140px',
    },
    {
      key: 'estimatedCompletion',
      header: 'ETA',
      sortable: true,
      type: 'date',
      width: '140px',
    },
    {
      key: 'progressPercentage',
      header: 'Progress %',
      sortable: true,
      type: 'percentage',
      width: '110px',
      cellClassName: 'font-semibold',
      colorRules: [
        { condition: (v) => v >= 75, className: 'text-green-600 dark:text-green-400' },
        { condition: (v) => v >= 50 && v < 75, className: 'text-blue-800 dark:text-blue-700' },
        { condition: (v) => v >= 25 && v < 50, className: 'text-yellow-600 dark:text-yellow-400' },
        { condition: (v) => v < 25, className: 'text-orange-600 dark:text-orange-400' },
      ],
    },
    {
      key: 'technicianName',
      header: 'Technician',
      sortable: true,
      filterable: true,
    },
    {
      key: 'partsStatus',
      header: 'Parts Status',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Ready', value: 'ready' },
        { label: 'Partial', value: 'partial' },
        { label: 'Pending', value: 'pending' },
        { label: 'Backordered', value: 'backordered' },
      ],
      colorRules: [
        { condition: (v) => v === 'ready', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
        { condition: (v) => v === 'partial', className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v === 'pending', className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200' },
        { condition: (v) => v === 'backordered', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200' },
      ],
    },
  ]

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <ExcelStyleTable
        data={baysData?.data || []}
        columns={columns}
        title="Garage Bays - Full Matrix View"
        subtitle="All garage bays with current work orders and status"
        enableSorting
        enableFiltering
        enableExport
        enableColumnVisibility
        exportFilename="garage-bays-matrix"
        pageSize={50}
        compact={false}
        stickyHeader
        striped
        highlightOnHover
      />
    </DrilldownContent>
  )
}

// ============================================
// WORK ORDERS LIST VIEW
// ============================================

interface WorkOrderListRow {
  id: string
  woNumber: string
  vehicleNumber: string
  type: 'preventive' | 'corrective' | 'inspection' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled'
  createdDate: string
  dueDate: string
  assignedTo: string
  estimatedCost: number
  actualCost?: number
  partsStatus: 'ready' | 'partial' | 'pending' | 'backordered'
}

export function WorkOrdersListPanel() {
  const { data: workOrdersData, error, isLoading } = useSWR<{ data: WorkOrderListRow[] }>(
    '/api/maintenance/drilldowns/work-orders/list',
    fetcher
  )

  const columns: ExcelColumn<WorkOrderListRow>[] = [
    {
      key: 'woNumber',
      header: 'WO #',
      sortable: true,
      filterable: true,
      width: '100px',
      className: 'font-mono font-semibold',
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      filterable: true,
      width: '100px',
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Preventive', value: 'preventive' },
        { label: 'Corrective', value: 'corrective' },
        { label: 'Inspection', value: 'inspection' },
        { label: 'Emergency', value: 'emergency' },
      ],
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Critical', value: 'critical' },
        { label: 'High', value: 'high' },
        { label: 'Medium', value: 'medium' },
        { label: 'Low', value: 'low' },
      ],
      colorRules: [
        { condition: (v) => v === 'critical', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200 font-bold' },
        { condition: (v) => v === 'high', className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200' },
        { condition: (v) => v === 'medium', className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v === 'low', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
      ],
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'On Hold', value: 'on-hold' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      colorRules: [
        { condition: (v) => v === 'completed', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
        { condition: (v) => v === 'in-progress', className: 'bg-blue-100 dark:bg-blue-950', textClassName: 'text-blue-800 dark:text-blue-200' },
        { condition: (v) => v === 'on-hold', className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v === 'cancelled', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200' },
      ],
    },
    {
      key: 'createdDate',
      header: 'Created',
      sortable: true,
      type: 'date',
      width: '140px',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      type: 'date',
      width: '140px',
      colorRules: [
        {
          condition: (v) => new Date(v) < new Date(),
          className: 'bg-red-50 dark:bg-red-950',
          textClassName: 'text-red-800 dark:text-red-200 font-semibold',
        },
        {
          condition: (v) => {
            const daysUntil = Math.ceil((new Date(v).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            return daysUntil <= 7 && daysUntil >= 0
          },
          className: 'bg-yellow-50 dark:bg-yellow-950',
          textClassName: 'text-yellow-800 dark:text-yellow-200',
        },
      ],
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: true,
      filterable: true,
      width: '140px',
    },
    {
      key: 'estimatedCost',
      header: 'Est. Cost',
      sortable: true,
      type: 'currency',
      width: '110px',
      aggregate: 'sum',
    },
    {
      key: 'actualCost',
      header: 'Actual Cost',
      sortable: true,
      type: 'currency',
      width: '110px',
      aggregate: 'sum',
      render: (value) => value != null ? `$${Number(value).toFixed(2)}` : '-',
    },
    {
      key: 'partsStatus',
      header: 'Parts Status',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Ready', value: 'ready' },
        { label: 'Partial', value: 'partial' },
        { label: 'Pending', value: 'pending' },
        { label: 'Backordered', value: 'backordered' },
      ],
      colorRules: [
        { condition: (v) => v === 'ready', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
        { condition: (v) => v === 'partial', className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v === 'pending', className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200' },
        { condition: (v) => v === 'backordered', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200' },
      ],
    },
  ]

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <ExcelStyleTable
        data={workOrdersData?.data || []}
        columns={columns}
        title="Work Orders - Complete List"
        subtitle="All maintenance work orders with full details"
        enableSorting
        enableFiltering
        enableExport
        enableColumnVisibility
        enableAggregates
        exportFilename="work-orders-complete"
        pageSize={50}
        compact={false}
        stickyHeader
        striped
        highlightOnHover
      />
    </DrilldownContent>
  )
}

// ============================================
// PM SCHEDULES MATRIX VIEW
// ============================================

interface PMScheduleMatrixRow {
  id: string
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  serviceType: string
  lastServiceDate?: string
  lastServiceMileage?: number
  currentMileage: number
  milesSinceService?: number
  dueDate: string
  daysUntilDue: number
  status: 'upcoming' | 'due-soon' | 'overdue' | 'completed'
  assignedShop: string
}

export function PMSchedulesMatrixPanel() {
  const { data: pmData, error, isLoading } = useSWR<{ data: PMScheduleMatrixRow[] }>(
    '/api/maintenance/drilldowns/pm-schedules/matrix',
    fetcher
  )

  const columns: ExcelColumn<PMScheduleMatrixRow>[] = [
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      filterable: true,
      width: '100px',
      className: 'font-mono',
    },
    {
      key: 'vehicleMake',
      header: 'Make/Model',
      sortable: true,
      filterable: true,
      render: (value, row) => `${row.vehicleMake} ${row.vehicleModel}`,
    },
    {
      key: 'serviceType',
      header: 'Service Type',
      sortable: true,
      filterable: true,
    },
    {
      key: 'lastServiceDate',
      header: 'Last Service',
      sortable: true,
      type: 'date',
      width: '140px',
      render: (value) => value ? formatCellValue(value, 'date') : 'N/A',
    },
    {
      key: 'milesSinceService',
      header: 'Miles Since',
      sortable: true,
      type: 'number',
      width: '110px',
      render: (value) => value != null ? `${Number(value).toLocaleString()} mi` : '-',
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      type: 'date',
      width: '140px',
    },
    {
      key: 'daysUntilDue',
      header: 'Days Until Due',
      sortable: true,
      type: 'number',
      width: '130px',
      colorRules: [
        { condition: (v) => v < 0, className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200 font-bold' },
        { condition: (v) => v >= 0 && v <= 7, className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200 font-semibold' },
        { condition: (v) => v > 7 && v <= 30, className: 'bg-yellow-100 dark:bg-yellow-950', textClassName: 'text-yellow-800 dark:text-yellow-200' },
        { condition: (v) => v > 30, className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
      ],
      render: (value) => {
        if (value < 0) return `${Math.abs(value)} days overdue`
        return `${value} days`
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      filterable: true,
      type: 'badge',
      filterOptions: [
        { label: 'Overdue', value: 'overdue' },
        { label: 'Due Soon', value: 'due-soon' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Completed', value: 'completed' },
      ],
      colorRules: [
        { condition: (v) => v === 'overdue', className: 'bg-red-100 dark:bg-red-950', textClassName: 'text-red-800 dark:text-red-200 font-bold' },
        { condition: (v) => v === 'due-soon', className: 'bg-orange-100 dark:bg-orange-950', textClassName: 'text-orange-800 dark:text-orange-200 font-semibold' },
        { condition: (v) => v === 'upcoming', className: 'bg-green-100 dark:bg-green-950', textClassName: 'text-green-800 dark:text-green-200' },
        { condition: (v) => v === 'completed', className: 'bg-blue-100 dark:bg-blue-950', textClassName: 'text-blue-800 dark:text-blue-200' },
      ],
    },
    {
      key: 'assignedShop',
      header: 'Assigned Shop',
      sortable: true,
      filterable: true,
    },
  ]

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <ExcelStyleTable
        data={pmData?.data || []}
        columns={columns}
        title="PM Schedules - Full Matrix"
        subtitle="All preventive maintenance schedules with due dates and status"
        enableSorting
        enableFiltering
        enableExport
        enableColumnVisibility
        exportFilename="pm-schedules-matrix"
        pageSize={50}
        compact={false}
        stickyHeader
        striped
        highlightOnHover
        initialSort={[{ key: 'daysUntilDue', direction: 'asc' }]}
      />
    </DrilldownContent>
  )
}

// ============================================
// PARTS INVENTORY VIEW
// ============================================

interface PartsInventoryRow {
  id: string
  partNumber: string
  description: string
  quantity: number
  minStock: number
  maxStock: number
  location: string
  unitCost: number
  totalValue: number
  supplier: string
  lastOrderDate?: string
}

export function PartsInventoryPanel() {
  const { data: partsData, error, isLoading } = useSWR<{ data: PartsInventoryRow[] }>(
    '/api/maintenance/drilldowns/parts/inventory',
    fetcher
  )

  const columns: ExcelColumn<PartsInventoryRow>[] = [
    {
      key: 'partNumber',
      header: 'Part #',
      sortable: true,
      filterable: true,
      width: '120px',
      className: 'font-mono font-semibold',
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      filterable: true,
    },
    {
      key: 'quantity',
      header: 'Qty',
      sortable: true,
      type: 'number',
      width: '80px',
      cellClassName: (row) => {
        if (row.quantity <= row.minStock) return 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 font-bold'
        if (row.quantity <= row.minStock * 1.5) return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 font-semibold'
        return 'font-semibold'
      },
    },
    {
      key: 'minStock',
      header: 'Min',
      sortable: true,
      type: 'number',
      width: '70px',
      className: 'text-muted-foreground',
    },
    {
      key: 'maxStock',
      header: 'Max',
      sortable: true,
      type: 'number',
      width: '70px',
      className: 'text-muted-foreground',
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      filterable: true,
      width: '120px',
    },
    {
      key: 'unitCost',
      header: 'Unit Cost',
      sortable: true,
      type: 'currency',
      width: '100px',
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      sortable: true,
      type: 'currency',
      width: '120px',
      aggregate: 'sum',
      className: 'font-semibold',
      accessor: (row) => row.quantity * row.unitCost,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      sortable: true,
      filterable: true,
    },
    {
      key: 'lastOrderDate',
      header: 'Last Order',
      sortable: true,
      type: 'date',
      width: '140px',
      render: (value) => value ? formatCellValue(value, 'date') : 'Never',
    },
  ]

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <ExcelStyleTable
        data={partsData?.data || []}
        columns={columns}
        title="Parts Inventory - Full Database"
        subtitle="Complete parts inventory with stock levels and values"
        enableSorting
        enableFiltering
        enableExport
        enableColumnVisibility
        enableAggregates
        exportFilename="parts-inventory"
        pageSize={50}
        compact={false}
        stickyHeader
        striped
        highlightOnHover
      />
    </DrilldownContent>
  )
}

// ============================================
// SERVICE HISTORY VIEW
// ============================================

interface ServiceHistoryRow {
  id: string
  date: string
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  serviceType: string
  mileage: number
  technician: string
  partsUsed: string
  laborHours: number
  partsCost: number
  laborCost: number
  totalCost: number
  notes?: string
}

export function ServiceHistoryPanel() {
  const { data: historyData, error, isLoading } = useSWR<{ data: ServiceHistoryRow[] }>(
    '/api/maintenance/drilldowns/service-history',
    fetcher
  )

  const columns: ExcelColumn<ServiceHistoryRow>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      type: 'date',
      width: '140px',
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      sortable: true,
      filterable: true,
      width: '100px',
      className: 'font-mono',
    },
    {
      key: 'vehicleMake',
      header: 'Make/Model',
      sortable: true,
      filterable: true,
      render: (value, row) => `${row.vehicleMake} ${row.vehicleModel}`,
    },
    {
      key: 'serviceType',
      header: 'Service Type',
      sortable: true,
      filterable: true,
    },
    {
      key: 'mileage',
      header: 'Mileage',
      sortable: true,
      type: 'number',
      width: '100px',
      render: (value) => `${Number(value).toLocaleString()} mi`,
    },
    {
      key: 'technician',
      header: 'Technician',
      sortable: true,
      filterable: true,
    },
    {
      key: 'partsUsed',
      header: 'Parts Used',
      sortable: false,
      filterable: true,
    },
    {
      key: 'laborHours',
      header: 'Labor Hrs',
      sortable: true,
      type: 'number',
      width: '100px',
      aggregate: 'sum',
      render: (value) => `${Number(value).toFixed(1)} hrs`,
    },
    {
      key: 'partsCost',
      header: 'Parts Cost',
      sortable: true,
      type: 'currency',
      width: '110px',
      aggregate: 'sum',
    },
    {
      key: 'laborCost',
      header: 'Labor Cost',
      sortable: true,
      type: 'currency',
      width: '110px',
      aggregate: 'sum',
    },
    {
      key: 'totalCost',
      header: 'Total Cost',
      sortable: true,
      type: 'currency',
      width: '120px',
      aggregate: 'sum',
      className: 'font-semibold bg-blue-50 dark:bg-blue-950',
    },
  ]

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <ExcelStyleTable
        data={historyData?.data || []}
        columns={columns}
        title="Service History - Complete Records"
        subtitle="Full maintenance history with costs and details"
        enableSorting
        enableFiltering
        enableExport
        enableColumnVisibility
        enableAggregates
        exportFilename="service-history"
        pageSize={50}
        compact={false}
        stickyHeader
        striped
        highlightOnHover
        initialSort={[{ key: 'date', direction: 'desc' }]}
      />
    </DrilldownContent>
  )
}

// Helper function for formatting (reused from ExcelStyleTable)
function formatCellValue(value: any, type?: string): React.ReactNode {
  if (value == null || value === '') return '-'

  switch (type) {
    case 'currency':
      return `$${Number(value).toFixed(2)}`
    case 'percentage':
      return `${Number(value).toFixed(1)}%`
    case 'date':
      return new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    case 'number':
      return Number(value).toLocaleString()
    default:
      return String(value)
  }
}
