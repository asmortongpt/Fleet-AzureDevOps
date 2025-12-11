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
        name: z.string().min(1),
        description: z.string().optional()
      })

      const { document_type, category, entity_type, entity_id, name, description } = schema.parse(req.body)

      const document = await documentRepository.createDocument({
        tenantId: req.user!.tenant_id,
        documentType: document_type,
        category: category,
        entityType: entity_type,
        entityId: entity_id,
        name: name,
        description: description,
        file: file
      })

      res.status(201).json(document)
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
  csrfProtection,
  requirePermission('document:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id

      const schema = z.object({
        document_type: z.string().optional(),
        category: z.string().optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional()
      })

      const { document_type, category, entity_type, entity_id, name, description } = schema.parse(req.body)

      const updatedDocument = await documentRepository.updateDocument({
        id: documentId,
        tenantId: req.user!.tenant_id,
        documentType: document_type,
        category: category,
        entityType: entity_type,
        entityId: entity_id,
        name: name,
        description: description
      })

      if (!updatedDocument) {
        throw new NotFoundError('Document not found')
      }

      res.json(updatedDocument)
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else if (error instanceof ValidationError || error instanceof z.ZodError) {
        res.status(400).json({ error: error.message })
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

// GET /documents/:id/download
router.get(
  '/:id/download',
  requirePermission('document:download:fleet'),
  auditLog({ action: 'DOWNLOAD', resourceType: 'document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const documentId = req.params.id
      const document = await documentRepository.getDocumentById(documentId, req.user!.tenant_id)

      if (!document) {
        throw new NotFoundError('Document not found')
      }

      const filePath = path.join(__dirname, '../../uploads', document.file_path)

      // Check if the file exists
      await fs.access(filePath)

      // Set appropriate headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${document.original_file_name}"`)
      res.setHeader('Content-Type', document.mime_type)

      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath)
      fileStream.pipe(res)
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else {
        logger.error('Error downloading document:', error)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

export default router


This refactored version of `documents.ts` replaces all direct database queries with calls to the `DocumentRepository` methods. The `DocumentRepository` class should be implemented in a separate file (`document.repository.ts`) and should contain methods for all the database operations used in this file.

Here's a summary of the changes made:

1. Imported `DocumentRepository` from `../repositories/document.repository`.
2. Initialized a new instance of `DocumentRepository` at the top of the file.
3. Replaced all `pool.query` calls with corresponding `documentRepository` method calls.
4. Updated the method signatures to match the repository methods, passing the required parameters.
5. Kept the error handling and logging intact.

Note that you'll need to implement the `DocumentRepository` class with the following methods:

- `getDocuments`
- `getDocumentCount`
- `getDocumentById`
- `createDocument`
- `updateDocument`
- `deleteDocument`

Each of these methods should handle the database operations previously done with `pool.query` calls, ensuring proper tenant isolation and security measures.