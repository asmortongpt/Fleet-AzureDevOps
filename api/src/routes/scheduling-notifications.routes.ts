/**
 * Scheduling Notifications Routes
 * API endpoints for managing scheduling notification preferences
 */

import express, { Request, Response } from 'express'
import pool from '../config/database'
import schedulingNotificationService from '../services/scheduling-notification.service'
import { logger } from '../utils/logger'

const router = express.Router()

/**
 * GET /api/scheduling-notifications/preferences
 * Get user's notification preferences for scheduling
 */
router.get('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any

    const result = await pool.query(
      `SELECT id, user_id, tenant_id, notification_type, enabled, created_at, updated_at FROM scheduling_notification_preferences WHERE user_id = $1`,
      [userId]
    )

    if (result.rows.length === 0) {
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
        updatedAt: prefs.updated_at
      }
    })
  } catch (error) {
    logger.error('Error fetching notification preferences', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    })
  }
})

/**
 * PUT /api/scheduling-notifications/preferences
 * Update user's notification preferences
 */
router.put('/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const {
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd
    } = req.body

    // Validate reminder times
    if (reminderTimes && !Array.isArray(reminderTimes)) {
      return res.status(400).json({
        success: false,
        error: 'reminderTimes must be an array of numbers'
      })
    }

    if (reminderTimes) {
      for (const time of reminderTimes) {
        if (typeof time !== 'number' || time < 0 || time > 168) {
          return res.status(400).json({
            success: false,
            error: 'Reminder times must be numbers between 0 and 168 (hours)'
          })
        }
      }
    }

    // Validate quiet hours format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (quietHoursStart && !timeRegex.test(quietHoursStart)) {
      return res.status(400).json({
        success: false,
        error: 'quietHoursStart must be in HH:MM format'
      })
    }

    if (quietHoursEnd && !timeRegex.test(quietHoursEnd)) {
      return res.status(400).json({
        success: false,
        error: 'quietHoursEnd must be in HH:MM format'
      })
    }

    await schedulingNotificationService.updateNotificationPreferences(userId, {
      userId,
      emailEnabled,
      smsEnabled,
      teamsEnabled,
      reminderTimes,
      quietHoursStart,
      quietHoursEnd
    })

    // Fetch updated preferences
    const result = await pool.query(
      `SELECT id, user_id, tenant_id, notification_type, enabled, created_at, updated_at FROM scheduling_notification_preferences WHERE user_id = $1`,
      [userId]
    )

    const prefs = result.rows[0]

    logger.info('Notification preferences updated', { userId })

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
    })
  } catch (error) {
    logger.error('Error updating notification preferences', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    })
  }
})

