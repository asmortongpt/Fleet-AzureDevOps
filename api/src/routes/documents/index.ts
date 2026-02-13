// Document Management REST API
// Complete API for document upload, search, management, and analytics

import { Router } from 'express'
import multer from 'multer'

import { getDocumentService } from '../../services/documents/document-service'
import { logger } from '../../utils/logger'
import { getIndexingService } from '../../services/documents/indexing-service'
import {
  DocumentSearchQuery,
  BulkOperationRequest
} from '../../services/documents/types'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

const documentService = getDocumentService()
const indexingService = getIndexingService()

// ==================== DOCUMENT CRUD ====================

/**
 * POST /api/documents/upload
 * Upload a new document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided'
      })
    }

    const { title, description, category, subcategory, tags, accessLevel } = req.body

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title and category are required'
      })
    }

    const userId = (req as any).user?.id || req.headers['x-user-id'] as string || 'anonymous'
    const userName = (req as any).user?.name || req.headers['x-user-name'] as string || 'Anonymous User'

    const document = await documentService.uploadDocument(
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      },
      {
        title,
        description,
        category,
        subcategory,
        tags: tags ? JSON.parse(tags) : [],
        ownerId: userId,
        ownerName: userName,
        accessLevel
      }
    )

    return res.status(201).json({
      success: true,
      data: { document }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Upload error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * GET /api/documents/:id
 * Get a document by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const document = await documentService.getDocument(id)

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    return res.json({
      success: true,
      data: { document }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Get document error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * PUT /api/documents/:id
 * Update a document
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const userId = (req as any).user?.id || req.headers['x-user-id'] as string || 'anonymous'

    const document = await documentService.updateDocument(id, updates, userId)

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    return res.json({
      success: true,
      data: { document }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Update error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const success = await documentService.deleteDocument(id)

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    logger.error('[DocumentAPI] Delete error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * GET /api/documents/:id/download
 * Download a document
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params

    const document = await documentService.getDocument(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    const buffer = await documentService.downloadDocument(id)
    if (!buffer) {
      return res.status(500).json({
        success: false,
        error: 'Failed to download document'
      })
    }

    res.setHeader('Content-Type', document.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`)
    res.setHeader('Content-Length', buffer.length)

    return res.send(buffer)

  } catch (error) {
    logger.error('[DocumentAPI] Download error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * GET /api/documents/:id/versions
 * Get document version history
 */
router.get('/:id/versions', async (req, res) => {
  try {
    const { id } = req.params

    const versions = await documentService.getVersionHistory(id)

    return res.json({
      success: true,
      data: { versions }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Version history error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

// ==================== SEARCH ====================

/**
 * POST /api/documents/search
 * Search documents with filters, sorting, and pagination
 */
router.post('/search', async (req, res) => {
  try {
    const query: DocumentSearchQuery = req.body

    const result = await documentService.searchDocuments(query)

    return res.json({
      success: true,
      data: result
    })

  } catch (error) {
    logger.error('[DocumentAPI] Search error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

// ==================== INDEXING ====================

/**
 * POST /api/documents/:id/reindex
 * Re-index a specific document
 */
router.post('/:id/reindex', async (req, res) => {
  try {
    const { id } = req.params

    const document = await documentService.getDocument(id)
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      })
    }

    const index = await indexingService.indexDocument(document)

    return res.json({
      success: true,
      data: { index },
      message: 'Document re-indexed successfully'
    })

  } catch (error) {
    logger.error('[DocumentAPI] Re-index error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

/**
 * GET /api/documents/indexing/jobs/:jobId
 * Get indexing job status
 */
router.get('/indexing/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params

    const job = indexingService.getJobStatus(jobId)

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      })
    }

    return res.json({
      success: true,
      data: { job }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Job status error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

// ==================== ANALYTICS ====================

/**
 * GET /api/documents/analytics
 * Get document analytics and statistics
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await documentService.getAnalytics()

    return res.json({
      success: true,
      data: { analytics }
    })

  } catch (error) {
    logger.error('[DocumentAPI] Analytics error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

// ==================== BULK OPERATIONS ====================

/**
 * POST /api/documents/bulk
 * Perform bulk operations on multiple documents
 */
router.post('/bulk', async (req, res) => {
  try {
    const request: BulkOperationRequest = req.body

    if (!request.operation || !request.documentIds || request.documentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Operation and documentIds are required'
      })
    }

    const result = await documentService.bulkOperation(request)

    return res.json({
      success: result.success,
      data: result
    })

  } catch (error) {
    logger.error('[DocumentAPI] Bulk operation error:', error)
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    })
  }
})

// ==================== HEALTH CHECK ====================

/**
 * GET /api/documents/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  return res.json({
    success: true,
    service: 'Document Management',
    status: 'operational',
    features: {
      ocr: 'enabled',
      smartIndexing: 'enabled',
      aiAnalysis: 'enabled',
      fullTextSearch: 'enabled',
      versioning: 'enabled'
    }
  })
})

export default router
