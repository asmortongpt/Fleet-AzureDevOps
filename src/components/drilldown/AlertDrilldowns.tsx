/**
 * AlertDrilldowns - Alert drilldown components
 * Covers Safety Alerts from SafetyHub
 */

import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Bell,
  Clock,
  User,
  MapPin,
  Activity,
  Info,
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

const fetcher = swrFetcher

// ============================================
// Alert Data Interface
// ============================================
interface AlertData {
  id: string
  alert_number: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: 'active' | 'acknowledged' | 'resolved' | 'auto-resolved'
  alert_type: string
  category: string
  priority: number
  triggered_at: string
  duration_minutes?: number
  threshold_value?: number
  threshold_metric?: string
  current_value?: number
  auto_clear_enabled: boolean
  vehicle_id?: string
  vehicle_name?: string
  driver_id?: string
  driver_name?: string
  location?: string
  coordinates?: { lat: number; lng: number }
  acknowledged_by?: string
  acknowledged_at?: string
  resolved_by?: string
  resolved_at?: string
  resolution_notes?: string
  notifications_sent?: Array<{
    recipient: string
    method: string
    sent_at: string
  }>
  activity_log?: Array<{
    timestamp: string
    action: string
    user: string
    details?: string
    notes?: string
  }>
}

// ============================================
// Alert Detail Panel
// ============================================
interface AlertDetailPanelProps {
  alertId: string
}

