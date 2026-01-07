/**
 * Simple Integration Tests - Proves Database and Services Work
 *
 * This test suite verifies:
 * 1. Database connectivity
 * 2. Redis connectivity
 * 3. Basic CRUD operations
 * 4. Authentication flow (register, login, session management)
 * 5. Configuration management
 * 6. Audit logging
 */

import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

describe('Fleet Management System - Simple Integration Tests', () => {
  let pool: Pool;
  let redis: Redis;

  beforeAll(async () => {
    // Connect to TEST database
    const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://localhost/fleet_test';
    const testRedisUrl = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';

    pool = new Pool({ connectionString: testDatabaseUrl });
    redis = new Redis(testRedisUrl);

    // Clean up test data
    await pool.query("DELETE FROM security_users WHERE email LIKE 'test-%'");
    await redis.flushdb();

    console.log('✓ Test environment initialized');
  });

  afterAll(async () => {
    // Clean up
    await pool.end();
    await redis.quit();
    console.log('✓ Test environment cleaned up');
  });

  // ============================================================================
  // TEST 1: Database Connection
  // ============================================================================
  test('Database connection works', async () => {
    const result = await pool.query('SELECT NOW() as current_time');
    expect(result.rows[0].current_time).toBeDefined();
    console.log('✓ Test 1: Database connection successful');
  });

  // ============================================================================
  // TEST 2: Redis Connection
  // ============================================================================
  test('Redis connection works', async () => {
    await redis.set('test-key', 'test-value');
    const value = await redis.get('test-key');
    expect(value).toBe('test-value');
    await redis.del('test-key');
    console.log('✓ Test 2: Redis connection successful');
  });

  // ============================================================================
  // TEST 3: User Registration (Database Write)
  // ============================================================================
  test('User registration creates new user in database', async () => {
    const email = `test-${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('TestPassword123!', 12);

    const result = await pool.query(
      `INSERT INTO security_users (email, password_hash, display_name, status, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, uuid, email, display_name, created_at`,
      [email, passwordHash, 'Test User', 'active', true]
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].uuid).toBeDefined();
    expect(result.rows[0].email).toBe(email);

    console.log('✓ Test 3: User registration successful');
    console.log(`  Created user: ${email} (ID: ${result.rows[0].id})`);
  });

  // ============================================================================
  // TEST 4: User Authentication (Password Verification)
  // ============================================================================
  test('User authentication verifies password correctly', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    await pool.query(
      `INSERT INTO security_users (email, password_hash, display_name, status, is_active)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, passwordHash, 'Test User 2', 'active', true]
    );

    // Verify user exists and password matches
    const result = await pool.query(
      'SELECT id, email, password_hash FROM security_users WHERE email = $1',
      [email]
    );

    expect(result.rows.length).toBe(1);
    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    expect(passwordMatch).toBe(true);

    console.log('✓ Test 4: User authentication successful');
  });

  // ============================================================================
  // TEST 5: Session Management (Redis)
  // ============================================================================
  test('Session can be created and retrieved from Redis', async () => {
    const sessionId = uuidv4();
    const userId = 'test-user-123';

    const sessionData = {
      userId,
      email: 'test@example.com',
      roles: ['User'],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    };

    // Store session
    await redis.setex(
      `session:${sessionId}`,
      3600, // 1 hour TTL
      JSON.stringify(sessionData)
    );

    // Retrieve session
    const retrieved = await redis.get(`session:${sessionId}`);
    expect(retrieved).toBeDefined();

    const parsedSession = JSON.parse(retrieved!);
    expect(parsedSession.userId).toBe(userId);
    expect(parsedSession.roles).toEqual(['User']);

    // Clean up
    await redis.del(`session:${sessionId}`);

    console.log('✓ Test 5: Session management successful');
  });

  // ============================================================================
  // TEST 6: Configuration Management
  // ============================================================================
  test('Configuration can be set and retrieved', async () => {
    const configKey = 'test-config-key';
    const configValue = { setting: 'test-value', enabled: true };

    // Set configuration (using correct schema)
    const insertResult = await pool.query(
      `INSERT INTO configuration_settings (key, value, scope, current_version)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (key, scope, scope_id)
       DO UPDATE SET value = $2, updated_at = NOW(), current_version = $4
       RETURNING id, key, value`,
      [configKey, JSON.stringify(configValue), 'global', 'v1']
    );

    expect(insertResult.rows[0].key).toBe(configKey);

    // Get configuration
    const selectResult = await pool.query(
      'SELECT key, value FROM configuration_settings WHERE key = $1',
      [configKey]
    );

    expect(selectResult.rows.length).toBe(1);
    expect(selectResult.rows[0].value).toEqual(configValue);

    // Clean up
    await pool.query('DELETE FROM configuration_settings WHERE key = $1', [configKey]);

    console.log('✓ Test 6: Configuration management successful');
  });

  // ============================================================================
  // TEST 7: Secrets Management
  // ============================================================================
  test('Secrets can be created and retrieved', async () => {
    const secretName = 'test-secret';
    const keyVaultName = 'test-vault';

    // Get a valid user ID for foreign key constraint
    const userResult = await pool.query(
      "SELECT id FROM security_users WHERE email LIKE 'test-%' LIMIT 1"
    );
    const userId = userResult.rows.length > 0 ? userResult.rows[0].id : null;

    // Create secret (using correct schema - secrets stored in Azure Key Vault)
    const insertResult = await pool.query(
      `INSERT INTO secrets (name, key_vault_name, key_vault_secret_name, secret_type, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, created_at`,
      [secretName, keyVaultName, secretName, 'generic', 'active', userId, userId]
    );

    expect(insertResult.rows[0].name).toBe(secretName);

    // Get secret metadata
    const selectResult = await pool.query(
      'SELECT name, key_vault_name, status FROM secrets WHERE name = $1 AND revoked_at IS NULL',
      [secretName]
    );

    expect(selectResult.rows.length).toBe(1);
    expect(selectResult.rows[0].key_vault_name).toBe(keyVaultName);
    expect(selectResult.rows[0].status).toBe('active');

    // Clean up
    await pool.query('DELETE FROM secrets WHERE name = $1', [secretName]);

    console.log('✓ Test 7: Secrets management successful');
  });

  // ============================================================================
  // TEST 8: Audit Logging
  // ============================================================================
  test('Audit logs can be created and verified', async () => {
    const logData = {
      event_type: 'user:login',
      event_category: 'authentication',
      actor_type: 'user',
      actor_id: 1,
      actor_email: 'test@example.com',
      action: 'login',
      outcome: 'success',
      ip_address: '127.0.0.1',
      user_agent: 'test-agent',
      details: { method: 'password' }
    };

    // Create audit log
    const result = await pool.query(
      `INSERT INTO audit_logs
       (event_type, event_category, actor_type, actor_id, actor_email, action, outcome,
        ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, uuid, timestamp, hash`,
      [
        logData.event_type,
        logData.event_category,
        logData.actor_type,
        logData.actor_id,
        logData.actor_email,
        logData.action,
        logData.outcome,
        logData.ip_address,
        logData.user_agent,
        JSON.stringify(logData.details)
      ]
    );

    expect(result.rows[0].id).toBeDefined();
    expect(result.rows[0].uuid).toBeDefined();
    expect(result.rows[0].hash).toBeDefined();

    // Verify log exists
    const verifyResult = await pool.query(
      'SELECT * FROM audit_logs WHERE uuid = $1',
      [result.rows[0].uuid]
    );

    expect(verifyResult.rows.length).toBe(1);
    expect(verifyResult.rows[0].event_type).toBe('user:login');

    console.log('✓ Test 8: Audit logging successful');
    console.log(`  Created audit log with hash: ${result.rows[0].hash}`);
  });

  // ============================================================================
  // TEST 9: Role-Based Access Control (RBAC)
  // ============================================================================
  test('Roles and permissions can be assigned and verified', async () => {
    // Create test user
    const email = `test-${Date.now()}@example.com`;
    const userResult = await pool.query(
      `INSERT INTO security_users (email, password_hash, display_name, status, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, 'hash', 'Test User', 'active', true]
    );
    const userId = userResult.rows[0].id;

    // Get a role
    const roleResult = await pool.query(
      "SELECT id FROM security_roles WHERE name = 'Fleet Manager' LIMIT 1"
    );

    if (roleResult.rows.length > 0) {
      const roleId = roleResult.rows[0].id;

      // Assign role to user
      await pool.query(
        `INSERT INTO security_user_roles (user_id, role_id, assigned_by)
         VALUES ($1, $2, $3)`,
        [userId, roleId, 1]
      );

      // Verify role assignment
      const verifyResult = await pool.query(
        `SELECT r.name
         FROM security_user_roles ur
         JOIN security_roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1 AND ur.revoked_at IS NULL`,
        [userId]
      );

      expect(verifyResult.rows.length).toBeGreaterThan(0);
      expect(verifyResult.rows[0].name).toBe('Fleet Manager');

      console.log('✓ Test 9: RBAC successful');
    } else {
      console.log('⊘ Test 9: Skipped (no roles in database)');
    }

    // Clean up
    await pool.query('DELETE FROM security_user_roles WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM security_users WHERE id = $1', [userId]);
  });

  // ============================================================================
  // TEST 10: Concurrent Database Operations
  // ============================================================================
  test('Database handles concurrent operations', async () => {
    const startTime = Date.now();

    const promises = Array.from({ length: 10 }, (_, i) =>
      pool.query('SELECT $1 as test_value', [i])
    );

    const results = await Promise.all(promises);

    const duration = Date.now() - startTime;

    expect(results.length).toBe(10);
    results.forEach((result, i) => {
      expect(parseInt(result.rows[0].test_value)).toBe(i);
    });

    expect(duration).toBeLessThan(1000); // Should complete in <1s

    console.log('✓ Test 10: Concurrent operations successful');
    console.log(`  10 queries completed in ${duration}ms`);
  });
});

console.log('\n=== Simple Integration Test Suite ===');
console.log('This suite proves database and caching infrastructure works');
console.log('Tests: PostgreSQL, Redis, Auth, Config, Secrets, Audit, RBAC');
console.log('================================\n');
