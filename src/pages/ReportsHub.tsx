/**
 * ReportsHub - Modern Report Management Dashboard
 * Real-time report generation and scheduling with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  ChartBar,
  FileText,
  Clock,
  FolderOpen,
  Lightning,
  Download,
  Calendar,
  TrendUp,
  Users,
  PlayCircle,
  Plus,
  Warning,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveReportsData } from '@/hooks/use-reactive-reports-data'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'

/**
 * Overview Tab - Report statistics and popular templates
 */
function OverviewTab() {
  const {
    metrics,
    popularTemplates,
    recentReports,
    generationQueue,
    categoryDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveReportsData()

  // Prepare chart data for category distribution
  const categoryChartData = Object.entries(categoryDistribution)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports Overview</h2>
          <p className="text-muted-foreground">
            Report library statistics and generation activity
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={metrics?.totalReports?.toString() || '0'}
          icon={FileText}
          trend="neutral"
          description="Available templates"
          loading={isLoading}
        />
        <StatCard
          title="Scheduled"
          value={metrics?.activeSchedules?.toString() || '0'}
          icon={Clock}
          trend="up"
          change="+3"
          description="Active schedules"
          loading={isLoading}
        />
        <StatCard
          title="Generated Today"
          value={metrics?.generatedToday?.toString() || '0'}
          icon={TrendUp}
          trend="up"
          description="Reports created"
          loading={isLoading}
        />
        <StatCard
          title="Popular Templates"
          value={popularTemplates?.length?.toString() || '0'}
          icon={ChartBar}
          trend="neutral"
          description="Most used"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reports by Category */}
        <ResponsiveBarChart
          title="Reports by Category"
          description="Template distribution across categories"
          data={categoryChartData}
          height={300}
          loading={isLoading}
        />

        {/* Generation Queue Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-500" />
              <CardTitle>Generation Queue</CardTitle>
            </div>
            <CardDescription>Reports currently being generated</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : generationQueue.length > 0 ? (
              <div className="space-y-2">
                {generationQueue.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.format.toUpperCase()} • Started{' '}
                        {new Date(report.generatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                      <Badge variant="secondary">Generating</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <PlayCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
                <p>No reports currently generating</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Popular Templates & Recent Reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Templates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendUp className="h-5 w-5 text-green-500" />
              <CardTitle>Popular Templates</CardTitle>
            </div>
            <CardDescription>Most frequently generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : popularTemplates.length > 0 ? (
              <div className="space-y-2">
                {popularTemplates.slice(0, 5).map((template, idx) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {template.category} • {template.domain}
                      </p>
                    </div>
                    <Badge variant="outline">{template.popularity}x</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No usage data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-500" />
              <CardTitle>Recent Reports</CardTitle>
            </div>
            <CardDescription>Latest generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-2">
                {recentReports.slice(0, 5).map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleString()} • {report.generatedBy}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No reports generated yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Templates Tab - Report template library
 */
function TemplatesTab() {
  const {
    templates,
    metrics,
    domainDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveReportsData()

  // Domain chart data
  const domainChartData = Object.entries(domainDistribution)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Report Templates</h2>
          <p className="text-muted-foreground">
            Core and custom report template library
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Template Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Core Templates"
          value={metrics?.coreTemplates?.toString() || '0'}
          icon={FileText}
          trend="neutral"
          description="Universal library"
          loading={isLoading}
        />
        <StatCard
          title="Custom Templates"
          value={metrics?.customTemplates?.toString() || '0'}
          icon={FolderOpen}
          trend="up"
          change="+5"
          description="Organization-specific"
          loading={isLoading}
        />
        <StatCard
          title="Categories"
          value={Object.keys(domainDistribution).length.toString()}
          icon={ChartBar}
          trend="neutral"
          description="Unique domains"
          loading={isLoading}
        />
        <StatCard
          title="Most Popular"
          value={templates.length > 0 ? templates[0]?.title?.slice(0, 15) + '...' : 'N/A'}
          icon={TrendUp}
          trend="up"
          description="Top template"
          loading={isLoading}
        />
      </div>

      {/* Templates by Domain Chart */}
      <ResponsivePieChart
        title="Templates by Domain"
        description="Report template distribution across business domains"
        data={domainChartData}
        innerRadius={60}
        loading={isLoading}
      />

      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Templates</CardTitle>
          <CardDescription>Browse and generate reports from templates</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : templates.length > 0 ? (
            <div className="space-y-2">
              {templates.slice(0, 10).map((template, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.title}</p>
                      {template.isCore && (
                        <Badge variant="secondary" className="text-xs">
                          Core
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.domain} • {template.category}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Preview
                    </Button>
                    <Button size="sm">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p>No templates available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Scheduled Tab - Automated report scheduling
 */
function ScheduledTab() {
  const {
    scheduledReports,
    upcomingScheduled,
    metrics,
    isLoading,
    lastUpdate,
  } = useReactiveReportsData()

  // Calculate schedule metrics
  const activeSchedules = scheduledReports.filter((s) => s.status === 'active').length
  const pausedSchedules = scheduledReports.filter((s) => s.status === 'paused').length

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scheduled Reports</h2>
          <p className="text-muted-foreground">
            Automated report generation and delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Schedule Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Schedules"
          value={metrics?.scheduledReports?.toString() || '0'}
          icon={Calendar}
          trend="neutral"
          description="All schedules"
          loading={isLoading}
        />
        <StatCard
          title="Active"
          value={activeSchedules.toString()}
          icon={PlayCircle}
          trend="up"
          description="Running schedules"
          loading={isLoading}
        />
        <StatCard
          title="Paused"
          value={pausedSchedules.toString()}
          icon={Clock}
          trend="neutral"
          description="Temporarily disabled"
          loading={isLoading}
        />
        <StatCard
          title="Next Run"
          value={upcomingScheduled.length > 0 ? 'In 2h' : 'N/A'}
          icon={Lightning}
          trend="neutral"
          description="Upcoming execution"
          loading={isLoading}
        />
      </div>

      {/* Upcoming Scheduled Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <CardTitle>Upcoming Executions</CardTitle>
          </div>
          <CardDescription>Next scheduled report generations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : upcomingScheduled.length > 0 ? (
            <div className="space-y-2">
              {upcomingScheduled.map((schedule, idx) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">Schedule #{schedule.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.schedule} • {schedule.format.toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recipients: {schedule.recipients.length} • Next run:{' '}
                      {new Date(schedule.nextRun).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={schedule.status === 'active' ? 'default' : 'secondary'}
                    >
                      {schedule.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Edit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p>No scheduled reports</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>All Scheduled Reports</CardTitle>
          <CardDescription>Manage report generation schedules</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : scheduledReports.length > 0 ? (
            <div className="space-y-2">
              {scheduledReports.map((schedule, idx) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">Schedule #{schedule.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.schedule} • {schedule.format.toUpperCase()} •{' '}
                      {schedule.recipients.length} recipient(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={schedule.status === 'active' ? 'default' : 'secondary'}
                    >
                      {schedule.status}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      Pause
                    </Button>
                    <Button size="sm" variant="ghost">
                      Delete
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p>No scheduled reports configured</p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * History Tab - Generated reports archive
 */
function HistoryTab() {
  const {
    generatedReports,
    metrics,
    generationTrend,
    formatChartData,
    failedReports,
    isLoading,
    lastUpdate,
  } = useReactiveReportsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Report History</h2>
          <p className="text-muted-foreground">
            Generated reports archive and analytics
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* History Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Generated"
          value={metrics?.totalGenerated?.toString() || '0'}
          icon={FileText}
          trend="up"
          description="All time"
          loading={isLoading}
        />
        <StatCard
          title="Generated Today"
          value={metrics?.generatedToday?.toString() || '0'}
          icon={TrendUp}
          trend="up"
          change={`+${metrics?.generatedToday || 0}`}
          description="Today's reports"
          loading={isLoading}
        />
        <StatCard
          title="Failed Today"
          value={metrics?.failedToday?.toString() || '0'}
          icon={Warning}
          trend={metrics && metrics.failedToday > 0 ? 'down' : 'neutral'}
          description="Generation errors"
          loading={isLoading}
        />
        <StatCard
          title="Average Daily"
          value={Math.round(metrics?.totalGenerated / 30).toString() || '0'}
          icon={ChartBar}
          trend="up"
          description="Last 30 days"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generation Trend */}
        <ResponsiveLineChart
          title="Generation Trend"
          description="Report generation volume over the past week"
          data={generationTrend}
          height={300}
          showArea
          loading={isLoading}
        />

        {/* Format Distribution */}
        <ResponsivePieChart
          title="Export Formats"
          description="Report format distribution"
          data={formatChartData}
          innerRadius={60}
          loading={isLoading}
        />
      </div>

      {/* Failed Reports Alert */}
      {failedReports.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Failed Reports</CardTitle>
            </div>
            <CardDescription>Reports that failed to generate today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedReports.slice(0, 5).map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-destructive/50 p-3"
                >
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Failed at {new Date(report.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Retry
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report History List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>Complete report generation history</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : generatedReports.length > 0 ? (
            <div className="space-y-2">
              {generatedReports.slice(0, 20).map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{report.title}</p>
                      <Badge
                        variant={
                          report.status === 'completed'
                            ? 'default'
                            : report.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(report.generatedAt).toLocaleString()} • {report.generatedBy} •{' '}
                      {report.format.toUpperCase()} • {(report.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.status === 'completed' && report.downloadUrl && (
                      <>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Users className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-2 h-12 w-12 opacity-20" />
              <p>No reports generated yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main ReportsHub Component
 */
export default function ReportsHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ChartBar className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <OverviewTab />
        </ErrorBoundary>
      ),
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading templates...</div>}>
            <TemplatesTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      icon: <Clock className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading schedules...</div>}>
            <ScheduledTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: <FolderOpen className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading history...</div>}>
            <HistoryTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Reports Hub"
      description="Comprehensive report generation and analytics"
      icon={<ChartBar className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
