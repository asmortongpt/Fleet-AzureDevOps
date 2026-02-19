import axios from 'axios'
import express, { Request, Response } from 'express'
import { z } from 'zod'

import logger from '../config/logger'; // Wave 18: Add Winston logger
import { pool } from '../db/connection';
import { ValidationError } from '../errors/app-error'
import { csrfProtection } from '../middleware/csrf'
import { getErrorMessage } from '../utils/error-handler'
import { authenticateJWT } from '../middleware/auth'


const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const calculateMileageSchema = z.object({
  miles: z.number().min(0.1, 'Miles must be greater than 0').max(10000),
  origin: z.string().min(1).max(500).optional(),
  destination: z.string().min(1).max(500).optional(),
  trip_date: z.string().max(30).optional(),
  vehicle_type: z.string().max(50).optional(),
  custom_rate: z.number().min(0).max(10).optional(),
  tenant_id: z.string().uuid().optional(),
  driver_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  purpose: z.string().max(1000).optional(),
})

const validateTripSchema = z.object({
  origin: z.string().min(1).max(500),
  destination: z.string().min(1).max(500),
  miles: z.number().min(0.1).max(10000),
  trip_date: z.string().min(1).max(30),
  purpose: z.string().min(1).max(1000),
  vehicle_id: z.string().uuid().optional(),
  driver_id: z.string().uuid(),
})

const updateTenantRateSchema = z.object({
  rate: z.number().min(0.01, 'Rate must be greater than 0').max(10),
  effective_date: z.string().max(30).optional(),
})

/**
 * Federal Mileage Reimbursement Rate Configuration
 * Based on IRS standard mileage rates (updated annually by federal guidelines)
 */
const MILEAGE_CONFIG = {
  // Current IRS standard mileage rate (federal guideline)
  defaultRate: parseFloat(process.env.MILEAGE_RATE_DEFAULT || '0.67'), // $0.67 per mile as of 2024
  effectiveDate: process.env.MILEAGE_RATE_EFFECTIVE_DATE || '2024-01-01',

  // External API configuration (optional - for GSA or IRS rate lookups)
  externalApiEndpoint: process.env.MILEAGE_API_ENDPOINT || null,
  externalApiKey: process.env.MILEAGE_API_KEY || null,

  // Organization-specific settings
  organizationName: process.env.ORGANIZATION_NAME || 'Organization',
  allowCustomRates: process.env.ALLOW_CUSTOM_RATES === 'true'
}

/**
 * GET /api/mileage-reimbursement/rates
 * Get current federal mileage reimbursement rates
 */
router.get('/rates', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.query

    // If external API is configured (e.g., GSA), fetch live rates
    if (MILEAGE_CONFIG.externalApiEndpoint && MILEAGE_CONFIG.externalApiKey) {
      try {
        const response = await axios.get(MILEAGE_CONFIG.externalApiEndpoint, {
          headers: {
            'Authorization': `Bearer ${MILEAGE_CONFIG.externalApiKey}`
          },
          timeout: 5000
        })

        return res.json({
          source: 'external_api',
          rate: response.data.mileage_rate || response.data.rate,
          effective_date: response.data.effective_date,
          last_updated: new Date().toISOString(),
          organization: MILEAGE_CONFIG.organizationName
        })
      } catch (apiError) {
        logger.error('External API error, falling back to configured rate:', apiError) // Wave 18: Winston logger
      }
    }

    // Check for tenant-specific rates in database
    if (tenant_id) {
      try {
        const tenantRateResult = await pool.query(
          `SELECT settings->>'mileage_rate' as rate,
                  settings->>'rate_effective_date' as effective_date
           FROM tenants
           WHERE id = $1 AND settings->>'mileage_rate' IS NOT NULL`,
          [tenant_id]
        )

        if (tenantRateResult.rows.length > 0) {
          const tenantRate = tenantRateResult.rows[0]
          return res.json({
            source: 'tenant_config',
            rate: parseFloat(tenantRate.rate),
            effective_date: tenantRate.effective_date || MILEAGE_CONFIG.effectiveDate,
            tenant_id,
            last_updated: new Date().toISOString()
          })
        }
      } catch (dbError) {
        logger.error('Database error fetching tenant rate:', dbError) // Wave 18: Winston logger
      }
    }

    // Return default IRS rate (federal guideline)
    res.json({
      source: 'irs_standard',
      rate: MILEAGE_CONFIG.defaultRate,
      effective_date: MILEAGE_CONFIG.effectiveDate,
      organization: MILEAGE_CONFIG.organizationName,
      note: 'Using IRS standard mileage rate (federal guideline). Configure MILEAGE_API_ENDPOINT for GSA rates or set tenant-specific rates.',
      last_updated: new Date().toISOString()
    })
  } catch (error: unknown) {
    logger.error('Error fetching mileage rates:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch mileage rates', message: getErrorMessage(error) })
  }
})

