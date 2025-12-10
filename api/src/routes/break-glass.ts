import express, { Response } from 'express'
import { z } from 'zod'

import { container } from '../container'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { BreakGlassRepository } from '../repositories/BreakGlassRepository'
import { TYPES } from '../types'
import { validateTenantOwnership } from '../utils/dbHelpers'


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
  csrfProtection,
  auditLog({ action: 'REQUEST_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = elevationRequestSchema.parse(req.body)
      const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)
      const context = { userId: req.user!.id, tenantId: req.user!.tenant_id }

      // Check if role allows JIT elevation
      // SECURITY: Must verify role belongs to tenant to prevent cross-tenant privilege escalation
      const role = await repo.findRoleById(validated.role_id, context)

      if (!role) {
        return res.status(404).json({ error: `Role not found` })
      }

      if (!role.just_in_time_elevation_allowed) {
        return res.status(400).json({
          error: 'This role does not support just-in-time elevation',
          role: role.name
        })
      }

      // Check if user already has an active elevation
      // SECURITY: Repository enforces tenant isolation via user join
      const activeSession = await repo.findActiveOrPendingSession(req.user!.id, context)

      if (activeSession) {
        return res.status(400).json({
          error: 'You already have an active or pending elevation request'
        })
      }

      // Create elevation request
      const session = await repo.createSession({
        user_id: req.user!.id,
        elevated_role_id: validated.role_id,
        reason: validated.reason,
        ticket_reference: validated.ticket_reference,
        max_duration_minutes: validated.duration_minutes
      })

      // Send notification to approvers (FleetAdmin role)
      await notifyApprovers(req.user!.tenant_id, session.id, {
        requester: req.user!.email,
        role: role.name,
        reason: validated.reason,
        ticket: validated.ticket_reference
      }, repo, context)

      res.status(201).json({
        message: `Elevation request submitted. Awaiting approval from FleetAdmin.`,
        session_id: session.id,
        status: 'pending'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues })
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
      const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)
      const context = { userId: req.user!.id, tenantId: req.user!.tenant_id }

      const requests = await repo.findRequestsWithDetails(
        status as string || null,
        context
      )

      res.json({ data: requests })
    } catch (error) {
      console.error(`List elevation requests error:`, error)
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
  csrfProtection,
  requirePermission('role:manage:global'),
  auditLog({ action: 'APPROVE_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = approvalSchema.parse(req.body)
      const sessionId = req.params.id
      const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)
      const context = { userId: req.user!.id, tenantId: req.user!.tenant_id }

      // Get the session
      // SECURITY: Must verify session belongs to approver's tenant
      const session = await repo.findSessionByIdWithTenant(sessionId, context)

      if (!session) {
        return res.status(404).json({ error: `Elevation request not found` })
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

        // SECURITY: Verify session belongs to tenant before updating
        await validateTenantOwnership('break_glass_sessions', sessionId, req.user!.tenant_id)

        await repo.approveSession(sessionId, req.user!.id, endTime)

        // Create temporary user_role
        // SECURITY: session.user_id and session.elevated_role_id already validated above via tenant-safe query
        await repo.createTemporaryUserRole(
          session.user_id,
          session.elevated_role_id,
          req.user!.id,
          endTime
        )

        // Send notification to requester
        // SECURITY: session.tenant_id and session.user_id already validated above via tenant-safe query
        await repo.createNotification({
          tenant_id: session.tenant_id,
          user_id: session.user_id,
          notification_type: 'alert',
          title: 'Break-Glass Access Approved',
          message: `Your emergency access request has been approved and is now active for ${session.max_duration_minutes} minutes. Ticket: ${session.ticket_reference}`,
          priority: 'urgent'
        })

        res.json({
          message: 'Elevation request approved',
          expires_at: endTime,
          duration_minutes: session.max_duration_minutes
        })
      } else {
        // Deny
        // SECURITY: Session already validated above via tenant-safe query
        await repo.denySession(sessionId, req.user!.id)

        // Send notification to requester
        // SECURITY: session.tenant_id and session.user_id already validated above via tenant-safe query
        await repo.createNotification({
          tenant_id: session.tenant_id,
          user_id: session.user_id,
          notification_type: 'alert',
          title: 'Break-Glass Access Denied',
          message: `Your emergency access request has been denied. Reason: ${validated.notes || 'Not provided'}`,
          priority: 'high'
        })

        res.json({ message: 'Elevation request denied' })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues })
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
  csrfProtection,
  auditLog({ action: 'REVOKE_ELEVATION', resourceType: 'break_glass' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const sessionId = req.params.id
      const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)
      const context = { userId: req.user!.id, tenantId: req.user!.tenant_id }

      // SECURITY: Must verify session belongs to current user's tenant
      const session = await repo.findSessionByIdWithTenant(sessionId, context)

      if (!session) {
        return res.status(404).json({ error: `Elevation session not found` })
      }

      // Check if user can revoke (self or admin)
      const canRevoke =
        session.user_id === req.user!.id ||
        session.tenant_id === req.user!.tenant_id

      if (!canRevoke) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Update session status
      await repo.revokeSession(sessionId)

      // Deactivate the temporary role
      await repo.deactivateTemporaryUserRole(session.user_id, session.elevated_role_id)

      res.json({ message: `Elevation revoked successfully` })
    } catch (error) {
      console.error(`Revoke elevation error:`, error)
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
      const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)
      const context = { userId: req.user!.id, tenantId: req.user!.tenant_id }

      // SECURITY: Must verify user belongs to current tenant
      const activeSessions = await repo.findActiveElevations(req.user!.id, context)

      res.json({ data: activeSessions })
    } catch (error) {
      console.error(`Get active elevations error:`, error)
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
  },
  repo: BreakGlassRepository,
  context: { userId: string; tenantId: string }
) {
  try {
    // Get all FleetAdmin users
    // SECURITY: Already filtering by tenantId parameter
    const approvers = await repo.findFleetAdminUsers(context)

    // Create notifications for each approver
    const notifications = approvers.map(approver =>
      repo.createNotification({
        tenant_id: tenantId,
        user_id: approver.id,
        notification_type: 'alert',
        title: 'Break-Glass Access Request Pending',
        message: `User ${details.requester} has requested emergency access to role ${details.role}. Reason: ${details.reason}. Ticket: ${details.ticket}`,
        link: `/break-glass/requests/${sessionId}`,
        priority: 'urgent'
      })
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
    const repo = container.get<BreakGlassRepository>(TYPES.BreakGlassRepository)

    // Expire sessions past their end_time
    await repo.expireActiveSessions()

    // Deactivate expired user_roles
    await repo.deactivateExpiredUserRoles()
  } catch (error) {
    console.error(`Error expiring break-glass sessions:`, error)
  }
}

export default router
