To refactor the `ai-search.ts` file to use the repository pattern, we'll need to create and import the necessary repositories and replace all direct database queries with repository methods. Here's the refactored version of the file:


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

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import vectorSearchService from '../services/VectorSearchService';
import embeddingService from '../services/EmbeddingService';
import documentAiService from '../services/DocumentAiService';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';

// Import repositories
import { SearchRepository } from '../repositories/SearchRepository';
import { AnalyticsRepository } from '../repositories/AnalyticsRepository';

const searchRepository = new SearchRepository();
const analyticsRepository = new AnalyticsRepository();

const router = express.Router();
router.use(authenticateJWT);

// ============================================================================
// SEMANTIC SEARCH
// ============================================================================

const SemanticSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  filter: z.record(z.any()).optional(),
  includeMetadata: z.boolean().optional().default(true),
});

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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'semantic_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const searchData = SemanticSearchSchema.parse(req.body);

      const startTime = Date.now();

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
      );

      const searchTime = Date.now() - startTime;

      // Log search for analytics
      await analyticsRepository.logSearch(
        req.user!.tenant_id,
        req.user!.id,
        searchData.query,
        'semantic',
        results.length,
        searchTime
      );

      res.json({
        query: searchData.query,
        results,
        count: results.length,
        searchTimeMs: searchTime,
        strategy: 'semantic',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Semantic search error:', error);
      res.status(500).json({ error: 'Search failed', message: getErrorMessage(error) });
    }
  }
);

// ============================================================================
// HYBRID SEARCH
// ============================================================================

const HybridSearchSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  filter: z.record(z.any()).optional(),
  includeMetadata: z.boolean().optional().default(true),
  keywordWeight: z.number().min(0).max(1).optional().default(0.5),
});

/**
 * @openapi
 * /api/ai-search/hybrid:
 *   post:
 *     summary: Hybrid search using both keyword and semantic search
 *     description: Combine keyword and vector search for improved results
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
 *                 description: Search query
 *               limit:
 *                 type: number
 *                 default: 10
 *               minScore:
 *                 type: number
 *                 default: 0.7
 *               filter:
 *                 type: object
 *                 description: Metadata filters
 *               keywordWeight:
 *                 type: number
 *                 default: 0.5
 *                 description: Weight of keyword search in the hybrid approach
 */
router.post(
  '/hybrid',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'hybrid_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const searchData = HybridSearchSchema.parse(req.body);

      const startTime = Date.now();

      // Perform hybrid search
      const results = await vectorSearchService.hybridSearch(
        req.user!.tenant_id,
        searchData.query,
        {
          limit: searchData.limit,
          minScore: searchData.minScore,
          filter: searchData.filter,
          includeMetadata: searchData.includeMetadata,
          keywordWeight: searchData.keywordWeight,
        }
      );

      const searchTime = Date.now() - startTime;

      // Log search for analytics
      await analyticsRepository.logSearch(
        req.user!.tenant_id,
        req.user!.id,
        searchData.query,
        'hybrid',
        results.length,
        searchTime
      );

      res.json({
        query: searchData.query,
        results,
        count: results.length,
        searchTimeMs: searchTime,
        strategy: 'hybrid',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Hybrid search error:', error);
      res.status(500).json({ error: 'Search failed', message: getErrorMessage(error) });
    }
  }
);

// ============================================================================
// DOCUMENT Q&A
// ============================================================================

const DocumentQASchema = z.object({
  documentId: z.string().uuid(),
  question: z.string().min(1).max(1000),
});

/**
 * @openapi
 * /api/ai-search/document-qa:
 *   post:
 *     summary: Ask a question about a specific document
 *     description: Use AI to answer questions about a document with citations
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
 *               documentId:
 *                 type: string
 *                 format: uuid
 *                 description: UUID of the document
 *               question:
 *                 type: string
 *                 description: Question about the document
 */
router.post(
  '/document-qa',
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'document_qa' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { documentId, question } = DocumentQASchema.parse(req.body);

      const startTime = Date.now();

      // Check if the document exists
      const document = await searchRepository.getDocumentById(req.user!.tenant_id, documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Perform document Q&A
      const answer = await documentAiService.answerQuestion(documentId, question);

      const searchTime = Date.now() - startTime;

      // Log search for analytics
      await analyticsRepository.logSearch(
        req.user!.tenant_id,
        req.user!.id,
        question,
        'document_qa',
        1,
        searchTime
      );

      res.json({
        question,
        answer,
        documentId,
        searchTimeMs: searchTime,
        strategy: 'document_qa',
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      console.error('Document Q&A error:', error);
      res.status(500).json({ error: 'Q&A failed', message: getErrorMessage(error) });
    }
  }
);

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file:
   
   import { SearchRepository } from '../repositories/SearchRepository';
   import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
   

2. We've created instances of these repositories:
   
   const searchRepository = new SearchRepository();
   const analyticsRepository = new AnalyticsRepository();
   

3. We've replaced all direct database queries with repository methods:

   - In the semantic search route, we've replaced `logSearch` function with:
     
     await analyticsRepository.logSearch(
       req.user!.tenant_id,
       req.user!.id,
       searchData.query,
       'semantic',
       results.length,
       searchTime
     );
     

   - In the document Q&A route, we've replaced the document existence check with:
     
     const document = await searchRepository.getDocumentById(req.user!.tenant_id, documentId);
     

   - We've also replaced the `logSearch` function in the document Q&A route with:
     
     await analyticsRepository.logSearch(
       req.user!.tenant_id,
       req.user!.id,
       question,
       'document_qa',
       1,
       searchTime
     );
     

4. We've kept all the route handlers as they were, only modifying the parts where database interactions were happening.

5. We've assumed that the `SearchRepository` and `AnalyticsRepository` classes have been implemented with the necessary methods (`getDocumentById` and `logSearch` respectively).

Note that you'll need to create the `SearchRepository` and `AnalyticsRepository` classes in their respective files, implementing the methods used in this refactored code. The implementation of these repository classes would depend on your specific database setup and ORM (if used).