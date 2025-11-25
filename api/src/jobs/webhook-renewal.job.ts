/**
 * Webhook Subscription Renewal Job
 *
 * Automatically renews Microsoft Graph webhook subscriptions before they expire
 * Runs every hour to check for subscriptions expiring within 12 hours
 *
 * Microsoft Graph subscription lifetimes:
 * - Teams messages: 60 minutes maximum
 * - Outlook emails: 4230 minutes (about 3 days) maximum
 * - Calendar events: 4230 minutes (about 3 days) maximum
 */

import cron from 'node-cron'
import * as winston from 'winston'
import webhookService from '../services/webhook.service'
import pool from '../config/database'

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

// Configuration from environment
const CRON_SCHEDULE = process.env.WEBHOOK_RENEWAL_CRON_SCHEDULE || '0 * * * *' // Every hour
const ENABLE_RENEWAL = process.env.ENABLE_WEBHOOK_RENEWAL !== 'false' // Enabled by default
const RENEWAL_THRESHOLD_HOURS = parseInt(process.env.WEBHOOK_RENEWAL_THRESHOLD_HOURS || '12') // Renew 12 hours before expiry

/**
 * Main renewal function
 */
async function runWebhookRenewal(): Promise<void> {
  const startTime = Date.now()
  logger.info('=== Webhook Subscription Renewal Started ===')

  try {
    // Clean up expired subscriptions first
    await webhookService.cleanupExpiredSubscriptions()

    // Find subscriptions that need renewal
    const threshold = new Date(Date.now() + RENEWAL_THRESHOLD_HOURS * 60 * 60 * 1000)

    const result = await pool.query(
      `SELECT subscription_id, subscription_type, expiration_date_time, team_id, channel_id, user_email
       FROM webhook_subscriptions
       WHERE status = 'active'
       AND expiration_date_time < $1
       AND renewal_failure_count < 3
       ORDER BY expiration_date_time ASC`,
      [threshold]
    )

    const subscriptions = result.rows
    logger.info(`Found ${subscriptions.length} subscriptions requiring renewal`)

    if (subscriptions.length === 0) {
      logger.info('No subscriptions need renewal at this time')
      return
    }

    // Renew each subscription
    let successCount = 0
    let failureCount = 0

    for (const subscription of subscriptions) {
      try {
        logger.info(`Renewing subscription: ${subscription.subscription_id} (type: ${subscription.subscription_type})`)

        await webhookService.renewSubscription(subscription.subscription_id)

        successCount++
        logger.info(`✅ Renewed: ${subscription.subscription_id}`)
      } catch (error: any) {
        failureCount++
        logger.error(`❌ Failed to renew ${subscription.subscription_id}:`, error.message)

        // Check if renewal has failed too many times
        const failureResult = await pool.query(
          `SELECT renewal_failure_count FROM webhook_subscriptions WHERE subscription_id = $1',
          [subscription.subscription_id]
        )

        const dbFailureCount = failureResult.rows[0]?.renewal_failure_count || 0

        if (dbFailureCount >= 3) {
          logger.error(`Subscription ${subscription.subscription_id} has failed renewal 3 times, marking as failed`)

          await pool.query(
            `UPDATE webhook_subscriptions SET status = 'failed' WHERE subscription_id = $1',
            [subscription.subscription_id]
          )

          // If it's a critical subscription, try to recreate it
          if (subscription.subscription_type === 'teams_messages' && subscription.team_id && subscription.channel_id) {
            logger.info(`Attempting to recreate failed Teams subscription for team ${subscription.team_id}`)

            try {
              // Get tenant ID from database
              const tenantResult = await pool.query(
                `SELECT tenant_id FROM webhook_subscriptions WHERE subscription_id = $1',
                [subscription.subscription_id]
              )

              if (tenantResult.rows.length > 0) {
                await webhookService.subscribeToTeamsMessages({
                  tenantId: tenantResult.rows[0].tenant_id,
                  subscriptionType: 'teams_messages',
                  teamId: subscription.team_id,
                  channelId: subscription.channel_id
                })

                logger.info('✅ Successfully recreated Teams subscription')
              }
            } catch (recreateError: any) {
              logger.error('Failed to recreate subscription:', recreateError.message)
            }
          } else if (subscription.subscription_type === 'outlook_emails' && subscription.user_email) {
            logger.info(`Attempting to recreate failed Outlook subscription for ${subscription.user_email}`)

            try {
              const tenantResult = await pool.query(
                `SELECT tenant_id, folder_id FROM webhook_subscriptions WHERE subscription_id = $1',
                [subscription.subscription_id]
              )

              if (tenantResult.rows.length > 0) {
                await webhookService.subscribeToOutlookEmails({
                  tenantId: tenantResult.rows[0].tenant_id,
                  subscriptionType: 'outlook_emails',
                  userEmail: subscription.user_email,
                  folderId: tenantResult.rows[0].folder_id
                })

                logger.info('✅ Successfully recreated Outlook subscription')
              }
            } catch (recreateError: any) {
              logger.error('Failed to recreate subscription:', recreateError.message)
            }
          }
        }
      }
    }

    const duration = Date.now() - startTime
    logger.info('=== Webhook Subscription Renewal Completed ===')
    logger.info(`Total subscriptions processed: ${subscriptions.length}`)
    logger.info(`Successfully renewed: ${successCount}`)
    logger.info(`Failed to renew: ${failureCount}`)
    logger.info(`Duration: ${duration}ms`)

    // Log statistics
    await logRenewalStats(successCount, failureCount, duration)

  } catch (error: any) {
    logger.error('Fatal error in webhook renewal job:', error.message)
    logger.error(error.stack)
  }
}

