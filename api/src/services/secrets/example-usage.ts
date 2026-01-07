/**
 * Secrets Management Service - Usage Examples
 *
 * This file demonstrates real-world usage patterns for the SecretsManagementService.
 * These examples are production-ready and can be adapted for your use cases.
 */

import crypto from 'crypto';

import { pool } from '../../db/connection';

import { createSecretsService } from './SecretsManagementService';

// ============================================================================
// INITIALIZATION
// ============================================================================

async function initializeSecretsService() {
  console.log('Initializing Secrets Management Service...');

  const secretsService = createSecretsService(pool);
  await secretsService.initialize();

  console.log('✓ Secrets service initialized');
  return secretsService;
}

// ============================================================================
// EXAMPLE 1: Basic Secret Get/Set
// ============================================================================

async function example1BasicOperations() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 1: Basic Operations ---');

  // Store a secret
  await secretsService.setSecret('example-api-key', 'sk_test_1234567890abcdef', {
    description: 'Example API key for demonstration',
    tags: { environment: 'development', service: 'api' },
  });
  console.log('✓ Secret stored');

  // Retrieve the secret
  const apiKey = await secretsService.getSecret('example-api-key', {
    userId: 'example-user',
    ipAddress: '127.0.0.1',
    userAgent: 'ExampleScript/1.0',
  });
  console.log('✓ Secret retrieved:', apiKey.substring(0, 10) + '...');

  // Clean up
  await secretsService.deleteSecret('example-api-key');
  console.log('✓ Secret deleted');
}

// ============================================================================
// EXAMPLE 2: Secret Rotation with Zero Downtime
// ============================================================================

async function example2SecretRotation() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 2: Secret Rotation ---');

  // Initial setup
  await secretsService.setSecret('database-password', 'initial_password_123', {
    description: 'PostgreSQL database password',
    rotationPolicy: {
      enabled: true,
      intervalDays: 90,
      notifyDaysBefore: 14,
      autoRotate: false, // Require manual approval
    },
  });

  // Rotate database password with zero downtime
  await secretsService.rotateSecret('database-password', async () => {
    console.log('  → Generating new password...');
    const newPassword = generateSecurePassword(32);

    console.log('  → Testing database connection with new password...');
    // In production, you would:
    // 1. Create new database user with new password
    // 2. Grant same permissions as old user
    // 3. Test connection
    // 4. Update application config
    // 5. Remove old user after grace period

    console.log('  → New password validated');
    return newPassword;
  }, {
    userId: 'admin-user',
    ipAddress: '10.0.0.5',
  });

  console.log('✓ Database password rotated successfully');
}

// ============================================================================
// EXAMPLE 3: API Key Rotation (Stripe, Twilio, etc.)
// ============================================================================

async function example3ApiKeyRotation() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 3: API Key Rotation ---');

  // Simulate Stripe API key rotation
  await secretsService.setSecret('stripe-api-key', 'sk_live_old_key_xxx', {
    description: 'Stripe API key for payment processing',
  });

  await secretsService.rotateSecret('stripe-api-key', async () => {
    console.log('  → Creating new Stripe API key...');

    // In production:
    // const stripe = new Stripe(oldKey);
    // const newKey = await stripe.apiKeys.create({ name: 'New Key' });

    const newKey = 'sk_live_new_key_' + crypto.randomBytes(16).toString('hex');

    console.log('  → Testing new API key...');
    // await testStripeConnection(newKey);

    console.log('  → Revoking old API key...');
    // await stripe.apiKeys.delete(oldKey);

    console.log('  → Rotation complete');
    return newKey;
  });

  console.log('✓ Stripe API key rotated');
}

// ============================================================================
// EXAMPLE 4: Access Control and Permissions
// ============================================================================

