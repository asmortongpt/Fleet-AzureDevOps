Here's the refactored version of `mobile-messaging.routes.ts` where all `pool.query` and `db.query` calls have been replaced with repository methods. I've assumed the existence of a `CommunicationRepository` class with appropriate methods. The complete file is provided below:


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
import { z } from 'zod';
import { logger } from '../utils/logger';
import twilio from 'twilio';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';

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
  csrfProtection,
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_email' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
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
        const communicationRepository = container.resolve('CommunicationRepository');
        const commResult = await communicationRepository.createCommunication({
          communicationType: 'Email',
          direction: 'Outbound',
          subject: validated.subject,
          body: validated.body,
          toContactEmails: Array.isArray(validated.to) ? validated.to : [validated.to],
          ccEmails: validated.cc
            ? Array.isArray(validated.cc)
              ? validated.cc
              : [validated.cc]
            : null,
          bccEmails: validated.bcc
            ? Array.isArray(validated.bcc)
              ? validated.bcc
              : [validated.bcc]
            : null,
          createdBy: req.user.id,
          communicationDatetime: new Date(),
          entityLinks: validated.entityLinks,
        });

        res.status(201).json({ message: 'Email sent successfully', communicationId: commResult.id });
      } else {
        res.status(201).json({ message: 'Email sent successfully' });
      }
    } else {
      throw new Error('Failed to send email');
    }
  })
);

// ============================================================================
// SMS Routes
// ============================================================================

const sendSMSSchema = z.object({
  to: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  body: z.string().min(1),
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
 * Send SMS from mobile app
 */
router.post(
  '/sms/send',
  csrfProtection,
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_sms' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = sendSMSSchema.parse(req.body);

    try {
      const message = await twilioClient.messages.create({
        body: validated.body,
        from: twilioPhoneNumber,
        to: validated.to,
      });

      if (message.sid) {
        // Log to communications table with entity links
        const communicationRepository = container.resolve('CommunicationRepository');
        const commResult = await communicationRepository.createCommunication({
          communicationType: 'SMS',
          direction: 'Outbound',
          body: validated.body,
          toContactPhones: [validated.to],
          createdBy: req.user.id,
          communicationDatetime: new Date(),
          entityLinks: validated.entityLinks,
        });

        res.status(201).json({ message: 'SMS sent successfully', communicationId: commResult.id });
      } else {
        throw new Error('Failed to send SMS');
      }
    } catch (error) {
      logger.error('Error sending SMS:', error);
      throw new Error('Failed to send SMS');
    }
  })
);

// ============================================================================
// Teams Routes
// ============================================================================

const sendTeamsMessageSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1),
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
 * Send Teams message from mobile app
 */
router.post(
  '/teams/send',
  csrfProtection,
  requirePermission('communication:send:global'),
  auditLog({ action: 'CREATE', resourceType: 'mobile_teams_message' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const validated = sendTeamsMessageSchema.parse(req.body);

    try {
      const result = await teamsService.sendMessage({
        to: validated.to,
        body: validated.body,
      });

      if (result.success) {
        // Log to communications table with entity links
        const communicationRepository = container.resolve('CommunicationRepository');
        const commResult = await communicationRepository.createCommunication({
          communicationType: 'Teams',
          direction: 'Outbound',
          body: validated.body,
          toContactTeams: [validated.to],
          createdBy: req.user.id,
          communicationDatetime: new Date(),
          entityLinks: validated.entityLinks,
        });

        res.status(201).json({ message: 'Teams message sent successfully', communicationId: commResult.id });
      } else {
        throw new Error('Failed to send Teams message');
      }
    } catch (error) {
      logger.error('Error sending Teams message:', error);
      throw new Error('Failed to send Teams message');
    }
  })
);

export default router;


In this refactored version:

1. All `pool.query` calls have been replaced with calls to a `CommunicationRepository` class.
2. The `CommunicationRepository` is resolved from the dependency injection container.
3. A new `createCommunication` method is assumed to exist in the `CommunicationRepository` class, which handles the insertion of communication records into the database.
4. The `createCommunication` method is called with an object containing all the necessary data for logging the communication.
5. The response now includes the `communicationId` returned from the repository method.

Note that you'll need to implement the `CommunicationRepository` class with the `createCommunication` method to match the interface used in this refactored code. The method should handle the database insertion and return the ID of the newly created communication record.