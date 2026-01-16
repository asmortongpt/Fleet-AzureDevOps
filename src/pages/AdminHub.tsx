/**
 * AdminHub - Modern System Administration Dashboard
 * Real-time system health, user management, settings, and audit tracking with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  Gear as AdminIcon,
  Users,
  ChartLine,
  Shield,
  Warning,
  CheckCircle,
  Database,
  CloudArrowUp,
  Lock,
  ClipboardText,
  IdentificationCard,
  GearSix,
  UserCircle,
  Activity,
  Clock,
  XCircle,
  Key,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveAdminData } from '@/hooks/use-reactive-admin-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorBoundary from '@/components/common/ErrorBoundary'

/**
 * Overview Tab - System health and key metrics
 */
function AdminOverview() {
  const {
    metrics,
    systemMetrics,
    userStatusDistribution,
    activityTrendData,
    isLoading,
    lastUpdate,
  } = useReactiveAdminData()

  // Prepare user status chart data
  const userStatusChartData = Object.entries(userStatusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--success))'
        : name === 'inactive'
          ? 'hsl(var(--muted))'
          : 'hsl(var(--destructive))',
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground">
            Real-time system health and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers?.toString() || '0'}
          icon={Users}
          trend="up"
          change="+5"
          description="Registered users"
          loading={isLoading}
        />
        <StatCard
          title="Active Sessions"
          value={metrics?.activeSessions?.toString() || '0'}
          icon={Activity}
          trend="neutral"
          description="Currently online"
          loading={isLoading}
        />
        <StatCard
          title="System Health"
          value={`${metrics?.systemHealth || 0}%`}
          icon={Shield}
          trend="up"
          change="+1%"
          description="Overall system status"
          loading={isLoading}
        />
        <StatCard
          title="API Calls Today"
          value={systemMetrics ? `${(systemMetrics.apiCalls / 1000).toFixed(1)}K` : '0'}
          icon={CloudArrowUp}
          trend="up"
          change="+12%"
          description="API requests"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Status Distribution */}
        <ResponsivePieChart
          title="User Status Distribution"
          description="Current status of all system users"
          data={userStatusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Activity Trend */}
        <ResponsiveLineChart
          title="System Activity (Last 7 Days)"
          description="Successful and failed actions over time"
          data={activityTrendData}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* System Resources Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CPU Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChartLine className="h-5 w-5 text-blue-500" />
              <CardTitle>CPU Usage</CardTitle>
            </div>
            <CardDescription>Current processor utilization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">
                    {systemMetrics?.cpuUsage || 0}%
                  </span>
                  <Badge variant={systemMetrics?.cpuUsage < 70 ? 'default' : 'warning'}>
                    {systemMetrics?.cpuUsage < 70 ? 'Normal' : 'High'}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      systemMetrics?.cpuUsage < 70 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${systemMetrics?.cpuUsage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              <CardTitle>Memory Usage</CardTitle>
            </div>
            <CardDescription>RAM utilization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">
                    {systemMetrics?.memoryUsage || 0}%
                  </span>
                  <Badge variant={systemMetrics?.memoryUsage < 80 ? 'default' : 'warning'}>
                    {systemMetrics?.memoryUsage < 80 ? 'Normal' : 'High'}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      systemMetrics?.memoryUsage < 80 ? 'bg-purple-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${systemMetrics?.memoryUsage || 0}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-green-500" />
              <CardTitle>Storage</CardTitle>
            </div>
            <CardDescription>Disk space utilization</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl font-bold">
                    {systemMetrics?.storageUsed || 0}%
                  </span>
                  <Badge variant={systemMetrics?.storageUsed < 85 ? 'default' : 'warning'}>
                    {systemMetrics?.storageUsed < 85 ? 'Normal' : 'High'}
                  </Badge>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      systemMetrics?.storageUsed < 85 ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${systemMetrics?.storageUsed || 0}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Users Tab - User management
 */
function UsersContent() {
  const {
    users,
    metrics,
    userRoleDistribution,
    sessions,
    isLoading,
    lastUpdate,
  } = useReactiveAdminData()

  // Prepare role distribution chart data
  const roleChartData = Object.entries(userRoleDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users and access control
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={metrics?.totalUsers?.toString() || '0'}
          icon={Users}
          trend="up"
          change="+5"
          description="All users"
          loading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={metrics?.activeUsers?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description="Active accounts"
          loading={isLoading}
        />
        <StatCard
          title="Admins"
          value={metrics?.adminUsers?.toString() || '0'}
          icon={Shield}
          trend="neutral"
          description="Administrator accounts"
          loading={isLoading}
        />
        <StatCard
          title="Suspended"
          value={metrics?.suspendedUsers?.toString() || '0'}
          icon={Lock}
          trend="down"
          description="Suspended accounts"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Role Distribution */}
        <ResponsiveBarChart
          title="User Role Distribution"
          description="Users by role type"
          data={roleChartData}
          height={300}
          loading={isLoading}
        />

        {/* Active Sessions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <CardTitle>Active Sessions</CardTitle>
            </div>
            <CardDescription>Currently logged in users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {sessions.slice(0, 10).map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{session.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.ipAddress}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      Active
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2" />
                <p>No active sessions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered or modified users</CardDescription>
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
              {users.slice(0, 10).map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <IdentificationCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <Badge
                      variant={
                        user.status === 'active'
                          ? 'default'
                          : user.status === 'suspended'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </Badge>
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
 * Settings Tab - System configuration
 */
function SettingsContent() {
  const { systemMetrics, metrics, isLoading, lastUpdate } = useReactiveAdminData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">
            Configure system parameters and preferences
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Uptime"
          value={systemMetrics ? `${systemMetrics.uptime}%` : '0%'}
          icon={CheckCircle}
          trend="up"
          description="System availability"
          loading={isLoading}
        />
        <StatCard
          title="API Keys"
          value="8"
          icon={Key}
          trend="neutral"
          description="Active integrations"
          loading={isLoading}
        />
        <StatCard
          title="Configurations"
          value="45"
          icon={GearSix}
          trend="neutral"
          description="System settings"
          loading={isLoading}
        />
      </div>

      {/* Configuration Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GearSix className="h-5 w-5 text-blue-500" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>Core system configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Idle session duration</p>
                </div>
                <Badge variant="outline">30 minutes</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Max Login Attempts</p>
                  <p className="text-sm text-muted-foreground">Before account lockout</p>
                </div>
                <Badge variant="outline">5 attempts</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Password Expiry</p>
                  <p className="text-sm text-muted-foreground">Password refresh period</p>
                </div>
                <Badge variant="outline">90 days</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Two-Factor Auth</p>
                  <p className="text-sm text-muted-foreground">MFA requirement</p>
                </div>
                <Badge variant="default" className="bg-green-500">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Security and access control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">SSL/TLS Encryption</p>
                  <p className="text-sm text-muted-foreground">Transport security</p>
                </div>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">Audit Logging</p>
                  <p className="text-sm text-muted-foreground">Activity tracking</p>
                </div>
                <Badge variant="default" className="bg-green-500">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div>
                  <p className="font-medium">IP Whitelisting</p>
                  <p className="text-sm text-muted-foreground">Access restrictions</p>
                </div>
                <Badge variant="secondary">Disabled</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Rate Limiting</p>
                  <p className="text-sm text-muted-foreground">API request throttling</p>
                </div>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Version</p>
              <p className="text-lg font-semibold">v2.5.0</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Environment</p>
              <Badge variant="default">Production</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Database</p>
              <p className="text-lg font-semibold">PostgreSQL 15.2</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Cache</p>
              <p className="text-lg font-semibold">Redis 7.0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Audit Tab - Audit logs and activity tracking
 */
function AuditContent() {
  const {
    metrics,
    topUserActivities,
    actionDistribution,
    recentAuditLogs,
    failedActions,
    isLoading,
    lastUpdate,
  } = useReactiveAdminData()

  // Prepare action distribution chart data
  const actionChartData = Object.entries(actionDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">
            Track system activity and user actions
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Logs"
          value={metrics?.totalAuditLogs?.toString() || '0'}
          icon={ClipboardText}
          trend="up"
          description="All audit entries"
          loading={isLoading}
        />
        <StatCard
          title="Today's Activity"
          value="156"
          icon={Activity}
          trend="up"
          change="+12"
          description="Actions today"
          loading={isLoading}
        />
        <StatCard
          title="Failed Actions"
          value={metrics?.failedActions?.toString() || '0'}
          icon={XCircle}
          trend="down"
          change="-3"
          description="Unsuccessful actions"
          loading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={metrics?.activeUsers?.toString() || '0'}
          icon={Users}
          trend="neutral"
          description="Users with activity"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action Distribution */}
        <ResponsivePieChart
          title="Action Type Distribution"
          description="Breakdown of audit log actions"
          data={actionChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Top User Activities */}
        <ResponsiveBarChart
          title="Top Active Users"
          description="Users with most logged actions"
          data={topUserActivities.map((item) => ({
            name: item.userName.split(' ')[0],
            value: item.count,
          }))}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Audit Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardText className="h-5 w-5 text-blue-500" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest audit log entries</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : recentAuditLogs.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentAuditLogs.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{log.userName}</p>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action.replace(/_/g, ' ').toLowerCase()} • {log.resource}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardText className="h-12 w-12 mx-auto mb-2" />
                <p>No audit logs available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Actions */}
        {failedActions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-red-500" />
                <CardTitle>Failed Actions</CardTitle>
              </div>
              <CardDescription>Unsuccessful operations requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {failedActions.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <p className="font-medium text-sm">{log.userName}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action.replace(/_/g, ' ').toLowerCase()} • {log.resource}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.ipAddress} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * Main AdminHub Component
 */
export default function AdminHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartLine className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <AdminOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'users',
      label: 'Users',
      icon: <Users className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading user data...</div>}>
            <UsersContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <GearSix className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading settings...</div>}>
            <SettingsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'audit',
      label: 'Audit',
      icon: <ClipboardText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading audit logs...</div>}>
            <AuditContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Admin Hub"
      description="System administration, user management, and security"
      icon={<AdminIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
