/**
 * WorkOrderDetailPanel - Level 2 drilldown for work order details
 * Shows comprehensive work order information with parts, labor breakdown, timeline, and related records
 */

import {
  Wrench,
  Calendar,
  DollarSign,
  Clock,
  Package,
  Users,
  AlertCircle,
  FileText,
  History,
  TrendingUp,
  Car,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Timer,
  Building2,
  Hash,
  FileSearch,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { EmailButton } from '@/components/email/EmailButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format-helpers'

interface WorkOrderDetailPanelProps {
  workOrderId: string
}

interface Part {
  id: string
  name: string
  part_number?: string
  quantity: number
  unit_cost: number
  supplier?: string
  supplier_contact?: string
  delivery_date?: string
  status?: string
}

interface LaborEntry {
  id: string
  technician_name: string
  technician_id?: string
  technician_avatar?: string
  role?: string
  hours: number
  rate: number
  date?: string
  task_description?: string
}

interface TimelineEvent {
  id: string
  event_type: string
  description: string
  timestamp: string
  user_name?: string
  user_avatar?: string
  metadata?: Record<string, any>
}

interface RelatedRecord {
  id: string
  type: 'inspection' | 'incident' | 'maintenance'
  title: string
  date: string
  status?: string
}

interface MaintenanceHistoryItem {
  id: string
  work_order_number: string
  date: string
  type: string
  description: string
  cost: number
  status: string
}

export function WorkOrderDetailPanel({ workOrderId }: WorkOrderDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Main work order data
  const { data: workOrder, error, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}`,
    apiFetcher
  )

  // Parts data
  const { data: parts } = useSWR<Part[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/parts` : null,
    apiFetcher
  )

  // Labor data
  const { data: labor } = useSWR<LaborEntry[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/labor` : null,
    apiFetcher
  )

  // Timeline/audit trail
  const { data: timeline } = useSWR<TimelineEvent[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/timeline` : null,
    apiFetcher
  )

  // Related records (inspections, incidents)
  const { data: relatedRecords } = useSWR<RelatedRecord[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/related` : null,
    apiFetcher
  )

  // Vehicle maintenance history
  const { data: maintenanceHistory } = useSWR<MaintenanceHistoryItem[]>(
    workOrder?.vehicle_id ? `/api/vehicles/${workOrder.vehicle_id}/maintenance-history` : null,
    apiFetcher
  )

  const handleViewParts = () => {
    push({
      id: `work-order-parts-${workOrderId}`,
      type: 'work-order-parts',
      label: 'Parts Breakdown',
      data: { workOrderId, workOrderNumber: workOrder?.work_order_number },
    })
  }

  const handleViewLabor = () => {
    push({
      id: `work-order-labor-${workOrderId}`,
      type: 'work-order-labor',
      label: 'Labor Details',
      data: { workOrderId, workOrderNumber: workOrder?.work_order_number },
    })
  }

  const handleViewVehicle = () => {
    if (workOrder?.vehicle_id) {
      push({
        id: `vehicle-${workOrder.vehicle_id}`,
        type: 'vehicle',
        label: workOrder.vehicle_name || 'Vehicle Details',
        data: { vehicleId: workOrder.vehicle_id },
      })
    }
  }

  const handleViewRelatedRecord = (record: RelatedRecord) => {
    push({
      id: `${record.type}-${record.id}`,
      type: record.type,
      label: record.title,
      data: { id: record.id, recordType: record.type },
    })
  }

  const getStatusColor = (status: string | undefined): 'default' | 'destructive' | 'outline' | 'secondary' | null => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default'
      case 'in_progress':
      case 'in progress':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string | undefined): 'default' | 'destructive' | 'outline' | 'secondary' | null => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
      case 'in progress':
        return <Clock className="h-5 w-5 text-emerald-400" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-[var(--text-tertiary)]" />
    }
  }

  const partsArr = Array.isArray(parts) ? parts : []
  const laborArr = Array.isArray(labor) ? labor : []
  const timelineArr = Array.isArray(timeline) ? timeline : []
  const relatedArr = Array.isArray(relatedRecords) ? relatedRecords : []
  const historyArr = Array.isArray(maintenanceHistory) ? maintenanceHistory : []

  const calculatedPartsCost = partsArr.reduce((sum, part) => sum + (part.quantity * part.unit_cost || 0), 0)
  const calculatedLaborCost = laborArr.reduce((sum, entry) => sum + (entry.hours * entry.rate || 0), 0)
  // Prefer direct cost fields from the work order over calculated sums
  const totalPartsCost = Number(workOrder?.parts_cost) || calculatedPartsCost
  const totalLaborCost = Number(workOrder?.labor_cost) || calculatedLaborCost
  const totalCost = Number(workOrder?.total_cost) || (totalPartsCost + totalLaborCost)

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {workOrder && (
        <div className="space-y-2">
          {/* Work Order Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">WO #{workOrder.work_order_number}</h3>
                {workOrder.is_emergency && (
                  <Badge variant="destructive" className="animate-pulse text-xs">
                    <ShieldAlert className="w-3 h-3 mr-1" />
                    EMERGENCY
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{workOrder.title}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getStatusColor(workOrder.status)}>
                  {workOrder.status}
                </Badge>
                <Badge variant={getPriorityColor(workOrder.priority)}>
                  {workOrder.priority} Priority
                </Badge>
                {workOrder.type && (
                  <Badge variant="outline">
                    {formatEnum(workOrder.type)}
                  </Badge>
                )}
                {workOrder.category && (
                  <WOCategoryBadge category={workOrder.category} />
                )}
                {workOrder.quality_check_passed != null && (
                  <Badge variant={workOrder.quality_check_passed ? 'default' : 'destructive'} className={workOrder.quality_check_passed ? 'bg-green-600' : ''}>
                    {workOrder.quality_check_passed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    QC {workOrder.quality_check_passed ? 'Pass' : 'Fail'}
                  </Badge>
                )}
              </div>
            </div>
            <Wrench className="h-9 w-12 text-[var(--text-secondary)]" />
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="cursor-pointer hover:border-white/[0.12] transition-colors" onClick={handleViewParts}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Parts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {formatCurrency(totalPartsCost)}
                </div>
                {partsArr.length > 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {partsArr.length} item{partsArr.length !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-white/[0.12] transition-colors" onClick={handleViewLabor}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {formatCurrency(totalLaborCost)}
                </div>
                {laborArr.length > 0 && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {laborArr.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hrs
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-primary">
                  {formatCurrency(totalCost)}
                </div>
                {workOrder.estimated_cost && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Est: {formatCurrency(workOrder.estimated_cost)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parts">Parts ({partsArr.length || 0})</TabsTrigger>
              <TabsTrigger value="labor">Labor ({laborArr.length || 0})</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-2">
              {/* Work Order Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Vehicle</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{workOrder.vehicle_name || '—'}</p>
                        {workOrder.vehicle_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleViewVehicle}
                            className="h-6 px-2"
                          >
                            <Car className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Type</p>
                      <p className="font-medium capitalize">
                        {workOrder.type || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Assigned To</p>
                      <p className="font-medium">{workOrder.assigned_to_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Created By</p>
                      <p className="font-medium">{workOrder.requested_by_name || '—'}</p>
                    </div>
                    {workOrder.category && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Category</p>
                        <WOCategoryBadge category={workOrder.category} />
                      </div>
                    )}
                    {workOrder.subcategory && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Subcategory</p>
                        <p className="font-medium capitalize">{workOrder.subcategory.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {workOrder.facility_id && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Facility
                        </p>
                        <p className="font-medium">{workOrder.facility_id}</p>
                      </div>
                    )}
                    {workOrder.bay_number && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Bay Number
                        </p>
                        <p className="font-medium">{workOrder.bay_number}</p>
                      </div>
                    )}
                    {workOrder.downtime_hours != null && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          Downtime
                        </p>
                        <p className="font-medium">{Number(workOrder.downtime_hours).toFixed(1)} hours</p>
                      </div>
                    )}
                    {workOrder.driver_id && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Driver</p>
                        <p className="font-medium">{workOrder.driver_id}</p>
                      </div>
                    )}
                    {workOrder.vendor_id && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Vendor</p>
                        <p className="font-medium">{workOrder.vendor_id}</p>
                      </div>
                    )}
                    {workOrder.external_reference && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">External Reference</p>
                        <p className="font-medium font-mono text-xs">{workOrder.external_reference}</p>
                      </div>
                    )}
                    {workOrder.location && (
                      <div className="col-span-2">
                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Location
                        </p>
                        <p className="font-medium">{workOrder.location}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Created</span>
                    <span className="font-medium">
                      {formatDate(workOrder.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scheduled</span>
                    <span className="font-medium">
                      {workOrder.scheduled_start ? formatDate(workOrder.scheduled_start) : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Started</span>
                    <span className="font-medium">
                      {workOrder.actual_start ? formatDate(workOrder.actual_start) : 'Not started'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium">
                      {workOrder.completed_at
                        ? formatDate(workOrder.completed_at)
                        : workOrder.completed_date
                          ? formatDate(workOrder.completed_date)
                          : 'Not completed'}
                    </span>
                  </div>
                  {workOrder.due_date && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-medium">Due Date</span>
                      <span className={`font-medium ${new Date(workOrder.due_date) < new Date() && workOrder.status !== 'completed' ? 'text-destructive' : ''}`}>
                        {formatDate(workOrder.due_date)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              {workOrder.status === 'in_progress' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Completion</span>
                        <span className="font-medium">{workOrder.progress || 0}%</span>
                      </div>
                      <Progress value={workOrder.progress || 0} />
                      {workOrder.estimated_completion && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          Estimated completion:{' '}
                          {formatDate(workOrder.estimated_completion)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              {workOrder.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{workOrder.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Root Cause & Resolution */}
              {(workOrder.root_cause || workOrder.resolution_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSearch className="h-5 w-5" />
                      Diagnosis & Resolution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {workOrder.root_cause && (
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Root Cause</p>
                        <p className="text-sm bg-[var(--surface-glass)] rounded-md p-3 whitespace-pre-wrap">{workOrder.root_cause}</p>
                      </div>
                    )}
                    {workOrder.resolution_notes && (
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Resolution Notes</p>
                        <p className="text-sm bg-[var(--surface-glass)] rounded-md p-3 whitespace-pre-wrap">{workOrder.resolution_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Issues/Notes */}
              {workOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof workOrder.notes === 'string' ? (
                      <p className="text-sm whitespace-pre-wrap">{workOrder.notes}</p>
                    ) : Array.isArray(workOrder.notes) ? (
                      <ul className="space-y-2">
                        {workOrder.notes.map((note: any, idx: number) => (
                          <li key={idx} className="p-2 rounded bg-[var(--surface-glass)] text-sm">
                            <p className="font-medium">{note.author}</p>
                            <p className="text-[var(--text-secondary)]">{note.text}</p>
                            {note.timestamp && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {formatDateTime(note.timestamp)}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Parts Tab */}
            <TabsContent value="parts" className="space-y-2">
              {partsArr.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {partsArr.map((part) => (
                      <Card key={part.id}>
                        <CardContent className="p-2">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-[var(--text-secondary)]" />
                                <span className="font-medium">{part.name}</span>
                              </div>
                              {part.status && (
                                <Badge variant={part.status === 'delivered' ? 'default' : 'secondary'}>
                                  {formatEnum(part.status)}
                                </Badge>
                              )}
                            </div>

                            {part.part_number && (
                              <p className="text-sm text-[var(--text-secondary)]">
                                Part #: {part.part_number}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Quantity</p>
                                <p className="font-medium">{part.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Unit Cost</p>
                                <p className="font-medium">{formatCurrency(part.unit_cost)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Total</p>
                                <p className="font-medium text-primary">
                                  {formatCurrency((part.quantity * part.unit_cost) || 0)}
                                </p>
                              </div>
                            </div>

                            {(part.supplier || part.delivery_date) && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                {part.supplier && (
                                  <div>
                                    <p className="text-[var(--text-secondary)]">Supplier</p>
                                    <p className="font-medium">{part.supplier}</p>
                                    {part.supplier_contact && (
                                      <p className="text-[var(--text-secondary)]">{part.supplier_contact}</p>
                                    )}
                                  </div>
                                )}
                                {part.delivery_date && (
                                  <div>
                                    <p className="text-[var(--text-secondary)]">Delivery Date</p>
                                    <p className="font-medium">
                                      {formatDate(part.delivery_date)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardContent className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Parts Cost</span>
                        <span className="text-sm font-bold text-primary">
                          {formatCurrency(totalPartsCost)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-9 w-12 mx-auto text-[var(--text-secondary)] mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No parts recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Labor Tab */}
            <TabsContent value="labor" className="space-y-2">
              {laborArr.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {laborArr.map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="p-2">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={entry.technician_avatar} alt={entry.technician_name} />
                                  <AvatarFallback>
                                    {entry.technician_name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{entry.technician_name}</p>
                                  <p className="text-sm text-[var(--text-secondary)]">{entry.role || 'Technician'}</p>
                                </div>
                              </div>
                            </div>

                            {entry.task_description && (
                              <p className="text-sm text-[var(--text-secondary)]">
                                {entry.task_description}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Hours</p>
                                <p className="font-medium">{entry.hours?.toFixed(1) || '0.0'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Rate</p>
                                <p className="font-medium">{formatCurrency(entry.rate)}/hr</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-secondary)]">Total</p>
                                <p className="font-medium text-primary">
                                  {formatCurrency((entry.hours * entry.rate) || 0)}
                                </p>
                              </div>
                            </div>

                            {entry.date && (
                              <p className="text-xs text-[var(--text-secondary)] pt-2 border-t">
                                {formatDate(entry.date)}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardContent className="p-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Hours</span>
                          <span className="font-semibold">
                            {laborArr.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hrs
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold">Total Labor Cost</span>
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(totalLaborCost)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-9 w-12 mx-auto text-[var(--text-secondary)] mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No labor entries recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-2">
              {timelineArr.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {timelineArr.map((event, index) => (
                        <div key={event.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 p-2">
                              {getStatusIcon(event.event_type)}
                            </div>
                            {index < timelineArr.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{event.description}</p>
                                {event.user_name && (
                                  <p className="text-sm text-[var(--text-secondary)]">by {event.user_name}</p>
                                )}
                              </div>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {formatDateTime(event.timestamp)}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-[var(--surface-glass)] rounded text-xs">
                                {Object.entries(event.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-9 w-12 mx-auto text-[var(--text-secondary)] mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No timeline events recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-2">
              {/* Related Records */}
              {relatedArr.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Related Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relatedArr.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 rounded border hover:bg-[var(--surface-glass)] cursor-pointer transition-colors"
                          onClick={() => handleViewRelatedRecord(record)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{formatEnum(record.type)}</p>
                              <p className="text-sm text-[var(--text-secondary)]">{record.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-[var(--text-secondary)]">
                                {formatDate(record.date)}
                              </p>
                              {record.status && (
                                <Badge variant="outline" className="mt-1">
                                  {formatEnum(record.status)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Maintenance History */}
              {historyArr.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Vehicle Maintenance History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {historyArr.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">WO #{item.work_order_number}</p>
                                <Badge variant="outline">
                                  {formatEnum(item.type)}
                                </Badge>
                              </div>
                              <p className="text-sm text-[var(--text-secondary)] mt-1">
                                {item.description}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium">{formatCurrency(item.cost)}</p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {formatDate(item.date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {historyArr.length > 5 && (
                        <p className="text-sm text-center text-[var(--text-secondary)] pt-2">
                          +{historyArr.length - 5} more records
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {relatedArr.length === 0 &&
                historyArr.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-9 w-12 mx-auto text-[var(--text-secondary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">No related records found</p>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={handleViewParts} className="w-full">
              <Package className="h-4 w-4 mr-2" />
              View Parts
            </Button>
            <Button onClick={handleViewLabor} variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View Labor
            </Button>
            <EmailButton
              context={{
                type: 'work_order_update',
                entityName: `WO #${workOrder?.work_order_number || workOrderId}`,
                details: `Vehicle: ${workOrder?.vehicle_name || 'N/A'}. Status: ${workOrder?.status || 'N/A'}.${workOrder?.title ? ` Title: ${workOrder.title}.` : ''}`,
              }}
              label="Email Update"
              variant="outline"
              className="w-full"
            />
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}

function WOCategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    preventive: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    corrective: 'bg-orange-100 text-orange-800 border-orange-200',
    inspection: 'bg-amber-100 text-amber-800 border-amber-200',
    body_work: 'bg-[var(--surface-glass-hover)] text-[var(--text-secondary)] border-white/[0.08]',
    electrical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    tire_service: 'bg-green-100 text-green-800 border-green-200',
  }
  const colorClass = colorMap[category.toLowerCase()] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
  const label = category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
