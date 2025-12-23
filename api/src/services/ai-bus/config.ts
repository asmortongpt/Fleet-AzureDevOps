/**
 * AI Bus - Configuration Management
 * Centralized configuration for all AI providers
 */

import { AIProvider, AIProviderConfig } from './types'

export interface AIBusConfig {
  primaryProvider: AIProvider
  fallbackProviders: AIProvider[]
  providers: Record<AIProvider, AIProviderConfig>
  routing: {
    chat: AIProvider
    embeddings: AIProvider
    vision: AIProvider
    functions: AIProvider
  }
  costOptimization: {
    enabled: boolean
    preferCheaper: boolean
    maxCostPerRequest: number
  }
  monitoring: {
    enabled: boolean
    logRequests: boolean
    logResponses: boolean
  }
}

/**
 * Default AI Bus configuration
 */
export const defaultAIBusConfig: AIBusConfig = {
  primaryProvider: (process.env.AI_PRIMARY_PROVIDER as AIProvider) || 'openai',
  fallbackProviders: [],

  providers: {
    'openai': {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-2024-11-20',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': 'gpt-4o-2024-11-20',
        'chat-fast': 'gpt-4o-mini',
        'embeddings': 'text-embedding-3-small',
        'embeddings-large': 'text-embedding-3-large'
      },
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000
      }
    },

    'azure-openai': {
      provider: 'azure-openai',
      apiKey: process.env.AZURE_OPENAI_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
      defaultModel: 'gpt-4',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4',
        'chat-fast': 'gpt-4o-mini',
        'embeddings': 'text-embedding-3-small'
      }
    },

    'anthropic': {
      provider: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      endpoint: 'https://api.anthropic.com/v1',
      defaultModel: 'claude-3-5-sonnet-20241022',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': 'claude-3-5-sonnet-20241022',
        'chat-fast': 'claude-3-5-haiku-20241022',
        'chat-powerful': 'claude-3-opus-20240229'
      },
      rateLimit: {
        requestsPerMinute: 1000,
        tokensPerMinute: 200000
      }
    },

    'google-gemini': {
      provider: 'google-gemini',
      apiKey: process.env.GOOGLE_API_KEY,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta',
      defaultModel: 'gemini-2.0-flash-exp',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': 'gemini-2.0-flash-exp',
        'chat-powerful': 'gemini-1.5-pro-002',
        'vision': 'gemini-2.0-flash-exp'
      }
    },

    'aws-bedrock': {
      provider: 'aws-bedrock',
      region: process.env.AWS_REGION || 'us-east-1',
      defaultModel: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'chat-fast': 'anthropic.claude-3-5-haiku-20241022-v1:0',
        'embeddings': 'amazon.titan-embed-text-v2:0'
      }
    },

    'cohere': {
      provider: 'cohere',
      apiKey: process.env.COHERE_API_KEY,
      endpoint: 'https://api.cohere.ai/v1',
      defaultModel: 'command-r-plus',
      timeout: 60000,
      retries: 3,
      modelMappings: {
        'chat': 'command-r-plus',
        'chat-fast': 'command-r',
        'embeddings': 'embed-english-v3.0'
      }
    },

    'local': {
      provider: 'local',
      endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434',
      defaultModel: 'llama3.2',
      timeout: 120000,
      retries: 1,
      modelMappings: {
        'chat': 'llama3.2',
        'embeddings': 'nomic-embed-text'
      }
    }
  },

  routing: {
    chat: (process.env.AI_CHAT_PROVIDER as AIProvider) || 'openai',
    embeddings: (process.env.AI_EMBEDDINGS_PROVIDER as AIProvider) || 'openai',
    vision: (process.env.AI_VISION_PROVIDER as AIProvider) || 'openai',
    functions: (process.env.AI_FUNCTIONS_PROVIDER as AIProvider) || 'openai'
  },

  costOptimization: {
    enabled: process.env.AI_COST_OPTIMIZATION === 'true',
    preferCheaper: process.env.AI_PREFER_CHEAPER === 'true',
    maxCostPerRequest: parseFloat(process.env.AI_MAX_COST_PER_REQUEST || '1.0')
  },

  monitoring: {
    enabled: process.env.AI_MONITORING === 'true',
    logRequests: process.env.AI_LOG_REQUESTS === 'true',
    logResponses: process.env.AI_LOG_RESPONSES === 'true'
  }
}

/**
 * Load AI Bus configuration from environment
 */
export function loadAIBusConfig(): AIBusConfig {
  return defaultAIBusConfig
}

/**
 * Validate AI Bus configuration
 */
export function validateAIBusConfig(config: AIBusConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check primary provider is configured
  const primaryConfig = config.providers[config.primaryProvider]
  if (!primaryConfig) {
    errors.push(`Primary provider '${config.primaryProvider}' not configured`)
  }

  // Check provider-specific requirements
  for (const [name, providerConfig] of Object.entries(config.providers)) {
    if (!providerConfig) continue

    switch (providerConfig.provider) {
      case 'openai':
      case 'anthropic':
      case 'cohere':
        if (!providerConfig.apiKey) {
          errors.push(`${name}: API key required`)
        }
        break

      case 'azure-openai':
        if (!providerConfig.apiKey || !providerConfig.endpoint) {
          errors.push(`${name}: API key and endpoint required`)
        }
        break

      case 'google-gemini':
        if (!providerConfig.apiKey) {
          errors.push(`${name}: API key required`)
        }
        break

      case 'aws-bedrock':
        if (!providerConfig.region) {
          errors.push(`${name}: AWS region required`)
        }
        break

      case 'local':
        if (!providerConfig.endpoint) {
          errors.push(`${name}: Endpoint required`)
        }
        break
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Get provider pricing (cost per 1M tokens)
 */
export function getProviderPricing(provider: AIProvider, model: string): { input: number; output: number } {
  const pricing: Record<string, { input: number; output: number }> = {
    // OpenAI
    'gpt-4o-2024-11-20': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo-preview': { input: 10.00, output: 30.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },

    // Anthropic
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },

    // Google Gemini
    'gemini-2.0-flash-exp': { input: 0.10, output: 0.40 },
    'gemini-1.5-pro-002': { input: 1.25, output: 5.00 },

    // Cohere
    'command-r-plus': { input: 3.00, output: 15.00 },
    'command-r': { input: 0.50, output: 1.50 },

    // Local
    'llama3.2': { input: 0.00, output: 0.00 }
  }

  return pricing[model] || { input: 1.00, output: 3.00 }
}
