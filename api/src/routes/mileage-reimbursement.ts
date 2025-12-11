Thank you for providing the complete refactored version of the `mileage-reimbursement.ts` file. I'll review the changes and provide some observations and suggestions.

Observations:

1. All database queries have been successfully replaced with calls to the `TenantRepository` class, specifically using the `getTenantMileageRate` method.

2. The POST route for calculating mileage reimbursement has been completed, including error handling and logging.

3. The code structure and organization remain consistent with the original file.

4. Error handling and logging using Winston have been maintained throughout the file.

5. The use of environment variables for configuration settings is still in place.

Suggestions:

1. Consider adding input validation for the `tenant_id` in both GET and POST routes to ensure it's a valid string.

2. In the POST route, you might want to add a check for `MILEAGE_CONFIG.allowCustomRates` before attempting to fetch a tenant-specific rate.

3. You could add more detailed comments explaining the logic flow in both routes, especially in the POST route where there are multiple conditional paths.

4. Consider adding a rate limit to the external API calls to prevent abuse.

Here's the code with these suggestions implemented:


import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 18: Add Winston logger
import axios from 'axios'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { TenantRepository } from '../repositories/tenant-repository'
import rateLimit from 'express-rate-limit'

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

// Rate limiter for external API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
})

/**
 * GET /api/mileage-reimbursement/rates
 * Get current federal mileage reimbursement rates
 */
router.get('/rates', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.query

    // Validate tenant_id if provided
    if (tenant_id && typeof tenant_id !== 'string') {
      throw new ValidationError('Invalid tenant_id format')
    }

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
router.post('/calculate', csrfProtection, apiLimiter, async (req: Request, res: Response) => {
  try {
    const { miles, tenant_id } = req.body

    // Validate input
    if (!miles || isNaN(Number(miles)) || Number(miles) < 0) {
      throw new ValidationError('Invalid mileage value')
    }

    if (tenant_id && typeof tenant_id !== 'string') {
      throw new ValidationError('Invalid tenant_id format')
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


These changes enhance the robustness and security of the API while maintaining the core functionality. The rate limiter helps prevent abuse of the external API, and the additional input validation ensures that the data being processed is in the expected format.