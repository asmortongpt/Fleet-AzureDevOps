/**
 * Outlook Email Integration Routes
 * REST API endpoints for full email management via Microsoft Graph API
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { outlookService } from '../services/outlook.service'
import { z } from 'zod'
import { logger } from '../utils/logger'
import { getErrorMessage } from '../utils/error-handler'
import {
  SendEmailRequest,
  ReplyEmailRequest,
  ForwardEmailRequest,
  UpdateEmailRequest,
  CreateFolderRequest,
  CategorizeEmailRequest
} from '../types/outlook.types'

const router = express.Router()

// All routes require authentication
router.use(authenticateJWT)

// ============================================================================
// Send Email
// ============================================================================

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(500),
  body: z.string(),
  bodyType: z.enum(['text', 'html']).optional().default('html'),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  importance: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  attachments: z.array(z.object({
    name: z.string(),
    contentType: z.string(),
    contentBytes: z.string(), // Base64 encoded
    isInline: z.boolean().optional(),
    contentId: z.string().optional()
  })).optional(),
  replyTo: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  isDeliveryReceiptRequested: z.boolean().optional(),
  isReadReceiptRequested: z.boolean().optional(),
  saveToSentItems: z.boolean().optional().default(true),
  userId: z.string().email().optional() // Optional: send from specific user
})

router.post(
  '/send',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_email' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = sendEmailSchema.parse(req.body)
      const { userId, ...emailRequest } = validated
      const result = await outlookService.sendEmail(emailRequest as SendEmailRequest, userId)

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'Email sent successfully',
          messageId: result.messageId
        })
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email'
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Send email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// List Emails
// ============================================================================

router.get(
  '/messages',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_messages' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        folderId,
        filter,
        search,
        orderBy,
        select,
        top = '50',
        skip = '0',
        includeAttachments,
        userId
      } = req.query

      const request = {
        folderId: folderId as string,
        filter: filter as string,
        search: search as string,
        orderBy: orderBy as string,
        select: select ? (select as string).split(',') : undefined,
        top: parseInt(top as string),
        skip: parseInt(skip as string),
        includeAttachments: includeAttachments === 'true'
      }

      const result = await outlookService.getEmails(request, userId as string)

      res.json({
        success: true,
        data: result.value,
        pagination: {
          count: result.value.length,
          total: result['@odata.count'],
          hasMore: !!result['@odata.nextLink'],
          nextLink: result['@odata.nextLink']
        }
      })
    } catch (error) {
      logger.error('Get emails error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Get Single Email
// ============================================================================

router.get(
  '/messages/:messageId',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const { userId } = req.query

      const email = await outlookService.getEmail(messageId, userId as string)

      res.json({
        success: true,
        data: email
      })
    } catch (error) {
      logger.error('Get email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Reply to Email
// ============================================================================

const replyEmailSchema = z.object({
  body: z.string().min(1),
  bodyType: z.enum(['text', 'html']).optional().default('html'),
  replyAll: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    name: z.string(),
    contentType: z.string(),
    contentBytes: z.string(),
    isInline: z.boolean().optional(),
    contentId: z.string().optional()
  })).optional(),
  userId: z.string().email().optional()
})

router.post(
  '/messages/:messageId/reply',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_reply' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const validated = replyEmailSchema.parse(req.body)
      const { userId, ...replyRequest } = validated

      await outlookService.replyToEmail(messageId, replyRequest as ReplyEmailRequest, userId)

      res.json({
        success: true,
        message: 'Reply sent successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Reply email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Forward Email
// ============================================================================

const forwardEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  body: z.string().optional(),
  bodyType: z.enum(['text', 'html']).optional().default('html'),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  attachments: z.array(z.object({
    name: z.string(),
    contentType: z.string(),
    contentBytes: z.string(),
    isInline: z.boolean().optional(),
    contentId: z.string().optional()
  })).optional(),
  userId: z.string().email().optional()
})

router.post(
  '/messages/:messageId/forward',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_forward' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const validated = forwardEmailSchema.parse(req.body)
      const { userId, ...forwardRequest } = validated

      await outlookService.forwardEmail(messageId, forwardRequest as ForwardEmailRequest, userId)

      res.json({
        success: true,
        message: 'Email forwarded successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Forward email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Update Email (read status, categories, importance, flag)
// ============================================================================

const updateEmailSchema = z.object({
  isRead: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  importance: z.enum(['low', 'normal', 'high']).optional(),
  flag: z.object({
    flagStatus: z.enum(['notFlagged', 'complete', 'flagged']),
    dueDateTime: z.string().optional(),
    startDateTime: z.string().optional()
  }).optional(),
  userId: z.string().email().optional()
})

router.patch(
  '/messages/:messageId',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'UPDATE', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const validated = updateEmailSchema.parse(req.body)
      const { userId, ...updateData } = validated

      const updatedEmail = await outlookService.updateEmail(messageId, updateData as UpdateEmailRequest, userId)

      res.json({
        success: true,
        message: 'Email updated successfully',
        data: updatedEmail
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Update email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Move Email to Folder
// ============================================================================

router.post(
  '/messages/:messageId/move',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'UPDATE', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const { destinationFolderId, userId } = req.body

      if (!destinationFolderId) {
        return res.status(400).json({
          success: false,
          error: 'destinationFolderId is required'
        })
      }

      const movedEmail = await outlookService.moveEmail(messageId, destinationFolderId, userId)

      res.json({
        success: true,
        message: 'Email moved successfully',
        data: movedEmail
      })
    } catch (error) {
      logger.error('Move email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Delete Email
// ============================================================================

router.delete(
  '/messages/:messageId',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'DELETE', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const { userId, permanent } = req.query

      await outlookService.deleteEmail(messageId, userId as string, permanent === 'true')

      res.json({
        success: true,
        message: 'Email deleted successfully'
      })
    } catch (error) {
      logger.error('Delete email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Mark as Read/Unread
// ============================================================================

router.post(
  '/messages/:messageId/read',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'UPDATE', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const { isRead = true, userId } = req.body

      await outlookService.markAsRead(messageId, isRead, userId)

      res.json({
        success: true,
        message: `Email marked as ${isRead ? 'read' : 'unread'}`
      })
    } catch (error) {
      logger.error('Mark as read error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// List Mail Folders
// ============================================================================

router.get(
  '/folders',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_folders' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId, includeChildFolders } = req.query

      const result = await outlookService.getFolders(
        userId as string,
        includeChildFolders === 'true'
      )

      res.json({
        success: true,
        data: result.value
      })
    } catch (error) {
      logger.error('Get folders error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Create Mail Folder
// ============================================================================

const createFolderSchema = z.object({
  displayName: z.string().min(1).max(255),
  parentFolderId: z.string().optional(),
  isHidden: z.boolean().optional().default(false),
  userId: z.string().email().optional()
})

router.post(
  '/folders',
  authorize('admin', 'fleet_manager'),
  auditLog({ action: 'CREATE', resourceType: 'outlook_folder' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = createFolderSchema.parse(req.body)
      const { userId, ...folderData } = validated

      const folder = await outlookService.createFolder(folderData as CreateFolderRequest, userId)

      res.status(201).json({
        success: true,
        message: 'Folder created successfully',
        data: folder
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Create folder error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Get Email Attachments
// ============================================================================

router.get(
  '/messages/:messageId/attachments',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_attachments' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const { userId } = req.query

      const attachments = await outlookService.getAttachments(messageId, userId as string)

      res.json({
        success: true,
        data: attachments
      })
    } catch (error) {
      logger.error('Get attachments error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Download Attachment
// ============================================================================

router.get(
  '/messages/:messageId/attachments/:attachmentId',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_attachment' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId, attachmentId } = req.params
      const { userId } = req.query

      const attachment = await outlookService.downloadAttachment(
        messageId,
        attachmentId,
        userId as string
      )

      res.json({
        success: true,
        data: attachment
      })
    } catch (error) {
      logger.error('Download attachment error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Search Emails
// ============================================================================

router.get(
  '/search',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'READ', resourceType: 'outlook_search' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        query,
        folderId,
        top = '50',
        skip = '0',
        orderBy,
        userId
      } = req.query

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        })
      }

      const request = {
        query: query as string,
        folderId: folderId as string,
        top: parseInt(top as string),
        skip: parseInt(skip as string),
        orderBy: orderBy as string
      }

      const result = await outlookService.searchEmails(request, userId as string)

      res.json({
        success: true,
        data: result.value,
        pagination: {
          count: result.value.length,
          total: result['@odata.count'],
          hasMore: !!result['@odata.nextLink'],
          nextLink: result['@odata.nextLink']
        }
      })
    } catch (error) {
      logger.error('Search emails error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Categorize Email
// ============================================================================

const categorizeEmailSchema = z.object({
  categories: z.array(z.string()).min(1),
  replace: z.boolean().optional().default(false),
  userId: z.string().email().optional()
})

router.post(
  '/messages/:messageId/categories',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  auditLog({ action: 'UPDATE', resourceType: 'outlook_message' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { messageId } = req.params
      const validated = categorizeEmailSchema.parse(req.body)
      const { userId, ...categorizeData } = validated

      await outlookService.categorizeEmail(messageId, categorizeData as CategorizeEmailRequest, userId)

      res.json({
        success: true,
        message: 'Email categorized successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        })
      }

      logger.error('Categorize email error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

// ============================================================================
// Health Check / Status
// ============================================================================

router.get(
  '/status',
  authorize('admin', 'fleet_manager', 'dispatcher'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { microsoftGraphService } = await import('../services/microsoft-graph.service')
      const configStatus = microsoftGraphService.getConfigStatus()

      res.json({
        success: true,
        configured: configStatus.configured,
        missing: configStatus.missing,
        service: 'Microsoft Graph API',
        version: 'v1.0'
      })
    } catch (error) {
      logger.error('Status check error:', error)
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error'
      })
    }
  }
)

export default router
