import { AzureFunction, Context } from '@azure/functions';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Azure Function: Drill-Through Cache
 * Pre-computes common drill-through aggregations for faster queries
 * Triggered by: Timer (0 */15 * * * *) - every 15 minutes
 */
const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  context.log('Drill-Through Cache started:', new Date().toISOString());

  const cacheConfigs = [
    // Vehicle aggregations by department
    {
      entityType: 'vehicles',
      groupBy: 'department',
      ttl: 900, // 15 minutes
    },
    // Vehicle aggregations by status
    {
      entityType: 'vehicles',
      groupBy: 'status',
      ttl: 900,
    },
    // Trips by month
    {
      entityType: 'trips',
      groupBy: 'month',
      ttl: 3600, // 1 hour
    },
    // Fuel transactions by vehicle
    {
      entityType: 'fuel_transactions',
      groupBy: 'vehicle_id',
      ttl: 1800, // 30 minutes
    },
    // Maintenance by type
    {
      entityType: 'maintenance_records',
      groupBy: 'type',
      ttl: 3600,
    },
  ];

  let cached = 0;
  let errors = 0;

  try {
    // Clean up expired cache entries
    await pool.query('DELETE FROM drill_through_cache WHERE expires_at < NOW()');
    context.log('Cleaned up expired cache entries');

    // Pre-compute aggregations
    for (const config of cacheConfigs) {
      try {
        await preComputeAggregation(context, config);
        cached++;
      } catch (err) {
        errors++;
        context.log.error(`Error caching ${config.entityType}:`, err);
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      cached,
      errors,
    };

    context.log('Drill-Through Cache completed:', summary);
    context.bindings.cacheLog = summary;

    context.log.metric('AggregationsCached', cached);

  } catch (error) {
    context.log.error('Drill-Through Cache failed:', error);
    throw error;
  }
};

/**
 * Pre-compute aggregation and store in cache
 */
async function preComputeAggregation(
  context: Context,
  config: { entityType: string; groupBy: string; ttl: number }
): Promise<void> {
  const { entityType, groupBy, ttl } = config;

  let query = '';
  let countField = 'COUNT(*)';

  switch (entityType) {
    case 'vehicles':
      query = `
        SELECT
          ${groupBy},
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE status = 'active') as active_count,
          SUM(mileage) as total_mileage
        FROM vehicles
        GROUP BY ${groupBy}
      `;
      break;

    case 'trips':
      if (groupBy === 'month') {
        query = `
          SELECT
            DATE_TRUNC('month', start_time) as month,
            COUNT(*) as count,
            SUM(distance) as total_distance,
            SUM(fuel_used) as total_fuel
          FROM trips
          WHERE start_time >= NOW() - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', start_time)
          ORDER BY month DESC
        `;
      }
      break;

    case 'fuel_transactions':
      query = `
        SELECT
          ${groupBy},
          COUNT(*) as count,
          SUM(gallons) as total_gallons,
          SUM(cost) as total_cost,
          AVG(cost / NULLIF(gallons, 0)) as avg_price_per_gallon
        FROM fuel_transactions
        WHERE date >= NOW() - INTERVAL '3 months'
        GROUP BY ${groupBy}
      `;
      break;

    case 'maintenance_records':
      query = `
        SELECT
          ${groupBy},
          COUNT(*) as count,
          SUM(cost) as total_cost,
          AVG(cost) as avg_cost
        FROM maintenance_records
        WHERE date >= NOW() - INTERVAL '6 months'
        GROUP BY ${groupBy}
      `;
      break;

    default:
      return;
  }

  if (!query) return;

  const result = await pool.query(query);
  const cacheKey = `${entityType}_by_${groupBy}`;
  const expiresAt = new Date(Date.now() + ttl * 1000);

  await pool.query(
    `INSERT INTO drill_through_cache (
      cache_key, entity_type, filters, result, ttl, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (cache_key)
    DO UPDATE SET
      result = EXCLUDED.result,
      cached_at = NOW(),
      expires_at = EXCLUDED.expires_at`,
    [
      cacheKey,
      entityType,
      JSON.stringify({ groupBy }),
      JSON.stringify({ rows: result.rows, count: result.rowCount }),
      ttl,
      expiresAt,
    ]
  );

  context.log(`Cached aggregation: ${cacheKey} (${result.rows.length} groups)`);
}

export default timerTrigger;
