/**
 * OperationsHub - Modern Operations Management Dashboard
 * Real-time dispatch, routing, and task tracking with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  Broadcast as OperationsIcon,
  MapTrifold,
  RadioButton,
  CheckSquare,
  CalendarDots,
  Truck,
  Package,
  Warning,
  Plus,
  Clock,
  Lightning,
  Path,
  MapPin,
  GasPump,
} from '@phosphor-icons/react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveOperationsData } from '@/hooks/use-reactive-operations-data'
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
 * Dispatch & Operations Tab - Active jobs and dispatch metrics
 */
function DispatchOverview() {
  const {
    routes,
    metrics,
    statusDistribution,
    completionTrendData,
    isLoading,
    lastUpdate,
  } = useReactiveOperationsData()

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    fill:
      name === 'completed'
        ? 'hsl(var(--success))'
        : name === 'in_transit'
          ? 'hsl(var(--primary))'
          : name === 'delayed'
            ? 'hsl(var(--destructive))'
            : 'hsl(var(--warning))',
  }))

  // Get delayed routes
  const delayedRoutes = routes.filter((r) => r.status === 'delayed').slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispatch Console</h2>
          <p className="text-muted-foreground">
            Real-time job management and driver assignments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Job
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Jobs"
          value={metrics?.activeJobs?.toString() || '0'}
          icon={Package}
          trend="up"
          change="+4"
          description="Currently dispatched"
          loading={isLoading}
        />
        <StatCard
          title="In Transit"
          value={metrics?.scheduled?.toString() || '0'}
          icon={Truck}
          trend="neutral"
          description="En route"
          loading={isLoading}
        />
        <StatCard
          title="Completed Today"
          value={metrics?.completed?.toString() || '0'}
          icon={CheckSquare}
          trend="up"
          change="+12%"
          description="Jobs finished"
          loading={isLoading}
        />
        <StatCard
          title="Delayed"
          value={metrics?.delayed?.toString() || '0'}
          icon={Warning}
          trend="down"
          change="-2"
          description="Behind schedule"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Route Status Distribution */}
        <ResponsivePieChart
          title="Route Status Distribution"
          description="Current status of all routes"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Weekly Completion Trend */}
        <ResponsiveLineChart
          title="Daily Completion Trend"
          description="Jobs completed vs target over the past week"
          data={completionTrendData}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* Delayed Routes Alert Section */}
      {delayedRoutes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Warning className="h-5 w-5 text-amber-500" />
              <CardTitle>Delayed Routes</CardTitle>
            </div>
            <CardDescription>Routes behind schedule requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {delayedRoutes.map((route, idx) => (
                  <motion.div
                    key={route.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">Route #{route.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        Driver: {route.driverId} • Distance: {route.distance}mi
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {route.status.toUpperCase()}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border">
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
          <Lightning className="h-4 w-4" />
          Optimize Routes
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
          <MapTrifold className="h-4 w-4" />
          View Map
        </button>
      </div>
    </div>
  )
}

/**
 * Routes Tab - Route management and optimization
 */
function RoutesContent() {
  const { routes, totalDistance, isLoading, lastUpdate } = useReactiveOperationsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Route Management</h2>
          <p className="text-muted-foreground">
            Optimize and monitor delivery routes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Route
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Active Routes"
          value={routes?.length?.toString() || '0'}
          icon={MapTrifold}
          description="Currently active"
          loading={isLoading}
        />
        <StatCard
          title="Total Distance"
          value={`${totalDistance?.toFixed(0) || 0} mi`}
          icon={Path}
          trend="up"
          description="Distance covered"
          loading={isLoading}
        />
        <StatCard
          title="Avg Duration"
          value="2.4 hrs"
          icon={Clock}
          description="Average route time"
          loading={isLoading}
        />
      </div>

      {/* Optimization Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightning className="h-5 w-5 text-amber-500" />
            <CardTitle>Optimization Insights</CardTitle>
          </div>
          <CardDescription>AI-powered route optimization suggestions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <Path className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Route clustering saved 156 miles today</p>
                  <p className="text-sm text-muted-foreground">3.2 hours of drive time reduced</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">3 routes can be consolidated</p>
                  <p className="text-sm text-muted-foreground">Afternoon delivery optimization opportunity</p>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium">Earlier departure recommended for Route 12</p>
                  <p className="text-sm text-muted-foreground">Traffic patterns suggest 8:30 AM start</p>
                </div>
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Tasks Tab - Task management
 */
function TasksContent() {
  const { isLoading, lastUpdate } = useReactiveOperationsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>
          <p className="text-muted-foreground">
            Track and manage operational tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tasks"
          value="34"
          icon={CheckSquare}
          description="Pending completion"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value="12"
          icon={Clock}
          description="Currently active"
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value="89"
          icon={CheckSquare}
          trend="up"
          description="This week"
          loading={isLoading}
        />
        <StatCard
          title="Overdue"
          value="2"
          icon={Warning}
          trend="down"
          description="Needs attention"
          loading={isLoading}
        />
      </div>
    </div>
  )
}

/**
 * Fuel & Operations Tab - Fuel consumption tracking
 */
function FuelContent() {
  const { fuelTransactions, totalFuelCost, fuelConsumptionData, isLoading, lastUpdate } = useReactiveOperationsData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fuel Operations</h2>
          <p className="text-muted-foreground">
            Track fuel consumption and costs
          </p>
        </div>
        <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Fuel Cost"
          value={`$${totalFuelCost?.toFixed(0) || 0}`}
          icon={GasPump}
          trend="up"
          description="This week"
          loading={isLoading}
        />
        <StatCard
          title="Transactions Today"
          value={fuelTransactions?.length?.toString() || '0'}
          icon={Package}
          description="Fuel purchases"
          loading={isLoading}
        />
        <StatCard
          title="Avg Cost/Gallon"
          value="$4.00"
          icon={GasPump}
          trend="down"
          description="Current average"
          loading={isLoading}
        />
      </div>

      {/* Fuel Consumption Chart */}
      <ResponsiveBarChart
        title="Weekly Fuel Consumption"
        description="Gallons and costs by day of the week"
        data={fuelConsumptionData}
        height={300}
        loading={isLoading}
      />
    </div>
  )
}

/**
 * Main OperationsHub Component
 */
export default function OperationsHub() {
  const tabs = [
    {
      id: 'dispatch',
      label: 'Dispatch',
      icon: <RadioButton className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <DispatchOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'routes',
      label: 'Routes',
      icon: <MapTrifold className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading routes...</div>}>
            <RoutesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading tasks...</div>}>
            <TasksContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'fuel',
      label: 'Fuel',
      icon: <GasPump className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading fuel data...</div>}>
            <FuelContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Operations Hub"
      description="Dispatch, routing, and task management"
      icon={<OperationsIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="dispatch"
    />
  )
}
