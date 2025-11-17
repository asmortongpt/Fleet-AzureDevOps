/**
 * Document Management Routes
 * Comprehensive document lifecycle and RAG-powered search
 *
 * Features:
 * - Document upload with file validation
 * - Category management
 * - Semantic search
 * - RAG-powered Q&A
 * - Version control
 * - Access logging
 * - Analytics
 */

import { Router } from 'express'
import multer from 'multer'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import documentManagementService from '../services/document-management.service'
import documentRAGService from '../services/document-rag.service'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  }
})

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/documents/upload:
 *   post:
 *     summary: Upload a new document
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               categoryId:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 */
router.post('/upload',
  requirePermission('document:create:fleet'),
  auditLog({ action: 'UPLOAD', resourceType: 'documents' }),
  upload.single('file'),
  async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { categoryId, tags, description, isPublic, metadata } = req.body

    const document = await documentManagementService.uploadDocument({
      tenantId,
      userId,
      file: req.file,
      categoryId,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : undefined,
      description,
      isPublic: isPublic === 'true' || isPublic === true,
      metadata: metadata ? JSON.parse(metadata) : undefined
    })

    res.status(201).json({
      document,
      message: 'Document uploaded successfully'
    })
  } catch (error: any) {
    console.error('Error uploading document:', error)
    res.status(500).json({
      error: 'Failed to upload document',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Documents]
 *     parameters:
 *       - name: categoryId
 *         in: query
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 */
router.get('/',
  requirePermission('document:view:fleet'),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { categoryId, search, status, uploadedBy, limit, offset } = req.query

    const result = await documentManagementService.getDocuments(tenantId, {
      categoryId: categoryId as string,
      search: search as string,
      status: status as string,
      uploadedBy: uploadedBy as string,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    })

    res.json(result)
  } catch (error) {
    console.error('Error fetching documents:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 */
router.get('/:id',
  requirePermission('document:view:own'),
  auditLog({ action: 'READ', resourceType: 'documents' }),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const document = await documentManagementService.getDocumentById(id, tenantId, userId)

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    res.json({ document })
  } catch (error) {
    console.error('Error fetching document:', error)
    res.status(500).json({ error: 'Failed to fetch document' })
  }
})

/**
 * @openapi
 * /api/documents/{id}:
 *   put:
 *     summary: Update document metadata
 *     tags: [Documents]
 */
router.put('/:id',
  requirePermission('document:update:own'),
  auditLog({ action: 'UPDATE', resourceType: 'documents' }),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const document = await documentManagementService.updateDocument(
      id,
      tenantId,
      userId,
      req.body
    )

    res.json({
      document,
      message: 'Document updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating document:', error)
    res.status(500).json({
      error: 'Failed to update document',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 */
router.delete('/:id',
  requirePermission('document:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'documents' }),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await documentManagementService.deleteDocument(id, tenantId, userId)

    res.json({ message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting document:', error)
    res.status(500).json({
      error: 'Failed to delete document',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document
 *     tags: [Documents]
 */
router.get('/:id/download',
  requirePermission('document:view:own'),
  auditLog({ action: 'DOWNLOAD', resourceType: 'documents' }),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const document = await documentManagementService.getDocumentById(id, tenantId, userId)

    if (!document) {
      return res.status(404).json({ error: 'Document not found' })
    }

    // In production, this would serve from S3 or local storage
    // For now, return the file URL
    res.json({
      download_url: document.file_url,
      file_name: document.file_name,
      message: 'Use the download_url to access the file'
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    res.status(500).json({ error: 'Failed to download document' })
  }
})

/**
 * @openapi
 * /api/documents/categories:
 *   get:
 *     summary: Get all document categories
 *     tags: [Documents]
 */
router.get('/categories/all',
  requirePermission('document:view:fleet'),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const categories = await documentManagementService.getCategories(tenantId)

    res.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

/**
 * @openapi
 * /api/documents/categories:
 *   post:
 *     summary: Create document category
 *     tags: [Documents]
 */
router.post('/categories',
  requirePermission('document:manage:global'),
  auditLog({ action: 'CREATE_CATEGORY', resourceType: 'document_categories' }),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const category = await documentManagementService.createCategory(tenantId, req.body)

    res.status(201).json({
      category,
      message: 'Category created successfully'
    })
  } catch (error: any) {
    console.error('Error creating category:', error)
    res.status(500).json({
      error: 'Failed to create category',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/search:
 *   post:
 *     summary: Semantic search across documents
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               limit:
 *                 type: integer
 */
router.post('/search',
  requirePermission('document:view:fleet'),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { query, categoryId, documentIds, limit, minScore } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const results = await documentRAGService.semanticSearch(tenantId, query, {
      categoryId,
      documentIds,
      limit: limit || 10,
      minScore: minScore || 0.7
    })

    res.json({ results, total: results.length })
  } catch (error: any) {
    console.error('Error performing semantic search:', error)
    res.status(500).json({
      error: 'Failed to perform search',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/ask:
 *   post:
 *     summary: RAG-powered Q&A over documents
 *     tags: [Documents]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 */
router.post('/ask',
  requirePermission('document:view:fleet'),
  auditLog({ action: 'RAG_QUERY', resourceType: 'documents' }),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const userId = req.user?.id

    if (!tenantId || !userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { question, categoryId, documentIds, maxSources } = req.body

    if (!question) {
      return res.status(400).json({ error: 'Question is required' })
    }

    const result = await documentRAGService.askQuestion(tenantId, userId, question, {
      categoryId,
      documentIds,
      maxSources: maxSources || 5
    })

    res.json(result)
  } catch (error: any) {
    console.error('Error answering question:', error)
    res.status(500).json({
      error: 'Failed to answer question',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/queries/history:
 *   get:
 *     summary: Get RAG query history
 *     tags: [Documents]
 */
router.get('/queries/history',
  requirePermission('document:view:fleet'),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { userId, limit } = req.query

    const history = await documentRAGService.getQueryHistory(tenantId, {
      userId: userId as string,
      limit: limit ? parseInt(limit as string) : 50
    })

    res.json({ queries: history })
  } catch (error) {
    console.error('Error fetching query history:', error)
    res.status(500).json({ error: 'Failed to fetch query history' })
  }
})

/**
 * @openapi
 * /api/documents/queries/{id}/feedback:
 *   post:
 *     summary: Provide feedback on a query
 *     tags: [Documents]
 */
router.post('/queries/:id/feedback',
  requirePermission('document:view:fleet'),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { rating, comment } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' })
    }

    await documentRAGService.provideFeedback(id, rating, comment)

    res.json({ message: 'Feedback submitted successfully' })
  } catch (error: any) {
    console.error('Error submitting feedback:', error)
    res.status(500).json({
      error: 'Failed to submit feedback',
      details: error.message
    })
  }
})

/**
 * @openapi
 * /api/documents/{id}/access-log:
 *   get:
 *     summary: Get document access log
 *     tags: [Documents]
 */
router.get('/:id/access-log',
  requirePermission('document:manage:global'),
  async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const accessLog = await documentManagementService.getAccessLog(id, tenantId)

    res.json({ access_log: accessLog })
  } catch (error) {
    console.error('Error fetching access log:', error)
    res.status(500).json({ error: 'Failed to fetch access log' })
  }
})

/**
 * @openapi
 * /api/documents/analytics/stats:
 *   get:
 *     summary: Get document statistics
 *     tags: [Documents]
 */
router.get('/analytics/stats',
  requirePermission('document:manage:global'),
  async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const [docStats, ragStats] = await Promise.all([
      documentManagementService.getStatistics(tenantId),
      documentRAGService.getAnalytics(tenantId)
    ])

    res.json({
      documents: docStats,
      rag: ragStats
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

export default router
