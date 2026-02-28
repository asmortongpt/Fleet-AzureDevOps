/**
 * TaskDetailPanel - Comprehensive task detail view for Operations Hub
 * Shows complete task information with assignee, dependencies, and history
 */

import {
  ListChecks,
  User,
  Truck,
  Phone,
  Clock,
  AlertTriangle,
  Link2,
  FileText,
  Building2,
  TrendingUp
} from 'lucide-react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { EmailButton } from '@/components/email/EmailButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDateTime } from '@/utils/format-helpers'

interface TaskDetailPanelProps {
  taskId: string
}

interface TaskData {
  id: string
  number?: string
  title: string
  name?: string
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

export function TaskDetailPanel({ taskId }: TaskDetailPanelProps) {
  const { push } = useDrilldown()

  const { data: task, error, isLoading, mutate } = useSWR<TaskData>(
    `/api/tasks/${taskId}`,
    apiFetcher,
    {
      shouldRetryOnError: false
    }
  )

  // Fetch dependency tasks if they exist
  const { data: dependencyTasks } = useSWR<DependencyTask[]>(
    task?.dependencies ? `/api/tasks/dependencies?ids=${task.dependencies.join(',')}` : null,
    apiFetcher,
    {
      shouldRetryOnError: false
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
      window.open(`tel:${task.assignedToPhone}`, '_self')
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
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">{task.title}</h3>
                  {task.number && (
                    <p className="text-sm text-[var(--text-secondary)]">Task #{task.number}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getStatusColor(task.status)}>
                  {formatEnum(task.status)}
                </Badge>
                <Badge variant={getPriorityColor(task.priority)}>
                  {formatEnum(task.priority)} priority
                </Badge>
                {task.category && (
                  <Badge variant="outline">{formatEnum(task.category)}</Badge>
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
                <div className="text-base font-bold text-emerald-400">{task.completionPercent}%</div>
                <div className="text-sm text-[var(--text-secondary)]">Complete</div>
              </div>
            )}
          </div>

          {task.description && (
            <Card>
              <CardContent className="pt-3">
                <p className="text-sm text-[var(--text-secondary)]">{task.description}</p>
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
              <CardContent className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-[var(--text-secondary)]">{task.completionPercent}%</span>
                  </div>
                  <Progress value={task.completionPercent} className="h-3" />
                </div>

                {task.checklistTotal && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-[var(--text-secondary)]">Checklist Items</p>
                      <p className="text-base font-bold">{task.checklistCompleted} / {task.checklistTotal}</p>
                    </div>
                    {task.actualDuration && (
                      <div>
                        <p className="text-sm text-[var(--text-secondary)]">Time Spent</p>
                        <p className="text-base font-bold">{task.actualDuration} min</p>
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
                <p className="text-sm text-[var(--text-secondary)]">{task.blockedReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Assignee */}
          <Card className="border-l-4 border-l-emerald-500">
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
                      <p className="font-semibold text-sm">{task.assignedToName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{formatEnum(task.assignedToType)}</p>
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
                            <Phone className="h-4 w-4 text-[var(--text-secondary)]" />
                            <a
                              href={`tel:${task.assignedToPhone}`}
                              className="text-sm text-emerald-400 hover:underline font-medium"
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
                            <EmailButton
                              to={task.assignedToEmail}
                              context={{
                                type: 'general',
                                recipientName: task.assignedToName,
                                details: `Regarding task: ${task.title || task.name || 'Assigned Task'}.`,
                              }}
                              label={task.assignedToEmail}
                              variant="ghost"
                              size="sm"
                              className="text-emerald-400 h-auto p-0"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-2 text-[var(--text-secondary)]">
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
                  <div className="flex items-center justify-between p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium">{task.vehicleName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Vehicle</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={handleViewVehicle}>
                      View
                    </Button>
                  </div>
                )}
                {task.jobId && (
                  <div className="flex items-center justify-between p-3 rounded bg-[var(--surface-glass)]">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-[var(--text-secondary)]" />
                      <div>
                        <p className="text-sm font-medium">{task.jobNumber}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Job</p>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Created</p>
                  <p className="font-medium">{formatDateTime(task.createdDate)}</p>
                  {task.createdBy && (
                    <p className="text-xs text-[var(--text-secondary)]">by {task.createdBy}</p>
                  )}
                </div>
                {task.dueDate && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Due Date</p>
                    <p className="font-medium">{formatDateTime(task.dueDate)}</p>
                    {new Date(task.dueDate) < new Date() && task.status !== 'completed' && (
                      <Badge variant="destructive" className="mt-1">Overdue</Badge>
                    )}
                  </div>
                )}
                {task.startedDate && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Started</p>
                    <p className="font-medium">{formatDateTime(task.startedDate)}</p>
                  </div>
                )}
                {task.completedDate && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Completed</p>
                    <p className="font-medium">{formatDateTime(task.completedDate)}</p>
                  </div>
                )}
                {task.estimatedDuration && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Estimated Duration</p>
                    <p className="font-medium">{task.estimatedDuration} minutes</p>
                  </div>
                )}
                {task.actualDuration && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Actual Duration</p>
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
              <CardContent className="space-y-2">
                {task.dependencies && task.dependencies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Depends On ({task.dependencies.length})</p>
                    <div className="space-y-2">
                      {dependencyTasks?.map(dep => (
                        <div key={dep.id} className="flex items-center justify-between p-2 rounded bg-[var(--surface-glass)]">
                          <div>
                            <p className="text-sm font-medium">{dep.title}</p>
                            <p className="text-xs text-[var(--text-secondary)]">Task {dep.id}</p>
                          </div>
                          <Badge variant="outline">{formatEnum(dep.status)}</Badge>
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
                            <p className="text-xs text-[var(--text-secondary)]">Task {taskId}</p>
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
                <p className="text-sm text-[var(--text-secondary)]">{task.notes}</p>
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
          <Card className="bg-[var(--surface-glass)]">
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[var(--text-secondary)]">Last Updated</p>
                  <p>{formatDateTime(task.updatedAt)}</p>
                  {task.updatedBy && <p className="text-[var(--text-secondary)]">by {task.updatedBy}</p>}
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Task ID</p>
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
