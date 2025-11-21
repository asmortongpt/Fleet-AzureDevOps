/**
 * Document Search API Routes Example
 *
 * This file demonstrates how to integrate the DocumentSearchService
 * into Express.js API routes.
 *
 * Integration Instructions:
 * 1. Import this router in your main server.ts or app.ts
 * 2. Mount it: app.use('/api/documents/search', documentSearchRouter)
 * 3. Add authentication middleware as needed
 */

import { Router, Request, Response } from 'express'
import documentSearchService from '../services/document-search.service'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

/**
 * POST /api/documents/search
 *
 * Full-text search documents
 *
 * Body:
 * {
 *   "query": "invoice repair",
 *   "filters": {
 *     "tenantId": "tenant-123",
 *     "vehicleId": "vehicle-456",  // optional
 *     "startDate": "2024-01-01",   // optional
 *     "endDate": "2024-12-31",     // optional
 *     "limit": 20,                  // optional
 *     "offset": 0                   // optional
 *   }
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { query, filters } = req.body

    // Validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter is required and must be a non-empty string'
      })
    }

    if (!filters?.tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required in filters'
      })
    }

    // Execute search
    const results = await documentSearchService.searchDocuments(query, filters)

    return res.json({
      success: true,
      ...results
    })
  } catch (error) {
    console.error('Document search error:', error)
    return res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

/**
 * GET /api/documents/search/vehicle/:vehicleId
 *
 * Search documents for a specific vehicle
 *
 * Query params:
 * - tenantId (required)
 * - query (optional): search query
 */
router.get('/vehicle/:vehicleId', async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const { tenantId, query } = req.query

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required as query parameter'
      })
    }

    const documents = await documentSearchService.searchByVehicle(
      vehicleId,
      query as string,
      tenantId as string
    )

    return res.json({
      success: true,
      documents,
      total: documents.length,
      vehicleId
    })
  } catch (error) {
    console.error('Vehicle document search error:', error)
    return res.status(500).json({
      error: 'Vehicle search failed',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

/**
 * GET /api/documents/search/suggestions
 *
 * Get autocomplete suggestions
 *
 * Query params:
 * - tenantId (required)
 * - q (required): partial query
 * - limit (optional): max suggestions (default: 5)
 */
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { tenantId, q, limit } = req.query

    if (!tenantId || !q) {
      return res.status(400).json({
        error: 'tenantId and q (query) parameters are required'
      })
    }

    const suggestions = await documentSearchService.getSuggestions(
      q as string,
      tenantId as string,
      limit ? parseInt(limit as string) : 5
    )

    return res.json({
      success: true,
      suggestions,
      query: q
    })
  } catch (error) {
    console.error('Suggestions error:', error)
    return res.status(500).json({
      error: 'Failed to get suggestions',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

/**
 * GET /api/documents/search/stats
 *
 * Get search statistics for a tenant
 *
 * Query params:
 * - tenantId (required)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.query

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant ID is required as query parameter'
      })
    }

    const stats = await documentSearchService.getSearchStatistics(tenantId as string)

    return res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Search stats error:', error)
    return res.status(500).json({
      error: 'Failed to get search statistics',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

/**
 * POST /api/documents/search/index/:documentId
 *
 * Manually trigger indexing for a document
 *
 * Body:
 * {
 *   "tenantId": "tenant-123"  // for verification
 * }
 */
router.post('/index/:documentId', async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params

    await documentSearchService.indexDocument(documentId)

    return res.json({
      success: true,
      message: 'Document indexed successfully',
      documentId
    })
  } catch (error) {
    console.error('Document indexing error:', error)
    return res.status(500).json({
      error: 'Failed to index document',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

/**
 * POST /api/documents/search/index/batch
 *
 * Batch index multiple documents
 *
 * Body:
 * {
 *   "documentIds": ["doc-1", "doc-2", "doc-3"],
 *   "tenantId": "tenant-123"
 * }
 */
router.post('/index/batch', async (req: Request, res: Response) => {
  try {
    const { documentIds } = req.body

    if (!Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({
        error: 'documentIds must be a non-empty array'
      })
    }

    await documentSearchService.batchIndexDocuments(documentIds)

    return res.json({
      success: true,
      message: `Successfully indexed ${documentIds.length} documents`,
      count: documentIds.length
    })
  } catch (error) {
    console.error('Batch indexing error:', error)
    return res.status(500).json({
      error: 'Failed to batch index documents',
      message: error instanceof Error ? getErrorMessage(error) : 'Unknown error'
    })
  }
})

export default router

/**
 * Usage in main server file:
 *
 * import documentSearchRouter from './routes/document-search.example'
 *
 * // With authentication middleware
 * app.use('/api/documents/search', authenticateToken, documentSearchRouter)
 *
 * // Or without auth for testing
 * app.use('/api/documents/search', documentSearchRouter)
 */
