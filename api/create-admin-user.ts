import pool from './src/config/database.js'
import { FIPSCryptoService } from './src/services/fips-crypto.service.js'

async function createAdminUser() {
  try {
    console.log('Starting admin user creation...\n')

    // 1. Create refresh_tokens table if it doesn't exist
    console.log('Creating refresh_tokens table if needed...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_refresh_tokens_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `)
    console.log('✅ refresh_tokens table ready\n')

    // 2. Get the default tenant
    const tenantResult = await pool.query('SELECT id, name FROM tenants LIMIT 1')
    if (tenantResult.rows.length === 0) {
      console.error('❌ No tenant found! Cannot create user without a tenant.')
      process.exit(1)
    }

    const tenant = tenantResult.rows[0]
    console.log(`Using tenant: ${tenant.name} (${tenant.id})\n`)

    // 3. Check if admin user already exists
    const existingAdmin = await pool.query(
      "SELECT id, email FROM users WHERE email = 'admin@fleet.local'"
    )

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists:')
      console.log(`   Email: ${existingAdmin.rows[0].email}`)
      console.log(`   ID: ${existingAdmin.rows[0].id}`)
      console.log('\nTo reset password, delete this user first:\n')
      console.log(`   DELETE FROM users WHERE id = '${existingAdmin.rows[0].id}';\n`)
      await pool.end()
      process.exit(0)
    }

    // 4. Create admin user with FIPS-compliant password hash
    const adminPassword = 'Fleet@2026'
    console.log('Creating admin user with password:', adminPassword)
    console.log('Hashing password with FIPS-compliant PBKDF2...')

    const passwordHash = await FIPSCryptoService.hashPassword(adminPassword)

    const userResult = await pool.query(`
      INSERT INTO users (
        tenant_id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        phone
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, role, is_active, created_at
    `, [
      tenant.id,
      'admin@fleet.local',
      passwordHash,
      'Fleet',
      'Administrator',
      'SuperAdmin',
      true,
      null
    ])

    const user = userResult.rows[0]

    console.log('\n✅ Admin user created successfully!\n')
    console.log('='.repeat(60))
    console.log('LOGIN CREDENTIALS:')
    console.log('='.repeat(60))
    console.log(`Email:    admin@fleet.local`)
    console.log(`Password: Fleet@2026`)
    console.log('='.repeat(60))
    console.log('\nUser Details:')
    console.log(`  ID:         ${user.id}`)
    console.log(`  Email:      ${user.email}`)
    console.log(`  Name:       ${user.first_name} ${user.last_name}`)
    console.log(`  Role:       ${user.role}`)
    console.log(`  Active:     ${user.is_active}`)
    console.log(`  Created:    ${user.created_at}`)
    console.log('\nYou can now login at: https://fleet.capitaltechalliance.com\n')

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('\n❌ Error creating admin user:', errorMessage)
    if (errorStack) {
      console.error('Stack:', errorStack)
    }
    process.exit(1)
  } finally {
    await pool.end()
  }
}

createAdminUser()
