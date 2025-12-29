#!/usr/bin/env node

/**
 * Camera Sync Script
 *
 * Standalone script to synchronize traffic cameras from external sources.
 * Designed to be run as a Kubernetes CronJob.
 */

import { cameraSyncService } from '../services/camera-sync'
import { logger } from '../config/logger'

async function main() {
  logger.info('Camera sync job starting')

  try {
    await cameraSyncService.syncAll()
    logger.info('Camera sync job completed successfully')
    process.exit(0)
  } catch (error: any) {
    logger.error('Camera sync job failed', { error: error.message, stack: error.stack })
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise })
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
  process.exit(1)
})

main()
