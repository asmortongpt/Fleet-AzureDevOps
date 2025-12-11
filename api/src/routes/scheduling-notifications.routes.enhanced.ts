Here's the complete refactored file with the `pool.query` replaced by the repository pattern:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { z } from 'zod';
import { authenticate, rateLimiter } from '../middleware';
import { logger } from '../utils/logger';
import { validateSchema } from '../utils/validateSchema';
import { csrfProtection } from '../middleware/csrf';

// Import the repository
import { SchedulingNotificationPreferencesRepository } from '../repositories/SchedulingNotificationPreferencesRepository';

const router = express.Router();

const preferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  teamsEnabled: z.boolean(),
  reminderTimes: z.array(z.number().min(0).max(168)),
  quietHoursStart: z
    .string()
    .optional()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  quietHoursEnd: z
    .string()
    .optional()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
});

router.use(authenticate);
router.use(rateLimiter({ windowMs: 60 * 1000, max: 100 }));

/**
 * GET /api/scheduling-notifications/preferences
 * Get user's notification preferences for scheduling
 */
router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const tenantId = req.user!.tenant_id;

    // Use the repository to get preferences
    const repository = container.resolve(SchedulingNotificationPreferencesRepository);
    const prefs = await repository.getPreferences(userId, tenantId);

    if (!prefs) {
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
          updatedAt: null,
        },
      });
    }

    res.json({
      success: true,
      preferences: {
        userId: prefs.userId,
        emailEnabled: prefs.emailEnabled,
        smsEnabled: prefs.smsEnabled,
        teamsEnabled: prefs.teamsEnabled,
        reminderTimes: prefs.reminderTimes || [24, 1],
        quietHoursStart: prefs.quietHoursStart,
        quietHoursEnd: prefs.quietHoursEnd,
        createdAt: prefs.createdAt,
        updatedAt: prefs.updatedAt,
      },
    });
  })
);

/**
 * PUT /api/scheduling-notifications/preferences
 * Update user's notification preferences
 */
router.put(
  '/preferences',
  csrfProtection,
  validateSchema(preferencesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd,
    } = req.body;

    // Use the repository to update preferences
    const repository = container.resolve(SchedulingNotificationPreferencesRepository);
    await repository.updatePreferences(userId, {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd,
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    });
  })
);

export default router;


And here's the implementation of the `SchedulingNotificationPreferencesRepository` class:


// File: src/repositories/SchedulingNotificationPreferencesRepository.ts

import { pool } from '../database';
import { container } from '../container';

export interface SchedulingNotificationPreferences {
  userId: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  teamsEnabled: boolean;
  reminderTimes: number[];
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export class SchedulingNotificationPreferencesRepository {
  async getPreferences(userId: number, tenantId: number): Promise<SchedulingNotificationPreferences | null> {
    const result = await pool.query(
      `SELECT
        id,
        user_id,
        email_enabled,
        sms_enabled,
        teams_enabled,
        reminder_times,
        quiet_hours_start,
        quiet_hours_end,
        created_at,
        updated_at
      FROM scheduling_notification_preferences
      WHERE tenant_id = $1 AND user_id = $2`,
      [tenantId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const prefs = result.rows[0];
    return {
      userId: prefs.user_id,
      emailEnabled: prefs.email_enabled,
      smsEnabled: prefs.sms_enabled,
      teamsEnabled: prefs.teams_enabled,
      reminderTimes: prefs.reminder_times || [],
      quietHoursStart: prefs.quiet_hours_start,
      quietHoursEnd: prefs.quiet_hours_end,
      createdAt: prefs.created_at,
      updatedAt: prefs.updated_at,
    };
  }

  async updatePreferences(userId: number, preferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    teamsEnabled: boolean;
    reminderTimes: number[];
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }): Promise<void> {
    const { emailEnabled, smsEnabled, teamsEnabled, reminderTimes, quietHoursStart, quietHoursEnd } = preferences;

    await pool.query(
      `INSERT INTO scheduling_notification_preferences (
        user_id,
        email_enabled,
        sms_enabled,
        teams_enabled,
        reminder_times,
        quiet_hours_start,
        quiet_hours_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        sms_enabled = EXCLUDED.sms_enabled,
        teams_enabled = EXCLUDED.teams_enabled,
        reminder_times = EXCLUDED.reminder_times,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        updated_at = NOW()`,
      [userId, emailEnabled, smsEnabled, teamsEnabled, reminderTimes, quietHoursStart, quietHoursEnd]
    );
  }
}


This refactored version replaces the direct database queries with calls to the `SchedulingNotificationPreferencesRepository` class. The repository encapsulates the data access logic, making the code more modular and easier to maintain. The main router file now uses dependency injection to resolve the repository instance, promoting better separation of concerns and testability.