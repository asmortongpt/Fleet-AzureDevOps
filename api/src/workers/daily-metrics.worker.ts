// api/src/workers/daily-metrics.worker.ts

import cron from 'node-cron';

import pool from '../config/database';
import { logger } from '../config/logger';

/**
 * Refreshes materialized views to ensure data is up to date.
 * This function is designed to be run as a cron job.
 */
async function refreshMaterializedViews(): Promise<void> {
  try {
    await pool.query('BEGIN');

    // Refresh vw_asset_daily_utilization materialized view
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_daily_utilization');

    // Refresh vw_asset_roi_summary materialized view
    await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY vw_asset_roi_summary');

    await pool.query('COMMIT');

    logger.info('Materialized views refreshed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('Failed to refresh materialized views', error);
  }
}

/**
 * Schedules the refresh of materialized views to run daily at 2 AM.
 */
function scheduleMaterializedViewRefresh() {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Starting daily refresh of materialized views');
    await refreshMaterializedViews();
  }, {
    timezone: "UTC"
  });

  logger.info('Scheduled daily refresh of materialized views');
}

scheduleMaterializedViewRefresh();