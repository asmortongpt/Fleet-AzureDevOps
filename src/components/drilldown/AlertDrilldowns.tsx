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
import { toast } from 'sonner'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatDateTime } from '@/utils/format-helpers'

const fetcher = apiFetcher

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

  const handleAcknowledge = async () => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'acknowledged' }),
      })
      toast.success('Alert acknowledged')
      mutate()
    } catch {
      toast.error('Failed to acknowledge alert')
    }
  }

  const handleResolve = async () => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'resolved' }),
      })
      toast.success('Alert resolved')
      mutate()
    } catch {
      toast.error('Failed to resolve alert')
    }
  }

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
            <p className="text-sm text-[var(--text-secondary)]">
              Alert #{alertData.alert_number} • {alertData.category}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getStatusVariant(alertData.status)}>{alertData.status}</Badge>
              <Badge variant={getSeverityVariant(alertData.severity)}>
                {alertData.severity} severity
              </Badge>
            </div>
          </div>
          <AlertTriangle className="h-9 w-12 text-[var(--text-secondary)]" />
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
                {formatDateTime(alertData.triggered_at)}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
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
                    : '—'}
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
                  <p className="text-sm text-[var(--text-secondary)] mb-1">Description</p>
                  <p className="text-sm">{alertData.description || 'No description provided'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Type</p>
                    <p className="font-medium">{alertData.alert_type || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Category</p>
                    <p className="font-medium">{alertData.category || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Priority</p>
                    <p className="font-medium">{alertData.priority || 'Normal'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Auto-Clear</p>
                    <p className="font-medium">
                      {alertData.auto_clear_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                {alertData.threshold_value && (
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <p className="text-sm text-[var(--text-secondary)] mb-1">Threshold Information</p>
                    <p className="text-sm">
                      Triggered when {alertData.threshold_metric} exceeded{' '}
                      <span className="font-semibold">{alertData.threshold_value}</span>
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Current value: {alertData.current_value || '—'}
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
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Vehicle</p>
                        <p className="font-medium">{alertData.vehicle_name || '—'}</p>
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
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Driver</p>
                        <p className="font-medium">{alertData.driver_name || '—'}</p>
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
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
                      <p className="text-sm text-[var(--text-secondary)]">Location</p>
                    </div>
                    <p className="text-sm">{alertData.location}</p>
                    {alertData.coordinates && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {alertData.coordinates.lat}, {alertData.coordinates.lng}
                      </p>
                    )}
                  </div>
                )}

                {!alertData.vehicle_id && !alertData.driver_id && !alertData.location && (
                  <p className="text-sm text-[var(--text-secondary)]">No source information available</p>
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
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-[var(--text-secondary)]" />
                      <p className="text-sm font-medium">Acknowledged</p>
                    </div>
                    <p className="text-sm">By: {alertData.acknowledged_by}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDateTime(alertData.acknowledged_at)}
                    </p>
                  </div>
                )}

                {alertData.resolved_by && (
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-[var(--text-secondary)]" />
                      <p className="text-sm font-medium">Resolved</p>
                    </div>
                    <p className="text-sm">By: {alertData.resolved_by}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {formatDateTime(alertData.resolved_at)}
                    </p>
                    {alertData.resolution_notes && (
                      <p className="text-sm mt-2">{alertData.resolution_notes}</p>
                    )}
                  </div>
                )}

                {alertData.notifications_sent && alertData.notifications_sent.length > 0 && (
                  <div className="p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
                      <p className="text-sm font-medium">Notifications Sent</p>
                    </div>
                    <ul className="text-xs space-y-1 mt-2">
                      {alertData.notifications_sent.map((notification) => (
                        <li key={`${notification.recipient}-${notification.sent_at}`}>
                          {notification.recipient} via {notification.method} at{' '}
                          {formatDateTime(notification.sent_at)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!alertData.acknowledged_by &&
                  !alertData.resolved_by &&
                  (!alertData.notifications_sent || alertData.notifications_sent.length === 0) && (
                    <p className="text-sm text-[var(--text-secondary)]">No actions taken yet</p>
                  )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {alertData.status === 'active' && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleAcknowledge}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
                <Button onClick={handleResolve}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Resolve
                </Button>
              </div>
            )}

            {alertData.status === 'acknowledged' && (
              <Button className="w-full" onClick={handleResolve}>
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
                  {alertData.activity_log?.map((activity) => (
                    <div key={`${activity.action}-${activity.timestamp}`} className="flex items-start gap-2 p-2 rounded bg-[var(--surface-glass)]">
                      <Clock className="h-4 w-4 text-[var(--text-secondary)] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {activity.user} • {formatDateTime(activity.timestamp)}
                        </p>
                        {activity.notes && (
                          <p className="text-xs mt-1">{activity.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!alertData.activity_log || alertData.activity_log.length === 0) && (
                    <p className="text-sm text-[var(--text-secondary)]">No activity history</p>
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

  const { data: rawAlerts, error, isLoading } = useSWR<AlertData[]>(buildUrl(), fetcher)
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : []

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
        return <Info className="h-4 w-4 text-[var(--text-secondary)]" />
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
                    <p className="text-sm text-[var(--text-secondary)]">
                      {alert.category} • Alert #{alert.alert_number}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Triggered {formatDateTime(alert.triggered_at)}
                    </p>
                    {alert.vehicle_name && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Vehicle: {alert.vehicle_name}
                      </p>
                    )}
                    {alert.driver_name && (
                      <p className="text-xs text-[var(--text-secondary)]">
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
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
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
                <CheckCircle className="h-9 w-12 mx-auto text-[var(--text-secondary)] mb-2" />
                <p className="text-[var(--text-secondary)]">
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