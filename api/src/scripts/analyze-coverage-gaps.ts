/**
 * COMPREHENSIVE COVERAGE GAP ANALYSIS
 *
 * This script analyzes the database to identify missing test data coverage:
 * - Missing enum/status values
 * - Untested field combinations
 * - Missing edge cases
 * - Boundary value coverage
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '15432'),
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fleetdb',
});

// Define all expected enum values based on application code
const EXPECTED_VALUES = {
  // Vehicles
  'vehicles.status': ['active', 'inactive', 'maintenance', 'out_of_service', 'decommissioned', 'reserved'],
  'vehicles.vehicle_type': ['Sedan', 'SUV', 'Pickup Truck', 'Van', 'Cargo Van', 'Box Truck', 'Semi-Truck', 'Flatbed', 'Refrigerated Truck', 'Dump Truck', 'Tow Truck'],
  'vehicles.fuel_type': ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Propane', 'CNG', 'Hydrogen'],

  // Drivers
  'drivers.status': ['active', 'inactive', 'on_leave', 'suspended', 'terminated'],
  'drivers.license_class': ['Class A', 'Class B', 'Class C', 'Class D', 'Class M', 'CDL-A', 'CDL-B', 'CDL-C'],

  // Work Orders
  'work_orders.status': ['open', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'closed'],
  'work_orders.priority': ['low', 'medium', 'high', 'critical', 'urgent'],
  'work_orders.work_order_type': ['preventive', 'corrective', 'inspection', 'modification', 'emergency', 'recall', 'warranty'],

  // Routes
  'routes.status': ['planned', 'scheduled', 'in_progress', 'delayed', 'completed', 'cancelled', 'failed'],

  // Inspections
  'vehicle_inspections.inspection_type': ['pre_trip', 'post_trip', 'annual', 'dot', 'state', 'safety', 'emissions', 'brake', 'comprehensive'],
  'inspections.inspection_type': ['pre_trip', 'post_trip', 'annual', 'dot', 'state', 'safety', 'emissions', 'brake', 'comprehensive'],
  'inspections.status': ['pending', 'in_progress', 'completed', 'failed', 'passed', 'needs_repair'],

  // Safety Incidents
  'safety_incidents.incident_type': ['accident', 'injury', 'near_miss', 'property_damage', 'citation', 'violation', 'equipment_failure', 'environmental', 'theft', 'vandalism'],
  'safety_incidents.severity': ['minor', 'moderate', 'severe', 'critical', 'fatal'],
  'safety_incidents.status': ['reported', 'investigating', 'under_review', 'resolved', 'closed'],

  // Users
  'users.role': ['admin', 'fleet_manager', 'dispatcher', 'technician', 'driver', 'viewer', 'accountant', 'safety_manager'],
  'users.status': ['active', 'inactive', 'suspended', 'pending'],

  // Notifications
  'notifications.notification_type': ['alert', 'warning', 'info', 'reminder', 'critical', 'system', 'maintenance', 'safety', 'compliance'],
  'notifications.priority': ['low', 'normal', 'medium', 'high', 'critical', 'urgent'],
  'notifications.status': ['unread', 'read', 'acknowledged', 'dismissed', 'archived'],

  // Fuel Transactions
  'fuel_transactions.fuel_type': ['Gasoline', 'Diesel', 'Electric', 'Propane', 'CNG', 'DEF'],

  // Charging Sessions
  'charging_sessions.status': ['pending', 'in_progress', 'charging', 'completed', 'interrupted', 'failed', 'cancelled'],

  // Damage Reports
  'damage_reports.damage_severity': ['cosmetic', 'minor', 'moderate', 'major', 'severe', 'total_loss'],
  'damage_reports.triposr_status': ['pending', 'processing', 'completed', 'failed'],

  // Maintenance Schedules
  'maintenance_schedules.recurrence_type': ['mileage', 'time', 'engine_hours', 'combined', 'one_time'],
  'maintenance_schedules.status': ['scheduled', 'due', 'overdue', 'completed', 'skipped', 'cancelled'],
  'maintenance_schedules.priority': ['low', 'medium', 'high', 'urgent', 'critical'],

  // Communication Logs
  'communication_logs.communication_type': ['email', 'sms', 'phone_call', 'push_notification', 'in_app', 'voice', 'chat'],
  'communication_logs.direction': ['inbound', 'outbound', 'internal'],

  // Policies
  'policies.policy_type': ['safety', 'maintenance', 'fuel', 'driver_conduct', 'vehicle_use', 'compliance', 'environmental', 'security'],
  'policies.status': ['draft', 'pending_review', 'active', 'inactive', 'archived', 'superseded'],

  // Policy Violations
  'policy_violations.severity': ['minor', 'moderate', 'major', 'severe', 'critical'],
  'policy_violations.status': ['open', 'investigating', 'acknowledged', 'resolved', 'dismissed'],

  // Geofence Events
  'geofence_events.event_type': ['entry', 'exit', 'dwell', 'speeding', 'unauthorized'],

  // Video Events
  'video_events.event_type': ['harsh_braking', 'harsh_acceleration', 'harsh_cornering', 'speeding', 'distracted_driving', 'following_too_close', 'lane_departure', 'collision', 'near_miss'],
  'video_events.severity': ['low', 'medium', 'high', 'critical'],

  // Deployments
  'deployments.environment': ['development', 'staging', 'production', 'testing', 'qa'],
  'deployments.status': ['pending', 'deploying', 'deployed', 'failed', 'rolled_back'],

  // Audit Logs
  'audit_logs.action': ['create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'import', 'approve', 'reject'],
  'audit_logs.outcome': ['success', 'failure', 'partial', 'error'],

  // Purchase Orders
  'purchase_orders.status': ['draft', 'pending_approval', 'approved', 'ordered', 'partially_received', 'received', 'cancelled', 'closed'],

  // Telemetry Data
  'telemetry_data.event_type': ['gps', 'engine', 'speed', 'fuel', 'temperature', 'diagnostic', 'alert'],

  // Personal Use
  'trip_usage_classification.usage_type': ['business', 'personal', 'mixed', 'commute'],
  'trip_usage_classification.approval_status': ['pending', 'approved', 'rejected', 'auto_approved', 'disputed'],
  'personal_use_charges.charge_status': ['pending', 'invoiced', 'billed', 'paid', 'waived', 'disputed', 'overdue'],
};

interface CoverageGap {
  table: string;
  field: string;
  expected: string[];
  actual: string[];
  missing: string[];
  extra: string[];
}

interface EdgeCaseGap {
  table: string;
  category: string;
  description: string;
  exists: boolean;
}

async function analyzeEnumCoverage(): Promise<CoverageGap[]> {
  const gaps: CoverageGap[] = [];

  for (const [tableField, expectedValues] of Object.entries(EXPECTED_VALUES)) {
    const [table, field] = tableField.split('.');

    try {
      const result = await pool.query(`
        SELECT DISTINCT ${field} as value
        FROM ${table}
        WHERE ${field} IS NOT NULL
        ORDER BY ${field}
      `);

      const actualValues = result.rows.map(row => row.value);
      const missing = expectedValues.filter(v => !actualValues.includes(v));
      const extra = actualValues.filter(v => !expectedValues.includes(v));

      if (missing.length > 0 || extra.length > 0) {
        gaps.push({
          table,
          field,
          expected: expectedValues,
          actual: actualValues,
          missing,
          extra,
        });
      }
    } catch (error) {
      console.warn(`Could not analyze ${table}.${field}:`, (error as Error).message);
    }
  }

  return gaps;
}

async function analyzeEdgeCases(): Promise<EdgeCaseGap[]> {
  const edgeCases: EdgeCaseGap[] = [];

  // Define edge cases to check
  const edgeCaseChecks = [
    // Vehicles
    { table: 'vehicles', category: 'boundary', description: 'Vehicle with 0 miles', query: 'SELECT EXISTS(SELECT 1 FROM vehicles WHERE current_mileage = 0)` },
    { table: 'vehicles', category: 'boundary', description: 'Vehicle with >999,999 miles', query: 'SELECT EXISTS(SELECT 1 FROM vehicles WHERE current_mileage > 999999)` },
    { table: 'vehicles', category: 'null', description: 'Vehicle with NULL license plate', query: 'SELECT EXISTS(SELECT 1 FROM vehicles WHERE license_plate IS NULL)` },
    { table: 'vehicles', category: 'edge', description: 'Electric vehicle with 0% battery', query: 'SELECT EXISTS(SELECT 1 FROM vehicles WHERE fuel_type = 'Electric' AND battery_level = 0)' },
    { table: 'vehicles', category: 'edge', description: 'Vehicle with expired registration', query: 'SELECT EXISTS(SELECT 1 FROM vehicles WHERE registration_expiry < CURRENT_DATE)` },

    // Drivers
    { table: 'drivers', category: 'edge', description: 'Driver with expired license', query: 'SELECT EXISTS(SELECT 1 FROM drivers WHERE license_expiry < CURRENT_DATE)` },
    { table: 'drivers', category: 'edge', description: 'Driver with no certifications', query: 'SELECT EXISTS(SELECT 1 FROM drivers WHERE (certifications IS NULL OR certifications = '[]'::jsonb))' },
    { table: 'drivers', category: 'status', description: 'Driver on leave', query: 'SELECT EXISTS(SELECT 1 FROM drivers WHERE status = 'on_leave')' },
    { table: 'drivers', category: 'status', description: 'Suspended driver', query: 'SELECT EXISTS(SELECT 1 FROM drivers WHERE status = 'suspended')' },

    // Work Orders
    { table: 'work_orders', category: 'boundary', description: 'Work order with $0 cost', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE total_cost = 0)` },
    { table: 'work_orders', category: 'boundary', description: 'Work order with >$100,000 cost', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE total_cost > 100000)` },
    { table: 'work_orders', category: 'time', description: 'Work order open >365 days', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE status IN ('open', 'in_progress') AND created_at < CURRENT_DATE - INTERVAL '365 days')' },
    { table: 'work_orders', category: 'time', description: 'Work order completed same day', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE DATE(created_at) = DATE(completed_at))` },
    { table: 'work_orders', category: 'status', description: 'Cancelled work order', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE status = 'cancelled')' },
    { table: 'work_orders', category: 'status', description: 'On hold work order', query: 'SELECT EXISTS(SELECT 1 FROM work_orders WHERE status = 'on_hold')' },

    // Routes
    { table: 'routes', category: 'boundary', description: 'Route with 0 miles', query: 'SELECT EXISTS(SELECT 1 FROM routes WHERE distance_miles = 0)` },
    { table: 'routes', category: 'status', description: 'Failed route', query: 'SELECT EXISTS(SELECT 1 FROM routes WHERE status = 'failed')' },
    { table: 'routes', category: 'status', description: 'Delayed route', query: 'SELECT EXISTS(SELECT 1 FROM routes WHERE status = 'delayed')' },
    { table: 'routes', category: 'edge', description: 'Multi-day route', query: 'SELECT EXISTS(SELECT 1 FROM routes WHERE end_time > start_time + INTERVAL '24 hours')' },

    // Maintenance
    { table: 'maintenance_schedules', category: 'time', description: 'Overdue maintenance (1+ days)', query: 'SELECT EXISTS(SELECT 1 FROM maintenance_schedules WHERE status = 'overdue' AND next_due_date < CURRENT_DATE)' },
    { table: 'maintenance_schedules', category: 'time', description: 'Maintenance overdue >365 days', query: 'SELECT EXISTS(SELECT 1 FROM maintenance_schedules WHERE status = 'overdue' AND next_due_date < CURRENT_DATE - INTERVAL '365 days')' },
    { table: 'maintenance_schedules', category: 'status', description: 'Skipped maintenance', query: 'SELECT EXISTS(SELECT 1 FROM maintenance_schedules WHERE status = 'skipped')' },

    // Inspections
    { table: 'inspections', category: 'status', description: 'Failed inspection', query: 'SELECT EXISTS(SELECT 1 FROM inspections WHERE status = 'failed')' },
    { table: 'inspections', category: 'type', description: 'DOT inspection', query: 'SELECT EXISTS(SELECT 1 FROM inspections WHERE inspection_type = 'dot')' },
    { table: 'inspections', category: 'type', description: 'Emissions inspection', query: 'SELECT EXISTS(SELECT 1 FROM inspections WHERE inspection_type = 'emissions')' },

    // Fuel
    { table: 'fuel_transactions', category: 'boundary', description: 'Fuel purchase $0', query: 'SELECT EXISTS(SELECT 1 FROM fuel_transactions WHERE cost = 0)` },
    { table: 'fuel_transactions', category: 'boundary', description: 'Fuel purchase >$5000', query: 'SELECT EXISTS(SELECT 1 FROM fuel_transactions WHERE cost > 5000)` },
    { table: 'fuel_transactions', category: 'edge', description: 'Multiple transactions same day', query: 'SELECT EXISTS(SELECT 1 FROM (SELECT vehicle_id, DATE(transaction_date) as date FROM fuel_transactions GROUP BY vehicle_id, DATE(transaction_date) HAVING COUNT(*) > 1) sub)` },

    // Safety Incidents
    { table: 'safety_incidents', category: 'severity', description: 'Fatal incident', query: 'SELECT EXISTS(SELECT 1 FROM safety_incidents WHERE severity = 'fatal')' },
    { table: 'safety_incidents', category: 'type', description: 'Near miss incident', query: 'SELECT EXISTS(SELECT 1 FROM safety_incidents WHERE incident_type = 'near_miss')' },
    { table: 'safety_incidents', category: 'type', description: 'Environmental incident', query: 'SELECT EXISTS(SELECT 1 FROM safety_incidents WHERE incident_type = 'environmental')' },

    // Charging
    { table: 'charging_sessions', category: 'status', description: 'Interrupted charging session', query: 'SELECT EXISTS(SELECT 1 FROM charging_sessions WHERE status = 'interrupted')' },
    { table: 'charging_sessions', category: 'status', description: 'Failed charging session', query: 'SELECT EXISTS(SELECT 1 FROM charging_sessions WHERE status = 'failed')' },

    // Notifications
    { table: 'notifications', category: 'priority', description: 'Critical notification', query: 'SELECT EXISTS(SELECT 1 FROM notifications WHERE priority = 'critical')' },
    { table: 'notifications', category: 'status', description: 'Acknowledged notification', query: 'SELECT EXISTS(SELECT 1 FROM notifications WHERE status = 'acknowledged')' },

    // Users
    { table: 'users', category: 'role', description: 'Safety manager role', query: 'SELECT EXISTS(SELECT 1 FROM users WHERE role = 'safety_manager')' },
    { table: 'users', category: 'role', description: 'Accountant role', query: 'SELECT EXISTS(SELECT 1 FROM users WHERE role = 'accountant')' },
    { table: 'users', category: 'status', description: 'Suspended user', query: 'SELECT EXISTS(SELECT 1 FROM users WHERE status = 'suspended')' },
  ];

  for (const check of edgeCaseChecks) {
    try {
      const result = await pool.query(check.query);
      edgeCases.push({
        ...check,
        exists: result.rows[0]?.exists || false,
      });
    } catch (error) {
      console.warn(`Could not check ${check.description}:`, (error as Error).message);
    }
  }

  return edgeCases;
}

async function analyzeNullCoverage() {
  console.log('\n=== NULL VALUE COVERAGE ===\n');

  const nullableFields = [
    { table: 'vehicles', field: 'notes' },
    { table: 'vehicles', field: 'vin' },
    { table: 'work_orders', field: 'notes' },
    { table: 'work_orders', field: 'completed_at' },
    { table: 'drivers', field: 'notes' },
    { table: 'routes', field: 'notes' },
  ];

  for (const { table, field } of nullableFields) {
    try {
      const result = await pool.query(`
        SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${field} IS NULL) as has_null
      `);
      console.log('${table}.${field}: ${result.rows[0].has_null ? '✓ HAS NULL' : '✗ NO NULL'}');
    } catch (error) {
      console.warn(`Could not check ${table}.${field}`);
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE TEST DATA COVERAGE GAP ANALYSIS              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // 1. Enum Coverage
  console.log('=== ENUM/STATUS VALUE COVERAGE ===\n');
  const enumGaps = await analyzeEnumCoverage();

  if (enumGaps.length === 0) {
    console.log('✓ All enum values are covered!\n');
  } else {
    for (const gap of enumGaps) {
      console.log(`\n${gap.table}.${gap.field}:`);
      if (gap.missing.length > 0) {
        console.log('  ✗ MISSING: ${gap.missing.join(', ')}');
      }
      if (gap.extra.length > 0) {
        console.log('  ⚠ EXTRA (not in spec): ${gap.extra.join(', ')}');
      }
      console.log('  ✓ PRESENT: ${gap.actual.filter(v => gap.expected.includes(v)).join(', ')}');
    }
  }

  // 2. Edge Case Coverage
  console.log('\n\n=== EDGE CASE COVERAGE ===\n');
  const edgeCaseGaps = await analyzeEdgeCases();

  const missingEdgeCases = edgeCaseGaps.filter(ec => !ec.exists);
  const presentEdgeCases = edgeCaseGaps.filter(ec => ec.exists);

  console.log(`Present: ${presentEdgeCases.length}/${edgeCaseGaps.length}`);
  console.log(`Missing: ${missingEdgeCases.length}/${edgeCaseGaps.length}\n`);

  if (missingEdgeCases.length > 0) {
    console.log('MISSING EDGE CASES:');
    for (const ec of missingEdgeCases) {
      console.log(`  ✗ [${ec.category}] ${ec.description}`);
    }
  }

  // 3. NULL Coverage
  await analyzeNullCoverage();

  // 4. Summary
  console.log('\n\n=== SUMMARY ===\n');
  const totalMissingEnums = enumGaps.reduce((sum, gap) => sum + gap.missing.length, 0);
  console.log(`Missing enum values: ${totalMissingEnums}`);
  console.log(`Missing edge cases: ${missingEdgeCases.length}`);

  if (totalMissingEnums === 0 && missingEdgeCases.length === 0) {
    console.log('\n✓✓✓ 100% COVERAGE ACHIEVED! ✓✓✓\n');
  } else {
    console.log('\n⚠ Coverage gaps detected. Run seed-edge-cases.ts to fill gaps.\n');
  }

  await pool.end();
}

main().catch(console.error);
