/**
 * OperationsHubDrilldowns - List/Detail views for Operations Hub drill-down navigation
 *
 * Provides comprehensive drill-down views for:
 * - Jobs (Active, Completed, Delayed)
 * - Routes (Active routes with stops)
 * - Tasks (Open, overdue with dependencies)
 *
 * Note: AlertDetailPanel is provided by AlertDrilldowns.tsx
 */

import {
  Package,
  NavigationArrow,
  CheckCircle,
  Clock,
  Warning,
  MapPin,
  User,
  Truck,
  XCircle,
  TrendUp,
  ListChecks
} from '@phosphor-icons/react'
import { useMemo } from 'react'
import useSWR from 'swr'

import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'


// Note: Button component removed as it's not used in this file

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface JobData {
  id: string
  number?: string
  title?: string
  status: 'active' | 'pending' | 'completed' | 'delayed' | 'cancelled'
  priority?: 'high' | 'medium' | 'low'
  vehicleId?: string
  vehicleName?: string
  driverId?: string
  driverName?: string
  origin?: string
  destination?: string
  scheduledStart?: string
  scheduledEnd?: string
  actualStart?: string
  actualEnd?: string
  delayMinutes?: number
  completionPercent?: number
}

interface RouteData {
  id: string
  number?: string
  name?: string
  status: 'active' | 'planned' | 'completed' | 'cancelled'
  vehicleId?: string
  vehicleName?: string
  driverId?: string
  driverName?: string
  stops?: number
  stopsCompleted?: number
  totalDistance?: number
  distanceCovered?: number
  estimatedTime?: number
  actualTime?: number
  optimized?: boolean
}

interface TaskData {
  id: string
  title: string
  description?: string
  status: 'open' | 'in-progress' | 'completed' | 'blocked'
  priority?: 'high' | 'medium' | 'low'
  assignedToId?: string
  assignedToName?: string
  assignedToType?: 'driver' | 'vehicle' | 'user'
  dueDate?: string
  createdDate: string
  completedDate?: string
  dependencies?: string[]
  blockedBy?: string
}

// ============================================================================
// DEMO DATA
// ============================================================================

const demoJobs: JobData[] = [
  {
    id: 'job-001',
    number: 'JOB-1001',
    title: 'Downtown Delivery Route',
    status: 'active',
    priority: 'high',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    origin: '123 Main St, Tallahassee, FL',
    destination: '456 Oak Ave, Tallahassee, FL',
    scheduledStart: '2026-01-03T08:00:00',
    scheduledEnd: '2026-01-03T16:00:00',
    actualStart: '2026-01-03T08:15:00',
    completionPercent: 65
  },
  {
    id: 'job-002',
    number: 'JOB-1002',
    title: 'Airport Cargo Pickup',
    status: 'delayed',
    priority: 'high',
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    driverId: 'drv-002',
    driverName: 'Sarah Johnson',
    origin: 'Tallahassee Airport',
    destination: 'Distribution Center',
    scheduledStart: '2026-01-03T10:00:00',
    scheduledEnd: '2026-01-03T12:00:00',
    actualStart: '2026-01-03T10:25:00',
    delayMinutes: 25,
    completionPercent: 40
  },
  {
    id: 'job-003',
    number: 'JOB-1003',
    title: 'North Campus Deliveries',
    status: 'completed',
    priority: 'medium',
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    driverId: 'drv-003',
    driverName: 'Mike Davis',
    origin: 'Warehouse A',
    destination: 'FSU North Campus',
    scheduledStart: '2026-01-03T06:00:00',
    scheduledEnd: '2026-01-03T10:00:00',
    actualStart: '2026-01-03T06:00:00',
    actualEnd: '2026-01-03T09:45:00',
    completionPercent: 100
  },
  {
    id: 'job-004',
    number: 'JOB-1004',
    title: 'Maintenance Parts Run',
    status: 'pending',
    priority: 'low',
    origin: 'Parts Supplier',
    destination: 'Maintenance Bay',
    scheduledStart: '2026-01-03T14:00:00',
    scheduledEnd: '2026-01-03T15:30:00',
    completionPercent: 0
  },
  {
    id: 'job-005',
    number: 'JOB-1005',
    title: 'Emergency Medical Supply Transport',
    status: 'active',
    priority: 'high',
    vehicleId: 'veh-demo-1005',
    vehicleName: 'Ford Transit #1005',
    driverId: 'drv-004',
    driverName: 'Lisa Chen',
    origin: 'Medical Supply Depot',
    destination: 'Tallahassee Memorial Hospital',
    scheduledStart: '2026-01-03T11:00:00',
    scheduledEnd: '2026-01-03T12:00:00',
    actualStart: '2026-01-03T11:05:00',
    completionPercent: 80
  }
]