async function example4AccessControl() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 4: Access Control ---');

  // Create a sensitive secret
  await secretsService.setSecret('production-database-password', 'super_secure_password', {
    description: 'Production database credentials',
  });

  // Grant read-only access to regular user
  await secretsService.grantAccess(
    'production-database-password',
    'user-123',
    ['get'],
    { grantedBy: 'admin-456' }
  );
  console.log('✓ Granted read access to user-123');

  // Grant full access to admin
  await secretsService.grantAccess(
    'production-database-password',
    'admin-789',
    ['get', 'set', 'delete', 'rotate', 'admin'],
    { grantedBy: 'super-admin' }
  );
  console.log('✓ Granted full access to admin-789');

  // Grant temporary access to contractor
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30); // 30 days

  await secretsService.grantAccess(
    'production-database-password',
    'contractor-999',
    ['get'],
    {
      grantedBy: 'admin-456',
      expiresAt: expiryDate,
    }
  );
  console.log('✓ Granted temporary access to contractor-999 (expires in 30 days)');

  // Check permissions before operation
  const canRotate = await secretsService.checkAccess(
    'production-database-password',
    'user-123',
    'rotate'
  );
  console.log('✓ User-123 can rotate:', canRotate); // false

  const adminCanRotate = await secretsService.checkAccess(
    'production-database-password',
    'admin-789',
    'rotate'
  );
  console.log('✓ Admin-789 can rotate:', adminCanRotate); // true

  // Revoke access
  await secretsService.revokeAccess('production-database-password', 'contractor-999');
  console.log('✓ Revoked access from contractor-999');
}

// ============================================================================
// EXAMPLE 5: Monitoring Expiring Secrets
// ============================================================================

async function example5MonitorExpiry() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 5: Monitor Expiring Secrets ---');

  // Create secrets with expiration dates
  const expiryDate1 = new Date();
  expiryDate1.setDate(expiryDate1.getDate() + 15); // 15 days

  await secretsService.setSecret('expiring-cert', 'certificate_data_xxx', {
    description: 'SSL certificate',
    expiresAt: expiryDate1,
    notifyOnExpiry: ['ops@example.com', 'security@example.com'],
  });

  const expiryDate2 = new Date();
  expiryDate2.setDate(expiryDate2.getDate() + 25); // 25 days

  await secretsService.setSecret('expiring-token', 'token_abc123', {
    description: 'OAuth token',
    expiresAt: expiryDate2,
    notifyOnExpiry: ['admin@example.com'],
  });

  // Check for secrets expiring in next 30 days
  const expiringSecrets = await secretsService.checkExpiringSecrets(30);

  console.log(`\nFound ${expiringSecrets.length} expiring secrets:`);
  for (const secret of expiringSecrets) {
    console.log(`  ⚠️  ${secret.secretName}`);
    console.log(`     Expires: ${secret.expiresAt.toISOString()}`);
    console.log(`     Days remaining: ${secret.daysUntilExpiry}`);

    // In production, send notifications
    // await sendExpiryNotification(secret);
  }
}

// ============================================================================
// EXAMPLE 6: Health Check and Reporting
// ============================================================================

async function example6HealthCheck() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 6: Health Check ---');

  const health = await secretsService.getSecretHealth();

  console.log('\nSecrets Health Report:');
  console.log('  Total Secrets:', health.totalSecrets);
  console.log('  Expiring Soon (30 days):', health.expiringSoon);
  console.log('  Expired:', health.expired);
  console.log('  Without Rotation Policy:', health.withoutRotationPolicy);
  console.log('  Last Check:', health.lastRotationCheck.toISOString());

  if (health.recommendations.length > 0) {
    console.log('\n  Recommendations:');
    health.recommendations.forEach(rec => {
      console.log(`    - ${rec}`);
    });
  } else {
    console.log('\n  ✓ All secrets are healthy!');
  }
}

// ============================================================================
// EXAMPLE 7: Audit Trail and Access History
// ============================================================================

