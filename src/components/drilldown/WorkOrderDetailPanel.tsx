/**
 * WorkOrderDetailPanel - Level 2 drilldown for work order details
 * Shows comprehensive work order information with parts and labor breakdown
 */

import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import {
  Wrench,
  Calendar,
  DollarSign,
  User,
  Clock,
  Package,
  Users,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface WorkOrderDetailPanelProps {
  workOrderId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function WorkOrderDetailPanel({ workOrderId }: WorkOrderDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: workOrder, error, isLoading, mutate } = useSWR(
    `/api/work-orders/${workOrderId}`,
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'in_progress':
      case 'in progress':
        return 'warning'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'warning'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {workOrder && (
        <div className="space-y-6">
          {/* Work Order Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">WO #{workOrder.wo_number}</h3>
              <p className="text-sm text-muted-foreground">{workOrder.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusColor(workOrder.status)}>
                  {workOrder.status}
                </Badge>
                <Badge variant={getPriorityColor(workOrder.priority)}>
                  {workOrder.priority} Priority
                </Badge>
              </div>
            </div>
            <Wrench className="h-12 w-12 text-muted-foreground" />
          </div>

          {/* Cost Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Parts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${workOrder.parts_cost?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Labor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${workOrder.labor_cost?.toFixed(2) || '0.00'}
                </div>
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
                <div className="text-2xl font-bold text-primary">
                  ${workOrder.total_cost?.toFixed(2) || '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Work Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Work Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-medium">{workOrder.vehicle_name || 'N/A'}</p>
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
                <CardTitle>Description</CardTitle>
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
                  Notes
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

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleViewParts} className="w-full">
              <Package className="h-4 w-4 mr-2" />
              View Parts
            </Button>
            <Button onClick={handleViewLabor} variant="outline" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View Labor
            </Button>
          </div>
        </div>
      )}
    </DrilldownContent>
  )
}
