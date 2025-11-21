/**
 * Attachments Routes
 *
 * Comprehensive file attachment API for:
 * - Azure Blob Storage uploads/downloads
 * - Microsoft Teams file management
 * - Outlook email attachments
 * - File validation and security
 */

import { Router, Response } from 'express'
import multer from 'multer'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import attachmentService from '../services/attachment.service'
import pool from '../config/database'
import { getErrorMessage } from '../utils/error-handler'
import { SqlParams, Attachment } from '../types'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 150 * 1024 * 1024, // 150MB max (for Outlook support)
    files: 10 // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    try {
      attachmentService.validateFileType(file)
      cb(null, true)
    } catch (error: unknown) {
      cb(new Error(getErrorMessage(error)))
    }
  }
})

// Apply authentication to all routes
router.use(authenticateJWT)

// ============================================================================
// Azure Blob Storage Routes
// ============================================================================

/**
 * @openapi
 * /api/attachments/upload:
 *   post:
 *     summary: Upload file to Azure Blob Storage
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               communicationId:
 *                 type: integer
 *               metadata:
 *                 type: object
 */
router.post(
  '/upload',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const { communicationId, metadata } = req.body

      const result = await attachmentService.uploadToAzure(req.file, {
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user!.id,
        tenantId: req.user!.tenant_id,
        communicationId: communicationId ? parseInt(communicationId) : undefined,
        metadata: metadata ? JSON.parse(metadata) : undefined
      })

      // Perform virus scan asynchronously
      attachmentService.scanFileForVirus(req.file).then(async (scanResult) => {
        await pool.query(
          `UPDATE communication_attachments
           SET is_scanned = true, scan_result = $1, virus_scan_status = $2
           WHERE id = $3`,
          [scanResult === 'clean' ? 'Clean' : 'Threat Detected', scanResult, result.id]
        )
      }).catch(err => {
        console.error('Virus scan error:', err)
      })

      res.status(201).json({
        message: 'File uploaded successfully',
        attachment: result
      })
    } catch (error: unknown) {
      console.error('Upload error:', error)
      res.status(500).json({
        error: 'Failed to upload file',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/upload-multiple:
 *   post:
 *     summary: Upload multiple files to Azure Blob Storage
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/upload-multiple',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  upload.array('files', 10),
  auditLog({ action: 'CREATE', resourceType: 'attachments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[]

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' })
      }

      const { communicationId, metadata } = req.body

      const uploadPromises = files.map(file =>
        attachmentService.uploadToAzure(file, {
          originalFilename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user!.id,
          tenantId: req.user!.tenant_id,
          communicationId: communicationId ? parseInt(communicationId) : undefined,
          metadata: metadata ? JSON.parse(metadata) : undefined
        })
      )

      const results = await Promise.all(uploadPromises)

      res.status(201).json({
        message: `${results.length} files uploaded successfully`,
        attachments: results
      })
    } catch (error: unknown) {
      console.error('Multiple upload error:', error)
      res.status(500).json({
        error: 'Failed to upload files',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/{blobId}/download:
 *   get:
 *     summary: Download file from Azure Blob Storage
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:blobId/download',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { blobId } = req.params

      // Get attachment metadata from database
      const result = await pool.query(
        `SELECT id, tenant_id, communication_id, file_name, file_url, created_at FROM communication_attachments WHERE id = $1`,
        [blobId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      const attachment = result.rows[0]

      // Download file from Azure
      const fileBuffer = await attachmentService.downloadFromAzure(attachment.blob_url)

      // Update download count
      await pool.query(
        `UPDATE communication_attachments
         SET download_count = COALESCE(download_count, 0) + 1,
             last_accessed_at = NOW()
         WHERE id = $1`,
        [blobId]
      )

      // Set response headers
      res.setHeader('Content-Type', attachment.mime_type)
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename}"`)
      res.setHeader('Content-Length', fileBuffer.length)

      res.send(fileBuffer)
    } catch (error: unknown) {
      console.error('Download error:', error)
      res.status(500).json({
        error: 'Failed to download file',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/{blobId}/sas-url:
 *   get:
 *     summary: Generate SAS URL for temporary file access
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:blobId/sas-url',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'attachment_sas' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { blobId } = req.params
      const { expiryMinutes = 60 } = req.query

      // Get attachment metadata
      const result = await pool.query(
        `SELECT blob_url FROM communication_attachments WHERE id = $1`,
        [blobId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      const sasUrl = await attachmentService.getFileSasUrl(
        result.rows[0].blob_url,
        parseInt(expiryMinutes as string)
      )

      res.json({
        sasUrl,
        expiresIn: `${expiryMinutes} minutes`
      })
    } catch (error: unknown) {
      console.error('SAS URL generation error:', error)
      res.status(500).json({
        error: 'Failed to generate SAS URL',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/{blobId}:
 *   delete:
 *     summary: Delete file from Azure Blob Storage
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:blobId',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'DELETE', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { blobId } = req.params

      // Get attachment metadata
      const result = await pool.query(
        `SELECT blob_url FROM communication_attachments WHERE id = $1`,
        [blobId]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      // Delete from Azure
      await attachmentService.deleteFromAzure(result.rows[0].blob_url)

      // Delete from database
      await pool.query(
        `DELETE FROM communication_attachments WHERE id = $1`,
        [blobId]
      )

      res.json({ message: 'Attachment deleted successfully' })
    } catch (error: unknown) {
      console.error('Delete error:', error)
      res.status(500).json({
        error: 'Failed to delete attachment',
        details: getErrorMessage(error)
      })
    }
  }
)

// ============================================================================
// Microsoft Teams Routes
// ============================================================================

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/files:
 *   post:
 *     summary: Upload file to Microsoft Teams channel
 *     tags: [Attachments, Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/teams/:teamId/channels/:channelId/files',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'teams_file' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const { teamId, channelId } = req.params
      const { messageId } = req.body

      const result = await attachmentService.uploadToTeams(
        teamId,
        channelId,
        req.file,
        messageId
      )

      res.status(201).json({
        message: 'File uploaded to Teams successfully',
        file: result
      })
    } catch (error: unknown) {
      console.error('Teams upload error:', error)
      res.status(500).json({
        error: 'Failed to upload file to Teams',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/files/{fileId}:
 *   get:
 *     summary: Download file from Microsoft Teams
 *     tags: [Attachments, Teams]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/teams/:teamId/channels/:channelId/files/:fileId',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'teams_file' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { teamId, channelId, fileId } = req.params

      const fileBuffer = await attachmentService.downloadFromTeams(
        teamId,
        channelId,
        fileId
      )

      res.setHeader('Content-Type', 'application/octet-stream')
      res.send(fileBuffer)
    } catch (error: unknown) {
      console.error('Teams download error:', error)
      res.status(500).json({
        error: 'Failed to download file from Teams',
        details: getErrorMessage(error)
      })
    }
  }
)

// ============================================================================
// Outlook Email Attachment Routes
// ============================================================================

/**
 * @openapi
 * /api/outlook/attachments:
 *   post:
 *     summary: Upload attachment for Outlook email
 *     tags: [Attachments, Outlook]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/outlook/attachments',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const { messageId } = req.body

      if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' })
      }

      const result = await attachmentService.uploadToOutlook(messageId, req.file)

      res.status(201).json({
        message: 'Attachment added to email successfully',
        attachment: result
      })
    } catch (error: unknown) {
      console.error('Outlook attachment error:', error)
      res.status(500).json({
        error: 'Failed to add attachment to email',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/outlook/send-email:
 *   post:
 *     summary: Send email with attachments
 *     tags: [Attachments, Outlook]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/outlook/send-email',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.array('files', 10),
  auditLog({ action: 'CREATE', resourceType: 'outlook_email' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { to, subject, body, cc, bcc } = req.body
      const files = req.files as Express.Multer.File[] || []

      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
      }

      const email = {
        to: Array.isArray(to) ? to : [to],
        subject,
        body,
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined
      }

      await attachmentService.sendEmailWithAttachment(email, files)

      res.status(200).json({
        message: 'Email sent successfully',
        recipients: email.to.length,
        attachments: files.length
      })
    } catch (error: unknown) {
      console.error('Send email error:', error)
      res.status(500).json({
        error: 'Failed to send email',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/outlook/messages/{messageId}/attachments/{attachmentId}:
 *   get:
 *     summary: Download email attachment from Outlook
 *     tags: [Attachments, Outlook]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/outlook/messages/:messageId/attachments/:attachmentId',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'outlook_attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId, attachmentId } = req.params

      const fileBuffer = await attachmentService.downloadEmailAttachment(
        messageId,
        attachmentId
      )

      res.setHeader('Content-Type', 'application/octet-stream')
      res.send(fileBuffer)
    } catch (error: unknown) {
      console.error('Download email attachment error:', error)
      res.status(500).json({
        error: 'Failed to download email attachment',
        details: getErrorMessage(error)
      })
    }
  }
)

// ============================================================================
// Attachment Management Routes
// ============================================================================

/**
 * @openapi
 * /api/attachments:
 *   get:
 *     summary: Get all attachments with filtering
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'attachments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        communicationId,
        scanStatus,
        page = 1,
        limit = 50
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)

      let query = `
        SELECT
          ca.*,
          c.subject as communication_subject
        FROM communication_attachments ca
        LEFT JOIN communications c ON ca.communication_id = c.id
        WHERE 1=1
      `

      const params: SqlParams = []
      let paramIndex = 1

      if (communicationId) {
        query += ` AND ca.communication_id = $${paramIndex}`
        params.push(communicationId)
        paramIndex++
      }

      if (scanStatus) {
        query += ` AND ca.virus_scan_status = $${paramIndex}`
        params.push(scanStatus)
        paramIndex++
      }

      query += ` ORDER BY ca.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM communication_attachments WHERE 1=1`
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error: unknown) {
      console.error('Get attachments error:', error)
      res.status(500).json({
        error: 'Failed to get attachments',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/{id}:
 *   get:
 *     summary: Get attachment metadata by ID
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  auditLog({ action: 'READ', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const result = await pool.query(
        `SELECT
          ca.*,
          c.subject as communication_subject,
          c.communication_type
        FROM communication_attachments ca
        LEFT JOIN communications c ON ca.communication_id = c.id
        WHERE ca.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      res.json(result.rows[0])
    } catch (error: unknown) {
      console.error('Get attachment error:', error)
      res.status(500).json({
        error: 'Failed to get attachment',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/cleanup/orphaned:
 *   post:
 *     summary: Clean up orphaned files (admin only)
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/cleanup/orphaned',
  authorize('admin'),
  auditLog({ action: 'DELETE', resourceType: 'orphaned_attachments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { daysOld = 30 } = req.body

      const deletedCount = await attachmentService.cleanupOrphanedFiles(daysOld)

      res.json({
        message: 'Cleanup completed',
        deletedCount
      })
    } catch (error: unknown) {
      console.error('Cleanup error:', error)
      res.status(500).json({
        error: 'Failed to cleanup orphaned files',
        details: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/attachments/stats:
 *   get:
 *     summary: Get attachment statistics
 *     tags: [Attachments]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats/summary',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'READ', resourceType: 'attachment_stats' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await pool.query(`
        SELECT
          COUNT(*) as total_attachments,
          SUM(file_size_bytes) as total_size_bytes,
          COUNT(CASE WHEN virus_scan_status = 'clean' THEN 1 END) as clean_files,
          COUNT(CASE WHEN virus_scan_status = 'pending' THEN 1 END) as pending_scans,
          COUNT(CASE WHEN virus_scan_status = 'infected' THEN 1 END) as infected_files,
          COUNT(CASE WHEN thumbnail_url IS NOT NULL THEN 1 END) as files_with_thumbnails,
          COUNT(DISTINCT mime_type) as unique_file_types
        FROM communication_attachments
      `)

      const byType = await pool.query(`
        SELECT
          mime_type,
          COUNT(*) as count,
          SUM(file_size_bytes) as total_size
        FROM communication_attachments
        GROUP BY mime_type
        ORDER BY count DESC
        LIMIT 10
      `)

      res.json({
        summary: stats.rows[0],
        by_type: byType.rows
      })
    } catch (error: unknown) {
      console.error('Get stats error:', error)
      res.status(500).json({
        error: 'Failed to get attachment statistics',
        details: getErrorMessage(error)
      })
    }
  }
)

export default router
