/**
 * Mobile Messaging Routes
 * API endpoints for mobile app email, SMS, and Teams messaging
 */

import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { outlookService } from '../services/outlook.service';
import teamsService from '../services/teams.service';
import pool from '../config/database';
import { z } from 'zod';
import { logger } from '../utils/logger';
import twilio from 'twilio';
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router();
router.use(authenticateJWT);

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// ============================================================================
// Email Routes
// ============================================================================

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string().min(1),
  body: z.string(),
  bodyType: z.enum(['text', 'html']).optional().default('html'),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        uri: z.string(),
        type: z.string(),
        size: z.number(),
      })
    )
    .optional(),
  importance: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  entityLinks: z
    .array(
      z.object({
        entity_type: z.string(),
        entity_id: z.string(),
        link_type: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/mobile/email/send
 * Send email from mobile app
 */
router.post(
  '/email/send',
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_email' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = sendEmailSchema.parse(req.body);

      // Send email via Outlook service
      const result = await outlookService.sendEmail({
        to: validated.to,
        cc: validated.cc,
        bcc: validated.bcc,
        subject: validated.subject,
        body: validated.body,
        bodyType: validated.bodyType,
        importance: validated.importance,
        // Note: Attachments would need to be processed and converted to base64
        attachments: validated.attachments
          ? validated.attachments.map((att) => ({
              name: att.name,
              contentType: att.type,
              contentBytes: '', // Would need to fetch and encode from URI
            }))
          : undefined,
      });

      if (result.success) {
        // Log to communications table with entity links
        if (validated.entityLinks && validated.entityLinks.length > 0) {
          const commResult = await pool.query(
            `INSERT INTO communications (
              communication_type, direction, subject, body,
              to_contact_emails, cc_emails, bcc_emails,
              created_by, communication_datetime
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING id`,
            [
              'Email',
              'Outbound',
              validated.subject,
              validated.body,
              Array.isArray(validated.to) ? validated.to : [validated.to],
              validated.cc
                ? Array.isArray(validated.cc)
                  ? validated.cc
                  : [validated.cc]
                : null,
              validated.bcc
                ? Array.isArray(validated.bcc)
                  ? validated.bcc
                  : [validated.bcc]
                : null,
              req.user!.id,
            ]
          );

          const communicationId = commResult.rows[0].id;

          // Link to entities
          for (const link of validated.entityLinks) {
            await pool.query(
              `INSERT INTO communication_entity_links (
                communication_id, entity_type, entity_id, link_type, manually_added
              ) VALUES ($1, $2, $3, $4, TRUE)`,
              [
                communicationId,
                link.entity_type,
                link.entity_id,
                link.link_type || 'Related',
              ]
            );
          }

          res.json({
            success: true,
            messageId: result.messageId,
            communicationId,
          });
        } else {
          res.json({
            success: true,
            messageId: result.messageId,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          error: result.error || 'Failed to send email',
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      logger.error('Mobile email send error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error',
      });
    }
  }
);

// ============================================================================
// SMS Routes
// ============================================================================

const sendSMSSchema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1600),
  mediaUrl: z.string().url().optional(),
  entityLinks: z
    .array(
      z.object({
        entity_type: z.string(),
        entity_id: z.string(),
        link_type: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/mobile/sms/send
 * Send SMS via Twilio
 */
router.post(
  '/sms/send',
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_sms' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = sendSMSSchema.parse(req.body);

      // Validate Twilio configuration
      if (!twilioClient || !twilioPhoneNumber) {
        return res.status(500).json({
          success: false,
          error: 'SMS service not configured',
        });
      }

      // Send SMS via Twilio
      const messageOptions: any = {
        body: validated.body,
        from: twilioPhoneNumber,
        to: validated.to,
      };

      if (validated.mediaUrl) {
        messageOptions.mediaUrl = [validated.mediaUrl];
      }

      const message = await twilioClient.messages.create(messageOptions);

      // Log to communications table
      const commResult = await pool.query(
        `INSERT INTO communications (
          communication_type, direction, body,
          to_contact_phone, from_contact_phone,
          external_message_id, status,
          created_by, communication_datetime
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id`,
        [
          'SMS',
          'Outbound',
          validated.body,
          validated.to,
          twilioPhoneNumber,
          message.sid,
          message.status,
          req.user!.id,
        ]
      );

      const communicationId = commResult.rows[0].id;

      // Link to entities
      if (validated.entityLinks && validated.entityLinks.length > 0) {
        for (const link of validated.entityLinks) {
          await pool.query(
            `INSERT INTO communication_entity_links (
              communication_id, entity_type, entity_id, link_type, manually_added
            ) VALUES ($1, $2, $3, $4, TRUE)`,
            [
              communicationId,
              link.entity_type,
              link.entity_id,
              link.link_type || 'Related',
            ]
          );
        }
      }

      res.json({
        success: true,
        messageId: message.sid,
        communicationId,
        status: message.status,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      logger.error('Mobile SMS send error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error',
      });
    }
  }
);

// ============================================================================
// Teams Routes
// ============================================================================

const sendTeamsMessageSchema = z.object({
  teamId: z.string(),
  channelId: z.string(),
  message: z.string().min(1),
  contentType: z.enum(['text', 'html']).optional().default('html'),
  mentions: z
    .array(
      z.object({
        userId: z.string(),
        displayName: z.string(),
      })
    )
    .optional(),
  attachments: z.array(z.any()).optional(),
  importance: z.enum(['normal', 'high', 'urgent']).optional(),
  entityLinks: z
    .array(
      z.object({
        entity_type: z.string(),
        entity_id: z.string(),
        link_type: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/mobile/teams/send
 * Send Teams message
 */
router.post(
  '/teams/send',
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_teams' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = sendTeamsMessageSchema.parse(req.body);

      // Send via Teams service
      const result = await teamsService.sendMessage(
        {
          teamId: validated.teamId,
          channelId: validated.channelId,
          message: validated.message,
          contentType: validated.contentType,
          mentions: validated.mentions,
          attachments: validated.attachments,
          importance: validated.importance,
        },
        req.user!.id ? parseInt(req.user!.id) : undefined,
        validated.entityLinks
      );

      res.json({
        success: true,
        messageId: result.message?.id,
        communicationId: result.communicationId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      logger.error('Mobile Teams send error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : 'Internal server error',
      });
    }
  }
);

// ============================================================================
// Template Routes
// ============================================================================

/**
 * GET /api/mobile/templates
 * Get message templates
 */
router.get(
  '/templates',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { type, category } = req.query;

      let query = `
        SELECT id, tenant_id, template_name, template_type, subject, body, active, created_at, updated_at FROM communication_templates
        WHERE is_active = TRUE
      `;
      const params: any[] = [];

      if (type) {
        params.push(type);
        query += ` AND template_type = $${params.length}`;
      }

      if (category) {
        params.push(category);
        query += ` AND template_category = $${params.length}`;
      }

      query += ` ORDER BY template_name`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        templates: result.rows,
      });
    } catch (error) {
      logger.error('Get templates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch templates',
      });
    }
  }
);

/**
 * POST /api/mobile/templates
 * Create custom template
 */
router.post(
  '/templates',
  requirePermission('communication:broadcast:global'),
  auditLog({ action: 'CREATE', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        template_name,
        template_type,
        template_category,
        subject,
        body,
        variables,
      } = req.body;

      const result = await pool.query(
        `INSERT INTO communication_templates (
          template_name, template_type, template_category,
          subject, body, variables, created_by, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        RETURNING *`,
        [
          template_name,
          template_type,
          template_category,
          subject,
          body,
          variables,
          req.user!.id,
        ]
      );

      res.status(201).json({
        success: true,
        template: result.rows[0],
      });
    } catch (error) {
      logger.error('Create template error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      });
    }
  }
);

// ============================================================================
// Contact Routes
// ============================================================================

/**
 * GET /api/mobile/contacts
 * Get contact list (drivers, technicians, managers)
 */
router.get(
  '/contacts',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'contacts' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.query;

      // Get drivers
      const driversResult = await pool.query(
        `SELECT
          id,
          first_name || ' ' || last_name as name,
          email,
          phone_number,
          'driver' as type
        FROM drivers
        WHERE tenant_id = $1 AND status = 'Active'
        ORDER BY first_name, last_name`,
        [req.user!.tenant_id]
      );

      // Get managers/users
      const usersResult = await pool.query(
        `SELECT
          d.id,
          d.first_name || ' ' || d.last_name as name,
          d.email,
          d.phone_number,
          'manager' as type
        FROM drivers d
        WHERE d.tenant_id = $1
          AND d.status = 'Active'
          AND EXISTS (
            SELECT 1 FROM driver_roles dr
            WHERE dr.driver_id = d.id
            AND dr.role IN ('fleet_manager', 'dispatcher', 'admin')
          )
        ORDER BY d.first_name, d.last_name`,
        [req.user!.tenant_id]
      );

      let contacts = [...driversResult.rows, ...usersResult.rows];

      // Filter by type if specified
      if (type) {
        contacts = contacts.filter((c) => c.type === type);
      }

      res.json({
        success: true,
        contacts,
      });
    } catch (error) {
      logger.error('Get contacts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch contacts',
      });
    }
  }
);

// ============================================================================
// Delivery Status Routes
// ============================================================================

/**
 * GET /api/mobile/status/:type/:messageId
 * Get delivery status for a message
 */
router.get(
  '/status/:type/:messageId',
  requirePermission('communication:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { type, messageId } = req.params;

      if (type === 'sms') {
        // Get SMS status from Twilio
        const message = await twilioClient.messages(messageId).fetch();

        res.json({
          success: true,
          status: {
            messageId,
            type: 'sms',
            status: message.status,
            timestamp: message.dateUpdated || message.dateSent,
            error: message.errorMessage || undefined,
          },
        });
      } else if (type === 'email' || type === 'teams') {
        // Get status from communications table
        const result = await pool.query(
          `SELECT status, communication_datetime, error_message
          FROM communications
          WHERE external_message_id = $1',
          [messageId]
        );

        if (result.rows.length > 0) {
          const comm = result.rows[0];
          res.json({
            success: true,
            status: {
              messageId,
              type,
              status: comm.status || 'sent',
              timestamp: comm.communication_datetime,
              error: comm.error_message || undefined,
            },
          });
        } else {
          res.status(404).json({
            success: false,
            error: 'Message not found',
          });
        }
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid message type',
        });
      }
    } catch (error) {
      logger.error('Get delivery status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch delivery status',
      });
    }
  }
);

export default router;
