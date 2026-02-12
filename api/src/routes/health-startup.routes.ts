/**
 * Startup Health Check Routes
 *
 * Exposes comprehensive health check data via HTTP endpoints
 */

import express, { Request, Response } from 'express'
import { pool } from '../config/database'
import { runStartupHealthCheck } from '../services/health/startup-health-check.service'
import logger from '../utils/logger'
import { authenticateJWT } from '../middleware/auth'

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// Store the latest health check report in memory
let latestHealthReport: any = null

/**
 * GET /api/health/startup
 * Returns the latest startup health check results
 */
router.get('/startup', async (req: Request, res: Response) => {
  try {
    // Return cached report if available and recent (< 5 minutes old)
    if (latestHealthReport) {
      const reportAge = Date.now() - new Date(latestHealthReport.timestamp).getTime()
      if (reportAge < 5 * 60 * 1000) {
        return res.json({
          success: true,
          cached: true,
          cacheAge: Math.floor(reportAge / 1000),
          data: latestHealthReport
        })
      }
    }

    // Run fresh health check
    const report = await runStartupHealthCheck(pool)
    latestHealthReport = report

    res.json({
      success: true,
      cached: false,
      data: report
    })
  } catch (error) {
    logger.error('Failed to run startup health check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to run health check',
      message: (error as Error).message
    })
  }
})

/**
 * GET /api/health/startup/summary
 * Returns just the summary (faster, lighter response)
 */
router.get('/startup/summary', async (req: Request, res: Response) => {
  try {
    if (!latestHealthReport) {
      const report = await runStartupHealthCheck(pool)
      latestHealthReport = report
    }

    res.json({
      success: true,
      data: {
        timestamp: latestHealthReport.timestamp,
        overallStatus: latestHealthReport.overallStatus,
        totalChecks: latestHealthReport.totalChecks,
        passed: latestHealthReport.passed,
        warnings: latestHealthReport.warnings,
        failed: latestHealthReport.failed,
        summary: latestHealthReport.summary
      }
    })
  } catch (error) {
    logger.error('Failed to get health check summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get health check summary',
      message: (error as Error).message
    })
  }
})

/**
 * GET /api/health/startup/errors
 * Returns only the failed checks
 */
router.get('/startup/errors', async (req: Request, res: Response) => {
  try {
    if (!latestHealthReport) {
      const report = await runStartupHealthCheck(pool)
      latestHealthReport = report
    }

    const errors = latestHealthReport.results.filter((r: any) => r.status === 'error')
    const warnings = latestHealthReport.results.filter((r: any) => r.status === 'warning')

    res.json({
      success: true,
      data: {
        timestamp: latestHealthReport.timestamp,
        errorCount: errors.length,
        warningCount: warnings.length,
        errors,
        warnings
      }
    })
  } catch (error) {
    logger.error('Failed to get health check errors:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get health check errors',
      message: (error as Error).message
    })
  }
})

/**
 * POST /api/health/startup/refresh
 * Force a fresh health check (no cache)
 */
router.post('/startup/refresh', async (req: Request, res: Response) => {
  try {
    logger.info('Forcing fresh startup health check...')
    const report = await runStartupHealthCheck(pool)
    latestHealthReport = report

    res.json({
      success: true,
      message: 'Health check refreshed',
      data: report
    })
  } catch (error) {
    logger.error('Failed to refresh health check:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to refresh health check',
      message: (error as Error).message
    })
  }
})

/**
 * Initialize health check on module load
 */
export async function initializeStartupHealthCheck() {
  try {
    logger.info('Running initial startup health check...')
    const report = await runStartupHealthCheck(pool)
    latestHealthReport = report
    return report
  } catch (error) {
    logger.error('Failed to run initial health check:', error)
    return null
  }
}

export default router
