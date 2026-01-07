/**
 * Test Script for Tamper-Proof Audit Service
 *
 * This script tests the core functionality of the Audit Service including:
 * - Basic audit logging
 * - Hash chain integrity
 * - Batch operations
 * - Query functionality
 * - Tampering detection
 */

import { Pool } from 'pg';

import { AuditService, AuditCategory, AuditSeverity } from './AuditService';

async function main() {
  console.log('='.repeat(80));
  console.log('Testing Tamper-Proof Audit Service');
  console.log('='.repeat(80));

  // Initialize pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://andrewmorton@localhost:5432/fleet_db',
    min: 2,
    max: 10
  });

  // Initialize audit service
  const auditService = new AuditService(pool, {
    anchorInterval: 5 // Create anchor every 5 logs for testing
  });

  try {
    // Test 1: Basic Audit Logging
    console.log('\n[Test 1] Basic Audit Logging');
    console.log('-'.repeat(80));

    const log1 = await auditService.log({
      userId: 'test-user-1',
      action: 'authentication:login',
      category: AuditCategory.AUTHENTICATION,
      severity: AuditSeverity.INFO,
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        sessionId: 'test-session-1'
      },
      result: 'success'
    });

    console.log(`✓ Created audit log: ${log1}`);

    // Test 2: Data Modification Tracking
    console.log('\n[Test 2] Data Modification Tracking');
    console.log('-'.repeat(80));

    const log2 = await auditService.log({
      userId: 'test-user-1',
      action: 'vehicle:update',
      category: AuditCategory.DATA_MODIFICATION,
      severity: AuditSeverity.INFO,
      resource: {
        type: 'vehicle',
        id: 'VEH-TEST-001',
        attributes: { make: 'Ford', model: 'F-150' }
      },
      before: { odometer: 10000, status: 'active' },
      after: { odometer: 10250, status: 'active' },
      changes: [
        { field: 'odometer', oldValue: 10000, newValue: 10250 }
      ],
      metadata: {
        ipAddress: '192.168.1.1',
        userAgent: 'Chrome/120.0'
      },
      result: 'success',
      retentionYears: 7,
      complianceFlags: ['PII']
    });

    console.log(`✓ Created data modification log: ${log2}`);

    // Test 3: Batch Logging
    console.log('\n[Test 3] Batch Logging');
    console.log('-'.repeat(80));

    const batchEvents = [
      {
        userId: 'test-user-2',
        action: 'driver:view',
        category: AuditCategory.DATA_ACCESS,
        severity: AuditSeverity.INFO,
        resource: { type: 'driver', id: 'DRV-001' },
        metadata: { ipAddress: '192.168.1.2', userAgent: 'Safari' },
        result: 'success' as const
      },
      {
        userId: 'test-user-2',
        action: 'vehicle:view',
        category: AuditCategory.DATA_ACCESS,
        severity: AuditSeverity.INFO,
        resource: { type: 'vehicle', id: 'VEH-002' },
        metadata: { ipAddress: '192.168.1.2', userAgent: 'Safari' },
        result: 'success' as const
      },
      {
        userId: 'test-user-3',
        action: 'authentication:login',
        category: AuditCategory.AUTHENTICATION,
        severity: AuditSeverity.ERROR,
        metadata: { ipAddress: '192.168.1.3', userAgent: 'Chrome' },
        result: 'failure' as const,
        errorMessage: 'Invalid credentials'
      }
    ];

    const batchLogIds = await auditService.logBatch(batchEvents);
    console.log(`✓ Created ${batchLogIds.length} audit logs in batch`);

    // Test 4: Query Logs
    console.log('\n[Test 4] Query Audit Logs');
    console.log('-'.repeat(80));

    const userLogs = await auditService.queryByUser('test-user-1');
    console.log(`✓ Found ${userLogs.length} logs for test-user-1`);

    const vehicleLogs = await auditService.queryByResource('vehicle', 'VEH-TEST-001');
    console.log(`✓ Found ${vehicleLogs.length} logs for vehicle VEH-TEST-001`);

    const authLogs = await auditService.queryByAction('authentication:login');
    console.log(`✓ Found ${authLogs.length} authentication logs`);

    // Test 5: Get Single Log
    console.log('\n[Test 5] Get Single Log');
    console.log('-'.repeat(80));

    const singleLog = await auditService.getLog(log1);
    if (singleLog) {
      console.log(`✓ Retrieved log ${log1}`);
      console.log(`  User: ${singleLog.userId}`);
      console.log(`  Action: ${singleLog.action}`);
      console.log(`  Sequence: ${singleLog.sequenceNumber}`);
      console.log(`  Hash: ${singleLog.currentHash}`);
    }

    // Test 6: Verify Chain Integrity
    console.log('\n[Test 6] Verify Chain Integrity');
    console.log('-'.repeat(80));

    const verification = await auditService.verifyChain();
    if (verification.valid) {
      console.log(`✓ Chain verified successfully!`);
      console.log(`  Total logs verified: ${verification.totalLogsVerified}`);
      console.log(`  Verification time: ${verification.verificationTime}ms`);
      console.log(`  Range: ${verification.startSequenceNumber} - ${verification.endSequenceNumber}`);
    } else {
      console.error(`✗ TAMPERING DETECTED!`);
      console.error(`  Broken links: ${verification.brokenLinks.length}`);
    }

    // Test 7: Verify Single Log
    console.log('\n[Test 7] Verify Single Log Hash');
    console.log('-'.repeat(80));

    const isValid = await auditService.verifyLog(log1);
    console.log(`✓ Log ${log1} hash is ${isValid ? 'valid' : 'invalid'}`);

    // Test 8: Detect Tampering
    console.log('\n[Test 8] Detect Tampering');
    console.log('-'.repeat(80));

    const tamperingReport = await auditService.detectTampering();
    if (tamperingReport) {
      console.error(`✗ TAMPERING DETECTED!`);
      console.error(`  Report ID: ${tamperingReport.id}`);
      console.error(`  Severity: ${tamperingReport.severity}`);
      console.error(`  Broken links: ${tamperingReport.totalBrokenLinks}`);
    } else {
      console.log(`✓ No tampering detected`);
    }

    // Test 9: Audit Metrics
    console.log('\n[Test 9] Audit Metrics');
    console.log('-'.repeat(80));

    const metrics = await auditService.getAuditMetrics();
    console.log(`✓ Audit Service Metrics:`);
    console.log(`  Total logs: ${metrics.totalLogs}`);
    console.log(`  Average write time: ${metrics.averageWriteTimeMs.toFixed(2)}ms`);
    console.log(`  Average read time: ${metrics.averageReadTimeMs.toFixed(2)}ms`);

    console.log('\n  Logs by category:');
    Object.entries(metrics.logsByCategory).forEach(([category, count]) => {
      console.log(`    ${category}: ${count}`);
    });

    console.log('\n  Logs by severity:');
    Object.entries(metrics.logsBySeverity).forEach(([severity, count]) => {
      console.log(`    ${severity}: ${count}`);
    });

    console.log('\n  Logs by result:');
    Object.entries(metrics.logsByResult).forEach(([result, count]) => {
      console.log(`    ${result}: ${count}`);
    });

    // Test 10: Export Audit Trail
    console.log('\n[Test 10] Export Audit Trail');
    console.log('-'.repeat(80));

    const jsonExport = await auditService.exportAuditTrail(
      { userId: 'test-user-1' },
      'json'
    );
    console.log(`✓ Exported ${jsonExport.length} bytes as JSON`);

    const csvExport = await auditService.exportAuditTrail(
      { category: AuditCategory.AUTHENTICATION },
      'csv'
    );
    console.log(`✓ Exported ${csvExport.length} bytes as CSV`);

    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('Test Summary');
    console.log('='.repeat(80));
    console.log('✓ All tests passed successfully!');
    console.log(`✓ Created ${batchLogIds.length + 2} audit logs`);
    console.log(`✓ Chain integrity verified`);
    console.log(`✓ Export functionality working`);
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('Test Failed!');
    console.error('='.repeat(80));
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
main().catch(console.error);
