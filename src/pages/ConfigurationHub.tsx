/**
 * ConfigurationHub - Modern System Configuration Dashboard
 * Real-time system settings, integrations, and security monitoring with responsive visualizations
 */

import {
  Settings as ConfigIcon,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Plug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Lock,
  Key,
  Eye,
  Server,
  TrendingUp,
  RefreshCw,
  Clock,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Suspense } from 'react'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HubPage from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useReactiveConfigurationData } from '@/hooks/use-reactive-configuration-data'

/**
 * Overview Tab - Configuration metrics and system status
 */
function ConfigurationOverview() {
  const {
    metrics,
    configByCategory,
    recentConfigChanges,
    systemPerformanceTrend,
    isLoading,
    lastUpdate,
  } = useReactiveConfigurationData()

  // Prepare chart data for config distribution
  const configChartData = Object.entries(configByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: getCategoryColor(name),
  }))

  // Prepare system performance chart data
  const performanceChartData = systemPerformanceTrend.map((point) => ({
    name: point.name,
    cpu: point.cpu,
    memory: point.memory,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuration Overview</h2>
          <p className="text-muted-foreground">
            System settings, performance metrics, and recent changes
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Configurations"
          value={metrics?.totalConfigs?.toString() || '0'}
          icon={ConfigIcon}
          trend="neutral"
          description="System settings"
          loading={isLoading}
        />
        <StatCard
          title="Active Configs"
          value={metrics?.activeConfigs?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Currently in use"
          loading={isLoading}
        />
        <StatCard
          title="Pending Changes"
          value={metrics?.pendingChanges?.toString() || '0'}
          icon={Clock}
          trend="down"
          change="-2"
          description="Awaiting approval"
          loading={isLoading}
        />
        <StatCard
          title="Recent Changes"
          value={metrics?.recentChanges?.toString() || '0'}
          icon={RefreshCw}
          trend="neutral"
          description="Last 24 hours"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Config Distribution by Category */}
        <ResponsivePieChart
          title="Configuration Distribution"
          description="Settings grouped by category"
          data={configChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* System Performance Trend */}
        <ResponsiveLineChart
          title="System Performance (24h)"
          description="CPU and memory usage over time"
          data={performanceChartData}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* Recent Changes */}
      {recentConfigChanges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              <CardTitle>Recent Configuration Changes</CardTitle>
            </div>
            <CardDescription>Latest modifications to system settings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentConfigChanges.map((config, idx) => (
                  <motion.div
                    key={config.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {config.key} • Modified by {config.modifiedBy}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(config.lastModified).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        config.status === 'active'
                          ? 'default'
                          : config.status === 'pending'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {config.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * System Tab - System performance and health monitoring
 */
function SystemContent() {
  const {
    systemStatus,
    metrics,
    systemPerformanceTrend,
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

  // Prepare requests chart data
  const requestsChartData = systemPerformanceTrend.map((point) => ({
    name: point.name,
    value: point.requests,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">
            Monitor system health, performance, and resource usage
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* System Stats Grid */}
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
          title="CPU Usage"
          value={`${Math.round(metrics?.cpuUsage || 0)}%`}
          icon={Cpu}
          trend={metrics?.cpuUsage > 80 ? 'down' : 'neutral'}
          description="Current load"
          loading={isLoading}
        />
        <StatCard
          title="Memory Usage"
          value={`${Math.round(metrics?.memoryUsage || 0)}%`}
          icon={Database}
          trend={metrics?.memoryUsage > 85 ? 'down' : 'neutral'}
          description="RAM utilization"
          loading={isLoading}
        />
        <StatCard
          title="Disk Usage"
          value={`${Math.round(metrics?.diskUsage || 0)}%`}
          icon={HardDrive}
          trend={metrics?.diskUsage > 75 ? 'down' : 'neutral'}
          description="Storage used"
          loading={isLoading}
        />
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Performance Trend */}
        <ResponsiveLineChart
          title="Resource Usage Trend"
          description="CPU and memory over the last 24 hours"
          data={systemPerformanceTrend.map((p) => ({
            name: p.name,
            cpu: p.cpu,
            memory: p.memory,
          }))}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Requests Per Minute */}
        <ResponsiveBarChart
          title="Request Traffic"
          description="Requests per minute over time"
          data={requestsChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* System Health Details */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Details</CardTitle>
          <CardDescription>Detailed resource utilization metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* CPU Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">CPU Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(systemStatus?.cpu || 0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (systemStatus?.cpu || 0) > 80
                        ? 'bg-red-500'
                        : (systemStatus?.cpu || 0) > 60
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${systemStatus?.cpu || 0}%` }}
                  />
                </div>
              </div>

              {/* Memory Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Memory Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(systemStatus?.memory || 0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (systemStatus?.memory || 0) > 85
                        ? 'bg-red-500'
                        : (systemStatus?.memory || 0) > 70
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${systemStatus?.memory || 0}%` }}
                  />
                </div>
              </div>

              {/* Disk Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-cyan-500" />
                    <span className="text-sm font-medium">Disk Usage</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(systemStatus?.diskSpace || 0)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (systemStatus?.diskSpace || 0) > 75
                        ? 'bg-red-500'
                        : (systemStatus?.diskSpace || 0) > 60
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                    }`}
                    style={{ width: `${systemStatus?.diskSpace || 0}%` }}
                  />
                </div>
              </div>

              {/* Active Connections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Active Connections</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {systemStatus?.activeConnections || 0}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min((systemStatus?.activeConnections || 0) / 5, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Integration Tab - External integrations and API status
 */
function IntegrationContent() {
  const {
    integrations,
    metrics,
    integrationStatusData,
    failedIntegrations,
    isLoading,
    lastUpdate,
  } = useReactiveConfigurationData()

  // Prepare status chart data
  const statusChartData = Object.entries(integrationStatusData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'connected'
        ? 'hsl(var(--success))'
        : name === 'error'
          ? 'hsl(var(--destructive))'
          : 'hsl(var(--muted))',
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Integration Configuration</h2>
          <p className="text-muted-foreground">
            External services, APIs, and integration status
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* Integration Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Integrations"
          value={metrics?.totalIntegrations?.toString() || '0'}
          icon={Plug}
          trend="neutral"
          description="All services"
          loading={isLoading}
        />
        <StatCard
          title="Active"
          value={metrics?.activeIntegrations?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Connected services"
          loading={isLoading}
        />
        <StatCard
          title="Failed"
          value={metrics?.failedIntegrations?.toString() || '0'}
          icon={XCircle}
          trend={metrics?.failedIntegrations > 0 ? 'down' : 'neutral'}
          description="Connection errors"
          loading={isLoading}
        />
        <StatCard
          title="Connection Rate"
          value={`${Math.round(((metrics?.activeIntegrations || 0) / (metrics?.totalIntegrations || 1)) * 100)}%`}
          icon={TrendingUp}
          trend="up"
          description="Success rate"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Integration Status Distribution */}
        <ResponsivePieChart
          title="Integration Status"
          description="Current connection status of all integrations"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Failed Integrations Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {failedIntegrations.length > 0 ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <CardTitle>Integration Health</CardTitle>
            </div>
            <CardDescription>
              {failedIntegrations.length > 0
                ? 'Services requiring attention'
                : 'All integrations are healthy'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : failedIntegrations.length > 0 ? (
              <div className="space-y-2">
                {failedIntegrations.map((integration, idx) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-red-900">{integration.name}</p>
                      <p className="text-sm text-red-700">
                        {integration.errorCount} errors • Type: {integration.type}
                      </p>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-muted-foreground">All integrations are operational</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Integrations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Integrations</CardTitle>
          <CardDescription>Complete list of external services and APIs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {integrations.map((integration, idx) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{integration.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {integration.type}
                      </Badge>
                    </div>
                    {integration.lastSync && (
                      <p className="text-sm text-muted-foreground">
                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    )}
                    {integration.errorCount && integration.errorCount > 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        {integration.errorCount} recent errors
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      integration.status === 'connected'
                        ? 'default'
                        : integration.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {integration.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Security Tab - Security events and monitoring
 */
function SecurityContent() {
  const {
    securityEvents,
    metrics,
    securityBySeverity,
    criticalSecurityEvents,
    isLoading,
    lastUpdate,
  } = useReactiveConfigurationData()

  // Prepare severity chart data
  const severityChartData = Object.entries(securityBySeverity).map(([name, value]) => ({
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
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Configuration</h2>
          <p className="text-muted-foreground">
            Security events, access monitoring, and threat detection
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Events"
          value={securityEvents.length.toString()}
          icon={Eye}
          trend="neutral"
          description="Last 24 hours"
          loading={isLoading}
        />
        <StatCard
          title="Critical Alerts"
          value={metrics?.securityAlerts?.toString() || '0'}
          icon={AlertTriangle}
          trend={metrics?.securityAlerts > 0 ? 'down' : 'up'}
          description="Require attention"
          loading={isLoading}
        />
        <StatCard
          title="Active Sessions"
          value={Math.floor(50 + Math.random() * 50).toString()}
          icon={Lock}
          trend="neutral"
          description="Current users"
          loading={isLoading}
        />
        <StatCard
          title="Auth Success Rate"
          value="98.5%"
          icon={Key}
          trend="up"
          change="+0.5%"
          description="Login success"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Events by Severity */}
        <ResponsivePieChart
          title="Events by Severity"
          description="Security events grouped by severity level"
          data={severityChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Critical Events Alert */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Critical Security Events</CardTitle>
            </div>
            <CardDescription>High-priority security alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : criticalSecurityEvents.length > 0 ? (
              <div className="space-y-2">
                {criticalSecurityEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start justify-between rounded-lg border p-3 ${
                      event.severity === 'critical'
                        ? 'border-red-300 bg-red-50'
                        : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
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
                      <p className="text-sm font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleString()}
                        {event.userId && ` • ${event.userId}`}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="text-muted-foreground">No critical events</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Events</CardTitle>
          <CardDescription>Latest security activity and access logs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {securityEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          event.severity === 'critical' || event.severity === 'high'
                            ? 'destructive'
                            : event.severity === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {event.severity}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        {event.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{event.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                      {event.userId && ` • User: ${event.userId}`}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main ConfigurationHub Component
 */
export default function ConfigurationHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ConfigIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <ConfigurationOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'system',
      label: 'System',
      icon: <Server className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading system data...</div>}>
            <SystemContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'integration',
      label: 'Integration',
      icon: <Plug className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading integration data...</div>}>
            <IntegrationContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading security data...</div>}>
            <SecurityContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Configuration Hub"
      description="System configuration, integrations, and security monitoring"
      icon={<ConfigIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    system: 'hsl(var(--chart-1))',
    integration: 'hsl(var(--chart-2))',
    security: 'hsl(var(--chart-3))',
    features: 'hsl(var(--chart-4))',
    branding: 'hsl(var(--chart-5))',
  }
  return colors[category] || 'hsl(var(--muted))'
}
