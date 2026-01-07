
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded from parent directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function main() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT),
    });

    try {
        await client.connect();
        console.log('Connected to database');

        const tenantRes = await client.query('SELECT id FROM tenants LIMIT 1');
        if (tenantRes.rows.length === 0) {
            console.error("No tenant found! Please seed database first.");
            process.exit(1);
        }
        const tenantId = tenantRes.rows[0].id;

        const passwordHash = await bcrypt.hash('Fleet@2026', 12);
        const email = 'admin@fleet.local';

        const userRes = await client.query('SELECT id FROM users WHERE email = $1', [email]);

        if (userRes.rows.length > 0) {
            await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);
            console.log("✅ Updated admin user: " + email);
        } else {
            // Check required columns if any. 'phone' might be one.
            await client.query(`
                INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active, phone)
                VALUES ($1, $2, $3, 'Admin', 'User', 'SuperAdmin', true, '555-555-5555')
            `, [tenantId, email, passwordHash]);
            console.log("✅ Created admin user: " + email);
        }
    } catch (e) {
        console.error("Error creating user:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
