import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, validateScope } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs/promises'
import { fileUploadLimiter } from '../config/rate-limiters'
import { secureFileValidation } from '../utils/file-validation'

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

      let query = `
        SELECT d.*,
               uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
        FROM documents d
        LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
        WHERE uploader.tenant_id = $1 OR uploader.tenant_id IS NULL
      `
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      if (document_type) {
        query += ` AND d.document_type = $${paramIndex}`
        params.push(document_type)
        paramIndex++
      }

      if (category) {
        query += ` AND d.category = $${paramIndex}`
        params.push(category)
        paramIndex++
      }

      if (entity_type) {
        query += ` AND d.related_entity_type = $${paramIndex}`
        params.push(entity_type)
        paramIndex++
      }

      if (entity_id) {
        query += ` AND d.related_entity_id = $${paramIndex}`
        params.push(entity_id)
        paramIndex++
      }

      if (search) {
        query += ` AND (
          d.filename ILIKE $${paramIndex} OR
          d.description ILIKE $${paramIndex} OR
          d.extracted_text ILIKE $${paramIndex}
        )`
        params.push(`%${search}%`)
        paramIndex++
      }

      query += ` ORDER BY d.uploaded_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countQuery = `
        SELECT COUNT(*)
        FROM documents d
        LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
        WHERE uploader.tenant_id = $1 OR uploader.tenant_id IS NULL
      `
      const countResult = await pool.query(countQuery, [req.user!.tenant_id])

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get documents error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /documents/:id
router.get(
  '/:id',
  requirePermission('document:view:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'READ', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // First check tenant isolation and get uploader info
      const result = await pool.query(
        `SELECT d.*,
                uploader.first_name || ' ' || uploader.last_name as uploaded_by_name,
                uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      // Documents must belong to users in the same tenant
      const document = result.rows[0]
      if (document.uploader_tenant_id && document.uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // Get camera metadata if exists
      const cameraResult = await pool.query(
        `SELECT 
      id,
      document_id,
      device_manufacturer,
      device_model,
      os_name,
      os_version,
      app_version,
      photo_taken_at,
      camera_make,
      camera_model,
      focal_length,
      aperture,
      iso,
      flash_used,
      orientation,
      latitude,
      longitude,
      altitude,
      location_accuracy,
      location_address,
      image_width,
      image_height,
      image_resolution_dpi,
      file_size_original_bytes,
      file_size_compressed_bytes,
      compression_ratio,
      auto_crop_applied,
      auto_rotate_applied,
      auto_brightness_applied,
      auto_contrast_applied,
      edge_detection_applied,
      created_at FROM camera_capture_metadata WHERE document_id = $1',
        [req.params.id]
      )

      // Get OCR data if exists
      const ocrResult = await pool.query(
        `SELECT id, tenant_id, document_id, status, confidence_score, text_content, processed_at FROM ocr_processing_log WHERE document_id = $1 ORDER BY processed_at DESC LIMIT 1`,
        [req.params.id]
      )

      // Get receipt data if exists
      const receiptResult = await pool.query(
        `SELECT 
      id,
      document_id,
      line_number,
      item_description,
      quantity,
      unit_price,
      line_total,
      product_category,
      product_code,
      is_taxable,
      tax_rate,
      tax_amount,
      is_approved,
      approved_by,
      approved_at,
      gl_account_code,
      cost_center,
      created_at FROM receipt_line_items WHERE document_id = $1 ORDER BY line_number`,
        [req.params.id]
      )

      // Remove tenant_id from response to avoid information disclosure
      delete document.uploader_tenant_id

      res.json({
        ...document,
        camera_metadata: cameraResult.rows[0] || null,
        ocr_data: ocrResult.rows[0] || null,
        receipt_items: receiptResult.rows || []
      })
    } catch (error) {
      console.error('Get document error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /documents/upload
router.post(
  '/upload',
  fileUploadLimiter, // Rate limit: 5 uploads per minute
  requirePermission('document:create:fleet'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      // SECURITY: Validate file content using magic bytes (not just MIME type)
      const validation = await secureFileValidation(req.file.buffer, req.file.originalname)
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: validation.error
        })
      }

      // Virus scan check
      if (validation.virusScanResult && !validation.virusScanResult.clean) {
        return res.status(400).json({
          error: 'File failed security scan',
          message: validation.virusScanResult.threat
        })
      }

      const {
        document_type = 'Other',
        category = 'General',
        description,
        related_entity_type,
        related_entity_id,
        tags = []
      } = req.body

      // Create upload directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads'
      try {
        await fs.mkdir(uploadDir, { recursive: true })
      } catch (err) {
        console.error('Failed to create upload directory:', err)
      }

      // Write validated file to disk with secure filename
      const secureFilePath = path.join(uploadDir, validation.secureFilename!)
      await fs.writeFile(secureFilePath, req.file.buffer)

      // Insert document record
      const result = await pool.query(
        `INSERT INTO documents (
          document_type, category, filename, original_filename,
          file_size_bytes, mime_type, file_path, description,
          related_entity_type, related_entity_id, tags,
          uploaded_by, uploaded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          document_type,
          category,
          validation.secureFilename,
          req.file.originalname,
          req.file.size,
          validation.mimeType,
          secureFilePath,
          description,
          related_entity_type,
          related_entity_id ? parseInt(related_entity_id) : null,
          Array.isArray(tags) ? tags : JSON.parse(tags || '[]'),
          req.user!.id
        ]
      )

      // TODO: Trigger OCR processing in background
      // This would typically be done via a message queue or background job

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Upload document error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /documents/camera-capture
router.post(
  '/camera-capture',
  fileUploadLimiter, // Rate limit: 5 uploads per minute
  requirePermission('document:create:fleet'),
  upload.single('photo'),
  auditLog({ action: 'CREATE', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' })
      }

      // SECURITY: Validate file content using magic bytes (not just MIME type)
      const validation = await secureFileValidation(req.file.buffer, req.file.originalname)
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'File validation failed',
          message: validation.error
        })
      }

      // Virus scan check
      if (validation.virusScanResult && !validation.virusScanResult.clean) {
        return res.status(400).json({
          error: 'File failed security scan',
          message: validation.virusScanResult.threat
        })
      }

      const {
        document_type = 'Receipt',
        category = 'Expense',
        description,
        related_entity_type,
        related_entity_id,
        // Camera metadata
        device_manufacturer,
        device_model,
        device_os,
        device_os_version,
        photo_taken_at,
        camera_make,
        latitude,
        longitude,
        auto_crop_applied = false,
        auto_rotate_applied = false
      } = req.body

      // Create upload directory if it doesn't exist
      const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads'
      try {
        await fs.mkdir(uploadDir, { recursive: true })
      } catch (err) {
        console.error('Failed to create upload directory:', err)
      }

      // Write validated file to disk with secure filename
      const secureFilePath = path.join(uploadDir, validation.secureFilename!)
      await fs.writeFile(secureFilePath, req.file.buffer)

      // Insert document
      const docResult = await pool.query(
        `INSERT INTO documents (
          document_type, category, filename, original_filename,
          file_size_bytes, mime_type, file_path, description,
          related_entity_type, related_entity_id,
          uploaded_by, uploaded_at, is_mobile_capture
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), TRUE)
        RETURNING *`,
        [
          document_type,
          category,
          validation.secureFilename,
          req.file.originalname,
          req.file.size,
          validation.mimeType,
          secureFilePath,
          description,
          related_entity_type,
          related_entity_id ? parseInt(related_entity_id) : null,
          req.user!.id
        ]
      )

      const documentId = docResult.rows[0].id

      // Insert camera metadata
      await pool.query(
        `INSERT INTO camera_capture_metadata (
          document_id, device_manufacturer, device_model,
          device_os, device_os_version, photo_taken_at,
          camera_make, latitude, longitude,
          auto_crop_applied, auto_rotate_applied
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          documentId,
          device_manufacturer,
          device_model,
          device_os,
          device_os_version,
          photo_taken_at ? new Date(photo_taken_at) : new Date(),
          camera_make,
          latitude ? parseFloat(latitude) : null,
          longitude ? parseFloat(longitude) : null,
          auto_crop_applied === 'true',
          auto_rotate_applied === 'true'
        ]
      )

      // TODO: Trigger OCR and receipt parsing in background

      res.status(201).json(docResult.rows[0])
    } catch (error) {
      console.error('Camera capture error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /documents/:id
router.put(
  '/:id',
  requirePermission('document:update:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'UPDATE', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { description, category, tags, related_entity_type, related_entity_id } = req.body

      // First verify tenant isolation before update
      const checkResult = await pool.query(
        `SELECT d.id, uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      if (checkResult.rows[0].uploader_tenant_id && checkResult.rows[0].uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      const result = await pool.query(
        `UPDATE documents
         SET description = COALESCE($2, description),
             category = COALESCE($3, category),
             tags = COALESCE($4, tags),
             related_entity_type = COALESCE($5, related_entity_type),
             related_entity_id = COALESCE($6, related_entity_id)
         WHERE id = $1
         RETURNING *`,
        [req.params.id, description, category, tags, related_entity_type, related_entity_id]
      )

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update document error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /documents/:id
router.delete(
  '/:id',
  requirePermission('document:delete:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'DELETE', resourceType: 'documents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // First verify tenant isolation before delete
      const checkResult = await pool.query(
        `SELECT d.id, uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      if (checkResult.rows[0].uploader_tenant_id && checkResult.rows[0].uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      const result = await pool.query(
        `DELETE FROM documents WHERE id = $1 RETURNING id`,
        [req.params.id]
      )

      // TODO: Delete physical file from storage

      res.json({ message: 'Document deleted successfully' })
    } catch (error) {
      console.error('Delete document error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// OCR Processing
// ============================================================================

// POST /documents/:id/ocr
router.post(
  '/:id/ocr',
  requirePermission('document:create:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'CREATE', resourceType: 'ocr_processing' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get document and verify tenant isolation
      const docResult = await pool.query(
        `SELECT d.*, uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      const document = docResult.rows[0]
      if (document.uploader_tenant_id && document.uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // TODO: Call actual OCR service (Azure Computer Vision, Google Cloud Vision, AWS Textract, etc.)
      // For now, create a placeholder OCR log entry
      const ocrResult = await pool.query(
        `INSERT INTO ocr_processing_log (
          document_id, processing_status, processed_at
        ) VALUES ($1, 'pending', NOW())
        RETURNING *`,
        [req.params.id]
      )

      res.status(202).json({
        message: 'OCR processing started',
        ocr_job: ocrResult.rows[0]
      })
    } catch (error) {
      console.error('Start OCR processing error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Receipt Parsing
// ============================================================================

// POST /documents/:id/parse-receipt
router.post(
  '/:id/parse-receipt',
  requirePermission('document:create:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'CREATE', resourceType: 'receipt_parsing' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const docResult = await pool.query(
        `SELECT d.*, uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      const document = docResult.rows[0]
      if (document.uploader_tenant_id && document.uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // TODO: Call receipt parsing service
      // This would use OCR + AI to extract line items, totals, vendor info, etc.

      res.status(202).json({
        message: 'Receipt parsing started'
      })
    } catch (error) {
      console.error('Start receipt parsing error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /documents/:id/receipt-items
router.put(
  '/:id/receipt-items',
  requirePermission('document:update:fleet'),
  validateScope('document'), // BOLA protection: validate user has access to this document
  auditLog({ action: 'UPDATE', resourceType: 'receipt_line_items' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { line_items } = req.body

      if (!Array.isArray(line_items)) {
        return res.status(400).json({ error: 'line_items must be an array' })
      }

      // First verify tenant isolation
      const docResult = await pool.query(
        `SELECT d.id, uploader.tenant_id as uploader_tenant_id
         FROM documents d
         LEFT JOIN users uploader ON d.uploaded_by = uploader.id
         WHERE d.id = $1',
        [req.params.id]
      )

      if (docResult.rows.length === 0) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // CRITICAL: Enforce tenant isolation
      if (docResult.rows[0].uploader_tenant_id && docResult.rows[0].uploader_tenant_id !== req.user!.tenant_id) {
        return res.status(404).json({ error: 'Document not found' })
      }

      // Delete existing line items
      await pool.query(
        `DELETE FROM receipt_line_items WHERE document_id = $1',
        [req.params.id]
      )

      // Insert new line items
      const insertPromises = line_items.map((item, index) =>
        pool.query(
          `INSERT INTO receipt_line_items (
            document_id, line_number, item_description,
            quantity, unit_price, line_total, tax_amount,
            category, is_taxable, ai_confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            req.params.id,
            index + 1,
            item.item_description,
            item.quantity || 1,
            item.unit_price || 0,
            item.line_total || 0,
            item.tax_amount || 0,
            item.category,
            item.is_taxable !== false,
            item.ai_confidence || null
          ]
        )
      )

      await Promise.all(insertPromises)

      // Get updated line items
      const result = await pool.query(
        `SELECT 
      id,
      document_id,
      line_number,
      item_description,
      quantity,
      unit_price,
      line_total,
      product_category,
      product_code,
      is_taxable,
      tax_rate,
      tax_amount,
      is_approved,
      approved_by,
      approved_at,
      gl_account_code,
      cost_center,
      created_at FROM receipt_line_items WHERE document_id = $1 ORDER BY line_number`,
        [req.params.id]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('Update receipt line items error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /documents/dashboard
router.get(
  '/analytics/dashboard',
  requirePermission('document:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'documents_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Total documents
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total_documents,
                COUNT(CASE WHEN is_mobile_capture = TRUE THEN 1 END) as mobile_captures,
                SUM(file_size_bytes) as total_storage_bytes
         FROM documents d
         LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
         WHERE uploader.tenant_id = $1',
        [req.user!.tenant_id]
      )

      // By category
      const byCategoryResult = await pool.query(
        `SELECT category, COUNT(*) as count
         FROM documents d
         LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
         WHERE uploader.tenant_id = $1
         GROUP BY category
         ORDER BY count DESC
         LIMIT 10`,
        [req.user!.tenant_id]
      )

      // OCR status
      const ocrResult = await pool.query(
        `SELECT processing_status, COUNT(*) as count
         FROM ocr_processing_log opl
         JOIN documents d ON opl.document_id = d.id
         LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
         WHERE uploader.tenant_id = $1
         GROUP BY processing_status`,
        [req.user!.tenant_id]
      )

      // Recent uploads
      const recentResult = await pool.query(
        `SELECT d.*, uploader.first_name || ' ' || uploader.last_name as uploaded_by_name
         FROM documents d
         LEFT JOIN drivers uploader ON d.uploaded_by = uploader.id
         WHERE uploader.tenant_id = $1
         ORDER BY d.uploaded_at DESC
         LIMIT 10`,
        [req.user!.tenant_id]
      )

      res.json({
        summary: totalResult.rows[0],
        by_category: byCategoryResult.rows,
        ocr_status: ocrResult.rows,
        recent: recentResult.rows
      })
    } catch (error) {
      console.error('Get documents dashboard error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
