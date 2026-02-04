/**
 * Query Performance Testing Script
 *
 * Tests query performance before and after index creation to measure improvements.
 * Runs EXPLAIN ANALYZE on common query patterns and provides metrics.
 *
 * Usage:
 *   ts-node test-query-performance.ts --before  # Test before index creation
 *   ts-node test-query-performance.ts --after   # Test after index creation
 *   ts-node test-query-performance.ts --compare # Compare before/after results
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface QueryTest {
  name: string;
  description: string;
  sql: string;
  expectedImprovement: string;
  category: 'gps' | 'telemetry' | 'fuel' | 'work_orders' | 'compliance' | 'general';
}

interface QueryResult {
  name: string;
  category: string;
  executionTime: number;
  planningTime: number;
  totalTime: number;
  rowsReturned: number;
  usedIndexes: string[];
  sequentialScans: number;
  plan: any;
}

interface PerformanceComparison {
  name: string;
  category: string;
  before: QueryResult;
  after: QueryResult;
  improvement: {
    executionTimePercent: number;
    totalTimePercent: number;
    indexUsageImproved: boolean;
    seqScansReduced: boolean;
  };
}

/**
 * Define test queries covering major query patterns
 */
const TEST_QUERIES: QueryTest[] = [
  // GPS Tracks queries
  {
    name: 'GPS: Vehicle timeline (30 days)',
    description: 'Most common GPS query - vehicle movement history',
    sql: `
      SELECT vehicle_id, timestamp, latitude, longitude, speed
      FROM gps_tracks
      WHERE vehicle_id = (SELECT id FROM vehicles LIMIT 1)
        AND timestamp > NOW() - INTERVAL '30 days'
      ORDER BY timestamp DESC
      LIMIT 1000;
    `,
    expectedImprovement: '60% faster with idx_gps_tracks_vehicle_timestamp',
    category: 'gps'
  },
  {
    name: 'GPS: Recent tenant locations',
    description: 'Tenant dashboard - recent vehicle positions',
    sql: `
      SELECT vehicle_id, MAX(timestamp) as last_seen,
             MAX(latitude) as lat, MAX(longitude) as lng
      FROM gps_tracks
      WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
        AND timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY vehicle_id;
    `,
    expectedImprovement: '55% faster with idx_gps_tracks_tenant_timestamp',
    category: 'gps'
  },

  // Telemetry queries
  {
    name: 'Telemetry: Vehicle metrics (7 days)',
    description: 'Dashboard charts - fuel, speed, engine metrics',
    sql: `
      SELECT DATE_TRUNC('hour', timestamp) as hour,
             AVG(fuel_level) as avg_fuel,
             AVG(speed) as avg_speed,
             MAX(engine_temp) as max_temp
      FROM telemetry_data
      WHERE vehicle_id = (SELECT id FROM vehicles LIMIT 1)
        AND timestamp > NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('hour', timestamp)
      ORDER BY hour DESC;
    `,
    expectedImprovement: '65% faster with idx_telemetry_vehicle_timestamp',
    category: 'telemetry'
  },

  // Fuel transaction queries
  {
    name: 'Fuel: Vehicle fuel history',
    description: 'Fuel consumption analysis per vehicle',
    sql: `
      SELECT transaction_date, fuel_type, gallons, total_cost,
             cost_per_gallon, odometer_reading
      FROM fuel_transactions
      WHERE vehicle_id = (SELECT id FROM vehicles LIMIT 1)
      ORDER BY transaction_date DESC
      LIMIT 100;
    `,
    expectedImprovement: '55% faster with idx_fuel_transactions_vehicle_date',
    category: 'fuel'
  },
  {
    name: 'Fuel: Driver fuel spend (30 days)',
    description: 'Driver accountability - fuel spending',
    sql: `
      SELECT driver_id, COUNT(*) as transactions,
             SUM(gallons) as total_gallons,
             SUM(total_cost) as total_spend,
             AVG(cost_per_gallon) as avg_price
      FROM fuel_transactions
      WHERE driver_id IS NOT NULL
        AND transaction_date > NOW() - INTERVAL '30 days'
      GROUP BY driver_id
      ORDER BY total_spend DESC;
    `,
    expectedImprovement: '50% faster with idx_fuel_transactions_driver_date',
    category: 'fuel'
  },

  // Work order queries
  {
    name: 'Work Orders: Active by vehicle',
    description: 'Maintenance dashboard - active work orders',
    sql: `
      SELECT wo.id, wo.number, wo.type, wo.priority, wo.status,
             wo.scheduled_start_date, v.make, v.model, v.unit_number
      FROM work_orders wo
      JOIN vehicles v ON wo.vehicle_id = v.id
      WHERE wo.vehicle_id = (SELECT id FROM vehicles LIMIT 1)
        AND wo.status IN ('pending', 'in-progress')
      ORDER BY wo.priority DESC, wo.scheduled_start_date ASC;
    `,
    expectedImprovement: '50% faster with idx_work_orders_vehicle_status',
    category: 'work_orders'
  },
  {
    name: 'Work Orders: Technician workload',
    description: 'Technician dashboard - assigned tasks',
    sql: `
      SELECT assigned_to_id, status, priority,
             COUNT(*) as count,
             SUM(estimated_cost) as total_estimated_cost
      FROM work_orders
      WHERE assigned_to_id IS NOT NULL
        AND status != 'completed'
      GROUP BY assigned_to_id, status, priority
      ORDER BY priority DESC;
    `,
    expectedImprovement: '60% faster with idx_work_orders_assigned_status',
    category: 'work_orders'
  },

  // HOS compliance queries
  {
    name: 'HOS: Driver violations (30 days)',
    description: 'Compliance monitoring - HOS violations',
    sql: `
      SELECT driver_id, DATE(start_time) as violation_date,
             status, duration_minutes, violation_type
      FROM hos_logs
      WHERE driver_id = (SELECT id FROM drivers LIMIT 1)
        AND is_violation = true
        AND start_time > NOW() - INTERVAL '30 days'
      ORDER BY start_time DESC;
    `,
    expectedImprovement: '70% faster with idx_hos_logs_violations',
    category: 'compliance'
  },

  // Incident queries
  {
    name: 'Incidents: High severity incidents',
    description: 'Safety dashboard - critical incidents',
    sql: `
      SELECT i.id, i.incident_date, i.severity, i.incident_type,
             i.description, v.unit_number, d.first_name, d.last_name
      FROM incidents i
      LEFT JOIN vehicles v ON i.vehicle_id = v.id
      LEFT JOIN drivers d ON i.driver_id = d.id
      WHERE i.severity IN ('high', 'critical')
        AND i.incident_date > NOW() - INTERVAL '90 days'
      ORDER BY i.incident_date DESC;
    `,
    expectedImprovement: '55% faster with idx_incidents_severity',
    category: 'compliance'
  },

  // Vehicle queries
  {
    name: 'Vehicles: Tenant fleet by status',
    description: 'Fleet overview - vehicles grouped by status',
    sql: `
      SELECT status, asset_category, power_type,
             COUNT(*) as count,
             AVG(odometer) as avg_odometer
      FROM vehicles
      WHERE tenant_id = (SELECT id FROM tenants LIMIT 1)
      GROUP BY status, asset_category, power_type
      ORDER BY status, count DESC;
    `,
    expectedImprovement: '45% faster with idx_vehicles_tenant_status',
    category: 'general'
  },

  // Driver queries
  {
    name: 'Drivers: License expiration check',
    description: 'Compliance - drivers with expiring licenses',
    sql: `
      SELECT id, first_name, last_name, license_number,
             license_expiry_date,
             (license_expiry_date - CURRENT_DATE) as days_until_expiry
      FROM drivers
      WHERE license_expiry_date > NOW()
        AND license_expiry_date < NOW() + INTERVAL '90 days'
        AND status = 'active'
      ORDER BY license_expiry_date ASC;
    `,
    expectedImprovement: '60% faster with idx_drivers_license_expiry',
    category: 'compliance'
  },

  // Join-heavy queries
  {
    name: 'Complex: Vehicle utilization report',
    description: 'Executive report - comprehensive vehicle metrics',
    sql: `
      SELECT v.unit_number, v.make, v.model,
             COUNT(DISTINCT wo.id) as maintenance_count,
             SUM(wo.actual_cost) as maintenance_cost,
             COUNT(DISTINCT ft.id) as fuel_transactions,
             SUM(ft.total_cost) as fuel_cost,
             COUNT(DISTINCT i.id) as incident_count
      FROM vehicles v
      LEFT JOIN work_orders wo ON v.id = wo.vehicle_id
        AND wo.actual_end_date > NOW() - INTERVAL '90 days'
      LEFT JOIN fuel_transactions ft ON v.id = ft.vehicle_id
        AND ft.transaction_date > NOW() - INTERVAL '90 days'
      LEFT JOIN incidents i ON v.id = i.vehicle_id
        AND i.incident_date > NOW() - INTERVAL '90 days'
      WHERE v.tenant_id = (SELECT id FROM tenants LIMIT 1)
      GROUP BY v.id, v.unit_number, v.make, v.model
      ORDER BY maintenance_cost DESC NULLS LAST
      LIMIT 50;
    `,
    expectedImprovement: '50% faster with multiple indexes',
    category: 'general'
  }
];

