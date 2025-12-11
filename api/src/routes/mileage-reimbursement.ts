Here's the complete refactored version of the `mileage-reimbursement.ts` file, replacing all `pool.query` and `db.query` with repository methods. I've assumed the existence of a `TenantRepository` class with the necessary methods and completed the POST route that was cut off in the original code.


import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 18: Add Winston logger
import axios from 'axios'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { TenantRepository } from '../repositories/tenant-repository'

const router = express.Router()

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

const tenantRepository = container.resolve<TenantRepository>('TenantRepository')

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
        const tenantRate = await tenantRepository.getTenantMileageRate(tenant_id as string)

        if (tenantRate) {
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
  } catch (error: any) {
    logger.error('Error fetching mileage rates:', error) // Wave 18: Winston logger
    res.status(500).json({ error: 'Failed to fetch mileage rates', message: getErrorMessage(error) })
  }
})

/**
 * POST /api/mileage-reimbursement/calculate
 * Calculate mileage reimbursement based on federal guidelines
 */
router.post('/calculate', csrfProtection, async (req: Request, res: Response) => {
  try {
    const { miles, tenant_id } = req.body

    if (!miles || isNaN(Number(miles)) || Number(miles) < 0) {
      throw new ValidationError('Invalid mileage value')
    }

    let rate: number
    let source: string

    // If external API is configured (e.g., GSA), fetch live rates
    if (MILEAGE_CONFIG.externalApiEndpoint && MILEAGE_CONFIG.externalApiKey) {
      try {
        const response = await axios.get(MILEAGE_CONFIG.externalApiEndpoint, {
          headers: {
            'Authorization': `Bearer ${MILEAGE_CONFIG.externalApiKey}`
          },
          timeout: 5000
        })

        rate = response.data.mileage_rate || response.data.rate
        source = 'external_api'
      } catch (apiError) {
        logger.error('External API error, falling back to configured rate:', apiError)
        rate = MILEAGE_CONFIG.defaultRate
        source = 'irs_standard'
      }
    } else {
      // Check for tenant-specific rates in database
      if (tenant_id && MILEAGE_CONFIG.allowCustomRates) {
        try {
          const tenantRate = await tenantRepository.getTenantMileageRate(tenant_id)

          if (tenantRate) {
            rate = parseFloat(tenantRate.rate)
            source = 'tenant_config'
          } else {
            rate = MILEAGE_CONFIG.defaultRate
            source = 'irs_standard'
          }
        } catch (dbError) {
          logger.error('Database error fetching tenant rate:', dbError)
          rate = MILEAGE_CONFIG.defaultRate
          source = 'irs_standard'
        }
      } else {
        rate = MILEAGE_CONFIG.defaultRate
        source = 'irs_standard'
      }
    }

    const reimbursement = Number(miles) * rate

    res.json({
      miles: Number(miles),
      rate,
      reimbursement: parseFloat(reimbursement.toFixed(2)),
      source,
      effective_date: MILEAGE_CONFIG.effectiveDate,
      organization: MILEAGE_CONFIG.organizationName,
      last_updated: new Date().toISOString()
    })
  } catch (error: any) {
    logger.error('Error calculating mileage reimbursement:', error)
    if (error instanceof ValidationError) {
      res.status(400).json({ error: 'Validation error', message: error.message })
    } else {
      res.status(500).json({ error: 'Failed to calculate mileage reimbursement', message: getErrorMessage(error) })
    }
  }
})

export default router


This refactored version replaces all database queries with calls to the `TenantRepository` class. The `getTenantMileageRate` method is used to fetch tenant-specific rates. The POST route for calculating mileage reimbursement has been completed, including error handling and logging.