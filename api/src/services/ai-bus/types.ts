/**
 * AI Bus - Type Definitions
 * Common types and interfaces for all AI providers
 */

export type AIProvider =
  | 'openai'
  | 'azure-openai'
  | 'anthropic'
  | 'google-gemini'
  | 'aws-bedrock'
  | 'cohere'
  | 'local'

export type AIModel = string

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool'
  content: string
  name?: string
  function_call?: Record<string, any>
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface AIFunction {
  name: string
  description: string
  parameters: Record<string, any>
}

export interface ChatCompletionRequest {
  model: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stop?: string[]
  functions?: AIFunction[]
  functionCall?: 'auto' | 'none' | { name: string }
  tools?: AIFunction[]
  toolChoice?: 'auto' | 'required' | 'none' | { type: 'function'; function: { name: string } }
  stream?: boolean
  user?: string
  metadata?: Record<string, any>
}

export interface ChatCompletionResponse {
  id: string
  model: string
  provider: AIProvider
  content: string
  finishReason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter'
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  functionCall?: {
    name: string
    arguments: Record<string, any>
  }
  toolCalls?: ToolCall[]
  rawResponse?: any
  metadata?: Record<string, any>
}

export interface EmbeddingRequest {
  model: string
  input: string | string[]
  dimensions?: number
  user?: string
}

export interface EmbeddingResponse {
  embeddings: number[][]
  model: string
  provider: AIProvider
  usage: {
    promptTokens: number
    totalTokens: number
  }
}

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  endpoint?: string
  region?: string
  deployment?: string
  modelMappings?: Record<string, string>
  defaultModel?: string
  timeout?: number
  retries?: number
  rateLimit?: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

export interface AIProviderCapabilities {
  chat: boolean
  embeddings: boolean
  functions: boolean
  tools: boolean
  vision: boolean
  streaming: boolean
  fineTuning: boolean
  maxTokens: number
  supportedModels: string[]
}

export interface AIError extends Error {
  provider: AIProvider
  code: string
  status?: number
  retryable: boolean
  details?: Record<string, any>
}

export interface StreamChunk {
  content: string
  finishReason?: string
  delta?: string
}

export type StreamCallback = (chunk: StreamChunk) => void

/**
 * Base interface that all AI providers must implement
 */
export interface IAIProvider {
  readonly name: AIProvider
  readonly capabilities: AIProviderCapabilities

  /**
   * Initialize the provider with configuration
   */
  initialize(config: AIProviderConfig): Promise<void>

  /**
   * Create a chat completion
   */
  createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse>

  /**
   * Create a streaming chat completion
   */
  createStreamingChatCompletion(
    request: ChatCompletionRequest,
    onChunk: StreamCallback
  ): Promise<ChatCompletionResponse>

  /**
   * Generate embeddings
   */
  createEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse>

  /**
   * Check if provider is healthy and ready
   */
  healthCheck(): Promise<boolean>

  /**
   * Get cost estimate for a request
   */
  estimateCost(request: ChatCompletionRequest): number
}
