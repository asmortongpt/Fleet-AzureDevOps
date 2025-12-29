//src/jobs/utilization.cron.ts - Daily utilization rollup job
import Bull from 'bull';
import { Pool } from 'pg';
import { logger } from '../lib/logger';
import { validateTenantId } from '../utils/validation';

// Database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Bull queue for utilization calculations
const utilizationQueue = new Bull('utilizationQueue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  }
});

async function calculateUtilization(tenantId: string): Promise<void> {
  if (!validateTenantId(tenantId)) {
    throw new Error('Invalid tenant ID');
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const queryText = `
      INSERT INTO utilization_daily (tenant_id, asset_id, date, in_use_minutes, idle_minutes)
      SELECT
        tenant_id,
        asset_id,
        date_trunc('day', event_time) AS date,
        SUM(CASE WHEN status = 'in_use' THEN duration ELSE 0 END) AS in_use_minutes,
        SUM(CASE WHEN status = 'idle' THEN duration ELSE 0 END) AS idle_minutes
      FROM usage_events
      WHERE tenant_id = $1
      GROUP BY tenant_id, asset_id, date
      ON CONFLICT (tenant_id, asset_id, date)
      DO UPDATE SET
        in_use_minutes = EXCLUDED.in_use_minutes,
        idle_minutes = EXCLUDED.idle_minutes
    `;
    await client.query(queryText, [tenantId]);

    await client.query('COMMIT');
    logger.info('Utilization rollup completed', { tenantId });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }
    logger.error('Error during utilization rollup', { error, tenantId });
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

utilizationQueue.process(async (job: Bull.Job) => {
  const { tenantId } = job.data;
  try {
    await calculateUtilization(tenantId);
  } catch (error) {
    logger.error('Failed to process utilization job', { error, tenantId });
    throw error;
  }
});

utilizationQueue.add(
  'daily-rollup',
  { tenantId: 'default' },
  {
    repeat: { cron: '0 0 * * *' },
    removeOnComplete: true,
    removeOnFail: false
  }
);

export { utilizationQueue, calculateUtilization };
