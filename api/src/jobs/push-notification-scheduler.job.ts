/**
 * Push Notification Scheduler Job
 * Processes scheduled push notifications and sends them at the appropriate time
 */

import cron, { ScheduledTask } from 'node-cron';

import logger from '../config/logger';
import { pushNotificationService } from '../services/push-notification.service';

class PushNotificationScheduler {
  private cronJob: ScheduledTask | null = null;

  /**
   * Start the push notification scheduler
   * Runs every minute to check for scheduled notifications
   */
  start() {
    if (this.cronJob) {
      logger.info('Push notification scheduler is already running');
      return;
    }

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        logger.error('Error in push notification scheduler', { error: error instanceof Error ? error.message : String(error) });
      }
    });

    logger.info('Push notification scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Push notification scheduler stopped');
    }
  }

  /**
   * Process all scheduled notifications that are due
   */
  private async processScheduledNotifications() {
    try {
      await pushNotificationService.processScheduledNotifications();
    } catch (error) {
      logger.error('Error processing scheduled notifications', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean } {
    return {
      running: this.cronJob !== null,
    };
  }
}

export default new PushNotificationScheduler();
