import express, { Response } from 'express'
import { AuthRequest, authenticateJWT, authorize } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import { z } from 'zod'
import {
  ChargeStatus,
  CreateChargeRequest,
  UpdateChargeRequest,
  CalculateChargesRequest,
  CalculateChargesResponse,
  ChargeBreakdownItem,
  getChargePeriodDates
} from '../types/trip-usage'
import { appInsightsService } from '../config/app-insights'
import { emailNotificationService } from '../services/email-notifications'
import { logger } from '../config/logger'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const createChargeSchema = z.object({
  driver_id: z.string().uuid(),
  trip_usage_id: z.string().uuid().optional(),
  charge_period: z.string().regex(/^\d{4}-\d{2}$/),
  charge_period_start: z.string(),
  charge_period_end: z.string(),
  miles_charged: z.number().nonnegative(),
  rate_per_mile: z.number().nonnegative(),
  notes: z.string().optional()
})

const updateChargeSchema = z.object({
  charge_status: z.enum([
    ChargeStatus.PENDING,
    ChargeStatus.INVOICED,
    ChargeStatus.BILLED,
    ChargeStatus.PAID,
    ChargeStatus.WAIVED,
    ChargeStatus.DISPUTED
  ]).optional(),
  payment_method: z.string().optional(),
  paid_at: z.string().optional(),
  waived_reason: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional()
})

/**
 * GET /api/personal-use-charges
 * Get personal use charges with filtering
 */
router.get(
  '/',
  requirePermission('fuel_transaction:view:fleet'),
  async (req: AuthRequest, res: Response) => {
  try {
    const {
      driver_id,
      charge_period,
      charge_status,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query as any

    let query = `
      SELECT c.*,
             u.name as driver_name,
             u.email as driver_email
      FROM personal_use_charges c
      JOIN users u ON c.driver_id = u.id
      WHERE c.tenant_id = $1
    `
    const params: any[] = [req.user!.tenant_id]
    let paramCount = 1

    // Non-admin users can only see their own charges
    if (!['admin', 'fleet_manager'].includes(req.user!.role)) {
      paramCount++
      query += ` AND c.driver_id = $${paramCount}`
      params.push(req.user!.id)
    } else if (driver_id) {
      paramCount++
      query += ` AND c.driver_id = $${paramCount}`
      params.push(driver_id)
    }

    if (charge_period) {
      paramCount++
      query += ` AND c.charge_period = $${paramCount}`
      params.push(charge_period)
    }

    if (charge_status) {
      paramCount++
      query += ` AND c.charge_status = $${paramCount}`
      params.push(charge_status)
    }

    if (start_date) {
      paramCount++
      query += ` AND c.charge_period_start >= $${paramCount}`
      params.push(start_date)
    }

    if (end_date) {
      paramCount++
      query += ` AND c.charge_period_end <= $${paramCount}`
      params.push(end_date)
    }

    query += ` ORDER BY c.charge_period DESC, c.created_at DESC`

    // Get total count
    const countResult = await pool.query(
      query.replace(
        'SELECT c.*, u.name as driver_name, u.email as driver_email',
        'SELECT COUNT(*)'
      ),
      params
    )

    // Add pagination
    paramCount++
    query += ` LIMIT $${paramCount}`
    params.push(limit)

    paramCount++
    query += ` OFFSET $${paramCount}`
    params.push(offset)

    const result = await pool.query(query, params)

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
        has_more: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].count)
      }
    })
  } catch (error: any) {
    console.error('Get charges error:', error)
    res.status(500).json({ error: 'Failed to retrieve personal use charges' })
  }
})

/**
 * GET /api/personal-use-charges/:id
 * Get specific charge details
 */
router.get(
  '/:id',
  requirePermission('fuel_transaction:view:fleet'),
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              u.name as driver_name,
              u.email as driver_email,
              waiver.name as waived_by_name,
              t.usage_type,
              t.trip_date,
              t.start_location,
              t.end_location
       FROM personal_use_charges c
       JOIN users u ON c.driver_id = u.id
       LEFT JOIN users waiver ON c.waived_by_user_id = waiver.id
       LEFT JOIN trip_usage_classification t ON c.trip_usage_id = t.id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [req.params.id, req.user!.tenant_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Charge not found' })
    }

    const charge = result.rows[0]

    // Non-admin users can only see their own charges
    if (!['admin', 'fleet_manager'].includes(req.user!.role) &&
        charge.driver_id !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ success: true, data: charge })
  } catch (error: any) {
    console.error('Get charge error:', error)
    res.status(500).json({ error: 'Failed to retrieve charge details' })
  }
})

