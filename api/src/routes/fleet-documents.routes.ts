/**
 * Fleet Documents Routes
 *
 * Comprehensive document management API for fleet operations:
 * - Document upload with file validation
 * - CRUD operations with tenant isolation
 * - Expiration tracking and alerts
 * - OCR processing triggers
 * - Download URL generation
 */

import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import documentService from '../services/document.service'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || '/tmp/uploads')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ]
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Allowed types: images, PDF, Word, Excel, text files'))
    }
  }
})

// Apply authentication to all routes
router.use(authenticateJWT)

// ============================================================================
// Document CRUD Operations
// ============================================================================

/**
 * @openapi
 * /api/fleet-documents/upload:
 *   post:
 *     summary: Upload a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - documentType
 *               - title
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               vehicleId:
 *                 type: integer
 *               driverId:
 *                 type: integer
 *               workOrderId:
 *                 type: integer
 *               documentType:
 *                 type: string
 *                 enum: [registration, insurance, inspection, maintenance, license, permit, other]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/upload',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'fleet_document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const {
        vehicleId,
        driverId,
        workOrderId,
        documentType,
        title,
        description,
        expiresAt
      } = req.body

      if (!documentType || !title) {
        return res.status(400).json({ error: 'documentType and title are required' })
      }

      // Validate that at least one entity is specified
      if (!vehicleId && !driverId && !workOrderId) {
        return res.status(400).json({
          error: 'At least one of vehicleId, driverId, or workOrderId must be specified'
        })
      }

      // Insert document record
      // Generate blob URL (in production, this would be Azure Blob Storage)
      const blobUrl = '${process.env.API_URL || 'http://localhost:3000'}/uploads/${req.file.filename}'
      const storagePath = `uploads/${req.file.filename}`

      const result = await pool.query(
        `INSERT INTO fleet_documents (
          tenant_id, vehicle_id, driver_id, work_order_id,
          document_type, title, description, file_name,
          original_file_name, file_size, mime_type,
          storage_path, blob_url, expires_at, uploaded_by, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING *`,
        [
          req.user!.tenant_id,
          vehicleId ? parseInt(vehicleId) : null,
          driverId ? parseInt(driverId) : null,
          workOrderId ? parseInt(workOrderId) : null,
          documentType,
          title,
          description || null,
          req.file.filename,
          req.file.originalname,
          req.file.size,
          req.file.mimetype,
          storagePath,
          blobUrl,
          expiresAt || null,
          req.user!.id
        ]
      )

      res.status(201).json({
        success: true,
        document: result.rows[0]
      })
    } catch (error: any) {
      console.error('Upload fleet document error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

/**
 * @openapi
 * /api/fleet-documents:
 *   get:
 *     summary: List documents with filters
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: workOrderId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of documents
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'fleet_documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        vehicleId,
        driverId,
        workOrderId,
        documentType,
        page = 1,
        limit = 50
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT
          fd.*,
          v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
          d.first_name || ' ' || d.last_name as driver_name,
          wo.title as work_order_title,
          uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
        FROM fleet_documents fd
        LEFT JOIN vehicles v ON fd.vehicle_id = v.id
        LEFT JOIN drivers d ON fd.driver_id = d.id
        LEFT JOIN work_orders wo ON fd.work_order_id = wo.id
        LEFT JOIN drivers uploader ON fd.uploaded_by = uploader.id
        WHERE fd.tenant_id = $1 AND fd.is_archived = false
      `

      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (vehicleId) {
        query += ` AND fd.vehicle_id = $${paramIndex}`
        params.push(vehicleId)
        paramIndex++
      }

      if (driverId) {
        query += ` AND fd.driver_id = $${paramIndex}`
        params.push(driverId)
        paramIndex++
      }

      if (workOrderId) {
        query += ` AND fd.work_order_id = $${paramIndex}`
        params.push(workOrderId)
        paramIndex++
      }

      if (documentType) {
        query += ` AND fd.document_type = $${paramIndex}`
        params.push(documentType)
        paramIndex++
      }

      query += ` ORDER BY fd.uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      // Get total count
      let countQuery = `
        SELECT COUNT(*)
        FROM fleet_documents fd
        WHERE fd.tenant_id = $1 AND fd.is_archived = false
      `
      const countParams: any[] = [req.user!.tenant_id]
      let countParamIndex = 2

      if (vehicleId) {
        countQuery += ` AND fd.vehicle_id = $${countParamIndex}`
        countParams.push(vehicleId)
        countParamIndex++
      }

      if (driverId) {
        countQuery += ` AND fd.driver_id = $${countParamIndex}`
        countParams.push(driverId)
        countParamIndex++
      }

      if (workOrderId) {
        countQuery += ` AND fd.work_order_id = $${countParamIndex}`
        countParams.push(workOrderId)
        countParamIndex++
      }

      if (documentType) {
        countQuery += ` AND fd.document_type = $${countParamIndex}`
        countParams.push(documentType)
        countParamIndex++
      }

      const countResult = await pool.query(countQuery, countParams)

      res.json({
        documents: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error: any) {
      console.error('Get fleet documents error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

/**
 * @openapi
 * /api/fleet-documents/{id}:
 *   get:
 *     summary: Get single document with download URL
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'fleet_document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          fd.*,
          v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
          d.first_name || ' ' || d.last_name as driver_name,
          wo.title as work_order_title,
          uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
        FROM fleet_documents fd
        LEFT JOIN vehicles v ON fd.vehicle_id = v.id
        LEFT JOIN drivers d ON fd.driver_id = d.id
        LEFT JOIN work_orders wo ON fd.work_order_id = wo.id
        LEFT JOIN drivers uploader ON fd.uploaded_by = uploader.id
        WHERE fd.id = $1 AND fd.tenant_id = $2 AND fd.is_archived = false`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      const document = result.rows[0]

      // Generate download URL (in production, this would be a signed URL)
      const downloadUrl = `/api/fleet-documents/${document.id}/download`

      res.json({
        document: {
          ...document,
          downloadUrl
        }
      })
    } catch (error: any) {
      console.error('Get fleet document error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

/**
 * @openapi
 * /api/fleet-documents/{id}:
 *   delete:
 *     summary: Soft delete a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Document archived
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'DELETE', resourceType: 'fleet_document' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `UPDATE fleet_documents
         SET is_archived = true, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2 AND is_archived = false
         RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      res.json({
        success: true,
        message: 'Document archived successfully'
      })
    } catch (error: any) {
      console.error('Delete fleet document error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

// ============================================================================
// Expiration Tracking
// ============================================================================

/**
 * @openapi
 * /api/fleet-documents/expiring:
 *   get:
 *     summary: Get documents expiring soon
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: List of expiring documents
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/expiring',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'expiring_documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = 30 } = req.query
      const daysInt = parseInt(days as string)

      const result = await pool.query(
        `SELECT
          fd.*,
          v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle_name,
          d.first_name || ' ' || d.last_name as driver_name,
          wo.title as work_order_title,
          EXTRACT(DAY FROM (fd.expires_at - NOW())) as days_until_expiry
        FROM fleet_documents fd
        LEFT JOIN vehicles v ON fd.vehicle_id = v.id
        LEFT JOIN drivers d ON fd.driver_id = d.id
        LEFT JOIN work_orders wo ON fd.work_order_id = wo.id
        WHERE fd.tenant_id = $1
          AND fd.is_archived = false
          AND fd.expires_at IS NOT NULL
          AND fd.expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 day' * $2
        ORDER BY fd.expires_at ASC`,
        [req.user!.tenant_id, daysInt]
      )

      res.json({
        documents: result.rows,
        count: result.rows.length,
        days: daysInt
      })
    } catch (error: any) {
      console.error('Get expiring documents error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

// ============================================================================
// OCR Processing
// ============================================================================

/**
 * @openapi
 * /api/fleet-documents/{id}/ocr:
 *   post:
 *     summary: Trigger OCR processing for a document
 *     tags: [Fleet Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       202:
 *         description: OCR processing started
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/:id/ocr',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'CREATE', resourceType: 'ocr_processing' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Verify document exists and belongs to tenant
      const docResult = await pool.query(
        `SELECT id, file_name, mime_type, storage_path
         FROM fleet_documents
         WHERE id = $1 AND tenant_id = $2 AND is_archived = false`,
        [req.params.id, req.user!.tenant_id]
      )

      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      const document = docResult.rows[0]

      // Check if document is an image or PDF
      const ocrSupportedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf'
      ]

      if (!ocrSupportedTypes.includes(document.mime_type)) {
        return res.status(400).json({
          error: 'OCR is only supported for images and PDF files'
        })
      }

      // Update document metadata to mark as OCR pending
      await pool.query(
        `UPDATE fleet_documents
         SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{ocr_status}',
           '"pending"'
         ),
         updated_at = NOW()
         WHERE id = $1',
        [req.params.id]
      )

      // TODO: In production, trigger actual OCR processing here
      // This would typically involve:
      // 1. Sending the file to Azure Computer Vision, AWS Textract, or Google Cloud Vision
      // 2. Using a message queue (Azure Service Bus, AWS SQS, RabbitMQ) to process asynchronously
      // 3. Updating the ocr_text field with results when complete

      res.status(202).json({
        success: true,
        message: 'OCR processing queued',
        documentId: req.params.id,
        status: 'pending'
      })
    } catch (error: any) {
      console.error('Trigger OCR processing error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

// ============================================================================
// File Download
// ============================================================================

/**
 * Download endpoint for document files
 * Note: This is a basic implementation. In production, you would:
 * - Use signed URLs from Azure Blob Storage or AWS S3
 * - Implement virus scanning
 * - Add rate limiting
 * - Stream large files instead of loading into memory
 */
router.get(
  '/:id/download',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'fleet_document_download' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, file_name, original_file_name, mime_type, blob_url
         FROM fleet_documents
         WHERE id = $1 AND tenant_id = $2 AND is_archived = false`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      const document = result.rows[0]

      // In production, you would:
      // 1. Generate a signed URL from Azure Blob Storage with SAS token
      // 2. Redirect to the signed URL
      // 3. Or stream the file from storage

      // For now, return the blob URL
      res.json({
        message: 'Download URL generated',
        document: {
          id: document.id,
          filename: document.original_file_name,
          mimeType: document.mime_type
        },
        // In production, this would be a signed URL with SAS token
        downloadUrl: document.blob_url
      })
    } catch (error: any) {
      console.error('Download fleet document error:', error)
      res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? getErrorMessage(error) : undefined
      })
    }
  }
)

export default router
