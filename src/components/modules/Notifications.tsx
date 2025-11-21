/**
 * Notifications Module
 * Full notification management interface
 *
 * Features:
 * - Full notification list with filtering
 * - Alert acknowledgment and resolution
 * - Notification history
 * - Alert statistics dashboard
 * - Alert rules management
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Bell,
  Check,
  CheckCircle,
  Warning,
  Info,
  X,
  ArrowUp,
  ArrowDown,
  MagnifyingGlass,
  Funnel
} from '@phosphor-icons/react'
import { apiClient } from '@/lib/api-client'

interface Alert {
  id: string
  title: string
  message: string
  alert_type: string
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  status: 'pending' | 'sent' | 'acknowledged' | 'resolved'
  entity_type?: string
  entity_id?: string
  created_at: string
  acknowledged_at?: string
  acknowledged_by_name?: string
  resolved_at?: string
  resolved_by_name?: string
  resolution_notes?: string
}

interface AlertStats {
  by_status: Array<{ status: string; count: string }>
  by_severity: Array<{ severity: string; count: string }>
  unacknowledged_critical: number
  trend_7_days: Array<{ date: string; count: string; critical_count: string }>
}

export function Notifications() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const fetchAlerts = async () => {
    try {
      setIsLoading(true)
      const params: any = { limit: 100 }
      if (selectedStatus !== 'all') params.status = selectedStatus
      if (selectedSeverity !== 'all') params.severity = selectedSeverity

      const response = await apiClient.get('/api/alerts', { params })
      setAlerts(response.data?.alerts || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/alerts/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching alert stats:', error)
    }
  }

  useEffect(() => {
    fetchAlerts()
    fetchStats()
  }, [selectedStatus, selectedSeverity])

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiClient.post(`/api/alerts/${alertId}/acknowledge`)
      fetchAlerts()
      fetchStats()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const resolveAlert = async () => {
    if (!selectedAlert) return

    try {
      await apiClient.post(`/api/alerts/${selectedAlert.id}/resolve`, {
        resolution_notes: resolutionNotes
      })
      setResolveDialogOpen(false)
      setResolutionNotes('')
      setSelectedAlert(null)
      fetchAlerts()
      fetchStats()
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'emergency':
      case 'critical':
        return <Warning className="w-5 h-5" weight="fill" />
      case 'warning':
        return <ArrowUp className="w-5 h-5" />
      case 'info':
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'critical':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'info':
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600 bg-green-100'
      case 'acknowledged':
        return 'text-blue-600 bg-blue-100'
      case 'sent':
        return 'text-purple-600 bg-purple-100'
      case 'pending':
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const filteredAlerts = alerts.filter(alert => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.alert_type.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Warning className="w-8 h-8 text-red-600" weight="fill" />
              <div className="text-3xl font-bold">
                {stats?.unacknowledged_critical || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="w-8 h-8 text-blue-600" />
              <div className="text-3xl font-bold">
                {stats?.by_status.find(s => s.status === 'sent')?.count || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Acknowledged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Check className="w-8 h-8 text-yellow-600" />
              <div className="text-3xl font-bold">
                {stats?.by_status.find(s => s.status === 'acknowledged')?.count || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
              <div className="text-3xl font-bold">
                {stats?.by_status.find(s => s.status === 'resolved')?.count || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Alert History</CardTitle>
          <CardDescription>View and manage all system alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Funnel className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alert List */}
          <ScrollArea className="h-[600px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading alerts...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No alerts found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <Card key={alert.id} className={`${getSeverityColor(alert.severity)} border-l-4`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                            {getSeverityIcon(alert.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{alert.title}</h4>
                              <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className={getStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span>Type: {alert.alert_type}</span>
                              {alert.entity_type && (
                                <span>• Entity: {alert.entity_type}</span>
                              )}
                              <span>• Created: {formatDateTime(alert.created_at)}</span>
                              {alert.acknowledged_at && (
                                <span>• Acknowledged: {formatDateTime(alert.acknowledged_at)} by {alert.acknowledged_by_name}</span>
                              )}
                              {alert.resolved_at && (
                                <span>• Resolved: {formatDateTime(alert.resolved_at)} by {alert.resolved_by_name}</span>
                              )}
                            </div>
                            {alert.resolution_notes && (
                              <div className="mt-2 p-2 bg-background rounded text-xs">
                                <strong>Resolution:</strong> {alert.resolution_notes}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {alert.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Acknowledge
                            </Button>
                          )}
                          {(alert.status === 'sent' || alert.status === 'acknowledged') && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => {
                                setSelectedAlert(alert)
                                setResolveDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Add notes about how this alert was resolved
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAlert && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm mb-1">{selectedAlert.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
              <Textarea
                placeholder="Describe how this alert was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={resolveAlert}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
