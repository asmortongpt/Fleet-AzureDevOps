/**
 * Attachments Routes
 *
 * Comprehensive file attachment API for:
 * - Azure Blob Storage uploads/downloads
 * - Microsoft Teams file management
 * - Outlook email attachments
 * - File validation and security
 * 
 * Refactored by Agent 53 - Wave B3 - All direct DB queries eliminated
 */

import { Router, Response } from 'express'
import multer from 'multer'

import logger from '../config/logger'
import { container } from '../container'
import { ValidationError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { AttachmentRepository } from '../repositories/attachments.repository'
import attachmentService from '../services/attachment.service'
import { TYPES } from '../types'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

// Get repository instance from DI container
const attachmentRepo = container.get<AttachmentRepository>(TYPES.AttachmentRepository)

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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher', 'driver'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded')
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

      // Perform virus scan asynchronously - REPOSITORY USED HERE (Query 1 eliminated)
      attachmentService.scanFileForVirus(req.file).then(async (scanResult) => {
        await attachmentRepo.updateVirusScanStatus(
          result.id,
          scanResult === 'clean' ? 'Clean' : 'Threat Detected',
          scanResult
        )
      }).catch(err => {
        logger.error('Virus scan error:', err)
      })

      res.status(201).json({
        message: 'File uploaded successfully',
        attachment: result
      })
    } catch (error: unknown) {
      logger.error('Upload error:', error)
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
  csrfProtection,
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
      logger.error('Multiple upload error:', error)
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

      // REPOSITORY USED HERE (Query 2 eliminated)
      const attachment = await attachmentRepo.getDownloadMetadata(
        parseInt(blobId),
        req.user!.tenant_id
      )

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      // Download file from Azure
      const fileBuffer = await attachmentService.downloadFromAzure(attachment.blob_url!)

      // REPOSITORY USED HERE (Query 3 eliminated)
      await attachmentRepo.incrementDownloadCount(parseInt(blobId))

      // Set response headers
      res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream')
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.original_filename || attachment.file_name}"`)
      res.setHeader('Content-Length', fileBuffer.length)

      res.send(fileBuffer)
    } catch (error: unknown) {
      logger.error('Download error:', error)
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

      // REPOSITORY USED HERE (Query 4 eliminated)
      const blobUrl = await attachmentRepo.getBlobUrl(
        parseInt(blobId),
        req.user!.tenant_id
      )

      if (!blobUrl) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      const sasUrl = await attachmentService.getFileSasUrl(
        blobUrl,
        parseInt(expiryMinutes as string)
      )

      res.json({
        sasUrl,
        expiresIn: `${expiryMinutes} minutes`
      })
    } catch (error: unknown) {
      logger.error('SAS URL generation error:', error)
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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'DELETE', resourceType: 'attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { blobId } = req.params

      // REPOSITORY USED HERE (Query 5 eliminated)
      const blobUrl = await attachmentRepo.getBlobUrl(
        parseInt(blobId),
        req.user!.tenant_id
      )

      if (!blobUrl) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      // Delete from Azure
      await attachmentService.deleteFromAzure(blobUrl)

      // REPOSITORY USED HERE (Query 6 eliminated)
      await attachmentRepo.deleteAttachment(parseInt(blobId), req.user!.tenant_id)

      res.json({ message: 'Attachment deleted successfully' })
    } catch (error: unknown) {
      logger.error('Delete error:', error)
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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'teams_file' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded')
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
      logger.error('Teams upload error:', error)
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
      logger.error('Teams download error:', error)
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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.single('file'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded')
      }

      const { messageId } = req.body

      if (!messageId) {
        throw new ValidationError('Message ID is required')
      }

      const result = await attachmentService.uploadToOutlook(messageId, req.file)

      res.status(201).json({
        message: 'Attachment added to email successfully',
        attachment: result
      })
    } catch (error: unknown) {
      logger.error('Outlook attachment error:', error)
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
  csrfProtection,
  authorize('admin', 'fleet_manager', 'dispatcher'),
  upload.array('files', 10),
  auditLog({ action: 'CREATE', resourceType: 'outlook_email' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { to, subject, body, cc, bcc } = req.body
      const files = req.files as Express.Multer.File[] || []

      if (!to || !subject || !body) {
        throw new ValidationError('Missing required fields: to, subject, body')
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
      logger.error('Send email error:', error)
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
      logger.error('Download email attachment error:', error)
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

      // REPOSITORY USED HERE (Query 7 eliminated)
      const attachments = await attachmentRepo.findWithFilters(
        req.user!.tenant_id,
        {
          communicationId,
          scanStatus: scanStatus as string,
          limit: Number(limit),
          offset
        }
      )

      // REPOSITORY USED HERE (Query 8 eliminated)
      const totalCount = await attachmentRepo.getTotalCount(req.user!.tenant_id)

      res.json({
        data: attachments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit))
        }
      })
    } catch (error: unknown) {
      logger.error('Get attachments error:', error)
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

      // REPOSITORY USED HERE (Query 9 eliminated)
      const attachment = await attachmentRepo.findByIdWithCommunication(
        parseInt(id),
        req.user!.tenant_id
      )

      if (!attachment) {
        return res.status(404).json({ error: 'Attachment not found' })
      }

      res.json(attachment)
    } catch (error: unknown) {
      logger.error('Get attachment error:', error)
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
  csrfProtection,
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
      logger.error('Cleanup error:', error)
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
      // REPOSITORY USED HERE (Query 10 eliminated)
      const stats = await attachmentRepo.getStatistics()

      // REPOSITORY USED HERE (Query 11 eliminated)
      const byType = await attachmentRepo.getStatisticsByType()

      res.json({
        summary: stats,
        by_type: byType
      })
    } catch (error: unknown) {
      logger.error('Get stats error:', error)
      res.status(500).json({
        error: 'Failed to get attachment statistics',
        details: getErrorMessage(error)
      })
    }
  }
)

export default router
