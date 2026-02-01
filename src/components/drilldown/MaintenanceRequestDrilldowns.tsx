/**
 * MaintenanceRequestDrilldowns - Maintenance request drilldown components
 * Covers Maintenance Requests from MaintenanceHub
 */

import {
  Wrench,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'

// ============================================
// Type Definitions
// ============================================
interface ActivityLogEntry {
  action: string
  user: string
  timestamp: string
}

interface MaintenanceRequest {
  id: string | number
  title: string
  request_number: string
  status: string
  priority: string
  requester_name: string
  requester_department: string
  submitted_date: string
  description?: string
  request_type?: string
  category?: string
  estimated_cost?: number
  requested_completion_date?: string
  asset_name?: string
  asset_number?: string
  asset_location?: string
  asset_status?: string
  asset_id?: string | number
  reviewer_name?: string
  review_date?: string
  review_notes?: string
  approval_notes?: string
  activity_log?: ActivityLogEntry[]
}
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

const fetcher = swrFetcher

// ============================================
// Type Definitions
// ============================================
interface MaintenanceRequest {
  id: string;
  title: string;
  request_number: string;
  status: string;
  priority: string;
  requester_name?: string;
  requester_department?: string;
  submitted_date?: string;
  description?: string;
  request_type?: string;
  category?: string;
  estimated_cost?: number;
  requested_completion_date?: string;
  vehicle_id?: string;
  asset_id?: string;
  asset_name?: string;
  asset_number?: string;
  asset_status?: string;
  asset_location?: string;
  reviewer_name?: string;
  approval_date?: string;
  approval_notes?: string;
  review_comments?: string;
  review_date?: string;
  review_notes?: string;
  work_order_id?: string;
  rejection_reason?: string;
  activity_log?: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    comments?: string;
  }>;
  history?: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: string;
    comments?: string;
  }>;
}

// ============================================
// Maintenance Request Detail Panel
// ============================================
interface MaintenanceRequestDetailPanelProps {
  requestId: string
}

export function MaintenanceRequestDetailPanel({
  requestId,
}: MaintenanceRequestDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: request, error, isLoading, mutate } = useSWR<MaintenanceRequest>(
    `/api/maintenance-requests/${requestId}`,
    fetcher
  )

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'secondary'
      case 'in-review':
        return 'default'
      case 'approved':
        return 'default'
      case 'completed':
        return 'outline'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

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

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {request && (
        <div className="space-y-2">
          {/* Request Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">{request.title}</h3>
              <p className="text-sm text-muted-foreground">
                Request #{request.request_number}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status}
                </Badge>
                <Badge variant={getPriorityVariant(request.priority)}>
                  {request.priority} Priority
                </Badge>
              </div>
            </div>
            <Wrench className="h-9 w-12 text-muted-foreground" />
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Requester
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{request.requester_name}</p>
                <p className="text-xs text-muted-foreground">
                  {request.requester_department}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Submitted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">
                  {request.submitted_date
                    ? new Date(request.submitted_date).toLocaleDateString()
                    : 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {request.submitted_date
                    ? new Date(request.submitted_date).toLocaleTimeString()
                    : ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="asset">Asset</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Request Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{request.description || 'No description provided'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{request.request_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{request.category || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Cost</p>
                      <p className="font-medium">
                        ${request.estimated_cost?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Requested Completion</p>
                      <p className="font-medium">
                        {request.requested_completion_date
                          ? new Date(request.requested_completion_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="asset" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Related Asset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Asset</p>
                      <p className="font-medium">{request.asset_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Asset Number</p>
                      <p className="font-medium">{request.asset_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{request.asset_location || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Status</p>
                      <p className="font-medium">{request.asset_status || 'N/A'}</p>
                    </div>
                  </div>
                  {request.asset_id && (
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() =>
                        push({
                          id: `asset-${request.asset_id}`,
                          type: 'asset-detail',
                          label: request.asset_name,
                          data: { assetId: request.asset_id },
                        })
                      }
                    >
                      View Asset Details
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Review Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Reviewer</p>
                      <p className="font-medium">{request.reviewer_name || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Review Date</p>
                      <p className="font-medium">
                        {request.review_date
                          ? new Date(request.review_date).toLocaleDateString()
                          : 'Pending'}
                      </p>
                    </div>
                  </div>
                  {request.review_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Review Notes</p>
                      <p className="text-sm">{request.review_notes}</p>
                    </div>
                  )}
                  {request.approval_notes && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Approval Notes</p>
                      <p className="text-sm">{request.approval_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {request.activity_log?.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {(!request.activity_log || request.activity_log.length === 0) && (
                      <p className="text-sm text-muted-foreground">No activity history</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          {request.status === 'approved' && (
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() =>
                  push({
                    id: `create-work-order-${requestId}`,
                    type: 'create-work-order',
                    label: 'Create Work Order',
                    data: { requestId, request },
                  })
                }
              >
                <Wrench className="h-4 w-4 mr-2" />
                Create Work Order
              </Button>
            </div>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}

// ============================================
// Maintenance Request List View
// ============================================
interface MaintenanceRequestListViewProps {
  status?: 'new' | 'in-review' | 'approved' | 'completed' | 'rejected'
}

export function MaintenanceRequestListView({
  status,
}: MaintenanceRequestListViewProps) {
  const { push } = useDrilldown()
  const { data: requests, error, isLoading } = useSWR<MaintenanceRequest[]>(
    status ? `/api/maintenance-requests?status=${status}` : '/api/maintenance-requests',
    fetcher
  )

  const statusLabels = {
    new: 'New Requests',
    'in-review': 'In Review',
    approved: 'Approved Requests',
    completed: 'Completed Requests',
    rejected: 'Rejected Requests',
  }

  const getStatusIcon = (requestStatus: string) => {
    switch (requestStatus) {
      case 'new':
        return <FileText className="h-4 w-4" />
      case 'in-review':
        return <Clock className="h-4 w-4" />
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusVariant = (requestStatus: string) => {
    switch (requestStatus) {
      case 'new':
        return 'secondary'
      case 'in-review':
        return 'default'
      case 'approved':
        return 'default'
      case 'completed':
        return 'outline'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">
            {status ? statusLabels[status] : 'All Maintenance Requests'}
          </h3>
          <Badge>{requests?.length || 0} requests</Badge>
        </div>

        <div className="space-y-2">
          {requests?.map((request) => (
            <Card
              key={request.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() =>
                push({
                  id: `maintenance-request-${request.id}`,
                  type: 'maintenance-request-detail',
                  label: request.title,
                  data: { requestId: request.id },
                })
              }
            >
              <CardContent className="p-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      <p className="font-semibold">{request.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Request #{request.request_number} • {request.asset_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {request.requester_name} on{' '}
                      {new Date(request.submitted_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                    {request.priority && (
                      <p className="text-xs text-muted-foreground">
                        {request.priority} priority
                      </p>
                    )}
                    {request.estimated_cost && (
                      <p className="text-sm font-semibold">
                        ${request.estimated_cost.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!requests || requests.length === 0) && (
            <Card>
              <CardContent className="p-3 text-center">
                <MessageSquare className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No {status ? statusLabels[status].toLowerCase() : 'maintenance requests'} found
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DrilldownContent>
  )
}
