/**
 * Safety Training Routes - Training compliance and certification tracking
 * OSHA-required training, expiration alerts, and completion tracking
 */

import express, { Response } from 'express'
import logger from '../config/logger'
import { pool } from '../db/connection'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { applyFieldMasking } from '../utils/fieldMasking'
import { buildInsertClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)

// GET /safety-training - Get all training records
router.get(
    '/',
    requirePermission('safety_training:view:global'),
    applyFieldMasking('safety_training'),
    auditLog({ action: 'READ', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page = 1, limit = 50, status } = req.query
            const offset = (Number(page) - 1) * Number(limit)

            let query = `SELECT id, tenant_id, employee_id, employee_name, training_type, completion_date, expiration_date,
                status, certificate_number, instructor, score, created_at, updated_at
                FROM safety_training WHERE tenant_id = $1`
            const params: any[] = [req.user!.tenant_id]

            if (status) {
                query += ` AND status = $${params.length + 1}`
                params.push(status)
            }

            query += ` ORDER BY expiration_date ASC NULLS LAST LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
            params.push(limit, offset)

            const result = await pool.query(query, params)

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM safety_training WHERE tenant_id = $1`,
                [req.user!.tenant_id]
            )

            res.json({
                data: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: parseInt(countResult.rows[0].count),
                    pages: Math.ceil(countResult.rows[0].count / Number(limit))
                }
            })
        } catch (error) {
            logger.error('Get safety-training error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// GET /safety-training/expiring - Get expiring certifications
router.get(
    '/expiring',
    requirePermission('safety_training:view:global'),
    applyFieldMasking('safety_training'),
    auditLog({ action: 'READ', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const { days = 30 } = req.query

            const result = await pool.query(
                `SELECT id, tenant_id, employee_id, employee_name, training_type, completion_date, expiration_date,
                status, certificate_number
                FROM safety_training
                WHERE tenant_id = $1
                AND expiration_date IS NOT NULL
                AND expiration_date <= NOW() + INTERVAL '${Number(days)} days'
                AND expiration_date > NOW()
                ORDER BY expiration_date ASC`,
                [req.user!.tenant_id]
            )

            res.json({ data: result.rows })
        } catch (error) {
            logger.error('Get expiring training error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// GET /safety-training/compliance-stats - Get compliance statistics
router.get(
    '/compliance-stats',
    requirePermission('safety_training:view:global'),
    auditLog({ action: 'READ', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const statsResult = await pool.query(
                `SELECT
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN status = 'current' THEN 1 END) as compliant,
                    COUNT(CASE WHEN status = 'expiring_soon' THEN 1 END) as expiring_soon,
                    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
                FROM safety_training
                WHERE tenant_id = $1`,
                [req.user!.tenant_id]
            )

            const stats = statsResult.rows[0]
            const complianceRate = stats.total_records > 0
                ? Math.round((Number(stats.compliant) / Number(stats.total_records)) * 100)
                : 0

            res.json({
                total_employees: Number(stats.total_records),
                compliant_employees: Number(stats.compliant),
                pending_training: Number(stats.pending),
                expired_certifications: Number(stats.expired),
                expiring_soon: Number(stats.expiring_soon),
                compliance_rate: complianceRate
            })
        } catch (error) {
            logger.error('Get training compliance stats error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// POST /safety-training - Create training record
router.post(
    '/',
    csrfProtection,
    requirePermission('safety_training:create:global'),
    auditLog({ action: 'CREATE', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const data = req.body

            // Auto-generate certificate number if training is completed
            let certificateNumber = null
            if (data.completion_date) {
                const certResult = await pool.query(
                    'SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM \'[0-9]+\') AS INTEGER)), 0) + 1 as next_num FROM safety_training WHERE tenant_id = $1',
                    [req.user!.tenant_id]
                )
                certificateNumber = 'CERT-' + String(certResult.rows[0].next_num).padStart(6, '0')
            }

            const { columnNames, placeholders, values } = buildInsertClause(
                { ...data, certificate_number: certificateNumber },
                ['tenant_id'],
                1
            )

            const result = await pool.query(
                `INSERT INTO safety_training (${columnNames}) VALUES (${placeholders}) RETURNING *`,
                [req.user!.tenant_id, ...values]
            )

            res.status(201).json(result.rows[0])
        } catch (error) {
            logger.error('Create safety-training error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// PUT /safety-training/:id - Update training record
router.put(
    '/:id',
    csrfProtection,
    requirePermission('safety_training:update:global'),
    auditLog({ action: 'UPDATE', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params
            const data = req.body

            // Build SET clause dynamically
            const allowedFields = ['employee_name', 'training_type', 'completion_date', 'expiration_date',
                                   'status', 'instructor', 'score']
            const updates: string[] = []
            const values: any[] = []
            let paramCount = 1

            Object.keys(data).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = $${paramCount}`)
                    values.push(data[key])
                    paramCount++
                }
            })

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No valid fields to update' })
            }

            values.push(id, req.user!.tenant_id)

            const result = await pool.query(
                `UPDATE safety_training SET ${updates.join(', ')}, updated_at = NOW()
                 WHERE id = $${paramCount} AND tenant_id = $${paramCount + 1} RETURNING *`,
                values
            )

            if (result.rows.length === 0) {
                throw new NotFoundError('Training record not found')
            }

            res.json(result.rows[0])
        } catch (error) {
            logger.error('Update safety-training error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

// DELETE /safety-training/:id - Delete training record
router.delete(
    '/:id',
    csrfProtection,
    requirePermission('safety_training:delete:global'),
    auditLog({ action: 'DELETE', resourceType: 'safety_training' }),
    async (req: AuthRequest, res: Response) => {
        try {
            const result = await pool.query(
                'DELETE FROM safety_training WHERE id = $1 AND tenant_id = $2 RETURNING id',
                [req.params.id, req.user!.tenant_id]
            )

            if (result.rows.length === 0) {
                throw new NotFoundError('Training record not found')
            }

            res.json({ message: 'Training record deleted successfully' })
        } catch (error) {
            logger.error('Delete safety-training error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    }
)

export default router
