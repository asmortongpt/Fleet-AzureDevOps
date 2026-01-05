import { useEffect, useState, useCallback, useRef } from 'react'

export interface AgentStatus {
  agentId: string
  status: 'idle' | 'busy' | 'error' | 'offline'
  currentTask?: string
  taskType?: string
  progress?: number
  lastHeartbeat: string
}

export interface Metrics {
  totalAgents: number
  activeAgents: number
  totalTasks: number
  completedTasks: number
  failedTasks: number
  queuedTasks: number
  throughput: number
  errorRate: number
  avgTaskTime: number
  estimatedCompletion?: string
}

export interface TaskUpdate {
  taskId: string
  type: string
  priority: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  assignedAgent?: string
  file?: string
  startTime?: string
  completedTime?: string
  error?: string
}

export interface Alert {
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  agentId?: string
  taskId?: string
  timestamp: string
}

export interface AnalysisReport {
  totalFiles: number
  totalIssues: number
  criticalIssues: number
  recommendations: string[]
  duration: number
  timestamp: string
}

export interface WebSocketData {
  agents: Map<string, AgentStatus>
  metrics: Metrics | null
  tasks: TaskUpdate[]
  alerts: Alert[]
  analysisReport: AnalysisReport | null
  connected: boolean
}

export function useWebSocket(url: string): WebSocketData {
  const [agents, setAgents] = useState<Map<string, AgentStatus>>(new Map())
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [tasks, setTasks] = useState<TaskUpdate[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null)
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('WebSocket connected')
      setConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case 'connected':
            console.log('Connected to Agent Monitoring Server')
            break

          case 'agent-status':
            setAgents((prev) => {
              const updated = new Map(prev)
              updated.set(message.data.agentId, {
                ...message.data,
                lastHeartbeat: message.data.lastHeartbeat
              })
              return updated
            })
            break

          case 'metrics':
            setMetrics(message.data)
            break

          case 'task-update':
            setTasks((prev) => {
              const index = prev.findIndex((t) => t.taskId === message.data.taskId)
              if (index >= 0) {
                const updated = [...prev]
                updated[index] = message.data
                return updated
              }
              return [...prev, message.data].slice(-500) // Keep last 500 tasks
            })
            break

          case 'alert':
            setAlerts((prev) =>
              [{...message.data, timestamp: message.timestamp}, ...prev].slice(0, 100) // Keep last 100 alerts
            )
            break

          case 'analysis-complete':
            setAnalysisReport({
              ...message.data,
              timestamp: message.timestamp
            })
            break

          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      setConnected(false)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
      setConnected(false)
      wsRef.current = null

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...')
        connect()
      }, 3000)
    }

    wsRef.current = ws
  }, [url])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    agents,
    metrics,
    tasks,
    alerts,
    analysisReport,
    connected
  }
}
