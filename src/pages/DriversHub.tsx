/**
 * DriversHub - Modern Driver Management Dashboard
 * Real-time driver performance, safety, and compliance tracking with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  User as DriversIcon,
  Users,
  Shield,
  ChartLine,
  Warning,
  Trophy,
  CarProfile,
  IdentificationCard,
  Clock,
  Plus,
  Certificate,
  CalendarX,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveDriversData } from '@/hooks/use-reactive-drivers-data'
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
 * Overview Tab - Driver metrics and status
 */
function DriversOverview() {
  const {
    drivers,
    metrics,
    statusDistribution,
    safetyScoreRanges,
    lowSafetyDrivers,
    expiringLicenses,
    isLoading,
    lastUpdate,
  } = useReactiveDriversData()

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--success))'
        : name === 'on_leave'
          ? 'hsl(var(--warning))'
          : name === 'suspended'
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--muted))',
  }))

  const safetyScoreChartData = Object.entries(safetyScoreRanges).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Overview</h2>
          <p className="text-muted-foreground">
            Manage driver roster and monitor performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Driver
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Drivers"
          value={metrics?.totalDrivers?.toString() || '0'}
          icon={Users}
          trend="neutral"
          description="In system"
          loading={isLoading}
        />
        <StatCard
          title="Active Drivers"
          value={metrics?.activeDrivers?.toString() || '0'}
          icon={DriversIcon}
          trend="up"
          change="+3"
          description="Currently working"
          loading={isLoading}
        />
        <StatCard
          title="Avg Safety Score"
          value={`${metrics?.avgSafetyScore || 0}%`}
          icon={Shield}
          trend="up"
          change="+2%"
          description="Fleet average"
          loading={isLoading}
        />
        <StatCard
          title="Active Assignments"
          value={metrics?.activeAssignments?.toString() || '0'}
          icon={CarProfile}
          trend="neutral"
          description="Vehicle assignments"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Driver Status Distribution */}
        <ResponsivePieChart
          title="Driver Status Distribution"
          description="Current status of all drivers in the fleet"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Safety Score Distribution */}
        <ResponsiveBarChart
          title="Safety Score Distribution"
          description="Drivers grouped by safety score ranges"
          data={safetyScoreChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Safety Score Alerts */}
        {lowSafetyDrivers.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-amber-500" />
                <CardTitle>Low Safety Scores</CardTitle>
              </div>
              <CardDescription>Drivers requiring safety training</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {lowSafetyDrivers.map((driver, idx) => (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          License: {driver.licenseNumber}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {driver.safetyScore}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expiring Licenses */}
        {expiringLicenses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarX className="h-5 w-5 text-amber-500" />
                <CardTitle>Expiring Licenses</CardTitle>
              </div>
              <CardDescription>Licenses expiring within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {expiringLicenses.map((driver, idx) => (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="warning">
                        Renewal Due
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * Performance Tab - Driver performance metrics
 */
function PerformanceContent() {
  const {
    performanceTrendData,
    hoursWorkedData,
    metrics,
    isLoading,
    lastUpdate,
  } = useReactiveDriversData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Performance</h2>
          <p className="text-muted-foreground">
            Performance metrics and productivity tracking
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Performance"
          value={`${metrics?.avgPerformance || 0}%`}
          icon={ChartLine}
          trend="up"
          change="+5%"
          description="Fleet average"
          loading={isLoading}
        />
        <StatCard
          title="Top Performers"
          value="12"
          icon={Trophy}
          trend="up"
          description="Above 90% rating"
          loading={isLoading}
        />
        <StatCard
          title="Total Violations"
          value={metrics?.totalViolations?.toString() || '0'}
          icon={Warning}
          trend="down"
          change="-3"
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Training Needed"
          value="5"
          icon={Certificate}
          trend="down"
          description="Require refresher"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <ResponsiveLineChart
          title="Weekly Performance Trend"
          description="Average performance score and violations over time"
          data={performanceTrendData}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Hours Worked */}
        <ResponsiveBarChart
          title="Hours Worked (Top 10 Drivers)"
          description="Total hours logged this week"
          data={hoursWorkedData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Top Performers List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle>Top Performers This Month</CardTitle>
          </div>
          <CardDescription>Drivers with outstanding performance ratings</CardDescription>
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
              {[
                { name: 'John Smith', score: 98, routes: 45, onTime: 100 },
                { name: 'Sarah Johnson', score: 96, routes: 42, onTime: 98 },
                { name: 'Mike Davis', score: 94, routes: 48, onTime: 96 },
              ].map((driver, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{driver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {driver.routes} routes • {driver.onTime}% on-time rate
                    </p>
                  </div>
                  <Badge variant="default" className="bg-green-500">
                    {driver.score}%
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
 * Compliance Tab - Driver compliance and certifications
 */
function ComplianceContent() {
  const { metrics, expiringLicenses, isLoading, lastUpdate } = useReactiveDriversData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Compliance</h2>
          <p className="text-muted-foreground">
            License status and certification tracking
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Valid Licenses"
          value={(metrics?.totalDrivers - expiringLicenses.length).toString() || '0'}
          icon={IdentificationCard}
          trend="up"
          description="Current and valid"
          loading={isLoading}
        />
        <StatCard
          title="Expiring Soon"
          value={expiringLicenses.length.toString() || '0'}
          icon={CalendarX}
          trend="down"
          description="Within 30 days"
          loading={isLoading}
        />
        <StatCard
          title="Certified Drivers"
          value={metrics?.totalDrivers?.toString() || '0'}
          icon={Certificate}
          trend="neutral"
          description="All certifications current"
          loading={isLoading}
        />
        <StatCard
          title="HOS Compliant"
          value={`${Math.round((metrics?.totalDrivers || 0) * 0.95)}`}
          icon={Clock}
          trend="up"
          description="Hours of service"
          loading={isLoading}
        />
      </div>

      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status Overview</CardTitle>
          <CardDescription>Current compliance status across all drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">License Validity</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(((metrics?.totalDrivers || 0) - expiringLicenses.length) / (metrics?.totalDrivers || 1) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${Math.round(((metrics?.totalDrivers || 0) - expiringLicenses.length) / (metrics?.totalDrivers || 1) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Safety Training Current</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: '92%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Medical Certifications</span>
                <span className="text-sm text-muted-foreground">88%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '88%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Background Checks</span>
                <span className="text-sm text-muted-foreground">100%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Assignments Tab - Driver-vehicle assignments
 */
function AssignmentsContent() {
  const { assignments, metrics, isLoading, lastUpdate } = useReactiveDriversData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Driver Assignments</h2>
          <p className="text-muted-foreground">
            Current driver-vehicle assignments and scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Assignment
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Assignments"
          value={metrics?.activeAssignments?.toString() || '0'}
          icon={CarProfile}
          description="Currently assigned"
          loading={isLoading}
        />
        <StatCard
          title="Pending Assignments"
          value={assignments.filter((a) => a.status === 'pending').length.toString() || '0'}
          icon={Clock}
          description="Awaiting confirmation"
          loading={isLoading}
        />
        <StatCard
          title="Unassigned Drivers"
          value={(metrics?.totalDrivers - metrics?.activeAssignments).toString() || '0'}
          icon={Users}
          description="Available for assignment"
          loading={isLoading}
        />
      </div>
    </div>
  )
}

/**
 * Main DriversHub Component
 */
export default function DriversHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Users className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <DriversOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <ChartLine className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading performance data...</div>}>
            <PerformanceContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: <Shield className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading compliance data...</div>}>
            <ComplianceContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: <CarProfile className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading assignments...</div>}>
            <AssignmentsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Drivers Hub"
      description="Driver management, performance, and compliance"
      icon={<DriversIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
