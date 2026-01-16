/**
 * AnalyticsHub - Modern Analytics & Reporting Dashboard
 * Real-time analytics, reports, dashboards, and trend analysis with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  ChartLine as AnalyticsIcon,
  FileText,
  ChartBar,
  TrendUp,
  PresentationChart,
  Database,
  CurrencyDollar,
  Gauge,
  Calendar,
  Plus,
  Download,
  Eye,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveAnalyticsData } from '@/hooks/use-reactive-analytics-data'
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
 * Overview Tab - Analytics overview and key metrics
 */
function AnalyticsOverview() {
  const {
    metrics,
    kpis,
    categoryChartData,
    performanceMetricsTrend,
    isLoading,
    lastUpdate,
  } = useReactiveAnalyticsData()

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Key performance indicators and fleet analytics
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
          description="All analytics reports"
          loading={isLoading}
        />
        <StatCard
          title="Active Reports"
          value={metrics?.activeReports?.toString() || '0'}
          icon={ChartBar}
          trend="up"
          change="+3"
          description="Currently active"
          loading={isLoading}
        />
        <StatCard
          title="This Week"
          value={metrics?.reportsThisWeek?.toString() || '0'}
          icon={Calendar}
          trend="up"
          change="+12"
          description="Reports generated"
          loading={isLoading}
        />
        <StatCard
          title="Data Points"
          value={`${((metrics?.dataPoints || 0) / 1000000).toFixed(1)}M`}
          icon={Database}
          trend="up"
          description="Total tracked"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reports by Category */}
        <ResponsivePieChart
          title="Reports by Category"
          description="Distribution of reports across categories"
          data={categoryChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Performance Metrics Trend */}
        <ResponsiveLineChart
          title="Performance Metrics Trend"
          description="Fleet utilization, efficiency, and availability over time"
          data={performanceMetricsTrend}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* KPI Cards Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full" />
            ))
          ) : (
            kpis.slice(0, 8).map((kpi, idx) => (
              <motion.div
                key={kpi.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {kpi.name}
                      </span>
                      {kpi.trend && (
                        <Badge
                          variant={
                            kpi.trend === 'up'
                              ? 'default'
                              : kpi.trend === 'down'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-2xl font-bold">
                      {kpi.unit === '$' && kpi.unit}
                      {kpi.value.toLocaleString()}
                      {kpi.unit !== '$' && kpi.unit}
                    </div>
                    {kpi.change && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {kpi.change > 0 ? '+' : ''}
                        {kpi.change.toLocaleString()}
                        {kpi.unit} vs last period
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Reports Tab - Report listing and management
 */
function ReportsContent() {
  const {
    recentReports,
    upcomingReports,
    metrics,
    reportGenerationTrend,
    isLoading,
    lastUpdate,
  } = useReactiveAnalyticsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            Manage and generate analytics reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Report
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={metrics?.totalReports?.toString() || '0'}
          icon={FileText}
          trend="neutral"
          description="All reports"
          loading={isLoading}
        />
        <StatCard
          title="Scheduled"
          value={metrics?.scheduledReports?.toString() || '0'}
          icon={Calendar}
          trend="up"
          description="Auto-generated"
          loading={isLoading}
        />
        <StatCard
          title="Custom Reports"
          value={metrics?.customReports?.toString() || '0'}
          icon={ChartBar}
          trend="up"
          change="+2"
          description="User created"
          loading={isLoading}
        />
        <StatCard
          title="This Week"
          value={metrics?.reportsThisWeek?.toString() || '0'}
          icon={TrendUp}
          trend="up"
          change="+12"
          description="Generated"
          loading={isLoading}
        />
      </div>

      {/* Report Generation Trend */}
      <ResponsiveBarChart
        title="Report Generation Trend"
        description="Weekly report generation statistics"
        data={reportGenerationTrend}
        height={300}
        loading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Recent Reports</CardTitle>
            </div>
            <CardDescription>Latest generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentReports.length > 0 ? (
              <div className="space-y-3">
                {recentReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.category.charAt(0).toUpperCase() + report.category.slice(1)} •{' '}
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </p>
                      {report.lastRun && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last run: {new Date(report.lastRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{report.status}</Badge>
                      <button className="p-2 hover:bg-accent rounded-md">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-accent rounded-md">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent reports</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Scheduled Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-500" />
              <CardTitle>Upcoming Scheduled Reports</CardTitle>
            </div>
            <CardDescription>Reports scheduled to run soon</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingReports.length > 0 ? (
              <div className="space-y-3">
                {upcomingReports.map((report, idx) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.frequency.charAt(0).toUpperCase() + report.frequency.slice(1)}
                      </p>
                      {report.nextRun && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Next run: {new Date(report.nextRun).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {report.frequency}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming reports</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Dashboards Tab - Custom dashboard widgets
 */
function DashboardsContent() {
  const {
    dashboards,
    dashboardStats,
    typeChartData,
    isLoading,
    lastUpdate,
  } = useReactiveAnalyticsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboards</h2>
          <p className="text-muted-foreground">
            Custom analytics dashboards and widgets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Dashboard
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Dashboards"
          value={dashboards.length.toString()}
          icon={PresentationChart}
          trend="neutral"
          description="Custom views"
          loading={isLoading}
        />
        <StatCard
          title="Total Views"
          value={dashboardStats.totalViews.toString()}
          icon={Eye}
          trend="up"
          change="+45"
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Unique Users"
          value={dashboardStats.uniqueUsers.toString()}
          icon={Database}
          trend="up"
          description="Active users"
          loading={isLoading}
        />
        <StatCard
          title="Avg Session"
          value={`${dashboardStats.avgSessionDuration}m`}
          icon={TrendUp}
          trend="up"
          description="Duration"
          loading={isLoading}
        />
      </div>

      {/* Widget Type Distribution */}
      <ResponsivePieChart
        title="Widget Type Distribution"
        description="Distribution of dashboard widget types"
        data={typeChartData}
        innerRadius={60}
        loading={isLoading}
      />

      {/* Dashboard List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PresentationChart className="h-5 w-5 text-primary" />
            <CardTitle>Your Dashboards</CardTitle>
          </div>
          <CardDescription>Manage and view custom dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : dashboards.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {dashboards.map((dashboard, idx) => (
                <motion.div
                  key={dashboard.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{dashboard.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dashboard.type.charAt(0).toUpperCase() + dashboard.type.slice(1)} Widget
                      </p>
                    </div>
                    <Badge variant="outline">{dashboard.dataSource}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Refresh: {dashboard.refreshInterval / 1000}s</span>
                    <button className="text-primary hover:underline">View</button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <PresentationChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No dashboards created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Trends Tab - Trend analysis and forecasting
 */
function TrendsContent() {
  const {
    costTrends,
    revenueVsCost,
    performanceMetricsTrend,
    isLoading,
    lastUpdate,
  } = useReactiveAnalyticsData()

  // Calculate trend metrics
  const currentMonthCost = costTrends[costTrends.length - 1]?.total || 0
  const previousMonthCost = costTrends[costTrends.length - 2]?.total || 0
  const costChange = currentMonthCost - previousMonthCost

  const currentQRevenue = revenueVsCost[revenueVsCost.length - 1]?.revenue || 0
  const currentQCosts = revenueVsCost[revenueVsCost.length - 1]?.costs || 0
  const currentMargin = revenueVsCost[revenueVsCost.length - 1]?.margin || 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trends</h2>
          <p className="text-muted-foreground">
            Historical trends and performance analysis
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Monthly Cost"
          value={`$${(currentMonthCost / 1000).toFixed(0)}K`}
          icon={CurrencyDollar}
          trend={costChange < 0 ? 'down' : 'up'}
          change={`${costChange > 0 ? '+' : ''}$${Math.abs(costChange / 1000).toFixed(1)}K`}
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Revenue"
          value={`$${(currentQRevenue / 1000).toFixed(0)}K`}
          icon={TrendUp}
          trend="up"
          description="Current quarter"
          loading={isLoading}
        />
        <StatCard
          title="Operating Costs"
          value={`$${(currentQCosts / 1000).toFixed(0)}K`}
          icon={Gauge}
          trend="down"
          description="Current quarter"
          loading={isLoading}
        />
        <StatCard
          title="Profit Margin"
          value={`${currentMargin.toFixed(1)}%`}
          icon={ChartLine}
          trend="up"
          change="+2.1%"
          description="Current quarter"
          loading={isLoading}
        />
      </div>

      {/* Cost Trends */}
      <ResponsiveLineChart
        title="Cost Trends"
        description="Monthly breakdown of fuel, maintenance, and operations costs"
        data={costTrends}
        height={350}
        showArea
        loading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue vs Cost Analysis */}
        <ResponsiveBarChart
          title="Revenue vs Cost Analysis"
          description="Quarterly revenue and cost comparison with profit margins"
          data={revenueVsCost}
          height={300}
          loading={isLoading}
        />

        {/* Performance Metrics Trend */}
        <ResponsiveLineChart
          title="Performance Metrics"
          description="Fleet utilization, efficiency, and availability trends"
          data={performanceMetricsTrend}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Trend Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Insights</CardTitle>
          <CardDescription>AI-powered insights from trend analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                icon: TrendUp,
                title: 'Cost Reduction Trend',
                description: 'Operating costs have decreased by 12% over the last 3 months',
                variant: 'success' as const,
              },
              {
                icon: Gauge,
                title: 'Utilization Improvement',
                description: 'Fleet utilization has improved from 82% to 89% in Q2',
                variant: 'default' as const,
              },
              {
                icon: CurrencyDollar,
                title: 'Fuel Efficiency Gains',
                description: 'Fuel costs per mile reduced by 7¢ through route optimization',
                variant: 'success' as const,
              },
              {
                icon: ChartBar,
                title: 'Margin Growth',
                description: 'Profit margins increased by 6 percentage points quarter-over-quarter',
                variant: 'default' as const,
              },
            ].map((insight, idx) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50"
              >
                <div className="p-2 rounded-md bg-primary/10">
                  <insight.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
                <Badge variant={insight.variant}>Positive</Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main AnalyticsHub Component
 */
export default function AnalyticsHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <AnalyticsIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <AnalyticsOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading reports...</div>}>
            <ReportsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'dashboards',
      label: 'Dashboards',
      icon: <PresentationChart className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading dashboards...</div>}>
            <DashboardsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: <TrendUp className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading trends...</div>}>
            <TrendsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Analytics Hub"
      description="Advanced analytics, reporting, and trend analysis"
      icon={<AnalyticsIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
