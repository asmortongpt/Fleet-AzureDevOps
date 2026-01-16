/**
 * WorkHub - Modern Work Management Dashboard
 * Real-time work order monitoring with responsive visualizations
 */

import { motion } from 'framer-motion'
import { Suspense } from 'react'
import {
  CheckSquare,
  ListChecks,
  FolderKanban,
  Users,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  Clock,
  DollarSign,
  Wrench,
  Package,
  Calendar,
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { useReactiveWorkData } from '@/hooks/use-reactive-work-data'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/**
 * Work Overview Tab - Main dashboard with real-time metrics
 */
function WorkOverview() {
  const {
    metrics,
    statusDistribution,
    priorityDistribution,
    typeDistribution,
    highPriorityOrders,
    overdueOrders,
    completionTrend,
    isLoading,
    lastUpdate,
  } = useReactiveWorkData()

  // Prepare chart data
  const statusChartData = Object.entries(statusDistribution).map(([name, value]) => ({
    name: name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' '),
    value,
    fill:
      name === 'open' || name === 'assigned'
        ? 'hsl(var(--primary))'
        : name === 'in_progress'
          ? 'hsl(var(--chart-2))'
          : name === 'completed' || name === 'closed'
            ? 'hsl(var(--chart-4))'
            : name === 'on_hold' || name === 'waiting_parts' || name === 'waiting_approval'
              ? 'hsl(var(--warning))'
              : 'hsl(var(--muted))',
  }))

  const priorityChartData = Object.entries(priorityDistribution)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .sort((a, b) => {
      const order = { critical: 0, urgent: 1, high: 2, medium: 3, low: 4 }
      return (order[a.name.toLowerCase() as keyof typeof order] || 5) - (order[b.name.toLowerCase() as keyof typeof order] || 5)
    })

  const typeChartData = Object.entries(typeDistribution)
    .map(([name, value]) => ({
      name: name
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8) // Top 8 types

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Overview</h2>
          <p className="text-muted-foreground">
            Real-time work order status and performance metrics
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
          icon={ClipboardList}
          trend="neutral"
          description="All work orders"
          loading={isLoading}
        />
        <StatCard
          title="Active Tasks"
          value={metrics?.activeTasks?.toString() || '0'}
          icon={ListChecks}
          trend="up"
          description="Currently in progress"
          loading={isLoading}
        />
        <StatCard
          title="Completion Rate"
          value={`${metrics?.completionRate?.toFixed(1) || '0'}%`}
          icon={TrendingUp}
          trend={metrics && metrics.completionRate >= 80 ? 'up' : metrics && metrics.completionRate >= 60 ? 'neutral' : 'down'}
          description="Work orders completed"
          loading={isLoading}
        />
        <StatCard
          title="Team Utilization"
          value={`${metrics?.teamUtilization?.toFixed(0) || '0'}%`}
          icon={Users}
          trend={metrics && metrics.teamUtilization >= 75 ? 'up' : metrics && metrics.teamUtilization >= 50 ? 'neutral' : 'down'}
          description="Team capacity"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Work Order Status Distribution */}
        <ResponsivePieChart
          title="Work Order Status Distribution"
          description="Current status breakdown of all work orders"
          data={statusChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Work Orders by Priority */}
        <ResponsiveBarChart
          title="Work Orders by Priority"
          description="Priority distribution across all work orders"
          data={priorityChartData}
          height={300}
          loading={isLoading}
        />
      </div>

      {/* Work Order Type Distribution */}
      <ResponsiveBarChart
        title="Work Orders by Type"
        description="Top work order types in your fleet"
        data={typeChartData}
        height={300}
        loading={isLoading}
      />

      {/* Completion Trend */}
      <ResponsiveLineChart
        title="Work Order Completion Trend"
        description="Daily completed work orders over the last 7 days"
        data={completionTrend}
        height={300}
        showArea
        loading={isLoading}
      />

      {/* Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* High Priority Work Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle>High Priority Work Orders</CardTitle>
            </div>
            <CardDescription>Critical and urgent work orders requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : highPriorityOrders.length > 0 ? (
              <div className="space-y-2">
                {highPriorityOrders.slice(0, 5).map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{order.work_order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.type.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge
                      variant={
                        order.priority === 'critical' || order.priority === 'urgent'
                          ? 'destructive'
                          : 'warning'
                      }
                    >
                      {order.priority}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No high priority work orders
              </p>
            )}
          </CardContent>
        </Card>

        {/* Overdue Work Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <CardTitle>Overdue Work Orders</CardTitle>
            </div>
            <CardDescription>Work orders past their scheduled end date</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : overdueOrders.length > 0 ? (
              <div className="space-y-2">
                {overdueOrders.slice(0, 5).map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium">{order.work_order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(order.scheduled_end!).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No overdue work orders
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Work Orders Tab - Detailed work order management
 */
function WorkOrdersTab() {
  const { workOrders, metrics, isLoading } = useReactiveWorkData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Orders</h2>
          <p className="text-muted-foreground">Manage and track all work orders</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open"
          value={metrics?.openWorkOrders?.toString() || '0'}
          icon={ClipboardList}
          trend="neutral"
          description="Pending assignment"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={metrics?.inProgressWorkOrders?.toString() || '0'}
          icon={Wrench}
          trend="neutral"
          description="Being worked on"
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value={metrics?.completedWorkOrders?.toString() || '0'}
          icon={CheckSquare}
          trend="up"
          description="Successfully finished"
          loading={isLoading}
        />
        <StatCard
          title="Avg Completion"
          value={`${metrics?.avgCompletionTime?.toFixed(1) || '0'}h`}
          icon={Clock}
          trend="neutral"
          description="Average hours"
          loading={isLoading}
        />
      </div>

      {/* Work Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Work Orders</CardTitle>
          <CardDescription>Recent work orders across all facilities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : workOrders.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrders.slice(0, 10).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.work_order_number}
                      </TableCell>
                      <TableCell>
                        {order.type.replace('_', ' ').charAt(0).toUpperCase() + order.type.slice(1)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.priority === 'critical' || order.priority === 'urgent'
                              ? 'destructive'
                              : order.priority === 'high'
                                ? 'warning'
                                : 'secondary'
                          }
                        >
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.scheduled_start
                          ? new Date(order.scheduled_start).toLocaleDateString()
                          : 'Not scheduled'}
                      </TableCell>
                      <TableCell className="text-right">
                        ${((order.labor_cost || 0) + (order.parts_cost || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No work orders found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Tasks Tab - Task board with Kanban view
 */
function TasksTab() {
  const { tasks, taskStatusDistribution, isLoading } = useReactiveWorkData()

  const todoTasks = tasks.filter((t) => t.status === 'todo')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const doneTasks = tasks.filter((t) => t.status === 'done')
  const blockedTasks = tasks.filter((t) => t.status === 'blocked')

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Track and manage individual tasks</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="To Do"
          value={todoTasks.length.toString()}
          icon={ListChecks}
          trend="neutral"
          description="Pending tasks"
          loading={isLoading}
        />
        <StatCard
          title="In Progress"
          value={inProgressTasks.length.toString()}
          icon={Clock}
          trend="neutral"
          description="Being worked on"
          loading={isLoading}
        />
        <StatCard
          title="Done"
          value={doneTasks.length.toString()}
          icon={CheckSquare}
          trend="up"
          description="Completed tasks"
          loading={isLoading}
        />
        <StatCard
          title="Blocked"
          value={blockedTasks.length.toString()}
          icon={AlertTriangle}
          trend={blockedTasks.length > 0 ? 'down' : 'neutral'}
          description="Needs attention"
          loading={isLoading}
        />
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* To Do Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              To Do
              <Badge variant="secondary" className="ml-auto">
                {todoTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : todoTasks.length > 0 ? (
              <div className="space-y-2">
                {todoTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border p-3 hover:bg-accent/50"
                  >
                    <p className="font-medium">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {task.priority}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No tasks</p>
            )}
          </CardContent>
        </Card>

        {/* In Progress Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              In Progress
              <Badge variant="secondary" className="ml-auto">
                {inProgressTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : inProgressTasks.length > 0 ? (
              <div className="space-y-2">
                {inProgressTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-primary/20 bg-primary/5 p-3 hover:bg-primary/10"
                  >
                    <p className="font-medium">{task.title}</p>
                    {task.assigned_to && (
                      <p className="text-xs text-muted-foreground">
                        Assigned: {task.assigned_to}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {task.priority}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Done Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Done
              <Badge variant="secondary" className="ml-auto">
                {doneTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : doneTasks.length > 0 ? (
              <div className="space-y-2">
                {doneTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 hover:bg-green-500/10"
                  >
                    <p className="font-medium line-through">{task.title}</p>
                    {task.completed_at && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(task.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Blocked Column */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Blocked
              <Badge variant="secondary" className="ml-auto">
                {blockedTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : blockedTasks.length > 0 ? (
              <div className="space-y-2">
                {blockedTasks.slice(0, 5).map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 hover:bg-red-500/10"
                  >
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <Badge variant="destructive" className="mt-2">
                      {task.priority}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No tasks</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Projects Tab - Project tracking and team allocation
 */
function ProjectsTab() {
  const { projects, activeProjects, teamAssignments, metrics, isLoading } = useReactiveWorkData()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage projects and team allocation</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={projects.length.toString()}
          icon={FolderKanban}
          trend="neutral"
          description="All projects"
          loading={isLoading}
        />
        <StatCard
          title="Active Projects"
          value={activeProjects.length.toString()}
          icon={TrendingUp}
          trend="up"
          description="Currently running"
          loading={isLoading}
        />
        <StatCard
          title="Total Cost"
          value={`$${metrics?.totalCost?.toLocaleString() || '0'}`}
          icon={DollarSign}
          trend="neutral"
          description="All work orders"
          loading={isLoading}
        />
        <StatCard
          title="Team Size"
          value={teamAssignments.length.toString()}
          icon={Users}
          trend="neutral"
          description="Active technicians"
          loading={isLoading}
        />
      </div>

      {/* Projects Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
            <CardDescription>Currently running projects</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : activeProjects.length > 0 ? (
              <div className="space-y-4">
                {activeProjects.slice(0, 5).map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <Badge variant="outline">{project.status}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {project.completion_percentage}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${project.completion_percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.start_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {project.team_members.length} members
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No active projects</p>
            )}
          </CardContent>
        </Card>

        {/* Team Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Team Utilization</CardTitle>
            <CardDescription>Technician workload and capacity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : teamAssignments.length > 0 ? (
              <div className="space-y-4">
                {teamAssignments.slice(0, 6).map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{member.technician_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.active_work_orders} active orders •{' '}
                          {member.total_hours_this_week.toFixed(1)}h this week
                        </p>
                      </div>
                      <Badge
                        variant={
                          member.utilization_percentage >= 90
                            ? 'destructive'
                            : member.utilization_percentage >= 70
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {member.utilization_percentage}%
                      </Badge>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${
                          member.utilization_percentage >= 90
                            ? 'bg-destructive'
                            : member.utilization_percentage >= 70
                              ? 'bg-amber-500'
                              : 'bg-primary'
                        }`}
                        style={{ width: `${member.utilization_percentage}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No team data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Labor and parts cost analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Labor Cost
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${metrics?.totalLabor?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-chart-2" />
                <span className="text-sm font-medium text-muted-foreground">
                  Parts Cost
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${metrics?.totalParts?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-chart-4" />
                <span className="text-sm font-medium text-muted-foreground">
                  Total Cost
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                ${metrics?.totalCost?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main WorkHub Component
 */
export default function WorkHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <ClipboardList className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <WorkOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'work-orders',
      label: 'Work Orders',
      icon: <Wrench className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading work orders...</p>
                </div>
              </div>
            }
          >
            <WorkOrdersTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: <ListChecks className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading tasks...</p>
                </div>
              </div>
            }
          >
            <TasksTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: <FolderKanban className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-[600px] items-center justify-center">
                <div className="space-y-4 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading projects...</p>
                </div>
              </div>
            }
          >
            <ProjectsTab />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Work Hub"
      description="Comprehensive work management and task tracking"
      icon={<CheckSquare className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