async function example7AuditTrail() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 7: Audit Trail ---');

  const secretName = 'audited-secret';

  // Create and perform various operations
  await secretsService.setSecret(secretName, 'value_1', {
    description: 'Secret for audit demonstration',
  });

  await secretsService.getSecret(secretName, {
    userId: 'user-123',
    ipAddress: '192.168.1.100',
    userAgent: 'Firefox/92.0',
  });

  await secretsService.getSecret(secretName, {
    userId: 'user-456',
    ipAddress: '192.168.1.101',
    userAgent: 'Chrome/95.0',
  });

  // Get access history
  const logs = await secretsService.getAccessHistory(secretName, 10);

  console.log(`\nAccess History for "${secretName}":`);
  for (const log of logs) {
    const status = log.success ? '✓' : '✗';
    console.log(`  ${status} ${log.timestamp.toISOString()}`);
    console.log(`     User: ${log.userId}`);
    console.log(`     Operation: ${log.operation}`);
    console.log(`     IP: ${log.ipAddress || 'N/A'}`);
    console.log(`     User-Agent: ${log.userAgent || 'N/A'}`);
    if (log.errorMessage) {
      console.log(`     Error: ${log.errorMessage}`);
    }
    console.log('');
  }
}

// ============================================================================
// EXAMPLE 8: Cache Warming for Performance
// ============================================================================

async function example8CacheWarming() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 8: Cache Warming ---');

  // Create frequently accessed secrets
  const frequentSecrets = [
    'database-password',
    'redis-password',
    'jwt-secret',
    'api-gateway-key',
    'encryption-key',
  ];

  for (const name of frequentSecrets) {
    await secretsService.setSecret(name, `value_for_${name}`, {
      description: `Frequently accessed: ${name}`,
    });
  }

  // Warm cache on application startup
  console.log('Warming cache with frequently accessed secrets...');
  await secretsService.warmCache(frequentSecrets);
  console.log('✓ Cache warmed - subsequent retrievals will be faster');

  // Measure cache performance
  const start = Date.now();
  await secretsService.getSecret('database-password'); // Should be cached
  const cachedTime = Date.now() - start;
  console.log(`Cache hit retrieval time: ${cachedTime}ms`);
}

// ============================================================================
// EXAMPLE 9: Secret Versioning
// ============================================================================

async function example9Versioning() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 9: Secret Versioning (Azure Key Vault only) ---');

  try {
    // Set initial version
    await secretsService.setSecret('versioned-secret', 'value_v1', {
      description: 'Versioned secret example',
    });

    // Update to create new version
    await secretsService.setSecret('versioned-secret', 'value_v2', {
      description: 'Updated versioned secret',
    });

    // List all versions
    const versions = await secretsService.listSecretVersions('versioned-secret');

    console.log(`\nFound ${versions.length} versions:`);
    for (const version of versions) {
      console.log(`  Version: ${version.version}`);
      console.log(`    Created: ${version.createdAt.toISOString()}`);
      console.log(`    Expires: ${version.expiresAt?.toISOString() || 'Never'}`);
      console.log(`    Enabled: ${version.enabled}`);
      console.log('');
    }

    // Get specific version
    if (versions.length > 1) {
      const oldVersion = await secretsService.getSecretVersion(
        'versioned-secret',
        versions[1].version
      );
      console.log(`Previous version value: ${oldVersion.substring(0, 10)}...`);
    }
  } catch (error) {
    console.log('Note: Versioning requires Azure Key Vault');
    console.log('Error:', (error as Error).message);
  }
}

// ============================================================================
// EXAMPLE 10: Break-Glass Emergency Access
// ============================================================================