/**
 * Log renewal statistics to database
 */
async function logRenewalStats(successCount: number, failureCount: number, duration: number): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO webhook_events
       (subscription_id, change_type, resource, resource_data, processed)
       VALUES ($1, $2, $3, $4, true)`,
      [
        'system',
        'renewal_job',
        'webhook_renewal_stats',
        JSON.stringify({
          timestamp: new Date().toISOString(),
          successCount,
          failureCount,
          duration
        })
      ]
    )
  } catch (error) {
    logger.error('Failed to log renewal stats:', error)
  }
}

/**
 * Get renewal job statistics
 */
export async function getRenewalStats(): Promise<any> {
  try {
    // Active subscriptions by type
    const activeResult = await pool.query(
      `SELECT subscription_type, COUNT(*) as count
       FROM webhook_subscriptions
       WHERE status = 'active'
       GROUP BY subscription_type`
    )

    // Subscriptions expiring soon
    const expiringResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM webhook_subscriptions
       WHERE status = 'active'
       AND expiration_date_time < NOW() + INTERVAL '24 hours'`
    )

    // Failed subscriptions
    const failedResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM webhook_subscriptions
       WHERE status = 'failed'`
    )

    // Recent renewal activity
    const activityResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM webhook_subscriptions
       WHERE last_renewed_at > NOW() - INTERVAL '24 hours'`
    )

    return {
      active_by_type: activeResult.rows,
      expiring_soon: parseInt(expiringResult.rows[0]?.count || 0),
      failed: parseInt(failedResult.rows[0]?.count || 0),
      renewed_last_24h: parseInt(activityResult.rows[0]?.count || 0)
    }
  } catch (error) {
    logger.error('Failed to get renewal stats:', error)
    throw error
  }
}

/**
 * Start the renewal job
 */
export function start(): void {
  if (!ENABLE_RENEWAL) {
    logger.info('⏸️  Webhook renewal job is disabled')
    return
  }

  logger.info(`🔄 Starting webhook renewal job with schedule: ${CRON_SCHEDULE}`)
  logger.info(`⏰ Renewal threshold: ${RENEWAL_THRESHOLD_HOURS} hours before expiration`)

  // Schedule the job
  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      await runWebhookRenewal()
    } catch (error) {
      logger.error('Error in scheduled webhook renewal:', error)
    }
  })

  // Run immediately on startup
  logger.info('Running initial webhook renewal check...')
  runWebhookRenewal().catch(error => {
    logger.error('Error in initial webhook renewal:', error)
  })

  logger.info('✅ Webhook renewal job started successfully')
}

/**
 * Stop the renewal job (for graceful shutdown)
 */
export function stop(): void {
  logger.info('Stopping webhook renewal job...')
  // Cron jobs are stopped automatically when the process exits
}

export default {
  start,
  stop,
  getRenewalStats
}
