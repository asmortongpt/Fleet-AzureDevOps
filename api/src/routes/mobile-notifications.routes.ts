/**
 * Mobile Notifications Routes
 * API endpoints for mobile app notification management
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { pushNotificationService } from '../services/push-notification.service';
import { smsService } from '../services/sms.service';

const router = express.Router();

// ============================================================================
// Device Registration
// ============================================================================

/**
 * POST /api/mobile/notifications/register-device
 * Register FCM token for mobile device
 */
router.post('/register-device', authenticateJWT, async (req, res) => {
  try {
    const {
      deviceToken,
      platform,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
    } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        error: 'Device token and platform are required',
      });
    }

    if (!['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Platform must be either "ios" or "android"',
      });
    }

    const device = await pushNotificationService.registerDevice({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      deviceToken,
      platform,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
    });

    res.json({
      success: true,
      data: device,
      message: 'Device registered successfully',
    });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register device',
    });
  }
});

/**
 * DELETE /api/mobile/notifications/device/:deviceId
 * Unregister mobile device
 */
router.delete('/device/:deviceId', authenticateJWT, async (req, res) => {
  try {
    const { deviceId } = req.params;

    const success = await pushNotificationService.unregisterDevice(deviceId);

    res.json({
      success,
      message: success
        ? 'Device unregistered successfully'
        : 'Failed to unregister device',
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister device',
    });
  }
});

// ============================================================================
// Push Notifications
// ============================================================================

/**
 * POST /api/mobile/notifications/send
 * Send push notification
 */
router.post(
  '/send',
  authenticateJWT,
  requirePermission('communication:send:global'),
  async (req, res) => {
    try {
      const {
        recipients,
        notificationType,
        category,
        priority,
        title,
        message,
        dataPayload,
        actionButtons,
        imageUrl,
        sound,
        badgeCount,
      } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipients array is required',
        });
      }

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          error: 'Title and message are required',
        });
      }

      const notification = {
        tenantId: req.user.tenantId,
        notificationType: notificationType || 'general',
        category: category || 'administrative',
        priority: priority || 'normal',
        title,
        message,
        dataPayload,
        actionButtons,
        imageUrl,
        sound,
        badgeCount,
        createdBy: req.user.id,
      };

      const notificationId = await pushNotificationService.sendNotification(
        notification,
        recipients
      );

      res.json({
        success: true,
        data: {
          notificationId,
          recipientCount: recipients.length,
        },
        message: 'Notification sent successfully',
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send notification',
      });
    }
  }
);

/**
 * POST /api/mobile/notifications/send-to-user
 * Send notification to specific user
 */
router.post('/send-to-user', authenticateJWT, async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      type,
      category,
      priority,
      data,
      screen,
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, and message are required',
      });
    }

    const notification = {
      tenantId: req.user.tenantId,
      notificationType: type || 'general',
      category: category || 'administrative',
      priority: priority || 'normal',
      title,
      message,
      dataPayload: {
        ...data,
        screen,
      },
      createdBy: req.user.id,
    };

    const notificationId = await pushNotificationService.sendNotification(
      notification,
      [{ userId }]
    );

    res.json({
      success: true,
      data: { notificationId },
      message: 'Notification sent to user',
    });
  } catch (error) {
    console.error('Error sending notification to user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
});

/**
 * GET /api/mobile/notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences', authenticateJWT, async (req, res) => {
  try {
    // TODO: Implement notification preferences
    // For now, return default preferences
    res.json({
      success: true,
      data: {
        pushEnabled: true,
        smsEnabled: true,
        categories: {
          critical_alert: true,
          maintenance_reminder: true,
          task_assignment: true,
          driver_alert: true,
          administrative: true,
          performance: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      },
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences',
    });
  }
});

/**
 * PUT /api/mobile/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences', authenticateJWT, async (req, res) => {
  try {
    const preferences = req.body;

    // TODO: Save preferences to database
    // For now, just acknowledge
    res.json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
    });
  }
});

// ============================================================================
// SMS Notifications
// ============================================================================

/**
 * POST /api/mobile/notifications/sms/send
 * Send SMS message
 */
router.post(
  '/sms/send',
  authenticateJWT,
  requirePermission('communication:send:global'),
  async (req, res) => {
    try {
      const { to, message, mediaUrl } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: 'Phone number and message are required',
        });
      }

      const messageSid = await smsService.sendSMS(
        {
          to,
          body: message,
          mediaUrl,
        },
        req.user.tenantId,
        req.user.id
      );

      res.json({
        success: true,
        data: { messageSid },
        message: 'SMS sent successfully',
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS',
      });
    }
  }
);

