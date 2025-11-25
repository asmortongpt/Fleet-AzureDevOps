import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'

const router = express.Router()
router.use(authenticateJWT)

/**
 * Break-Glass Emergency Access System
 * Provides temporary elevation with approval workflow
 */

const elevationRequestSchema = z.object({
  role_id: z.string().uuid(),
  reason: z.string().min(20).max(500),
  ticket_reference: z.string().min(1).max(100),
  duration_minutes: z.number().int().min(1).max(30).default(30)
})

const approvalSchema = z.object({
  approved: z.boolean(),
  notes: z.string().optional()
})

/**
 * POST /api/break-glass/request
 * Request temporary role elevation
 */
router.post(
  '/request',
  auditLog({ action: 'REQUEST_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = elevationRequestSchema.parse(req.body)

      // Check if role allows JIT elevation
      const roleResult = await pool.query(
        'SELECT name, just_in_time_elevation_allowed FROM roles WHERE id = $1',
        [validated.role_id]
      )

      if (roleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' })
      }

      const role = roleResult.rows[0]

      if (!role.just_in_time_elevation_allowed) {
        return res.status(400).json({
          error: 'This role does not support just-in-time elevation',
          role: role.name
        })
      }

      // Check if user already has an active elevation
      const activeResult = await pool.query(
        `SELECT id FROM break_glass_sessions
         WHERE user_id = $1
         AND status IN ('pending', 'active')`,
        [req.user!.id]
      )

      if (activeResult.rows.length > 0) {
        return res.status(400).json({
          error: 'You already have an active or pending elevation request'
        })
      }

      // Create elevation request
      const result = await pool.query(
        `INSERT INTO break_glass_sessions
         (user_id, elevated_role_id, reason, ticket_reference, max_duration_minutes, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [
          req.user!.id,
          validated.role_id,
          validated.reason,
          validated.ticket_reference,
          validated.duration_minutes
        ]
      )

      const session = result.rows[0]

      // Send notification to approvers (FleetAdmin role)
      await notifyApprovers(req.user!.tenant_id, session.id, {
        requester: req.user!.email,
        role: role.name,
        reason: validated.reason,
        ticket: validated.ticket_reference
      })

      res.status(201).json({
        message: 'Elevation request submitted. Awaiting approval from FleetAdmin.',
        session_id: session.id,
        status: 'pending'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Break-glass request error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/break-glass/requests
 * List elevation requests (approvers only)
 */
router.get(
  '/requests',
  requirePermission('role:manage:global'),
  auditLog({ action: 'VIEW_ELEVATION_REQUESTS', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status = 'pending' } = req.query

      const result = await pool.query(
        `SELECT
           bg.*,
           u.email as requester_email,
           u.first_name || ' ' || u.last_name as requester_name,
           r.name as role_name
         FROM break_glass_sessions bg
         JOIN users u ON bg.user_id = u.id
         JOIN roles r ON bg.elevated_role_id = r.id
         WHERE u.tenant_id = $1
         AND ($2::varchar IS NULL OR bg.status = $2)
         ORDER BY bg.created_at DESC`,
        [req.user!.tenant_id, status || null]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('List elevation requests error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/break-glass/:id/approve
 * Approve or deny elevation request
 */
router.post(
  '/:id/approve',
  requirePermission('role:manage:global'),
  auditLog({ action: 'APPROVE_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = approvalSchema.parse(req.body)
      const sessionId = req.params.id

      // Get the session
      const sessionResult = await pool.query(
        `SELECT bg.*, u.tenant_id
         FROM break_glass_sessions bg
         JOIN users u ON bg.user_id = u.id
         WHERE bg.id = $1',
        [sessionId]
      )

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Elevation request not found' })
      }

      const session = sessionResult.rows[0]

      // Verify tenant match
      if (session.tenant_id !== req.user!.tenant_id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Verify status is pending
      if (session.status !== 'pending') {
        return res.status(400).json({
          error: `Request cannot be approved. Current status: ${session.status}`
        })
      }

      if (validated.approved) {
        // Approve and activate
        const endTime = new Date(Date.now() + session.max_duration_minutes * 60 * 1000)

        await pool.query(
          `UPDATE break_glass_sessions
           SET status = 'active',
               approved_by = $1,
               approved_at = NOW(),
               start_time = NOW(),
               end_time = $2
           WHERE id = $3',
          [req.user!.id, endTime, sessionId]
        )

        // Create temporary user_role
        await pool.query(
          `INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at, is_active)
           VALUES ($1, $2, $3, $4, true)`,
          [session.user_id, session.elevated_role_id, req.user!.id, endTime]
        )

        // Send notification to requester
        await pool.query(
          `INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, priority)
           VALUES ($1, $2, 'alert', 'Break-Glass Access Approved',
                   'Your emergency access request has been approved and is now active for ${session.max_duration_minutes} minutes. Ticket: ${session.ticket_reference}',
                   'urgent')`,
          [session.tenant_id, session.user_id]
        )

        res.json({
          message: 'Elevation request approved',
          expires_at: endTime,
          duration_minutes: session.max_duration_minutes
        })
      } else {
        // Deny
        await pool.query(
          `UPDATE break_glass_sessions
           SET status = 'revoked',
               approved_by = $1,
               approved_at = NOW()
           WHERE id = $2',
          [req.user!.id, sessionId]
        )

        // Send notification to requester
        await pool.query(
          `INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, priority)
           VALUES ($1, $2, 'alert', 'Break-Glass Access Denied',
                   'Your emergency access request has been denied. Reason: ${validated.notes || 'Not provided'}',
                   'high')`,
          [session.tenant_id, session.user_id]
        )

        res.json({ message: 'Elevation request denied' })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.errors })
      }
      console.error('Approve elevation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * POST /api/break-glass/:id/revoke
 * Revoke active elevation (self or admin)
 */
router.post(
  '/:id/revoke',
  auditLog({ action: 'REVOKE_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id

      const sessionResult = await pool.query(
        `SELECT bg.*, u.tenant_id
         FROM break_glass_sessions bg
         JOIN users u ON bg.user_id = u.id
         WHERE bg.id = $1',
        [sessionId]
      )

      if (sessionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Elevation session not found' })
      }

      const session = sessionResult.rows[0]

      // Check if user can revoke (self or admin)
      const canRevoke =
        session.user_id === req.user!.id ||
        session.tenant_id === req.user!.tenant_id

      if (!canRevoke) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Update session status
      await pool.query(
        `UPDATE break_glass_sessions
         SET status = 'revoked',
             end_time = NOW()
         WHERE id = $1',
        [sessionId]
      )

      // Deactivate the temporary role
      await pool.query(
        `UPDATE user_roles
         SET is_active = false
         WHERE user_id = $1
         AND role_id = $2
         AND expires_at IS NOT NULL`,
        [session.user_id, session.elevated_role_id]
      )

      res.json({ message: 'Elevation revoked successfully' })
    } catch (error) {
      console.error('Revoke elevation error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * GET /api/break-glass/active
 * Get active elevations for current user
 */
router.get(
  '/active',
  auditLog({ action: 'VIEW_ACTIVE_ELEVATIONS', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
           bg.*,
           r.name as role_name,
           EXTRACT(EPOCH FROM (bg.end_time - NOW())) / 60 as minutes_remaining
         FROM break_glass_sessions bg
         JOIN roles r ON bg.elevated_role_id = r.id
         WHERE bg.user_id = $1
         AND bg.status = 'active'
         AND bg.end_time > NOW()
         ORDER BY bg.end_time ASC`,
        [req.user!.id]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('Get active elevations error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * Helper: Notify approvers of pending elevation request
 */
async function notifyApprovers(
  tenantId: string,
  sessionId: string,
  details: {
    requester: string
    role: string
    reason: string
    ticket: string
  }
) {
  try {
    // Get all FleetAdmin users
    const result = await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.tenant_id = $1
       AND r.name = 'FleetAdmin'
       AND ur.is_active = true`,
      [tenantId]
    )

    // Create notifications for each approver
    const notifications = result.rows.map(row =>
      pool.query(
        `INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, link, priority)
         VALUES ($1, $2, 'alert',
                 'Break-Glass Access Request Pending',
                 'User ${details.requester} has requested emergency access to role ${details.role}. Reason: ${details.reason}. Ticket: ${details.ticket}',
                 '/break-glass/requests/${sessionId}',
                 'urgent')`,
        [tenantId, row.id]
      )
    )

    await Promise.all(notifications)
  } catch (error) {
    console.error('Failed to notify approvers:', error)
    // Don't throw - notification failure shouldn't block the request
  }
}

/**
 * Background job to auto-expire active sessions
 * This should be run periodically (e.g., every minute)
 */
export async function expireBreakGlassSessions() {
  try {
    // Expire sessions past their end_time
    await pool.query(
      `UPDATE break_glass_sessions
       SET status = 'expired'
       WHERE status = 'active'
       AND end_time < NOW()`
    )

    // Deactivate expired user_roles
    await pool.query(
      `UPDATE user_roles
       SET is_active = false
       WHERE expires_at IS NOT NULL
       AND expires_at < NOW()
       AND is_active = true`
    )
  } catch (error) {
    console.error('Error expiring break-glass sessions:', error)
  }
}

export default router
