/**
 * Scheduling Notifications Routes
 * API endpoints for managing scheduling notification preferences
 */

import express, { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { csrfProtection } from '../middleware/csrf';
import { SchedulingNotificationRepository } from '../repositories/scheduling-notification.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';

const router = express.Router();
const schedulingNotificationRepository = new SchedulingNotificationRepository();
const tenantRepository = new TenantRepository();
const userRepository = new UserRepository();

/**
 * GET /api/scheduling-notifications/preferences
 * Get user's notification preferences for scheduling
 */
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const tenantId = await userRepository.getTenantIdByUserId(userId);

    const prefs = await schedulingNotificationRepository.getPreferencesByUserIdAndTenantId(userId, tenantId);

    if (!prefs) {
      // Return default preferences
      return res.json({
        success: true,
        preferences: {
          userId,
          emailEnabled: true,
          smsEnabled: false,
          teamsEnabled: true,
          reminderTimes: [24, 1],
          quietHoursStart: null,
          quietHoursEnd: null,
          createdAt: null,
          updatedAt: null
        }
      });
    }

    res.json({
      success: true,
      preferences: {
        userId: prefs.user_id,
        emailEnabled: prefs.email_enabled,
        smsEnabled: prefs.sms_enabled,
        teamsEnabled: prefs.teams_enabled,
        reminderTimes: prefs.reminder_times || [24, 1],
        quietHoursStart: prefs.quiet_hours_start,
        quietHoursEnd: prefs.quiet_hours_end,
        createdAt: prefs.created_at,
        updatedAt: prefs.updated_at
      }
    });
  } catch (error) {
    logger.error(`Error fetching notification preferences`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
});

/**
 * PUT /api/scheduling-notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const tenantId = await userRepository.getTenantIdByUserId(userId);
    const {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd
    } = req.body;

    // Validate reminder times
    if (reminderTimes && !Array.isArray(reminderTimes)) {
      return res.status(400).json({
        success: false,
        error: 'reminderTimes must be an array of numbers'
      });
    }

    if (reminderTimes) {
      for (const time of reminderTimes) {
        if (typeof time !== 'number' || time < 0 || time > 168) {
          return res.status(400).json({
            success: false,
            error: 'Reminder times must be numbers between 0 and 168 (hours)'
          });
        }
      }
    }

    // Validate quiet hours format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (quietHoursStart && !timeRegex.test(quietHoursStart)) {
      return res.status(400).json({
        success: false,
        error: 'quietHoursStart must be in HH:MM format'
      });
    }

    if (quietHoursEnd && !timeRegex.test(quietHoursEnd)) {
      return res.status(400).json({
        success: false,
        error: 'quietHoursEnd must be in HH:MM format'
      });
    }

    await schedulingNotificationRepository.updateNotificationPreferences(userId, tenantId, {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd
    });

    // Fetch updated preferences
    const prefs = await schedulingNotificationRepository.getPreferencesByUserIdAndTenantId(userId, tenantId);

    logger.info(`Notification preferences updated`, { userId });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: {
        userId: prefs.user_id,
        emailEnabled: prefs.email_enabled,
        smsEnabled: prefs.sms_enabled,
        teamsEnabled: prefs.teams_enabled,
        reminderTimes: prefs.reminder_times,
        quietHoursStart: prefs.quiet_hours_start,
        quietHoursEnd: prefs.quiet_hours_end,
        updatedAt: prefs.updated_at
      }
    });
  } catch (error) {
    logger.error('Error updating notification preferences', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
});

/**
 * POST /api/scheduling-notifications/test
 * Send a test notification
 */
router.post('/test', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;
    const tenantId = await userRepository.getTenantIdByUserId(userId);
    const { notificationType } = req.body;

    await schedulingNotificationRepository.sendTestNotification(userId, tenantId, notificationType);

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    logger.error('Error sending test notification', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
});

export default router;