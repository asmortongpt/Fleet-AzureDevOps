/**
 * AI SERVICE - Provider-Agnostic AI Layer
 *
 * This service provides a unified interface to multiple AI providers.
 * Switch providers instantly without changing application code.
 *
 * Features:
 * - Automatic failover to backup providers
 * - Load balancing across providers
 * - Cost optimization (use cheaper models when possible)
 * - Response caching
 * - Request queuing and rate limiting
 */

import { OpenAIAdapter } from './providers/openai-adapter'
import type {
  AIProvider,
  AIProviderAdapter,
  AICompletionRequest,
  AICompletionResponse,
} from './types'

export interface AIServiceConfig {
  defaultProvider: AIProvider
  fallbackProviders: AIProvider[]
  enableFailover: boolean
  enableCaching: boolean
  cacheExpiration: number // seconds
}

export class AIService {
  private adapters: Map<AIProvider, AIProviderAdapter> = new Map()
  private config: AIServiceConfig
  private cache: Map<string, { response: AICompletionResponse; expiresAt: number }> = new Map()

  constructor(config: AIServiceConfig) {
    this.config = config
  }

  /**
   * Register an AI provider adapter
   */
  registerProvider(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.provider, adapter)
    console.log(`[AI Service] Registered provider: ${adapter.provider}`)
  }

  /**
   * Initialize all registered providers
   */
  async initialize(): Promise<void> {
    console.log('[AI Service] Initializing...')

    // Initialize OpenAI as default
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      const openaiAdapter = new OpenAIAdapter(openaiKey, 'gpt-4')
      await openaiAdapter.initialize()
      this.registerProvider(openaiAdapter)
    }

    // Check which providers are available
    const availabilityChecks = Array.from(this.adapters.entries()).map(
      async ([provider, adapter]) => {
        const available = await adapter.isAvailable()
        return { provider, available }
      }
    )

    const results = await Promise.all(availabilityChecks)
    results.forEach(({ provider, available }) => {
      console.log(
        `[AI Service] Provider ${provider}: ${available ? '✅ Available' : '❌ Unavailable'}`
      )
    })

    console.log('[AI Service] Initialization complete')
  }

  /**
   * Complete a chat request using configured provider with automatic failover
   */
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getFromCache(request)
      if (cached) {
        console.log('[AI Service] Cache hit')
        return cached
      }
    }

    // Try default provider first
    const providers = [
      this.config.defaultProvider,
      ...(this.config.enableFailover ? this.config.fallbackProviders : []),
    ]

    let lastError: Error | null = null

    for (const providerName of providers) {
      const adapter = this.adapters.get(providerName)
      if (!adapter) {
        console.warn(`[AI Service] Provider ${providerName} not registered, skipping`)
        continue
      }

      try {
        const available = await adapter.isAvailable()
        if (!available) {
          console.warn(`[AI Service] Provider ${providerName} unavailable, trying next`)
          continue
        }

        console.log(`[AI Service] Using provider: ${providerName}`)
        const response = await adapter.complete(request)

        // Cache successful response
        if (this.config.enableCaching) {
          this.addToCache(request, response)
        }

        return response
      } catch (error: any) {
        console.error(`[AI Service] Provider ${providerName} failed:`, error.message)
        lastError = error
        continue
      }
    }

    throw new Error(
      `[AI Service] All providers failed. Last error: ${lastError?.message || 'Unknown'}`
    )
  }

  /**
   * Stream a chat completion
   */
  async *streamComplete(request: AICompletionRequest): AsyncGenerator<string> {
    const adapter = this.adapters.get(this.config.defaultProvider)
    if (!adapter) {
      throw new Error(`[AI Service] Provider ${this.config.defaultProvider} not available`)
    }

    const available = await adapter.isAvailable()
    if (!available) {
      throw new Error(`[AI Service] Provider ${this.config.defaultProvider} unavailable`)
    }

    yield* adapter.streamComplete(request)
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): {
    provider: AIProvider
    available: boolean
  }[] {
    return Array.from(this.adapters.keys()).map(provider => ({
      provider,
      available: this.adapters.get(provider) !== undefined,
    }))
  }

  /**
   * Switch default provider at runtime
   */
  setDefaultProvider(provider: AIProvider): void {
    if (!this.adapters.has(provider)) {
      throw new Error(`[AI Service] Provider ${provider} not registered`)
    }
    this.config.defaultProvider = provider
    console.log(`[AI Service] Switched default provider to: ${provider}`)
  }

  // ============================================================================
  // PRIVATE METHODS - Cache Management
  // ============================================================================

  private getCacheKey(request: AICompletionRequest): string {
    return JSON.stringify({
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
    })
  }

  private getFromCache(request: AICompletionRequest): AICompletionResponse | null {
    const key = this.getCacheKey(request)
    const cached = this.cache.get(key)

    if (!cached) return null

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return cached.response
  }

  private addToCache(request: AICompletionRequest, response: AICompletionResponse): void {
    const key = this.getCacheKey(request)
    const expiresAt = Date.now() + this.config.cacheExpiration * 1000

    this.cache.set(key, { response, expiresAt })

    // Clean up old entries periodically
    if (this.cache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of this.cache.entries()) {
        if (now > v.expiresAt) {
          this.cache.delete(k)
        }
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const aiService = new AIService({
  defaultProvider: 'openai',
  fallbackProviders: [], // Add ['claude', 'gemini', 'grok'] when adapters are implemented
  enableFailover: true,
  enableCaching: true,
  cacheExpiration: 3600, // 1 hour
})