const demoRoutes: RouteData[] = [
  {
    id: 'route-001',
    number: 'RT-1001',
    name: 'Downtown Morning Circuit',
    status: 'active',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    stops: 12,
    stopsCompleted: 7,
    totalDistance: 45.5,
    distanceCovered: 28.3,
    estimatedTime: 240,
    actualTime: 165,
    optimized: true
  },
  {
    id: 'route-002',
    number: 'RT-1002',
    name: 'Campus Delivery Loop',
    status: 'active',
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    driverId: 'drv-003',
    driverName: 'Mike Davis',
    stops: 8,
    stopsCompleted: 8,
    totalDistance: 32.0,
    distanceCovered: 32.0,
    estimatedTime: 180,
    actualTime: 175,
    optimized: true
  },
  {
    id: 'route-003',
    number: 'RT-1003',
    name: 'Airport Shuttle Route',
    status: 'planned',
    stops: 5,
    stopsCompleted: 0,
    totalDistance: 28.0,
    estimatedTime: 120,
    optimized: false
  }
]

const demoTasks: TaskData[] = [
  {
    id: 'task-001',
    title: 'Pre-trip vehicle inspection - V-1001',
    status: 'completed',
    priority: 'high',
    assignedToId: 'drv-001',
    assignedToName: 'John Smith',
    assignedToType: 'driver',
    dueDate: '2026-01-03T08:00:00',
    createdDate: '2026-01-02T18:00:00',
    completedDate: '2026-01-03T07:45:00'
  },
  {
    id: 'task-002',
    title: 'Load verification - Job #1002',
    status: 'in-progress',
    priority: 'high',
    assignedToId: 'drv-002',
    assignedToName: 'Sarah Johnson',
    assignedToType: 'driver',
    dueDate: '2026-01-03T10:00:00',
    createdDate: '2026-01-03T09:00:00'
  },
  {
    id: 'task-003',
    title: 'Refuel vehicle before next dispatch',
    status: 'open',
    priority: 'medium',
    assignedToId: 'veh-demo-1003',
    assignedToName: 'Mercedes Sprinter #1003',
    assignedToType: 'vehicle',
    dueDate: '2026-01-03T16:00:00',
    createdDate: '2026-01-03T10:30:00'
  },
  {
    id: 'task-004',
    title: 'Update route optimization settings',
    status: 'blocked',
    priority: 'low',
    assignedToId: 'user-001',
    assignedToName: 'Operations Manager',
    assignedToType: 'user',
    dueDate: '2026-01-03T17:00:00',
    createdDate: '2026-01-02T14:00:00',
    blockedBy: 'Waiting for software update'
  },
  {
    id: 'task-005',
    title: 'Review and approve delayed job reports',
    status: 'open',
    priority: 'high',
    assignedToId: 'user-002',
    assignedToName: 'Fleet Supervisor',
    assignedToType: 'user',
    dueDate: '2026-01-03T12:00:00',
    createdDate: '2026-01-03T11:00:00'
  }
]

// ============================================================================
// JOB LIST VIEW
// ============================================================================

