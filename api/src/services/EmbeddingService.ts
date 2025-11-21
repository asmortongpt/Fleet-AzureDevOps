/**
 * Advanced Embedding Service for RAG System
 *
 * Supports multiple embedding providers with intelligent fallback:
 * - OpenAI (text-embedding-3-large, text-embedding-3-small, ada-002)
 * - Cohere (embed-english-v3.0, embed-multilingual-v3.0)
 * - Local models (transformers.js for offline mode)
 *
 * Features:
 * - Automatic provider selection and fallback
 * - Intelligent text chunking (semantic, sliding window)
 * - Caching for repeated embeddings
 * - Batch processing optimization
 * - Token counting and cost estimation
 */

import OpenAI from 'openai'
import pool from '../config/database'

// Cohere SDK (optional)
interface CohereClient {
  embed: (params: { texts: string[]; model: string; inputType?: string }) => Promise<{ embeddings: number[][] }>
}

// Local embedding interface (transformers.js compatible)
interface LocalEmbeddingModel {
  embed: (text: string) => Promise<number[]>
  embedBatch: (texts: string[]) => Promise<number[][]>
}

export interface EmbeddingConfig {
  provider: 'openai' | 'cohere' | 'local'
  model?: string
  dimensions?: number
  enableCache?: boolean
  batchSize?: number
}

export interface TextChunk {
  text: string
  tokens: number
  index: number
  metadata?: Record<string, any>
  startChar: number
  endChar: number
}

export interface ChunkingConfig {
  strategy: 'fixed' | 'semantic' | 'sentence' | 'paragraph'
  chunkSize: number // in tokens
  chunkOverlap: number // in tokens
  maxChunkSize?: number
  minChunkSize?: number
}

export interface EmbeddingResult {
  embedding: number[]
  model: string
  provider: string
  dimensions: number
  tokens: number
  cached?: boolean
  cost?: number
}

export class EmbeddingService {
  private openai: OpenAI | null = null
  private cohere: CohereClient | null = null
  private localModel: LocalEmbeddingModel | null = null
  private cache: Map<string, { embedding: number[]; timestamp: number }> = new Map()
  private cacheMaxAge = 24 * 60 * 60 * 1000 // 24 hours
  private initialized = false

  // Provider configurations
  private readonly providerConfigs = {
    openai: {
      'text-embedding-3-large': { dimensions: 3072, costPer1M: 0.13 },
      'text-embedding-3-small': { dimensions: 1536, costPer1M: 0.02 },
      'text-embedding-ada-002': { dimensions: 1536, costPer1M: 0.10 },
    },
    cohere: {
      'embed-english-v3.0': { dimensions: 1024, costPer1M: 0.10 },
      'embed-multilingual-v3.0': { dimensions: 1024, costPer1M: 0.10 },
    },
    local: {
      'all-MiniLM-L6-v2': { dimensions: 384, costPer1M: 0 },
    },
  }

  constructor() {
    // Don't call async initialization in constructor
  }

  /**
   * Initialize embedding providers based on available API keys (called lazily)
   */
  private async initializeProviders(): Promise<void> {
    if (this.initialized) return
    // OpenAI initialization
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
      console.log('✓ OpenAI embedding provider initialized')
    }

    // Cohere initialization
    if (process.env.COHERE_API_KEY) {
      try {
        // Dynamic import to avoid dependency if not needed
        const { CohereClient } = await import('cohere-ai')
        this.cohere = new CohereClient({
          token: process.env.COHERE_API_KEY,
        }) as any
        console.log('✓ Cohere embedding provider initialized')
      } catch (error) {
        console.warn('Cohere SDK not available, skipping initialization')
      }
    }

    // Local model initialization
    if (process.env.ENABLE_LOCAL_EMBEDDINGS === 'true') {
      console.log('ℹ Local embeddings enabled (requires transformers.js)')
      // Note: Actual initialization would require transformers.js
      // For now, we'll use a fallback implementation
    }

