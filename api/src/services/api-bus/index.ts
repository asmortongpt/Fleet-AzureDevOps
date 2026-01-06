/**
 * API BUS - Main Export
 *
 * PLUG-AND-PLAY SERVICE ARCHITECTURE
 *
 * The API Bus provides a unified interface to all external services:
 * - AI Providers (OpenAI, Claude, Gemini, Grok)
 * - Databases (PostgreSQL, Redis)
 * - External APIs (Google Maps, Azure, etc.)
 * - Caching & Queuing systems
 *
 * Benefits:
 * 1. Provider-Agnostic: Switch AI providers without changing code
 * 2. Automatic Failover: Backup providers kick in automatically
 * 3. Health Monitoring: Real-time health checks for all services
 * 4. Centralized Config: Manage all API keys and settings in one place
 * 5. Response Caching: Reduce API costs with intelligent caching
 *
 * @example Basic Usage - AI Completion
 * ```typescript
 * import { aiService } from './api-bus'
 *
 * await aiService.initialize()
 *
 * const response = await aiService.complete({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant' },
 *     { role: 'user', content: 'What is fleet management?' }
 *   ]
 * })
 *
 * console.log(response.content)
 * ```
 *
 * @example Provider Switching
 * ```typescript
 * // Start with OpenAI
 * aiService.setDefaultProvider('openai')
 *
 * // Switch to Claude instantly
 * aiService.setDefaultProvider('claude')
 *
 * // All subsequent requests now use Claude - zero code changes!
 * ```
 *
 * @example Service Health Monitoring
 * ```typescript
 * import { serviceBus } from './api-bus'
 *
 * serviceBus.startHealthChecks(30000) // Check every 30 seconds
 *
 * const stats = serviceBus.getStats()
 * console.log(`Healthy services: ${stats.healthy}/${stats.total}`)
 * ```
 */

// Core exports
export { aiService } from './ai-service'
export { serviceBus } from './service-bus'

// Type exports
export type {
  AIProvider,
  AIMessage,
  AICompletionRequest,
  AICompletionResponse,
  AIProviderAdapter,
  ServiceHealth,
  ServiceAdapter,
  ExternalAPIAdapter,
} from './types'

// Provider adapters
export { OpenAIAdapter } from './providers/openai-adapter'

// Initialize function for easy setup
export async function initializeAPIBus(): Promise<void> {
  const { aiService } = await import('./ai-service')
  await aiService.initialize()
  console.log('[API Bus] Initialized successfully')
}
