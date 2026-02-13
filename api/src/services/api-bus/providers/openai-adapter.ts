/**
 * OpenAI Provider Adapter
 * Implements the unified AI interface for OpenAI GPT models
 */

import OpenAI from 'openai'

import logger from '../../../config/logger'
import type { AIProviderAdapter, AICompletionRequest, AICompletionResponse } from '../types'

export class OpenAIAdapter implements AIProviderAdapter {
  readonly provider = 'openai' as const
  private client: OpenAI | null = null
  private apiKey: string
  private defaultModel: string

  constructor(apiKey: string, defaultModel: string = 'gpt-4') {
    this.apiKey = apiKey
    this.defaultModel = defaultModel
  }

  async initialize(): Promise<void> {
    this.client = new OpenAI({
      apiKey: this.apiKey,
    })
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || this.apiKey.length < 20) {
      return false
    }

    try {
      if (!this.client) {
        await this.initialize()
      }

      // Quick health check - list models
      await this.client!.models.list()
      return true
    } catch (error) {
      logger.error('[OpenAI] Availability check failed:', { error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.client) {
      await this.initialize()
    }

    const startTime = Date.now()

    try {
      const response = await this.client!.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: false,
      })

      const choice = response.choices[0]

      return {
        id: response.id,
        provider: this.provider,
        model: response.model,
        content: choice.message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
        finishReason: this.mapFinishReason(choice.finish_reason),
        timestamp: new Date(),
      }
    } catch (error: any) {
      throw new Error(`[OpenAI] Completion failed: ${error.message}`)
    }
  }

  async *streamComplete(request: AICompletionRequest): AsyncGenerator<string> {
    if (!this.client) {
      await this.initialize()
    }

    try {
      const stream = await this.client!.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2000,
        stream: true,
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error: any) {
      throw new Error(`[OpenAI] Streaming failed: ${error.message}`)
    }
  }

  private mapFinishReason(reason: string | null): 'stop' | 'length' | 'content_filter' | 'error' {
    switch (reason) {
      case 'stop':
        return 'stop'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'content_filter'
      default:
        return 'error'
    }
  }
}