/**
 * POST /api/scheduling-notifications/test
 * Send a test notification to verify settings
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { channels } = req.body

    if (!channels || !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        error: 'channels must be an array of notification types (email, sms, teams)'
      })
    }

    const validChannels = ['email', 'sms', 'teams']
    for (const channel of channels) {
      if (!validChannels.includes(channel)) {
        return res.status(400).json({
          success: false,
          error: `Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`
        })
      }
    }

    await schedulingNotificationService.sendTestNotification(userId, channels)

    logger.info('Test notification sent', { userId, channels })

    res.json({
      success: true,
      message: `Test notifications sent via: ${channels.join(', ')}`,
      channels
    })
  } catch (error) {
    logger.error('Error sending test notification', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    })
  }
})

/**
 * GET /api/scheduling-notifications/history
 * Get notification history for the user
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any
    const { limit = 50, offset = 0 } = req.query

    // Get user email for filtering communications
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    const userEmail = userResult.rows[0].email

    const result = await pool.query(
      `SELECT c.*, cel.entity_type, cel.entity_id
       FROM communications c
       LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
       WHERE $1 = ANY(c.to_contact_emails)
         AND c.communication_type = 'Email'
         AND c.subject LIKE '%Reservation%' OR c.subject LIKE '%Maintenance%'
       ORDER BY c.communication_datetime DESC
       LIMIT $2 OFFSET $3`,
      [userEmail, limit, offset]
    )

    res.json({
      success: true,
      count: result.rows.length,
      history: result.rows
    })
  } catch (error) {
    logger.error('Error fetching notification history', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history'
    })
  }
})

/**
 * GET /api/scheduling-notifications/stats
 * Get notification statistics for the user
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as any

    const result = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE entity_type = 'reservation') as reservation_notifications,
        COUNT(*) FILTER (WHERE entity_type = 'maintenance') as maintenance_notifications,
        COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '30 days') as last_30_days,
        COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '7 days') as last_7_days,
        MIN(sent_at) as first_notification,
        MAX(sent_at) as last_notification
       FROM scheduling_reminders_sent srs
       WHERE EXISTS (
         SELECT 1 FROM vehicle_reservations vr
         WHERE vr.id = srs.entity_id::integer
         AND vr.reserved_by = $1
       )
       OR EXISTS (
         SELECT 1 FROM service_bay_schedules sbs
         WHERE sbs.id = srs.entity_id::integer
         AND sbs.assigned_technician_id = $1
       )`,
      [userId]
    )

    const stats = result.rows[0]

    res.json({
      success: true,
      stats: {
        totalReservationNotifications: parseInt(stats.reservation_notifications) || 0,
        totalMaintenanceNotifications: parseInt(stats.maintenance_notifications) || 0,
        last30Days: parseInt(stats.last_30_days) || 0,
        last7Days: parseInt(stats.last_7_days) || 0,
        firstNotification: stats.first_notification,
        lastNotification: stats.last_notification
      }
    })
  } catch (error) {
    logger.error('Error fetching notification stats', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification statistics'
    })
  }
})

/**
 * POST /api/scheduling-notifications/resend/:id
 * Resend a notification (admin only)
 */
router.post('/resend/:id', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.user as any
    const { id } = req.params
    const { type } = req.body // 'reservation' or 'maintenance'

    // Check if user is admin or manager
    if (!['admin', 'fleet_manager'].includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions. Admin or Fleet Manager role required.'
      })
    }

    if (type === 'reservation') {
      const result = await pool.query(
        `SELECT vr.*, v.make, v.model, v.license_plate, v.vin,
                u.first_name || ' ' || u.last_name as reserved_by_name,
                vr.tenant_id
         FROM vehicle_reservations vr
         JOIN vehicles v ON vr.vehicle_id = v.id
         JOIN users u ON vr.reserved_by = u.id
         WHERE vr.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Reservation not found'
        })
      }

      const reservation = result.rows[0]

      // Calculate hours until event
      const hoursUntil = Math.ceil(
        (new Date(reservation.start_time).getTime() - Date.now()) / (1000 * 60 * 60)
      )

      await schedulingNotificationService.sendReservationReminder(
        reservation.tenant_id,
        reservation,
        hoursUntil
      )

      res.json({
        success: true,
        message: 'Reservation notification resent successfully'
      })
    } else if (type === 'maintenance') {
      const result = await pool.query(
        `SELECT sbs.*, v.make, v.model, v.license_plate, v.vin,
                at.name as appointment_type, sb.bay_name,
                u.first_name || ' ' || u.last_name as technician_name,
                sbs.tenant_id
         FROM service_bay_schedules sbs
         LEFT JOIN vehicles v ON sbs.vehicle_id = v.id
         LEFT JOIN appointment_types at ON sbs.appointment_type_id = at.id
         LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
         LEFT JOIN users u ON sbs.assigned_technician_id = u.id
         WHERE sbs.id = $1`,
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Maintenance appointment not found'
        })
      }

      const appointment = result.rows[0]

      // Calculate hours until event
      const hoursUntil = Math.ceil(
        (new Date(appointment.scheduled_start).getTime() - Date.now()) / (1000 * 60 * 60)
      )

      await schedulingNotificationService.sendMaintenanceReminder(
        appointment.tenant_id,
        appointment,
        hoursUntil
      )

      res.json({
        success: true,
        message: 'Maintenance notification resent successfully'
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid type. Must be "reservation" or "maintenance"'
      })
    }
  } catch (error) {
    logger.error('Error resending notification', { error })
    res.status(500).json({
      success: false,
      error: 'Failed to resend notification'
    })
  }
})

export default router
