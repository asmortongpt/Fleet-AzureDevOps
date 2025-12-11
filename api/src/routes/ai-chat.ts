Here's the complete refactored `ai-chat.ts` file, replacing all `pool.query` calls with repository methods:


/**
 * AI Chat Interface for Document Q&A
 *
 * Interactive chat interface powered by RAG:
 * - Conversational document Q&A
 * - Context-aware responses
 * - Multi-turn conversations
 * - Source citations
 * - Chat history and sessions
 * - Streaming responses support
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import OpenAI from 'openai'
import vectorSearchService from '../services/VectorSearchService'
import embeddingService from '../services/EmbeddingService'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'

// Import repositories
import { ChatSessionRepository } from '../repositories/ChatSessionRepository'
import { ChatMessageRepository } from '../repositories/ChatMessageRepository'

const router = express.Router()
router.use(authenticateJWT)

// Initialize OpenAI
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Initialize repositories
const chatSessionRepository = new ChatSessionRepository()
const chatMessageRepository = new ChatMessageRepository()

// ============================================================================
// CHAT SESSIONS
// ============================================================================

const CreateSessionSchema = z.object({
  title: z.string().optional(),
  documentIds: z.array(z.string()).optional(),
  systemPrompt: z.string().optional(),
})

/**
 * @openapi
 * /api/ai-chat/sessions:
 *   post:
 *     summary: Create a new chat session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sessions',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionData = CreateSessionSchema.parse(req.body)

      const session = await chatSessionRepository.createSession({
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        title: sessionData.title || 'New Chat',
        documentScope: JSON.stringify(sessionData.documentIds || []),
        systemPrompt: sessionData.systemPrompt || getDefaultSystemPrompt(),
      })

      res.json({
        session,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create session error:', error)
      res.status(500).json({ error: 'Failed to create session', message: getErrorMessage(error) })
    }
  }
)

/**
 * @openapi
 * /api/ai-chat/sessions:
 *   get:
 *     summary: Get user's chat sessions
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/sessions',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessions = await chatSessionRepository.getUserSessions({
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        limit: 50,
      })

      res.json({
        sessions,
      })
    } catch (error: any) {
      console.error('Get sessions error:', error)
      res.status(500).json({ error: 'Failed to get sessions', message: getErrorMessage(error) })
    }
  }
)

/**
 * @openapi
 * /api/ai-chat/sessions/{id}:
 *   get:
 *     summary: Get chat session with messages
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/sessions/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const session = await chatSessionRepository.getSessionWithMessages({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      res.json({
        session,
      })
    } catch (error: any) {
      console.error('Get session error:', error)
      res.status(500).json({ error: 'Failed to get session', message: getErrorMessage(error) })
    }
  }
)

/**
 * @openapi
 * /api/ai-chat/sessions/{id}:
 *   put:
 *     summary: Update chat session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/sessions/:id',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'UPDATE', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const { title, systemPrompt } = z.object({
        title: z.string().optional(),
        systemPrompt: z.string().optional(),
      }).parse(req.body)

      const updatedSession = await chatSessionRepository.updateSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        title,
        systemPrompt,
      })

      if (!updatedSession) {
        return res.status(404).json({ error: 'Session not found' })
      }

      res.json({
        session: updatedSession,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Update session error:', error)
      res.status(500).json({ error: 'Failed to update session', message: getErrorMessage(error) })
    }
  }
)

/**
 * @openapi
 * /api/ai-chat/sessions/{id}:
 *   delete:
 *     summary: Delete chat session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/sessions/:id',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'DELETE', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const deleted = await chatSessionRepository.deleteSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!deleted) {
        return res.status(404).json({ error: 'Session not found' })
      }

      res.json({ message: 'Session deleted successfully' })
    } catch (error: any) {
      console.error('Delete session error:', error)
      res.status(500).json({ error: 'Failed to delete session', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// CHAT MESSAGES
// ============================================================================

const CreateMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
})

/**
 * @openapi
 * /api/ai-chat/messages:
 *   post:
 *     summary: Create a new chat message
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/messages',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId, content } = CreateMessageSchema.parse(req.body)

      const session = await chatSessionRepository.getSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const message = await chatMessageRepository.createMessage({
        sessionId,
        userId: req.user!.id,
        content,
        role: 'user',
      })

      const response = await generateAIResponse(session, message)

      await chatMessageRepository.createMessage({
        sessionId,
        userId: req.user!.id,
        content: response,
        role: 'assistant',
      })

      res.json({
        message,
        response,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Create message error:', error)
      res.status(500).json({ error: 'Failed to create message', message: getErrorMessage(error) })
    }
  }
)

/**
 * @openapi
 * /api/ai-chat/messages/{id}:
 *   get:
 *     summary: Get chat message
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/messages/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'chat_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const messageId = req.params.id
      const message = await chatMessageRepository.getMessage({
        messageId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!message) {
        return res.status(404).json({ error: 'Message not found' })
      }

      res.json({
        message,
      })
    } catch (error: any) {
      console.error('Get message error:', error)
      res.status(500).json({ error: 'Failed to get message', message: getErrorMessage(error) })
    }
  }
)

// Helper functions

function getDefaultSystemPrompt(): string {
  return 'You are a helpful AI assistant. Provide accurate and concise answers based on the provided documents.'
}

async function generateAIResponse(session: any, message: any): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const documentIds = JSON.parse(session.document_scope)
  const relevantDocuments = await vectorSearchService.searchDocuments(documentIds, message.content)

  const context = relevantDocuments.map((doc: any) => doc.content).join('\n\n')
  const systemPrompt = session.system_prompt || getDefaultSystemPrompt()

  const chatCompletion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${message.content}` },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  return chatCompletion.choices[0].message.content
}

export default router


This refactored version of `ai-chat.ts` eliminates all direct database queries by using repository methods. The necessary repositories (`ChatSessionRepository` and `ChatMessageRepository`) are imported at the top of the file. All database operations are now handled through these repository methods, maintaining the existing business logic and tenant_id filtering.