import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';

/**
 * Database Query Performance Benchmarks
 * Tests SQL query performance and execution times
 *
 * Target baselines:
 * - Simple selects: < 100ms
 * - Complex joins: < 500ms
 * - Aggregations: < 1000ms
 * - Bulk inserts: < 2000ms
 */

interface QueryMetric {
  query: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  rowsAffected: number;
}

let pool: Pool;

beforeAll(async () => {
  // Create connection pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Verify connection
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
  } finally {
    client.release();
  }
});

afterAll(async () => {
  await pool.end();
});

// Helper to measure query performance
async function measureQuery(
  query: string,
  iterations: number = 10
): Promise<QueryMetric> {
  const times: number[] = [];
  let rowCount = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    const result = await pool.query(query);
    const endTime = performance.now();

    times.push(endTime - startTime);
    rowCount = result.rowCount || 0;
  }

  times.sort((a, b) => a - b);

  return {
    query: query.substring(0, 60) + (query.length > 60 ? '...' : ''),
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p95Time: times[Math.floor(times.length * 0.95)],
    rowsAffected: rowCount,
  };
}

describe('Database Query Performance Benchmarks', () => {
  let results: QueryMetric[] = [];

  it('should measure simple SELECT query performance', async () => {
    const metric = await measureQuery('SELECT 1 AS value', 20);
    results.push(metric);

    console.log('Simple SELECT:', metric);
    expect(metric.avgTime).toBeLessThan(50);
  });

  it('should measure vehicles table SELECT performance', async () => {
    const metric = await measureQuery(
      `SELECT id, unit_number, vin, status FROM vehicles LIMIT 1000`,
      10
    );
    results.push(metric);

    console.log('Vehicles SELECT:', metric);
    expect(metric.avgTime).toBeLessThan(200);
  });

  it('should measure drivers table SELECT performance', async () => {
    const metric = await measureQuery(
      `SELECT id, first_name, last_name, status FROM drivers LIMIT 1000`,
      10
    );
    results.push(metric);

    console.log('Drivers SELECT:', metric);
    expect(metric.avgTime).toBeLessThan(200);
  });

  it('should measure vehicle-driver JOIN performance', async () => {
    const metric = await measureQuery(
      `SELECT v.id, v.unit_number, d.first_name, d.last_name
       FROM vehicles v
       LEFT JOIN drivers d ON v.current_driver_id = d.id
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('JOIN Query:', metric);
    expect(metric.avgTime).toBeLessThan(300);
  });

  it('should measure multi-table JOIN performance', async () => {
    const metric = await measureQuery(
      `SELECT v.id, v.unit_number, d.first_name, f.id as fuel_id
       FROM vehicles v
       LEFT JOIN drivers d ON v.current_driver_id = d.id
       LEFT JOIN fuel_transactions f ON v.id = f.vehicle_id
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('Multi-table JOIN:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure aggregation query performance', async () => {
    const metric = await measureQuery(
      `SELECT
        COUNT(*) as total_vehicles,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vehicles,
        AVG(odometer) as avg_odometer
       FROM vehicles`,
      15
    );
    results.push(metric);

    console.log('Aggregation Query:', metric);
    expect(metric.avgTime).toBeLessThan(300);
  });

  it('should measure GROUP BY query performance', async () => {
    const metric = await measureQuery(
      `SELECT status, COUNT(*) as count
       FROM vehicles
       GROUP BY status`,
      15
    );
    results.push(metric);

    console.log('GROUP BY Query:', metric);
    expect(metric.avgTime).toBeLessThan(200);
  });

  it('should measure filtered query performance', async () => {
    const metric = await measureQuery(
      `SELECT * FROM vehicles
       WHERE status = 'active'
       AND created_at > NOW() - INTERVAL '30 days'
       LIMIT 1000`,
      10
    );
    results.push(metric);

    console.log('Filtered Query:', metric);
    expect(metric.avgTime).toBeLessThan(200);
  });

  it('should measure ordered query performance', async () => {
    const metric = await measureQuery(
      `SELECT id, unit_number, odometer FROM vehicles
       ORDER BY created_at DESC
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('Ordered Query:', metric);
    expect(metric.avgTime).toBeLessThan(300);
  });

  it('should measure subquery performance', async () => {
    const metric = await measureQuery(
      `SELECT v.*,
        (SELECT COUNT(*) FROM maintenance_records mr WHERE mr.vehicle_id = v.id) as maintenance_count
       FROM vehicles v
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('Subquery:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure DISTINCT query performance', async () => {
    const metric = await measureQuery(
      `SELECT DISTINCT status FROM vehicles`,
      20
    );
    results.push(metric);

    console.log('DISTINCT Query:', metric);
    expect(metric.avgTime).toBeLessThan(100);
  });

  it('should measure UNION query performance', async () => {
    const metric = await measureQuery(
      `SELECT 'vehicle' as type, id, CAST(id AS TEXT) as identifier FROM vehicles
       UNION
       SELECT 'driver' as type, id, CAST(id AS TEXT) as identifier FROM drivers
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('UNION Query:', metric);
    expect(metric.avgTime).toBeLessThan(400);
  });

  it('should measure index performance', async () => {
    const metric = await measureQuery(
      `SELECT * FROM vehicles WHERE unit_number = 'V001'`,
      20
    );
    results.push(metric);

    console.log('Indexed Lookup:', metric);
    expect(metric.avgTime).toBeLessThan(50);
  });

  it('should measure text search performance', async () => {
    const metric = await measureQuery(
      `SELECT * FROM vehicles
       WHERE LOWER(unit_number) LIKE '%vehicle%'
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('Text Search:', metric);
    expect(metric.avgTime).toBeLessThan(300);
  });

  it('should measure pagination performance', async () => {
    const metric = await measureQuery(
      `SELECT id, unit_number FROM vehicles
       ORDER BY created_at DESC
       LIMIT 50 OFFSET 1000`,
      15
    );
    results.push(metric);

    console.log('Pagination Query:', metric);
    expect(metric.avgTime).toBeLessThan(200);
  });

  it('should measure complex window function query', async () => {
    const metric = await measureQuery(
      `SELECT id, unit_number,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num,
        RANK() OVER (PARTITION BY status ORDER BY odometer DESC) as rank
       FROM vehicles
       LIMIT 100`,
      10
    );
    results.push(metric);

    console.log('Window Function Query:', metric);
    expect(metric.avgTime).toBeLessThan(400);
  });

  it('should generate database performance report', () => {
    console.log('\n=== DATABASE QUERY PERFORMANCE REPORT ===\n');

    const sortedResults = [...results].sort((a, b) => b.avgTime - a.avgTime);

    sortedResults.forEach((metric) => {
      const status =
        metric.avgTime < 100
          ? '✓'
          : metric.avgTime < 300
            ? '⚠'
            : '✗';

      console.log(`${status} ${metric.query.padEnd(50)}`);
      console.log(
        `    Avg: ${metric.avgTime.toFixed(2)}ms | Min: ${metric.minTime.toFixed(2)}ms | Max: ${metric.maxTime.toFixed(2)}ms`
      );
      console.log(
        `    P95: ${metric.p95Time.toFixed(2)}ms | Rows: ${metric.rowsAffected}`
      );
    });

    const avgQueryTime =
      results.reduce((a, b) => a + b.avgTime, 0) / results.length;
    console.log(`\nOverall Average Query Time: ${avgQueryTime.toFixed(2)}ms`);

    const slowQueries = results.filter((m) => m.avgTime > 500);
    if (slowQueries.length > 0) {
      console.log(`\nSlow Queries (> 500ms):`);
      slowQueries.forEach((m) => {
        console.log(`  - ${m.query}: ${m.avgTime.toFixed(2)}ms`);
      });
    }
  });
});
