/**
 * TaskDetailPanel - Comprehensive task detail view for Operations Hub
 * Shows complete task information with assignee, dependencies, and history
 */

import {
  ListChecks,
  User,
  Truck,
  Phone,
  Mail,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link2,
  FileText,
  Building2,
  TrendingUp
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface TaskDetailPanelProps {
  taskId: string
}

interface TaskData {
  id: string
  number?: string
  title: string
  description?: string
  status: 'open' | 'in-progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'high' | 'medium' | 'low'

  // Assignment
  assignedToId?: string
  assignedToName?: string
  assignedToType?: 'driver' | 'vehicle' | 'user' | 'team'
  assignedToPhone?: string
  assignedToEmail?: string

  // Related entities
  vehicleId?: string
  vehicleName?: string
  driverId?: string
  driverName?: string
  jobId?: string
  jobNumber?: string

  // Timing
  createdDate: string
  dueDate?: string
  startedDate?: string
  completedDate?: string
  estimatedDuration?: number // in minutes
  actualDuration?: number // in minutes

  // Dependencies
  dependencies?: string[] // Task IDs
  blockedBy?: string
  blockedReason?: string
  dependentTasks?: string[] // Tasks waiting on this one

  // Progress
  completionPercent?: number
  checklistTotal?: number
  checklistCompleted?: number

  // Additional info
  category?: string
  tags?: string[]
  notes?: string
  attachments?: number

  // History
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

interface DependencyTask {
  id: string
  title: string
  status: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Demo data for fallback
const demoTaskData: Record<string, TaskData> = {
  'task-001': {
    id: 'task-001',
    number: 'TSK-1001',
    title: 'Pre-trip vehicle inspection - V-1001',
    description: 'Complete comprehensive pre-trip safety inspection for Ford F-150 #1001 before morning dispatch',
    status: 'completed',
    priority: 'high',
    assignedToId: 'drv-001',
    assignedToName: 'John Smith',
    assignedToType: 'driver',
    assignedToPhone: '(850) 555-0101',
    assignedToEmail: 'john.smith@fleet.com',
    vehicleId: 'veh-demo-1001',
    vehicleName: 'Ford F-150 #1001',
    driverId: 'drv-001',
    driverName: 'John Smith',
    createdDate: '2026-01-02T18:00:00',
    dueDate: '2026-01-03T08:00:00',
    startedDate: '2026-01-03T07:30:00',
    completedDate: '2026-01-03T07:45:00',
    estimatedDuration: 30,
    actualDuration: 15,
    completionPercent: 100,
    checklistTotal: 12,
    checklistCompleted: 12,
    category: 'Safety',
    tags: ['inspection', 'pre-trip', 'required'],
    notes: 'All systems checked and operational. Minor windshield washer fluid refill needed.',
    createdBy: 'Dispatch System',
    updatedAt: '2026-01-03T07:45:00',
    updatedBy: 'John Smith'
  },
  'task-002': {
    id: 'task-002',
    number: 'TSK-1002',
    title: 'Load verification - Job #1002',
    description: 'Verify cargo manifest and ensure proper loading for airport cargo pickup',
    status: 'in-progress',
    priority: 'high',
    assignedToId: 'drv-002',
    assignedToName: 'Sarah Johnson',
    assignedToType: 'driver',
    assignedToPhone: '(850) 555-0102',
    assignedToEmail: 'sarah.johnson@fleet.com',
    vehicleId: 'veh-demo-1002',
    vehicleName: 'Chevrolet Silverado #1002',
    driverId: 'drv-002',
    driverName: 'Sarah Johnson',
    jobId: 'job-002',
    jobNumber: 'JOB-1002',
    createdDate: '2026-01-03T09:00:00',
    dueDate: '2026-01-03T10:00:00',
    startedDate: '2026-01-03T09:45:00',
    estimatedDuration: 20,
    completionPercent: 60,
    checklistTotal: 5,
    checklistCompleted: 3,
    category: 'Operations',
    tags: ['cargo', 'verification', 'urgent'],
    notes: 'Temperature-controlled cargo - verify cooling system before loading',
    createdBy: 'Dispatch Supervisor',
    updatedAt: '2026-01-03T10:15:00',
    updatedBy: 'Sarah Johnson'
  },
  'task-003': {
    id: 'task-003',
    number: 'TSK-1003',
    title: 'Refuel vehicle before next dispatch',
    description: 'Vehicle fuel level at 25% - refuel to full capacity before afternoon route',
    status: 'open',
    priority: 'medium',
    assignedToId: 'veh-demo-1003',
    assignedToName: 'Mercedes Sprinter #1003',
    assignedToType: 'vehicle',
    vehicleId: 'veh-demo-1003',
    vehicleName: 'Mercedes Sprinter #1003',
    createdDate: '2026-01-03T10:30:00',
    dueDate: '2026-01-03T16:00:00',
    estimatedDuration: 15,
    completionPercent: 0,
    category: 'Maintenance',
    tags: ['fuel', 'routine'],
    notes: 'Preferred fuel station: Shell at 456 Main St (Fleet discount available)',
    createdBy: 'Fuel Monitor System',
    updatedAt: '2026-01-03T10:30:00'
  },
  'task-004': {
    id: 'task-004',
    number: 'TSK-1004',
    title: 'Update route optimization settings',
    description: 'Configure new traffic pattern algorithms for improved route efficiency',
    status: 'blocked',
    priority: 'low',
    assignedToId: 'user-001',
    assignedToName: 'Operations Manager',
    assignedToType: 'user',
    assignedToEmail: 'ops.manager@fleet.com',
    createdDate: '2026-01-02T14:00:00',
    dueDate: '2026-01-03T17:00:00',
    estimatedDuration: 60,
    completionPercent: 0,
    blockedBy: 'Software update pending',
    blockedReason: 'Waiting for v2.5.0 deployment scheduled for 2026-01-04',
    dependencies: ['task-999'],
    category: 'System',
    tags: ['optimization', 'configuration'],
    notes: 'Requires coordination with IT department',
    createdBy: 'Fleet Manager',
    updatedAt: '2026-01-03T09:00:00',
    updatedBy: 'Operations Manager'
  },
  'task-005': {
    id: 'task-005',
    number: 'TSK-1005',
    title: 'Review and approve delayed job reports',
    description: 'Analyze delay causes for jobs JOB-1002, JOB-1015, and JOB-1023 and approve corrective actions',
    status: 'open',
    priority: 'high',
    assignedToId: 'user-002',
    assignedToName: 'Fleet Supervisor',
    assignedToType: 'user',
    assignedToEmail: 'supervisor@fleet.com',
    createdDate: '2026-01-03T11:00:00',
    dueDate: '2026-01-03T12:00:00',
    estimatedDuration: 45,
    completionPercent: 0,
    dependentTasks: ['task-006', 'task-007'],
    category: 'Management',
    tags: ['review', 'analysis', 'urgent'],
    attachments: 3,
    notes: 'Priority review required - multiple delays affecting SLA compliance',
    createdBy: 'Automated Alert System',
    updatedAt: '2026-01-03T11:00:00'
  }
}

export function TaskDetailPanel({ taskId }: TaskDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: task, error, isLoading, mutate } = useSWR<TaskData>(
    `/api/tasks/${taskId}`,
    fetcher,
    {
      fallbackData: demoTaskData[taskId],
      shouldRetryOnError: false
    }
  )

  // Fetch dependency tasks if they exist
  const { data: dependencyTasks } = useSWR<DependencyTask[]>(
    task?.dependencies ? `/api/tasks/dependencies?ids=${task.dependencies.join(',')}` : null,
    fetcher,
    {
      fallbackData: task?.dependencies?.map(id => ({
        id,
        title: `Dependency Task ${id}`,
        status: id === 'task-999' ? 'in-progress' : 'pending'
      }))
    }
  )

  const handleViewAssignee = () => {
    if (!task?.assignedToId || !task?.assignedToType) return

    const typeMap: Record<string, string> = {
      driver: 'driver',
      vehicle: 'vehicle',
      user: 'user',
      team: 'team'
    }

    push({
      id: `${task.assignedToType}-${task.assignedToId}`,
      type: typeMap[task.assignedToType],
      label: task.assignedToName || `${task.assignedToType} ${task.assignedToId}`,
      data: { [`${task.assignedToType}Id`]: task.assignedToId }
    })
  }

  const handleViewVehicle = () => {
    if (task?.vehicleId) {
      push({
        id: `vehicle-${task.vehicleId}`,
        type: 'vehicle',
        label: task.vehicleName || `Vehicle ${task.vehicleId}`,
        data: { vehicleId: task.vehicleId }
      })
    }
  }

  const handleViewJob = () => {
    if (task?.jobId) {
      push({
        id: `job-${task.jobId}`,
        type: 'job',
        label: task.jobNumber || `Job ${task.jobId}`,
        data: { jobId: task.jobId }
      })
    }
  }

  const handleCallAssignee = () => {
    if (task?.assignedToPhone) {
      window.location.href = `tel:${task.assignedToPhone}`
    }
  }

  const handleEmailAssignee = () => {
    if (task?.assignedToEmail) {
      window.location.href = `mailto:${task.assignedToEmail}`
    }
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
    switch (status) {
      case 'open': return 'default'
      case 'in-progress': return 'outline'
      case 'completed': return 'secondary'
      case 'blocked': return 'destructive'
      default: return 'outline'
    }
  }

  const getPriorityColor = (priority: string): 'destructive' | 'default' | 'secondary' => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getAssigneeIcon = (type?: string) => {
    switch (type) {
      case 'driver': return <User className="h-5 w-5" />
      case 'vehicle': return <Truck className="h-5 w-5" />
      case 'user': return <User className="h-5 w-5" />
      case 'team': return <Building2 className="h-5 w-5" />
      default: return <User className="h-5 w-5" />
    }
  }

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {task && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="text-2xl font-bold">{task.title}</h3>
                  {task.number && (
                    <p className="text-sm text-muted-foreground">Task #{task.number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <Badge variant={getPriorityColor(task.priority)}>
                  {task.priority} priority
                </Badge>
                {task.category && (
                  <Badge variant="outline">{task.category}</Badge>
                )}
                {task.status === 'blocked' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                )}
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {task.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            {task.completionPercent !== undefined && task.status !== 'completed' && (
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{task.completionPercent}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            )}
          </div>

          {task.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Progress */}
          {task.status === 'in-progress' && task.completionPercent !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">{task.completionPercent}%</span>
                  </div>
                  <Progress value={task.completionPercent} className="h-3" />
                </div>

                {task.checklistTotal && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Checklist Items</p>
                      <p className="text-xl font-bold">{task.checklistCompleted} / {task.checklistTotal}</p>
                    </div>
                    {task.actualDuration && (
                      <div>
                        <p className="text-sm text-muted-foreground">Time Spent</p>
                        <p className="text-xl font-bold">{task.actualDuration} min</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Blocked Status */}
          {task.status === 'blocked' && task.blockedReason && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Task Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-2">Blocked By: {task.blockedBy}</p>
                <p className="text-sm text-muted-foreground">{task.blockedReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Assignee */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAssigneeIcon(task.assignedToType)}
                WHO: Assigned To
              </CardTitle>
            </CardHeader>
            <CardContent>
              {task.assignedToId ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{task.assignedToName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{task.assignedToType}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleViewAssignee}>
                      View Details
                    </Button>
                  </div>

                  {(task.assignedToPhone || task.assignedToEmail) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        {task.assignedToPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${task.assignedToPhone}`}
                              className="text-sm text-blue-600 hover:underline font-medium"
                              onClick={(e) => {
                                e.preventDefault()
                                handleCallAssignee()
                              }}
                            >
                              {task.assignedToPhone}
                            </a>
                            <Button size="sm" variant="ghost" onClick={handleCallAssignee}>
                              Call
                            </Button>
                          </div>
                        )}
                        {task.assignedToEmail && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${task.assignedToEmail}`}
                              className="text-sm text-blue-600 hover:underline"
                              onClick={(e) => {
                                e.preventDefault()
                                handleEmailAssignee()
                              }}
                            >
                              {task.assignedToEmail}
                            </a>
                            <Button size="sm" variant="ghost" onClick={handleEmailAssignee}>
                              Email
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No assignee</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Entities */}
          {(task.vehicleId || task.jobId) && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  WHAT: Related To
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.vehicleId && (
                  <div className="flex items-center justify-between p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{task.vehicleName}</p>
                        <p className="text-xs text-muted-foreground">Vehicle</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={handleViewVehicle}>
                      View
                    </Button>
                  </div>
                )}
                {task.jobId && (
                  <div className="flex items-center justify-between p-3 rounded bg-muted/50">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{task.jobNumber}</p>
                        <p className="text-xs text-muted-foreground">Job</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={handleViewJob}>
                      View
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                WHEN: Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateTime(task.createdDate)}</p>
                  {task.createdBy && (
                    <p className="text-xs text-muted-foreground">by {task.createdBy}</p>
                  )}
                </div>
                {task.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDateTime(task.dueDate)}</p>
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <Badge variant="destructive" className="mt-1">Overdue</Badge>
                    )}
                  </div>
                )}
                {task.startedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Started</p>
                    <p className="font-medium">{formatDateTime(task.startedDate)}</p>
                  </div>
                )}
                {task.completedDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">{formatDateTime(task.completedDate)}</p>
                  </div>
                )}
                {task.estimatedDuration && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Duration</p>
                    <p className="font-medium">{task.estimatedDuration} minutes</p>
                  </div>
                )}
                {task.actualDuration && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Duration</p>
                    <p className="font-medium">{task.actualDuration} minutes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dependencies */}
          {((task.dependencies && task.dependencies.length > 0) || (task.dependentTasks && task.dependentTasks.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Dependencies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.dependencies && task.dependencies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Depends On ({task.dependencies.length})</p>
                    <div className="space-y-2">
                      {dependencyTasks?.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{dep.title}</p>
                            <p className="text-xs text-muted-foreground">Task {dep.id}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">{dep.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {task.dependentTasks && task.dependentTasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Blocking Tasks ({task.dependentTasks.length})</p>
                    <div className="space-y-2">
                      {task.dependentTasks.map(taskId => (
                        <div key={taskId} className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950">
                          <div>
                            <p className="text-sm font-medium">Task waiting on completion</p>
                            <p className="text-xs text-muted-foreground">Task {taskId}</p>
                          </div>
                          <Badge variant="outline">Waiting</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {task.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{task.notes}</p>
                {task.attachments && task.attachments > 0 && (
                  <div className="mt-3">
                    <Badge variant="outline">
                      {task.attachments} attachment{task.attachments > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{formatDateTime(task.updatedAt)}</p>
                  {task.updatedBy && <p className="text-muted-foreground">by {task.updatedBy}</p>}
                </div>
                <div>
                  <p className="text-muted-foreground">Task ID</p>
                  <p className="font-mono">{task.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DrilldownContent>
  )
}
