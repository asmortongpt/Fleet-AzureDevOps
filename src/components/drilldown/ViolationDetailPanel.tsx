/**
 * ViolationDetailPanel - Comprehensive violation detail drilldown
 *
 * Shows complete violation information including:
 * - Violation details (date, severity, policy, status)
 * - Related records (vehicle, driver, policy)
 * - Acknowledgment status and signatures
 * - Enforcement actions taken
 * - Timeline of events
 * - Corrective actions and training assigned
 */

import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  History,
  MessageSquare,
  Shield,
  User,
  Car,
  MapPin,
  PenTool,
  AlertOctagon,
  BookOpen,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'
import logger from '@/utils/logger';

const authFetch = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetch(input, { credentials: 'include', ...init })


interface ViolationDetailPanelProps {
  violationId: string
}

interface ViolationData {
  id: string
  violation_number: string
  occurred_at: string
  detected_at: string
  policy_id: string
  policy_name: string
  policy_number: string
  vehicle_id?: string
  vehicle_number?: string
  driver_id?: string
  driver_name?: string
  trip_id?: string
  violation_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'acknowledged' | 'under_review' | 'approved_override' | 'resolved' | 'dismissed' | 'escalated'
  description: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  threshold_value?: number
  actual_value?: number
  difference?: number
  unit?: string
  escalation_sent: boolean
  notification_sent: boolean
  override_requested: boolean
  override_reason?: string
  override_approved?: boolean
  override_approved_by?: string
  override_approved_at?: string
  created_at: string
  updated_at: string
}

interface AcknowledgmentRecord {
  id: string
  acknowledged_by: string
  acknowledged_at: string
  signature_data?: string
  notes?: string
  role: string
}

interface EnforcementAction {
  id: string
  action_type: 'notification' | 'warning' | 'suspension' | 'training' | 'escalation' | 'override'
  action_date: string
  performed_by: string
  details: string
  status: 'pending' | 'completed' | 'failed'
}

interface TimelineEvent {
  id: string
  timestamp: string
  event_type: string
  event_description: string
  user_name?: string
  details?: string
}

interface CorrectiveAction {
  id: string
  action_type: 'training' | 'counseling' | 'policy_review' | 'procedure_update'
  title: string
  description: string
  assigned_to: string
  due_date?: string
  completion_date?: string
  status: 'pending' | 'in_progress' | 'completed'
  notes?: string
}

interface Comment {
  id: string
  comment_text: string
  created_by: string
  created_at: string
  is_internal: boolean
}

const fetcher = (url: string) => authFetch(url).then((r) => r.json())

