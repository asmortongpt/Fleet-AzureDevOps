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
  content: z.string(),
  role: z.enum(['user', 'assistant']),
})

/**
 * @openapi
 * /api/ai-chat/sessions/{id}/messages:
 *   post:
 *     summary: Create a new chat message
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sessions/:id/messages',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const { content, role } = CreateMessageSchema.parse(req.body)

      const message = await chatMessageRepository.createMessage({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        content,
        role,
      })

      res.json({
        message,
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
 * /api/ai-chat/sessions/{id}/messages:
 *   get:
 *     summary: Get chat messages for a session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/sessions/:id/messages',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'chat_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const messages = await chatMessageRepository.getMessagesForSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      res.json({
        messages,
      })
    } catch (error: any) {
      console.error('Get messages error:', error)
      res.status(500).json({ error: 'Failed to get messages', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// CHAT FUNCTIONALITY
// ============================================================================

/**
 * @openapi
 * /api/ai-chat/sessions/{id}/query:
 *   post:
 *     summary: Query the AI with a chat session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/sessions/:id/query',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'QUERY', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API not configured' })
    }

    try {
      const sessionId = req.params.id
      const { query } = z.object({ query: z.string() }).parse(req.body)

      const session = await chatSessionRepository.getSessionWithMessages({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const documentIds = JSON.parse(session.document_scope || '[]')
      const context = await getContextForQuery(query, documentIds)

      const messages = [
        { role: 'system', content: session.system_prompt || getDefaultSystemPrompt() },
        ...session.messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query },
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
      })

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        res.write(`data: ${JSON.stringify({ content })}\n\n`)
      }

      res.end()

      // Save the user's query as a message
      await chatMessageRepository.createMessage({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        content: query,
        role: 'user',
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Query error:', error)
      res.status(500).json({ error: 'Failed to process query', message: getErrorMessage(error) })
    }
  }
)

// Helper functions

function getDefaultSystemPrompt(): string {
  return 'You are a helpful AI assistant. Use the provided context to answer questions accurately.'
}

async function getContextForQuery(query: string, documentIds: string[]): Promise<string> {
  const queryEmbedding = await embeddingService.getEmbedding(query)
  const searchResults = await vectorSearchService.search(queryEmbedding, documentIds, 3)
  return searchResults.map(result => result.content).join('\n\n')
}

export default router


This refactored version of `ai-chat.ts` replaces all database operations with calls to the appropriate repository methods. The `ChatSessionRepository` and `ChatMessageRepository` are used to handle all database interactions, improving the separation of concerns and making the code more maintainable.

Key changes include:

1. Importing the repository classes at the top of the file.
2. Initializing instances of the repositories.
3. Replacing all `pool.query` calls with corresponding repository method calls.
4. Updating the method signatures to match the repository interfaces.

The rest of the file remains largely unchanged, maintaining the existing functionality while improving the overall structure and organization of the code.