/**
 * POST /api/mileage-reimbursement/calculate
 * Calculate mileage reimbursement based on federal guidelines
 */
router.post('/calculate',csrfProtection, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parsed = calculateMileageSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      })
    }

    const {
      miles,
      origin,
      destination,
      trip_date,
      vehicle_type = 'standard',
      custom_rate,
      tenant_id,
      driver_id,
      vehicle_id,
      purpose
    } = parsed.data

    // Determine applicable rate
    let applicableRate = MILEAGE_CONFIG.defaultRate
    let rateSource = 'irs_standard'

    // Priority 1: Custom rate (if allowed)
    if (custom_rate && MILEAGE_CONFIG.allowCustomRates) {
      applicableRate = custom_rate
      rateSource = 'custom'
    } else if (tenant_id) {
      // Priority 2: Tenant-specific rate
      try {
        const tenantRateResult = await pool.query(
          `SELECT settings->>'mileage_rate' as rate FROM tenants WHERE id = $1`,
          [tenant_id]
        )
        if (tenantRateResult.rows.length > 0 && tenantRateResult.rows[0].rate) {
          applicableRate = parseFloat(tenantRateResult.rows[0].rate)
          rateSource = 'tenant'
        }
      } catch (dbError) {
        logger.error('Error fetching tenant rate:', dbError) // Wave 18: Winston logger
      }
    }

    // Calculate reimbursement
    const milesFloat = miles
    const reimbursementAmount = parseFloat((milesFloat * applicableRate).toFixed(2))

    // Build response
    const calculations = {
      miles: milesFloat,
      rate_per_mile: applicableRate,
      reimbursement_amount: reimbursementAmount,
      trip_date: trip_date || new Date().toISOString().split('T')[0],
      vehicle_type,
      origin,
      destination,
      driver_id,
      vehicle_id,
      purpose,
      rate_source: rateSource,
      rate_effective_date: MILEAGE_CONFIG.effectiveDate,
      calculated_at: new Date().toISOString(),
      compliance: {
        meets_federal_guidelines: true,
        irs_rate_used: rateSource === 'irs_standard'
      },
      breakdown: {
        base_mileage: reimbursementAmount,
        additional_fees: 0, // Could add tolls, parking, etc.
        tax: 0,
        total: reimbursementAmount
      }
    }

    res.json(calculations)
  } catch (error: unknown) {
    logger.error('Error calculating mileage:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to calculate mileage', message: getErrorMessage(error) })
  }
})

/**
 * GET /api/mileage-reimbursement/rates/history
 * Get historical federal mileage rates (IRS standard)
 */
router.get('/rates/history', async (req: Request, res: Response) => {
  try {
    // Historical IRS rates (federal guidelines)
    const irsHistoricalRates = [
      { year: 2024, rate: 0.67, effective_date: '2024-01-01', source: 'IRS' },
      { year: 2023, rate: 0.655, effective_date: '2023-01-01', source: 'IRS' },
      { year: 2022, rate: 0.625, effective_date: '2022-07-01', source: 'IRS' },
      { year: 2022, rate: 0.585, effective_date: '2022-01-01', source: 'IRS' },
      { year: 2021, rate: 0.56, effective_date: '2021-01-01', source: 'IRS' },
      { year: 2020, rate: 0.575, effective_date: '2020-01-01', source: 'IRS' },
      { year: 2019, rate: 0.58, effective_date: '2019-01-01', source: 'IRS' },
      { year: 2018, rate: 0.545, effective_date: '2018-01-01', source: 'IRS' }
    ]

    res.json({
      federal_rates: irsHistoricalRates,
      current_rate: MILEAGE_CONFIG.defaultRate,
      organization: MILEAGE_CONFIG.organizationName,
      note: 'IRS standard mileage rates per federal guidelines. Updated annually.'
    })
  } catch (error: unknown) {
    logger.error('Error fetching rate history:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch rate history', message: getErrorMessage(error) })
  }
})

