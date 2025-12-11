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
      const { title, documentIds, systemPrompt } = z.object({
        title: z.string().optional(),
        documentIds: z.array(z.string()).optional(),
        systemPrompt: z.string().optional(),
      }).parse(req.body)

      const updatedSession = await chatSessionRepository.updateSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        title,
        documentScope: documentIds ? JSON.stringify(documentIds) : undefined,
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

      // Generate AI response
      const aiResponse = await generateAIResponse(session, message)

      // Save AI response as a message
      await chatMessageRepository.createMessage({
        sessionId,
        userId: req.user!.id,
        content: aiResponse.content,
        role: 'assistant',
        sources: JSON.stringify(aiResponse.sources),
      })

      res.json({
        message,
        aiResponse: {
          content: aiResponse.content,
          sources: aiResponse.sources,
        },
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

// Helper function to generate AI response
async function generateAIResponse(session: any, userMessage: any) {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const documentIds = JSON.parse(session.document_scope)
  const relevantDocuments = await vectorSearchService.searchDocuments(documentIds, userMessage.content)

  const context = relevantDocuments.map(doc => doc.content).join('\n\n')
  const prompt = `${session.system_prompt}\n\nContext:\n${context}\n\nUser: ${userMessage.content}\nAI:`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: prompt }],
    stream: false,
  })

  const response = completion.choices[0].message.content
  const sources = relevantDocuments.map(doc => ({ id: doc.id, title: doc.title }))

  return { content: response, sources }
}

// Helper function to get default system prompt
function getDefaultSystemPrompt() {
  return 'You are a helpful AI assistant. Use the provided context to answer user questions accurately. Cite your sources when possible.'
}

export default router


This refactored version of `ai-chat.ts` replaces all database queries with calls to the appropriate repository methods. The `ChatSessionRepository` and `ChatMessageRepository` are used to handle all database operations related to chat sessions and messages, respectively.

Key changes include:

1. Importing the repository classes at the top of the file.
2. Initializing the repository instances.
3. Replacing all `pool.query` calls with corresponding repository method calls.
4. Adjusting the method signatures to match the repository interfaces.

The rest of the file remains largely unchanged, maintaining the same functionality and structure as before. This refactoring improves the separation of concerns and makes the code more maintainable and testable.