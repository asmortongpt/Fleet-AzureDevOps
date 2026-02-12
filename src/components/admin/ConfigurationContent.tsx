/**
 * ConfigurationContent - System Configuration Dashboard for AdminHub
 * Extracted from ConfigurationHub.tsx and enhanced with admin-specific visualizations
 */

import { memo, useMemo } from 'react'
// motion removed - React 19 incompatible
import { Database, Cpu, HardDrive, Activity, Plug, CheckCircle, XCircle, AlertTriangle, Shield, Eye, Server, TrendingUp, RefreshCw, Clock, Gauge, UploadCloud, Lock } from 'lucide-react'
import { useReactiveConfigurationData } from '@/hooks/use-reactive-configuration-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

// ============================================================================
// SUB-COMPONENTS - System Resource Gauge
// ============================================================================

interface ResourceGaugeProps {
  title: string
  value: number
  icon: React.ElementType
  iconColor: string
  warningThreshold: number
  criticalThreshold: number
}

const ResourceGauge = memo<ResourceGaugeProps>(
  ({ title, value, icon: Icon, iconColor, warningThreshold, criticalThreshold }) => {
    const status =
      value >= criticalThreshold ? 'critical' : value >= warningThreshold ? 'warning' : 'healthy'
    const statusColor =
      status === 'critical'
        ? 'text-red-500'
        : status === 'warning'
          ? 'text-amber-500'
          : 'text-green-500'
    const bgColor =
      status === 'critical'
        ? 'bg-red-500'
        : status === 'warning'
          ? 'bg-amber-500'
          : 'bg-green-500'

    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
        <div className={`p-3 rounded-full bg-muted ${iconColor}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{title}</span>
            <span className={`text-2xl font-bold ${statusColor}`}>{Math.round(value)}%</span>
          </div>
          <Progress value={value} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 capitalize">{status}</p>
        </div>
      </div>
    )
  }
)

ResourceGauge.displayName = 'ResourceGauge'

// ============================================================================
// SUB-COMPONENTS - Integration Health Card
// ============================================================================

interface IntegrationHealthCardProps {
  integration: {
    id: string
    name: string
    type: string
    status: string
    lastSync?: string
    errorCount?: number
    uptime?: number
  }
  index: number
}

const IntegrationHealthCard = memo<IntegrationHealthCardProps>(({ integration, index }) => {
  const isHealthy = integration.status === 'connected'
  const hasErrors = integration.errorCount && integration.errorCount > 0

  return (
    <div
      className={`rounded-lg border p-4 hover:bg-accent/50 transition-colors ${
        hasErrors ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium">{integration.name}</h4>
            <Badge variant="outline" className="text-xs">
              {integration.type}
            </Badge>
          </div>
          {integration.lastSync && (
            <p className="text-xs text-muted-foreground">
              Last sync: {new Date(integration.lastSync).toLocaleString()}
            </p>
          )}
        </div>
        <Badge variant={isHealthy ? 'default' : 'destructive'} className="ml-2">
          {integration.status}
        </Badge>
      </div>

      {/* Uptime indicator */}
      {integration.uptime !== undefined && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">{integration.uptime}%</span>
          </div>
          <Progress value={integration.uptime} className="h-1" />
        </div>
      )}

      {/* Error indicator */}
      {hasErrors && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{integration.errorCount} recent errors</span>
        </div>
      )}
    </div>
  )
})

IntegrationHealthCard.displayName = 'IntegrationHealthCard'

// ============================================================================
// MAIN COMPONENT - ConfigurationContent
// ============================================================================

