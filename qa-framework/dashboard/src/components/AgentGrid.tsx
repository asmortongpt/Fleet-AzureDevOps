import { AgentStatus } from '../hooks/useWebSocket'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface AgentGridProps {
  agents: AgentStatus[]
  detailed?: boolean
}

export function AgentGrid({ agents, detailed = false }: AgentGridProps) {
  const getStatusColor = (status: AgentStatus['status']) => {
    switch (status) {
      case 'busy':
        return 'bg-blue-500'
      case 'idle':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: AgentStatus['status']) => {
    switch (status) {
      case 'busy':
        return 'Working'
      case 'idle':
        return 'Idle'
      case 'error':
        return 'Error'
      case 'offline':
        return 'Offline'
      default:
        return 'Unknown'
    }
  }

  // Group agents by type
  const groupedAgents = agents.reduce((acc, agent) => {
    const type = agent.agentId.split('-')[0]
    if (!acc[type]) acc[type] = []
    acc[type].push(agent)
    return acc
  }, {} as Record<string, AgentStatus[]>)

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <h2 className="text-xl font-bold mb-6">
        Agent Status {detailed ? 'Details' : 'Overview'}
      </h2>

      {detailed ? (
        // Detailed View - Grouped by Type
        <div className="space-y-6">
          {Object.entries(groupedAgents).map(([type, typeAgents]) => (
            <div key={type}>
              <h3 className="text-sm font-semibold text-slate-400 mb-3 capitalize">
                {type.replace(/-/g, ' ')}s ({typeAgents.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {typeAgents.map((agent) => (
                  <div
                    key={agent.agentId}
                    className="bg-slate-900 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={clsx('w-3 h-3 rounded-full', getStatusColor(agent.status))} />
                        <span className="text-sm font-medium">{agent.agentId}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="text-white">{getStatusText(agent.status)}</span>
                      </div>
                      {agent.currentTask && (
                        <div className="flex justify-between">
                          <span>Task:</span>
                          <span className="text-white truncate ml-2">{agent.taskType || 'N/A'}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Last seen:</span>
                        <span className="text-white">
                          {formatDistanceToNow(new Date(agent.lastHeartbeat), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Compact Grid View
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {agents.map((agent) => (
            <div
              key={agent.agentId}
              className="relative group"
              title={`${agent.agentId} - ${getStatusText(agent.status)}`}
            >
              <div
                className={clsx(
                  'w-12 h-12 rounded-lg flex items-center justify-center text-xs font-mono transition-all',
                  getStatusColor(agent.status),
                  'hover:scale-110 cursor-pointer'
                )}
              >
                {agent.agentId.split('-')[1]}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-950 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                <div className="font-semibold mb-1">{agent.agentId}</div>
                <div className="text-slate-400">{getStatusText(agent.status)}</div>
                {agent.currentTask && (
                  <div className="text-slate-400 mt-1">Task: {agent.taskType}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        {(['busy', 'idle', 'error', 'offline'] as const).map((status) => (
          <div key={status} className="flex items-center space-x-2">
            <div className={clsx('w-3 h-3 rounded-full', getStatusColor(status))} />
            <span className="text-slate-400 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
