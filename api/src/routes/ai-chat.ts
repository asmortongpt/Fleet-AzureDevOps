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
import pool from '../config/database'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

// Initialize OpenAI
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

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
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionData = CreateSessionSchema.parse(req.body)

      const result = await pool.query(
        `INSERT INTO chat_sessions (
          tenant_id, user_id, title, document_scope, system_prompt
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, created_at`,
        [
          req.user!.tenant_id,
          req.user!.id,
          sessionData.title || 'New Chat',
          JSON.stringify(sessionData.documentIds || []),
          sessionData.systemPrompt || getDefaultSystemPrompt(),
        ]
      )

      res.json({
        session: result.rows[0],
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
      const result = await pool.query(
        `SELECT
          id, title, created_at, updated_at,
          (SELECT COUNT(*) FROM chat_messages WHERE session_id = chat_sessions.id) as message_count
         FROM chat_sessions
         WHERE tenant_id = $1 AND user_id = $2
         ORDER BY updated_at DESC
         LIMIT 50`,
        [req.user!.tenant_id, req.user!.id]
      )

      res.json({
        sessions: result.rows,
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
      // Get session
      const sessionResult = await pool.query(
        `SELECT id, tenant_id, user_id, title, created_at, updated_at, closed_at FROM chat_sessions
         WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      // Get messages
      const messagesResult = await pool.query(
        `SELECT id, tenant_id, session_id, role, content, created_at, updated_at FROM chat_messages
         WHERE session_id = $1
         ORDER BY created_at ASC`,
        [req.params.id]
      )

      res.json({
        session: sessionResult.rows[0],
        messages: messagesResult.rows,
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
 *   delete:
 *     summary: Delete chat session
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/sessions/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'DELETE', resourceType: 'chat_session' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Delete messages first
      await pool.query('DELETE FROM chat_messages WHERE session_id = $1`, [req.params.id])

      // Delete session
      await pool.query(
        'DELETE FROM chat_sessions WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      res.json({ success: true, message: 'Session deleted' })
    } catch (error: any) {
      console.error('Delete session error:', error)
      res.status(500).json({ error: 'Failed to delete session', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// CHAT MESSAGES
// ============================================================================

const ChatMessageSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(2000),
  includeHistory: z.boolean().optional().default(true),
  maxHistoryMessages: z.number().min(1).max(20).optional().default(10),
  searchDocuments: z.boolean().optional().default(true),
  maxSources: z.number().min(1).max(10).optional().default(5),
})

/**
 * @openapi
 * /api/ai-chat/chat:
 *   post:
 *     summary: Send a chat message and get AI response
 *     description: RAG-powered conversational AI with document grounding
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/chat',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const chatData = ChatMessageSchema.parse(req.body)

      if (!openai) {
        return res.status(503).json({
          error: 'AI chat not available',
          message: 'OpenAI API key not configured',
        })
      }

      const startTime = Date.now()

      // Get session
      const sessionResult = await pool.query(
        `SELECT      id,
      tenant_id,
      user_id,
      title,
      description,
      document_scope,
      system_prompt,
      model_name,
      temperature,
      max_tokens,
      message_count,
      total_tokens_used,
      total_cost_usd,
      created_at,
      updated_at,
      last_message_at,
      is_active,
      deleted_at FROM chat_sessions WHERE id = $1 AND tenant_id = $2',
        [chatData.sessionId, req.user!.tenant_id]
      )

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' })
      }

      const session = sessionResult.rows[0]

      // Save user message
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, content, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [chatData.sessionId, 'user', chatData.message]
      )

      // Get conversation history
      let conversationHistory: any[] = []
      if (chatData.includeHistory) {
        const historyResult = await pool.query(
          `SELECT role, content FROM chat_messages
           WHERE session_id = $1
           ORDER BY created_at DESC
           LIMIT $2',
          [chatData.sessionId, chatData.maxHistoryMessages]
        )
        conversationHistory = historyResult.rows.reverse()
      }

      // Search relevant documents
      let relevantContext = ''
      let sources: any[] = []

      if (chatData.searchDocuments) {
        const documentScope = JSON.parse(session.document_scope || '[]')

        const searchResults = await vectorSearchService.search(
          req.user!.tenant_id,
          chatData.message,
          {
            limit: chatData.maxSources,
            minScore: 0.7,
            filter: documentScope.length > 0 ? { document_id: documentScope } : {},
          }
        )

        if (searchResults.length > 0) {
          relevantContext = searchResults
            .map(
              (r, idx) =>
                `[Source ${idx + 1}]\n${r.content}\n[Relevance: ${r.score.toFixed(2)}]`
            )
            .join('\n\n')

          sources = searchResults.map(r => ({
            documentId: r.id,
            content: r.content.substring(0, 200) + '...',
            score: r.score,
            metadata: r.metadata,
          }))
        }
      }

      // Build messages for OpenAI
      const messages: any[] = [
        {
          role: 'system',
          content: session.system_prompt || getDefaultSystemPrompt(),
        },
      ]

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        })
      })

      // Add current message with context
      let userMessage = chatData.message
      if (relevantContext) {
        userMessage = `Context from documents:\n${relevantContext}\n\nUser question: ${chatData.message}`
      }

      messages.push({
        role: 'user',
        content: userMessage,
      })

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      })

      const aiResponse = completion.choices[0].message.content || 'Unable to generate response'

      // Save assistant message
      await pool.query(
        `INSERT INTO chat_messages (
          session_id, role, content, sources, model_used, tokens_used, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          chatData.sessionId,
          'assistant',
          aiResponse,
          JSON.stringify(sources),
          completion.model,
          completion.usage?.total_tokens,
        ]
      )

      // Update session
      await pool.query(
        'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
        [chatData.sessionId]
      )

      const responseTime = Date.now() - startTime

      res.json({
        message: aiResponse,
        sources,
        usage: {
          tokensUsed: completion.usage?.total_tokens,
          responseTimeMs: responseTime,
        },
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Chat error:', error)
      res.status(500).json({ error: 'Chat failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// STREAMING CHAT (Server-Sent Events)
// ============================================================================

/**
 * @openapi
 * /api/ai-chat/chat/stream:
 *   post:
 *     summary: Stream AI chat response (SSE)
 *     description: Real-time streaming chat response for better UX
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/chat/stream',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'chat_stream' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const chatData = ChatMessageSchema.parse(req.body)

      if (!openai) {
        return res.status(503).json({
          error: 'AI chat not available',
        })
      }

      // Set up SSE headers
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      // Get session and prepare context (similar to regular chat)
      const sessionResult = await pool.query(
        `SELECT      id,
      tenant_id,
      user_id,
      title,
      description,
      document_scope,
      system_prompt,
      model_name,
      temperature,
      max_tokens,
      message_count,
      total_tokens_used,
      total_cost_usd,
      created_at,
      updated_at,
      last_message_at,
      is_active,
      deleted_at FROM chat_sessions WHERE id = $1 AND tenant_id = $2',
        [chatData.sessionId, req.user!.tenant_id]
      )

      if (sessionResult.rows.length === 0) {
        res.write('data: ${JSON.stringify({ error: 'Session not found' })}\n\n`)
        res.end()
        return
      }

      const session = sessionResult.rows[0]

      // Search documents
      const searchResults = await vectorSearchService.search(
        req.user!.tenant_id,
        chatData.message,
        {
          limit: chatData.maxSources || 5,
          minScore: 0.7,
        }
      )

      const relevantContext = searchResults
        .map((r, idx) => `[Source ${idx + 1}]\n${r.content}`)
        .join('\n\n')

      // Build messages
      const messages: any[] = [
        {
          role: 'system',
          content: session.system_prompt || getDefaultSystemPrompt(),
        },
        {
          role: 'user',
          content: relevantContext
            ? `Context:\n${relevantContext}\n\nQuestion: ${chatData.message}`
            : chatData.message,
        },
      ]

      // Stream response
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        stream: true,
        temperature: 0.7,
      })

      let fullResponse = ''

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          res.write(`data: ${JSON.stringify({ content })}\n\n`)
        }
      }

      // Send sources
      res.write(
        `data: ${JSON.stringify({
          sources: searchResults.map(r => ({
            documentId: r.id,
            score: r.score,
          })),
        })}\n\n`
      )

      // Send done signal
      res.write('data: [DONE]\n\n')

      // Save messages
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, content, created_at)
         VALUES ($1, $2, $3, NOW()), ($1, $4, $5, NOW())`,
        [chatData.sessionId, 'user', chatData.message, 'assistant', fullResponse]
      )

      res.end()
    } catch (error: any) {
      console.error('Streaming chat error:', error)
      res.write(`data: ${JSON.stringify({ error: getErrorMessage(error) })}\n\n`)
      res.end()
    }
  }
)

// ============================================================================
// SUGGESTED QUESTIONS
// ============================================================================

/**
 * @openapi
 * /api/ai-chat/suggestions:
 *   get:
 *     summary: Get suggested questions
 *     tags:
 *       - AI Chat
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/suggestions',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const suggestions = [
        'What are the most common maintenance issues in our fleet?',
        'Show me vehicles due for inspection this month',
        'What are the total fuel costs for last quarter?',
        'Which drivers have the best safety records?',
        'What vehicles have the highest maintenance costs?',
        'Are there any upcoming compliance deadlines?',
        'What is the average age of our fleet?',
        'Which vehicles are due for replacement?',
      ]

      res.json({ suggestions })
    } catch (error: any) {
      console.error('Suggestions error:', error)
      res.status(500).json({ error: 'Failed to get suggestions' })
    }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultSystemPrompt(): string {
  return `You are a helpful AI assistant for fleet management. You help users find information about their fleet operations, vehicles, drivers, maintenance, and compliance.

Guidelines:
- Be concise and professional
- Always cite sources when using document context
- If you don't know something, say so clearly
- Focus on actionable insights
- Use bullet points for lists
- Include relevant metrics and numbers when available

You have access to the fleet's document repository and can search through maintenance records, compliance documents, driver information, and operational data.`
}

// ============================================================================
// DATABASE SCHEMA (run these migrations separately)
// ============================================================================

/*
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    document_scope JSONB DEFAULT '[]',
    system_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    sources JSONB,
    model_used VARCHAR(100),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_sessions_tenant ON chat_sessions(tenant_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
*/

export default router