export const ConfigurationContent = memo(() => {
  const {
    metrics,
    systemStatus,
    integrations,
    securityEvents,
    configByCategory,
    systemPerformanceTrend,
    integrationStatusData,
    failedIntegrations,
    criticalSecurityEvents,
    securityBySeverity,
    isLoading,
    lastUpdate,
  } = useReactiveConfigurationData()

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  // Memoize chart data
  const configChartData = useMemo(
    () =>
      Object.entries(configByCategory).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
    [configByCategory]
  )

  const performanceChartData = useMemo(
    () =>
      systemPerformanceTrend.map((point) => ({
        name: point.name,
        cpu: point.cpu,
        memory: point.memory,
        requests: point.requests,
      })),
    [systemPerformanceTrend]
  )

  const integrationStatusChartData = useMemo(
    () =>
      Object.entries(integrationStatusData).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill:
          name === 'connected'
            ? 'hsl(var(--success))'
            : name === 'error'
              ? 'hsl(var(--destructive))'
              : 'hsl(var(--muted))',
      })),
    [integrationStatusData]
  )

  const securitySeverityChartData = useMemo(
    () =>
      Object.entries(securityBySeverity).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        fill:
          name === 'critical'
            ? '#ef4444'
            : name === 'high'
              ? '#f97316'
              : name === 'medium'
                ? '#eab308'
                : '#22c55e',
      })),
    [securityBySeverity]
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">
            Monitor system health, integrations, and security events
          </p>
        </div>
        <Badge variant="outline" className="w-fit" aria-live="polite">
          Last updated: <time dateTime={lastUpdate.toISOString()}>{lastUpdate.toLocaleTimeString()}</time>
        </Badge>
      </header>

      {/* Key Metrics Grid */}
      <section aria-label="Configuration metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="System Uptime"
            value={formatUptime(metrics?.systemUptime || 0)}
            icon={Activity}
            trend="up"
            description="Running time"
            loading={isLoading}
          />
          <StatCard
            title="Active Configs"
            value={metrics?.activeConfigs?.toString() || '0'}
            icon={CheckCircle}
            trend="neutral"
            description="Currently in use"
            loading={isLoading}
          />
          <StatCard
            title="Active Integrations"
            value={metrics?.activeIntegrations?.toString() || '0'}
            icon={Plug}
            trend="up"
            description="Connected services"
            loading={isLoading}
          />
          <StatCard
            title="Security Alerts"
            value={metrics?.securityAlerts?.toString() || '0'}
            icon={Shield}
            trend={metrics?.securityAlerts > 0 ? 'down' : 'up'}
            description="Require attention"
            loading={isLoading}
          />
        </div>
      </section>

      {/* System Health Gauges */}
      <section aria-label="System resource usage">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-blue-500" aria-hidden="true" />
              <CardTitle>System Health Monitors</CardTitle>
            </div>
            <CardDescription>Real-time resource utilization with status indicators</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <ResourceGauge
                  title="CPU Usage"
                  value={systemStatus?.cpu || 0}
                  icon={Cpu}
                  iconColor="text-blue-500"
                  warningThreshold={70}
                  criticalThreshold={85}
                />
                <ResourceGauge
                  title="Memory Usage"
                  value={systemStatus?.memory || 0}
                  icon={Database}
                  iconColor="text-purple-500"
                  warningThreshold={75}
                  criticalThreshold={90}
                />
                <ResourceGauge
                  title="Disk Space"
                  value={systemStatus?.diskSpace || 0}
                  icon={HardDrive}
                  iconColor="text-cyan-500"
                  warningThreshold={70}
                  criticalThreshold={85}
                />
                <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="p-3 rounded-full bg-muted text-green-500">
                    <Activity className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Connections</span>
                      <span className="text-2xl font-bold text-green-500">
                        {systemStatus?.activeConnections || 0}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Current connections</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Performance Trends */}
      <section aria-label="Performance analytics">
        <div className="grid gap-6 lg:grid-cols-2">
          <ResponsiveLineChart
            title="System Performance (24h)"
            description="CPU and memory usage trends"
            data={performanceChartData.map((p) => ({
              name: p.name,
              value: p.cpu, // Primary value for line chart
              cpu: p.cpu,
              memory: p.memory,
            }))}
            height={300}
            showArea
            loading={isLoading}
          />
          <ResponsiveBarChart
            title="Request Traffic"
            description="API requests over time"
            data={performanceChartData.map((p) => ({
              name: p.name,
              value: p.requests,
            }))}
            height={300}
            loading={isLoading}
          />
        </div>
      </section>

      {/* Integration Health Status */}
      <section aria-label="Integration monitoring">
        <div className="grid gap-6 lg:grid-cols-2">
          <ResponsivePieChart
            title="Integration Status"
            description="Current connection status distribution"
            data={integrationStatusChartData}
            innerRadius={60}
            loading={isLoading}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {failedIntegrations.length > 0 ? (
                  <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                )}
                <CardTitle>Integration Health Status</CardTitle>
              </div>
              <CardDescription>
                {failedIntegrations.length > 0
                  ? `${failedIntegrations.length} services need attention`
                  : 'All integrations operational'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : failedIntegrations.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {failedIntegrations.map((integration, idx) => (
                    <IntegrationHealthCard key={integration.id} integration={integration} index={idx} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" aria-hidden="true" />
                  <p className="text-muted-foreground">All integrations are healthy</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {integrations.length} services connected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Events */}
      <section aria-label="Security monitoring">
        <div className="grid gap-6 lg:grid-cols-2">
          <ResponsivePieChart
            title="Security Events by Severity"
            description="Event distribution by threat level"
            data={securitySeverityChartData}
            innerRadius={60}
            loading={isLoading}
          />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                <CardTitle>Critical Security Events</CardTitle>
              </div>
              <CardDescription>High-priority alerts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : criticalSecurityEvents.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {criticalSecurityEvents.map((event, idx) => (
                    <div
                      key={event.id}
                      className={`rounded-lg border p-3 ${
                        event.severity === 'critical'
                          ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                          : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={event.severity === 'critical' ? 'destructive' : 'default'}
                          className="text-xs"
                        >
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{event.message}</p>
                      <p className="text-xs text-muted-foreground">
                        <Clock className="inline h-3 w-3 mr-1" aria-hidden="true" />
                        {new Date(event.timestamp).toLocaleString()}
                        {event.userId && ` • ${event.userId}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" aria-hidden="true" />
                  <p className="text-muted-foreground">No critical security events</p>
                  <p className="text-sm text-muted-foreground mt-1">System security is nominal</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Configuration Distribution */}
      {configChartData.length > 0 && (
        <section aria-label="Configuration breakdown">
          <div className="grid gap-6 lg:grid-cols-2">
            <ResponsivePieChart
              title="Configuration Distribution"
              description="Settings grouped by category"
              data={configChartData}
              innerRadius={60}
              loading={isLoading}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  <CardTitle>API & Cache Statistics</CardTitle>
                </div>
                <CardDescription>Backend performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <UploadCloud className="h-5 w-5 text-blue-500" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">API Response Time</p>
                          <p className="text-xs text-muted-foreground">Average latency</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">145ms</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Database className="h-5 w-5 text-purple-500" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">Cache Hit Rate</p>
                          <p className="text-xs text-muted-foreground">Redis performance</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">94.2%</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-green-500" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium">DB Connection Pool</p>
                          <p className="text-xs text-muted-foreground">Active connections</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold">12/50</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  )
})

ConfigurationContent.displayName = 'ConfigurationContent'
