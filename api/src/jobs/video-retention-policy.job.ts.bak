/**
 * Video Retention Policy Enforcement Job
 * Automatically deletes expired videos based on retention policies
 * Preserves videos marked as evidence or under legal hold
 */

import cron from 'node-cron';
import { Pool } from 'pg';

import logger from '../config/logger';
import VideoTelematicsService from '../services/video-telematics.service';

class VideoRetentionPolicyJob {
  private db: Pool;
  private videoService: VideoTelematicsService;
  private isRunning: boolean = false;

  constructor(db: Pool) {
    this.db = db;
    this.videoService = new VideoTelematicsService(db);
  }

  /**
   * Start the retention policy job
   * Runs daily at 2 AM
   */
  start() {
    logger.info('Starting video retention policy job (daily at 2 AM)');

    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      await this.executeRetentionPolicy();
    });

    // Also run on startup (but delayed by 5 minutes)
    setTimeout(() => {
      this.executeRetentionPolicy();
    }, 5 * 60 * 1000);
  }

  /**
   * Execute retention policy
   */
  async executeRetentionPolicy(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Retention policy job already running, skipping this execution');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting video retention policy enforcement...');

      // 1. Delete expired standard retention videos
      const standardDeleted = await this.deleteExpiredVideos('standard');
      logger.info(`Deleted ${standardDeleted} standard retention videos`);

      // 2. Delete expired extended retention videos (not under legal hold)
      const extendedDeleted = await this.deleteExpiredVideos('extended');
      logger.info(`Deleted ${extendedDeleted} extended retention videos`);

      // 3. Check for videos requiring retention extension
      const extended = await this.extendRetentionForPendingCases();
      logger.info(`Extended retention for ${extended} videos with pending cases`);

      // 4. Generate retention report
      await this.generateRetentionReport();

      // 5. Notify about upcoming expirations
      await this.notifyUpcomingExpirations(7); // 7 days warning

      const duration = Date.now() - startTime;
      logger.info(`Video retention policy enforcement completed in ${duration}ms`);
      logger.info(`Total deleted: ${standardDeleted + extendedDeleted}, Extended: ${extended}`);
    } catch (error: any) {
      logger.error('Retention policy enforcement failed:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Delete expired videos by retention policy
   */
  private async deleteExpiredVideos(retentionPolicy: string): Promise<number> {
    try {
      // Find expired videos that are not protected
      const result = await this.db.query(
        `SELECT id, vehicle_id, video_storage_path, video_url
         FROM video_safety_events
         WHERE retention_policy = $1
           AND retention_expires_at < NOW()
           AND marked_as_evidence = false
           AND evidence_locker_id IS NULL
           AND (video_storage_path IS NOT NULL OR video_url IS NOT NULL)
           AND video_download_status != 'deleted'
         LIMIT 100`, // Process in batches
        [retentionPolicy]
      );

      const expiredVideos = result.rows;

      if (expiredVideos.length === 0) {
        return 0;
      }

      let deleted = 0;

      for (const video of expiredVideos) {
        try {
          // Use VideoTelematicsService to handle deletion
          // This will delete from Azure Storage and update database
          await this.videoService.cleanupExpiredVideos();
          deleted++;

          // Log deletion for audit
          await this.db.query(
            `INSERT INTO video_retention_audit
             (video_event_id, action, retention_policy, reason, deleted_at)
             VALUES ($1, 'deleted', $2, 'Retention period expired', NOW())`,
            [video.id, retentionPolicy]
          );
        } catch (error: any) {
          logger.error(`Failed to delete video ${video.id}:`, error.message);
        }
      }

      return deleted;
    } catch (error: any) {
      logger.error(`Failed to delete expired ${retentionPolicy} videos:`, error.message);
      return 0;
    }
  }

  /**
   * Extend retention for videos with pending legal cases
   */
  private async extendRetentionForPendingCases(): Promise<number> {
    try {
      const result = await this.db.query(
        `UPDATE video_safety_events vse
         SET retention_policy = 'permanent',
             retention_expires_at = NULL,
             updated_at = NOW()
         FROM evidence_locker el
         WHERE vse.evidence_locker_id = el.id
           AND el.legal_hold = true
           AND vse.retention_policy != 'permanent'
         RETURNING vse.id`
      );

      const extended = result.rowCount || 0;

      // Audit log
      for (const row of result.rows) {
        await this.db.query(
          `INSERT INTO video_retention_audit
           (video_event_id, action, retention_policy, reason, action_at)
           VALUES ($1, 'extended', 'permanent', 'Legal hold applied', NOW())`,
          [row.id]
        );
      }

      return extended;
    } catch (error: any) {
      logger.error('Failed to extend retention for pending cases:', error.message);
      return 0;
    }
  }

  /**
   * Generate retention policy report
   */
  private async generateRetentionReport(): Promise<void> {
    try {
      const result = await this.db.query(
        `SELECT
           retention_policy,
           COUNT(*) as video_count,
           SUM(video_file_size_mb) as total_size_mb,
           COUNT(CASE WHEN marked_as_evidence THEN 1 END) as evidence_count,
           COUNT(CASE WHEN evidence_locker_id IS NOT NULL THEN 1 END) as locker_count,
           COUNT(CASE WHEN retention_expires_at < NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon
         FROM video_safety_events
         WHERE video_download_status != 'deleted'
         GROUP BY retention_policy`
      );

      logger.info('Video Retention Report:');
      for (const row of result.rows) {
        logger.info(
          `  ${row.retention_policy}: ${row.video_count} videos, ` +
          `${row.total_size_mb?.toFixed(2) || 0} MB, ` +
          `${row.evidence_count} evidence, ` +
          `${row.locker_count} in locker, ` +
          `${row.expiring_soon} expiring within 7 days`
        );
      }

      // Store report in database
      await this.db.query(
        `INSERT INTO video_retention_reports (report_date, report_data, created_at)
         VALUES (CURRENT_DATE, $1, NOW())
         ON CONFLICT (report_date)
         DO UPDATE SET report_data = $1, updated_at = NOW()`,
        [JSON.stringify(result.rows)]
      );
    } catch (error: any) {
      logger.error('Failed to generate retention report:', error.message);
    }
  }

  /**
   * Notify about upcoming video expirations
   */
  private async notifyUpcomingExpirations(daysWarning: number): Promise<void> {
    try {
      const result = await this.db.query(
        `SELECT vse.id, vse.event_type, vse.severity, v.name as vehicle_name,
                d.first_name || ' ' || d.last_name as driver_name,
                vse.retention_expires_at
         FROM video_safety_events vse
         JOIN vehicles v ON vse.vehicle_id = v.id
         LEFT JOIN drivers d ON vse.driver_id = d.id
         WHERE vse.retention_expires_at BETWEEN NOW() AND NOW() + ($1::integer * INTERVAL '1 day')
           AND vse.marked_as_evidence = false
           AND vse.evidence_locker_id IS NULL
           AND vse.video_download_status != 'deleted'
         ORDER BY vse.retention_expires_at
         LIMIT 50`,
        [daysWarning]
      );

      if (result.rows.length > 0) {
        logger.warn(`${result.rows.length} videos expiring within ${daysWarning} days:`);

        for (const row of result.rows) {
          logger.warn(
            `  Event ${row.id}: ${row.event_type} (${row.severity}) - ` +
            `Vehicle: ${row.vehicle_name}, Driver: ${row.driver_name || 'Unknown'} - ` +
            `Expires: ${row.retention_expires_at}`
          );
        }

        // In production, would send email notifications to admins
        // await this.sendExpirationNotification(result.rows);
      }
    } catch (error: any) {
      logger.error('Failed to check upcoming expirations:', error.message);
    }
  }

  /**
   * Get retention policy statistics
   */
  async getRetentionStats(): Promise<any> {
    try {
      const result = await this.db.query(
        `SELECT
           COUNT(*) as total_videos,
           COUNT(CASE WHEN retention_policy = 'standard' THEN 1 END) as standard_retention,
           COUNT(CASE WHEN retention_policy = 'extended' THEN 1 END) as extended_retention,
           COUNT(CASE WHEN retention_policy = 'permanent' THEN 1 END) as permanent_retention,
           COUNT(CASE WHEN marked_as_evidence THEN 1 END) as evidence_videos,
           COUNT(CASE WHEN evidence_locker_id IS NOT NULL THEN 1 END) as locker_videos,
           COUNT(CASE WHEN retention_expires_at < NOW() THEN 1 END) as expired_videos,
           SUM(video_file_size_mb) as total_storage_mb
         FROM video_safety_events
         WHERE video_download_status != 'deleted'`
      );

      return result.rows[0];
    } catch (error: any) {
      logger.error('Failed to get retention stats:', error.message);
      return {};
    }
  }

  /**
   * Manually execute retention policy (for testing/admin)
   */
  async executeManual(): Promise<{ deleted: number; extended: number }> {
    logger.info('Manual retention policy execution requested');

    const standardDeleted = await this.deleteExpiredVideos('standard');
    const extendedDeleted = await this.deleteExpiredVideos('extended');
    const extended = await this.extendRetentionForPendingCases();

    await this.generateRetentionReport();

    return {
      deleted: standardDeleted + extendedDeleted,
      extended
    };
  }
}

// Export factory function
export const createVideoRetentionJob = (db: Pool): VideoRetentionPolicyJob => {
  return new VideoRetentionPolicyJob(db);
};

export default VideoRetentionPolicyJob;