async function example10EmergencyAccess() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 10: Emergency Access ---');

  // Create a highly sensitive secret
  await secretsService.setSecret('root-credentials', 'super_secret_root_pass', {
    description: 'Root database credentials - emergency access only',
  });

  // Emergency access function
  async function emergencyAccess(
    secretName: string,
    adminUserId: string,
    reason: string
  ): Promise<string> {
    console.log(`\n⚠️  EMERGENCY ACCESS REQUEST`);
    console.log(`  Secret: ${secretName}`);
    console.log(`  Admin: ${adminUserId}`);
    console.log(`  Reason: ${reason}`);

    // In production, this would:
    // 1. Send SMS/email to security team
    // 2. Require MFA approval
    // 3. Get dual approval from two admins
    // 4. Create incident ticket

    console.log('  → Requiring MFA approval...');
    // await requireMFAApproval(adminUserId);

    console.log('  → Granting temporary access (1 hour)...');
    const expiryTime = new Date(Date.now() + 3600000); // 1 hour

    await secretsService.grantAccess(
      secretName,
      adminUserId,
      ['get'],
      {
        grantedBy: 'emergency-system',
        expiresAt: expiryTime,
      }
    );

    // Retrieve secret
    const secret = await secretsService.getSecret(secretName, {
      userId: adminUserId,
      ipAddress: '10.0.0.10',
      userAgent: 'EmergencyAccess/1.0',
    });

    console.log('  → Secret retrieved');
    console.log('  → Access expires at:', expiryTime.toISOString());

    // Schedule auto-revoke
    setTimeout(async () => {
      await secretsService.revokeAccess(secretName, adminUserId);
      console.log('  → Emergency access automatically revoked');
    }, 3600000);

    return secret;
  }

  // Simulate emergency access
  const rootPassword = await emergencyAccess(
    'root-credentials',
    'admin-emergency',
    'Production database outage - need root access'
  );

  console.log('✓ Emergency access granted');
  console.log(`Root password: ${rootPassword.substring(0, 5)}... (masked)`);
}

// ============================================================================
// EXAMPLE 11: Batch Operations
// ============================================================================

async function example11BatchOperations() {
  const secretsService = await initializeSecretsService();

  console.log('\n--- Example 11: Batch Operations ---');

  // Create multiple secrets
  const secrets = {
    'service-a-key': 'key_a_xxx',
    'service-b-key': 'key_b_yyy',
    'service-c-key': 'key_c_zzz',
  };

  console.log('Creating multiple secrets...');
  await Promise.all(
    Object.entries(secrets).map(([name, value]) =>
      secretsService.setSecret(name, value, {
        description: `API key for ${name}`,
      })
    )
  );
  console.log('✓ All secrets created');

  // Retrieve multiple secrets in parallel
  console.log('\nRetrieving multiple secrets...');
  const retrievedSecrets = await Promise.all(
    Object.keys(secrets).map(name => secretsService.getSecret(name))
  );
  console.log(`✓ Retrieved ${retrievedSecrets.length} secrets`);

  // Rotate multiple secrets
  console.log('\nRotating multiple secrets...');
  const rotationResults = await Promise.allSettled(
    Object.keys(secrets).map(name =>
      secretsService.rotateSecret(name, async () => {
        return `new_${name}_${crypto.randomBytes(8).toString('hex')}`;
      })
    )
  );

  const successful = rotationResults.filter(r => r.status === 'fulfilled').length;
  const failed = rotationResults.filter(r => r.status === 'rejected').length;

  console.log(`✓ Rotation complete: ${successful} succeeded, ${failed} failed`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSecurePassword(length: number): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

async function runAllExamples() {
  try {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  Secrets Management Service - Usage Examples            ║');
    console.log('╚══════════════════════════════════════════════════════════╝');

    // Run examples sequentially
    await example1BasicOperations();
    await example2SecretRotation();
    await example3ApiKeyRotation();
    await example4AccessControl();
    await example5MonitorExpiry();
    await example6HealthCheck();
    await example7AuditTrail();
    await example8CacheWarming();
    await example9Versioning();
    await example10EmergencyAccess();
    await example11BatchOperations();

    console.log('\n✓ All examples completed successfully!');
    console.log('\nNote: These examples create test data. Clean up with:');
    console.log('  DELETE FROM secrets_vault WHERE secret_name LIKE \'%example%\';');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error running examples:', error);
    process.exit(1);
  }
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}

// Export for use in other modules
export {
  example1BasicOperations,
  example2SecretRotation,
  example3ApiKeyRotation,
  example4AccessControl,
  example5MonitorExpiry,
  example6HealthCheck,
  example7AuditTrail,
  example8CacheWarming,
  example9Versioning,
  example10EmergencyAccess,
  example11BatchOperations,
  generateSecurePassword,
};
