import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'

import { TaskUpdate } from '../hooks/useWebSocket'

interface TaskQueueProps {
  tasks: TaskUpdate[]
}

export function TaskQueue({ tasks }: TaskQueueProps) {
  const getStatusIcon = (status: TaskUpdate['status']) => {
    switch (status) {
      case 'completed':
        return CheckCircleIcon
      case 'failed':
        return XCircleIcon
      case 'active':
        return ArrowPathIcon
      case 'pending':
        return ClockIcon
    }
  }

  const getStatusColor = (status: TaskUpdate['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'failed':
        return 'text-red-400'
      case 'active':
        return 'text-blue-400'
      case 'pending':
        return 'text-yellow-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Group tasks by status
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, TaskUpdate[]>)

  const statusOrder: TaskUpdate['status'][] = ['active', 'pending', 'completed', 'failed']

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-6">Task Queue</h2>

      <div className="space-y-6">
        {statusOrder.map((status) => {
          const statusTasks = groupedTasks[status] || []
          if (statusTasks.length === 0) return null

          const StatusIcon = getStatusIcon(status)

          return (
            <div key={status}>
              <div className="flex items-center space-x-2 mb-3">
                <StatusIcon className={clsx('w-5 h-5', getStatusColor(status))} />
                <h3 className="text-sm font-semibold text-slate-300 capitalize">
                  {status} ({statusTasks.length})
                </h3>
              </div>

              <div className="space-y-2">
                {statusTasks.slice(0, 50).map((task) => (
                  <div
                    key={task.taskId}
                    className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={clsx('px-2 py-1 rounded text-xs font-medium text-white', getPriorityColor(task.priority))}>
                            {task.priority}
                          </span>
                          <span className="text-sm font-mono text-slate-400">{task.type}</span>
                        </div>

                        {task.file && (
                          <div className="text-sm text-slate-300 mb-1">{task.file}</div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          {task.assignedAgent && (
                            <span>Agent: {task.assignedAgent}</span>
                          )}
                          {task.startTime && (
                            <span>
                              Started: {formatDistanceToNow(new Date(task.startTime), { addSuffix: true })}
                            </span>
                          )}
                          {task.completedTime && (
                            <span>
                              Completed: {formatDistanceToNow(new Date(task.completedTime), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {task.error && (
                          <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
                            Error: {task.error}
                          </div>
                        )}
                      </div>

                      <div className={clsx('ml-4', getStatusColor(task.status))}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