export function AlertDetailPanel({ alertId }: AlertDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: alert, error, isLoading, mutate } = useSWR<AlertData>(
    `/api/alerts/${alertId}`,
    fetcher
  )

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      case 'info':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />
      case 'high':
        return <AlertCircle className="h-5 w-5" />
      case 'medium':
        return <Bell className="h-5 w-5" />
      case 'low':
        return <Info className="h-5 w-5" />
      case 'info':
        return <Info className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'destructive'
      case 'acknowledged':
        return 'default'
      case 'resolved':
        return 'outline'
      case 'auto-resolved':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  if (isLoading || !alert) {
    return <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>{null}</DrilldownContent>
  }

  const alertData = alert

  return (
    <DrilldownContent loading={false} error={error} onRetry={() => mutate()}>
      <div className="space-y-2">
        {/* Alert Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getSeverityIcon(alertData.severity)}
              <h3 className="text-sm font-bold">{alertData.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Alert #{alertData.alert_number} • {alertData.category}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusVariant(alertData.status)}>{alertData.status}</Badge>
              <Badge variant={getSeverityVariant(alertData.severity)}>
                {alertData.severity} severity
              </Badge>
            </div>
          </div>
          <AlertTriangle className="h-9 w-12 text-muted-foreground" />
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Triggered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {alertData.triggered_at
                  ? new Date(alertData.triggered_at).toLocaleString()
                  : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {alertData.triggered_at &&
                  `${Math.floor((Date.now() - new Date(alertData.triggered_at).getTime()) / 60000)} minutes ago`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-semibold">
                {alertData.duration_minutes
                  ? `${alertData.duration_minutes} min`
                  : alertData.status === 'active'
                    ? 'Ongoing'
                    : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Alert Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{alertData.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium">{alertData.alert_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{alertData.category || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <p className="font-medium capitalize">{alertData.priority || 'Normal'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto-Clear</p>
                    <p className="font-medium">
                      {alertData.auto_clear_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                {alertData.threshold_value && (
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-1">Threshold Information</p>
                    <p className="text-sm">
                      Triggered when {alertData.threshold_metric} exceeded{' '}
                      <span className="font-semibold">{alertData.threshold_value}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current value: {alertData.current_value || 'N/A'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="source" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Source Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertData.vehicle_id && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Vehicle</p>
                        <p className="font-medium">{alertData.vehicle_name || 'Unknown'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          push({
                            id: `vehicle-${alertData.vehicle_id}`,
                            type: 'vehicle-detail',
                            label: alertData.vehicle_name || 'Vehicle',
                            data: { vehicleId: alertData.vehicle_id },
                          })
                        }
                      >
                        View Vehicle
                      </Button>
                    </div>
                  </div>
                )}

                {alertData.driver_id && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Driver</p>
                        <p className="font-medium">{alertData.driver_name || 'Unknown'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          push({
                            id: `driver-${alertData.driver_id}`,
                            type: 'driver-detail',
                            label: alertData.driver_name || 'Driver',
                            data: { driverId: alertData.driver_id },
                          })
                        }
                      >
                        View Driver
                      </Button>
                    </div>
                  </div>
                )}

                {alertData.location && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Location</p>
                    </div>
                    <p className="text-sm">{alertData.location}</p>
                    {alertData.coordinates && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {alertData.coordinates.lat}, {alertData.coordinates.lng}
                      </p>
                    )}
                  </div>
                )}

                {!alertData.vehicle_id && !alertData.driver_id && !alertData.location && (
                  <p className="text-sm text-muted-foreground">No source information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Actions Taken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alertData.acknowledged_by && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Acknowledged</p>
                    </div>
                    <p className="text-sm">By: {alertData.acknowledged_by}</p>
                    <p className="text-xs text-muted-foreground">
                      {alertData.acknowledged_at
                        ? new Date(alertData.acknowledged_at).toLocaleString()
                        : ''}
                    </p>
                  </div>
                )}

                {alertData.resolved_by && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Resolved</p>
                    </div>
                    <p className="text-sm">By: {alertData.resolved_by}</p>
                    <p className="text-xs text-muted-foreground">
                      {alertData.resolved_at ? new Date(alertData.resolved_at).toLocaleString() : ''}
                    </p>
                    {alertData.resolution_notes && (
                      <p className="text-sm mt-2">{alertData.resolution_notes}</p>
                    )}
                  </div>
                )}

                {alertData.notifications_sent && alertData.notifications_sent.length > 0 && (
                  <div className="p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Notifications Sent</p>
                    </div>
                    <ul className="text-xs space-y-1 mt-2">
                      {alertData.notifications_sent.map((notification, idx) => (
                        <li key={idx}>
                          {notification.recipient} via {notification.method} at{' '}
                          {new Date(notification.sent_at).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!alertData.acknowledged_by &&
                  !alertData.resolved_by &&
                  (!alertData.notifications_sent || alertData.notifications_sent.length === 0) && (
                    <p className="text-sm text-muted-foreground">No actions taken yet</p>
                  )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {alertData.status === 'active' && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
                <Button>
                  <XCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            )}

            {alertData.status === 'acknowledged' && (
              <Button className="w-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alertData.activity_log?.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </p>
                        {activity.notes && (
                          <p className="text-xs mt-1">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!alertData.activity_log || alertData.activity_log.length === 0) && (
                    <p className="text-sm text-muted-foreground">No activity history</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DrilldownContent>
  )
}

// ============================================
// Alert List View
// ============================================
interface AlertListViewProps {
  status?: 'active' | 'acknowledged' | 'resolved' | 'auto-resolved'
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export function AlertListView({ status, severity }: AlertListViewProps) {
  const { push } = useDrilldown()

  const buildUrl = () => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (severity) params.append('severity', severity)
    return `/api/alerts?${params.toString()}`
  }

  const { data: alerts, error, isLoading } = useSWR<AlertData[]>(buildUrl(), fetcher)

  const statusLabels = {
    active: 'Active Alerts',
    acknowledged: 'Acknowledged Alerts',
    resolved: 'Resolved Alerts',
    'auto-resolved': 'Auto-Resolved Alerts',
  }

  const severityLabels = {
    critical: 'Critical Alerts',
    high: 'High Priority Alerts',
    medium: 'Medium Priority Alerts',
    low: 'Low Priority Alerts',
  }

  const getSeverityIcon = (alertSeverity: string) => {
    switch (alertSeverity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'medium':
        return <Bell className="h-4 w-4 text-primary" />
      case 'low':
        return <Info className="h-4 w-4 text-muted-foreground" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getSeverityVariant = (alertSeverity: string) => {
    switch (alertSeverity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusVariant = (alertStatus: string) => {
    switch (alertStatus) {
      case 'active':
        return 'destructive'
      case 'acknowledged':
        return 'default'
      case 'resolved':
        return 'outline'
      case 'auto-resolved':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">
            {status
              ? statusLabels[status]
              : severity
                ? severityLabels[severity]
                : 'All Alerts'}
          </h3>
          <Badge>{alerts?.length || 0} alerts</Badge>
        </div>

        <div className="space-y-2">
          {alerts?.map((alert) => (
            <Card
              key={alert.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() =>
                push({
                  id: `alert-${alert.id}`,
                  type: 'alert-detail',
                  label: alert.title,
                  data: { alertId: alert.id },
                })
              }
            >
              <CardContent className="p-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <p className="font-semibold">{alert.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.category} • Alert #{alert.alert_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Triggered {new Date(alert.triggered_at).toLocaleString()}
                    </p>
                    {alert.vehicle_name && (
                      <p className="text-xs text-muted-foreground">
                        Vehicle: {alert.vehicle_name}
                      </p>
                    )}
                    {alert.driver_name && (
                      <p className="text-xs text-muted-foreground">
                        Driver: {alert.driver_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getStatusVariant(alert.status)}>{alert.status}</Badge>
                    <Badge variant={getSeverityVariant(alert.severity)} className="ml-1">
                      {alert.severity}
                    </Badge>
                    {alert.duration_minutes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.duration_minutes} min
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!alerts || alerts.length === 0) && (
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle className="h-9 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  No {status ? statusLabels[status].toLowerCase() : 'alerts'} found
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DrilldownContent>
  )
}