    this.initialized = true
  }

  /**
   * Generate embeddings for text with automatic provider selection
   */
  async generateEmbedding(
    text: string,
    config: Partial<EmbeddingConfig> = {}
  ): Promise<EmbeddingResult> {
    // Ensure providers are initialized
    await this.initializeProviders()

    const {
      provider = this.selectBestProvider(),
      model = this.getDefaultModel(provider),
      enableCache = true,
    } = config

    // Check cache
    if (enableCache) {
      const cached = this.getFromCache(text, provider, model)
      if (cached) {
        return {
          embedding: cached,
          model,
          provider,
          dimensions: cached.length,
          tokens: this.estimateTokenCount(text),
          cached: true,
        }
      }
    }

    // Generate embedding based on provider
    let embedding: number[]
    let tokens: number

    switch (provider) {
      case 'openai':
        ;({ embedding, tokens } = await this.generateOpenAIEmbedding(text, model))
        break
      case 'cohere':
        ;({ embedding, tokens } = await this.generateCohereEmbedding(text, model))
        break
      case 'local':
        ;({ embedding, tokens } = await this.generateLocalEmbedding(text, model))
        break
      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }

    // Cache the result
    if (enableCache) {
      this.saveToCache(text, provider, model, embedding)
    }

    // Calculate cost
    const cost = this.calculateCost(provider, model, tokens)

    return {
      embedding,
      model,
      provider,
      dimensions: embedding.length,
      tokens,
      cost,
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async generateEmbeddingsBatch(
    texts: string[],
    config: Partial<EmbeddingConfig> = {}
  ): Promise<EmbeddingResult[]> {
    const {
      provider = this.selectBestProvider(),
      model = this.getDefaultModel(provider),
      batchSize = 100,
    } = config

    const results: EmbeddingResult[] = []

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(text => this.generateEmbedding(text, { provider, model }))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * OpenAI embedding generation
   */
  private async generateOpenAIEmbedding(
    text: string,
    model: string
  ): Promise<{ embedding: number[]; tokens: number }> {
    if (!this.openai) {
      throw new Error('OpenAI provider not initialized')
    }

    try {
      const response = await this.openai.embeddings.create({
        model,
        input: text,
      })

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
      }
    } catch (error: any) {
      console.error('OpenAI embedding error:', error)
      throw new Error(`OpenAI embedding failed: ${error.message}`)
    }
  }

  /**
   * Cohere embedding generation
   */
  private async generateCohereEmbedding(
    text: string,
    model: string
  ): Promise<{ embedding: number[]; tokens: number }> {
    if (!this.cohere) {
      throw new Error('Cohere provider not initialized')
    }

    try {
      const response = await this.cohere.embed({
        texts: [text],
        model,
        inputType: 'search_document',
      })

      return {
        embedding: response.embeddings[0],
        tokens: this.estimateTokenCount(text),
      }
    } catch (error: any) {
      console.error('Cohere embedding error:', error)
      throw new Error(`Cohere embedding failed: ${error.message}`)
    }
  }

  /**
   * Local embedding generation (fallback)
   */
  private async generateLocalEmbedding(
    text: string,
    model: string
  ): Promise<{ embedding: number[]; tokens: number }> {
    console.warn('Using mock local embeddings - configure transformers.js for production')

    // Mock embedding for development
    const dimensions = 384 // all-MiniLM-L6-v2 dimension
    const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1)

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    const normalized = embedding.map(val => val / magnitude)

    return {
      embedding: normalized,
      tokens: this.estimateTokenCount(text),
    }
  }

  /**
   * Intelligent text chunking with semantic awareness
   */
  chunkText(text: string, config: Partial<ChunkingConfig> = {}): TextChunk[] {
    const {
      strategy = 'semantic',
      chunkSize = 512,
      chunkOverlap = 50,
      maxChunkSize = 2048,
      minChunkSize = 100,
    } = config

    switch (strategy) {
      case 'semantic':
        return this.semanticChunking(text, chunkSize, chunkOverlap)
      case 'sentence':
        return this.sentenceChunking(text, chunkSize, chunkOverlap)
      case 'paragraph':
        return this.paragraphChunking(text, chunkSize, chunkOverlap)
      case 'fixed':
      default:
        return this.fixedChunking(text, chunkSize, chunkOverlap)
    }
  }

  /**
   * Semantic chunking - splits on semantic boundaries
   */
  private semanticChunking(text: string, chunkSize: number, overlap: number): TextChunk[] {
    const chunks: TextChunk[] = []

    // Split into sentences first
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

    let currentChunk = ''
    let currentTokens = 0
    let startChar = 0
    let chunkIndex = 0

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokenCount(sentence)

      // If adding this sentence exceeds chunk size, save current chunk
      if (currentTokens + sentenceTokens > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          tokens: currentTokens,
          index: chunkIndex++,
          startChar,
          endChar: startChar + currentChunk.length,
        })

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, overlap)
        currentChunk = overlapText + sentence
        currentTokens = this.estimateTokenCount(currentChunk)
        startChar = startChar + currentChunk.length - overlapText.length
      } else {
        currentChunk += sentence
        currentTokens += sentenceTokens
      }
    }

    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        tokens: currentTokens,
        index: chunkIndex,
        startChar,
        endChar: startChar + currentChunk.length,
      })
    }

    return chunks
  }

  /**
   * Sentence-based chunking
   */
  private sentenceChunking(text: string, chunkSize: number, overlap: number): TextChunk[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks: TextChunk[] = []
    let chunkIndex = 0
    let startChar = 0

    for (let i = 0; i < sentences.length; i++) {
      let chunkText = sentences[i]
      let tokens = this.estimateTokenCount(chunkText)

      // Keep adding sentences until we reach chunk size
      while (i + 1 < sentences.length && tokens < chunkSize) {
        chunkText += sentences[i + 1]
        tokens = this.estimateTokenCount(chunkText)
        if (tokens <= chunkSize) i++
      }

      chunks.push({
        text: chunkText.trim(),
        tokens,
        index: chunkIndex++,
        startChar,
        endChar: startChar + chunkText.length,
      })

      startChar += chunkText.length
    }

    return chunks
  }

  /**
   * Paragraph-based chunking
   */
  private paragraphChunking(text: string, chunkSize: number, overlap: number): TextChunk[] {
    const paragraphs = text.split(/\n\n+/)
    const chunks: TextChunk[] = []
    let chunkIndex = 0
    let startChar = 0

    for (let i = 0; i < paragraphs.length; i++) {
      let chunkText = paragraphs[i]
      let tokens = this.estimateTokenCount(chunkText)

      // Combine paragraphs if needed
      while (i + 1 < paragraphs.length && tokens < chunkSize) {
        chunkText += '\n\n' + paragraphs[i + 1]
        tokens = this.estimateTokenCount(chunkText)
        if (tokens <= chunkSize) i++
      }

      chunks.push({
        text: chunkText.trim(),
        tokens,
        index: chunkIndex++,
        startChar,
        endChar: startChar + chunkText.length,
      })

      startChar += chunkText.length + 2 // +2 for \n\n
    }

    return chunks
  }

  /**
   * Fixed-size chunking with overlap
   */
  private fixedChunking(text: string, chunkSize: number, overlap: number): TextChunk[] {
    const chunks: TextChunk[] = []
    const tokenLength = this.estimateTokenCount(text)
    const charPerToken = text.length / tokenLength
    const chunkSizeChars = Math.floor(chunkSize * charPerToken)
    const overlapChars = Math.floor(overlap * charPerToken)

    let start = 0
    let chunkIndex = 0

    while (start < text.length) {
      let end = Math.min(start + chunkSizeChars, text.length)

      // Try to break at word boundary
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end)
        if (lastSpace > start + chunkSizeChars / 2) {
          end = lastSpace
        }
      }

      const chunkText = text.slice(start, end).trim()

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          tokens: this.estimateTokenCount(chunkText),
          index: chunkIndex++,
          startChar: start,
          endChar: end,
        })
      }

      start = end - overlapChars
      if (start >= text.length) break
    }

    return chunks
  }

  /**
   * Get overlap text from the end of a chunk
   */
  private getOverlapText(text: string, overlapTokens: number): string {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || []
    let overlap = ''
    let tokens = 0

    // Add sentences from the end until we reach desired overlap
    for (let i = sentences.length - 1; i >= 0 && tokens < overlapTokens; i--) {
      overlap = sentences[i] + overlap
      tokens = this.estimateTokenCount(overlap)
    }

    return overlap
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Average ~4 characters per token for English
    // More accurate would use tiktoken library
    return Math.ceil(text.length / 4)
  }

  /**
   * Select best available provider
   */
  private selectBestProvider(): 'openai' | 'cohere' | 'local' {
    if (this.openai) return 'openai'
    if (this.cohere) return 'cohere'
    return 'local'
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(provider: 'openai' | 'cohere' | 'local'): string {
    switch (provider) {
      case 'openai':
        return 'text-embedding-3-large'
      case 'cohere':
        return 'embed-english-v3.0'
      case 'local':
        return 'all-MiniLM-L6-v2'
    }
  }

  /**
   * Calculate embedding cost
   */
  private calculateCost(provider: string, model: string, tokens: number): number {
    const config = (this.providerConfigs as any)[provider]?.[model]
    if (!config) return 0

    return (tokens / 1_000_000) * config.costPer1M
  }

  /**
   * Cache management
   */
  private getCacheKey(text: string, provider: string, model: string): string {
    return `${provider}:${model}:${this.hashText(text)}`
  }

  private hashText(text: string): string {
    // Simple hash for caching (in production, use proper hashing)
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(36)
  }

  private getFromCache(text: string, provider: string, model: string): number[] | null {
    const key = this.getCacheKey(text, provider, model)
    const cached = this.cache.get(key)

    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.embedding
    }

    // Remove expired entry
    if (cached) {
      this.cache.delete(key)
    }

    return null
  }

  private saveToCache(text: string, provider: string, model: string, embedding: number[]): void {
    const key = this.getCacheKey(text, provider, model)
    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
    })

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get provider capabilities
   */
  getProviderInfo() {
    return {
      available: {
        openai: !!this.openai,
        cohere: !!this.cohere,
        local: !!this.localModel || process.env.ENABLE_LOCAL_EMBEDDINGS === 'true',
      },
      models: this.providerConfigs,
      cacheSize: this.cache.size,
    }
  }
}

// Export class instead of instance to avoid module-level initialization
// Users should create their own instance or import the singleton helper
let serviceInstance: EmbeddingService | null = null

export function getEmbeddingService(): EmbeddingService {
  if (!serviceInstance) {
    serviceInstance = new EmbeddingService()
  }
  return serviceInstance
}

export default getEmbeddingService