export function ViolationDetailPanel({ violationId }: ViolationDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('details')
  const [newComment, setNewComment] = useState('')

  // Fetch violation data
  const { data: violation, error, isLoading, mutate } = useSWR<ViolationData>(
    `/api/violations/${violationId}`,
    fetcher
  )

  const { data: acknowledgments } = useSWR<AcknowledgmentRecord[]>(
    violationId ? `/api/violations/${violationId}/acknowledgments` : null,
    fetcher
  )

  const { data: enforcementActions } = useSWR<EnforcementAction[]>(
    violationId ? `/api/violations/${violationId}/enforcement-actions` : null,
    fetcher
  )

  const { data: timeline } = useSWR<TimelineEvent[]>(
    violationId ? `/api/violations/${violationId}/timeline` : null,
    fetcher
  )

  const { data: correctiveActions } = useSWR<CorrectiveAction[]>(
    violationId ? `/api/violations/${violationId}/corrective-actions` : null,
    fetcher
  )

  const { data: comments } = useSWR<Comment[]>(
    violationId ? `/api/violations/${violationId}/comments` : null,
    fetcher
  )

  const handleViewPolicy = () => {
    if (!violation) return
    push({
      id: `policy-${violation.policy_id}`,
      type: 'policy',
      label: violation.policy_name,
      data: { policyId: violation.policy_id },
    })
  }

  const handleViewVehicle = () => {
    if (!violation?.vehicle_id) return
    push({
      id: `vehicle-${violation.vehicle_id}`,
      type: 'vehicle',
      label: violation.vehicle_number || `Vehicle ${violation.vehicle_id}`,
      data: { vehicleId: violation.vehicle_id },
    })
  }

  const handleViewDriver = () => {
    if (!violation?.driver_id) return
    push({
      id: `driver-${violation.driver_id}`,
      type: 'driver',
      label: violation.driver_name || `Driver ${violation.driver_id}`,
      data: { driverId: violation.driver_id },
    })
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      await authFetch(`/api/violations/${violationId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: newComment }),
      })
      setNewComment('')
      mutate()
    } catch (error) {
      logger.error('Failed to add comment:', error)
    }
  }

  const getSeverityColor = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'default'
      case 'open':
        return 'destructive'
      case 'acknowledged':
      case 'under_review':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getActionStatusColor = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'pending':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {violation && (
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Violation #{violation.violation_number}</h3>
              <p className="text-sm text-muted-foreground">{violation.violation_type}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getSeverityColor(violation.severity)}>
                  {violation.severity} Severity
                </Badge>
                <Badge variant={getStatusColor(violation.status)}>
                  {violation.status.replace('_', ' ')}
                </Badge>
                {violation.override_requested && (
                  <Badge variant="outline" className="border-purple-500 text-purple-700">
                    Override Requested
                  </Badge>
                )}
                {violation.escalation_sent && (
                  <Badge variant="destructive">Escalated</Badge>
                )}
              </div>
            </div>
            <AlertTriangle className="h-9 w-12 text-destructive" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Occurred
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {new Date(violation.occurred_at).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(violation.occurred_at).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Age
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {Math.floor(
                    (new Date().getTime() - new Date(violation.occurred_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{' '}
                  days
                </div>
                <p className="text-xs text-muted-foreground">Since occurrence</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="link"
                  className="h-auto p-0 text-left font-bold text-sm"
                  onClick={handleViewPolicy}
                >
                  {violation.policy_number}
                </Button>
                <p className="text-xs text-muted-foreground truncate">
                  {violation.policy_name}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {enforcementActions?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {enforcementActions?.filter((a) => a.status === 'completed').length || 0}{' '}
                  completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="acknowledgments">Acknowledgments</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="corrective">Corrective</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-2">
              <Card>
                <CardHeader>
                  <CardTitle>Violation Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{violation.description}</p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Occurred At</p>
                      <p className="font-medium">
                        {new Date(violation.occurred_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Detected At</p>
                      <p className="font-medium">
                        {new Date(violation.detected_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {violation.location_address && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Location</p>
                        </div>
                        <p className="text-sm">{violation.location_address}</p>
                        {violation.location_lat && violation.location_lng && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {violation.location_lat.toFixed(6)}, {violation.location_lng.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  {violation.threshold_value && violation.actual_value && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Violation Metrics</p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Threshold</p>
                            <p className="font-semibold">
                              {violation.threshold_value} {violation.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="font-semibold">
                              {violation.actual_value} {violation.unit}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Difference</p>
                            <p className="font-semibold text-destructive">
                              +{violation.difference} {violation.unit}
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={Math.min(
                            ((violation.actual_value - violation.threshold_value) /
                              violation.threshold_value) *
                              100,
                            100
                          )}
                          className="mt-2 h-2"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Override Request */}
              {violation.override_requested && (
                <Card className="border-purple-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-purple-600" />
                      Override Request
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm mt-1">{violation.override_reason}</p>
                    </div>
                    {violation.override_approved !== undefined && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge
                              variant={
                                violation.override_approved ? 'default' : 'destructive'
                              }
                            >
                              {violation.override_approved ? 'Approved' : 'Denied'}
                            </Badge>
                          </div>
                          {violation.override_approved_by && (
                            <>
                              <div>
                                <p className="text-sm text-muted-foreground">Approved By</p>
                                <p className="font-medium">{violation.override_approved_by}</p>
                              </div>
                              {violation.override_approved_at && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Approved At</p>
                                  <p className="font-medium">
                                    {new Date(violation.override_approved_at).toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Comments ({comments?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments?.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 bg-muted/50 rounded-lg space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{comment.created_by}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment_text}</p>
                        {comment.is_internal && (
                          <Badge variant="outline" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Records Tab */}
            <TabsContent value="related" className="space-y-2">
              {violation.vehicle_id && (
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={handleViewVehicle}
                >
                  <CardContent className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Car className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Vehicle</p>
                        <p className="text-sm text-muted-foreground">
                          {violation.vehicle_number}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )}

              {violation.driver_id && (
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={handleViewDriver}
                >
                  <CardContent className="p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Driver</p>
                        <p className="text-sm text-muted-foreground">
                          {violation.driver_name}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleViewPolicy}
              >
                <CardContent className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Policy</p>
                      <p className="text-sm text-muted-foreground">
                        {violation.policy_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        #{violation.policy_number}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Policy
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Acknowledgments Tab */}
            <TabsContent value="acknowledgments" className="space-y-2">
              {acknowledgments && acknowledgments.length > 0 ? (
                acknowledgments.map((ack) => (
                  <Card key={ack.id}>
                    <CardContent className="p-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                          <div>
                            <p className="font-medium">{ack.acknowledged_by}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {ack.role}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ack.acknowledged_at).toLocaleString()}
                        </p>
                      </div>

                      {ack.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground">Notes</p>
                            <p className="text-sm mt-1">{ack.notes}</p>
                          </div>
                        </>
                      )}

                      {ack.signature_data && (
                        <>
                          <Separator />
                          <div className="flex items-center gap-2">
                            <PenTool className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Digital signature verified
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-9 w-12 mx-auto text-muted-foreground mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No acknowledgments yet</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Enforcement Actions Tab */}
            <TabsContent value="actions" className="space-y-2">
              {enforcementActions && enforcementActions.length > 0 ? (
                enforcementActions.map((action) => (
                  <Card key={action.id}>
                    <CardContent className="p-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {action.action_type.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getActionStatusColor(action.status)}>
                              {action.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {action.details}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.action_date).toLocaleDateString()}
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{action.performed_by}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(action.action_date).toLocaleTimeString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-9 w-12 mx-auto text-muted-foreground mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No enforcement actions</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-2">
              {timeline && timeline.length > 0 ? (
                <div className="space-y-2 relative">
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative pl-14">
                      <div className="absolute left-4 top-2 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                      <Card>
                        <CardContent className="p-2">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium capitalize">
                                {event.event_type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.event_description}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>

                          {event.details && (
                            <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                              {event.details}
                            </p>
                          )}

                          {event.user_name && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {event.user_name}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-9 w-12 mx-auto text-muted-foreground mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">No timeline events</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Corrective Actions Tab */}
            <TabsContent value="corrective" className="space-y-2">
              {correctiveActions && correctiveActions.length > 0 ? (
                correctiveActions.map((action) => (
                  <Card key={action.id}>
                    <CardContent className="p-2 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {action.action_type.replace('_', ' ')}
                            </Badge>
                            <Badge
                              variant={
                                action.status === 'completed'
                                  ? 'default'
                                  : action.status === 'in_progress'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {action.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="font-medium">{action.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Assigned To</p>
                          <p className="text-sm font-medium">{action.assigned_to}</p>
                        </div>
                        {action.due_date && (
                          <div>
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <p
                              className={cn(
                                'text-sm font-medium',
                                new Date(action.due_date) < new Date() &&
                                  action.status !== 'completed' &&
                                  'text-destructive'
                              )}
                            >
                              {new Date(action.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {action.completion_date && (
                          <div>
                            <p className="text-xs text-muted-foreground">Completed</p>
                            <p className="text-sm font-medium">
                              {new Date(action.completion_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {action.notes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground">Notes</p>
                            <p className="text-sm mt-1">{action.notes}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-9 w-12 mx-auto text-muted-foreground mb-2 opacity-30" />
                    <p className="text-sm text-muted-foreground">
                      No corrective actions assigned
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}
