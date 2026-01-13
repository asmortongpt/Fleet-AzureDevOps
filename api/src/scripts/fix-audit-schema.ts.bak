
import fs from 'fs';
import path from 'path';

import pool from '../config/database';
import { FIPSCryptoService } from '../services/fips-crypto.service';

async function fixAuditSchema() {
    try {
        console.log('🔄 Starting Audit Schema Fix...');

        // 1. Read and Execute Migration SQL for Audit Tables
        const migrationPath = path.join(process.cwd(), 'src/migrations/create_audit_tables.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📜 Executing create_audit_tables.sql...');
        await pool.query(sql);
        console.log('✅ Audit tables recreated successfully.');

        // 2. Create Refresh Tokens Table (Missing in migrations)
        console.log('📜 Creating refresh_tokens table...');
        await pool.query(`
      DROP TABLE IF EXISTS refresh_tokens CASCADE;
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        revoked_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_tenant ON refresh_tokens(user_id, tenant_id);
      CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
    `);
        console.log('✅ Created refresh_tokens table.');

        // 3. Fix Admin Password
        console.log('🔐 Fixing admin password hash...');
        const email = 'admin@fleet.local';
        const password = 'Fleet@2026';

        // Hash password using FIPS service
        const passwordHash = await FIPSCryptoService.hashPassword(password);

        // Update user - assume account_locked columns don't exist yet
        const result = await pool.query(
            `UPDATE users 
       SET password_hash = $1
       WHERE email = $2
       RETURNING id`,
            [passwordHash, email]
        );

        if (result.rowCount === 0) {
            console.warn(`⚠️ User ${email} not found. Creating it...`);
            // If user missing, create it (simplified)
            const tenantResult = await pool.query('SELECT id FROM tenants LIMIT 1');
            const tenantId = tenantResult.rows[0]?.id;

            if (tenantId) {
                await pool.query(
                    `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active)
             VALUES ($1, $2, $3, 'Admin', 'User', 'admin', true)`,
                    [tenantId, email, passwordHash]
                );
                console.log(`✅ Created user ${email}`);
            } else {
                console.error('❌ No tenants found, cannot create user.');
            }
        } else {
            console.log(`✅ Updated password for ${email}`);
        }

        console.log('🎉 Fix completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        process.exit(1);
    }
}

fixAuditSchema();