/**
 * POST /api/personal-use-charges/calculate
 * Calculate charges for a specific billing period
 */
router.post(
  '/calculate',
  requirePermission('fuel_transaction:view:fleet'),
  auditLog({ action: 'CALCULATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { driver_id, charge_period } = req.body as CalculateChargesRequest

      if (!driver_id || !charge_period) {
        return res.status(400).json({ error: 'driver_id and charge_period are required' })
      }

      // Validate charge period format (YYYY-MM)
      if (!/^\d{4}-\d{2}$/.test(charge_period)) {
        return res.status(400).json({ error: 'Invalid charge_period format. Use YYYY-MM' })
      }

      // Get policy to determine rate
      const policyResult = await pool.query(
        'SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      if (policyResult.rows.length === 0 || !policyResult.rows[0].charge_personal_use) {
        return res.status(400).json({
          error: 'Personal use charging is not enabled for this organization'
        })
      }

      const policy = policyResult.rows[0]
      const ratePerMile = policy.personal_use_rate_per_mile

      if (!ratePerMile) {
        return res.status(400).json({
          error: 'Personal use rate per mile is not configured'
        })
      }

      // Get all approved personal/mixed trips for the period
      const tripsResult = await pool.query(
        `SELECT id, trip_date, miles_personal, usage_type
         FROM trip_usage_classification
         WHERE driver_id = $1
           AND tenant_id = $2
           AND TO_CHAR(trip_date, 'YYYY-MM') = $3
           AND approval_status = 'approved'
           AND miles_personal > 0
         ORDER BY trip_date ASC`,
        [driver_id, req.user!.tenant_id, charge_period]
      )

      if (tripsResult.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            driver_id,
            charge_period,
            total_personal_miles: 0,
            rate_per_mile: ratePerMile,
            total_charge: 0,
            trips_included: 0,
            charge_breakdown: []
          },
          message: 'No personal use trips found for this period'
        })
      }

      // Calculate breakdown and totals
      const breakdown: ChargeBreakdownItem[] = []
      let totalPersonalMiles = 0

      for (const trip of tripsResult.rows) {
        const personalMiles = parseFloat(trip.miles_personal)
        const charge = Math.round(personalMiles * ratePerMile * 100) / 100

        breakdown.push({
          trip_usage_id: trip.id,
          trip_date: trip.trip_date,
          miles_personal: personalMiles,
          rate: ratePerMile,
          charge
        })

        totalPersonalMiles += personalMiles
      }

      const totalCharge = Math.round(totalPersonalMiles * ratePerMile * 100) / 100

      const response: CalculateChargesResponse = {
        driver_id,
        charge_period,
        total_personal_miles: totalPersonalMiles,
        rate_per_mile: ratePerMile,
        total_charge: totalCharge,
        trips_included: tripsResult.rows.length,
        charge_breakdown: breakdown
      }

      // Track charge calculation in Application Insights
      appInsightsService.trackChargeCalculation(
        driver_id,
        charge_period,
        totalCharge,
        totalPersonalMiles
      )

      res.json({
        success: true,
        data: response,
        message: `Calculated ${response.trips_included} trips totaling $${totalCharge.toFixed(2)}`
      })
    } catch (error: any) {
      console.error('Calculate charges error:', error)
      res.status(500).json({ error: 'Failed to calculate charges' })
    }
  }
)

/**
 * POST /api/personal-use-charges
 * Create a new charge record (typically after calculation)
 */
