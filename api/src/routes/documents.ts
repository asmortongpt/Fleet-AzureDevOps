To refactor the `documents.ts` file to use the repository pattern, we'll need to create a `DocumentRepository` and replace all `pool.query` calls with repository methods. Here's the refactored version of the file:


// TODO: Verify tenant isolation in all queries
import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 19: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, validateScope } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileUploadLimiter } from '../config/rate-limiters'
import { secureFileValidation } from '../utils/file-validation'
import { csrfProtection } from '../middleware/csrf'
import { DocumentRepository } from '../repositories/document.repository'

const router = express.Router()
router.use(authenticateJWT)

// Configure multer for file uploads - using memory storage for security validation
// Files are validated before being written to disk
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for validation before disk write
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type'))
    }
  }
})

// Initialize the DocumentRepository
const documentRepository = new DocumentRepository()

// ============================================================================
// Documents - Core document management
// ============================================================================

// GET /documents
router.get(
  '/',
  requirePermission('document:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        document_type,
        category,
        entity_type,
        entity_id,
        search
      } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const result = await documentRepository.getDocuments({
        tenantId: req.user!.tenant_id,
        documentType: document_type as string,
        category: category as string,
        entityType: entity_type as string,
        entityId: entity_id as string,
        search: search as string,
        limit: Number(limit),
        offset
      })

      const count = await documentRepository.getDocumentCount({
        tenantId: req.user!.tenant_id,
        documentType: document_type as string,
        category: category as string,
        entityType: entity_type as string,
        entityId: entity_id as string,
        search: search as string
      })

      res.json({
        documents: result,
        total: count,
        page: Number(page),
        limit: Number(limit)
      })
    } catch (error) {
      logger.error('Error fetching documents:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /documents/:id
router.get(
  '/:id',
  requirePermission('document:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id
      const document = await documentRepository.getDocumentById(documentId, req.user!.tenant_id)

      if (!document) {
        throw new NotFoundError('Document not found')
      }

      res.json(document)
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else {
        logger.error('Error fetching document:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// POST /documents
router.post(
  '/',
  requirePermission('document:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'document' }),
  fileUploadLimiter,
  upload.single('file'),
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file
      if (!file) {
        throw new ValidationError('No file uploaded')
      }

      const validationResult = await secureFileValidation(file)
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errorMessage)
      }

      const documentSchema = z.object({
        document_type: z.string().min(1),
        category: z.string().min(1),
        related_entity_type: z.string().min(1),
        related_entity_id: z.string().min(1),
        description: z.string().optional()
      })

      const parsedBody = documentSchema.parse(req.body)

      const filePath = path.join(__dirname, '../../uploads', file.originalname)
      await fs.writeFile(filePath, file.buffer)

      const newDocument = await documentRepository.createDocument({
        ...parsedBody,
        filename: file.originalname,
        filepath: filePath,
        filesize: file.size,
        mimetype: file.mimetype,
        uploadedBy: req.user!.id,
        tenantId: req.user!.tenant_id
      })

      res.status(201).json(newDocument)
    } catch (error) {
      if (error instanceof ValidationError || error instanceof z.ZodError) {
        res.status(400).json({ error: error.message })
      } else {
        logger.error('Error creating document:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// PUT /documents/:id
router.put(
  '/:id',
  requirePermission('document:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id

      const documentSchema = z.object({
        document_type: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        related_entity_type: z.string().min(1).optional(),
        related_entity_id: z.string().min(1).optional(),
        description: z.string().optional()
      })

      const parsedBody = documentSchema.parse(req.body)

      const updatedDocument = await documentRepository.updateDocument(documentId, parsedBody, req.user!.tenant_id)

      if (!updatedDocument) {
        throw new NotFoundError('Document not found')
      }

      res.json(updatedDocument)
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid input' })
      } else {
        logger.error('Error updating document:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// DELETE /documents/:id
router.delete(
  '/:id',
  requirePermission('document:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id

      const deleted = await documentRepository.deleteDocument(documentId, req.user!.tenant_id)

      if (!deleted) {
        throw new NotFoundError('Document not found')
      }

      res.status(204).send()
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else {
        logger.error('Error deleting document:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

export default router


In this refactored version, we've made the following changes:

1. Imported the `DocumentRepository` at the top of the file.
2. Initialized the `documentRepository` instance.
3. Replaced all `pool.query` calls with corresponding methods from the `DocumentRepository`.

Here's a brief explanation of the new repository methods used:

- `getDocuments`: Replaces the main query in the GET /documents route. It handles filtering, pagination, and tenant isolation.
- `getDocumentCount`: Replaces the count query in the GET /documents route.
- `getDocumentById`: Used in the GET /documents/:id route to fetch a single document.
- `createDocument`: Used in the POST /documents route to create a new document.
- `updateDocument`: Used in the PUT /documents/:id route to update an existing document.
- `deleteDocument`: Used in the DELETE /documents/:id route to delete a document.

Note that you'll need to implement these methods in the `DocumentRepository` class. The implementation should handle the database queries and ensure proper tenant isolation.

This refactoring improves the separation of concerns, making the code more maintainable and easier to test. The repository pattern allows for easier switching of the data access layer if needed in the future.