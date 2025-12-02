/**
 * Search API Routes
 *
 * Comprehensive search endpoints for document discovery:
 * - Full-text search
 * - Semantic search
 * - Hybrid search
 * - Autocomplete
 * - Spelling suggestions
 * - Faceted search
 * - Saved searches
 * - Search history
 * - Search analytics
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import DocumentSearchService from '../services/DocumentSearchService'
import SearchIndexService from '../services/SearchIndexService'
import DocumentIndexer from '../services/DocumentIndexer'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// Search Endpoints
// ============================================================================

/**
 * POST /search
 * Unified search endpoint supporting multiple search modes
 */
router.post(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'SEARCH', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        query: z.string().min(1),
        mode: z.enum(['full-text', 'semantic', 'hybrid']).optional(),
        fuzzy: z.boolean().optional(),
        phrase: z.boolean().optional(),
        operator: z.enum(['AND', 'OR']).optional(),
        categoryId: z.string().optional(),
        documentType: z.string().optional(),
        tags: z.array(z.string()).optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        uploadedBy: z.string().optional(),
        usePersonalization: z.boolean().optional(),
        page: z.number().int().min(1).optional(),
        limit: z.number().int().min(1).max(100).optional(),
        sortBy: z.enum(['relevance', 'date', 'popularity']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        boost: z.record(z.number()).optional(),
        minScore: z.number().optional()
      })

      const validated = schema.parse(req.body)

      const results = await DocumentSearchService.search({
        query: validated.query,
        tenantId: req.user!.tenant_id,
        userId: req.user!.id,
        mode: validated.mode,
        fuzzy: validated.fuzzy,
        phrase: validated.phrase,
        operator: validated.operator,
        categoryId: validated.categoryId,
        documentType: validated.documentType,
        tags: validated.tags,
        dateFrom: validated.dateFrom ? new Date(validated.dateFrom) : undefined,
        dateTo: validated.dateTo ? new Date(validated.dateTo) : undefined,
        uploadedBy: validated.uploadedBy,
        usePersonalization: validated.usePersonalization,
        page: validated.page,
        limit: validated.limit,
        sortBy: validated.sortBy,
        sortOrder: validated.sortOrder,
        boost: validated.boost,
        minScore: validated.minScore
      })

      res.json({
        success: true,
        data: results.results,
        stats: results.stats,
        facets: results.facets,
        suggestions: results.suggestions,
        clusters: results.clusters,
        pagination: {
          page: validated.page || 1,
          limit: validated.limit || 20,
          total: results.stats.total_results,
          pages: Math.ceil(results.stats.total_results / (validated.limit || 20))
        }
      })
    } catch (error) {
      console.error('Search error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }
      res.status(500).json({
        success: false,
        error: 'Search failed'
      })
    }
  }
)

/**
 * GET /search/autocomplete
 * Get autocomplete suggestions
 */
router.get(
  '/autocomplete',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { q, limit = 10 } = req.query

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required'
        })
      }

      const suggestions = await DocumentSearchService.autocomplete(
        req.user!.tenant_id,
        q,
        Number(limit)
      )

      res.json({
        success: true,
        data: suggestions
      })
    } catch (error) {
      console.error('Autocomplete error:', error)
      res.status(500).json({
        success: false,
        error: 'Autocomplete failed'
      })
    }
  }
)

/**
 * GET /search/suggestions
 * Get spelling suggestions (Did you mean?)
 */
router.get(
  '/suggestions',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { q } = req.query

      if (!q || typeof q !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Query parameter "q" is required'
        })
      }

      const suggestions = await SearchIndexService.getSpellingSuggestions(
        req.user!.tenant_id,
        q
      )

      res.json({
        success: true,
        data: suggestions
      })
    } catch (error) {
      console.error('Suggestions error:', error)
      res.status(500).json({
        success: false,
        error: 'Suggestions failed'
      })
    }
  }
)

/**
 * POST /search/click
 * Record a document click from search results
 */
router.post(
  '/click',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        query: z.string(),
        documentId: z.string()
      })

      const { query, documentId } = schema.parse(req.body)

      await DocumentSearchService.recordDocumentClick(
        req.user!.id,
        query,
        documentId
      )

      res.json({
        success: true,
        message: 'Click recorded'
      })
    } catch (error) {
      console.error('Click recording error:', error)
      res.status(500).json({
        success: false,
        error: 'Click recording failed'
      })
    }
  }
)

// ============================================================================
// Saved Searches
// ============================================================================

/**
 * GET /search/saved
 * Get user's saved searches
 */
router.get(
  '/saved',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const savedSearches = await DocumentSearchService.getSavedSearches(
        req.user!.id
      )

      res.json({
        success: true,
        data: savedSearches
      })
    } catch (error) {
      console.error('Get saved searches error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get saved searches'
      })
    }
  }
)

/**
 * POST /search/saved
 * Save a search query
 */
router.post(
  '/saved',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        name: z.string().min(1).max(100),
        query: z.string().min(1),
        filters: z.record(z.any()).optional(),
        notificationEnabled: z.boolean().optional()
      })

      const validated = schema.parse(req.body)

      const savedSearch = await DocumentSearchService.saveSearch(
        req.user!.tenant_id,
        req.user!.id,
        validated.name,
        validated.query,
        validated.filters || {},
        validated.notificationEnabled || false
      )

      res.status(201).json({
        success: true,
        data: savedSearch
      })
    } catch (error) {
      console.error('Save search error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }
      res.status(500).json({
        success: false,
        error: 'Failed to save search'
      })
    }
  }
)