/**
 * Run a single query with EXPLAIN ANALYZE
 */
async function runQueryTest(pool: Pool, test: QueryTest): Promise<QueryResult> {
  const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${test.sql}`;

  try {
    const startTime = Date.now();
    const result = await pool.query(explainQuery);
    const endTime = Date.now();

    const plan = result.rows[0]['QUERY PLAN'][0];
    const executionTime = plan['Execution Time'];
    const planningTime = plan['Planning Time'];

    // Extract index usage
    const usedIndexes = extractIndexes(JSON.stringify(plan));

    // Count sequential scans
    const sequentialScans = countSequentialScans(plan);

    return {
      name: test.name,
      category: test.category,
      executionTime,
      planningTime,
      totalTime: executionTime + planningTime,
      rowsReturned: plan['Plan']['Actual Rows'] || 0,
      usedIndexes,
      sequentialScans,
      plan
    };
  } catch (error: any) {
    console.error(`Error running test "${test.name}":`, error.message);
    throw error;
  }
}

/**
 * Extract index names from execution plan
 */
function extractIndexes(planJson: string): string[] {
  const indexRegex = /"Index Name":\s*"([^"]+)"/g;
  const indexes: string[] = [];
  let match;

  while ((match = indexRegex.exec(planJson)) !== null) {
    indexes.push(match[1]);
  }

  return [...new Set(indexes)]; // Remove duplicates
}

/**
 * Count sequential scans in execution plan
 */
function countSequentialScans(plan: any): number {
  let count = 0;

  function traverse(node: any) {
    if (node['Node Type'] === 'Seq Scan') {
      count++;
    }
    if (node['Plans']) {
      node['Plans'].forEach(traverse);
    }
  }

  traverse(plan['Plan']);
  return count;
}

/**
 * Run all tests and save results
 */
async function runAllTests(pool: Pool, outputFile: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log('QUERY PERFORMANCE TEST SUITE');
  console.log(`${'='.repeat(80)}\n`);

  const results: QueryResult[] = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const test = TEST_QUERIES[i];
    console.log(`[${i + 1}/${TEST_QUERIES.length}] Running: ${test.name}`);

    try {
      const result = await runQueryTest(pool, test);
      results.push(result);

      console.log(`   ✓ Execution: ${result.executionTime.toFixed(2)}ms`);
      console.log(`   ✓ Total: ${result.totalTime.toFixed(2)}ms`);
      console.log(`   ✓ Indexes used: ${result.usedIndexes.length > 0 ? result.usedIndexes.join(', ') : 'None'}`);
      console.log(`   ✓ Sequential scans: ${result.sequentialScans}`);
      console.log('');
    } catch (error: any) {
      console.error(`   ✗ Failed: ${error.message}\n`);
    }
  }

  // Save results to file
  const output = {
    timestamp: new Date().toISOString(),
    results,
    summary: generateSummary(results)
  };

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
  console.log(`\n✓ Results saved to: ${outputFile}\n`);

  // Print summary
  printSummary(results);
}

/**
 * Generate summary statistics
 */
function generateSummary(results: QueryResult[]) {
  const totalQueries = results.length;
  const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalQueries;
  const avgTotalTime = results.reduce((sum, r) => sum + r.totalTime, 0) / totalQueries;
  const queriesUsingIndexes = results.filter(r => r.usedIndexes.length > 0).length;
  const queriesWithSeqScans = results.filter(r => r.sequentialScans > 0).length;

  return {
    totalQueries,
    avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
    avgTotalTime: Math.round(avgTotalTime * 100) / 100,
    queriesUsingIndexes,
    queriesWithSeqScans,
    indexUsagePercent: Math.round((queriesUsingIndexes / totalQueries) * 100)
  };
}

/**
 * Print summary table
 */
function printSummary(results: QueryResult[]): void {
  const summary = generateSummary(results);

  console.log(`${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  console.log(`Total Queries:           ${summary.totalQueries}`);
  console.log(`Avg Execution Time:      ${summary.avgExecutionTime.toFixed(2)}ms`);
  console.log(`Avg Total Time:          ${summary.avgTotalTime.toFixed(2)}ms`);
  console.log(`Queries Using Indexes:   ${summary.queriesUsingIndexes} (${summary.indexUsagePercent}%)`);
  console.log(`Queries with Seq Scans:  ${summary.queriesWithSeqScans}\n`);

  // Category breakdown
  const categories = ['gps', 'telemetry', 'fuel', 'work_orders', 'compliance', 'general'];
  console.log('Performance by Category:');
  categories.forEach(cat => {
    const categoryResults = results.filter(r => r.category === cat);
    if (categoryResults.length > 0) {
      const avgTime = categoryResults.reduce((sum, r) => sum + r.executionTime, 0) / categoryResults.length;
      console.log(`  ${cat.padEnd(15)}: ${avgTime.toFixed(2)}ms avg`);
    }
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Compare before and after results
 */
function compareResults(beforeFile: string, afterFile: string): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log('PERFORMANCE COMPARISON: BEFORE vs AFTER INDEX CREATION');
  console.log(`${'='.repeat(80)}\n`);

  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf-8'));
  const after = JSON.parse(fs.readFileSync(afterFile, 'utf-8'));

  const comparisons: PerformanceComparison[] = [];

  before.results.forEach((beforeResult: QueryResult) => {
    const afterResult = after.results.find((r: QueryResult) => r.name === beforeResult.name);

    if (afterResult) {
      const execImprovement = ((beforeResult.executionTime - afterResult.executionTime) / beforeResult.executionTime) * 100;
      const totalImprovement = ((beforeResult.totalTime - afterResult.totalTime) / beforeResult.totalTime) * 100;

      comparisons.push({
        name: beforeResult.name,
        category: beforeResult.category,
        before: beforeResult,
        after: afterResult,
        improvement: {
          executionTimePercent: Math.round(execImprovement * 100) / 100,
          totalTimePercent: Math.round(totalImprovement * 100) / 100,
          indexUsageImproved: afterResult.usedIndexes.length > beforeResult.usedIndexes.length,
          seqScansReduced: afterResult.sequentialScans < beforeResult.sequentialScans
        }
      });
    }
  });

  // Print detailed comparison
  comparisons.forEach((comp, idx) => {
    console.log(`[${idx + 1}] ${comp.name}`);
    console.log(`    Category: ${comp.category}`);
    console.log(`    Before:   ${comp.before.executionTime.toFixed(2)}ms`);
    console.log(`    After:    ${comp.after.executionTime.toFixed(2)}ms`);
    console.log(`    Improvement: ${comp.improvement.executionTimePercent > 0 ? '↓' : '↑'} ${Math.abs(comp.improvement.executionTimePercent).toFixed(1)}%`);

    if (comp.improvement.indexUsageImproved) {
      console.log(`    ✓ Index usage improved: ${comp.before.usedIndexes.length} → ${comp.after.usedIndexes.length} indexes`);
    }
    if (comp.improvement.seqScansReduced) {
      console.log(`    ✓ Sequential scans reduced: ${comp.before.sequentialScans} → ${comp.after.sequentialScans}`);
    }
    console.log('');
  });

  // Overall statistics
  const avgImprovement = comparisons.reduce((sum, c) => sum + c.improvement.executionTimePercent, 0) / comparisons.length;
  const queriesImproved = comparisons.filter(c => c.improvement.executionTimePercent > 0).length;

  console.log(`${'='.repeat(80)}`);
  console.log('OVERALL IMPACT');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total Queries Tested:     ${comparisons.length}`);
  console.log(`Queries Improved:         ${queriesImproved} (${Math.round((queriesImproved / comparisons.length) * 100)}%)`);
  console.log(`Average Improvement:      ${avgImprovement.toFixed(1)}%`);
  console.log(`Best Improvement:         ${Math.max(...comparisons.map(c => c.improvement.executionTimePercent)).toFixed(1)}%`);
  console.log('');

  // Success metrics
  const target = 50; // Target 50% improvement
  if (avgImprovement >= target) {
    console.log(`✓ SUCCESS: Average improvement (${avgImprovement.toFixed(1)}%) exceeds target (${target}%)`);
  } else {
    console.log(`⚠ BELOW TARGET: Average improvement (${avgImprovement.toFixed(1)}%) below target (${target}%)`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main CLI handler
 */
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/fleet_db'
  });

  const resultsDir = path.join(__dirname, '../../../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  try {
    switch (mode) {
      case '--before':
        console.log('🔍 Testing query performance BEFORE index creation...');
        await runAllTests(pool, path.join(resultsDir, 'performance-before.json'));
        break;

      case '--after':
        console.log('🔍 Testing query performance AFTER index creation...');
        await runAllTests(pool, path.join(resultsDir, 'performance-after.json'));
        break;

      case '--compare':
        const beforeFile = path.join(resultsDir, 'performance-before.json');
        const afterFile = path.join(resultsDir, 'performance-after.json');

        if (!fs.existsSync(beforeFile) || !fs.existsSync(afterFile)) {
          console.error('Error: Missing before/after results. Run with --before and --after first.');
          process.exit(1);
        }

        compareResults(beforeFile, afterFile);
        break;

      default:
        console.log('Usage:');
        console.log('  npm run test:performance -- --before   # Test before indexes');
        console.log('  npm run test:performance -- --after    # Test after indexes');
        console.log('  npm run test:performance -- --compare  # Compare results');
        process.exit(1);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { runQueryTest, runAllTests, compareResults, TEST_QUERIES };
