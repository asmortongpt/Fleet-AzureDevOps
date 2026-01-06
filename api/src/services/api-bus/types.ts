/**
 * API BUS - Type Definitions
 * Provides plug-and-play architecture for all external services
 */

// ============================================================================
// AI PROVIDER TYPES
// ============================================================================

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'grok'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionRequest {
  messages: AIMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AICompletionResponse {
  id: string
  provider: AIProvider
  model: string
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  finishReason: 'stop' | 'length' | 'content_filter' | 'error'
  timestamp: Date
}

export interface AIProviderAdapter {
  provider: AIProvider
  isAvailable(): Promise<boolean>
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  streamComplete(request: AICompletionRequest): AsyncGenerator<string>
}

// ============================================================================
// SERVICE BUS TYPES
// ============================================================================

export type ServiceType = 'ai' | 'database' | 'external-api' | 'cache' | 'queue'

export interface ServiceHealth {
  name: string
  type: ServiceType
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  latency?: number
  lastCheck: Date
  message?: string
}

export interface ServiceAdapter<T = any> {
  name: string
  type: ServiceType
  isAvailable(): Promise<boolean>
  healthCheck(): Promise<ServiceHealth>
  initialize(): Promise<void>
  shutdown(): Promise<void>
}

// ============================================================================
// EXTERNAL API TYPES
// ============================================================================

export interface ExternalAPIAdapter extends ServiceAdapter {
  get<T>(endpoint: string, options?: RequestInit): Promise<T>
  post<T>(endpoint: string, body: any, options?: RequestInit): Promise<T>
  put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T>
  delete<T>(endpoint: string, options?: RequestInit): Promise<T>
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ServiceConfig {
  enabled: boolean
  priority: number
  timeout: number
  retryAttempts: number
  retryDelay: number
  healthCheckInterval: number
}

export interface AIProviderConfig extends ServiceConfig {
  provider: AIProvider
  apiKey: string
  baseURL?: string
  defaultModel: string
  models: string[]
}

export interface APIBusConfig {
  ai: {
    defaultProvider: AIProvider
    fallbackProviders: AIProvider[]
    providers: Record<AIProvider, AIProviderConfig>
  }
  healthCheck: {
    enabled: boolean
    interval: number
    failureThreshold: number
  }
}
