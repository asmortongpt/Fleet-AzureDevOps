To refactor the code and replace `pool.query` with a repository pattern, we'll need to create a repository class and update the existing code to use it. Here's the complete refactored file:


/**
 * Scheduling Notifications Routes
 * API endpoints for managing scheduling notification preferences
 */

import express, { Request, Response } from 'express';
import schedulingNotificationService from '../services/scheduling-notification.service';
import { logger } from '../utils/logger';
import { csrfProtection } from '../middleware/csrf';
import { SchedulingNotificationRepository } from '../repositories/scheduling-notification.repository';

const router = express.Router();
const schedulingNotificationRepository = new SchedulingNotificationRepository();

/**
 * GET /api/scheduling-notifications/preferences
 * Get user's notification preferences for scheduling
 */
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any;

    const prefs = await schedulingNotificationRepository.getPreferencesByUserId(userId);

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

    await schedulingNotificationService.updateNotificationPreferences(userId, {
      userId,
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd
    });

    // Fetch updated preferences
    const prefs = await schedulingNotificationRepository.getPreferencesByUserId(userId);

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
    const { notificationType } = req.body;

    await schedulingNotificationService.sendTestNotification(userId, notificationType);

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


To complete this refactoring, you'll need to create a new file for the `SchedulingNotificationRepository` class. Here's an example of what that file might look like:


// File: src/repositories/scheduling-notification.repository.ts

import { pool } from '../database';

export class SchedulingNotificationRepository {
  async getPreferencesByUserId(userId: number) {
    const result = await pool.query(
      `SELECT 
        id,
        user_id,
        email_enabled,
        sms_enabled,
        push_enabled,
        schedule_changes,
        shift_reminders,
        created_at,
        updated_at 
      FROM scheduling_notification_preferences 
      WHERE user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
}


This refactoring replaces the direct use of `pool.query` with a repository method `getPreferencesByUserId`. The repository encapsulates the database query logic, making it easier to test and maintain.

Note that you may need to adjust the import paths and other dependencies based on your project structure. Also, make sure to update any other parts of your application that might be using `pool.query` directly for scheduling notification preferences to use the new repository instead.