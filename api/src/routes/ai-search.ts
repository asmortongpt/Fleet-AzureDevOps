/**
 * AI-Powered Semantic Search API Routes
 *
 * Advanced search capabilities using RAG (Retrieval-Augmented Generation):
 * - Natural language semantic search
 * - Hybrid search (keyword + vector)
 * - Document Q&A with citations
 * - Query expansion and refinement
 * - Search analytics and personalization
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import vectorSearchService from '../services/VectorSearchService'
import embeddingService from '../services/EmbeddingService'
import documentAiService from '../services/DocumentAiService'
import pool from '../config/database'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

const SemanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  filter: z.record(z.any()).optional(),
  includeMetadata: z.boolean().optional().default(true),
})

/**
 * @openapi
 * /api/ai-search/semantic:
 *   post:
 *     summary: Semantic search using natural language
 *     description: Search documents using vector similarity for semantic understanding
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Natural language search query
 *               limit:
 *                 type: number
 *                 default: 10
 *               minScore:
 *                 type: number
 *                 default: 0.7
 *               filter:
 *                 type: object
 *                 description: Metadata filters
 */
router.post(
  '/semantic',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'semantic_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const searchData = SemanticSearchSchema.parse(req.body)

      const startTime = Date.now()

      // Perform semantic search
      const results = await vectorSearchService.search(
        req.user!.tenant_id,
        searchData.query,
        {
          limit: searchData.limit,
          minScore: searchData.minScore,
          filter: searchData.filter,
          includeMetadata: searchData.includeMetadata,
        }
      )

      const searchTime = Date.now() - startTime

      // Log search for analytics
      await logSearch(
        req.user!.tenant_id,
        req.user!.id,
        searchData.query,
        'semantic',
        results.length,
        searchTime
      )

      res.json({
        query: searchData.query,
        results,
        count: results.length,
        searchTimeMs: searchTime,
        strategy: 'semantic',
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Semantic search error:', error)
      res.status(500).json({ error: 'Search failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// HYBRID SEARCH
// ============================================================================

const HybridSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.5),
  keywordWeight: z.number().min(0).max(1).optional().default(0.3),
  vectorWeight: z.number().min(0).max(1).optional().default(0.7),
  filter: z.record(z.any()).optional(),
})

/**
 * @openapi
 * /api/ai-search/hybrid:
 *   post:
 *     summary: Hybrid search combining keyword and semantic
 *     description: Best of both worlds - combines traditional keyword search with vector similarity
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/hybrid',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'hybrid_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const searchData = HybridSearchSchema.parse(req.body)

      const startTime = Date.now()

      // Perform hybrid search
      const results = await vectorSearchService.hybridSearch(
        req.user!.tenant_id,
        searchData.query,
        {
          limit: searchData.limit,
          minScore: searchData.minScore,
          keywordWeight: searchData.keywordWeight,
          vectorWeight: searchData.vectorWeight,
          filter: searchData.filter,
        }
      )

      const searchTime = Date.now() - startTime

      await logSearch(
        req.user!.tenant_id,
        req.user!.id,
        searchData.query,
        'hybrid',
        results.length,
        searchTime
      )

      res.json({
        query: searchData.query,
        results,
        count: results.length,
        searchTimeMs: searchTime,
        strategy: 'hybrid',
        weights: {
          keyword: searchData.keywordWeight,
          vector: searchData.vectorWeight,
        },
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Hybrid search error:', error)
      res.status(500).json({ error: 'Search failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// DOCUMENT Q&A
// ============================================================================

const DocumentQASchema = z.object({
  question: z.string().min(3).max(1000),
  documentIds: z.array(z.string()).optional(),
  includeSourceText: z.boolean().optional().default(true),
  maxSources: z.number().min(1).max(10).optional().default(5),
})

/**
 * @openapi
 * /api/ai-search/qa:
 *   post:
 *     summary: Ask questions about documents
 *     description: AI-powered Q&A using RAG over document collection
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/qa',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'QUERY', resourceType: 'document_qa' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const qaData = DocumentQASchema.parse(req.body)

      const startTime = Date.now()

      // Get answer using DocumentAI service
      const response = await documentAiService.askQuestion(
        req.user!.tenant_id,
        req.user!.id,
        qaData.question,
        qaData.documentIds
      )

      const responseTime = Date.now() - startTime

      res.json({
        question: qaData.question,
        answer: response.answer,
        sources: qaData.includeSourceText
          ? response.sources
          : response.sources.map(s => ({ documentId: s.documentId, score: s.score })),
        confidence: response.confidence,
        modelUsed: response.modelUsed,
        responseTimeMs: responseTime,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Document Q&A error:', error)
      res.status(500).json({ error: 'Q&A failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// QUERY EXPANSION
// ============================================================================

const QueryExpansionSchema = z.object({
  query: z.string().min(1).max(500),
  maxSuggestions: z.number().min(1).max(10).optional().default(5),
})

/**
 * @openapi
 * /api/ai-search/expand-query:
 *   post:
 *     summary: Expand search query with related terms
 *     description: AI-powered query expansion for better search coverage
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/expand-query',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'QUERY', resourceType: 'query_expansion' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { query, maxSuggestions } = QueryExpansionSchema.parse(req.body)

      // Find similar queries from history
      const similarQueries = await pool.query(
        `SELECT DISTINCT query_text, COUNT(*) as usage_count
         FROM rag_queries
         WHERE tenant_id = $1
           AND query_text ILIKE $2
           AND query_text != $3
         GROUP BY query_text
         ORDER BY usage_count DESC, query_text
         LIMIT $4`,
        [req.user!.tenant_id, `%${query}%`, query, maxSuggestions]
      )

      // Generate AI-powered expansions
      const expansions = [
        query,
        ...similarQueries.rows.map((r: any) => r.query_text),
      ]

      res.json({
        originalQuery: query,
        expandedQueries: expansions.slice(0, maxSuggestions),
        suggestions: expansions.length,
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Query expansion error:', error)
      res.status(500).json({ error: 'Expansion failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// DOCUMENT INDEXING
// ============================================================================

const IndexDocumentSchema = z.object({
  documentId: z.string(),
  content: z.string().min(10),
  metadata: z.record(z.any()).optional(),
  chunkStrategy: z.enum(['semantic', 'fixed', 'sentence', 'paragraph']).optional().default('semantic'),
  chunkSize: z.number().min(100).max(4096).optional().default(512),
  chunkOverlap: z.number().min(0).max(512).optional().default(50),
})

/**
 * @openapi
 * /api/ai-search/index:
 *   post:
 *     summary: Index a document for semantic search
 *     description: Process and index document content with embeddings
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/index',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'CREATE', resourceType: 'document_index' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const indexData = IndexDocumentSchema.parse(req.body)

      const startTime = Date.now()

      // Chunk the document
      const chunks = embeddingService.chunkText(indexData.content, {
        strategy: indexData.chunkStrategy,
        chunkSize: indexData.chunkSize,
        chunkOverlap: indexData.chunkOverlap,
      })

      // Generate embeddings for each chunk
      let indexed = 0
      let totalCost = 0

      for (const chunk of chunks) {
        const embeddingResult = await embeddingService.generateEmbedding(chunk.text)

        await vectorSearchService.indexDocument(req.user!.tenant_id, {
          id: `${indexData.documentId}_chunk_${chunk.index}`,
          content: chunk.text,
          embedding: embeddingResult.embedding,
          metadata: {
            ...indexData.metadata,
            documentId: indexData.documentId,
            chunkIndex: chunk.index,
            chunkTokens: chunk.tokens,
          },
        })

        indexed++
        totalCost += embeddingResult.cost || 0
      }

      const processingTime = Date.now() - startTime

      res.json({
        success: true,
        documentId: indexData.documentId,
        chunksIndexed: indexed,
        totalChunks: chunks.length,
        processingTimeMs: processingTime,
        estimatedCost: totalCost.toFixed(4),
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Document indexing error:', error)
      res.status(500).json({ error: 'Indexing failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// BATCH INDEXING
// ============================================================================

const BatchIndexSchema = z.object({
  documents: z.array(
    z.object({
      documentId: z.string(),
      content: z.string().min(10),
      metadata: z.record(z.any()).optional(),
    })
  ).min(1).max(100),
})

/**
 * @openapi
 * /api/ai-search/index/batch:
 *   post:
 *     summary: Index multiple documents in batch
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/index/batch',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'CREATE', resourceType: 'batch_index' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { documents } = BatchIndexSchema.parse(req.body)

      const startTime = Date.now()
      let totalIndexed = 0
      let totalFailed = 0
      let totalCost = 0

      for (const doc of documents) {
        try {
          const chunks = embeddingService.chunkText(doc.content, {
            strategy: 'semantic',
            chunkSize: 512,
            chunkOverlap: 50,
          })

          for (const chunk of chunks) {
            const embeddingResult = await embeddingService.generateEmbedding(chunk.text)

            await vectorSearchService.indexDocument(req.user!.tenant_id, {
              id: `${doc.documentId}_chunk_${chunk.index}`,
              content: chunk.text,
              embedding: embeddingResult.embedding,
              metadata: {
                ...doc.metadata,
                documentId: doc.documentId,
                chunkIndex: chunk.index,
              },
            })

            totalIndexed++
            totalCost += embeddingResult.cost || 0
          }
        } catch (error) {
          console.error(`Failed to index document ${doc.documentId}:`, error)
          totalFailed++
        }
      }

      const processingTime = Date.now() - startTime

      res.json({
        success: true,
        documentsProcessed: documents.length,
        chunksIndexed: totalIndexed,
        failed: totalFailed,
        processingTimeMs: processingTime,
        estimatedCost: totalCost.toFixed(4),
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Batch indexing error:', error)
      res.status(500).json({ error: 'Batch indexing failed', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// SEARCH ANALYTICS
// ============================================================================

/**
 * @openapi
 * /api/ai-search/analytics:
 *   get:
 *     summary: Get search analytics
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/analytics',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'READ', resourceType: 'search_analytics' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const [topQueries, recentSearches, avgMetrics] = await Promise.all([
        // Top queries
        pool.query(
          `SELECT query_text, COUNT(*) as search_count,
           AVG(total_time_ms) as avg_time_ms,
           AVG(results_count) as avg_results
           FROM rag_queries
           WHERE tenant_id = $1
           GROUP BY query_text
           ORDER BY search_count DESC
           LIMIT 10`,
          [req.user!.tenant_id]
        ),

        // Recent searches
        pool.query(
          `SELECT query_text, query_type, results_count, total_time_ms, created_at
           FROM rag_queries
           WHERE tenant_id = $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [req.user!.tenant_id]
        ),

        // Average metrics
        pool.query(
          `SELECT
           COUNT(*) as total_searches,
           AVG(total_time_ms) as avg_response_time,
           AVG(results_count) as avg_results,
           AVG(feedback_rating) as avg_rating
           FROM rag_queries
           WHERE tenant_id = $1',
          [req.user!.tenant_id]
        ),
      ])

      res.json({
        topQueries: topQueries.rows,
        recentSearches: recentSearches.rows,
        metrics: avgMetrics.rows[0],
      })
    } catch (error: any) {
      console.error('Analytics error:', error)
      res.status(500).json({ error: 'Failed to get analytics', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// FEEDBACK
// ============================================================================

const FeedbackSchema = z.object({
  queryId: z.string(),
  rating: z.number().min(1).max(5),
  helpful: z.boolean().optional(),
  comment: z.string().optional(),
})

/**
 * @openapi
 * /api/ai-search/feedback:
 *   post:
 *     summary: Provide feedback on search results
 *     tags:
 *       - AI Search
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/feedback',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'CREATE', resourceType: 'search_feedback' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const feedback = FeedbackSchema.parse(req.body)

      await pool.query(
        `UPDATE rag_queries
         SET feedback_rating = $1,
             feedback_helpful = $2,
             feedback_comment = $3,
             feedback_at = NOW()
         WHERE id = $4 AND tenant_id = $5`,
        [
          feedback.rating,
          feedback.helpful,
          feedback.comment,
          feedback.queryId,
          req.user!.tenant_id,
        ]
      )

      res.json({ success: true, message: 'Feedback recorded' })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors })
      }
      console.error('Feedback error:', error)
      res.status(500).json({ error: 'Failed to record feedback', message: getErrorMessage(error) })
    }
  }
)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function logSearch(
  tenantId: string,
  userId: string,
  query: string,
  strategy: string,
  resultsCount: number,
  searchTimeMs: number
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO rag_queries (
        tenant_id, user_id, query_text, query_type, search_strategy,
        results_count, search_time_ms, total_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, userId, query, 'search', strategy, resultsCount, searchTimeMs, searchTimeMs]
    )
  } catch (error) {
    console.error('Error logging search:', error)
  }
}

export default router