/**
 * POST /api/mileage-reimbursement/validate-trip
 * Validate trip data for federal reimbursement compliance
 */
router.post('/validate-trip',csrfProtection, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parsed = validateTripSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      })
    }

    const {
      origin,
      destination,
      miles,
      trip_date,
      purpose,
      vehicle_id,
      driver_id
    } = parsed.data

    const validationErrors: string[] = []
    const warnings: string[] = []

    // Federal compliance validations
    if (miles > 500) {
      warnings.push('Trip exceeds 500 miles - may require additional documentation per federal guidelines')
    }

    if (miles > 1000) {
      validationErrors.push('Trip exceeds reasonable distance - consider alternative transportation per federal travel policy')
    }

    const tripDate = new Date(trip_date)
    const today = new Date()

    if (tripDate > today) {
      validationErrors.push('Trip date cannot be in the future')
    }

    // Federal submission timelines
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    if (tripDate < thirtyDaysAgo) {
      warnings.push('Trip is older than 30 days - submit within 30 days per federal guidelines')
    }

    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    if (tripDate < sixtyDaysAgo) {
      validationErrors.push('Trip is older than 60 days - exceeds federal reimbursement deadline')
    }

    res.json({
      is_valid: validationErrors.length === 0,
      meets_federal_guidelines: validationErrors.length === 0 && warnings.length === 0,
      errors: validationErrors,
      warnings,
      validated_at: new Date().toISOString(),
      requires_approval: warnings.length > 0 || miles > 300,
      federal_compliance: {
        submission_timely: tripDate >= thirtyDaysAgo,
        purpose_documented: !!purpose,
        distance_reasonable: miles <= 500
      }
    })
  } catch (error: unknown) {
    logger.error('Error validating trip:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to validate trip', message: getErrorMessage(error) })
  }
})

/**
 * PUT /api/mileage-reimbursement/rates/tenant/:tenant_id
 * Update tenant-specific mileage rate (must not exceed federal rate)
 */
router.put('/rates/tenant/:tenant_id',csrfProtection, async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.params

    // Validate request body
    const parsed = updateTenantRateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten()
      })
    }

    const { rate, effective_date } = parsed.data

    // Federal compliance check - cannot exceed IRS rate
    if (rate > MILEAGE_CONFIG.defaultRate) {
      return res.status(400).json({
        error: 'Rate cannot exceed federal IRS standard mileage rate',
        max_allowed_rate: MILEAGE_CONFIG.defaultRate,
        requested_rate: rate
      })
    }

    // SECURITY: Admin authorization required to update mileage rates
    if (req.user?.role !== 'admin' && req.user?.role !== 'fleet_manager') {
      return res.status(403).json({
        error: 'Admin or Fleet Manager access required to update mileage rates'
      })
    }

    await pool.query(
      `UPDATE tenants
       SET settings = settings || jsonb_build_object('mileage_rate', $1, 'rate_effective_date', $2),
           updated_at = NOW()
       WHERE id = $3`,
      [rate.toString(), effective_date || new Date().toISOString().split('T')[0], tenant_id]
    )

    res.json({
      success: true,
      tenant_id,
      rate,
      effective_date: effective_date || new Date().toISOString().split('T')[0],
      message: 'Tenant mileage rate updated successfully (within federal guidelines)',
      compliance: {
        meets_federal_guidelines: rate <= MILEAGE_CONFIG.defaultRate,
        irs_standard_rate: MILEAGE_CONFIG.defaultRate
      }
    })
  } catch (error: unknown) {
    logger.error('Error updating tenant rate:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to update tenant rate', message: getErrorMessage(error) })
  }
})

export default router
