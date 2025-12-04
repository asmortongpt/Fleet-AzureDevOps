import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { z } from 'zod'
import { authenticate, rateLimiter } from '../middleware'
import { logger } from '../utils/logger'
import { asyncHandler } from '../utils/asyncHandler'
import { validateSchema } from '../utils/validateSchema'

const router = express.Router()

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
})

router.use(authenticate)
router.use(rateLimiter({ windowMs: 60 * 1000, max: 100 }))

/**
 * GET /api/scheduling-notifications/preferences
 * Get user's notification preferences for scheduling
 */
router.get(
  '/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id

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
    )

    if (result.rows.length === 0) {
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
      })
    }

    const prefs = result.rows[0]
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
        updatedAt: prefs.updated_at,
      },
    })
  })
)

/**
 * PUT /api/scheduling-notifications/preferences
 * Update user's notification preferences
 */
router.put(
  '/preferences',
  validateSchema(preferencesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id
    const {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd,
    } = req.body

    await pool.query(
      `UPDATE scheduling_notification_preferences 
    SET 
      email_enabled = $2,
      sms_enabled = $3,
      teams_enabled = $4,
      reminder_times = $5,
      quiet_hours_start = $6,
      quiet_hours_end = $7,
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
    )

    res.json({
      success: true,
      message: 'Preferences updated successfully',
    })
  })
)

export default router
