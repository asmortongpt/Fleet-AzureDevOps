import { Queue, Job } from 'bull';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { Pool } from 'pg';

import { auditLog } from '../utils/auditLog';
import { logger } from '../utils/logger';
import { validateTenantId } from '../utils/validation';

// Initialize security headers
const app = express();
app.use(helmet());

// Database pool
const pool = new Pool({
  // Connection details
});

// Bull queue for scheduling
const utilizationQueue = new Queue('utilizationQueue');

// Function to calculate utilization
async function calculateUtilization(tenantId: string): Promise<void> {
  // Validate tenant ID
  if (!validateTenantId(tenantId)) {
    throw new Error('Invalid tenant ID');
  }

  try {
    // Begin transaction
    const client = await pool.connect();
    await client.query('BEGIN');

    // Aggregate usage_events into utilization_daily
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
    `;
    await client.query(queryText, [tenantId]);

    // Commit transaction
    await client.query('COMMIT');
    auditLog('Utilization rollup completed', { tenantId });
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query('ROLLBACK');
    logger.error('Error during utilization rollup', { error, tenantId });
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Cron job to run daily utilization rollup
utilizationQueue.process(async (job: Job) => {
  const { tenantId } = job.data;
  try {
    await calculateUtilization(tenantId);
  } catch (error) {
    logger.error('Failed to process utilization job', { error, tenantId });
  }
});

// Schedule the job to run nightly
utilizationQueue.add({}, { repeat: { cron: '0 0 * * *' } });

// Express error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err });
  res.status(500).send('Internal Server Error');
});

// FedRAMP/SOC 2 compliance: Ensure all data is handled securely and access is logged
// Multi-tenant isolation: Ensure tenant_id is used in all queries to isolate data

export { utilizationQueue };