export function JobListView({ filter }: { filter?: string }) {
  const { data: jobs } = useSWR<JobData[]>(
    filter ? `/api/jobs?filter=${filter}` : '/api/jobs',
    fetcher,
    {
      fallbackData: demoJobs,
      shouldRetryOnError: false
    }
  )

  const filteredJobs = useMemo(() => {
    if (!filter || !jobs) return jobs || []

    switch (filter) {
      case 'active':
        return jobs.filter(j => j.status === 'active')
      case 'pending':
        return jobs.filter(j => j.status === 'pending')
      case 'completed':
        return jobs.filter(j => j.status === 'completed')
      case 'delayed':
        return jobs.filter(j => j.status === 'delayed')
      default:
        return jobs
    }
  }, [jobs, filter])

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'delayed': return 'destructive'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority?: string): 'destructive' | 'default' | 'secondary' => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const columns: DrilldownColumn<JobData>[] = [
    {
      key: 'number',
      header: 'Job #',
      sortable: true,
      render: (job) => job.number || `JOB-${job.id}`,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (job) => (
        <Badge variant={getStatusColor(job.status)}>
          {job.status}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (job) => job.priority ? (
        <Badge variant={getPriorityColor(job.priority)}>
          {job.priority}
        </Badge>
      ) : '-',
    },
    {
      key: 'vehicleName',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (job) => job.vehicleId,
        getRecordLabel: (job) => job.vehicleName || `Vehicle ${job.vehicleId}`,
      },
      render: (job) => job.vehicleName || '-',
    },
    {
      key: 'driverName',
      header: 'Driver',
      drilldown: {
        recordType: 'driver',
        getRecordId: (job) => job.driverId,
        getRecordLabel: (job) => job.driverName || `Driver ${job.driverId}`,
      },
      render: (job) => job.driverName || '-',
    },
    {
      key: 'completionPercent',
      header: 'Progress',
      render: (job) => (
        <div className="flex items-center gap-2">
          <Progress value={job.completionPercent || 0} className="w-16 h-2" />
          <span className="text-xs text-muted-foreground">{job.completionPercent || 0}%</span>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-400">
              {filteredJobs.filter(j => j.status === 'active').length}
            </div>
            <div className="text-xs text-slate-400">Active Jobs</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-400">
              {filteredJobs.filter(j => j.status === 'pending').length}
            </div>
            <div className="text-xs text-slate-400">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <Warning className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">
              {filteredJobs.filter(j => j.status === 'delayed').length}
            </div>
            <div className="text-xs text-slate-400">Delayed</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">
              {filteredJobs.filter(j => j.status === 'completed').length}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            {filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Jobs (${filteredJobs.length})` : `All Jobs (${filteredJobs.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredJobs}
            columns={columns}
            recordType="job"
            getRecordId={(job) => job.id}
            getRecordLabel={(job) => job.title || job.number || `Job ${job.id}`}
            getRecordData={(job) => ({ jobId: job.id })}
            emptyMessage="No jobs found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// ROUTE LIST VIEW
// ============================================================================

export function RouteListView({ filter }: { filter?: string }) {
  const { data: routes } = useSWR<RouteData[]>(
    filter ? `/api/routes?filter=${filter}` : '/api/routes',
    fetcher,
    {
      fallbackData: demoRoutes,
      shouldRetryOnError: false
    }
  )

  const filteredRoutes = useMemo(() => {
    if (!filter || !routes) return routes || []

    switch (filter) {
      case 'active':
        return routes.filter(r => r.status === 'active')
      case 'planned':
        return routes.filter(r => r.status === 'planned')
      case 'optimized':
        return routes.filter(r => r.optimized)
      default:
        return routes
    }
  }, [routes, filter])

  const columns: DrilldownColumn<RouteData>[] = [
    {
      key: 'number',
      header: 'Route #',
      sortable: true,
      render: (route) => route.number || route.name || `RT-${route.id}`,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (route) => (
        <Badge variant={route.status === 'active' ? 'default' : 'outline'}>
          {route.status}
        </Badge>
      ),
    },
    {
      key: 'vehicleName',
      header: 'Vehicle',
      drilldown: {
        recordType: 'vehicle',
        getRecordId: (route) => route.vehicleId,
        getRecordLabel: (route) => route.vehicleName || `Vehicle ${route.vehicleId}`,
      },
      render: (route) => route.vehicleName || '-',
    },
    {
      key: 'stops',
      header: 'Stops',
      render: (route) => (
        <div className="flex items-center gap-2">
          <span className="text-sm">{route.stopsCompleted || 0} / {route.stops || 0}</span>
          <Progress value={((route.stopsCompleted || 0) / (route.stops || 1)) * 100} className="w-12 h-2" />
        </div>
      ),
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (route) => route.totalDistance ? `${route.distanceCovered || 0} / ${route.totalDistance} mi` : '-',
    },
    {
      key: 'optimized',
      header: 'Optimized',
      render: (route) => route.optimized ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-muted-foreground" />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <NavigationArrow className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-400">
              {filteredRoutes.filter(r => r.status === 'active').length}
            </div>
            <div className="text-xs text-slate-400">Active Routes</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <TrendUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">
              {filteredRoutes.filter(r => r.optimized).length}
            </div>
            <div className="text-xs text-slate-400">Optimized</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">
              {filteredRoutes.reduce((sum, r) => sum + (r.stops || 0), 0)}
            </div>
            <div className="text-xs text-slate-400">Total Stops</div>
          </CardContent>
        </Card>
      </div>

      {/* Route Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <NavigationArrow className="w-5 h-5 text-blue-400" />
            Routes ({filteredRoutes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredRoutes}
            columns={columns}
            recordType="route"
            getRecordId={(route) => route.id}
            getRecordLabel={(route) => route.name || route.number || `Route ${route.id}`}
            getRecordData={(route) => ({ routeId: route.id })}
            emptyMessage="No routes found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// TASK LIST VIEW
// ============================================================================

export function TaskListView({ filter }: { filter?: string }) {
  const { data: tasks } = useSWR<TaskData[]>(
    filter ? `/api/tasks?filter=${filter}` : '/api/tasks',
    fetcher,
    {
      fallbackData: demoTasks,
      shouldRetryOnError: false
    }
  )

  const filteredTasks = useMemo(() => {
    if (!filter || !tasks) return tasks || []

    switch (filter) {
      case 'open':
        return tasks.filter(t => t.status === 'open')
      case 'in-progress':
        return tasks.filter(t => t.status === 'in-progress')
      case 'overdue':
        return tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date())
      case 'blocked':
        return tasks.filter(t => t.status === 'blocked')
      default:
        return tasks
    }
  }, [tasks, filter])

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'open': return 'default'
      case 'in-progress': return 'outline'
      case 'completed': return 'secondary'
      case 'blocked': return 'destructive'
      default: return 'outline'
    }
  }

  const columns: DrilldownColumn<TaskData>[] = [
    {
      key: 'title',
      header: 'Task',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (task) => (
        <Badge variant={getStatusColor(task.status)}>
          {task.status}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (task) => task.priority ? (
        <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
          {task.priority}
        </Badge>
      ) : '-',
    },
    {
      key: 'assignedToName',
      header: 'Assigned To',
      drilldown: {
        recordType: 'driver', // Could be driver, vehicle, or user based on assignedToType
        getRecordId: (task) => task.assignedToId,
        getRecordLabel: (task) => task.assignedToName || `Assignee ${task.assignedToId}`,
      },
      render: (task) => (
        <div className="flex items-center gap-2">
          {task.assignedToType === 'driver' && <User className="w-3 h-3" />}
          {task.assignedToType === 'vehicle' && <Truck className="w-3 h-3" />}
          <span>{task.assignedToName || '-'}</span>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (task) => task.dueDate ? new Date(task.dueDate).toLocaleString() : '-',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="bg-blue-900/30 border-blue-700/50">
          <CardContent className="p-4 text-center">
            <ListChecks className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-400">
              {filteredTasks.filter(t => t.status === 'open').length}
            </div>
            <div className="text-xs text-slate-400">Open Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-900/30 border-amber-700/50">
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-400">
              {filteredTasks.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-xs text-slate-400">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-red-900/30 border-red-700/50">
          <CardContent className="p-4 text-center">
            <Warning className="w-6 h-6 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">
              {filteredTasks.filter(t => t.status === 'blocked').length}
            </div>
            <div className="text-xs text-slate-400">Blocked</div>
          </CardContent>
        </Card>
        <Card className="bg-green-900/30 border-green-700/50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">
              {filteredTasks.filter(t => t.status === 'completed').length}
            </div>
            <div className="text-xs text-slate-400">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-blue-400" />
            Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DrilldownDataTable
            data={filteredTasks}
            columns={columns}
            recordType="task"
            getRecordId={(task) => task.id}
            getRecordLabel={(task) => task.title}
            getRecordData={(task) => ({ taskId: task.id })}
            emptyMessage="No tasks found"
            compact
          />
        </CardContent>
      </Card>
    </div>
  )
}

// Note: AlertDetailPanel is implemented in AlertDrilldowns.tsx
// and is already registered in DrilldownManager.tsx
