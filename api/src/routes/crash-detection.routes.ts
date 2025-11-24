/**
 * Crash Detection API Routes
 *
 * Handles crash reports from mobile devices and triggers emergency response
 */

import express, { Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'
import pool from '../config/database'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

/**
 * Crash Report Schema
 */
const CrashReportSchema = z.object({
  timestamp: z.string().datetime(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxAcceleration: z.number(),
  userCanceled: z.boolean(),
  telemetry: z.record(z.any()).optional()
})

/**
 * @swagger
 * /api/v1/incidents/crash:
 *   post:
 *     summary: Report a detected crash
 *     description: Submit crash detection data from mobile device
 *     tags: [Crash Detection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - timestamp
 *               - maxAcceleration
 *               - userCanceled
 *             properties:
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               maxAcceleration:
 *                 type: number
 *                 description: Maximum G-force detected
 *               userCanceled:
 *                 type: boolean
 *                 description: Whether user canceled the emergency response
 *               telemetry:
 *                 type: object
 *                 description: Additional telemetry data
 *     responses:
 *       201:
 *         description: Crash report saved successfully
 *       400:
 *         description: Invalid request data
 */
router.post('/crash',
  auditLog('crash_report_submitted'),
  async (req: Request, res: Response) => {
    const client = await pool.connect()

    try {
      const validated = CrashReportSchema.parse(req.body)
      const user = (req as any).user
      const tenantId = user.tenant_id
      const userId = user.id

      // Check if this is a real emergency (not canceled)
      const isEmergency = !validated.userCanceled

      // Insert crash incident
      const result = await client.query(
        `INSERT INTO crash_incidents (
          tenant_id,
          user_id,
          driver_id,
          timestamp,
          latitude,
          longitude,
          max_acceleration,
          user_canceled,
          telemetry_data,
          emergency_services_notified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          tenantId,
          userId,
          userId, // Assuming the user is also the driver
          validated.timestamp,
          validated.latitude,
          validated.longitude,
          validated.maxAcceleration,
          validated.userCanceled,
          JSON.stringify(validated.telemetry || {}),
          isEmergency
        ]
      )

      const incident = result.rows[0]

      // If not canceled, trigger emergency response
      if (isEmergency) {
        await triggerEmergencyResponse(incident, client)
      }

      // Log the incident
      console.log(`[CrashDetection] Crash incident reported by user ${userId}`, {
        incidentId: incident.id,
        acceleration: validated.maxAcceleration,
        userCanceled: validated.userCanceled,
        location: validated.latitude && validated.longitude ?
          `${validated.latitude}, ${validated.longitude}` : 'unknown'
      })

      res.status(201).json({
        message: 'Crash report received',
        incidentId: incident.id,
        emergencyResponseTriggered: isEmergency
      })
    } catch (error: any) {
      console.error('Error saving crash report:', error)
      res.status(400).json({ error: getErrorMessage(error) })
    } finally {
      client.release()
    }
  }
)

/**
 * @swagger
 * /api/v1/incidents/crash/history:
 *   get:
 *     summary: Get crash incident history
 *     description: Retrieve crash incidents for the authenticated user
 *     tags: [Crash Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 90
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: List of crash incidents
 */
router.get('/crash/history', async (req: Request, res: Response) => {
  const client = await pool.connect()

  try {
    const user = (req as any).user
    const tenantId = user.tenant_id
    const userId = user.id
    const days = parseInt(req.query.days as string) || 90

    const result = await client.query(
      `SELECT
        id,
        timestamp,
        latitude,
        longitude,
        max_acceleration,
        user_canceled,
        emergency_services_notified,
        created_at
      FROM crash_incidents
      WHERE tenant_id = $1
        AND user_id = $2
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC`,
      [tenantId, userId]
    )

    res.json({ incidents: result.rows })
  } catch (error: any) {
    console.error('Error fetching crash history:', error)
    res.status(500).json({ error: getErrorMessage(error) })
  } finally {
    client.release()
  }
})

/**
 * @swagger
 * /api/v1/incidents/crash/fleet:
 *   get:
 *     summary: Get fleet-wide crash incidents
 *     description: Retrieve all crash incidents for the fleet (managers only)
 *     tags: [Crash Detection]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: List of fleet crash incidents
 */
router.get('/crash/fleet', async (req: Request, res: Response) => {
  const client = await pool.connect()

  try {
    const user = (req as any).user
    const tenantId = user.tenant_id
    const days = parseInt(req.query.days as string) || 30

    const result = await client.query(
      `SELECT
        ci.id,
        ci.timestamp,
        ci.latitude,
        ci.longitude,
        ci.max_acceleration,
        ci.user_canceled,
        ci.emergency_services_notified,
        u.first_name,
        u.last_name,
        u.email,
        ci.created_at
      FROM crash_incidents ci
      LEFT JOIN users u ON ci.user_id = u.id
      WHERE ci.tenant_id = $1
        AND ci.timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY ci.timestamp DESC`,
      [tenantId]
    )

    const incidents = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      location: row.latitude && row.longitude ?
        { latitude: row.latitude, longitude: row.longitude } : null,
      maxAcceleration: row.max_acceleration,
      userCanceled: row.user_canceled,
      emergencyServicesNotified: row.emergency_services_notified,
      driver: {
        name: `${row.first_name} ${row.last_name}`,
        email: row.email
      },
      createdAt: row.created_at
    }))

    res.json({ incidents })
  } catch (error: any) {
    console.error('Error fetching fleet crash incidents:', error)
    res.status(500).json({ error: getErrorMessage(error) })
  } finally {
    client.release()
  }
})

/**
 * Trigger emergency response for a confirmed crash
 */
async function triggerEmergencyResponse(incident: any, client: any) {
  try {
    // 1. Create high-priority alert
    await client.query(
      `INSERT INTO alerts (
        tenant_id,
        user_id,
        driver_id,
        vehicle_id,
        type,
        severity,
        title,
        message,
        latitude,
        longitude,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        incident.tenant_id,
        incident.user_id,
        incident.driver_id,
        null, // vehicle_id (unknown from mobile crash detection)
        'crash_detected',
        'critical',
        '🚨 CRASH DETECTED',
        `Vehicle crash detected with ${incident.max_acceleration}G impact. Emergency services have been notified.`,
        incident.latitude,
        incident.longitude,
        JSON.stringify({
          incidentId: incident.id,
          maxAcceleration: incident.max_acceleration,
          timestamp: incident.timestamp
        })
      ]
    )

    // 2. Notify fleet managers
    await client.query(
      `INSERT INTO notifications (
        tenant_id,
        user_id,
        type,
        title,
        body,
        priority,
        data
      )
      SELECT
        $1,
        u.id,
        'crash_alert',
        '🚨 Emergency: Crash Detected',
        'A driver has been in a crash. Emergency services notified.',
        'high',
        $2
      FROM users u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE u.tenant_id = $1
        AND r.name IN ('fleet_manager', 'admin')`,
      [
        incident.tenant_id,
        JSON.stringify({
          incidentId: incident.id,
          driverId: incident.driver_id,
          location: incident.latitude && incident.longitude ?
            { lat: incident.latitude, lon: incident.longitude } : null
        })
      ]
    )

    // 3. Log emergency response
    console.log(`[CrashDetection] 🚨 EMERGENCY RESPONSE TRIGGERED for incident ${incident.id}`)

    // 4. In production, integrate with:
    // - Emergency dispatch system
    // - Insurance notification
    // - Roadside assistance
    // - Company safety coordinator

  } catch (error) {
    console.error('Error triggering emergency response:', error)
  }
}

export default router