router.post(
  '/',
  requirePermission('fuel_transaction:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = createChargeSchema.parse(req.body)

      // Calculate total charge
      const totalCharge = Math.round(validated.miles_charged * validated.rate_per_mile * 100) / 100

      const result = await pool.query(
        `INSERT INTO personal_use_charges (
          tenant_id, driver_id, trip_usage_id, charge_period,
          charge_period_start, charge_period_end, miles_charged,
          rate_per_mile, total_charge, notes, created_by_user_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          req.user!.tenant_id,
          validated.driver_id,
          validated.trip_usage_id || null,
          validated.charge_period,
          validated.charge_period_start,
          validated.charge_period_end,
          validated.miles_charged,
          validated.rate_per_mile,
          totalCharge,
          validated.notes || null,
          req.user!.id
        ]
      )

      const charge = result.rows[0]

      // Track charge creation in Application Insights
      appInsightsService.trackChargeCalculation(
        validated.driver_id,
        validated.charge_period,
        totalCharge,
        validated.miles_charged
      )

      // Check usage limits and send warnings if needed
      const policyResult = await pool.query(
        'SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      if (policyResult.rows.length > 0) {
        const policy = policyResult.rows[0]

        // Check monthly usage
        const monthlyUsage = await pool.query(
          `SELECT SUM(miles_personal) as total_miles
           FROM trip_usage_classification
           WHERE driver_id = $1 AND tenant_id = $2
             AND TO_CHAR(trip_date, 'YYYY-MM') = $3
             AND approval_status = 'approved'`,
          [validated.driver_id, req.user!.tenant_id, validated.charge_period]
        )

        const totalMonthlyMiles = parseFloat(monthlyUsage.rows[0]?.total_miles || 0)
        const monthlyLimit = policy.max_personal_miles_per_month

        if (monthlyLimit && totalMonthlyMiles > 0) {
          const monthlyPercentage = Math.round((totalMonthlyMiles / monthlyLimit) * 100)

          if (monthlyPercentage >= 80) {
            appInsightsService.trackLimitWarning(validated.driver_id, 'month', monthlyPercentage)

            // Send email warning
            const driverInfo = await pool.query(
              'SELECT first_name, last_name, email FROM users WHERE id = $1',
              [validated.driver_id]
            )

            if (driverInfo.rows.length > 0) {
              const driver = driverInfo.rows[0]
              emailNotificationService.sendLimitWarning({
                driverEmail: driver.email,
                driverName: `${driver.first_name} ${driver.last_name}`,
                currentMiles: totalMonthlyMiles,
                limitMiles: monthlyLimit,
                percentageUsed: monthlyPercentage,
                period: 'month'
              }).catch(error => {
                logger.error('Failed to send limit warning email', { error: error.message })
              })
            }

            // Track policy violation if over limit
            if (monthlyPercentage > 100) {
              appInsightsService.trackPolicyViolation(
                validated.driver_id,
                'monthly_limit_exceeded',
                `${totalMonthlyMiles} miles used (${monthlyPercentage}% of ${monthlyLimit} limit)`
              )
            }
          }
        }
      }

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: `Charge created: $${totalCharge.toFixed(2)} for ${validated.miles_charged} miles`
      })
    } catch (error: any) {
      console.error('Create charge error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors })
      }
      res.status(500).json({ error: 'Failed to create charge' })
    }
  }
)

/**
 * PATCH /api/personal-use-charges/:id
 * Update charge status (mark as paid, waived, etc.)
 */
router.patch(
  '/:id',
  requirePermission('fuel_transaction:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const validated = updateChargeSchema.parse(req.body)

      // Get existing charge
      const existing = await pool.query(
        'SELECT id, tenant_id, trip_id, driver_id, charge_date, charge_amount, status, created_at, updated_at FROM personal_use_charges WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (existing.rows.length === 0) {
        return res.status(404).json({ error: 'Charge not found' })
      }

      // Build update query
      const updates: string[] = []
      const values: any[] = []
      let paramCount = 2 // Starting from $3

      if (validated.charge_status) {
        paramCount++
        updates.push(`charge_status = $${paramCount}`)
        values.push(validated.charge_status)

        // Automatic field updates based on status
        if (validated.charge_status === ChargeStatus.PAID && !validated.paid_at) {
          paramCount++
          updates.push(`paid_at = $${paramCount}`)
          values.push(new Date().toISOString())
        }

        if (validated.charge_status === ChargeStatus.WAIVED) {
          if (!validated.waived_reason) {
            return res.status(400).json({ error: 'waived_reason is required when waiving a charge' })
          }
          paramCount++
          updates.push(`waived_by_user_id = $${paramCount}`)
          values.push(req.user!.id)
          paramCount++
          updates.push(`waived_at = $${paramCount}`)
          values.push(new Date().toISOString())
        }
      }

      if (validated.payment_method !== undefined) {
        paramCount++
        updates.push(`payment_method = $${paramCount}`)
        values.push(validated.payment_method)
      }

      if (validated.paid_at !== undefined) {
        paramCount++
        updates.push(`paid_at = $${paramCount}`)
        values.push(validated.paid_at)
      }

      if (validated.waived_reason !== undefined) {
        paramCount++
        updates.push(`waived_reason = $${paramCount}`)
        values.push(validated.waived_reason)
      }

      if (validated.invoice_number !== undefined) {
        paramCount++
        updates.push(`invoice_number = $${paramCount}`)
        values.push(validated.invoice_number)
      }

      if (validated.invoice_date !== undefined) {
        paramCount++
        updates.push(`invoice_date = $${paramCount}`)
        values.push(validated.invoice_date)
      }

      if (validated.due_date !== undefined) {
        paramCount++
        updates.push(`due_date = $${paramCount}`)
        values.push(validated.due_date)
      }

      if (validated.notes !== undefined) {
        paramCount++
        updates.push(`notes = $${paramCount}`)
        values.push(validated.notes)
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const result = await pool.query(
        `UPDATE personal_use_charges
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2
         RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Charge updated successfully'
      })
    } catch (error: any) {
      console.error('Update charge error:', error)
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors })
      }
      res.status(500).json({ error: 'Failed to update charge' })
    }
  }
)

