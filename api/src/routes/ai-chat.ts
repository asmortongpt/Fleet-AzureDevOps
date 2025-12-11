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
      const updateData = z.object({
        title: z.string().optional(),
        documentIds: z.array(z.string()).optional(),
        systemPrompt: z.string().optional(),
      }).parse(req.body)

      const updatedSession = await chatSessionRepository.updateSession({
        sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        title: updateData.title,
        documentScope: JSON.stringify(updateData.documentIds || []),
        systemPrompt: updateData.systemPrompt,
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
      const messageData = CreateMessageSchema.parse(req.body)

      const session = await chatSessionRepository.getSession({
        sessionId: messageData.sessionId,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const message = await chatMessageRepository.createMessage({
        sessionId: messageData.sessionId,
        userId: req.user!.id,
        content: messageData.content,
        role: 'user',
      })

      // Process the message and generate a response
      const response = await processMessage(session, message)

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

// Helper function to process a message and generate a response
async function processMessage(session: any, message: any) {
  try {
    // Retrieve relevant documents based on the message content
    const documentScope = JSON.parse(session.document_scope)
    const relevantDocuments = await vectorSearchService.searchDocuments(
      message.content,
      documentScope
    )

    // Generate an embedding for the message
    const messageEmbedding = await embeddingService.generateEmbedding(message.content)

    // Prepare the prompt for the AI model
    const prompt = preparePrompt(session, message, relevantDocuments)

    // Generate a response using the AI model
    const response = await generateAIResponse(prompt)

    // Save the AI response as a message
    const aiMessage = await chatMessageRepository.createMessage({
      sessionId: session.id,
      userId: session.user_id,
      content: response.content,
      role: 'assistant',
      sources: JSON.stringify(response.sources),
    })

    return aiMessage
  } catch (error) {
    console.error('Error processing message:', error)
    throw error
  }
}

// Helper function to prepare the prompt for the AI model
function preparePrompt(session: any, message: any, relevantDocuments: any[]) {
  const systemPrompt = session.system_prompt || getDefaultSystemPrompt()
  const context = relevantDocuments.map(doc => doc.content).join('\n\n')
  const userMessage = message.content

  return `${systemPrompt}\n\nContext:\n${context}\n\nUser: ${userMessage}\nAssistant:`
}

// Helper function to generate an AI response
async function generateAIResponse(prompt: string) {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 256,
    n: 1,
    stop: ['\nUser:'],
  })

  const response = completion.choices[0].message.content.trim()
  const sources = extractSources(response)

  return { content: response, sources }
}

// Helper function to extract sources from the AI response
function extractSources(response: string) {
  const sourceRegex = /\[Source: (.*?)\]/g
  const sources = []
  let match

  while ((match = sourceRegex.exec(response)) !== null) {
    sources.push(match[1])
  }

  return sources
}

// Helper function to get the default system prompt
function getDefaultSystemPrompt() {
  return `You are a helpful AI assistant designed to answer questions about documents. Use the provided context to answer user queries accurately. If you don't know the answer, say so. Always provide source citations in the format [Source: <source_id>] at the end of relevant sentences.`
}

export default router


This refactored version of `ai-chat.ts` replaces all database queries with calls to the `ChatSessionRepository` and `ChatMessageRepository` methods. The repositories are imported at the beginning of the file and initialized before the route handlers.

The main changes include:

1. Importing and initializing `ChatSessionRepository` and `ChatMessageRepository`.
2. Replacing all `pool.query` calls with corresponding repository methods:
   - `chatSessionRepository.createSession` for creating a new session
   - `chatSessionRepository.getUserSessions` for retrieving user sessions
   - `chatSessionRepository.getSessionWithMessages` for getting a session with messages
   - `chatSessionRepository.updateSession` for updating a session
   - `chatSessionRepository.deleteSession` for deleting a session
   - `chatSessionRepository.getSession` for getting a session
   - `chatMessageRepository.createMessage` for creating a new message

3. The `processMessage` function now uses `chatMessageRepository.createMessage` to save the AI response as a message.

4. The overall structure and functionality of the file remain the same, but the database operations are now abstracted away into the repository classes.

This refactoring improves the separation of concerns, making the code more modular and easier to maintain. The database operations are now encapsulated within the repository classes, which can be easily modified or replaced if needed.