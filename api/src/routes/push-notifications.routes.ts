/**
 * Push Notifications Routes
 * API endpoints for mobile push notification management
 */

import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { pushNotificationService } from '../services/push-notification.service';

const router = express.Router();

/**
 * POST /api/push-notifications/register-device
 * Register a mobile device for push notifications
 */
router.post('/register-device', authenticateJWT, requirePermission('communication:send:global'), async (req, res) => {
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
 * DELETE /api/push-notifications/device/:deviceId
 * Unregister a mobile device
 */
router.delete('/device/:deviceId', authenticateJWT, requirePermission('communication:send:global'), async (req, res) => {
  try {
    const { deviceId } = req.params;

    const success = await pushNotificationService.unregisterDevice(deviceId);

    res.json({
      success,
      message: success ? 'Device unregistered successfully' : 'Failed to unregister device',
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister device',
    });
  }
});

/**
 * POST /api/push-notifications/send
 * Send a push notification to specific recipients
 */
router.post('/send', authenticateJWT, requirePermission('communication:send:global'), async (req, res) => {
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
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
    });
  }
});

/**
 * POST /api/push-notifications/send-bulk
 * Send a push notification to multiple users
 */
router.post('/send-bulk', authenticateJWT, requirePermission('communication:broadcast:global'), async (req, res) => {
  try {
    const {
      userIds,
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

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs array is required',
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

    const notificationId = await pushNotificationService.sendBulkNotification(
      notification,
      userIds
    );

    res.json({
      success: true,
      data: {
        notificationId,
        recipientCount: userIds.length,
      },
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notification',
    });
  }
});

/**
 * POST /api/push-notifications/schedule
 * Schedule a notification for future delivery
 */
router.post('/schedule', authenticateJWT, requirePermission('communication:send:global'), async (req, res) => {
  try {
    const {
      recipients,
      scheduledFor,
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

    if (!scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled time is required',
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

    const notificationId = await pushNotificationService.scheduleNotification(
      notification,
      recipients,
      new Date(scheduledFor)
    );

    res.json({
      success: true,
      data: {
        notificationId,
        recipientCount: recipients.length,
        scheduledFor,
      },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule notification',
    });
  }
});

/**
 * POST /api/push-notifications/send-from-template
 * Send notification from a template
 */
router.post('/send-from-template', authenticateJWT, requirePermission('communication:send:global'), async (req, res) => {
  try {
    const { templateName, recipients, variables } = req.body;

    if (!templateName) {
      return res.status(400).json({
        success: false,
        error: 'Template name is required',
      });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required',
      });
    }

    // Create notification from template
    const notification = await pushNotificationService.createFromTemplate(
      templateName,
      req.user.tenantId,
      variables || {}
    );

    notification.createdBy = req.user.id;

    // Send notification
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
    });
  } catch (error) {
    console.error('Error sending from template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification from template',
    });
  }
});

/**
 * GET /api/push-notifications/history
 * Get notification history with filters
 */
router.get('/history', authenticateJWT, requirePermission('communication:view:global'), async (req, res) => {
  try {
    const {
      category,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const filters: any = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (category) filters.category = category;
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const history = await pushNotificationService.getNotificationHistory(
      req.user.tenantId,
      filters
    );

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
    console.error('Error getting notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification history',
    });
  }
});

/**
 * GET /api/push-notifications/stats
 * Get delivery statistics
 */
router.get('/stats', authenticateJWT, requirePermission('communication:view:global'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string),
      };
    }

    const stats = await pushNotificationService.getDeliveryStats(
      req.user.tenantId,
      dateRange
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get delivery statistics',
    });
  }
});

/**
 * GET /api/push-notifications/templates
 * Get notification templates
 */
router.get('/templates', authenticateJWT, requirePermission('communication:view:global'), async (req, res) => {
  try {
    const { category } = req.query;

    const templates = await pushNotificationService.getTemplates(
      req.user.tenantId,
      category as string
    );

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates',
    });
  }
});

/**
 * PUT /api/push-notifications/:id/opened
 * Track notification opened
 */
router.put('/:id/opened', authenticateJWT, requirePermission('communication:view:global'), async (req, res) => {
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
 * PUT /api/push-notifications/:id/clicked
 * Track notification clicked with action
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

/**
 * POST /api/push-notifications/test
 * Send a test notification (for development)
 */
router.post('/test', authenticateJWT, async (req, res) => {
  try {
    const notification = {
      tenantId: req.user.tenantId,
      notificationType: 'test',
      category: 'administrative' as const,
      priority: 'normal' as const,
      title: 'Test Notification',
      message: 'This is a test push notification from Fleet Management System',
      dataPayload: { test: true },
      actionButtons: [
        { id: 'acknowledge', title: 'Got It' },
        { id: 'dismiss', title: 'Dismiss' },
      ],
      createdBy: req.user.id,
    };

    const notificationId = await pushNotificationService.sendNotification(
      notification,
      [{ userId: req.user.id }]
    );

    res.json({
      success: true,
      data: {
        notificationId,
        message: 'Test notification sent',
      },
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
});

export default router;
