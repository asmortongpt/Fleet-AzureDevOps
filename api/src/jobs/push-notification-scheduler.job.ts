/**
 * Push Notification Scheduler Job
 * Processes scheduled push notifications and sends them at the appropriate time
 */

import cron from 'node-cron';
import { pushNotificationService } from '../services/push-notification.service';

class PushNotificationScheduler {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start the push notification scheduler
   * Runs every minute to check for scheduled notifications
   */
  start() {
    if (this.cronJob) {
      console.log('Push notification scheduler is already running');
      return;
    }

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        console.error('Error in push notification scheduler:', error);
      }
    });

    console.log('Push notification scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Push notification scheduler stopped');
    }
  }

  /**
   * Process all scheduled notifications that are due
   */
  private async processScheduledNotifications() {
    try {
      await pushNotificationService.processScheduledNotifications();
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
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