/**
 * DELETE /search/saved/:id
 * Delete a saved search
 */
router.delete(
  '/saved/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      await DocumentSearchService.deleteSavedSearch(
        req.params.id,
        req.user!.id
      )

      res.json({
        success: true,
        message: 'Saved search deleted'
      })
    } catch (error) {
      console.error('Delete saved search error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to delete saved search'
      })
    }
  }
)

// ============================================================================
// Search History
// ============================================================================

/**
 * GET /search/history
 * Get user's search history
 */
router.get(
  '/history',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { limit = 50 } = req.query

      const history = await DocumentSearchService.getSearchHistory(
        req.user!.id,
        Number(limit)
      )

      res.json({
        success: true,
        data: history
      })
    } catch (error) {
      console.error('Get search history error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get search history'
      })
    }
  }
)

// ============================================================================
// Search Analytics
// ============================================================================

/**
 * GET /search/analytics
 * Get search analytics for the tenant
 */
router.get(
  '/analytics',
  authorize('admin', 'fleet_manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = 30 } = req.query

      const analytics = await DocumentSearchService.getSearchAnalytics(
        req.user!.tenant_id,
        Number(days)
      )

      res.json({
        success: true,
        data: analytics
      })
    } catch (error) {
      console.error('Get search analytics error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get search analytics'
      })
    }
  }
)

// ============================================================================
// Index Management
// ============================================================================

/**
 * POST /search/index/document/:id
 * Index or reindex a specific document
 */
router.post(
  '/index/document/:id',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'INDEX', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { priority = 'normal' } = req.body

      await DocumentIndexer.indexDocument(
        req.params.id,
        req.user!.tenant_id,
        priority
      )

      res.json({
        success: true,
        message: 'Document indexed successfully'
      })
    } catch (error) {
      console.error('Index document error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to index document'
      })
    }
  }
)

/**
 * POST /search/index/reindex
 * Create a background reindexing job
 */
router.post(
  '/index/reindex',
  authorize('admin'),
  auditLog({ action: 'REINDEX', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const schema = z.object({
        categoryId: z.string().optional(),
        documentIds: z.array(z.string()).optional(),
        fullReindex: z.boolean().optional()
      })

      const validated = schema.parse(req.body)

      const job = await DocumentIndexer.createReindexJob(
        req.user!.tenant_id,
        validated
      )

      res.status(202).json({
        success: true,
        message: 'Reindexing job created',
        data: job
      })
    } catch (error) {
      console.error('Reindex error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }
      res.status(500).json({
        success: false,
        error: 'Failed to create reindex job'
      })
    }
  }
)

/**
 * GET /search/index/jobs
 * Get indexing jobs
 */
router.get(
  '/index/jobs',
  authorize('admin', 'fleet_manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, limit = 20 } = req.query

      const jobs = await DocumentIndexer.getIndexingJobs(
        req.user!.tenant_id,
        {
          status: status as string,
          limit: Number(limit)
        }
      )

      res.json({
        success: true,
        data: jobs
      })
    } catch (error) {
      console.error('Get indexing jobs error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get indexing jobs'
      })
    }
  }
)

/**
 * POST /search/index/optimize
 * Optimize search indexes
 */
router.post(
  '/index/optimize',
  authorize('admin'),
  auditLog({ action: 'OPTIMIZE_INDEX', resourceType: 'search_index' }),
  async (req: AuthRequest, res: Response) => {
    try {
      await DocumentIndexer.optimizeIndexes(req.user!.tenant_id)

      res.json({
        success: true,
        message: 'Index optimization started'
      })
    } catch (error) {
      console.error('Optimize index error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to optimize index'
      })
    }
  }
)

/**
 * GET /search/index/stats
 * Get indexing statistics
 */
router.get(
  '/index/stats',
  authorize('admin', 'fleet_manager'),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await DocumentIndexer.getIndexStats(req.user!.tenant_id)

      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      console.error('Get index stats error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get index statistics'
      })
    }
  }
)

/**
 * POST /search/cache/clear
 * Clear search cache
 */
router.post(
  '/cache/clear',
  authorize('admin'),
  auditLog({ action: 'CLEAR_CACHE', resourceType: 'search_cache' }),
  async (req: AuthRequest, res: Response) => {
    try {
      await SearchIndexService.clearCache()

      res.json({
        success: true,
        message: 'Search cache cleared'
      })
    } catch (error) {
      console.error('Clear cache error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      })
    }
  }
)

/**
 * POST /search/cache/warm
 * Warm up search cache with popular queries
 */
router.post(
  '/cache/warm',
  authorize('admin'),
  async (req: AuthRequest, res: Response) => {
    try {
      await SearchIndexService.warmCache(req.user!.tenant_id)

      res.json({
        success: true,
        message: 'Cache warming completed'
      })
    } catch (error) {
      console.error('Warm cache error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to warm cache'
      })
    }
  }
)

export default router