/**
 * GET /api/personal-use-charges/summary
 * Get charges summary by status (admin only)
 */
router.get(
  '/summary',
  requirePermission('fuel_transaction:view:fleet'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { charge_period } = req.query

      let whereClause = 'WHERE tenant_id = $1'
      const params: any[] = [req.user!.tenant_id]

      if (charge_period) {
        whereClause += ' AND charge_period = $2'
        params.push(charge_period)
      }

      const result = await pool.query(
        `SELECT
           charge_status,
           COUNT(*) as count,
           SUM(total_charge) as total_amount,
           SUM(miles_charged) as total_miles
         FROM personal_use_charges
         ${whereClause}
         GROUP BY charge_status
         ORDER BY charge_status`,
        params
      )

      // Calculate totals
      const summary = {
        by_status: result.rows,
        totals: {
          total_charges: 0,
          total_amount: 0,
          total_miles: 0
        }
      }

      result.rows.forEach(row => {
        summary.totals.total_charges += parseInt(row.count)
        summary.totals.total_amount += parseFloat(row.total_amount || 0)
        summary.totals.total_miles += parseFloat(row.total_miles || 0)
      })

      res.json({
        success: true,
        data: summary,
        metadata: charge_period ? { charge_period } : {}
      })
    } catch (error: any) {
      console.error('Get charges summary error:', error)
      res.status(500).json({ error: 'Failed to retrieve charges summary' })
    }
  }
)

/**
 * POST /api/personal-use-charges/bulk-create
 * Create charges for all drivers for a specific period (admin only)
 */
router.post(
  '/bulk-create',
  requirePermission('fuel_transaction:create:global'),
  auditLog({ action: 'BULK_CREATE', resourceType: 'personal_use_charges' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { charge_period } = req.body

      if (!charge_period || !/^\d{4}-\d{2}$/.test(charge_period)) {
        return res.status(400).json({ error: 'Valid charge_period (YYYY-MM) is required' })
      }

      // Get policy
      const policyResult = await pool.query(
        'SELECT id, tenant_id, policy_name, deduction_percent, reimbursement_method, created_at, updated_at FROM personal_use_policies WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      if (policyResult.rows.length === 0 || !policyResult.rows[0].charge_personal_use) {
        return res.status(400).json({
          error: 'Personal use charging is not enabled'
        })
      }

      const policy = policyResult.rows[0]
      const ratePerMile = policy.personal_use_rate_per_mile

      // Get period dates
      const periodDates = getChargePeriodDates(charge_period)

      // Get all drivers with personal use in this period
      const driversResult = await pool.query(
        `SELECT
           driver_id,
           SUM(miles_personal) as total_personal_miles
         FROM trip_usage_classification
         WHERE tenant_id = $1
           AND TO_CHAR(trip_date, 'YYYY-MM') = $2
           AND approval_status = 'approved'
           AND miles_personal > 0
         GROUP BY driver_id
         HAVING SUM(miles_personal) > 0`,
        [req.user!.tenant_id, charge_period]
      )

      const chargesCreated = []

      for (const driver of driversResult.rows) {
        const totalCharge = Math.round(driver.total_personal_miles * ratePerMile * 100) / 100

        const result = await pool.query(
          `INSERT INTO personal_use_charges (
            tenant_id, driver_id, charge_period,
            charge_period_start, charge_period_end,
            miles_charged, rate_per_mile, total_charge,
            created_by_user_id
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            req.user!.tenant_id,
            driver.driver_id,
            charge_period,
            periodDates.start.toISOString().split('T')[0],
            periodDates.end.toISOString().split('T')[0],
            driver.total_personal_miles,
            ratePerMile,
            totalCharge,
            req.user!.id
          ]
        )

        chargesCreated.push(result.rows[0])
      }

      res.json({
        success: true,
        data: chargesCreated,
        message: `Created ${chargesCreated.length} charges for period ${charge_period}`
      })
    } catch (error: any) {
      console.error('Bulk create charges error:', error)
      res.status(500).json({ error: 'Failed to create bulk charges' })
    }
  }
)

export default router
