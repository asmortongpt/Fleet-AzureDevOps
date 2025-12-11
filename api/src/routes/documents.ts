Here's the complete refactored `documents.ts` file using the `DocumentRepository` for all database operations:


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
  csrfProtection,
  fileUploadLimiter,
  requirePermission('document:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'document' }),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const file = req.file
      if (!file) {
        throw new ValidationError('No file uploaded')
      }

      const validationResult = await secureFileValidation(file)
      if (!validationResult.isValid) {
        throw new ValidationError('Invalid file: ' + validationResult.error)
      }

      const schema = z.object({
        document_type: z.string().min(1),
        category: z.string().optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional()
      })

      const { document_type, category, entity_type, entity_id, metadata } = schema.parse(req.body)

      const fileName = `${Date.now()}-${file.originalname}`
      const filePath = path.join(__dirname, '../../uploads', fileName)
      await fs.writeFile(filePath, file.buffer)

      const document = await documentRepository.createDocument({
        tenantId: req.user!.tenant_id,
        fileName,
        filePath,
        documentType: document_type,
        category,
        entityType: entity_type,
        entityId: entity_id,
        metadata,
        userId: req.user!.id
      })

      res.status(201).json(document)
    } catch (error) {
      if (error instanceof ValidationError || error instanceof z.ZodError) {
        res.status(400).json({ error: error instanceof z.ZodError ? error.errors : error.message })
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
  csrfProtection,
  requirePermission('document:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id

      const schema = z.object({
        document_type: z.string().min(1).optional(),
        category: z.string().optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
        metadata: z.record(z.string(), z.any()).optional()
      })

      const { document_type, category, entity_type, entity_id, metadata } = schema.parse(req.body)

      const updatedDocument = await documentRepository.updateDocument({
        id: documentId,
        tenantId: req.user!.tenant_id,
        documentType: document_type,
        category,
        entityType: entity_type,
        entityId: entity_id,
        metadata,
        userId: req.user!.id
      })

      if (!updatedDocument) {
        throw new NotFoundError('Document not found')
      }

      res.json(updatedDocument)
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else if (error instanceof ValidationError || error instanceof z.ZodError) {
        res.status(400).json({ error: error instanceof z.ZodError ? error.errors : error.message })
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
  csrfProtection,
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


This refactored version of `documents.ts` replaces all `pool.query` and `db.query` calls with methods from the `DocumentRepository`. The `DocumentRepository` is instantiated at the beginning of the file and used throughout the document management routes.

Key changes include:

1. Initialization of `DocumentRepository` at the top of the file.
2. Replacement of database queries with corresponding `DocumentRepository` methods:
   - `getDocuments` for fetching multiple documents
   - `getDocumentCount` for counting documents
   - `getDocumentById` for fetching a single document
   - `createDocument` for creating a new document
   - `updateDocument` for updating an existing document
   - `deleteDocument` for deleting a document

3. Passing `tenantId` to repository methods to ensure tenant isolation.

4. Error handling remains consistent, with appropriate error types (NotFoundError, ValidationError) being thrown and caught.

5. The overall structure and functionality of the routes remain the same, but now they use the repository pattern for database operations.

This refactoring improves the separation of concerns by moving database operations into a dedicated repository class, making the code more maintainable and easier to test.