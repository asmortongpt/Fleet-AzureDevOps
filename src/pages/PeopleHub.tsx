/**
 * PeopleHub - Modern Personnel & Staff Management Dashboard
 * Real-time employee tracking, team management, and performance monitoring with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import { Users as PeopleIcon, User, Users, LineChart, Trophy, AlertTriangle, Clock, Plus, Briefcase, UserCircle2, CalendarCheck, Building2 } from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { useReactivePeopleData } from '@/hooks/use-reactive-people-data'
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
 * Overview Tab - Personnel metrics and status overview
 */
function PeopleOverview() {
  const {
    metrics,
    statusDistribution,
    typeDistribution,
    departmentDistribution,
    newHires,
    upcomingReviews,
    isLoading,
    lastUpdate,
  } = useReactivePeopleData()

  // Prepare chart data for status distribution
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--success))'
        : name === 'on_leave'
          ? 'hsl(var(--warning))'
          : name === 'inactive'
            ? 'hsl(var(--muted))'
            : 'hsl(var(--destructive))',
  }))

  // Prepare chart data for department distribution
  const departmentChartData = Object.entries(departmentDistribution)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">People Overview</h2>
          <p className="text-muted-foreground">
            Manage workforce and monitor organizational health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={metrics?.totalEmployees?.toString() || '0'}
          icon={PeopleIcon}
          trend="neutral"
          description="In organization"
          loading={isLoading}
        />
        <StatCard
          title="Active Staff"
          value={metrics?.activeEmployees?.toString() || '0'}
          icon={User}
          trend="up"
          change={+5}
          description="Currently working"
          loading={isLoading}
        />
        <StatCard
          title="Avg Performance"
          value={`${metrics?.avgPerformanceRating || 0}%`}
          icon={LineChart}
          trend="up"
          change="+3%"
          description="Organization average"
          loading={isLoading}
        />
        <StatCard
          title="Active Teams"
          value={metrics?.totalTeams?.toString() || '0'}
          icon={Users}
          trend="neutral"
          description="Organizational units"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Employee Status Distribution */}
        <ResponsivePieChart
          title="Employee Status Distribution"
          description="Current status of all employees in the organization"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Department Distribution */}
        <ResponsiveBarChart
          title="Employees by Department"
          description="Staff distribution across departments"
          data={departmentChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* New Hires */}
        {newHires.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-5 w-5 text-blue-500" />
                <CardTitle>Recent New Hires</CardTitle>
              </div>
              <CardDescription>Employees who joined in the last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {newHires.slice(0, 5).map((employee, idx) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.role} • {employee.department}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(employee.hireDate).toLocaleDateString()}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Reviews */}
        {upcomingReviews.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-amber-500" />
                <CardTitle>Upcoming Reviews</CardTitle>
              </div>
              <CardDescription>Performance reviews scheduled within 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReviews.slice(0, 5).map((employee, idx) => (
                    <motion.div
                      key={employee.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Review: {employee.nextReviewDate ? new Date(employee.nextReviewDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="warning">
                        Due Soon
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
 * Directory Tab - Staff listing and contact information
 */
function DirectoryContent() {
  const {
    employees,
    metrics,
    typeDistribution,
    isLoading,
    lastUpdate,
  } = useReactivePeopleData()

  // Prepare chart data for employee type distribution
  const typeChartData = Object.entries(typeDistribution).map(([name, value]) => ({
    name: name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'full_time'
        ? 'hsl(var(--primary))'
        : name === 'part_time'
          ? 'hsl(var(--secondary))'
          : 'hsl(var(--accent))',
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Directory</h2>
          <p className="text-muted-foreground">
            Complete staff listing with contact information
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Full-Time"
          value={metrics?.fullTime?.toString() || '0'}
          icon={Briefcase}
          trend="neutral"
          description="Full-time employees"
          loading={isLoading}
        />
        <StatCard
          title="Part-Time"
          value={metrics?.partTime?.toString() || '0'}
          icon={Clock}
          trend="neutral"
          description="Part-time employees"
          loading={isLoading}
        />
        <StatCard
          title="Contractors"
          value={metrics?.contractors?.toString() || '0'}
          icon={UserCircle2}
          trend="neutral"
          description="Contract workers"
          loading={isLoading}
        />
        <StatCard
          title="On Leave"
          value={metrics?.onLeave?.toString() || '0'}
          icon={CalendarCheck}
          trend="neutral"
          description="Currently on leave"
          loading={isLoading}
        />
      </div>

      {/* Employee Type Distribution Chart */}
      <ResponsivePieChart
        title="Employment Type Distribution"
        description="Breakdown of employees by employment type"
        data={typeChartData}
        innerRadius={60}
        loading={isLoading}
      />

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <CardDescription>Complete directory of all staff members</CardDescription>
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
              {employees.slice(0, 10).map((employee, idx) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.role} • {employee.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground ml-13">
                      <span>{employee.email}</span>
                      <span>{employee.phone}</span>
                      <span className="capitalize">{employee.employeeType.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      employee.status === 'active'
                        ? 'default'
                        : employee.status === 'on_leave'
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {employee.status.replace('_', ' ').toUpperCase()}
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
 * Teams Tab - Team management and organization structure
 */
function TeamsContent() {
  const {
    teams,
    metrics,
    teamSizeData,
    employees,
    isLoading,
    lastUpdate,
  } = useReactivePeopleData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teams</h2>
          <p className="text-muted-foreground">
            Manage organizational teams and structures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Create Team
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Teams"
          value={metrics?.totalTeams?.toString() || '0'}
          icon={Users}
          trend="up"
          change={+2}
          description="Active teams"
          loading={isLoading}
        />
        <StatCard
          title="Avg Team Size"
          value={metrics?.avgTeamSize?.toString() || '0'}
          icon={PeopleIcon}
          trend="neutral"
          description="Members per team"
          loading={isLoading}
        />
        <StatCard
          title="Departments"
          value={Object.keys(
            employees.reduce((acc, e) => {
              acc[e.department] = true
              return acc
            }, {} as Record<string, boolean>)
          ).length.toString()}
          icon={Building2}
          trend="neutral"
          description="Unique departments"
          loading={isLoading}
        />
      </div>

      {/* Team Size Distribution Chart */}
      <ResponsiveBarChart
        title="Team Size Distribution"
        description="Number of members in each team"
        data={teamSizeData}
        height={350}
        loading={isLoading}
      />

      {/* Teams List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>All Teams</CardTitle>
          </div>
          <CardDescription>Overview of all organizational teams</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team, idx) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{team.name}</h3>
                        <Badge variant="secondary">{team.department}</Badge>
                      </div>
                      {team.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {team.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Members: <span className="font-medium text-foreground">{team.memberCount}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Manager: <span className="font-medium text-foreground">
                            {employees.find((e) => e.id === team.managerId)?.name || 'Unassigned'}
                          </span>
                        </span>
                      </div>
                    </div>
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
 * Performance Tab - Performance tracking and reviews
 */
function PerformanceContent() {
  const {
    metrics,
    performanceRanges,
    performanceTrendData,
    departmentPerformanceData,
    topPerformers,
    needsAttention,
    isLoading,
    lastUpdate,
  } = useReactivePeopleData()

  // Prepare chart data for performance ranges
  const performanceRangesChartData = Object.entries(performanceRanges).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').trim(),
    value,
  }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance Management</h2>
          <p className="text-muted-foreground">
            Track employee performance and schedule reviews
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Performance"
          value={`${metrics?.avgPerformanceRating || 0}%`}
          icon={LineChart}
          trend="up"
          change="+3%"
          description="Organization average"
          loading={isLoading}
        />
        <StatCard
          title="Top Performers"
          value={topPerformers.length.toString()}
          icon={Trophy}
          trend="up"
          description="Above 90% rating"
          loading={isLoading}
        />
        <StatCard
          title="Scheduled Reviews"
          value={metrics?.scheduledReviews?.toString() || '0'}
          icon={CalendarCheck}
          trend="neutral"
          description="Upcoming reviews"
          loading={isLoading}
        />
        <StatCard
          title="Needs Attention"
          value={needsAttention.length.toString()}
          icon={AlertTriangle}
          trend="down"
          description="Require support"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Trend */}
        <ResponsiveLineChart
          title="Monthly Performance Trend"
          description="Average performance rating and completed reviews"
          data={performanceTrendData}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Performance Rating Distribution */}
        <ResponsiveBarChart
          title="Performance Distribution"
          description="Employees grouped by performance rating ranges"
          data={performanceRangesChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Department Performance Chart */}
      <ResponsiveBarChart
        title="Department Performance"
        description="Average performance rating by department"
        data={departmentPerformanceData}
        height={350}
        loading={isLoading}
      />

      {/* Performance Lists Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle>Top Performers</CardTitle>
            </div>
            <CardDescription>Employees with outstanding performance ratings</CardDescription>
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
                {topPerformers.slice(0, 5).map((employee, idx) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.role} • {employee.department}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      {employee.performanceRating}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>Needs Attention</CardTitle>
            </div>
            <CardDescription>Employees requiring support or performance improvement</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : needsAttention.length > 0 ? (
              <div className="space-y-3">
                {needsAttention.slice(0, 5).map((employee, idx) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.role} • {employee.department}
                      </p>
                    </div>
                    <Badge variant="warning">
                      {employee.performanceRating}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>All employees performing well</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Main PeopleHub Component
 */
export default function PeopleHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <PeopleIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <PeopleOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'directory',
      label: 'Directory',
      icon: <User className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading directory...</div>}>
            <DirectoryContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: <Users className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading teams...</div>}>
            <TeamsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <LineChart className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading performance data...</div>}>
            <PerformanceContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="People Hub"
      description="Personnel management, teams, and performance tracking"
      icon={<PeopleIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
