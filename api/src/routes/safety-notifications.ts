/**
 * Safety Notifications Routes - Real-time safety alerts and notifications
 * Push notifications for critical safety events, compliance deadlines, and incidents
 */

import express, { Response } from 'express'
import logger from '../config/logger'
import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { buildInsertClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /safety-notifications - Get all notifications
router.get(
    '/',
    requirePermission('safety_notification:view:global'),
    auditLog({ action: 'READ', resourceType: 'safety_notifications' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page = 1, limit = 50, unread_only, category } = req.query
            const offset = (Number(page) - 1) * Number(limit)

            let query = `SELECT id, tenant_id, type, title, message, timestamp, read, actionable,
                action_url, category, priority, created_at
                FROM safety_notifications WHERE tenant_id = $1`
            const params: any[] = [req.user!.tenant_id]

            if (unread_only === 'true') {
                query += ` AND read = false`
            }

            if (category) {
                query += ` AND category = $${params.length + 1}`
                params.push(category)
            }

            query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
            params.push(limit, offset)

            const result = await pool.query(query, params)

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM safety_notifications WHERE tenant_id = $1 ${unread_only === 'true' ? 'AND read = false' : ''}`,
                [req.user!.tenant_id]
            )

            const unreadResult = await pool.query(
                `SELECT COUNT(*) FROM safety_notifications WHERE tenant_id = $1 AND read = false`,
                [req.user!.tenant_id]
            )

            res.json({
                data: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / Number(limit))
                },
                unread_count: parseInt(unreadResult.rows[0].count)
            })
        } catch (error) {
            logger.error('Get safety-notifications error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// GET /safety-notifications/unread-count - Get count of unread notifications
router.get(
    '/unread-count',
    requirePermission('safety_notification:view:global'),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as unread_count FROM safety_notifications WHERE tenant_id = $1 AND read = false`,
                [req.user!.tenant_id]
            )

            res.json({ unread_count: parseInt(result.rows[0].unread_count) })
        } catch (error) {
            logger.error('Get unread count error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// POST /safety-notifications - Create notification
router.post(
    '/',
    csrfProtection,
    requirePermission('safety_notification:create:global'),
    auditLog({ action: 'CREATE', resourceType: 'safety_notifications' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const data = {
                ...req.body,
                timestamp: req.body.timestamp || new Date().toISOString(),
                read: false
            }

            const { columnNames, placeholders, values } = buildInsertClause(
                data,
                ['tenant_id'],
                1
            )

            const result = await pool.query(
                `INSERT INTO safety_notifications (${columnNames}) VALUES (${placeholders}) RETURNING *`,
                [req.user!.tenant_id, ...values]
            )

            // In production, trigger push notification/websocket here
            // await sendPushNotification(result.rows[0])

            res.status(201).json(result.rows[0])
        } catch (error) {
            logger.error('Create safety-notification error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// PUT /safety-notifications/:id/mark-read - Mark notification as read
router.put(
    '/:id/mark-read',
    csrfProtection,
    requirePermission('safety_notification:update:global'),
    auditLog({ action: 'UPDATE', resourceType: 'safety_notifications' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await pool.query(
                `UPDATE safety_notifications SET read = true, updated_at = NOW()
                 WHERE id = $1 AND tenant_id = $2 RETURNING *`,
                [req.params.id, req.user!.tenant_id]
            )

            if (result.rows.length === 0) {
                throw new NotFoundError('Notification not found')
            }

            res.json(result.rows[0])
        } catch (error) {
            logger.error('Mark notification read error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// PUT /safety-notifications/mark-all-read - Mark all notifications as read
router.put(
    '/mark-all-read',
    csrfProtection,
    requirePermission('safety_notification:update:global'),
    auditLog({ action: 'UPDATE', resourceType: 'safety_notifications' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await pool.query(
                `UPDATE safety_notifications SET read = true, updated_at = NOW()
                 WHERE tenant_id = $1 AND read = false`,
                [req.user!.tenant_id]
            )

            res.json({
                message: 'All notifications marked as read',
                count: result.rowCount
            })
        } catch (error) {
            logger.error('Mark all notifications read error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// DELETE /safety-notifications/:id - Delete notification
router.delete(
    '/:id',
    csrfProtection,
    requirePermission('safety_notification:delete:global'),
    auditLog({ action: 'DELETE', resourceType: 'safety_notifications' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await pool.query(
                'DELETE FROM safety_notifications WHERE id = $1 AND tenant_id = $2 RETURNING id',
                [req.params.id, req.user!.tenant_id]
            )

            if (result.rows.length === 0) {
                throw new NotFoundError('Notification not found')
            }

            res.json({ message: 'Notification deleted successfully' })
        } catch (error) {
            logger.error('Delete notification error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

export default router
