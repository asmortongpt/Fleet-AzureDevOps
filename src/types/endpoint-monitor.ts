/**
 * Types for Endpoint Health Monitoring
 */

export type EndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'

export type EndpointStatus = 'healthy' | 'warning' | 'error' | 'unknown'

export type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

export interface EndpointInfo {
  id: string
  category: string
  path: string
  method: EndpointMethod
  description: string
  requiresAuth?: boolean
}

export interface EndpointHealth extends EndpointInfo {
  status: EndpointStatus
  responseTime: number | null
  lastChecked: Date | null
  errorMessage?: string
  requestCount: number
  successCount: number
  errorCount: number
}

export interface SocketConnectionInfo {
  id: string
  category: string
  url: string
  description: string
  status: SocketStatus
  lastMessageTime: Date | null
  messageCount: number
  reconnectAttempts: number
  errorMessage?: string
}

export interface EndpointCategory {
  name: string
  endpoints: EndpointInfo[]
}

export interface HealthSummary {
  totalEndpoints: number
  healthyCount: number
  warningCount: number
  errorCount: number
  unknownCount: number
  healthScore: number
}
