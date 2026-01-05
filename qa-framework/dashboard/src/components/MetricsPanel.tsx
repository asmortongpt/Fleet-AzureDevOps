import { Metrics } from '../hooks/useWebSocket'
import {
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface MetricsPanelProps {
  metrics: Metrics
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const completionRate = metrics.totalTasks > 0
    ? ((metrics.completedTasks / metrics.totalTasks) * 100).toFixed(1)
    : '0.0'

  const stats = [
    {
      name: 'Active Agents',
      value: `${metrics.activeAgents}/${metrics.totalAgents}`,
      icon: CpuChipIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'Completed Tasks',
      value: metrics.completedTasks.toLocaleString(),
      icon: CheckCircleIcon,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      name: 'Failed Tasks',
      value: metrics.failedTasks.toLocaleString(),
      icon: XCircleIcon,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    },
    {
      name: 'Queued Tasks',
      value: metrics.queuedTasks.toLocaleString(),
      icon: ClockIcon,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
    {
      name: 'Throughput',
      value: `${metrics.throughput.toFixed(1)}/min`,
      icon: ChartBarIcon,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      name: 'Error Rate',
      value: `${metrics.errorRate.toFixed(1)}%`,
      icon: ExclamationTriangleIcon,
      color: metrics.errorRate > 10 ? 'text-red-400' : 'text-green-400',
      bgColor: metrics.errorRate > 10 ? 'bg-red-500/10' : 'bg-green-500/10'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${stat.color} mb-1`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-400">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Overall Progress</h3>
          <span className="text-2xl font-bold text-blue-400">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm text-slate-400">
          <span>{metrics.completedTasks + metrics.failedTasks} / {metrics.totalTasks} tasks processed</span>
          <span>Avg: {(metrics.avgTaskTime / 1000).toFixed(1)}s per task</span>
        </div>
      </div>
    </div>
  )
}
