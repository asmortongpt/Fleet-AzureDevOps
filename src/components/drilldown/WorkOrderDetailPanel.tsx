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
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { credentials: 'include', ...init })


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

const fetcher = (url: string) => authFetch(url).then((r) => r.json())

export function WorkOrderDetailPanel({ workOrderId }: WorkOrderDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Main work order data
  const { data: workOrder, error, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}`,
    fetcher
  )

  // Parts data
  const { data: parts } = useSWR<Part[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/parts` : null,
    fetcher
  )

  // Labor data
  const { data: labor } = useSWR<LaborEntry[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/labor` : null,
    fetcher
  )

  // Timeline/audit trail
  const { data: timeline } = useSWR<TimelineEvent[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/timeline` : null,
    fetcher
  )

  // Related records (inspections, incidents)
  const { data: relatedRecords } = useSWR<RelatedRecord[]>(
    workOrderId ? `/api/work-orders/${workOrderId}/related` : null,
    fetcher
  )

  // Vehicle maintenance history
  const { data: maintenanceHistory } = useSWR<MaintenanceHistoryItem[]>(
    workOrder?.vehicle_id ? `/api/vehicles/${workOrder.vehicle_id}/maintenance-history` : null,
    fetcher
  )

  const handleViewParts = () => {
    push({
      id: `work-order-parts-${workOrderId}`,
      type: 'work-order-parts',
      label: 'Parts Breakdown',
      data: { workOrderId, workOrderNumber: workOrder?.wo_number },
    })
  }

  const handleViewLabor = () => {
    push({
      id: `work-order-labor-${workOrderId}`,
      type: 'work-order-labor',
      label: 'Labor Details',
      data: { workOrderId, workOrderNumber: workOrder?.wo_number },
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
        return <Clock className="h-5 w-5 text-blue-800" />
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-700" />
    }
  }

  const totalPartsCost = parts?.reduce((sum, part) => sum + (part.quantity * part.unit_cost || 0), 0) || 0
  const totalLaborCost = labor?.reduce((sum, entry) => sum + (entry.hours * entry.rate || 0), 0) || 0
  const totalCost = totalPartsCost + totalLaborCost

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {workOrder && (
        <div className="space-y-2">
          {/* Work Order Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">WO #{workOrder.wo_number}</h3>
              <p className="text-sm text-muted-foreground">{workOrder.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(workOrder.status)}>
                  {workOrder.status}
                </Badge>
                <Badge variant={getPriorityColor(workOrder.priority)}>
                  {workOrder.priority} Priority
                </Badge>
                {workOrder.work_type && (
                  <Badge variant="outline" className="capitalize">
                    {workOrder.work_type}
                  </Badge>
                )}
              </div>
            </div>
            <Wrench className="h-9 w-12 text-muted-foreground" />
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewParts}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Parts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  ${totalPartsCost.toFixed(2)}
                </div>
                {parts && parts.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {parts.length} item{parts.length !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewLabor}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  ${totalLaborCost.toFixed(2)}
                </div>
                {labor && labor.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {labor.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hrs
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
                  ${totalCost.toFixed(2)}
                </div>
                {workOrder.estimated_cost && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Est: ${workOrder.estimated_cost.toFixed(2)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="parts">Parts ({parts?.length || 0})</TabsTrigger>
              <TabsTrigger value="labor">Labor ({labor?.length || 0})</TabsTrigger>
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
                      <p className="text-sm text-muted-foreground">Vehicle</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{workOrder.vehicle_name || 'N/A'}</p>
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
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">
                        {workOrder.work_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{workOrder.assigned_to || 'Unassigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{workOrder.created_by || 'N/A'}</p>
                    </div>
                    {workOrder.location && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
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
                      {workOrder.created_date
                        ? new Date(workOrder.created_date).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Scheduled</span>
                    <span className="font-medium">
                      {workOrder.scheduled_date
                        ? new Date(workOrder.scheduled_date).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Started</span>
                    <span className="font-medium">
                      {workOrder.start_date
                        ? new Date(workOrder.start_date).toLocaleDateString()
                        : 'Not started'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed</span>
                    <span className="font-medium">
                      {workOrder.completed_date
                        ? new Date(workOrder.completed_date).toLocaleDateString()
                        : 'Not completed'}
                    </span>
                  </div>
                  {workOrder.due_date && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-medium">Due Date</span>
                      <span className={`font-medium ${new Date(workOrder.due_date) < new Date() && workOrder.status !== 'completed' ? 'text-destructive' : ''}`}>
                        {new Date(workOrder.due_date).toLocaleDateString()}
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
                        <p className="text-xs text-muted-foreground mt-2">
                          Estimated completion:{' '}
                          {new Date(workOrder.estimated_completion).toLocaleDateString()}
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

              {/* Issues/Notes */}
              {workOrder.notes && workOrder.notes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Notes ({workOrder.notes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {workOrder.notes.map((note: any, idx: number) => (
                        <li key={idx} className="p-2 rounded bg-muted/50 text-sm">
                          <p className="font-medium">{note.author}</p>
                          <p className="text-muted-foreground">{note.text}</p>
                          {note.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(note.timestamp).toLocaleString()}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Parts Tab */}
            <TabsContent value="parts" className="space-y-2">
              {parts && parts.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {parts.map((part) => (
                      <Card key={part.id}>
                        <CardContent className="p-2">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <span className="font-medium">{part.name}</span>
                              </div>
                              {part.status && (
                                <Badge variant={part.status === 'delivered' ? 'default' : 'secondary'}>
                                  {part.status}
                                </Badge>
                              )}
                            </div>

                            {part.part_number && (
                              <p className="text-sm text-muted-foreground">
                                Part #: {part.part_number}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <p className="text-xs text-muted-foreground">Quantity</p>
                                <p className="font-medium">{part.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Unit Cost</p>
                                <p className="font-medium">${part.unit_cost?.toFixed(2) || '0.00'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-medium text-primary">
                                  ${((part.quantity * part.unit_cost) || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {(part.supplier || part.delivery_date) && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                                {part.supplier && (
                                  <div>
                                    <p className="text-muted-foreground">Supplier</p>
                                    <p className="font-medium">{part.supplier}</p>
                                    {part.supplier_contact && (
                                      <p className="text-muted-foreground">{part.supplier_contact}</p>
                                    )}
                                  </div>
                                )}
                                {part.delivery_date && (
                                  <div>
                                    <p className="text-muted-foreground">Delivery Date</p>
                                    <p className="font-medium">
                                      {new Date(part.delivery_date).toLocaleDateString()}
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
                          ${totalPartsCost.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No parts recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Labor Tab */}
            <TabsContent value="labor" className="space-y-2">
              {labor && labor.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {labor.map((entry) => (
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
                                  <p className="text-sm text-muted-foreground">{entry.role || 'Technician'}</p>
                                </div>
                              </div>
                            </div>

                            {entry.task_description && (
                              <p className="text-sm text-muted-foreground">
                                {entry.task_description}
                              </p>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                              <div>
                                <p className="text-xs text-muted-foreground">Hours</p>
                                <p className="font-medium">{entry.hours?.toFixed(1) || '0.0'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Rate</p>
                                <p className="font-medium">${entry.rate?.toFixed(2) || '0.00'}/hr</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-medium text-primary">
                                  ${((entry.hours * entry.rate) || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            {entry.date && (
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                {new Date(entry.date).toLocaleDateString()}
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
                            {labor.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)} hrs
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-semibold">Total Labor Cost</span>
                          <span className="text-sm font-bold text-primary">
                            ${totalLaborCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No labor entries recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-2">
              {timeline && timeline.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {timeline.map((event, index) => (
                        <div key={event.id} className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-primary/10 p-2">
                              {getStatusIcon(event.event_type)}
                            </div>
                            {index < timeline.length - 1 && (
                              <div className="w-px h-full bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{event.description}</p>
                                {event.user_name && (
                                  <p className="text-sm text-muted-foreground">by {event.user_name}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
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
                    <History className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No timeline events recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-2">
              {/* Related Records */}
              {relatedRecords && relatedRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Related Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {relatedRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleViewRelatedRecord(record)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium capitalize">{record.type}</p>
                              <p className="text-sm text-muted-foreground">{record.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(record.date).toLocaleDateString()}
                              </p>
                              {record.status && (
                                <Badge variant="outline" className="mt-1">
                                  {record.status}
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
              {maintenanceHistory && maintenanceHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Vehicle Maintenance History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {maintenanceHistory.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded border"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">WO #{item.work_order_number}</p>
                                <Badge variant="outline" className="capitalize">
                                  {item.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium">${item.cost.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {maintenanceHistory.length > 5 && (
                        <p className="text-sm text-center text-muted-foreground pt-2">
                          +{maintenanceHistory.length - 5} more records
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(!relatedRecords || relatedRecords.length === 0) &&
                (!maintenanceHistory || maintenanceHistory.length === 0) && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No related records found</p>
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewParts} className="w-full">
              <Package className="h-4 w-4 mr-2" />
              View Parts Breakdown
            </Button>
            <Button onClick={handleViewLabor} variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View Labor Details
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