/**
 * POST /api/mobile/notifications/sms/send-bulk
 * Send bulk SMS messages
 */
router.post(
  '/sms/send-bulk',
  authenticateJWT,
  requirePermission('communication:broadcast:global'),
  async (req, res) => {
    try {
      const { recipients, message, mediaUrl } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipients array is required',
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }

      const results = await smsService.sendBulkSMS(
        {
          recipients,
          body: message,
          mediaUrl,
        },
        req.user.tenantId,
        req.user.id
      );

      res.json({
        success: true,
        data: results,
        message: `Sent ${results.successful} messages, ${results.failed} failed`,
      });
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send bulk SMS',
      });
    }
  }
);

/**
 * POST /api/mobile/notifications/sms/send-from-template
 * Send SMS from template
 */
router.post(
  '/sms/send-from-template',
  authenticateJWT,
  requirePermission('communication:send:global'),
  async (req, res) => {
    try {
      const { templateName, to, variables } = req.body;

      if (!templateName || !to) {
        return res.status(400).json({
          success: false,
          error: 'Template name and phone number are required',
        });
      }

      const messageSid = await smsService.sendFromTemplate(
        templateName,
        req.user.tenantId,
        to,
        variables || {},
        req.user.id
      );

      res.json({
        success: true,
        data: { messageSid },
        message: 'SMS sent from template',
      });
    } catch (error) {
      console.error('Error sending from template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS from template',
      });
    }
  }
);

/**
 * GET /api/mobile/notifications/sms/history
 * Get SMS history
 */
router.get(
  '/sms/history',
  authenticateJWT,
  requirePermission('communication:view:global'),
  async (req, res) => {
    try {
      const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;

      const filters: any = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const history = await smsService.getSMSHistory(req.user.tenantId, filters);

      res.json({
        success: true,
        data: history,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: history.length,
        },
      });
    } catch (error) {
      console.error('Error getting SMS history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SMS history',
      });
    }
  }
);

/**
 * GET /api/mobile/notifications/sms/templates
 * Get SMS templates
 */
router.get(
  '/sms/templates',
  authenticateJWT,
  requirePermission('communication:view:global'),
  async (req, res) => {
    try {
      const { category } = req.query;

      const templates = await smsService.getTemplates(
        req.user.tenantId,
        category as string
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      console.error('Error getting SMS templates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SMS templates',
      });
    }
  }
);

/**
 * POST /api/mobile/notifications/sms/templates
 * Create SMS template
 */
router.post(
  '/sms/templates',
  authenticateJWT,
  requirePermission('communication:manage:global'),
  async (req, res) => {
    try {
      const { name, body, category, variables } = req.body;

      if (!name || !body) {
        return res.status(400).json({
          success: false,
          error: 'Name and body are required',
        });
      }

      const templateId = await smsService.createTemplate({
        tenantId: req.user.tenantId,
        name,
        body,
        category: category || 'general',
        variables,
      });

      res.json({
        success: true,
        data: { templateId },
        message: 'Template created successfully',
      });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
      });
    }
  }
);

/**
 * GET /api/mobile/notifications/sms/stats
 * Get SMS statistics
 */
router.get(
  '/sms/stats',
  authenticateJWT,
  requirePermission('communication:view:global'),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let dateRange;
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }

      const stats = await smsService.getStatistics(req.user.tenantId, dateRange);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error getting SMS statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SMS statistics',
      });
    }
  }
);

// ============================================================================
// Webhooks
// ============================================================================

/**
 * POST /api/mobile/notifications/webhooks/twilio
 * Handle Twilio delivery status webhooks
 */
router.post('/webhooks/twilio', async (req, res) => {
  try {
    await smsService.handleWebhook(req.body);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    res.status(500).send('Error');
  }
});

// ============================================================================
// Notification Tracking
// ============================================================================

/**
 * PUT /api/mobile/notifications/:id/opened
 * Track notification opened
 */
router.put('/:id/opened', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;

    await pushNotificationService.trackNotificationOpened(id);

    res.json({
      success: true,
      message: 'Notification open tracked',
    });
  } catch (error) {
    console.error('Error tracking notification open:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track notification open',
    });
  }
});

/**
 * PUT /api/mobile/notifications/:id/clicked
 * Track notification action clicked
 */
router.put('/:id/clicked', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    await pushNotificationService.trackNotificationClicked(id, action);

    res.json({
      success: true,
      message: 'Notification click tracked',
    });
  } catch (error) {
    console.error('Error tracking notification click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track notification click',
    });
  }
});

export default router;
