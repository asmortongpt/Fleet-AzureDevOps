/**
 * AI CHAT ENDPOINT
 *
 * Demonstrates the provider-agnostic AI layer
 * Switch providers via environment variable or runtime configuration
 */

import { Router } from 'express'

import { aiService } from '../../services/api-bus'
import type { AICompletionRequest } from '../../services/api-bus'

const router = Router()

/**
 * POST /api/ai/chat
 *
 * Send a chat message to the AI service
 * Automatically uses configured provider (OpenAI by default)
 *
 * @body {
 *   messages: Array<{ role: string, content: string }>,
 *   model?: string,
 *   temperature?: number,
 *   maxTokens?: number
 * }
 */
router.post('/chat', async (req, res) => {
  try {
    const request: AICompletionRequest = {
      messages: req.body.messages || [],
      model: req.body.model,
      temperature: req.body.temperature,
      maxTokens: req.body.maxTokens,
    }

    // Validate request
    if (!request.messages || request.messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
      })
    }

    // Call AI service (provider-agnostic)
    const response = await aiService.complete(request)

    return res.json({
      success: true,
      data: {
        id: response.id,
        provider: response.provider,
        model: response.model,
        content: response.content,
        usage: response.usage,
        finishReason: response.finishReason,
      },
    })
  } catch (error: any) {
    console.error('[AI Chat] Error:', error)
    return res.status(500).json({
      error: 'AI completion failed',
      message: error.message,
    })
  }
})

/**
 * POST /api/ai/chat/stream
 *
 * Stream a chat completion (real-time response)
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const request: AICompletionRequest = {
      messages: req.body.messages || [],
      model: req.body.model,
      temperature: req.body.temperature,
      maxTokens: req.body.maxTokens,
      stream: true,
    }

    if (!request.messages || request.messages.length === 0) {
      return res.status(400).json({
        error: 'Messages array is required',
      })
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Stream the response
    for await (const chunk of aiService.streamComplete(request)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error: any) {
    console.error('[AI Chat Stream] Error:', error)
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'AI streaming failed',
        message: error.message,
      })
    }
  }
})

/**
 * GET /api/ai/providers
 *
 * Get information about available AI providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = aiService.getProviderStats()

    return res.json({
      success: true,
      data: {
        providers,
        defaultProvider: 'openai', // From config
      },
    })
  } catch (error: any) {
    console.error('[AI Providers] Error:', error)
    return res.status(500).json({
      error: 'Failed to get provider info',
      message: error.message,
    })
  }
})

/**
 * POST /api/ai/switch-provider
 *
 * Switch the default AI provider at runtime
 *
 * @body {
 *   provider: 'openai' | 'claude' | 'gemini' | 'grok'
 * }
 */
router.post('/switch-provider', async (req, res) => {
  try {
    const { provider } = req.body

    if (!provider) {
      return res.status(400).json({
        error: 'Provider name is required',
      })
    }

    aiService.setDefaultProvider(provider)

    return res.json({
      success: true,
      message: `Switched to ${provider}`,
      provider,
    })
  } catch (error: any) {
    console.error('[AI Switch Provider] Error:', error)
    return res.status(500).json({
      error: 'Failed to switch provider',
      message: error.message,
    })
  }
})

export default router
