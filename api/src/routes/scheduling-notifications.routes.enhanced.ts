To refactor the code and replace `pool.query` with a repository pattern, we'll need to create a repository class and update the existing code to use it. Here's the complete refactored file:


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


Now, we need to create the `SchedulingNotificationPreferencesRepository` class. Here's an example implementation:


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

  async updatePreferences(userId: number, preferences: Partial<SchedulingNotificationPreferences>): Promise<void> {
    const {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd,
    } = preferences;

    await pool.query(
      `UPDATE scheduling_notification_preferences 
      SET 
        email_enabled = COALESCE($2, email_enabled),
        sms_enabled = COALESCE($3, sms_enabled),
        teams_enabled = COALESCE($4, teams_enabled),
        reminder_times = COALESCE($5, reminder_times),
        quiet_hours_start = COALESCE($6, quiet_hours_start),
        quiet_hours_end = COALESCE($7, quiet_hours_end),
        updated_at = NOW() 
      WHERE user_id = $1`,
      [
        userId,
        emailEnabled,
        smsEnabled,
        teamsEnabled,
        reminderTimes,
        quietHoursStart,
        quietHoursEnd,
      ]
    );
  }
}

// Register the repository with the container
container.bind(SchedulingNotificationPreferencesRepository).toSelf().inSingletonScope();


This refactoring introduces a repository pattern, which encapsulates the database operations and provides a cleaner interface for the router to use. The `SchedulingNotificationPreferencesRepository` class handles the database queries and returns the results in a more structured format.

To complete the refactoring, you'll need to:

1. Create the `SchedulingNotificationPreferencesRepository` file in the `src/repositories` directory.
2. Update the container configuration to include the new repository.
3. Ensure that the `pool` import in the repository file is correct and points to your database connection.

This approach improves the separation of concerns, making the code more maintainable and easier to test.