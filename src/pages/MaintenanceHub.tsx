/**
 * MaintenanceHub - Modern Maintenance Management Dashboard
 * Real-time maintenance tracking with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  Wrench,
  Warehouse,
  ChartLine,
  CalendarDots,
  ClipboardText,
  Lightning,
  CurrencyDollar,
  Plus,
  TrendUp,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveMaintenanceData } from '@/hooks/use-reactive-maintenance-data'
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
 * Garage & Service Tab - Work orders and bay utilization
 */
function GarageOverview() {
  const {
    workOrders,
    metrics,
    statusDistribution,
    priorityDistribution,
    isLoading,
    lastUpdate,
  } = useReactiveMaintenanceData()

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    fill:
      name === 'completed'
        ? 'hsl(var(--success))'
        : name === 'in_progress'
          ? 'hsl(var(--warning))'
          : name === 'parts_waiting'
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--primary))',
  }))

  const priorityChartData = Object.entries(priorityDistribution)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => {
      const order = { urgent: 4, high: 3, medium: 2, low: 1 }
      return (order[b.name.toLowerCase()] || 0) - (order[a.name.toLowerCase()] || 0)
    })

  // Get urgent work orders
  const urgentOrders = workOrders.filter((wo) => wo.priority === 'urgent').slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Garage & Service</h2>
          <p className="text-muted-foreground">
            Active work orders and bay status
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Work Orders"
          value={metrics?.totalWorkOrders?.toString() || '0'}
          icon={ClipboardText}
          trend="neutral"
          description="All orders"
          loading={isLoading}
        />
        <StatCard
          title="Urgent Orders"
          value={metrics?.urgentOrders?.toString() || '0'}
          icon={Lightning}
          trend="down"
          change="-2"
          description="High priority"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={metrics?.inProgress?.toString() || '0'}
          icon={Wrench}
          trend="neutral"
          description="Being worked on"
          loading={isLoading}
        />
        <StatCard
          title="Parts Waiting"
          value={metrics?.partsWaiting?.toString() || '0'}
          icon={Warehouse}
          trend={metrics && metrics.partsWaiting > 5 ? 'down' : 'neutral'}
          description="Awaiting parts"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Order Status Distribution */}
        <ResponsivePieChart
          title="Work Order Status"
          description="Distribution of orders by current status"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Priority Distribution */}
        <ResponsiveBarChart
          title="Priority Breakdown"
          description="Work orders by priority level"
          data={priorityChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Urgent Orders Alert Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightning className="h-5 w-5 text-amber-500" />
            <CardTitle>Urgent Work Orders</CardTitle>
          </div>
          <CardDescription>High-priority orders requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : urgentOrders.length > 0 ? (
            <div className="space-y-2">
              {urgentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                >
                  <div>
                    <p className="font-medium">Work Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {order.type} • Est: {order.estimatedHours}h
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {order.priority.toUpperCase()}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No urgent work orders at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Predictive Maintenance Tab - AI-powered insights
 */
function PredictiveContent() {
  const { isLoading, lastUpdate } = useReactiveMaintenanceData()

  // Mock predictive data (would come from ML API)
  const predictions = [
    { vehicle: 'Ford F-150 #1042', issue: 'Brake wear detected', confidence: 94, daysUntilFailure: 14 },
    { vehicle: 'Toyota Camry #VEH-002', issue: 'Oil change needed', confidence: 89, daysUntilFailure: 7 },
    { vehicle: 'Ford Transit #VEH-001', issue: 'Tire rotation recommended', confidence: 92, daysUntilFailure: 21 },
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Predictive Maintenance</h2>
          <p className="text-muted-foreground">
            AI-powered failure prediction and prevention
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Badge>
      </div>

      {/* Predictive Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Predictions"
          value="156"
          icon={ChartLine}
          trend="up"
          change="+12"
          description="Vehicles monitored"
          loading={isLoading}
        />
        <StatCard
          title="Alerts"
          value="8"
          icon={Lightning}
          trend="down"
          change="-3"
          description="Requiring attention"
          loading={isLoading}
        />
        <StatCard
          title="Prevented Failures"
          value="12"
          icon={TrendUp}
          trend="up"
          description="This month"
          loading={isLoading}
        />
        <StatCard
          title="Cost Savings"
          value="$28K"
          icon={CurrencyDollar}
          trend="up"
          description="YTD savings"
          loading={isLoading}
        />
      </div>

      {/* AI Predictions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightning className="h-5 w-5 text-amber-500" />
            <CardTitle>AI-Powered Insights</CardTitle>
          </div>
          <CardDescription>ML Model v2.4 • 94% Accuracy</CardDescription>
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
              {predictions.map((prediction, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{prediction.vehicle}</p>
                    <p className="text-sm text-muted-foreground">{prediction.issue}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {prediction.confidence}% • Est. {prediction.daysUntilFailure} days
                    </p>
                  </div>
                  <Badge variant={prediction.daysUntilFailure < 10 ? 'destructive' : 'warning'}>
                    {prediction.daysUntilFailure}d
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
 * Calendar Tab - Maintenance scheduling
 */
function CalendarContent() {
  const { isLoading, lastUpdate } = useReactiveMaintenanceData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Calendar</h2>
          <p className="text-muted-foreground">
            Scheduled maintenance and service planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Schedule
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today"
          value="4"
          icon={CalendarDots}
          description="Scheduled today"
          loading={isLoading}
        />
        <StatCard
          title="This Week"
          value="18"
          icon={CalendarDots}
          trend="up"
          description="7-day schedule"
          loading={isLoading}
        />
        <StatCard
          title="Overdue"
          value="2"
          icon={Lightning}
          trend="down"
          description="Needs attention"
          loading={isLoading}
        />
      </div>

      {/* Calendar placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
          <CardDescription>Appointments and preventive maintenance</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Calendar view coming soon
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Requests Tab - Maintenance request tracking
 */
function RequestsContent() {
  const { requestMetrics, requestTrendData, isLoading, lastUpdate } = useReactiveMaintenanceData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maintenance Requests</h2>
          <p className="text-muted-foreground">
            Driver and fleet maintenance request tracking
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      {/* Request Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="New Requests"
          value={requestMetrics?.newRequests?.toString() || '0'}
          icon={ClipboardText}
          trend="neutral"
          description="Awaiting review"
          loading={isLoading}
        />
        <StatCard
          title="In Review"
          value={requestMetrics?.inReview?.toString() || '0'}
          icon={ChartLine}
          trend="neutral"
          description="Being evaluated"
          loading={isLoading}
        />
        <StatCard
          title="Approved"
          value={requestMetrics?.approved?.toString() || '0'}
          icon={TrendUp}
          trend="up"
          description="Ready to schedule"
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value={requestMetrics?.completed?.toString() || '0'}
          icon={Wrench}
          trend="up"
          change="+12"
          description="This week"
          loading={isLoading}
        />
      </div>

      {/* Request Trend Chart */}
      <ResponsiveLineChart
        title="Request Volume Trend"
        description="Daily maintenance request submissions over the past week"
        data={requestTrendData}
        height={300}
        showArea
        loading={isLoading}
      />
    </div>
  )
}

/**
 * Main MaintenanceHub Component
 */
export default function MaintenanceHub() {
  const tabs = [
    {
      id: 'garage',
      label: 'Garage',
      icon: <Warehouse className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <GarageOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'predictive',
      label: 'Predictive',
      icon: <ChartLine className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading predictive maintenance...</div>}>
            <PredictiveContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: <CalendarDots className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading calendar...</div>}>
            <CalendarContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: <ClipboardText className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading requests...</div>}>
            <RequestsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Maintenance Hub"
      description="Garage services and predictive maintenance"
      icon={<Wrench className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="garage"
    />
  )
}
