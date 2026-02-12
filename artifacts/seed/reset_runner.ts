import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    console.log('Loading .env from', envPath);
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match && !line.trim().startsWith('#')) {
            const key = match[1];
            let value = match[2] || '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

// Initial Configuration
const DB_CONFIG = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.VITE_DB_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.VITE_DB_PORT || process.env.DB_PORT || '5432'),
        database: process.env.VITE_DB_NAME || process.env.DB_NAME || 'fleet_db',
        user: process.env.VITE_DB_USER || process.env.DB_USER || 'andrewmorton',
        password: process.env.VITE_DB_PASSWORD || process.env.DB_PASSWORD || 'postgres',
    };

async function reset() {
    console.log('🧹 Starting database reset...');
    console.log(`Connecting to ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database} as ${DB_CONFIG.user}`);

    const pool = new Pool(DB_CONFIG);

    try {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Order matters due to foreign keys
            const tablesToTruncate = [
                'fuel_transactions',
                'maintenance_schedules',
                'work_orders',
                'incidents', // or damage_reports based on schema
                'vehicles',
                // 'drivers', // Drivers might be linked to users
                // 'users', // Be careful with users if we want to keep admin
                // 'tenants' // Be careful with tenants
            ];

            // For now, let's just specific tables we seeded in seed_runner.ts
            // But a full reset should clear everything.
            // Using CASCADE to handle FKs

            console.log('Truncating tables...');
            await client.query(`
                TRUNCATE TABLE 
                    vehicles, 
                    drivers, 
                    fuel_transactions, 
                    maintenance_schedules 
                CASCADE;
            `);

            // Note: We are preserving tenants and users for now to avoid locking ourselves out,
            // or we could re-seed them immediately.
            // The Seed Runner handles idempotency, so we COULD truncate everything.

            await client.query('COMMIT');
            console.log('✅ Database reset complete.');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Reset failed, rolled back.', err);
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

reset();
